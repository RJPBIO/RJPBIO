-- NOM-035-STPS-2018 — Factores de riesgo psicosocial
-- Respuestas individuales con metadatos de scoring pre-calculado.
-- El agregado por org se calcula vía consulta (N ≥ minN por privacidad).

CREATE TABLE "Nom35Response" (
  "id"           TEXT        NOT NULL,
  "orgId"        TEXT        NOT NULL,
  "userId"       TEXT        NOT NULL,
  "guia"         TEXT        NOT NULL DEFAULT 'III',
  "answers"      JSONB       NOT NULL,
  "total"        INTEGER     NOT NULL,
  "nivel"        TEXT        NOT NULL,
  "porDominio"   JSONB       NOT NULL,
  "porCategoria" JSONB       NOT NULL,
  "completedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Nom35Response_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Nom35Response_orgId_completedAt_idx"        ON "Nom35Response" ("orgId", "completedAt");
CREATE INDEX "Nom35Response_orgId_nivel_completedAt_idx"  ON "Nom35Response" ("orgId", "nivel", "completedAt");
CREATE INDEX "Nom35Response_userId_completedAt_idx"       ON "Nom35Response" ("userId", "completedAt");

ALTER TABLE "Nom35Response"
  ADD CONSTRAINT "Nom35Response_orgId_fkey"
  FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Nom35Response"
  ADD CONSTRAINT "Nom35Response_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
