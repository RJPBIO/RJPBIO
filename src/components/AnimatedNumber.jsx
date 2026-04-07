"use client";
import { useState, useEffect, useRef } from "react";

export function AN({value,sfx="",color="#0F172A",sz=32}){const[d,sD]=useState(0);const rf=useRef(null);useEffect(()=>{let s=d;const e=value;const t0=performance.now();function step(n){const p=Math.min((n-t0)/700,1);sD(Math.round(s+(1-Math.pow(1-p,3))*(e-s)));if(p<1)rf.current=requestAnimationFrame(step);}rf.current=requestAnimationFrame(step);return()=>{if(rf.current)cancelAnimationFrame(rf.current);};},[value]);return<span style={{fontSize:sz,fontWeight:800,color,fontFamily:"'Manrope',sans-serif",letterSpacing:"-1px"}}>{d}{sfx}</span>;}
