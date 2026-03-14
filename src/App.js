import { supabase } from './supabase';
import { useState, useEffect, useRef, useCallback } from "react";

const DEF_FRAIS=[
  {id:1,label:"Rayure",montant:300},{id:2,label:"Jantes rayées",montant:300},
  {id:3,label:"Élément touché",montant:300},{id:4,label:"Siège abîmé",montant:350},
  {id:5,label:"Retour véhicule sale",montant:20},{id:6,label:"Mise en fourrière",montant:250},
  {id:7,label:"Dégât RSV",montant:17000},
];
const DEF_CLAUSES=[
  {id:1,titre:"Clause d'immobilisation",texte:"Toute immobilisation causée par une faute du Locataire entraînera une facturation de 60 €/jour jusqu'à réparation."},
  {id:2,titre:"Carburant",texte:"Le véhicule est remis avec le plein. Il devra être rendu avec le même niveau. Manquement = 20 € + coût carburant."},
  {id:3,titre:"Amendes & Infractions",texte:"Le Locataire est responsable des infractions. Toute amende sera transmise avec frais de gestion (30-50 €/dossier)."},
  {id:4,titre:"État du véhicule",texte:"Un état des lieux est effectué. Toute dégradation non signalée sera retenue sur la caution. Nettoyage = 80 €."},
  {id:5,titre:"Utilisation du véhicule",texte:"Le locataire s'engage à utiliser le véhicule avec diligence et prudence. Usage illégal interdit."},
  {id:6,titre:"Véhicule RSV",texte:"En cas d'accident RSV, la somme de 17 000 € sera demandée si la responsabilité du locataire est engagée."},
  {id:7,titre:"Exclusivité de conduite",texte:"Seul le Locataire est autorisé à conduire. Toute conduite par un tiers est strictement interdite."},
  {id:8,titre:"Limitation géographique",texte:"Le véhicule ne peut être utilisé que sur le territoire français. Pénalité de 250 € en cas de non-respect."},
  {id:9,titre:"Interdiction de sous-location",texte:"Le Locataire s'engage à ne pas sous-louer le véhicule. Résiliation sans remboursement en cas de non-respect."},
  {id:10,titre:"Non-fumeur",texte:"Il est interdit de fumer dans le véhicule. Forfait nettoyage de 20-80 € en cas d'odeur ou traces."},
  {id:11,titre:"Dégradations",texte:"En cas de dégradation, aucune somme versée ne sera remboursée. Les frais excédant la caution seront facturés."},
];

const CARRO_ELEMENTS=[
  {id:"aile_avg",label:"Aile avant gauche",zone:"Avant"},
  {id:"aile_avd",label:"Aile avant droite",zone:"Avant"},
  {id:"pare_choc_av",label:"Pare-choc avant",zone:"Avant"},
  {id:"capot",label:"Capot",zone:"Avant"},
  {id:"toit",label:"Toit",zone:"Dessus"},
  {id:"pare_brise",label:"Pare-brise",zone:"Vitres"},
  {id:"vitre_avg",label:"Vitre avant gauche",zone:"Vitres"},
  {id:"vitre_avd",label:"Vitre avant droite",zone:"Vitres"},
  {id:"vitre_arg",label:"Vitre arrière gauche",zone:"Vitres"},
  {id:"vitre_ard",label:"Vitre arrière droite",zone:"Vitres"},
  {id:"lunette",label:"Lunette arrière",zone:"Vitres"},
  {id:"portiere_avg",label:"Portière avant gauche",zone:"Gauche"},
  {id:"portiere_arg",label:"Portière arrière gauche",zone:"Gauche"},
  {id:"portiere_avd",label:"Portière avant droite",zone:"Droite"},
  {id:"portiere_ard",label:"Portière arrière droite",zone:"Droite"},
  {id:"aile_arg",label:"Aile arrière gauche",zone:"Arrière"},
  {id:"aile_ard",label:"Aile arrière droite",zone:"Arrière"},
  {id:"pare_choc_ar",label:"Pare-choc arrière",zone:"Arrière"},
  {id:"coffre",label:"Coffre / Hayon",zone:"Arrière"},
  {id:"jante_avg",label:"Jante avant gauche",zone:"Jantes"},
  {id:"jante_avd",label:"Jante avant droite",zone:"Jantes"},
  {id:"jante_arg",label:"Jante arrière gauche",zone:"Jantes"},
  {id:"jante_ard",label:"Jante arrière droite",zone:"Jantes"},
  {id:"retro_g",label:"Rétroviseur gauche",zone:"Divers"},
  {id:"retro_d",label:"Rétroviseur droit",zone:"Divers"},
];

const RETOUR_CHECKS=[
  {id:"carburant",label:"Carburant niveau OK",icon:"⛽"},
  {id:"exterieur",label:"Extérieur propre",icon:"🚿"},
  {id:"interieur",label:"Intérieur propre",icon:"🧹"},
  {id:"sieges",label:"Sièges sans dégât",icon:"💺"},
  {id:"odeur",label:"Pas d'odeur tabac",icon:"🚭"},
  {id:"documents",label:"Documents présents",icon:"📋"},
  {id:"cles",label:"Clés rendues",icon:"🔑"},
];

const CAT_DEP=["Carburant","Assurance","Entretien","Réparation","Nettoyage","Péage","Amende","Retenue caution","Autre"];
const DOC_TYPES=["Carte grise","Assurance","Contrôle technique","Permis de conduire","CNI / Passeport","Contrat","Autre"];
const TARIFS_PRESETS=[
  {type:"Journée (24h)",heures:24},
  {type:"Week-end (48h)",heures:48},
  {type:"Week-end (72h)",heures:72},
  {type:"Semaine (7j)",heures:168},
  {type:"Mois (30j)",heures:720},
];

const INIT_V=[];
const INIT_PROFIL={nom:"",entreprise:"",siren:"",siret:"",kbis:"",tel:"",whatsapp:"",snap:"",email:"",adresse:"",ville:"",iban:""};

const CAR_BRANDS={
  "Renault":["Clio","Megane","Captur","Kadjar","Scenic","Twingo","Arkana","Austral","Zoe","Kangoo","Trafic","Master"],
  "Peugeot":["108","208","308","408","508","2008","3008","5008","Rifter","Partner","Expert"],
  "Citroën":["C1","C3","C3 Aircross","C4","C4 X","C5 Aircross","C5 X","Berlingo","Jumpy","ë-C4"],
  "Volkswagen":["Polo","Golf","T-Roc","T-Cross","Tiguan","Touareg","Passat","ID.3","ID.4","Caddy","Transporter"],
  "BMW":["Série 1","Série 2","Série 3","Série 4","Série 5","X1","X2","X3","X4","X5","X6","iX1","iX3"],
  "Mercedes":["Classe A","Classe B","Classe C","Classe E","Classe S","CLA","GLA","GLB","GLC","GLE","GLS","EQA","EQB"],
  "Audi":["A1","A3","A4","A5","A6","Q2","Q3","Q5","Q7","Q8","e-tron","TT"],
  "Toyota":["Aygo X","Yaris","Yaris Cross","Corolla","C-HR","RAV4","Camry","Land Cruiser","Hilux","Proace"],
  "Dacia":["Sandero","Duster","Jogger","Spring","Logan"],
  "Fiat":["500","500X","Panda","Tipo","Punto","Doblo"],
  "Opel":["Corsa","Astra","Mokka","Crossland","Grandland","Combo","Vivaro"],
  "Hyundai":["i10","i20","i30","Kona","Tucson","Santa Fe","Ioniq 5","Ioniq 6","Bayon"],
  "Kia":["Picanto","Rio","Ceed","Sportage","Sorento","Niro","EV6","Stonic"],
  "Nissan":["Micra","Juke","Qashqai","X-Trail","Leaf","Ariya","Navara"],
  "Ford":["Fiesta","Focus","Puma","Kuga","Explorer","Mustang","Ranger","Transit","Transit Custom"],
  "Seat":["Ibiza","Leon","Arona","Ateca","Tarraco"],
  "Skoda":["Fabia","Octavia","Scala","Kamiq","Karoq","Kodiaq","Enyaq"],
  "Tesla":["Model 3","Model Y","Model S","Model X"],
  "Volvo":["XC40","XC60","XC90","S60","V60","C40"],
  "Mini":["Cooper","Countryman","Clubman"],
  "Jeep":["Renegade","Compass","Cherokee","Wrangler","Grand Cherokee","Avenger"],
  "Alfa Romeo":["Giulia","Stelvio","Tonale","Giulietta"],
  "DS":["DS 3","DS 4","DS 7","DS 9"],
  "Cupra":["Formentor","Born","Leon","Ateca"],
  "Suzuki":["Swift","Ignis","Vitara","S-Cross","Jimny"],
  "Mazda":["Mazda2","Mazda3","CX-3","CX-30","CX-5","MX-5","CX-60"],
  "Honda":["Jazz","Civic","HR-V","CR-V","ZR-V","e:Ny1"],
  "Mitsubishi":["Space Star","ASX","Eclipse Cross","Outlander"],
  "Land Rover":["Defender","Discovery","Discovery Sport","Range Rover","Range Rover Sport","Range Rover Evoque","Range Rover Velar"]
};

const CAR_COLORS=["Noir","Blanc","Gris","Argent","Bleu","Rouge","Vert","Beige","Marron","Orange","Jaune","Violet","Rose","Bordeaux","Bleu nuit","Gris anthracite","Blanc nacré","Noir métallisé","Bleu métallisé","Gris métallisé"];

const CURRENT_YEAR=new Date().getFullYear();
const CAR_YEARS=Array.from({length:30},(_,i)=>CURRENT_YEAR-i);

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

function dlFile(html,filename){
  const b=new Blob([html],{type:"text/html;charset=utf-8"});
  const u=URL.createObjectURL(b);
  const a=document.createElement("a");
  a.href=u;a.download=filename;
  document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(u);document.body.removeChild(a);},1000);
}

function buildContratHTML(contrat,vehicle,sigL,sigLoc,profil){
  const nb=contrat.nbJours||1,total=contrat.totalCalc||0,pm=contrat.paiement;
  const frais=vehicle.frais||DEF_FRAIS,clauses=vehicle.clauses||DEF_CLAUSES;
  const fraisRows=frais.map(f=>"<tr><td>"+f.label+"</td><td style='text-align:right;font-weight:bold'>"+f.montant+" \u20ac</td></tr>").join("");
  const clausesHtml=clauses.map((c,i)=>"<div class='cl'><span class='cl-t'>"+(i+6)+". "+c.titre+"</span><br>"+c.texte+"</div>").join("");
  const sL=sigL?"<img src='"+sigL+"' style='max-width:160px;height:60px;display:block;margin:0 auto;border-bottom:1px solid #333'>":"<div style='border-bottom:1px solid #333;height:60px;width:160px;margin:0 auto'></div>";
  const sLoc=sigLoc?"<img src='"+sigLoc+"' style='max-width:160px;height:60px;display:block;margin:0 auto;border-bottom:1px solid #333'>":"<div style='border-bottom:1px solid #333;height:60px;width:160px;margin:0 auto'></div>";
  const fuelPct=contrat.carburantDepart||0;
  const fuelBar="<div style='margin:6px 0'><span style='font-size:10px;color:#555'>Carburant d\u00e9part : </span><span style='font-weight:bold'>"+fuelPct+"% \u2014 "+fuelLabel(fuelPct)+"</span><div style='background:#e5e7eb;border-radius:99px;height:10px;width:200px;margin-top:3px;overflow:hidden'><div style='width:"+fuelPct+"%;background:"+fuelColor(fuelPct)+";height:100%'></div></div></div>";
  const extPropre=contrat.exterieurPropre===true?"\u2705 Oui":contrat.exterieurPropre===false?"\u274c Non":"\u2014";
  const intPropre=contrat.interieurPropre===true?"\u2705 Oui":contrat.interieurPropre===false?"\u274c Non":"\u2014";
  const etatHtml="<div style='display:flex;gap:16px;margin:4px 0'><span style='font-size:10px'><b>Ext\u00e9rieur propre :</b> "+extPropre+"</span><span style='font-size:10px'><b>Int\u00e9rieur propre :</b> "+intPropre+"</span></div>";
  const kmRow=vehicle.kmInclus?"<div><span class='lbl'>Km inclus : </span><span class='val'>"+vehicle.kmInclus+" km</span> &nbsp; <span class='lbl'>Surplus : </span><span class='val'>"+(vehicle.prixKmSup||0)+" \u20ac/km</span></div>":"";
  const cautionMode=contrat.cautionMode==="especes"?"Esp\u00e8ces":contrat.cautionMode==="virement"?"Virement bancaire":contrat.cautionMode==="emprunt"?"Emprunt bancaire":"Autre";
  const photosDepart=contrat.photosDepart||[];
  const photosHtml=photosDepart.length>0?"<div style='margin-top:6px'><div style='font-size:10px;font-weight:bold;color:#555;margin-bottom:4px'>Photos d\u00e9part ("+photosDepart.length+")</div><div style='display:flex;flex-wrap:wrap;gap:6px'>"+photosDepart.map(p=>"<img src='"+p.data+"' style='width:120px;height:90px;object-fit:cover;border-radius:6px;border:1px solid #ddd'>").join("")+"</div></div>":"";
  const permisHtml=contrat.locPermis?"<div><span class='lbl'>Permis : </span><span class='val'>"+contrat.locPermis+"</span></div>":"";
  const tarifHtml=contrat.tarifLabel?"<div><span class='lbl'>Tarif appliqu\u00e9 : </span><span class='val'>"+contrat.tarifLabel+"</span></div>":"";
  const parts=[
    "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Contrat "+contrat.locNom+"</title>",
    "<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#111}",
    ".header{background:#0a1940;color:#fff;padding:14px 20px;text-align:center}",
    ".header h1{font-size:22px;letter-spacing:2px;margin-bottom:4px}.header p{font-size:9px;opacity:.8;margin:2px 0}",
    ".body{padding:14px 20px}.title{text-align:center;font-size:14px;font-weight:bold;margin:10px 0 6px;text-transform:uppercase;border-bottom:2px solid #0a1940;padding-bottom:6px}",
    ".st{font-size:11px;font-weight:bold;background:#e8edf5;padding:4px 8px;margin-bottom:5px;border-left:3px solid #0a1940}",
    ".row{display:flex;gap:20px;margin-bottom:3px}.row span{flex:1}.lbl{color:#555;font-size:10px}.val{font-weight:bold}",
    "hr{border:none;border-top:1px solid #ccc;margin:8px 0}",
    "table.ft{width:100%;border-collapse:collapse;font-size:10px;margin-top:5px}",
    "table.ft td{border:1px solid #ddd;padding:3px 6px}table.ft tr:nth-child(even){background:#f5f5f5}",
    ".cl{font-size:9.5px;margin-bottom:5px;line-height:1.5}.cl-t{font-weight:bold;font-size:10px}",
    ".sig-area{display:flex;justify-content:space-between;margin-top:16px;gap:30px}",
    ".sig-box{flex:1;text-align:center}.sig-box p{font-size:10px;font-weight:bold;margin-bottom:6px}",
    ".tot{background:#0a1940;color:#fff;padding:8px 14px;border-radius:6px;margin:8px 0;display:flex;justify-content:space-between;align-items:center}",
    "@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>",
    "<div class='header'><h1>"+(profil.entreprise||"MAN'S LOCATION")+"</h1><p>LOCATION DE CITADINES EN IDF</p>",
    "<p>SIRET : "+(profil.siret||profil.siren)+" | T\u00e9l : "+profil.tel+" | "+profil.adresse+"</p></div>",
    "<div class='body'><div class='title'>Contrat de Location de V\u00e9hicule</div>",
    "<div style='margin-bottom:8px'><div class='st'>Le Propri\u00e9taire (Loueur)</div>",
    "<div class='row'><span><span class='lbl'>Nom : </span><span class='val'>"+profil.nom+"</span></span><span><span class='lbl'>T\u00e9l : </span><span class='val'>"+profil.tel+"</span></span></div>",
    "<div><span class='lbl'>Adresse : </span><span class='val'>"+profil.adresse+"</span></div></div>",
    "<div style='margin-bottom:8px'><div class='st'>Le Locataire</div>",
    "<div class='row'><span><span class='lbl'>Nom : </span><span class='val'>"+contrat.locNom.toUpperCase()+"</span></span><span><span class='lbl'>T\u00e9l : </span><span class='val'>"+contrat.locTel+"</span></span></div>",
    "<div><span class='lbl'>Adresse : </span><span class='val'>"+contrat.locAdresse+"</span></div>",
    permisHtml+"</div><hr>",
    "<div style='margin-bottom:8px'><div class='st'>1. V\u00e9hicule</div>",
    "<div class='row'><span><span class='lbl'>Marque : </span><span class='val'>"+vehicle.marque+"</span></span><span><span class='lbl'>Mod\u00e8le : </span><span class='val'>"+vehicle.modele+"</span></span><span><span class='lbl'>Immat : </span><span class='val'>"+vehicle.immat+"</span></span></div>",
    "<div class='row'><span><span class='lbl'>Couleur : </span><span class='val'>"+vehicle.couleur+"</span></span><span><span class='lbl'>Km d\u00e9part : </span><span class='val'>"+(contrat.kmDepart||vehicle.km)+" km</span></span></div>",
    kmRow+fuelBar+etatHtml+photosHtml+"</div>",
    "<div style='margin-bottom:8px'><div class='st'>2. Dur\u00e9e &amp; Tarif</div>",
    "<div class='row'><span><span class='lbl'>D\u00e9but : </span><span class='val'>"+contrat.dateDebut+" \u00e0 "+contrat.heureDebut+"</span></span><span><span class='lbl'>Fin : </span><span class='val'>"+contrat.dateFin+" \u00e0 "+contrat.heureFin+"</span></span><span><span class='lbl'>Dur\u00e9e : </span><span class='val'>"+nb+" jour(s)</span></span></div>",
    tarifHtml+"<p style='margin-top:4px;font-size:9.5px;color:#555'>Tout retard = 20 \u20ac/heure.</p></div>",
    "<div style='margin-bottom:8px'><div class='st'>3. Paiement</div>",
    "<div class='tot'><span>Total location</span><strong>"+total+" \u20ac</strong></div>",
    "<div>["+(pm==="especes"?"X":" ")+"] Esp\u00e8ces &nbsp; ["+(pm==="virement"?"X":" ")+"] Virement &nbsp; ["+(pm==="autre"?"X":" ")+"] Autre</div></div>",
    "<div style='margin-bottom:8px'><div class='st'>4. Caution \u2014 "+vehicle.caution+" \u20ac ("+cautionMode+")</div>",
    "<p>Une caution de <strong>"+vehicle.caution+" \u20ac</strong> est vers\u00e9e avant remise des cl\u00e9s. <strong>Mode : "+cautionMode+"</strong></p>",
    "<table class='ft'><tr style='background:#e8edf5;font-weight:bold'><td colspan='2'>Frais d\u00e9ductibles sur la caution</td></tr>"+fraisRows+"</table></div>",
    "<div style='margin-bottom:8px'><div class='st'>5. Assurance et Responsabilit\u00e9</div>",
    "<p>Le v\u00e9hicule est assur\u00e9 pour le pr\u00eat \u00e0 titre gratuit. Le Loueur d\u00e9cline toute responsabilit\u00e9.</p></div>",
    "<div style='margin-bottom:8px'><div class='st'>Clauses Particuli\u00e8res</div>"+clausesHtml+"</div>",
    "<hr><p style='font-size:10px;margin-bottom:12px'>Fait \u00e0 "+profil.ville+", le "+new Date().toLocaleDateString("fr-FR")+"</p>",
    "<div class='sig-area'><div class='sig-box'><p>Signature du Loueur ("+profil.nom+")</p>"+sL+"</div>",
    "<div class='sig-box'><p>Signature du Locataire ("+contrat.locNom+")</p>"+sLoc+"</div></div>",
    "</div></body></html>"
  ];
  return parts.join("");
}

function FuelGauge({value,onChange,readOnly}){
  const pct=parseInt(value)||0;
  const col=fuelColor(pct);
  const steps=[0,25,50,75,100];
  return(
    <div style={{userSelect:"none"}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
        <span style={{fontSize:18}}>⛽</span>
        <div style={{flex:1,background:"#e5e7eb",borderRadius:99,height:14,overflow:"hidden"}}>
          <div style={{width:pct+"%",background:col,height:"100%",borderRadius:99,transition:"width .2s"}}/>
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

function SigPad({label,onSave}){
  const ref=useRef(null),drawing=useRef(false);
  const[saved,setSaved]=useState(false);
  function pos(e,c){const r=c.getBoundingClientRect(),s=e.touches?e.touches[0]:e;return{x:s.clientX-r.left,y:s.clientY-r.top};}
  function start(e){drawing.current=true;const c=ref.current,ctx=c.getContext("2d"),p=pos(e,c);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault();}
  function draw(e){if(!drawing.current)return;const c=ref.current,ctx=c.getContext("2d"),p=pos(e,c);ctx.lineWidth=2;ctx.lineCap="round";ctx.strokeStyle="#1a1a2e";ctx.lineTo(p.x,p.y);ctx.stroke();e.preventDefault();}
  function stop(){drawing.current=false;}
  function clear(){ref.current.getContext("2d").clearRect(0,0,260,90);setSaved(false);onSave(null);}
  function save(){onSave(ref.current.toDataURL());setSaved(true);}
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
      <p style={{fontSize:12,fontWeight:600,color:"#4b5563"}}>{label}</p>
      <canvas ref={ref} width={260} height={90}
        style={{border:"2px dashed #d1d5db",borderRadius:8,background:"white",cursor:"crosshair",touchAction:"none"}}
        onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={clear} style={{padding:"4px 10px",background:"#e5e7eb",border:"none",borderRadius:6,cursor:"pointer",fontSize:11}}>Effacer</button>
        <button onClick={save} style={{padding:"4px 10px",background:saved?"#16a34a":"#2563eb",color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:11}}>{saved?"✓ OK":"Valider"}</button>
      </div>
    </div>
  );
}

function PhotosDepart({photos,setPhotos}){
  const labels=["Avant","Arrière","Côté gauche","Côté droit","Intérieur","Autre"];
  function addPhoto(label,file){
    if(!file)return;
    const r=new FileReader();
    r.onload=ev=>setPhotos(p=>[...p,{id:Date.now(),label,data:ev.target.result,name:file.name}]);
    r.readAsDataURL(file);
  }
  function pickFile(label){
    const i=document.createElement("input");i.type="file";i.accept="image/*";
    i.onchange=e=>addPhoto(label,e.target.files[0]);i.click();
  }
  function pickCamera(label){
    const i=document.createElement("input");i.type="file";i.accept="image/*";i.capture="environment";
    i.onchange=e=>addPhoto(label,e.target.files[0]);i.click();
  }
  function removePhoto(id){setPhotos(p=>p.filter(x=>x.id!==id));}
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:12}}>
        {labels.map(lb=>(
          <div key={lb} style={{display:"flex",flexDirection:"column",gap:4}}>
            <div style={{fontSize:10,fontWeight:600,color:"#6b7280",textAlign:"center"}}>{lb}</div>
            <button onClick={()=>pickFile(lb)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:4,background:"#1e3a8a",color:"white",borderRadius:8,padding:"6px 0",fontSize:10,fontWeight:700,cursor:"pointer",border:"none"}}>📁</button>
            <button onClick={()=>pickCamera(lb)} style={{background:"#7c3aed",color:"white",border:"none",borderRadius:8,padding:"5px 0",fontSize:10,fontWeight:700,cursor:"pointer"}}>📷</button>
          </div>
        ))}
      </div>
      {photos.length>0?(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8}}>
          {photos.map(p=>(
            <div key={p.id} style={{position:"relative",borderRadius:9,overflow:"hidden",border:"2px solid #e5e7eb"}}>
              <img src={p.data} alt={p.label} style={{width:"100%",height:80,objectFit:"cover",display:"block"}}/>
              <div style={{background:"rgba(0,0,0,.55)",color:"white",fontSize:9,fontWeight:600,padding:"2px 5px",position:"absolute",bottom:0,left:0,right:0,textAlign:"center"}}>{p.label}</div>
              <button onClick={()=>removePhoto(p.id)} style={{position:"absolute",top:3,right:3,background:"#ef4444",color:"white",border:"none",borderRadius:"50%",width:18,height:18,fontSize:11,cursor:"pointer",fontWeight:700,lineHeight:"18px",textAlign:"center",padding:0}}>×</button>
            </div>
          ))}
        </div>
      ):(
        <div style={{textAlign:"center",color:"#9ca3af",fontSize:12,padding:12,background:"#f9fafb",borderRadius:8,border:"1px dashed #d1d5db"}}>
          Aucune photo — utilisez les boutons ci-dessus
        </div>
      )}
    </div>
  );
}

function RetourModal({contrat,vehicle,onClose,onSave}){
  const initC={};RETOUR_CHECKS.forEach(c=>{initC[c.id]=null;});
  const initCar={};CARRO_ELEMENTS.forEach(e=>{initCar[e.id]=null;});
  const[checks,setChecks]=useState(initC);
  const[carro,setCarro]=useState(initCar);
  const[carroPhotos,setCarroPhotos]=useState({});
  const[carroNotes,setCarroNotes]=useState({});
  const[photos,setPhotos]=useState({});
  const[notes,setNotes]=useState({});
  const[cautionRestituee,setCautionRestituee]=useState(null);
  const[montantRetenu,setMontantRetenu]=useState("");
  const[raisonRetenue,setRaisonRetenue]=useState("");
  const[kmRetour,setKmRetour]=useState("");
  const[carburantRetour,setCarburantRetour]=useState(contrat.carburantDepart||100);
  const[tab,setTab]=useState("km");
  const caution=vehicle?.caution||0;
  const retenu=parseFloat(montantRetenu)||0;
  const kmDep=parseFloat(contrat.kmDepart||vehicle?.km||0);
  const kmRet=parseFloat(kmRetour)||0;
  const kmParcourus=kmRet>0?kmRet-kmDep:0;
  const kmInclus=parseFloat(vehicle?.kmInclus||0);
  const prixKmSup=parseFloat(vehicle?.prixKmSup||0);
  const kmSup=Math.max(0,kmParcourus-kmInclus);
  const surplusKm=kmSup*prixKmSup;
  const zones=[...new Set(CARRO_ELEMENTS.map(e=>e.zone))];
  const nbNOK=CARRO_ELEMENTS.filter(e=>carro[e.id]===false).length;
  const IS={width:"100%",border:"1px solid #d1d5db",borderRadius:7,padding:"6px 9px",fontSize:12,boxSizing:"border-box"};

  function handlePhoto(id,file,setter){
    if(!file)return;
    const r=new FileReader();
    r.onload=ev=>setter(p=>({...p,[id]:ev.target.result}));
    r.readAsDataURL(file);
  }
  function pickFile(id,setter){
    const i=document.createElement("input");i.type="file";i.accept="image/*";
    i.onchange=e=>handlePhoto(id,e.target.files[0],setter);i.click();
  }
  function pickCamera(id,setter){
    const i=document.createElement("input");i.type="file";i.accept="image/*";i.capture="environment";
    i.onchange=e=>handlePhoto(id,e.target.files[0],setter);i.click();
  }

  function save(){
    if(cautionRestituee===null){alert("Précisez si la caution est restituée.");return;}
    onSave({checks,carro,carroPhotos,carroNotes,photos,notes,cautionRestituee,montantRetenu:retenu,raisonRetenue,rembourse:cautionRestituee?caution:Math.max(0,caution-retenu),kmRetour,kmSup,surplusKm,carburantRetour,date:new Date().toISOString()});
  }

  const TABS=[["km","📏 Km"],["carro","🚗 Carrosserie"],["checks","✅ État"],["caution","🔒 Caution"]];

  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div style={{background:"#f8fafc",borderRadius:18,width:"100%",maxWidth:640,maxHeight:"93vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:"white",fontWeight:800,fontSize:15}}>🔄 Retour — {contrat.locNom}</div>
          <div style={{color:"rgba(255,255,255,.65)",fontSize:11}}>{vehicle?.marque} {vehicle?.modele} · {vehicle?.immat}</div></div>
          <button onClick={onClose} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:"white"}}>×</button>
        </div>
        <div style={{display:"flex",background:"white",borderBottom:"1px solid #e5e7eb"}}>
          {TABS.map(([id,lb])=>(
            <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"9px 4px",fontSize:11,fontWeight:tab===id?700:400,color:tab===id?"#2563eb":"#6b7280",background:"none",border:"none",borderBottom:tab===id?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}}>{lb}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:14}}>
          {tab==="km"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>📏 Kilométrage</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                  <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Km au départ</div><div style={{padding:"8px 10px",background:"#f3f4f6",borderRadius:8,fontSize:14,fontWeight:700}}>{contrat.kmDepart||vehicle?.km||"—"} km</div></div>
                  <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Km au retour</div><input type="number" style={IS} placeholder="ex: 55350" value={kmRetour} onChange={e=>setKmRetour(e.target.value)}/></div>
                </div>
                {kmRetour&&(
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    <div style={{background:"#eff6ff",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>Parcourus</div><div style={{fontWeight:800,fontSize:16,color:"#2563eb"}}>{kmParcourus} km</div></div>
                    <div style={{background:kmSup>0?"#fef3c7":"#f0fdf4",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>Surplus ({kmInclus} inclus)</div><div style={{fontWeight:800,fontSize:16,color:kmSup>0?"#d97706":"#16a34a"}}>{kmSup} km</div></div>
                    <div style={{background:surplusKm>0?"#fef2f2":"#f0fdf4",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>À facturer</div><div style={{fontWeight:800,fontSize:16,color:surplusKm>0?"#dc2626":"#16a34a"}}>{surplusKm.toFixed(2)} €</div></div>
                  </div>
                )}
              </div>
              <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>⛽ Carburant retour</div>
                <div style={{fontSize:11,color:"#6b7280",marginBottom:8}}>Départ : <b>{contrat.carburantDepart||100}% — {fuelLabel(contrat.carburantDepart||100)}</b></div>
                <FuelGauge value={carburantRetour} onChange={setCarburantRetour}/>
              </div>
              {surplusKm>0&&<div style={{background:"#fef3c7",borderRadius:10,padding:12,border:"1px solid #fde68a",fontSize:12,color:"#92400e",fontWeight:600}}>⚠️ {kmSup} km × {prixKmSup} €/km = <strong>{surplusKm.toFixed(2)} €</strong> à facturer</div>}
            </div>
          )}
          {tab==="carro"&&(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontWeight:700,fontSize:13}}>🚗 Carrosserie ({nbNOK} dégât{nbNOK>1?"s":""})</div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={()=>{const n={};CARRO_ELEMENTS.forEach(e=>{n[e.id]=true;});setCarro(n);}} style={{padding:"5px 10px",background:"#16a34a",color:"white",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>✓ Tout OK</button>
                  <button onClick={()=>{const n={};CARRO_ELEMENTS.forEach(e=>{n[e.id]=null;});setCarro(n);}} style={{padding:"5px 10px",background:"#e5e7eb",color:"#374151",border:"none",borderRadius:7,fontSize:11,cursor:"pointer"}}>↺ Reset</button>
                </div>
              </div>
              {zones.map(zone=>(
                <div key={zone} style={{marginBottom:12}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#6b7280",marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>{zone}</div>
                  {CARRO_ELEMENTS.filter(e=>e.zone===zone).map(el=>{
                    const val=carro[el.id];
                    return(
                      <div key={el.id} style={{borderRadius:9,border:`2px solid ${val===true?"#16a34a":val===false?"#ef4444":"#e5e7eb"}`,background:val===true?"#f0fdf4":val===false?"#fef2f2":"white",marginBottom:5,overflow:"hidden"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px"}}>
                          <span style={{flex:1,fontSize:12}}>{el.label}</span>
                          <button onClick={()=>setCarro(c=>({...c,[el.id]:true}))} style={{padding:"4px 12px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:val===true?"#16a34a":"#e5e7eb",color:val===true?"white":"#374151"}}>✓ OK</button>
                          <button onClick={()=>setCarro(c=>({...c,[el.id]:false}))} style={{padding:"4px 12px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:val===false?"#ef4444":"#e5e7eb",color:val===false?"white":"#374151"}}>✗ NON</button>
                        </div>
                        {val===false&&(
                          <div style={{padding:"0 10px 10px",borderTop:"1px solid #fecaca"}}>
                            <input style={{...IS,marginTop:8,marginBottom:6,background:"white"}} placeholder="Décrire le dégât..." value={carroNotes[el.id]||""} onChange={e=>setCarroNotes(n=>({...n,[el.id]:e.target.value}))}/>
                            <div style={{display:"flex",gap:6}}>
                              <button onClick={()=>pickFile(el.id,setCarroPhotos)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:"#1e3a8a",color:"white",borderRadius:7,padding:"6px 0",fontSize:11,fontWeight:700,cursor:"pointer",border:"none"}}>📁 Photo</button>
                              <button onClick={()=>pickCamera(el.id,setCarroPhotos)} style={{flex:1,background:"#7c3aed",color:"white",border:"none",borderRadius:7,padding:"6px 0",fontSize:11,fontWeight:700,cursor:"pointer"}}>📷 Caméra</button>
                            </div>
                            {carroPhotos[el.id]&&<div style={{marginTop:7,position:"relative",display:"inline-block"}}><img src={carroPhotos[el.id]} alt="" style={{maxWidth:"100%",maxHeight:120,borderRadius:7,border:"2px solid #fca5a5"}}/><button onClick={()=>setCarroPhotos(p=>{const n={...p};delete n[el.id];return n;})} style={{position:"absolute",top:3,right:3,background:"#ef4444",color:"white",border:"none",borderRadius:"50%",width:20,height:20,fontSize:11,cursor:"pointer",fontWeight:700}}>×</button></div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {tab==="checks"&&(
            <div>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>✅ Vérifications générales</div>
              {RETOUR_CHECKS.map(chk=>{
                const val=checks[chk.id];
                return(
                  <div key={chk.id} style={{borderRadius:10,border:`2px solid ${val===true?"#16a34a":val===false?"#ef4444":"#e5e7eb"}`,background:val===true?"#f0fdf4":val===false?"#fef2f2":"white",marginBottom:8,overflow:"hidden"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px"}}>
                      <span style={{fontSize:20,flexShrink:0}}>{chk.icon}</span>
                      <span style={{flex:1,fontWeight:600,fontSize:12}}>{chk.label}</span>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>setChecks(c=>({...c,[chk.id]:true}))} style={{padding:"5px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:val===true?"#16a34a":"#e5e7eb",color:val===true?"white":"#374151"}}>✓ Oui</button>
                        <button onClick={()=>setChecks(c=>({...c,[chk.id]:false}))} style={{padding:"5px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:val===false?"#ef4444":"#e5e7eb",color:val===false?"white":"#374151"}}>✗ Non</button>
                      </div>
                    </div>
                    {val===false&&(
                      <div style={{padding:"0 12px 12px",borderTop:"1px solid #fecaca"}}>
                        <input style={{...IS,marginTop:8,marginBottom:6,background:"white"}} placeholder="Décrire..." value={notes[chk.id]||""} onChange={e=>setNotes(n=>({...n,[chk.id]:e.target.value}))}/>
                        <div style={{display:"flex",gap:7}}>
                          <button onClick={()=>pickFile(chk.id,setPhotos)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:5,background:"#1e3a8a",color:"white",borderRadius:8,padding:"7px 0",fontSize:11,fontWeight:700,cursor:"pointer",border:"none"}}>📁 Galerie</button>
                          <button onClick={()=>pickCamera(chk.id,setPhotos)} style={{flex:1,background:"#7c3aed",color:"white",border:"none",borderRadius:8,padding:"7px 0",fontSize:11,fontWeight:700,cursor:"pointer"}}>📷 Photo</button>
                        </div>
                        {photos[chk.id]&&<div style={{marginTop:8,position:"relative",display:"inline-block"}}><img src={photos[chk.id]} alt="" style={{maxWidth:"100%",maxHeight:140,borderRadius:8,border:"2px solid #fca5a5"}}/><button onClick={()=>setPhotos(p=>{const n={...p};delete n[chk.id];return n;})} style={{position:"absolute",top:4,right:4,background:"#ef4444",color:"white",border:"none",borderRadius:"50%",width:22,height:22,fontSize:12,cursor:"pointer",fontWeight:700}}>×</button></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {tab==="caution"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {surplusKm>0&&<div style={{background:"#fef3c7",borderRadius:10,padding:10,border:"1px solid #fde68a",fontSize:12,color:"#92400e",fontWeight:600}}>⚠️ Km en trop : +{surplusKm.toFixed(2)} € à facturer</div>}
              <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>🔒 Caution — {caution} €</div>
                <div style={{fontSize:11,color:"#6b7280",marginBottom:12}}>La caution est-elle restituée intégralement ?</div>
                <div style={{display:"flex",gap:10,marginBottom:12}}>
                  <button onClick={()=>{setCautionRestituee(true);setMontantRetenu("");setRaisonRetenue("");}} style={{flex:1,padding:"12px 0",borderRadius:10,border:`2px solid ${cautionRestituee===true?"#16a34a":"#e5e7eb"}`,background:cautionRestituee===true?"#16a34a":"white",color:cautionRestituee===true?"white":"#374151",fontWeight:800,fontSize:13,cursor:"pointer"}}>✅ Oui<br/><span style={{fontSize:10,fontWeight:400}}>{caution} € remboursés</span></button>
                  <button onClick={()=>setCautionRestituee(false)} style={{flex:1,padding:"12px 0",borderRadius:10,border:`2px solid ${cautionRestituee===false?"#ef4444":"#e5e7eb"}`,background:cautionRestituee===false?"#ef4444":"white",color:cautionRestituee===false?"white":"#374151",fontWeight:800,fontSize:13,cursor:"pointer"}}>❌ Non<br/><span style={{fontSize:10,fontWeight:400}}>Retenue partielle</span></button>
                </div>
                {cautionRestituee===false&&(
                  <div style={{background:"#fef2f2",borderRadius:10,padding:12,border:"1px solid #fecaca",display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Montant retenu (€)</div><input type="number" style={{...IS,background:"white"}} placeholder="ex: 300" value={montantRetenu} onChange={e=>setMontantRetenu(e.target.value)} max={caution}/></div>
                      <div style={{display:"flex",alignItems:"flex-end"}}><div style={{width:"100%",background:"#fee2e2",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:10,color:"#dc2626"}}>Remboursé</div><div style={{fontSize:18,fontWeight:800,color:"#dc2626"}}>{Math.max(0,caution-retenu)} €</div></div></div>
                    </div>
                    <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Motif *</div><input style={{...IS,background:"white"}} placeholder="ex: Rayure aile avant..." value={raisonRetenue} onChange={e=>setRaisonRetenue(e.target.value)}/></div>
                  </div>
                )}
                {cautionRestituee===true&&<div style={{background:"#f0fdf4",borderRadius:10,padding:12,border:"1px solid #bbf7d0",textAlign:"center"}}><div style={{fontSize:11,color:"#16a34a",fontWeight:600}}>Caution remboursée intégralement</div><div style={{fontSize:22,fontWeight:900,color:"#16a34a"}}>{caution} €</div></div>}
              </div>
              {cautionRestituee!==null&&(
                <div style={{background:"#1e3a8a",borderRadius:12,padding:14,color:"white"}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>📊 Bilan du retour</div>
                  <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:12}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Loyer de base</span><span style={{fontWeight:700}}>{contrat.totalCalc||0} €</span></div>
                    {surplusKm>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Surplus km</span><span style={{fontWeight:700,color:"#fbbf24"}}>+{surplusKm.toFixed(2)} €</span></div>}
                    {retenu>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Retenue caution</span><span style={{fontWeight:700,color:"#fbbf24"}}>+{retenu} €</span></div>}
                    <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.2)",paddingTop:6,marginTop:4}}><span style={{fontWeight:700}}>Total encaissé</span><span style={{fontWeight:900,fontSize:16,color:"#4ade80"}}>{(contrat.totalCalc||0)+surplusKm+retenu} €</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{padding:"12px 16px",borderTop:"1px solid #e5e7eb",display:"flex",gap:8,background:"white"}}>
          <button onClick={save} disabled={cautionRestituee===null} style={{flex:1,background:cautionRestituee!==null?"#16a34a":"#9ca3af",color:"white",border:"none",borderRadius:10,padding:12,fontSize:13,fontWeight:700,cursor:cautionRestituee!==null?"pointer":"not-allowed"}}>✅ Valider le retour</button>
          <button onClick={onClose} style={{padding:"12px 16px",background:"#e5e7eb",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

function ContratModal({vehicle,onClose,onSave}){
  const[frais,setFrais]=useState(vehicle.frais.map(f=>({...f})));
  const[clauses,setClauses]=useState(vehicle.clauses.map(c=>({...c})));
  const[nf,setNf]=useState({label:"",montant:""});
  const[nc,setNc]=useState({titre:"",texte:""});
  const[tab,setTab]=useState("frais");
  const IS={width:"100%",border:"1px solid #d1d5db",borderRadius:6,padding:"6px 8px",fontSize:12,boxSizing:"border-box"};
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:640,height:"85vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <b style={{fontSize:14}}>📄 {vehicle.marque} {vehicle.modele} — Frais & Clauses</b>
          <button onClick={onClose} style={{fontSize:22,background:"none",border:"none",cursor:"pointer"}}>×</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #e5e7eb",padding:"0 18px"}}>
          {[["frais","💸 Frais"],["clauses","📋 Clauses"]].map(([id,lbl])=>(
            <button key={id} onClick={()=>setTab(id)} style={{padding:"10px 14px",fontSize:12,fontWeight:tab===id?700:400,color:tab===id?"#2563eb":"#6b7280",background:"none",border:"none",borderBottom:tab===id?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}}>{lbl}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {tab==="frais"&&<div>
            {frais.map(f=>(<div key={f.id} style={{display:"flex",gap:8,alignItems:"center",padding:8,background:"#f9fafb",borderRadius:8,marginBottom:6}}>
              <input style={{...IS,flex:1}} value={f.label} onChange={e=>setFrais(x=>x.map(a=>a.id===f.id?{...a,label:e.target.value}:a))}/>
              <input type="number" style={{...IS,width:70}} value={f.montant} onChange={e=>setFrais(x=>x.map(a=>a.id===f.id?{...a,montant:parseFloat(e.target.value)||0}:a))}/>
              <span style={{fontSize:11}}>€</span>
              <button onClick={()=>setFrais(x=>x.filter(a=>a.id!==f.id))} style={{padding:"3px 7px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:5,cursor:"pointer"}}>🗑️</button>
            </div>))}
            <div style={{background:"#eff6ff",borderRadius:10,padding:12,border:"1px solid #bfdbfe",marginTop:8}}>
              <div style={{display:"flex",gap:8}}>
                <input style={{...IS,flex:1}} placeholder="Libellé" value={nf.label} onChange={e=>setNf(x=>({...x,label:e.target.value}))}/>
                <input type="number" style={{...IS,width:80}} placeholder="Montant" value={nf.montant} onChange={e=>setNf(x=>({...x,montant:e.target.value}))}/>
                <button onClick={()=>{if(!nf.label||!nf.montant)return;setFrais(x=>[...x,{id:Date.now(),label:nf.label,montant:parseFloat(nf.montant)}]);setNf({label:"",montant:""}); }} style={{background:"#1d4ed8",color:"white",border:"none",borderRadius:7,padding:"6px 11px",fontWeight:700,cursor:"pointer"}}>+</button>
              </div>
            </div>
          </div>}
          {tab==="clauses"&&<div>
            {clauses.map((c,i)=>(<div key={c.id} style={{padding:10,background:"#f9fafb",borderRadius:10,border:"1px solid #e5e7eb",marginBottom:8}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:10,background:"#dbeafe",color:"#1d4ed8",fontWeight:700,padding:"2px 7px",borderRadius:999}}>{i+6}</span>
                <input style={{...IS,flex:1,fontWeight:600}} value={c.titre} onChange={e=>setClauses(x=>x.map(a=>a.id===c.id?{...a,titre:e.target.value}:a))}/>
                <button onClick={()=>setClauses(x=>x.filter(a=>a.id!==c.id))} style={{padding:"3px 7px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:5,cursor:"pointer"}}>🗑️</button>
              </div>
              <textarea style={{...IS,resize:"vertical",minHeight:50,fontFamily:"inherit"}} value={c.texte} onChange={e=>setClauses(x=>x.map(a=>a.id===c.id?{...a,texte:e.target.value}:a))}/>
            </div>))}
            <div style={{background:"#eff6ff",borderRadius:10,padding:12,border:"1px solid #bfdbfe"}}>
              <input style={{...IS,marginBottom:6}} placeholder="Titre" value={nc.titre} onChange={e=>setNc(x=>({...x,titre:e.target.value}))}/>
              <textarea style={{...IS,resize:"vertical",minHeight:50,fontFamily:"inherit"}} placeholder="Texte..." value={nc.texte} onChange={e=>setNc(x=>({...x,texte:e.target.value}))}/>
              <button onClick={()=>{if(!nc.titre||!nc.texte)return;setClauses(x=>[...x,{id:Date.now(),titre:nc.titre,texte:nc.texte}]);setNc({titre:"",texte:""});}} style={{marginTop:8,background:"#1d4ed8",color:"white",border:"none",borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
            </div>
          </div>}
        </div>
        <div style={{padding:"12px 16px",borderTop:"1px solid #e5e7eb",display:"flex",gap:8}}>
          <button onClick={()=>onSave(frais,clauses)} style={{flex:1,background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>✅ Enregistrer</button>
          <button onClick={onClose} style={{padding:"10px 16px",background:"#e5e7eb",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

function Badge({s}){
  return s==="loué"
    ?<span style={{padding:"2px 8px",fontSize:10,background:"#fef2f2",color:"#dc2626",borderRadius:999,fontWeight:700}}>Loué</span>
    :<span style={{padding:"2px 8px",fontSize:10,background:"#f0fdf4",color:"#16a34a",borderRadius:999,fontWeight:700}}>Disponible</span>;
}

function calcTarifAuto(vehicle,nbJours,heuresLoc){
  if(!vehicle)return{prix:0,label:"—"};
  const h=heuresLoc||nbJours*24;
  const specials=(vehicle.tarifsSpeciaux||[]).slice().sort((a,b)=>{
    const ha=TARIFS_PRESETS.find(p=>p.type===a.type)?.heures||9999;
    const hb=TARIFS_PRESETS.find(p=>p.type===b.type)?.heures||9999;
    return ha-hb;
  });
  for(const t of specials){
    const preset=TARIFS_PRESETS.find(p=>p.type===t.type);
    if(preset&&h<=preset.heures){
      const prix=t.unite==="forfait"?parseFloat(t.prix):parseFloat(t.prix)*nbJours;
      return{prix,label:`${t.label||t.type} — ${t.prix} €`};
    }
  }
  return{prix:(vehicle.tarif||0)*nbJours,label:`Standard — ${vehicle.tarif} €/j × ${nbJours}j`};
}

function AppContent(){
  const[user,setUser]=useState(null);
  const[vehicles,setVehicles]=useState(INIT_V);
  const[contrats,setContrats]=useState([]);
  const[depenses,setDepenses]=useState([]);
  const[profil,setProfil]=useState(INIT_PROFIL);
  const[page,setPage]=useState("dashboard");
  const[selId,setSelId]=useState(null);
  const FORM0={locNom:"",locAdresse:"",locTel:"",locEmail:"",locPermis:"",dateDebut:"",heureDebut:"10:00",dateFin:"",heureFin:"10:00",paiement:"especes",cautionMode:"especes",kmDepart:"",nbJours:1,heuresLoc:24,carburantDepart:100,exterieurPropre:null,interieurPropre:null};
  const[form,setForm]=useState(FORM0);
  const[photosDepart,setPhotosDepart]=useState([]);
  const[touched,setTouched]=useState({});
  const[sigL,setSigL]=useState(null);
  const[sigLoc,setSigLoc]=useState(null);
  const[vForm,setVForm]=useState({marque:"",modele:"",immat:"",couleur:"",annee:"",km:"",tarif:"",caution:"",kmInclus:"",prixKmSup:"",kmIllimite:false});
  const[showAddV,setShowAddV]=useState(false);
  const[editV,setEditV]=useState(null);
  const[toast,setToast]=useState(null);
  const[planMonth,setPlanMonth]=useState(new Date());
  const[dForm,setDForm]=useState({label:"",montant:"",categorie:"Carburant",date:new Date().toISOString().slice(0,10),vehicleId:""});
  const[showAddD,setShowAddD]=useState(false);
  const[profilEdit,setProfilEdit]=useState(false);
  const[profilForm,setProfilForm]=useState(INIT_PROFIL);
  const[docsId,setDocsId]=useState(null);
  const[contratModalId,setContratModalId]=useState(null);
  const[newDoc,setNewDoc]=useState({type:"Carte grise",nom:"",expiration:"",file:null,fileData:null});
  const[lastContrat,setLastContrat]=useState(null);
  const[retourContratId,setRetourContratId]=useState(null);
  const[retours,setRetours]=useState({});
  const[tarifsVehicleId,setTarifsVehicleId]=useState(null);
  const[tarifsTemp,setTarifsTemp]=useState([]);
  const[ntarif,setNtarif]=useState({type:"Week-end (48h)",label:"",prix:"",unite:"forfait"});
  const[dataLoaded,setDataLoaded]=useState(false);

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>setUser(session?.user||null));
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user||null));
    return()=>subscription.unsubscribe();
  },[]);

  const loadAllData=useCallback(async(uid)=>{
    try{
      const[profRes,vehRes,conRes,depRes,retRes]=await Promise.all([
        supabase.from('profils').select('*').eq('user_id',uid).maybeSingle(),
        supabase.from('vehicules').select('*').eq('user_id',uid),
        supabase.from('contrats').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
        supabase.from('depenses').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
        supabase.from('retours').select('*').eq('user_id',uid),
      ]);
      if(profRes.data){
        const p=profRes.data;
        setProfil({nom:p.nom||'',entreprise:p.entreprise||'',siren:p.siren||'',siret:p.siret||'',kbis:p.kbis||'',tel:p.tel||'',whatsapp:p.whatsapp||'',snap:p.snap||'',email:p.email||'',adresse:p.adresse||'',ville:p.ville||'',iban:p.iban||''});
      }
      if(vehRes.data){
        setVehicles(vehRes.data.map(v=>({
          id:v.id,marque:v.marque||'',modele:v.modele||'',immat:v.immat||'',couleur:v.couleur||'',
          annee:v.annee||'',km:v.km||0,tarif:v.tarif||0,caution:v.caution||1000,
          kmInclus:v.km_inclus||0,prixKmSup:v.prix_km_sup||0,kmIllimite:v.km_illimite||false,
          docs:v.docs||[],frais:v.frais||DEF_FRAIS.map(f=>({...f})),
          clauses:v.clauses||DEF_CLAUSES.map(c=>({...c})),
          tarifsSpeciaux:v.tarifs_speciaux||[]
        })));
      }
      if(conRes.data){
        setContrats(conRes.data.map(c=>({
          id:c.id,locNom:c.loc_nom||'',locAdresse:c.loc_adresse||'',locTel:c.loc_tel||'',
          locEmail:c.loc_email||'',locPermis:c.loc_permis||'',
          dateDebut:c.date_debut||'',heureDebut:c.heure_debut||'10:00',
          dateFin:c.date_fin||'',heureFin:c.heure_fin||'10:00',
          paiement:c.paiement||'especes',cautionMode:c.caution_mode||'especes',
          kmDepart:c.km_depart||'',nbJours:c.nb_jours||1,heuresLoc:c.heures_loc||24,
          carburantDepart:c.carburant_depart??100,
          exterieurPropre:c.exterieur_propre,interieurPropre:c.interieur_propre,
          vehicleId:c.vehicle_id,vehicleLabel:c.vehicle_label||'',immat:c.immat||'',
          sigL:c.sig_l||null,sigLoc:c.sig_loc||null,
          totalCalc:c.total_calc||0,tarifLabel:c.tarif_label||'',
          photosDepart:c.photos_depart||[],
          fraisSnap:c.frais_snap||[],clausesSnap:c.clauses_snap||[],
          kmInclus:c.km_inclus,prixKmSup:c.prix_km_sup
        })));
      }
      if(depRes.data){
        setDepenses(depRes.data.map(d=>({
          id:d.id,label:d.label||'',montant:d.montant||0,
          categorie:d.categorie||'Carburant',date:d.date||'',vehicleId:d.vehicle_id||''
        })));
      }
      if(retRes.data){
        const rMap={};
        retRes.data.forEach(r=>{rMap[r.contrat_id]={
          id:r.id,
          kmRetour:r.km_retour||'',
          carburantRetour:r.carburant_retour??100,
          montantRetenu:r.montant_retenu||0,
          raisonRetenue:r.raison_retenue||'',
          rembourse:r.rembourse||0,
          kmSup:r.km_sup||0,
          surplusKm:r.surplus_km||0,
          cautionRestituee:r.caution_restituee,
          checks:r.checks||{},
          carro:r.carro||{},
          carroPhotos:r.carro_photos||{},
          carroNotes:r.carro_notes||{},
          photos:r.photos||{},
          notes:r.notes||{},
          date:r.date||''
        };});
        setRetours(rMap);
      }
    }catch(e){
      console.error('Error loading data from Supabase:',e);
    }finally{
      setDataLoaded(true);
    }
  },[]);

  useEffect(()=>{
    if(user){loadAllData(user.id);}else{setDataLoaded(false);}
  },[user,loadAllData]);

  const sel=selId?vehicles.find(v=>v.id===selId)||null:null;

  function toast_(msg,type="success"){setToast({msg,type});setTimeout(()=>setToast(null),3500);}

  function calcJ(d1,h1,d2,h2){
    if(!d1||!d2)return{jours:1,heures:24};
    const t1=new Date(`${d1}T${h1||"10:00"}`),t2=new Date(`${d2}T${h2||"10:00"}`);
    const diff=t2-t1;
    if(diff<=0)return{jours:1,heures:24};
    return{jours:Math.max(1,Math.ceil(diff/86400000)),heures:Math.ceil(diff/3600000)};
  }

  useEffect(()=>{
    if(form.dateDebut&&form.dateFin){
      const{jours,heures}=calcJ(form.dateDebut,form.heureDebut,form.dateFin,form.heureFin);
      setForm(f=>({...f,nbJours:jours,heuresLoc:heures}));
    }
  },[form.dateDebut,form.dateFin,form.heureDebut,form.heureFin]);

  const loues=contrats.filter(c=>new Date(c.dateFin)>=new Date()).map(c=>c.vehicleId);
  const statut=id=>loues.includes(id)?"loué":"disponible";

  const now=new Date(),mM=now.getMonth(),mA=now.getFullYear();
  const caT=contrats.reduce((s,c)=>s+(c.totalCalc||0),0);
  const caM=contrats.filter(c=>{const d=new Date(c.dateDebut);return d.getMonth()===mM&&d.getFullYear()===mA;}).reduce((s,c)=>s+(c.totalCalc||0),0);
  const dT=depenses.reduce((s,d)=>s+parseFloat(d.montant||0),0);
  const totalRetenues=Object.values(retours).reduce((s,r)=>s+(r.montantRetenu||0),0);
  const totalSurplusKm=Object.values(retours).reduce((s,r)=>s+(r.surplusKm||0),0);
  const bT=caT+totalRetenues+totalSurplusKm-dT;
  const cautionsNonRendues=contrats.filter(c=>!retours[c.id]).reduce((s,c)=>{
    const v=vehicles.find(x=>x.id===c.vehicleId);
    return s+(v?v.caution:0);
  },0);
  const tarifAuto=sel?calcTarifAuto(sel,form.nbJours,form.heuresLoc):{prix:0,label:"—"};

  const req=["locNom","locAdresse","locTel","dateDebut","dateFin"];
  const inv=k=>touched[k]&&!form[k];

  async function saveContrat(){
    const miss=req.filter(k=>!form[k]);
    if(!sel||miss.length>0){const t={};req.forEach(k=>t[k]=true);setTouched(t);toast_("Remplissez tous les champs obligatoires","error");return;}
    const ta=calcTarifAuto(sel,form.nbJours,form.heuresLoc);
    const c={id:Date.now(),...form,vehicleId:sel.id,vehicleLabel:sel.marque+" "+sel.modele,immat:sel.immat,sigL,sigLoc,
      totalCalc:ta.prix,tarifLabel:ta.label,photosDepart:[...photosDepart],
      fraisSnap:(sel.frais||DEF_FRAIS).map(f=>({...f})),clausesSnap:(sel.clauses||DEF_CLAUSES).map(cl=>({...cl})),
      kmInclus:sel.kmInclus,prixKmSup:sel.prixKmSup};
    setContrats(p=>[c,...p]);
    const html=buildContratHTML(c,sel,sigL,sigLoc,profil);
    setLastContrat({contrat:c,vehicle:sel,html});
    toast_("✅ Contrat créé !");
    setForm(FORM0);setTouched({});setSelId(null);setSigL(null);setSigLoc(null);setPhotosDepart([]);
    if(user){
      const{data:ins,error:err}=await supabase.from('contrats').insert([{
        user_id:user.id,loc_nom:c.locNom,loc_adresse:c.locAdresse,loc_tel:c.locTel,
        loc_email:c.locEmail,loc_permis:c.locPermis,
        date_debut:c.dateDebut,heure_debut:c.heureDebut,date_fin:c.dateFin,heure_fin:c.heureFin,
        paiement:c.paiement,caution_mode:c.cautionMode,km_depart:c.kmDepart,
        nb_jours:c.nbJours,heures_loc:c.heuresLoc,carburant_depart:c.carburantDepart,
        exterieur_propre:c.exterieurPropre,interieur_propre:c.interieurPropre,
        vehicle_id:c.vehicleId,vehicle_label:c.vehicleLabel,immat:c.immat,
        sig_l:c.sigL,sig_loc:c.sigLoc,total_calc:c.totalCalc,tarif_label:c.tarifLabel,
        photos_depart:c.photosDepart,frais_snap:c.fraisSnap,clauses_snap:c.clausesSnap,
        km_inclus:c.kmInclus,prix_km_sup:c.prixKmSup
      }]).select().single();
      if(!err&&ins){setContrats(p=>p.map(x=>x.id===c.id?{...x,id:ins.id}:x));}
      if(err)console.error('Error saving contrat:',err);
    }
  }

  function rePrint(c){
    const v=vehicles.find(x=>x.id===c.vehicleId)||{marque:"",modele:"",immat:"",couleur:"",km:0,tarif:0,caution:1000,frais:DEF_FRAIS,clauses:DEF_CLAUSES};
    const html=buildContratHTML(c,{...v,frais:c.fraisSnap||v.frais,clauses:c.clausesSnap||v.clauses},c.sigL,c.sigLoc,profil);
    dlFile(html,`Contrat_${c.locNom.replace(/\s+/g,"_")}_${c.dateDebut}.html`);
  }

  async function saveRetour(contratId,data){
    setRetours(r=>({...r,[contratId]:data}));
    const ct=contrats.find(c=>c.id===contratId);
    if(ct&&data.kmRetour){
      setVehicles(vs=>vs.map(v=>v.id===ct.vehicleId?{...v,km:parseFloat(data.kmRetour)}:v));
    }
    toast_("✅ Retour enregistré !");setRetourContratId(null);
    if(user){
      const{error:err}=await supabase.from('retours').insert([{
        user_id:user.id,contrat_id:contratId,
        km_retour:data.kmRetour||null,carburant_retour:data.carburantRetour??null,
        montant_retenu:data.montantRetenu||0,raison_retenue:data.raisonRetenue||'',
        rembourse:data.rembourse||0,km_sup:data.kmSup||0,surplus_km:data.surplusKm||0,
        caution_restituee:data.cautionRestituee,
        checks:data.checks||{},carro:data.carro||{},
        carro_photos:data.carroPhotos||{},carro_notes:data.carroNotes||{},
        photos:data.photos||{},notes:data.notes||'',
        date:data.date||new Date().toISOString()
      }]);
      if(err)console.error('Error saving retour:',err);
      if(ct&&data.kmRetour){
        await supabase.from('vehicules').update({km:parseFloat(data.kmRetour)}).eq('id',ct.vehicleId).eq('user_id',user.id);
      }
    }
  }

  async function addV(){
    if(!vForm.marque||!vForm.modele||!vForm.immat){toast_("Champs manquants","error");return;}
    const base={...vForm,km:+vForm.km,tarif:+vForm.tarif,caution:+vForm.caution||1000,kmInclus:+vForm.kmInclus||0,prixKmSup:+vForm.prixKmSup||0};
    if(editV){
      setVehicles(vs=>vs.map(x=>x.id===editV.id?{...x,...base}:x));toast_("Mis à jour");
      if(user){
        const{error:err}=await supabase.from('vehicules').update({
          marque:base.marque,modele:base.modele,immat:base.immat,couleur:base.couleur,
          annee:base.annee,km:base.km,tarif:base.tarif,caution:base.caution,
                  km_inclus:base.kmInclus,prix_km_sup:base.prixKmSup,km_illimite:base.kmIllimite
                }).eq('id',editV.id).eq('user_id',user.id);
        if(err)console.error('Error updating vehicle:',err);
      }
    }else{
      const localId=Date.now();
      const newV={id:localId,...base,docs:[],frais:DEF_FRAIS.map(f=>({...f})),clauses:DEF_CLAUSES.map(c=>({...c})),tarifsSpeciaux:[]};
      setVehicles(vs=>[...vs,newV]);toast_("Véhicule ajouté !");
      if(user){
        const{data:ins,error:err}=await supabase.from('vehicules').insert([{
          user_id:user.id,marque:base.marque,modele:base.modele,immat:base.immat,
          couleur:base.couleur,annee:base.annee,km:base.km,tarif:base.tarif,
          caution:base.caution,          km_inclus:base.kmInclus,prix_km_sup:base.prixKmSup,
                    km_illimite:base.kmIllimite,docs:[],
          frais:DEF_FRAIS.map(f=>({...f})),clauses:DEF_CLAUSES.map(c=>({...c})),
          tarifs_speciaux:[]
        }]).select().single();
        if(!err&&ins){setVehicles(vs=>vs.map(x=>x.id===localId?{...x,id:ins.id}:x));}
        if(err)console.error('Error adding vehicle:',err);
      }
    }
    setVForm({marque:"",modele:"",immat:"",couleur:"",annee:"",km:"",tarif:"",caution:"",kmInclus:"",prixKmSup:"",kmIllimite:false});setShowAddV(false);setEditV(null);
  }

  function openTarifs(v){setTarifsVehicleId(v.id);setTarifsTemp((v.tarifsSpeciaux||[]).map(t=>({...t})));setNtarif({type:"Week-end (48h)",label:"",prix:"",unite:"forfait"});}
  async function saveTarifs(){
    if(!tarifsVehicleId)return;
    setVehicles(vs=>vs.map(v=>v.id===tarifsVehicleId?{...v,tarifsSpeciaux:[...tarifsTemp]}:v));
    setTarifsVehicleId(null);toast_("Tarifs enregistrés !");
    if(user){
      const{error:err}=await supabase.from('vehicules').update({tarifs_speciaux:[...tarifsTemp]}).eq('id',tarifsVehicleId).eq('user_id',user.id);
      if(err)console.error('Error saving tarifs:',err);
    }
  }
  const tarifsVehicle=tarifsVehicleId?vehicles.find(v=>v.id===tarifsVehicleId):null;

  const isExp=exp=>exp&&new Date(exp)<new Date();
  const isSoon=exp=>{if(!exp)return false;const d=new Date(exp),n=new Date();return(d-n)/86400000<30&&(d-n)>0;};
  const getDays=date=>{const y=date.getFullYear(),m=date.getMonth();return Array.from({length:new Date(y,m+1,0).getDate()},(_,i)=>new Date(y,m,i+1));};
  const isBooked=(vid,date)=>contrats.some(c=>c.vehicleId===vid&&date>=new Date(c.dateDebut)&&date<=new Date(c.dateFin));
  const days=getDays(planMonth);

  const caP=Array.from({length:6},(_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-5+i);
    const m=d.getMonth(),a=d.getFullYear();
    const ca=contrats.filter(c=>{const cd=new Date(c.dateDebut);return cd.getMonth()===m&&cd.getFullYear()===a;}).reduce((s,c)=>s+(c.totalCalc||0),0);
    const dep=depenses.filter(dd=>{const dt=new Date(dd.date);return dt.getMonth()===m&&dt.getFullYear()===a;}).reduce((s,d)=>s+parseFloat(d.montant||0),0);
    return{label:d.toLocaleDateString("fr-FR",{month:"short"}),ca,dep};
  });
  const maxCA=Math.max(...caP.map(x=>Math.max(x.ca,x.dep)),1);

  const docsV=vehicles.find(v=>v.id===docsId);
  const contratV=vehicles.find(v=>v.id===contratModalId);
  const retourContrat=contrats.find(c=>c.id===retourContratId);
  const retourVehicle=retourContrat?vehicles.find(v=>v.id===retourContrat.vehicleId):null;

  const Inp=(ex={})=>({width:"100%",border:"1px solid #d1d5db",borderRadius:8,padding:"7px 10px",fontSize:12,boxSizing:"border-box",...ex});
  const LBL={fontSize:11,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3};

  const PAGES=[
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"vehicles",icon:"🚗",label:"Flotte"},
    {id:"nouveau",icon:"📝",label:"Contrat"},
    {id:"planning",icon:"📅",label:"Planning"},
    {id:"contrats",icon:"📋",label:"Contrats"},
    {id:"retours",icon:"🔄",label:"Retours"},
    {id:"finances",icon:"💰",label:"Finances"},
    {id:"profil",icon:"👤",label:"Profil"},
  ];

  function KPI(label,val,icon,color,sub,red){
    return(
      <div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.07)",borderLeft:`4px solid ${color}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><p style={{fontSize:10,color:"#6b7280",marginBottom:3}}>{label}</p><p style={{fontSize:20,fontWeight:800,color:red?"#dc2626":"#1f2937"}}>{val}</p>{sub&&<p style={{fontSize:10,color:"#9ca3af",marginTop:2}}>{sub}</p>}</div>
          <span style={{fontSize:22}}>{icon}</span>
        </div>
      </div>
    );
  }

  function F({k,label,type,span2}){
    return(
      <div style={span2?{gridColumn:"span 2"}:{}}>
        <label style={LBL}>{label}</label>
        <input type={type||"text"} placeholder={label}
          style={Inp(inv(k)?{borderColor:"#f87171",background:"#fef2f2"}:{})}
          value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
          onBlur={()=>{if(req.includes(k))setTouched(t=>({...t,[k]:true}));}}/>
        {inv(k)&&<p style={{color:"#ef4444",fontSize:10,marginTop:2}}>Obligatoire</p>}
      </div>
    );
  }

  function CheckBool({label,icon,val,onChange}){
    return(
      <div style={{borderRadius:10,border:`2px solid ${val===true?"#16a34a":val===false?"#ef4444":"#e5e7eb"}`,background:val===true?"#f0fdf4":val===false?"#fef2f2":"white",padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>{icon}</span>
        <span style={{flex:1,fontSize:12,fontWeight:600}}>{label}</span>
        <button onClick={()=>onChange(true)} style={{padding:"4px 10px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:val===true?"#16a34a":"#e5e7eb",color:val===true?"white":"#374151"}}>✓ Oui</button>
        <button onClick={()=>onChange(false)} style={{padding:"4px 10px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:val===false?"#ef4444":"#e5e7eb",color:val===false?"white":"#374151"}}>✗ Non</button>
      </div>
    );
  }

  // Docs: pick file helper
  function pickDocFile(e){
    const f=e.target.files[0];
    if(!f)return;
    const r=new FileReader();
    r.onload=ev=>setNewDoc(d=>({...d,file:f.name,fileData:ev.target.result}));
    r.readAsDataURL(f);
  }

  if(!user) return <AuthPage/>;
  if(!dataLoaded) return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"#f1f5f9"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:12}}>⏳</div>
        <p style={{color:"#6b7280",fontSize:14}}>Chargement des données...</p>
      </div>
    </div>
  );

  const profilVide=!profil.nom&&!profil.entreprise&&!profil.tel;
  if(profilVide) return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"#f1f5f9",padding:16}}>
      <div style={{background:"white",borderRadius:16,padding:"32px 28px",width:"100%",maxWidth:480,boxShadow:"0 4px 24px rgba(0,0,0,0.1)"}}>
        <h1 style={{textAlign:"center",marginBottom:6,fontSize:20,fontWeight:800}}>Bienvenue sur MAN'S LOCATION</h1>
        <p style={{textAlign:"center",color:"#6b7280",marginBottom:24,fontSize:13}}>Remplissez vos informations pour commencer</p>
        {[["nom","Nom complet *"],["entreprise","Nom de l'entreprise *"],["siren","SIREN"],["siret","SIRET"],["kbis","KBIS"],["tel","T\u00e9l\u00e9phone *"],["whatsapp","WhatsApp"],["snap","Snapchat"],["email","Email"],["adresse","Adresse"],["ville","Ville"],["iban","IBAN"]].map(([k,l])=>(
          <div key={k} style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3}}>{l}</label>
            <input placeholder={l.replace(" *","")} style={{width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,boxSizing:"border-box"}} value={profilForm[k]||""} onChange={e=>setProfilForm(p=>({...p,[k]:e.target.value}))}/>
          </div>
        ))}
        <button onClick={async()=>{if(!profilForm.nom||!profilForm.entreprise||!profilForm.tel){return;}setProfil({...profilForm});if(user){const{error:err}=await supabase.from('profils').upsert({user_id:user.id,...profilForm},{onConflict:'user_id'});if(err)console.error('Error saving profile:',err);}}} style={{width:"100%",padding:"12px",background:"#1d4ed8",color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8}}>
          Commencer
        </button>
        <button onClick={()=>supabase.auth.signOut()} style={{width:"100%",padding:"10px",background:"transparent",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:10,fontSize:12,cursor:"pointer",marginTop:8}}>Déconnexion</button>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#f0f4f8"}}>
      {/* NAV */}
      <nav style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",boxShadow:"0 2px 12px rgba(0,0,0,.3)",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 10px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <div style={{background:"white",borderRadius:6,padding:"2px 7px"}}><span style={{color:"#0a1940",fontWeight:900,fontSize:11,letterSpacing:1}}>MAN'S</span></div>
            <span style={{color:"white",fontWeight:700,fontSize:11}}>LOCATION</span>
          </div>
          <div style={{display:"flex",gap:1,flexWrap:"wrap"}}>
            {PAGES.map(p=>(
              <button key={p.id} onClick={()=>setPage(p.id)} style={{padding:"5px 7px",borderRadius:7,fontSize:11,fontWeight:page===p.id?700:400,background:page===p.id?"rgba(255,255,255,0.2)":"transparent",color:page===p.id?"white":"rgba(255,255,255,0.65)",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                <span style={{fontSize:14}}>{p.icon}</span>
                <span style={{fontSize:9}}>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {toast&&<div style={{position:"fixed",top:14,right:14,zIndex:10000,padding:"10px 16px",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.15)",color:"white",fontSize:12,fontWeight:600,background:toast.type==="error"?"#ef4444":"#16a34a",maxWidth:320}}>{toast.msg}</div>}

      {/* MODALS */}
      {contratModalId&&contratV&&<ContratModal vehicle={contratV} onClose={()=>setContratModalId(null)} onSave={async(fr,cl)=>{setVehicles(vs=>vs.map(v=>v.id===contratModalId?{...v,frais:fr,clauses:cl}:v));setContratModalId(null);toast_("Mis à jour !");if(user){const{error:err}=await supabase.from('vehicules').update({frais:fr,clauses:cl}).eq('id',contratModalId).eq('user_id',user.id);if(err)console.error('Error updating frais/clauses:',err);}}}/>}
      {retourContratId&&retourContrat&&<RetourModal contrat={retourContrat} vehicle={retourVehicle} onClose={()=>setRetourContratId(null)} onSave={data=>saveRetour(retourContratId,data)}/>}

      {/* Modal tarifs */}
      {tarifsVehicle&&(
        <div onClick={e=>{if(e.target===e.currentTarget)setTarifsVehicleId(null);}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"14px 18px",background:"#0a1940",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><b style={{fontSize:14,color:"white"}}>💰 Tarifs spéciaux</b><div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>{tarifsVehicle.marque} {tarifsVehicle.modele} · Standard : {tarifsVehicle.tarif} €/j</div></div>
              <button onClick={()=>setTarifsVehicleId(null)} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:"white"}}>×</button>
            </div>
            <div style={{background:"#fff7ed",padding:"8px 14px",fontSize:11,color:"#92400e",borderBottom:"1px solid #fed7aa"}}>
              💡 Tarifs appliqués <b>automatiquement</b> selon la durée de location.
            </div>
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              {tarifsTemp.length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:20,fontSize:13}}>Aucun tarif spécial</div>}
              {tarifsTemp.map(t=>(
                <div key={t.id} style={{display:"flex",gap:8,alignItems:"center",padding:10,background:"#f9fafb",borderRadius:10,marginBottom:7,border:"1px solid #e5e7eb"}}>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{t.label||t.type}</div><div style={{fontSize:11,color:"#6b7280"}}>{t.type} · {t.unite==="forfait"?"Forfait":"Par jour"}</div></div>
                  <input type="number" style={{width:75,border:"1px solid #d1d5db",borderRadius:6,padding:"5px 7px",fontSize:13,fontWeight:700}} value={t.prix} onChange={e=>setTarifsTemp(ts=>ts.map(x=>x.id===t.id?{...x,prix:e.target.value}:x))}/>
                  <span style={{fontSize:12,color:"#6b7280"}}>€</span>
                  <button onClick={()=>setTarifsTemp(ts=>ts.filter(x=>x.id!==t.id))} style={{padding:"4px 8px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer"}}>🗑️</button>
                </div>
              ))}
              <div style={{background:"#eff6ff",borderRadius:12,padding:14,border:"1px solid #bfdbfe",marginTop:8}}>
                <p style={{fontSize:12,fontWeight:700,color:"#1d4ed8",marginBottom:10}}>+ Nouveau tarif</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><label style={LBL}>Durée</label><select style={Inp()} value={ntarif.type} onChange={e=>setNtarif(x=>({...x,type:e.target.value}))}>{TARIFS_PRESETS.map(p=><option key={p.type}>{p.type}</option>)}</select></div>
                  <div><label style={LBL}>Nom affiché</label><input style={Inp()} placeholder="ex: WE 48h" value={ntarif.label} onChange={e=>setNtarif(x=>({...x,label:e.target.value}))}/></div>
                  <div><label style={LBL}>Prix (€)</label><input type="number" style={Inp()} placeholder="ex: 130" value={ntarif.prix} onChange={e=>setNtarif(x=>({...x,prix:e.target.value}))}/></div>
                  <div><label style={LBL}>Unité</label><select style={Inp()} value={ntarif.unite} onChange={e=>setNtarif(x=>({...x,unite:e.target.value}))}><option value="forfait">Forfait total</option><option value="jour">Par jour</option></select></div>
                </div>
                <button onClick={()=>{
                  if(!ntarif.prix||parseFloat(ntarif.prix)<=0){toast_("Entrez un prix valide","error");return;}
                  setTarifsTemp(ts=>[...ts,{id:Date.now(),...ntarif,label:ntarif.label||ntarif.type}]);
                  setNtarif({type:"Week-end (48h)",label:"",prix:"",unite:"forfait"});
                }} style={{width:"100%",background:"#1d4ed8",color:"white",border:"none",borderRadius:8,padding:"8px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
              </div>
            </div>
            <div style={{padding:"12px 16px",borderTop:"1px solid #e5e7eb",display:"flex",gap:8,background:"white"}}>
              <button onClick={saveTarifs} style={{flex:1,background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>✅ Enregistrer</button>
              <button onClick={()=>setTarifsVehicleId(null)} style={{padding:"10px 16px",background:"#e5e7eb",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal docs */}
      {docsId&&docsV&&(
        <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:18,width:"100%",maxWidth:600,maxHeight:"88vh",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><b>📁 {docsV.marque} {docsV.modele}</b><div style={{fontSize:10,color:"#9ca3af"}}>{docsV.immat}</div></div>
              <button onClick={()=>setDocsId(null)} style={{fontSize:22,background:"none",border:"none",cursor:"pointer"}}>×</button>
            </div>
            <div style={{overflowY:"auto",flex:1,padding:14}}>
              <div style={{background:"#eff6ff",borderRadius:10,padding:12,marginBottom:12,border:"1px solid #bfdbfe"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div><label style={LBL}>Type</label><select style={Inp()} value={newDoc.type} onChange={e=>setNewDoc(d=>({...d,type:e.target.value}))}>{DOC_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                  <div><label style={LBL}>Nom *</label><input style={Inp()} value={newDoc.nom} onChange={e=>setNewDoc(d=>({...d,nom:e.target.value}))}/></div>
                  <div><label style={LBL}>Expiration</label><input type="date" style={Inp()} value={newDoc.expiration} onChange={e=>setNewDoc(d=>({...d,expiration:e.target.value}))}/></div>
                  <div><label style={LBL}>Fichier</label><input type="file" accept=".pdf,image/*" style={{width:"100%",fontSize:11}} onChange={pickDocFile}/></div>
                </div>
                <button onClick={async()=>{if(!newDoc.nom){toast_("Donnez un nom","error");return;}const docEntry={id:Date.now(),...newDoc};const updatedDocs=[...(docsV.docs||[]),docEntry];setVehicles(vs=>vs.map(v=>v.id===docsId?{...v,docs:updatedDocs}:v));setNewDoc({type:"Carte grise",nom:"",expiration:"",file:null,fileData:null});toast_("Document ajouté !");if(user){const{error:err}=await supabase.from('vehicules').update({docs:updatedDocs}).eq('id',docsId).eq('user_id',user.id);if(err)console.error('Error adding doc:',err);}}} style={{marginTop:8,background:"#2563eb",color:"white",border:"none",borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
              </div>
              {(!docsV.docs||docsV.docs.length===0)
                ?<div style={{textAlign:"center",color:"#9ca3af",padding:24}}><div style={{fontSize:32}}>📂</div><p>Aucun document</p></div>
                :docsV.docs.map(doc=>{
                  const expired=isExp(doc.expiration),soon=isSoon(doc.expiration);
                  return(<div key={doc.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:10,border:`1px solid ${expired?"#fca5a5":soon?"#fde68a":"#e5e7eb"}`,background:expired?"#fef2f2":soon?"#fffbeb":"#f9fafb",marginBottom:6}}>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:18}}>📄</span>
                      <div><div style={{fontWeight:600,fontSize:12}}>{doc.nom}</div><div style={{fontSize:10,color:"#6b7280"}}>{doc.type}{doc.expiration&&<span style={{marginLeft:6,fontWeight:600,color:expired?"#dc2626":soon?"#d97706":"#16a34a"}}>{expired?"❌ ":"⏰ "}{doc.expiration}</span>}</div></div>
                    </div>
                    <div style={{display:"flex",gap:5}}>
                      {doc.fileData&&<button onClick={()=>{const a=document.createElement("a");a.href=doc.fileData;a.download=doc.file||doc.nom;a.click();}} style={{padding:"3px 7px",background:"#dbeafe",color:"#1d4ed8",border:"none",borderRadius:5,cursor:"pointer",fontSize:11}}>⬇️</button>}
                      <button onClick={async()=>{const updatedDocs=(docsV.docs||[]).filter(d=>d.id!==doc.id);setVehicles(vs=>vs.map(v=>v.id===docsId?{...v,docs:updatedDocs}:v));toast_("Supprimé");if(user){const{error:err}=await supabase.from('vehicules').update({docs:updatedDocs}).eq('id',docsId).eq('user_id',user.id);if(err)console.error('Error deleting doc:',err);}}} style={{padding:"3px 7px",background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:5,cursor:"pointer",fontSize:11}}>🗑️</button>
                    </div>
                  </div>);
                })
              }
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"16px 12px"}}>

        {/* DASHBOARD */}
        {page==="dashboard"&&(
          <div>
            <div style={{marginBottom:16}}>
              <h1 style={{fontSize:20,fontWeight:800,color:"#1f2937"}}>Bonjour, {profil.nom.split(" ")[0]} 👋</h1>
              <p style={{fontSize:12,color:"#6b7280",textTransform:"capitalize"}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:16}}>
              {KPI("CA Locations",caT+" €","💶","#2563eb","Ce mois : "+caM+" €")}
              {KPI("Extras",(totalRetenues+totalSurplusKm).toFixed(0)+" €","🔒","#d97706")}
              {KPI("Bénéfice net",bT.toFixed(0)+" €",bT>=0?"📈":"📉",bT>=0?"#16a34a":"#dc2626",null,bT<0)}
              {KPI("Véhicules",vehicles.length,"🚗","#7c3aed",vehicles.filter(v=>statut(v.id)==="loué").length+" en location")}
              {KPI("Cautions non rendues",cautionsNonRendues+" €","🔓","#dc2626",contrats.filter(c=>!retours[c.id]).length+" contrat(s) en attente")}
            </div>
            <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)",marginBottom:16}}>
              <div style={{display:"flex",gap:16,marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}><div style={{width:12,height:12,borderRadius:2,background:"#3b82f6"}}/>CA</div>
                <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}><div style={{width:12,height:12,borderRadius:2,background:"#f87171"}}/>Dépenses</div>
              </div>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:110}}>
                {caP.map((m,i)=>(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:88}}>
                      <div style={{flex:1,borderRadius:"3px 3px 0 0",background:"#3b82f6",height:(m.ca/maxCA*88)+"px",minHeight:m.ca>0?3:0}}/>
                      <div style={{flex:1,borderRadius:"3px 3px 0 0",background:"#f87171",height:(m.dep/maxCA*88)+"px",minHeight:m.dep>0?3:0}}/>
                    </div>
                    <span style={{fontSize:9,color:"#6b7280",textTransform:"capitalize"}}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
              <div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <h2 style={{fontWeight:700,marginBottom:10,fontSize:14}}>🚗 Flotte</h2>
                {vehicles.map(v=>(
                  <div key={v.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:9,background:"#f8fafc",marginBottom:5}}>
                    <div><div style={{fontWeight:600,fontSize:12}}>{v.marque} {v.modele}</div><div style={{fontSize:10,color:"#9ca3af"}}>{v.immat} · {v.tarif} €/j</div></div>
                    <Badge s={statut(v.id)}/>
                  </div>
                ))}
              </div>
              <div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <h2 style={{fontWeight:700,marginBottom:10,fontSize:14}}>🔄 Derniers retours</h2>
                {Object.keys(retours).length===0
                  ?<p style={{color:"#9ca3af",fontSize:12}}>Aucun retour enregistré.</p>
                  :contrats.filter(c=>retours[c.id]).slice(0,4).map(c=>{
                    const r=retours[c.id];
                    const extra=(r.montantRetenu||0)+(r.surplusKm||0);
                    return(
                      <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:9,background:"#f8fafc",marginBottom:5}}>
                        <div><div style={{fontWeight:600,fontSize:12}}>{c.locNom}</div><div style={{fontSize:10,color:"#9ca3af"}}>{c.vehicleLabel}</div></div>
                        <span style={{padding:"2px 8px",fontSize:10,borderRadius:999,fontWeight:700,background:extra>0?"#fef3c7":"#f0fdf4",color:extra>0?"#d97706":"#16a34a"}}>{extra>0?"+"+extra.toFixed(0)+"€":"✅"}</span>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        )}

        {/* VEHICULES */}
        {page==="vehicles"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>🚗 Flotte</h1>
              <button onClick={()=>{setShowAddV(true);setEditV(null);setVForm({marque:"",modele:"",immat:"",couleur:"",annee:"",km:"",tarif:"",caution:"",kmInclus:"",prixKmSup:"",kmIllimite:false});}} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
            </div>
            {showAddV&&(
              <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.1)",marginBottom:16,border:"2px solid #bfdbfe"}}>
                <h3 style={{fontWeight:700,marginBottom:12,fontSize:14}}>{editV?"✏️ Modifier":"➕ Nouveau véhicule"}</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
                  <div><label style={LBL}>Marque *</label><select style={Inp()} value={vForm.marque} onChange={e=>setVForm(f=>({...f,marque:e.target.value,modele:""}))}><option value="">-- Choisir --</option>{Object.keys(CAR_BRANDS).sort().map(b=><option key={b} value={b}>{b}</option>)}</select></div>
                  <div><label style={LBL}>Modèle *</label><select style={Inp()} value={vForm.modele} onChange={e=>setVForm(f=>({...f,modele:e.target.value}))} disabled={!vForm.marque}><option value="">-- Choisir --</option>{(CAR_BRANDS[vForm.marque]||[]).map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                  <div><label style={LBL}>Immatriculation *</label><input style={Inp()} value={vForm.immat} onChange={e=>setVForm(f=>({...f,immat:e.target.value}))}/></div>
                  <div><label style={LBL}>Couleur</label><select style={Inp()} value={vForm.couleur} onChange={e=>setVForm(f=>({...f,couleur:e.target.value}))}><option value="">-- Choisir --</option>{CAR_COLORS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label style={LBL}>Année</label><select style={Inp()} value={vForm.annee} onChange={e=>setVForm(f=>({...f,annee:e.target.value}))}><option value="">-- Choisir --</option>{CAR_YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
                  {[["km","Km actuel"],["tarif","Tarif €/j"],["caution","Caution €"],["kmInclus","Km inclus/loc"],["prixKmSup","Prix km sup €"]].map(([k,l])=>(<div key={k}><label style={LBL}>{l}</label><input type="number" style={Inp()} value={vForm[k]} onChange={e=>setVForm(f=>({...f,[k]:e.target.value}))}/></div>))}
                </div>
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button onClick={addV} style={{background:"#16a34a",color:"white",border:"none",borderRadius:8,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontSize:12}}>{editV?"Mettre à jour":"Ajouter"}</button>
                  <button onClick={()=>{setShowAddV(false);setEditV(null);}} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12}}>Annuler</button>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
              {vehicles.map(v=>(
                <div key={v.id} style={{background:"white",borderRadius:16,boxShadow:"0 2px 10px rgba(0,0,0,.08)",overflow:"hidden",border:"1px solid #e5e7eb"}}>
                  <div style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div><div style={{color:"white",fontWeight:800,fontSize:15}}>{v.marque} {v.modele}</div><div style={{color:"rgba(255,255,255,.6)",fontSize:11}}>{v.immat} · {v.couleur}</div></div>
                    <Badge s={statut(v.id)}/>
                  </div>
                  <div style={{padding:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                      {[["💰 Tarif",v.tarif+" €/j"],["🔒 Caution",v.caution+" €"],["📏 Km inclus",v.kmInclus+" km"],["⚡ Km sup",v.prixKmSup+" €/km"],["🛣️ Km actuel",(v.km||0).toLocaleString()+" km"]].map(([l,val])=>(<div key={l} style={{background:"#f8fafc",borderRadius:8,padding:"7px 10px"}}><div style={{fontSize:9,color:"#9ca3af"}}>{l}</div><div style={{fontWeight:700,fontSize:12}}>{val}</div></div>))}
                    </div>
                    {(v.tarifsSpeciaux||[]).length>0&&(
                      <div style={{background:"#fff7ed",borderRadius:8,padding:"6px 10px",marginBottom:10,border:"1px solid #fed7aa"}}>
                        <div style={{fontSize:9,color:"#92400e",fontWeight:700,marginBottom:3}}>TARIFS SPÉCIAUX</div>
                        {v.tarifsSpeciaux.map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",fontSize:11}}><span>{t.label||t.type}</span><span style={{fontWeight:700}}>{t.prix}€{t.unite==="jour"?"/j":""}</span></div>)}
                      </div>
                    )}
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <button onClick={()=>openTarifs(v)} style={{flex:1,padding:"6px 0",background:"#fff7ed",color:"#d97706",border:"1px solid #fed7aa",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>💰 Tarifs</button>
                      <button onClick={()=>setContratModalId(v.id)} style={{flex:1,padding:"6px 0",background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>📄 Contrat</button>
                      <button onClick={()=>setDocsId(v.id)} style={{flex:1,padding:"6px 0",background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>📁 Docs</button>
                      <button onClick={()=>{setEditV(v);setVForm({marque:v.marque,modele:v.modele,immat:v.immat,couleur:v.couleur||"",annee:v.annee||"",km:v.km,tarif:v.tarif,caution:v.caution,kmInclus:v.kmInclus||0,prixKmSup:v.prixKmSup||0,kmIllimite:v.kmIllimite||false});setShowAddV(true);}} style={{padding:"6px 10px",background:"#f5f3ff",color:"#7c3aed",border:"1px solid #ddd6fe",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>✏️</button>
                      <button onClick={async()=>{if(window.confirm("Supprimer ?")){setVehicles(vs=>vs.filter(x=>x.id!==v.id));if(user){const{error:err}=await supabase.from('vehicules').delete().eq('id',v.id).eq('user_id',user.id);if(err)console.error('Error deleting vehicle:',err);}}}} style={{padding:"6px 10px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:11,cursor:"pointer"}}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NOUVEAU CONTRAT */}
        {page==="nouveau"&&(
          <div style={{maxWidth:680,margin:"0 auto"}}>
            <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937",marginBottom:16}}>📝 Nouveau contrat</h1>
            <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
              <h3 style={{fontWeight:700,fontSize:13,marginBottom:10}}>🚗 Véhicule</h3>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {vehicles.map(v=>(
                  <div key={v.id} onClick={()=>setSelId(v.id===selId?null:v.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,border:`2px solid ${selId===v.id?"#2563eb":"#e5e7eb"}`,background:selId===v.id?"#eff6ff":"#f9fafb",cursor:"pointer"}}>
                    <div><div style={{fontWeight:700,fontSize:13}}>{v.marque} {v.modele}</div><div style={{fontSize:10,color:"#6b7280"}}>{v.immat} · {v.couleur}</div></div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge s={statut(v.id)}/><span style={{fontWeight:700,fontSize:12,color:"#2563eb"}}>{v.tarif} €/j</span></div>
                  </div>
                ))}
              </div>
            </div>

            {sel&&(
              <>
                <div style={{background:"#1e3a8a",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>Tarif calculé automatiquement</div><div style={{color:"white",fontSize:11,marginTop:2}}>{tarifAuto.label}</div></div>
                  <div style={{color:"#4ade80",fontWeight:900,fontSize:22}}>{tarifAuto.prix} €</div>
                </div>

                <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                  <h3 style={{fontWeight:700,fontSize:13,marginBottom:12}}>👤 Locataire</h3>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <F k="locNom" label="Nom complet *" span2/>
                    <F k="locAdresse" label="Adresse *" span2/>
                    <F k="locTel" label="Téléphone *"/>
                    <F k="locEmail" label="Email" type="email"/>
                    <F k="locPermis" label="N° Permis" span2/>
                  </div>
                </div>

                <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                  <h3 style={{fontWeight:700,fontSize:13,marginBottom:12}}>📅 Durée</h3>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><label style={LBL}>Début *</label><input type="date" style={Inp(inv("dateDebut")?{borderColor:"#f87171",background:"#fef2f2"}:{})} value={form.dateDebut} onChange={e=>setForm(f=>({...f,dateDebut:e.target.value}))} onBlur={()=>setTouched(t=>({...t,dateDebut:true}))}/></div>
                    <div><label style={LBL}>Heure départ</label><input type="time" style={Inp()} value={form.heureDebut} onChange={e=>setForm(f=>({...f,heureDebut:e.target.value}))}/></div>
                    <div><label style={LBL}>Fin *</label><input type="date" style={Inp(inv("dateFin")?{borderColor:"#f87171",background:"#fef2f2"}:{})} value={form.dateFin} onChange={e=>setForm(f=>({...f,dateFin:e.target.value}))} onBlur={()=>setTouched(t=>({...t,dateFin:true}))}/></div>
                    <div><label style={LBL}>Heure retour</label><input type="time" style={Inp()} value={form.heureFin} onChange={e=>setForm(f=>({...f,heureFin:e.target.value}))}/></div>
                  </div>
                  <div style={{marginTop:10,background:"#f0fdf4",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#16a34a",fontWeight:600}}>
                    ⏱️ Durée : {form.nbJours} jour(s) ({form.heuresLoc}h)
                  </div>
                </div>

                <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                  <h3 style={{fontWeight:700,fontSize:13,marginBottom:12}}>🔍 État au départ</h3>
                  <div style={{marginBottom:12}}>
                    <label style={LBL}>Kilométrage départ</label>
                    <input type="number" style={Inp()} placeholder={sel.km} value={form.kmDepart} onChange={e=>setForm(f=>({...f,kmDepart:e.target.value}))}/>
                  </div>
                  <div style={{marginBottom:12}}>
                    <label style={LBL}>⛽ Niveau carburant au départ</label>
                    <FuelGauge value={form.carburantDepart} onChange={v=>setForm(f=>({...f,carburantDepart:v}))}/>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <CheckBool label="Extérieur propre" icon="🚿" val={form.exterieurPropre} onChange={v=>setForm(f=>({...f,exterieurPropre:v}))}/>
                    <CheckBool label="Intérieur propre" icon="🧹" val={form.interieurPropre} onChange={v=>setForm(f=>({...f,interieurPropre:v}))}/>
                  </div>
                </div>

                <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                  <h3 style={{fontWeight:700,fontSize:13,marginBottom:4}}>📸 Photos du véhicule au départ</h3>
                  <p style={{fontSize:11,color:"#6b7280",marginBottom:12}}>{photosDepart.length} photo{photosDepart.length>1?"s":""} ajoutée{photosDepart.length>1?"s":""} — incluses dans le contrat PDF</p>
                  <PhotosDepart photos={photosDepart} setPhotos={setPhotosDepart}/>
                </div>

                <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                  <h3 style={{fontWeight:700,fontSize:13,marginBottom:12}}>💳 Paiement & Caution</h3>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><label style={LBL}>Mode de paiement</label>
                      <select style={Inp()} value={form.paiement} onChange={e=>setForm(f=>({...f,paiement:e.target.value}))}>
                        <option value="especes">Espèces</option><option value="virement">Virement</option><option value="autre">Autre</option>
                      </select>
                    </div>
                    <div><label style={LBL}>Mode de caution</label>
                      <select style={Inp()} value={form.cautionMode} onChange={e=>setForm(f=>({...f,cautionMode:e.target.value}))}>
                        <option value="especes">Espèces</option><option value="virement">Virement</option><option value="emprunt">Emprunt</option><option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                  <h3 style={{fontWeight:700,fontSize:13,marginBottom:12}}>✍️ Signatures</h3>
                  <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
                    <SigPad label="Signature du loueur" onSave={setSigL}/>
                    <SigPad label="Signature du locataire" onSave={setSigLoc}/>
                  </div>
                </div>

                <button onClick={saveContrat} style={{width:"100%",background:"linear-gradient(135deg,#0a1940,#1e3a8a)",color:"white",border:"none",borderRadius:12,padding:14,fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(0,0,0,.2)"}}>
                  ✅ Créer le contrat — {tarifAuto.prix} €
                </button>
              </>
            )}

            {lastContrat&&(
              <div style={{marginTop:16,background:"#f0fdf4",borderRadius:14,padding:16,border:"2px solid #86efac"}}>
                <div style={{fontWeight:700,color:"#16a34a",marginBottom:8}}>✅ Contrat créé pour {lastContrat.contrat.locNom}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>dlFile(lastContrat.html,`Contrat_${lastContrat.contrat.locNom.replace(/\s+/g,"_")}.html`)} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>⬇️ Télécharger</button>
                  <button onClick={()=>setLastContrat(null)} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"8px 12px",fontSize:12,cursor:"pointer"}}>✕</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PLANNING */}
        {page==="planning"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>📅 Planning</h1>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <button onClick={()=>{const d=new Date(planMonth);d.setMonth(d.getMonth()-1);setPlanMonth(new Date(d));}} style={{padding:"5px 12px",background:"white",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:700}}>◀</button>
                <span style={{fontWeight:700,fontSize:13,minWidth:130,textAlign:"center",textTransform:"capitalize"}}>
                  {planMonth.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}
                </span>
                <button onClick={()=>{const d=new Date(planMonth);d.setMonth(d.getMonth()+1);setPlanMonth(new Date(d));}} style={{padding:"5px 12px",background:"white",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:700}}>▶</button>
              </div>
            </div>

            {contrats.length===0 && (
              <div style={{textAlign:"center",color:"#9ca3af",padding:40,background:"white",borderRadius:14}}>
                <div style={{fontSize:36,marginBottom:8}}>📅</div>
                <p>Aucun contrat — créez-en un pour voir le planning.</p>
              </div>
            )}

            {vehicles.map(v=>{
              const vContrats=contrats.filter(c=>c.vehicleId===v.id);
              return(
                <div key={v.id} style={{background:"white",borderRadius:14,marginBottom:14,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:"1px solid #e5e7eb"}}>
                  {/* En-tête véhicule */}
                  <div style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <span style={{color:"white",fontWeight:800,fontSize:13}}>{v.marque} {v.modele}</span>
                      <span style={{color:"rgba(255,255,255,.6)",fontSize:11,marginLeft:10}}>{v.immat}</span>
                    </div>
                    <Badge s={statut(v.id)}/>
                  </div>

                  {/* Grille des jours */}
                  <div style={{overflowX:"auto"}}>
                    <div style={{display:"flex",minWidth:days.length*28+130}}>
                      {/* Colonne label */}
                      <div style={{width:130,flexShrink:0}}/>
                      {/* Numéros de jours */}
                      {days.map(d=>{
                        const isToday=d.toDateString()===new Date().toDateString();
                        const isWE=d.getDay()===0||d.getDay()===6;
                        return(
                          <div key={d.getTime()} style={{width:28,flexShrink:0,textAlign:"center",padding:"5px 0",fontSize:10,fontWeight:isToday?800:400,color:isToday?"#2563eb":isWE?"#9ca3af":"#6b7280",background:isToday?"#eff6ff":isWE?"#fafafa":"white",borderLeft:"1px solid #f0f0f0"}}>
                            {d.getDate()}
                          </div>
                        );
                      })}
                    </div>

                    {/* Ligne des jours de la semaine */}
                    <div style={{display:"flex",minWidth:days.length*28+130,borderBottom:"1px solid #e5e7eb"}}>
                      <div style={{width:130,flexShrink:0,padding:"2px 8px",fontSize:9,color:"#9ca3af",display:"flex",alignItems:"center"}}>Sem.</div>
                      {days.map(d=>{
                        const isWE=d.getDay()===0||d.getDay()===6;
                        const labels=["D","L","M","M","J","V","S"];
                        return(
                          <div key={d.getTime()} style={{width:28,flexShrink:0,textAlign:"center",fontSize:9,padding:"2px 0",color:isWE?"#d97706":"#9ca3af",background:isWE?"#fffbeb":"white",borderLeft:"1px solid #f0f0f0"}}>
                            {labels[d.getDay()]}
                          </div>
                        );
                      })}
                    </div>

                    {/* Ligne disponibilité */}
                    <div style={{display:"flex",minWidth:days.length*28+130,padding:"4px 0"}}>
                      <div style={{width:130,flexShrink:0,padding:"0 8px",fontSize:10,fontWeight:600,color:"#374151",display:"flex",alignItems:"center"}}>
                        Disponibilité
                      </div>
                      {days.map(d=>{
                        const b=isBooked(v.id,d);
                        const isToday=d.toDateString()===new Date().toDateString();
                        return(
                          <div key={d.getTime()} style={{width:28,flexShrink:0,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:b?"#dbeafe":isToday?"#eff6ff":"white",borderLeft:"1px solid #f0f0f0"}}>
                            {b
                              ? <div style={{width:20,height:20,borderRadius:4,background:"#2563eb"}}/>
                              : <div style={{width:20,height:20,borderRadius:4,background:"#dcfce7"}}/>
                            }
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Liste des contrats du mois */}
                  {vContrats.length>0 && (
                    <div style={{padding:"8px 12px",borderTop:"1px solid #f0f0f0",display:"flex",flexWrap:"wrap",gap:6}}>
                      {vContrats.map(c=>{
                        const dStart=new Date(c.dateDebut),dEnd=new Date(c.dateFin);
                        const mStart=dStart.getMonth(),mEnd=dEnd.getMonth(),y=planMonth.getMonth();
                        const inMonth=mStart===y||mEnd===y;
                        if(!inMonth)return null;
                        return(
                          <div key={c.id} style={{background:"#eff6ff",borderRadius:8,padding:"4px 10px",fontSize:11,border:"1px solid #bfdbfe"}}>
                            <span style={{fontWeight:700,color:"#1e3a8a"}}>{c.locNom}</span>
                            <span style={{color:"#6b7280",marginLeft:6}}>{c.dateDebut} → {c.dateFin}</span>
                            <span style={{marginLeft:6,fontWeight:700,color:"#2563eb"}}>{c.totalCalc} €</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Légende */}
            <div style={{display:"flex",gap:16,padding:"10px 4px",fontSize:11,color:"#6b7280"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:16,height:16,borderRadius:3,background:"#2563eb"}}/> Loué</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:16,height:16,borderRadius:3,background:"#dcfce7",border:"1px solid #bbf7d0"}}/> Disponible</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:16,height:16,borderRadius:3,background:"#eff6ff",border:"1px solid #bfdbfe"}}/> Aujourd'hui</div>
              <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:16,height:16,borderRadius:3,background:"#fffbeb",border:"1px solid #fde68a"}}/> Week-end</div>
            </div>
          </div>
        )}

        {/* CONTRATS */}
        {page==="contrats"&&(
          <div>
            <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937",marginBottom:16}}>📋 Contrats ({contrats.length})</h1>
            {contrats.length===0
              ?<div style={{textAlign:"center",color:"#9ca3af",padding:40}}><div style={{fontSize:40}}>📋</div><p>Aucun contrat</p></div>
              :contrats.map(c=>{
                const r=retours[c.id];
                return(
                  <div key={c.id} style={{background:"white",borderRadius:14,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:"1px solid #e5e7eb"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{fontWeight:800,fontSize:14}}>{c.locNom.toUpperCase()}</div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{c.vehicleLabel} · {c.immat}</div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{c.dateDebut} → {c.dateFin} · {c.nbJours}j</div>
                        {c.tarifLabel&&<div style={{fontSize:10,color:"#9ca3af",marginTop:2}}>{c.tarifLabel}</div>}
                        <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                          <span style={{fontSize:10,background:fuelColor(c.carburantDepart||100)==="#16a34a"?"#f0fdf4":fuelColor(c.carburantDepart||100)==="#d97706"?"#fff7ed":"#fef2f2",color:fuelColor(c.carburantDepart||100),borderRadius:6,padding:"2px 7px",fontWeight:600}}>⛽ {c.carburantDepart||100}%</span>
                          {c.exterieurPropre!==null&&<span style={{fontSize:10,background:c.exterieurPropre?"#f0fdf4":"#fef2f2",color:c.exterieurPropre?"#16a34a":"#dc2626",borderRadius:6,padding:"2px 7px",fontWeight:600}}>🚿 {c.exterieurPropre?"OK":"NON"}</span>}
                          {c.interieurPropre!==null&&<span style={{fontSize:10,background:c.interieurPropre?"#f0fdf4":"#fef2f2",color:c.interieurPropre?"#16a34a":"#dc2626",borderRadius:6,padding:"2px 7px",fontWeight:600}}>🧹 {c.interieurPropre?"OK":"NON"}</span>}
                          {(c.photosDepart||[]).length>0&&<span style={{fontSize:10,background:"#f5f3ff",color:"#7c3aed",borderRadius:6,padding:"2px 7px",fontWeight:600}}>📸 {c.photosDepart.length} photo{c.photosDepart.length>1?"s":""}</span>}
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontWeight:900,fontSize:18,color:"#1e3a8a"}}>{c.totalCalc} €</div>
                        {r&&<div style={{fontSize:10,color:"#16a34a",fontWeight:600}}>✅ Retour OK</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <button onClick={()=>rePrint(c)} style={{padding:"5px 10px",background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>⬇️ PDF</button>
                      {!r&&<button onClick={()=>setRetourContratId(c.id)} style={{padding:"5px 10px",background:"#f0fdf4",color:"#16a34a",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>🔄 Retour</button>}
                      <button onClick={async()=>{if(window.confirm("Supprimer ?")){setContrats(cs=>cs.filter(x=>x.id!==c.id));if(user){const{error:err}=await supabase.from('contrats').delete().eq('id',c.id).eq('user_id',user.id);if(err)console.error('Error deleting contrat:',err);}}}} style={{padding:"5px 10px",background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:7,fontSize:11,cursor:"pointer"}}>🗑️</button>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* RETOURS */}
        {page==="retours"&&(
          <div>
            <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937",marginBottom:16}}>🔄 Retours</h1>
            {contrats.filter(c=>!retours[c.id]).length>0&&(
              <div style={{marginBottom:16}}>
                <h2 style={{fontSize:13,fontWeight:700,color:"#6b7280",marginBottom:8}}>En attente de retour</h2>
                {contrats.filter(c=>!retours[c.id]).map(c=>(
                  <div key={c.id} style={{background:"white",borderRadius:12,padding:12,marginBottom:8,border:"1px solid #fde68a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontWeight:700}}>{c.locNom}</div><div style={{fontSize:11,color:"#6b7280"}}>{c.vehicleLabel} · jusqu'au {c.dateFin}</div></div>
                    <button onClick={()=>setRetourContratId(c.id)} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"7px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>🔄 Faire le retour</button>
                  </div>
                ))}
              </div>
            )}
            {contrats.filter(c=>retours[c.id]).length>0&&(
              <div>
                <h2 style={{fontSize:13,fontWeight:700,color:"#6b7280",marginBottom:8}}>Retours effectués</h2>
                {contrats.filter(c=>retours[c.id]).map(c=>{
                  const r=retours[c.id];
                  return(
                    <div key={c.id} style={{background:"white",borderRadius:12,padding:14,marginBottom:8,border:"1px solid #e5e7eb"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div>
                          <div style={{fontWeight:700}}>{c.locNom}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>{c.vehicleLabel}</div>
                          <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                            {r.kmRetour&&<span style={{fontSize:10,background:"#eff6ff",color:"#2563eb",borderRadius:6,padding:"2px 7px",fontWeight:600}}>📏 {r.kmRetour} km</span>}
                            {r.surplusKm>0&&<span style={{fontSize:10,background:"#fef3c7",color:"#d97706",borderRadius:6,padding:"2px 7px",fontWeight:600}}>+{r.surplusKm.toFixed(0)}€ km</span>}
                            {r.montantRetenu>0&&<span style={{fontSize:10,background:"#fef2f2",color:"#dc2626",borderRadius:6,padding:"2px 7px",fontWeight:600}}>🔒 -{r.montantRetenu}€</span>}
                            {r.cautionRestituee&&<span style={{fontSize:10,background:"#f0fdf4",color:"#16a34a",borderRadius:6,padding:"2px 7px",fontWeight:600}}>✅ Caution OK</span>}
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontWeight:900,fontSize:16,color:"#16a34a"}}>{((c.totalCalc||0)+(r.surplusKm||0)+(r.montantRetenu||0)).toFixed(0)} €</div>
                          <div style={{fontSize:9,color:"#9ca3af"}}>total encaissé</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {contrats.length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:40}}><div style={{fontSize:40}}>🔄</div><p>Aucun contrat enregistré.</p></div>}
          </div>
        )}

        {/* FINANCES */}
        {page==="finances"&&(
          <div>
            <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937",marginBottom:16}}>💰 Finances</h1>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
              {KPI("CA Total",caT+" €","💶","#2563eb")}
              {KPI("Extras",(totalRetenues+totalSurplusKm).toFixed(0)+" €","🔒","#d97706")}
              {KPI("Dépenses",dT.toFixed(0)+" €","📤","#ef4444")}
              {KPI("Bénéfice net",bT.toFixed(0)+" €",bT>=0?"📈":"📉",bT>=0?"#16a34a":"#dc2626",null,bT<0)}
            </div>
            <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <h2 style={{fontWeight:700,fontSize:14}}>📤 Dépenses</h2>
                <button onClick={()=>setShowAddD(!showAddD)} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
              </div>
              {showAddD&&(
                <div style={{background:"#f8fafc",borderRadius:10,padding:12,marginBottom:12,border:"1px solid #e5e7eb"}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:8}}>
                    <div><label style={LBL}>Libellé</label><input style={Inp()} value={dForm.label} onChange={e=>setDForm(f=>({...f,label:e.target.value}))}/></div>
                    <div><label style={LBL}>Montant €</label><input type="number" style={Inp()} value={dForm.montant} onChange={e=>setDForm(f=>({...f,montant:e.target.value}))}/></div>
                    <div><label style={LBL}>Catégorie</label><select style={Inp()} value={dForm.categorie} onChange={e=>setDForm(f=>({...f,categorie:e.target.value}))}>{CAT_DEP.map(c=><option key={c}>{c}</option>)}</select></div>
                    <div><label style={LBL}>Date</label><input type="date" style={Inp()} value={dForm.date} onChange={e=>setDForm(f=>({...f,date:e.target.value}))}/></div>
                    <div><label style={LBL}>Véhicule</label><select style={Inp()} value={dForm.vehicleId} onChange={e=>setDForm(f=>({...f,vehicleId:e.target.value}))}><option value="">Tous</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.marque} {v.modele}</option>)}</select></div>
                  </div>
                  <button onClick={async()=>{if(!dForm.label||!dForm.montant){toast_("Remplissez libellé et montant","error");return;}const localId=Date.now();const newDep={id:localId,...dForm};setDepenses(d=>[newDep,...d]);setDForm({label:"",montant:"",categorie:"Carburant",date:new Date().toISOString().slice(0,10),vehicleId:""});setShowAddD(false);toast_("Dépense ajoutée");if(user){const{data:ins,error:err}=await supabase.from('depenses').insert([{user_id:user.id,label:newDep.label,montant:parseFloat(newDep.montant),categorie:newDep.categorie,date:newDep.date,vehicle_id:newDep.vehicleId||null}]).select().single();if(!err&&ins){setDepenses(ds=>ds.map(x=>x.id===localId?{...x,id:ins.id}:x));}if(err)console.error('Error adding depense:',err);}}} style={{background:"#16a34a",color:"white",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
                </div>
              )}
              {depenses.length===0
                ?<p style={{color:"#9ca3af",fontSize:12,textAlign:"center",padding:16}}>Aucune dépense</p>
                :depenses.map(d=>(
                  <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:8,background:"#f9fafb",marginBottom:5}}>
                    <div><div style={{fontWeight:600,fontSize:12}}>{d.label}</div><div style={{fontSize:10,color:"#9ca3af"}}>{d.categorie} · {d.date}</div></div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontWeight:700,color:"#ef4444"}}>-{d.montant} €</span><button onClick={async()=>{setDepenses(ds=>ds.filter(x=>x.id!==d.id));if(user){const{error:err}=await supabase.from('depenses').delete().eq('id',d.id).eq('user_id',user.id);if(err)console.error('Error deleting depense:',err);}}} style={{padding:"2px 6px",background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:5,cursor:"pointer",fontSize:10}}>🗑️</button></div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* PROFIL */}
        {page==="profil"&&(
          <div style={{maxWidth:520,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>👤 Profil</h1>
              <button onClick={()=>{setProfilEdit(!profilEdit);setProfilForm({...profil});}} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{profilEdit?"Annuler":"✏️ Modifier"}</button>
            </div>
            {profilEdit?(
              <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                {[["nom","Nom"],["entreprise","Entreprise"],["siren","SIREN"],["siret","SIRET"],["kbis","KBIS"],["tel","Téléphone"],["whatsapp","WhatsApp"],["snap","Snapchat"],["email","Email"],["adresse","Adresse"],["ville","Ville"],["iban","IBAN"]].map(([k,l])=>(
                  <div key={k} style={{marginBottom:10}}><label style={LBL}>{l}</label><input style={Inp()} value={profilForm[k]||""} onChange={e=>setProfilForm(p=>({...p,[k]:e.target.value}))}/></div>
                ))}
                <button onClick={async()=>{setProfil(profilForm);setProfilEdit(false);toast_("Profil mis à jour");if(user){const{error:err}=await supabase.from('profils').upsert({user_id:user.id,...profilForm},{onConflict:'user_id'});if(err)console.error('Error updating profile:',err);}}} style={{background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:"10px 0",width:"100%",fontSize:13,fontWeight:700,cursor:"pointer"}}>✅ Enregistrer</button>
                <button onClick={()=>supabase.auth.signOut()} style={{marginTop:10,background:"transparent",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:10,padding:"10px 0",width:"100%",fontSize:12,fontWeight:600,cursor:"pointer"}}>Déconnexion</button>
              </div>
            ):(
              <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <div style={{textAlign:"center",marginBottom:16}}>
                  <div style={{width:60,height:60,borderRadius:"50%",background:"#1e3a8a",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",fontSize:24}}>👤</div>
                  <div style={{fontWeight:800,fontSize:16}}>{profil.nom}</div>
                  <div style={{color:"#6b7280",fontSize:12}}>{profil.entreprise}</div>
                </div>
                {[["SIREN",profil.siren],["SIRET",profil.siret],["KBIS",profil.kbis],["Téléphone",profil.tel],["WhatsApp",profil.whatsapp],["Snapchat",profil.snap],["Email",profil.email],["Adresse",profil.adresse],["Ville",profil.ville],["IBAN",profil.iban]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}>
                    <span style={{fontSize:11,color:"#6b7280"}}>{l}</span>
                    <span style={{fontSize:12,fontWeight:600}}>{v}</span>
                  </div>
                ))}
                <button onClick={()=>supabase.auth.signOut()} style={{marginTop:14,background:"transparent",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:10,padding:"10px 0",width:"100%",fontSize:12,fontWeight:600,cursor:"pointer"}}>Déconnexion</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function AuthPage(){
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(){
    setLoading(true); setError(""); setSuccess("");
    if(mode==="forgot"){
      const {error:err} = await supabase.auth.resetPasswordForEmail(email);
      if(err){
        setError(err.message);
      } else {
        setSuccess("Un email de réinitialisation a été envoyé. Vérifiez votre boîte mail.");
      }
      setLoading(false);
      return;
    }
    let result;
    if(mode==="login"){
      result = await supabase.auth.signInWithPassword({email, password});
    } else {
      result = await supabase.auth.signUp({email, password, options:{emailRedirectTo: window.location.origin}});
    }
    if(result.error){
      setError(result.error.message);
    } else if(mode==="signup"){
      setSuccess("Compte créé ! Vérifiez votre email pour confirmer votre inscription.");
    }
    setLoading(false);
  }

  return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#f1f5f9"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 32px",width:"100%",maxWidth:400,boxShadow:"0 4px 24px rgba(0,0,0,0.1)"}}>
        <h1 style={{textAlign:"center",marginBottom:8,fontSize:22,fontWeight:700}}>{"\ud83d\ude97"} MAN'S LOCATION</h1>
        <p style={{textAlign:"center",color:"#6b7280",marginBottom:24,fontSize:14}}>Accès réservé aux professionnels</p>
        {mode!=="forgot" && (
        <div style={{display:"flex",marginBottom:24,borderRadius:8,overflow:"hidden",border:"1px solid #e5e7eb"}}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}} style={{flex:1,padding:"10px",border:"none",cursor:"pointer",background:mode===m?"#1d4ed8":"white",color:mode===m?"white":"#374151",fontWeight:600}}>
              {m==="login"?"Connexion":"Inscription"}
            </button>
          ))}
        </div>
        )}
        {mode==="forgot" && (
          <p style={{textAlign:"center",color:"#374151",marginBottom:20,fontSize:14}}>Entrez votre email pour recevoir un lien de réinitialisation.</p>
        )}
        <input placeholder="Email professionnel" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,marginBottom:12,fontSize:14,boxSizing:"border-box"}}/>
        {mode!=="forgot" && (
        <div style={{position:"relative",marginBottom:16}}>
          <input placeholder="Mot de passe" type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",padding:"10px 12px",paddingRight:40,border:"1px solid #e5e7eb",borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
          <span onClick={()=>setShowPassword(!showPassword)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:18,color:"#6b7280",userSelect:"none"}}>{showPassword?"\ud83d\ude48":"\ud83d\udc41\ufe0f"}</span>
        </div>
        )}
        {error && <p style={{color:"red",fontSize:13,marginBottom:12}}>{error}</p>}
        {success && <p style={{color:"#16a34a",fontSize:13,marginBottom:12}}>{success}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"12px",background:"#1d4ed8",color:"white",border:"none",borderRadius:8,fontWeight:700,fontSize:15,cursor:"pointer"}}>
          {loading?"...":(mode==="login"?"Se connecter":mode==="signup"?"Créer mon compte":"Envoyer le lien")}
        </button>
        {mode==="login" && (
          <p style={{textAlign:"center",marginTop:14,fontSize:13}}>
            <span onClick={()=>{setMode("forgot");setError("");setSuccess("");}} style={{color:"#1d4ed8",cursor:"pointer",textDecoration:"underline"}}>Mot de passe oublié ?</span>
          </p>
        )}
        {mode==="forgot" && (
          <p style={{textAlign:"center",marginTop:14,fontSize:13}}>
            <span onClick={()=>{setMode("login");setError("");setSuccess("");}} style={{color:"#1d4ed8",cursor:"pointer",textDecoration:"underline"}}>Retour à la connexion</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function App(){
  return <AppContent/>;
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                
