export function Scales() {
  const pattern = "repeating-linear-gradient(315deg,rgba(255,255,255,0.06) 0,rgba(255,255,255,0.06) 1px,transparent 0,transparent 50%)";
  return (
    <>
      <div style={{ pointerEvents:"none",position:"fixed",left:0,top:0,height:"100%",width:420,borderRight:"1px solid #525252",backgroundImage:pattern,backgroundSize:"8px 8px",zIndex:10 }} />
      <div style={{ pointerEvents:"none",position:"fixed",right:0,top:0,height:"100%",width:420,borderLeft:"1px solid #525252",backgroundImage:pattern,backgroundSize:"8px 8px",zIndex:10 }} />
    </>
  );
}
