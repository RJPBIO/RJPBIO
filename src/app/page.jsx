"use client";
import dynamic from "next/dynamic";

const BioIgnicion = dynamic(() => import("@/components/BioIgnicion"), {
  ssr: false,
  loading: () => (
    <div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#06090F",gap:20}}>
      <svg width="64" height="64" viewBox="0 0 64 64" style={{animation:"pu 2.2s ease infinite",filter:"drop-shadow(0 0 12px rgba(16,185,129,.2))"}}>
        <circle cx="32" cy="32" r="28" fill="none" stroke="#10B981" strokeWidth="1.5" opacity=".35" strokeDasharray="4 2"/>
        <circle cx="32" cy="32" r="20" fill="none" stroke="#6366F1" strokeWidth="1" strokeDasharray="5 4" opacity=".45"/>
        <circle cx="32" cy="32" r="4" fill="#10B981" opacity=".5"/>
      </svg>
      <div style={{fontSize:11,fontWeight:800,color:"#3E4A60",letterSpacing:6,textTransform:"uppercase"}}>BIO-IGNICIÓN</div>
    </div>
  ),
});

export default function Page() {
  return <BioIgnicion />;
}
