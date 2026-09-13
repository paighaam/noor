#!/usr/bin/env node
/**
 * Secret and real-PII scanner for the Store repository.
 *
 * The CI job used to be NAMED "Secret and PII scan" while only matching four
 * secret patterns — it scanned no PII at all. Either the claim or the
 * implementation had to change; this is the implementation.
 *
 * Two rule families:
 *
 * - SECRETS: high-signal credential shapes only. A generic "long random string"
 *   rule drowns in lockfile hashes and gets switched off, which is worse than
 *   not having it.
 * - PII: real personal data that must never enter this repository — Indian
 *   mobile numbers, Aadhaar, PAN, IFSC, payment card numbers (Luhn-checked), and
 *   personal email addresses.
 *
 * The synthetic-fixture allowlist is applied to the MATCHED TEXT, never to the
 * file or the rule. Excluding `packages/test-kit/**` wholesale would let a real
 * phone number in a fixture through; instead a match is forgiven only when the
 * value itself is a documented reserved one (`+1555…`, the all-zero UUID
 * namespace, `example`/`invalid`/`test` domains). Real PII in a fixture file is
 * still a finding.
 *
 * Usage:
 *   node tools/scan-secrets-and-pii.mjs --diff <base-ref>   # scan a diff range
 *   node tools/scan-secrets-and-pii.mjs --files a.ts b.ts   # scan files
 *   node tools/scan-secrets-and-pii.mjs --selftest          # prove the gate bites
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Paths whose content is generated and dominated by hashes. */
const EXCLUDED_PATHS = [
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
    'appwrite-parity-map.json',
];

/**
 * Values that are documented synthetic reserved data. Applied to the matched
 * text only — see the module comment for why this is not a path exclusion.
 */
const RESERVED_VALUE_PATTERNS = [
    // Reserved-for-fiction NANP range, used by contact fixtures.
    /^\+?1?5550\d{2,3}$/,
    /^\+?1?555-?01\d{2}$/,
    // The reserved all-zero v4 UUID namespace.
    /^00000000-0000-4000-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    // RFC 2606 / RFC 6761 reserved domains, plus the repo's own fixture domain.
    /@(?:[a-z0-9-]+\.)*(?:example\.(?:com|org|net)|invalid|test|localhost)$/i,
    // The published business support address in the storefront footer. A
    // company's own public contact is not personal data.
    /^contact@paigham\.app$/i,
];

/** @typedef {{ id: string, family: 'secret' | 'pii', pattern: RegExp, why: string, validate?: (m: string) => boolean }} Rule */

/** @type {Rule[]} */
const RULES = [
    // --- Secrets -----------------------------------------------------------
    {
        id: 'aws-access-key-id',
        family: 'secret',
        pattern: /\bAKIA[0-9A-Z]{16}\b/g,
        why: 'AWS access key id',
    },
    {
        id: 'private-key-block',
        family: 'secret',
        pattern: /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/g,
        why: 'PEM private key block',
    },
    {
        id: 'service-account-private-key',
        family: 'secret',
        pattern: /"private_key"\s*:\s*"-----BEGIN/g,
        why: 'GCP/Firebase service account private key',
    },
    {
        id: 'openai-style-key',
        family: 'secret',
        pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g,
        why: 'OpenAI-style secret key',
    },
    {
        id: 'github-token',
        family: 'secret',
        pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/g,
        why: 'GitHub access token',
    },
    {
        id: 'github-fine-grained-pat',
        family: 'secret',
        pattern: /\bgithub_pat_[A-Za-z0-9_]{50,}\b/g,
        why: 'GitHub fine-grained PAT',
    },
    {
        id: 'google-api-key',
        family: 'secret',
        pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
        why: 'Google API key',
    },
    {
        id: 'slack-token',
        family: 'secret',
        pattern: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
        why: 'Slack token',
    },
    {
        id: 'razorpay-secret',
        family: 'secret',
        pattern: /\brzp_(?:live|test)_[A-Za-z0-9]{14,}\b/g,
        why: 'Razorpay key id (live or test)',
    },

    // --- Real PII ----------------------------------------------------------
    {
        id: 'indian-mobile',
        family: 'pii',
        // A real Indian mobile starts 6-9. `+91` prefix required, so ordinary
        // 10-digit numbers elsewhere in the codebase are not swept up.
        pattern: /(?<![0-9])\+?91[-\s]?[6-9]\d{9}(?![0-9])/g,
        why: 'Indian mobile number',
    },
    {
        id: 'aadhaar',
        family: 'pii',
        // Aadhaar never begins with 0 or 1. The lookbehind/lookahead exclude
        // base64 and hex neighbours so integrity hashes do not match.
        pattern: /(?<![0-9A-Za-z_+/=-])[2-9]\d{3}[-\s]?\d{4}[-\s]?\d{4}(?![0-9A-Za-z_+/=-])/g,
        why: 'Aadhaar number',
    },
    {
        id: 'pan',
        family: 'pii',
        pattern: /(?<![0-9A-Za-z])[A-Z]{5}\d{4}[A-Z](?![0-9A-Za-z])/g,
        why: 'Indian PAN',
    },
    {
        id: 'ifsc',
        family: 'pii',
        pattern: /(?<![0-9A-Za-z])[A-Z]{4}0[A-Z0-9]{6}(?![0-9A-Za-z])/g,
        why: 'Bank IFSC code',
    },
    {
        id: 'payment-card',
        family: 'pii',
        pattern: /(?<![0-9A-Za-z_+/=-])(?:\d[ -]?){12,18}\d(?![0-9A-Za-z_+/=-])/g,
        why: 'payment card number',
        validate: (match) => luhn(match.replace(/[^0-9]/g, '')),
    },
    {
        id: 'personal-email',
        family: 'pii',
        pattern: /(?<![0-9A-Za-z._%+-])[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
        why: 'email address',
    },
];

function luhn(digits) {
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i -= 1) {
        let d = Number(digits[i]);
        if (double) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        sum += d;
        double = !double;
    }
    return sum % 10 === 0;
}

function isReserved(match) {
    return RESERVED_VALUE_PATTERNS.some((pattern) => pattern.test(match));
}

/**
 * Scan one blob of text.
 * @returns {{ rule: string, family: string, why: string, match: string, line: number }[]}
 */
export function scanText(text, { label = '<text>' } = {}) {
    const findings = [];
    const lines = text.split('\n');

    for (const rule of RULES) {
        lines.forEach((line, index) => {
            for (const found of line.matchAll(rule.pattern)) {
                const match = found[0];
                if (isReserved(match)) continue;
                if (rule.validate && !rule.validate(match)) continue;
                findings.push({
                    rule: rule.id,
                    family: rule.family,
                    why: rule.why,
                    match: redact(match, rule.family),
                    line: index + 1,
                    label,
                });
            }
        });
    }
    return findings;
}

/** Never echo a full secret into CI logs. */
function redact(match, family) {
    if (family === 'secret') {
        return `${match.slice(0, 4)}…${match.length} chars`;
    }
    if (match.length <= 6) return match;
    return `${match.slice(0, 3)}…${match.slice(-2)}`;
}

function diffText(base) {
    const args = ['diff', `${base}...HEAD`, '--unified=0', '--'];
    args.push('.');
    for (const path of EXCLUDED_PATHS) args.push(`:(exclude)${path}`);
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
}

// --- Self-test ---------------------------------------------------------------

/**
 * Positive fixtures: each MUST be flagged, or the gate is decoration.
 *
 * Every literal is assembled from fragments so that no complete matchable string
 * exists anywhere in this file. That is deliberate: the alternative is excluding
 * this path from the scan, and an excluded file is a place a real secret could be
 * pasted and never seen. With the fragments, the scanner scans itself.
 */
const MUST_FLAG = [
    ['aws-access-key-id', `const k = "${'AKIA'}IOSFODNN7EXAMPLE";`],
    ['private-key-block', `${'-----BEGIN'} RSA PRIVATE${' KEY-----'}`],
    [
        'service-account-private-key',
        `{"private${'_key'}": "${'-----BEGIN'} PRIVATE${' KEY-----'}\\n"}`,
    ],
    ['openai-style-key', `OPENAI=${'sk'}-abcdefghijklmnopqrstuvwxyz0123`],
    ['github-token', `token: ${'ghp'}_${'a'.repeat(36)}`],
    ['google-api-key', `key=${'AIza'}${'B'.repeat(35)}`],
    ['slack-token', `SLACK=${'xoxb'}-1234567890-abcdefghij`],
    ['razorpay-secret', `RZP=${'rzp'}_live_ABCDEFGHIJ1234`],
    ['indian-mobile', `phone: "+91${'9876'}${'543210'}"`],
    ['aadhaar', `aadhaar: ${'2345'} ${'6789'} ${'0123'}`],
    ['pan', `pan: ${'ABCDE'}${'1234'}F`],
    ['ifsc', `ifsc: ${'HDFC'}0${'001234'}`],
    // A Luhn-valid test card number is still a card-shaped value.
    ['payment-card', `card: ${'4111'}${'1111'}${'1111'}${'1111'}`],
    ['personal-email', `owner: real.person${'@'}gmail.com`],
];

/** Negative fixtures: documented synthetic values that must NOT be flagged. */
const MUST_NOT_FLAG = [
    'channelValue: "+15550100"',
    "const id = '00000000-0000-4000-8000-000000000006';",
    "origin !== 'https://vendor.fixture.invalid'",
    'contact: user@example.com',
    'support: someone@paigham.test',
    '<a href="mailto:contact@paigham.app">Contact Us</a>',
    'sellingPricePaise: 129900,',
    'issuedAt: "2026-01-01T00:00:00Z",',
    'resolution: 1920 x 1080',
];

function selftest() {
    const failures = [];

    for (const [ruleId, sample] of MUST_FLAG) {
        const findings = scanText(sample, { label: 'fixture' });
        if (!findings.some((f) => f.rule === ruleId)) {
            failures.push(
                `self-test FAILED: rule '${ruleId}' did not flag prohibited input: ${sample.slice(0, 40)}`,
            );
        } else {
            console.log(`  ✓ flagged ${ruleId}`);
        }
    }

    for (const sample of MUST_NOT_FLAG) {
        const findings = scanText(sample, { label: 'fixture' });
        if (findings.length) {
            failures.push(
                `self-test FAILED: synthetic value flagged as ${findings
                    .map((f) => f.rule)
                    .join(', ')}: ${sample}`,
            );
        } else {
            console.log(`  ✓ allowed synthetic: ${sample.slice(0, 44)}`);
        }
    }

    return failures;
}

// --- Entry point -------------------------------------------------------------

function report(findings) {
    for (const finding of findings) {
        console.error(
            `::error::${finding.family.toUpperCase()} — ${finding.why} (${finding.rule}) at ${finding.label}:${finding.line}: ${finding.match}`,
        );
    }
}

const argv = process.argv.slice(2);

if (argv.includes('--selftest')) {
    const failures = selftest();
    if (failures.length) {
        for (const failure of failures) console.error(`::error::${failure}`);
        process.exit(1);
    }
    console.log('Secret and PII scanner self-test passed.');
} else {
    const diffIndex = argv.indexOf('--diff');
    const filesIndex = argv.indexOf('--files');
    let findings = [];

    if (diffIndex !== -1) {
        const base = argv[diffIndex + 1];
        if (!base) {
            console.error('::error::--diff requires a base ref');
            process.exit(2);
        }
        findings = scanText(diffText(base), { label: `diff ${base}...HEAD` });
    } else if (filesIndex !== -1) {
        for (const file of argv.slice(filesIndex + 1)) {
            if (EXCLUDED_PATHS.includes(file)) continue;
            findings.push(...scanText(readFileSync(file, 'utf8'), { label: file }));
        }
    } else {
        console.error('::error::pass --diff <base>, --files <paths…>, or --selftest');
        process.exit(2);
    }

    if (findings.length) {
        report(findings);
        console.error(`\n${findings.length} secret/PII finding(s).`);
        process.exit(1);
    }
    console.log('No secret or PII patterns matched.');
}
