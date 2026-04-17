import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { revalidatePath } from "next/cache";

export default async function BrandingPage() {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER","ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const org = await orm.org.findUnique({ where: { id: orgId } });
  const b = org?.branding || {};

  async function save(formData) {
    "use server";
    const orm = await db();
    await orm.org.update({ where: { id: orgId }, data: {
      branding: {
        logoUrl: formData.get("logoUrl") || null,
        primaryColor: formData.get("primaryColor") || "#059669",
        accentColor: formData.get("accentColor") || "#10B981",
        customDomain: formData.get("customDomain") || null,
        coachPersona: formData.get("coachPersona") || null,
      },
    }});
    revalidatePath("/admin/branding");
  }

  return (
    <>
      <h1>Branding</h1>
      <form action={save} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <Field label="Logo URL" name="logoUrl" defaultValue={b.logoUrl} />
        <Field label="Color primario" name="primaryColor" defaultValue={b.primaryColor || "#059669"} type="color" />
        <Field label="Color acento" name="accentColor" defaultValue={b.accentColor || "#10B981"} type="color" />
        <Field label="Dominio personalizado" name="customDomain" defaultValue={b.customDomain} placeholder="app.tu-empresa.com" />
        <Field label="Persona del coach (opcional)" name="coachPersona" defaultValue={b.coachPersona} placeholder="ej. ‘tono Kaizen, referencias a cultura japonesa de kaizen y mushin’" />
        <button style={btn}>Guardar</button>
      </form>
    </>
  );
}

function Field({ label, ...rest }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13 }}>
      <span style={{ color: "#A7F3D0" }}>{label}</span>
      <input {...rest} style={input} />
    </label>
  );
}

const input = { padding: "10px 12px", borderRadius: 10, background: "#052E16", color: "#ECFDF5", border: "1px solid #064E3B" };
const btn = { padding: "10px 18px", borderRadius: 999, fontWeight: 700, background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", border: 0, cursor: "pointer", justifySelf: "start" };
