# Prisma migrations

Ejecución manual requerida antes de cada release (no lo hacemos automático
para evitar que un rollback accidental dispare `migrate reset`).

## Deploy a producción

```bash
# DATABASE_URL apuntando a prod (Postgres)
npx prisma migrate deploy
```

`migrate deploy` aplica sólo migraciones pendientes y nunca borra datos.
No confundir con `migrate dev` — ese último puede resetear la DB si detecta
drift y **no debe** correrse contra prod.

## Migraciones actuales

- `0001_baseline` — esquema completo de auth, org, sesiones, billing, audit.
- `0002_nom35` — tabla `Nom35Response` con FK a `Org` y `User` (cascade),
  índices por `(orgId, completedAt)`, `(orgId, nivel, completedAt)` y
  `(userId, completedAt)`. Ver `0002_nom35/migration.sql`.

## Verificación pre-deploy

```bash
# Compara schema.prisma contra el historial de migraciones
npx prisma migrate diff \
  --from-migrations ./prisma/migrations \
  --to-schema-datamodel ./prisma/schema.prisma \
  --script
```

Si la salida no está vacía, hay drift — genera una nueva migración antes
de hacer deploy.
