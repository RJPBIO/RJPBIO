import dynamic from "next/dynamic";

const BioIgnicion = dynamic(() => import("@/components/BioIgnicion"), {
  ssr: false,
  loading: () => (
    <div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#0A0D14",gap:16}}>
      <svg width="56" height="56" viewBox="0 0 56 56" style={{animation:"pu 1.8s ease infinite"}}>
        <circle cx="28" cy="28" r="24" fill="none" stroke="#059669" strokeWidth="2" opacity=".4"/>
        <circle cx="28" cy="28" r="17" fill="none" stroke="#6366F1" strokeWidth="1.5" strokeDasharray="5 4"/>
        <circle cx="28" cy="28" r="6" fill="#059669" opacity=".5"/>
      </svg>
      <div style={{fontSize:10,fontWeight:800,color:"#4B5568",letterSpacing:6,textTransform:"uppercase"}}>BIO-IGNICIÓN</div>
    </div>
  ),
});

export default function Page() {
  return <BioIgnicion />;
}
