# BIGNOS · Bio-Ignición
### Physiological Risk Infrastructure para operación industrial

**Para Directores de Riesgo, Seguridad (SST/EHS), CISO y Operaciones.**
No es bienestar. Es evidencia fisiológica firmada, antes del turno.

---

## El problema que ya te cuesta dinero

- **Riesgo invisible.** Un operador entra al turno desregulado (fatiga, estrés agudo, mal sueño) y nadie lo sabe — ni él, ni el supervisor, ni la empresa. La fatiga está detrás de una parte mayor de los incidentes industriales graves.
- **Sin evidencia.** Si ocurre un incidente, no tienes registro de que tomaste acción preventiva. Eso define si pasas o repruebas una auditoría — y si tienes o no defensa legal.
- **Cumplimiento como trámite.** La NOM-035 archivada hace ocho meses no es evidencia operativa.

> La pregunta correcta no es "¿cómo está el bienestar de mi gente?". Es: **"si la STPS llega mañana, ¿qué presento como evidencia de que verifiqué el estado de mis operadores antes del turno?"**

---

## Qué hace Bio-Ignición

Una capa de infraestructura que **mide, interviene y deja registro** — con el teléfono del operador, sin hardware:

1. **Mide** el estado fisiológico (HRV, variabilidad cardíaca) **antes del turno** — cámara del teléfono, sin dispositivos que comprar ni inventariar.
2. **Interviene** con un protocolo breve (≈90 s) calibrado al estado del operador, respaldado en literatura científica referenciada.
3. **Documenta** con un **artifact firmado digitalmente** que demuestra que la empresa midió y actuó.

---

## La evidencia: firma verificable por terceros

El registro no es una promesa: es un documento con **firma criptográfica Ed25519**. Cualquier tercero —tu auditor, tu abogado, un revisor de la STPS— **descarga nuestra clave pública y verifica por su cuenta** que el documento (a) no fue alterado y (b) vino del sistema. Además, la bitácora de auditoría es una **cadena hash a prueba de manipulación**.

*(Lenguaje honesto: "a prueba de manipulación + firma Ed25519 verificable", no "blockchain".)*

---

## Por qué es distinto

| | Apps de bienestar (Calm/Headspace/Minu) | Wearables (Whoop/Oura/Kenzen) | EHS enterprise (Cority) | **Bio-Ignición** |
|---|---|---|---|---|
| Mide fisiología pre-turno | No | Sí | No | **Sí (sin hardware)** |
| Interviene en el momento | No | No | No | **Sí (≈90 s)** |
| Evidencia firmada para auditoría | No | No | Parcial | **Sí (Ed25519)** |
| Comprador | RRHH | Individuo | EHS | **CRO / CISO / SST** |

---

## Postura de seguridad y privacidad (honesta)

- **Dato individual cifrado en el dispositivo (AES-GCM) y en tránsito.** Privacidad por diseño.
- **k-anonimato (k≥5)** en toda vista agregada: nunca identificamos a una persona ante la empresa.
- **Audit log encadenado por hash + artifacts firmados Ed25519** verificables por terceros.
- **MFA, RBAC, SSO (Okta/Azure/Google), SCIM, CSP.** Aislamiento por organización a nivel aplicación; **RLS a nivel base de datos en roadmap** (gate para Enterprise).

> Te decimos lo que está y lo que está en camino. Un comprador serio respeta más eso que un claim que se cae en due diligence.

---

## Cumplimiento

NOM-035-STPS · útil como evidencia ante LFT, IMSS (prima de riesgo) y NOM-030 · FRMS/AFAC en aviación.
*El texto NOM-035 está pendiente de validación legal final vs DOF; los reportes lo indican.*

---

## La oferta

**Programa Design Partner — cupos limitados, este trimestre.**
Condiciones preferentes (50% durante 24 meses) para las primeras plantas que entran. Empezamos con un **diagnóstico sin costo** y un piloto acotado (una línea / un turno).

**→ Agenda 15 minutos: [correo] · [Calendly] · bignos.com**

*Bio-Ignición no es un dispositivo médico. Cifras de costo/ROI son estimaciones de fuentes públicas (OMS, OIT, Deloitte) y varían por industria.*
