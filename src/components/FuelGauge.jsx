import React from 'react';

const DEF_FRAIS = [ // ... (skip constants, import from utils later)
];

function fuelLabel(pct){
  if(pct>=100)return"Plein";
  if(pct>=75)return"3/4";
  if(pct>=50)return"1/2";
  if(pct>=25)return"1/4";
  return"Réserve";
}

function fuelColor(pct){
  if(pct>=60)return"#16a34a";
  if(pct>=30)return"#d97706";
  return"#dc2626";
}

function FuelGauge({value,onChange,readOnly=false}){
  const pct = parseInt(value) || 0;
  const col = fuelColor(pct);
  const steps = [0,25,50,75,100];
  return(
    <div style={{userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:18}}>⛽</span>
        <div style={{flex:1,background:"#e5e7eb",borderRadius:99,height:14,overflow:"hidden"}}>
          <div style={{width:`${pct}%`,background:col,height:"100%",borderRadius:99,transition:"width .2s"}}/>
        </div>
        <span style={{fontSize:13,fontWeight:800,color:col,minWidth:40,textAlign:"right"}}>{pct}%</span>
        <span style={{fontSize:11,color:"#6b7280",minWidth:50}}>{fuelLabel(pct)}</span>
      </div>
      {!readOnly&&(
        <div style={{display:"flex",gap:4}}>
          {steps.map(s=>(
            <button key={s} onClick={()=>onChange(s)}
              style={{flex:1,padding:"5px 0",borderRadius:7,border:`2px solid ${pct===s?col:"#e5e7eb"}`,background:pct===s?col:"white",color:pct===s?"white":"#374151",fontSize:11,fontWeight:700,cursor:"pointer"}}>
              {s===0?"Vide":s===100?"Plein":s+"%"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FuelGauge;

