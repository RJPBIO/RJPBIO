import { DS } from './constants';

function ldS(){try{if(typeof window!=="undefined"){const r=localStorage.getItem("bio-g2");if(r){const parsed=JSON.parse(r);const data={...DS,...parsed};if(!data._v||data._v<3){data._v=3;data._migrated=Date.now();}return data;}}}catch(e){console.error("Load error:",e);}return{...DS,_v:3,_created:Date.now()};}
function svS(d){try{if(typeof window!=="undefined"){localStorage.setItem("bio-g2",JSON.stringify(d));}}catch(e){console.error("Save error:",e);}}
function exportData(st){try{const blob=new Blob([JSON.stringify(st,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="bio-ignicion-data.json";a.click();URL.revokeObjectURL(url);}catch(e){}}

export { ldS, svS, exportData };
