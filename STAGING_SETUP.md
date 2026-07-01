# Staging setup — para destrabar RLS (#3 Fase 2) y cifrado de numéricos (#2 Fase 2)

Las partes de DB de los arreglos #2 y #3 **no se pueden verificar in-memory** — necesitan un Postgres real. Este runbook levanta un staging Supabase y valida que soporta el mecanismo de RLS, antes de escribir políticas.

> Tiempo estimado: ~30 min. No toca producción.

## 1. Crear el proyecto Supabase de staging
1. supabase.com → New project → nombre `bio-ignicion-staging`, región **us-east** (misma que prod).
2. Guarda el **Database password** que generes.

## 2. Obtener los DOS connection strings
En Project Settings → Database → Connection string:
- **Pooled (Transaction)** — puerto **6543**, host `...pooler.supabase.com` → va en `DATABASE_URL` (runtime).
- **Direct** — puerto **5432** → va en `DIRECT_URL` (solo migraciones).

El esquema ya está cableado para ambos (`prisma/schema.prisma`: `url` + `directUrl`).

## 3. Generar las claves
```bash
# Clave de cifrado en reposo (kms.js) — 32 bytes hex
openssl rand -hex 32          # → DATA_KEY

# Clave de firma Ed25519 (artifacts) — corre y copia las 3 líneas
node -e 'import("./src/lib/artifact-signing.js").then(m=>{const k=m.generateSigningKeypair();console.log("KEY_ID",k.keyId);console.log("PRIVATE_B64",Buffer.from(k.privateKeyPem).toString("base64"));console.log(k.publicKeyPem)})'
```

## 4. Poblar `.env.local` (staging)
```
DATABASE_URL=postgresql://postgres.<ref>:<pwd>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.<ref>:<pwd>@aws-0-us-east-1.pooler.supabase.com:5432/postgres
DATA_KEY=<hex de openssl>
ARTIFACT_SIGNING_PRIVATE_KEY=<PRIVATE_B64 del paso 3>
ARTIFACT_SIGNING_KEY_ID=<KEY_ID del paso 3>
NODE_ENV=development
```

## 5. Aplicar migraciones + verificar
```bash
npm run prisma:generate
npm run prisma:migrate      # aplica las 27 migraciones al staging
npm run verify:staging      # ← valida conexión + set_config local (el motor de RLS)
```
`verify:staging` debe terminar con **"STAGING LISTO para Fase 2"**. Si el paso [3] falla (el contexto persiste fuera de la transacción), el pooler no está en modo transacción — revisa que uses el URL de puerto 6543.

---

## 6. Una vez verde — el camino de Fase 2

### #3 RLS (políticas)
1. Migración `0028_enable_rls`: por tabla tenant, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + `CREATE POLICY` usando `current_setting('app.org_ids', true)` / `current_setting('app.user_id', true)`. Matiz two-org: tablas con `orgId` → `org_id = ANY(string_to_array(current_setting('app.org_ids',true), ','))`; personal-scoped (`NeuralSession`) → por `userId`.
2. Rol de servicio BYPASSRLS para crons + benchmark cross-org.
3. Envolver los read/write tenant-scoped con `withTenant(ctx, fn)` (ya existe en `db.js`).
4. **Matriz de prueba cross-tenant** (script nuevo, contra staging): cada acceso ajeno devuelve 0 filas; mismo-tenant funciona; crons siguen. Habilitar **tabla por tabla**.

### #2 Cifrado de numéricos
1. Migración: columnas `Float`/`Int` sensibles (`HrvMeasurement.rmssd…`, `Instrument.score`, `Nom35Response.total`…) → `Text` + backfill cifrado de filas existentes.
2. `encryptJson`/`encrypt` en los write sites (sync-mapping, nom35, reEval, burnout-scan).
3. **Decrypt-on-read** en cada agregación (`executiveReport.js`, `snapshot.js`, `burnout-scan`, aggregate endpoints, wellbeing) — antes del `mean()`. Tests de agregación verifican igualdad post-cifrado.
4. Verificar todo contra staging antes de tocar prod.

> Ambas fases se prueban en staging, se revisan tabla-por-tabla, y solo entonces se aplican a producción. Nunca a ciegas.
