import AppAmbientBackdrop from "@/components/brand/AppAmbientBackdrop";
import AppBrandMark from "@/components/brand/AppBrandMark";

/* /app layout — carries the brand DNA into the PWA: same lattice +
   vignette atoms as marketing (quieter), plus the corner wordmark so
   the letterform is preserved end-to-end. The 55KB page.jsx monolith
   owns its own chrome; this wrapper adds only the ambient stage. */
export default function AppLayout({ children }) {
  return (
    <>
      <AppAmbientBackdrop />
      <AppBrandMark />
      {children}
    </>
  );
}
