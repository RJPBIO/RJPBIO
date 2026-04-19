# Legal templates

These are **templates**, not legal advice. Route every file through counsel before using externally.

| File | Purpose | Who uses it |
|---|---|---|
| [DPA.md](DPA.md) | Data Processing Agreement — offered alongside MSA for enterprise customers, required for EU/UK/CH data transfers. | Sales / legal → Customer |

## Customer-facing rendered pages (public, in-app)

These exist as routes and should be kept in sync with the legal templates:

- `/privacy` — Privacy Policy (what BIO-IGNICIÓN does with personal data)
- `/terms` — Terms of Service
- `/aup` — Acceptable Use Policy
- `/cookies` — Cookie Policy
- `/trust/subprocessors` — List of sub-processors (drives §4 of the DPA)

## Changes

When you modify a public-facing legal page:
1. Bump the "Effective date" at the top.
2. Email active customers (`MSA` signers) with the diff.
3. Record the change in `CHANGELOG.md` under `## Legal`.
