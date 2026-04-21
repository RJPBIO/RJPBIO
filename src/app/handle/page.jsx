import { redirect } from "next/navigation";

export default async function Handle({ searchParams }) {
  const { deep } = (await searchParams) || {};
  if (!deep) redirect("/app");
  const parsed = String(deep).replace(/^web\+bioign:\/?\/?/, "");
  redirect(`/app?deep=${encodeURIComponent(parsed)}&source=protocol`);
}
