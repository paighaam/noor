# Paigham verification profiles

Select the repository/journey in scope; do not apply every profile to every task. Commands,
versions and environments come from current manifests and repository rules, not this document.
A missing command or test platform is a named prerequisite, not proof of success.

| Repository | Required context and evidence to select |
| --- | --- |
| noor | Read Noor's index and `noor-global.md`; for journeys also read the shared App `ui-ux-product.md`. Verify actual board interactions, themes, responsive layout and shared component/class integrity. Approved Noor changes precede Compose parity; accepted journeys remain closed unless explicitly reopened or reproducibly regressed. |
| paigham-app | Read `paigham.md`, relevant module rules and `testing.md`; UI/auth/onboarding work also requires `ui-ux-product.md`. Verify real Gradle task execution and affected shared/platform behavior. Compilation or metadata tasks are not device, gesture, location, accessibility or visual proof. Preserve cancellation and session/owner boundaries. |
| paigham-core-server | Read `core-server.md` and owning layer rules. Verify real routes/guards/use cases/datasources and serialized contracts. Persistence invariants need isolated real PostgreSQL including races/rollback; distinguish it from Testcontainers and hosted runtime. Preserve applied migrations. |
| paigham-store | Read `paigham-store.md` and the pinned server/OpenAPI contract. Verify generated-client parity, BFF/browser authority separation, tenant/identity binding, ETags, retry/privacy and real UI callers. Frozen dependency installation and shared lockfile changes have explicit ownership. Missing reads/auth/media remain prerequisites, not invented UI authority. |
| paigham-admin | Read Flutter/BLoC repository guidance and pubspec. Select analyzer, widget/service and actual platform interaction tests as appropriate. Do not use the separate Store admin portal's contract as this application's contract. |
| paigham-functions | Read the actual function entry point, runtime/dependency manifest and trigger contract. Test parsing, idempotency, failure/retry behavior and external-service boundaries with isolated fixtures. A local test does not prove deployed triggers or schedules. |
| paigham-infrastructure | Read environment/provider configuration and edge-tooling contracts. Validate configuration and local tests first. Remote plans can require credentials, state access and locks; obtain authorization where needed. No apply, resource mutation, secret access or live rollout follows implicitly from review or validation. |
| paigham-website | Read current package scripts, hosting configuration and section-reference rules. Verify changed content/links and actual responsive/browser behavior. A build is not deployed routing, accessibility, performance or publishing evidence. |

For cross-repository changes, pin both provider and consumer artifacts, identify compatibility
and rollout order, and verify both sides. Never dispatch a consumer before its required producer
contract/tooling is available. A pinned integration candidate is a separate authorized task.

For Noor-first UI journeys, present the reviewed change-and-impact writeup and obtain the required
explicit confirmation before Compose parity. An earlier wish for eventual parity is not that
post-review approval. Preserve accepted journeys and the user's existing approval boundaries.
