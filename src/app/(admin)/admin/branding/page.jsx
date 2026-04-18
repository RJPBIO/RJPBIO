export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { revalidatePath } from "next/cache";
import { auditLog } from "@/server/audit";
import BrandingClient from "./BrandingClient";
import { cssVar, space, font } from "@/components/ui/tokens";

export const metadata = { title: "Branding · Admin" };

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
    const branding = {
      logoUrl: formData.get("logoUrl") || null,
      primaryColor: formData.get("primaryColor") || "#059669",
      accentColor: formData.get("accentColor") || "#10B981",
      customDomain: formData.get("customDomain") || null,
      coachPersona: formData.get("coachPersona") || null,
    };
    await orm.org.update({ where: { id: orgId }, data: { branding } });
    await auditLog({ orgId, action: "branding.update", payload: branding });
    revalidatePath("/admin/branding");
  }

  async function reset() {
    "use server";
    const orm = await db();
    await orm.org.update({ where: { id: orgId }, data: { branding: {} } });
    await auditLog({ orgId, action: "branding.reset" });
    revalidatePath("/admin/branding");
  }

  return (
    <>
      <h1 style={{
        margin: 0,
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        letterSpacing: font.tracking.tight,
        color: cssVar.text,
      }}>
        Branding
      </h1>
      <p style={{
        color: cssVar.textMuted,
        marginTop: space[1],
        fontSize: font.size.sm,
        lineHeight: 1.5,
      }}>
        Personaliza logo, colores y tono del coach. El preview refleja cómo verá la app un miembro de tu org.
      </p>
      <div style={{ marginTop: space[5] }}>
        <BrandingClient initial={b} saveAction={save} resetAction={reset} />
      </div>
    </>
  );
}
