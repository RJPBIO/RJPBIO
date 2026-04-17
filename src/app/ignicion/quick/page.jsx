import { redirect } from "next/navigation";

export default function QuickIgnition() {
  redirect("/?t=entrada&source=shortcut&quick=1");
}
