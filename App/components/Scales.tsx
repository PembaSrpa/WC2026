"use client";
import { useEffect, useState } from "react";

export function Scales() {
  const pattern = "repeating-linear-gradient(315deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 1px,transparent 0,transparent 50%)";
  const [width, setWidth] = useState(32);

  useEffect(() => {
    function update() { setWidth(window.innerWidth >= 768 ? 420 : 32); }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <>
      <div style={{ pointerEvents:"none",position:"fixed",left:0,top:0,height:"100%",width,borderRight:"1px solid #404040",backgroundImage:pattern,backgroundSize:"8px 8px",zIndex:10 }} />
      <div style={{ pointerEvents:"none",position:"fixed",right:0,top:0,height:"100%",width,borderLeft:"1px solid #404040",backgroundImage:pattern,backgroundSize:"8px 8px",zIndex:10 }} />
    </>
  );
}
