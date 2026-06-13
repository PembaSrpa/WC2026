export function Scales() {
  const pattern = "repeating-linear-gradient(315deg,rgba(255,255,255,0.05) 0,rgba(255,255,255,0.05) 1px,transparent 0,transparent 50%)";
  const base = { pointerEvents:"none" as const,position:"fixed" as const,top:0,height:"100%",width:"5vw",backgroundImage:pattern,backgroundSize:"8px 8px",zIndex:10 };
  return (
    <>
      <div style={{ ...base,left:0,borderRight:"1px solid #404040" }} />
      <div style={{ ...base,right:0,borderLeft:"1px solid #404040" }} />
    </>
  );
}
