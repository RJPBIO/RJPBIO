# Contributing to BIO-IGNICIÓN

Thanks for considering a contribution. A few conventions to keep the repo healthy:

## Before you start
- Open an issue first for anything non-trivial (over ~50 LOC or touching security/data).
- Sign commits (`git commit -S`). Unsigned commits won't be merged to `main`.

## Branches + commits
- Feature branches: `feat/<scope>`, `fix/<scope>`, `docs/<scope>`, `chore/<scope>`.
- [Conventional Commits](https://www.conventionalcommits.org/): `feat(admin): add webhook UI`.

## Tests
- `npm test` must pass, coverage ≥ 70% (lines/functions) / 60% (branches).
- New domain logic needs a unit test before the change lands.
- UI changes should include a Playwright smoke.

## Style
- ESLint is authoritative. `npm run lint`.
- No `console.log` in shipped code — use `src/lib/logger.js`.
- No inline scripts/styles without nonce; CSP is `script-src 'self' 'nonce-…' 'strict-dynamic'`.

## Security
- Never commit `.env*`. Gitleaks runs in CI.
- Secrets found in history must be rotated + reported to security@bio-ignicion.app.
- Report vulnerabilities privately (see [SECURITY.md](SECURITY.md)).

## PR checklist
- [ ] Linked issue
- [ ] Tests added/updated
- [ ] Docs updated (README, ARCHITECTURE, API as applicable)
- [ ] No secrets, no `unsafe-inline`, no `any`-level type escapes
- [ ] CHANGELOG.md entry under `[Unreleased]`
