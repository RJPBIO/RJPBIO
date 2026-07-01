-- 0028_encrypt_hrv_numerics
-- Cifrado en reposo de los numéricos de HRV: columnas Float → TEXT.
-- Se agregan APP-SIDE (mean en JS) con decrypt-on-read, así que no se
-- pierde ninguna capacidad de reporte. El USING ::text preserva cualquier
-- fila existente como número en claro (decrypt-on-read hace passthrough).
-- Nuevas escrituras van cifradas (kms.encNum) vía encrypted-fields.

ALTER TABLE "HrvMeasurement" ALTER COLUMN "rmssd"   TYPE TEXT USING "rmssd"::text;
ALTER TABLE "HrvMeasurement" ALTER COLUMN "lnRmssd" TYPE TEXT USING "lnRmssd"::text;
ALTER TABLE "HrvMeasurement" ALTER COLUMN "sdnn"    TYPE TEXT USING "sdnn"::text;
ALTER TABLE "HrvMeasurement" ALTER COLUMN "pnn50"   TYPE TEXT USING "pnn50"::text;
ALTER TABLE "HrvMeasurement" ALTER COLUMN "meanHr"  TYPE TEXT USING "meanHr"::text;
ALTER TABLE "HrvMeasurement" ALTER COLUMN "rhr"     TYPE TEXT USING "rhr"::text;
