# Data Processing Agreement (DPA) — Template

> ⚠️ This is a **template**, not legal advice. Have your counsel review and localize before using with customers. Use is at your own risk.

**Effective date:** {{EFFECTIVE_DATE}}
**Parties:**
- **Controller**: {{CUSTOMER_LEGAL_NAME}} ("Customer")
- **Processor**: BIO-IGNICIÓN, operated by {{COMPANY_LEGAL_NAME}} ("BIO-IGNICIÓN")

This DPA supplements the Master Subscription Agreement (MSA) or Terms of Service between the parties ("Agreement") and governs Processing of Personal Data by BIO-IGNICIÓN on behalf of Customer.

---

## 1. Definitions

Terms capitalized but not defined here carry the meaning given in Regulation (EU) 2016/679 ("GDPR") and, where applicable, the California Consumer Privacy Act ("CCPA"), the Ley Federal de Protección de Datos Personales en Posesión de los Particulares ("LFPDPPP"), and the UK GDPR.

"Personal Data" means any information relating to an identified or identifiable natural person Processed by BIO-IGNICIÓN on behalf of Customer under the Agreement.

"Sub-processor" means any Processor engaged by BIO-IGNICIÓN to Process Personal Data on behalf of Customer.

## 2. Scope and roles

- Customer is the **Controller** of Personal Data.
- BIO-IGNICIÓN is the **Processor** and acts only on documented instructions from Customer (embodied in the Agreement, this DPA, and product configuration).
- Subject-matter, nature, purpose, duration, categories of data subjects, and categories of Personal Data are described in Annex A.

## 3. Processor obligations

BIO-IGNICIÓN shall:

- Process Personal Data only on Customer's documented instructions.
- Ensure personnel authorized to Process Personal Data are bound by confidentiality.
- Implement technical and organizational measures in Annex B ("TOMs").
- Assist Customer with data-subject requests (Art. 12–23), DPIAs (Art. 35), and breach notifications (Art. 33–34), at reasonable cost.
- Notify Customer of any Personal Data Breach **without undue delay and within 72 hours** of becoming aware.
- At Customer's choice, delete or return Personal Data within 30 days of termination, save where retention is required by applicable law.
- Make available information necessary to demonstrate compliance and allow for audits (see §7).

## 4. Sub-processors

Customer grants **general authorization** to BIO-IGNICIÓN to engage Sub-processors, provided BIO-IGNICIÓN:

1. Publishes the current list at https://bio-ignicion.app/trust/subprocessors.
2. Gives Customer **30 days prior notice** via email or in-app of any intended addition or replacement, during which Customer may object in writing on reasonable Data Protection grounds.
3. Imposes data-protection obligations on each Sub-processor that are no less protective than this DPA.

## 5. International transfers

Where Personal Data originating in the EEA, UK, or Switzerland is transferred outside those territories, the parties rely on:

- EU Commission Standard Contractual Clauses (Module Two: Controller-to-Processor, Module Three: Processor-to-Processor) for transfers from the EEA;
- UK International Data Transfer Addendum for transfers from the UK;
- Swiss FDPIC-recognized variant for transfers from Switzerland.

The SCCs are incorporated by reference. Selections: Option 2 (Clause 9(a)), Docking Clause (Clause 7), Option 1 in Clause 17 (law of Ireland), Clause 18 (Irish courts). Annex I data export schedules are provided in Annex A of this DPA.

## 6. Security

BIO-IGNICIÓN maintains the security measures in Annex B and may update them provided the level of protection is not diminished. Measures include:

- Encryption at rest (AES-256-GCM envelope keys, KMS-wrapped).
- Encryption in transit (TLS 1.2+).
- Access control with RBAC, MFA, and SSO for staff.
- Audit logging with tamper-evident hash chain + HMAC seal.
- Annual pentest; vulnerability management per OWASP Top 10.
- Disaster recovery: RTO 1 h, RPO 5 min.

## 7. Audits

At Customer's request no more than once per twelve (12) months, BIO-IGNICIÓN will make available:

- Current SOC 2 Type II report (once achieved), ISO 27001 certificate (once achieved), or equivalent third-party attestation.
- A completed CAIQ / SIG questionnaire.
- Within reason, responses to written security questionnaires.

Physical audits of BIO-IGNICIÓN's facilities may be requested where required by Supervisory Authority and subject to reasonable conditions.

## 8. Data-subject rights

BIO-IGNICIÓN provides self-service product capabilities to assist Customer with:

- Access (Art. 15) — `GET /api/v1/users/me/export`
- Rectification (Art. 16) — Admin → Members
- Erasure (Art. 17) — `DELETE /api/v1/users/me` (30-day soft-delete grace)
- Portability (Art. 20) — same export endpoint, JSON format
- Restriction / objection (Art. 18, 21) — Admin → Members → Suspend

## 9. Return or deletion

Upon termination of the Agreement, BIO-IGNICIÓN will, at Customer's election:

- Export all Customer Personal Data via the export endpoints, and/or
- Delete all Customer Personal Data within **30 days**, except where law requires retention.

Backups are purged on rolling schedule (max 35 days). Audit logs required by law may be retained longer.

## 10. Liability

Each party's liability under this DPA is subject to the limitations and exclusions in the Agreement.

## 11. Conflict; governing law

In case of conflict, this DPA prevails over the Agreement with respect to data protection. Governing law and jurisdiction are as stated in the Agreement unless required otherwise by Applicable Data Protection Law.

---

## Annex A — Processing details

- **Categories of data subjects**: Customer's employees, contractors, authorized agents, and end-users who use the Service.
- **Categories of Personal Data**: name, work email, locale, timezone, organizational role; session telemetry (HRV, session duration, protocol usage — stored in encrypted form); IP and device metadata.
- **Special categories (Art. 9)**: Health-adjacent biometric signals (HRV) where the Customer configures the product to store them. Processing basis: Customer's compliance with Art. 9(2)(h) or equivalent; BIO-IGNICIÓN does not Process for its own research.
- **Duration**: for the term of the Agreement + retention window in §9.
- **Nature and purpose**: providing the BIO-IGNICIÓN service to Customer, including session recording, analytics, billing, support, and deriving aggregated insights.

## Annex B — Technical and organizational measures (TOMs)

| Domain | Measure |
|---|---|
| Access control | RBAC (OWNER/ADMIN/MANAGER/MEMBER/VIEWER); MFA required for ADMIN+; SSO for staff. |
| Encryption | AES-256-GCM at rest (envelope with KMS). TLS 1.2+ in transit. Secrets in Vercel encrypted envs / KMS. |
| Logging | Hash-chain + HMAC-sealed audit log. Retention 365 days. Alerting on anomalies. |
| Backups | Daily full + PITR 5 min. Weekly restore drill (`verify:backup`). Offsite copy in different region. |
| Incident response | On-call rotation; SEV1 response ≤ 15 min; customer comms per §3 of this DPA. |
| Staff | Background checks; annual security training; confidentiality agreements; MFA on corp SSO. |
| Vulnerability mgmt | Dependency scanning (Dependabot); pentest yearly; bug bounty. |
| Supplier mgmt | Listed at /trust/subprocessors; reviewed annually. |
| Physical | Customer Personal Data never stored on staff laptops. All infra in certified data centers (SOC 2 Type II, ISO 27001). |

---

**Signed for Customer:**
Name: ___________________________  Title: ___________________________
Date: ___________________  Signature: ___________________________

**Signed for BIO-IGNICIÓN:**
Name: ___________________________  Title: ___________________________
Date: ___________________  Signature: ___________________________
