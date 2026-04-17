import { redirect } from "next/navigation";

export default async function Handle({ searchParams }) {
  const { deep } = (await searchParams) || {};
  if (!deep) redirect("/");
  const parsed = String(deep).replace(/^web\+bioign:\/?\/?/, "");
  redirect(`/?deep=${encodeURIComponent(parsed)}&source=protocol`);
}
