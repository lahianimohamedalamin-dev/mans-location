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
  {id:"aile_avg",label:"Aile avant gauche",zone:"Avant"},{id:"aile_avd",label:"Aile avant droite",zone:"Avant"},
  {id:"pare_choc_av",label:"Pare-choc avant",zone:"Avant"},{id:"capot",label:"Capot",zone:"Avant"},
  {id:"toit",label:"Toit",zone:"Dessus"},
  {id:"pare_brise",label:"Pare-brise",zone:"Vitres"},{id:"vitre_avg",label:"Vitre avant gauche",zone:"Vitres"},
  {id:"vitre_avd",label:"Vitre avant droite",zone:"Vitres"},{id:"vitre_arg",label:"Vitre arrière gauche",zone:"Vitres"},
  {id:"vitre_ard",label:"Vitre arrière droite",zone:"Vitres"},{id:"lunette",label:"Lunette arrière",zone:"Vitres"},
  {id:"portiere_avg",label:"Portière avant gauche",zone:"Gauche"},{id:"portiere_arg",label:"Portière arrière gauche",zone:"Gauche"},
  {id:"portiere_avd",label:"Portière avant droite",zone:"Droite"},{id:"portiere_ard",label:"Portière arrière droite",zone:"Droite"},
  {id:"aile_arg",label:"Aile arrière gauche",zone:"Arrière"},{id:"aile_ard",label:"Aile arrière droite",zone:"Arrière"},
  {id:"pare_choc_ar",label:"Pare-choc arrière",zone:"Arrière"},{id:"coffre",label:"Coffre / Hayon",zone:"Arrière"},
  {id:"jante_avg",label:"Jante avant gauche",zone:"Jantes"},{id:"jante_avd",label:"Jante avant droite",zone:"Jantes"},
  {id:"jante_arg",label:"Jante arrière gauche",zone:"Jantes"},{id:"jante_ard",label:"Jante arrière droite",zone:"Jantes"},
  {id:"retro_g",label:"Rétroviseur gauche",zone:"Divers"},{id:"retro_d",label:"Rétroviseur droit",zone:"Divers"},
];
const PAYS_CODES=[
  {code:"+33",pays:"🇫🇷 France"},{code:"+32",pays:"🇧🇪 Belgique"},{code:"+41",pays:"🇨🇭 Suisse"},
  {code:"+352",pays:"🇱🇺 Luxembourg"},{code:"+212",pays:"🇲🇦 Maroc"},{code:"+213",pays:"🇩🇿 Algérie"},
  {code:"+216",pays:"🇹🇳 Tunisie"},{code:"+221",pays:"🇸🇳 Sénégal"},{code:"+225",pays:"🇨🇮 Côte d'Ivoire"},
  {code:"+44",pays:"🇬🇧 Royaume-Uni"},{code:"+49",pays:"🇩🇪 Allemagne"},{code:"+34",pays:"🇪🇸 Espagne"},
  {code:"+39",pays:"🇮🇹 Italie"},{code:"+1",pays:"🇺🇸 USA/Canada"},
];
const MOTORISATIONS=["Essence","Diesel","Hybride","Hybride rechargeable","Électrique","GPL","Hydrogène"];
const BOITES=["Manuelle","Automatique","Semi-automatique"];
const TYPES_VEHICULE=[
  {id:"voiture",label:"Voiture",icon:"🚗"},
  {id:"vsp",label:"VSP (sans permis)",icon:"🚘"},
  {id:"2roues",label:"2 roues",icon:"🏍️"},
  {id:"utilitaire",label:"Utilitaire",icon:"🚚"},
  {id:"semi",label:"Semi-remorque",icon:"🚛"},
  {id:"autocar",label:"Autocar",icon:"🚌"},
  {id:"camping",label:"Camping-car",icon:"🚐"},
  {id:"autre",label:"Autre",icon:"🚙"},
];
const DEVISES=[
  {code:"EUR",symbol:"€",label:"Euro (EUR - €)"},
  {code:"CHF",symbol:"CHF",label:"Franc suisse (CHF)"},
  {code:"DZD",symbol:"DA",label:"Dinar algérien (DZD - DA)"},
  {code:"MAD",symbol:"DH",label:"Dirham marocain (MAD - DH)"},
  {code:"TND",symbol:"DT",label:"Dinar tunisien (TND)"},
  {code:"XOF",symbol:"FCFA",label:"Franc CFA (XOF - FCFA)"},
  {code:"USD",symbol:"$",label:"Dollar américain (USD - $)"},
  {code:"GBP",symbol:"£",label:"Livre sterling (GBP - £)"},
];
const RETOUR_CHECKS=[
  {id:"carburant",label:"Carburant niveau OK",icon:"⛽"},{id:"exterieur",label:"Extérieur propre",icon:"🚿"},
  {id:"interieur",label:"Intérieur propre",icon:"🧹"},{id:"sieges",label:"Sièges sans dégât",icon:"💺"},
  {id:"odeur",label:"Pas d'odeur tabac",icon:"🚭"},{id:"documents",label:"Documents présents",icon:"📋"},
  {id:"cles",label:"Clés rendues",icon:"🔑"},
];
const CAT_DEP=["Carburant","Assurance","Entretien","Réparation","Nettoyage","Péage","Amende","Retenue caution","Autre"];
const DOC_TYPES=["Carte grise","Assurance","Contrôle technique","Permis de conduire","CNI / Passeport","Contrat","Autre"];
const TARIFS_PRESETS=[
  {type:"Journée (24h)",heures:24},{type:"Week-end (48h)",heures:48},
  {type:"Week-end (72h)",heures:72},{type:"Semaine (7j)",heures:168},{type:"Mois (30j)",heures:720},
];
const INIT_PROFIL={nom:"",entreprise:"",siren:"",siret:"",kbis:"",tel:"",whatsapp:"",snap:"",email:"",adresse:"",ville:"",iban:"",devise:"EUR"};
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

function fuelLabel(pct){if(pct>=100)return"Plein";if(pct>=75)return"3/4";if(pct>=50)return"1/2";if(pct>=25)return"1/4";return"Réserve";}
function fuelColor(pct){if(pct>=60)return"#16a34a";if(pct>=30)return"#d97706";return"#dc2626";}

function dlPDF(html){
  const win=window.open('','_blank');
  if(!win){alert("Autorisez les popups pour imprimer/PDF");return;}
  win.document.write(html);win.document.close();win.focus();
  setTimeout(()=>win.print(),600);
}

function buildContratHTML(contrat,vehicle,sigL,sigLoc,profil){
  const nb=contrat.nbJours||1,total=contrat.totalCalc||0,pm=contrat.paiement;
  const frais=vehicle.frais||DEF_FRAIS,clauses=vehicle.clauses||DEF_CLAUSES;
  const fraisRows=frais.map(f=>"<tr><td>"+f.label+"</td><td style='text-align:right;font-weight:bold'>"+f.montant+" €</td></tr>").join("");
  const clausesHtml=clauses.map((c,i)=>"<div class='cl'><span class='cl-t'>"+(i+6)+". "+c.titre+"</span><br>"+c.texte+"</div>").join("");
  const sL=sigL?"<img src='"+sigL+"' style='max-width:160px;height:60px;display:block;margin:0 auto;border-bottom:1px solid #333'>":"<div style='border-bottom:1px solid #333;height:60px;width:160px;margin:0 auto'></div>";
  const sLoc=sigLoc?"<img src='"+sigLoc+"' style='max-width:160px;height:60px;display:block;margin:0 auto;border-bottom:1px solid #333'>":"<div style='border-bottom:1px solid #333;height:60px;width:160px;margin:0 auto'></div>";
  const fuelPct=contrat.carburantDepart||0;
  const fuelBar="<div style='margin:6px 0'><span style='font-size:10px;color:#555'>Carburant départ : </span><span style='font-weight:bold'>"+fuelPct+"% — "+fuelLabel(fuelPct)+"</span><div style='background:#e5e7eb;border-radius:99px;height:10px;width:200px;margin-top:3px;overflow:hidden'><div style='width:"+fuelPct+"%;background:"+fuelColor(fuelPct)+";height:100%'></div></div></div>";
  const extPropre=contrat.exterieurPropre===true?"✅ Oui":contrat.exterieurPropre===false?"❌ Non":"—";
  const intPropre=contrat.interieurPropre===true?"✅ Oui":contrat.interieurPropre===false?"❌ Non":"—";
  const etatHtml="<div style='display:flex;gap:16px;margin:4px 0'><span style='font-size:10px'><b>Extérieur propre :</b> "+extPropre+"</span><span style='font-size:10px'><b>Intérieur propre :</b> "+intPropre+"</span></div>";
  const kmRow=vehicle.kmInclus?"<div><span class='lbl'>Km inclus : </span><span class='val'>"+vehicle.kmInclus+" km</span> &nbsp; <span class='lbl'>Surplus : </span><span class='val'>"+(vehicle.prixKmSup||0)+" €/km</span></div>":"";
  const cautionMode=contrat.cautionMode==="especes"?"Espèces":contrat.cautionMode==="virement"?"Virement bancaire":contrat.cautionMode==="emprunt"?"Emprunt bancaire":"Autre";
  const photosDepart=contrat.photosDepart||[];
  const photosHtml=photosDepart.length>0?"<div style='margin-top:6px'><div style='font-size:10px;font-weight:bold;color:#555;margin-bottom:4px'>Photos départ ("+photosDepart.length+")</div><div style='display:flex;flex-wrap:wrap;gap:6px'>"+photosDepart.map(p=>"<img src='"+p.data+"' style='width:120px;height:90px;object-fit:cover;border-radius:6px;border:1px solid #ddd'>").join("")+"</div></div>":"";
  const permisHtml=contrat.locPermis?"<div><span class='lbl'>Permis : </span><span class='val'>"+contrat.locPermis+"</span></div>":"";
  const tarifHtml=contrat.tarifLabel?"<div><span class='lbl'>Tarif appliqué : </span><span class='val'>"+contrat.tarifLabel+"</span></div>":"";
  const dl=contrat.docsLocataire||{};
  let docsLocHtml="";
  if(dl.cniRecto||dl.cniVerso||dl.justifDom||dl.photoAr){
    docsLocHtml="<div style='margin-top:10px;padding:10px;background:#f8fafc;border-radius:8px;border:1px solid #e5e7eb'><div style='font-size:11px;font-weight:bold;color:#0a1940;margin-bottom:8px'>Documents du locataire</div><div style='display:flex;flex-wrap:wrap;gap:10px'>";
    if(dl.cniRecto)docsLocHtml+="<div style='text-align:center'><div style='font-size:9px;color:#555;margin-bottom:3px;font-weight:600'>CNI Recto</div><img src='"+dl.cniRecto+"' style='width:130px;height:90px;object-fit:cover;border-radius:6px;border:2px solid #2563eb'></div>";
    if(dl.cniVerso)docsLocHtml+="<div style='text-align:center'><div style='font-size:9px;color:#555;margin-bottom:3px;font-weight:600'>CNI Verso</div><img src='"+dl.cniVerso+"' style='width:130px;height:90px;object-fit:cover;border-radius:6px;border:2px solid #2563eb'></div>";
    if(dl.justifDom)docsLocHtml+="<div style='text-align:center'><div style='font-size:9px;color:#555;margin-bottom:3px;font-weight:600'>Justif. domicile</div><img src='"+dl.justifDom+"' style='width:130px;height:90px;object-fit:cover;border-radius:6px;border:2px solid #7c3aed'></div>";
    if(dl.photoAr)docsLocHtml+="<div style='text-align:center'><div style='font-size:9px;color:#555;margin-bottom:3px;font-weight:600'>Photo arrière</div><img src='"+dl.photoAr+"' style='width:130px;height:90px;object-fit:cover;border-radius:6px;border:2px solid #16a34a'></div>";
    docsLocHtml+="</div></div>";
  }
  return["<!DOCTYPE html><html><head><meta charset='utf-8'><title>Contrat "+contrat.locNom+"</title>",
    "<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#111}",
    ".header{background:#0a1940;color:#fff;padding:14px 20px;text-align:center}.header h1{font-size:22px;letter-spacing:2px;margin-bottom:4px}.header p{font-size:9px;opacity:.8;margin:2px 0}",
    ".body{padding:14px 20px}.title{text-align:center;font-size:14px;font-weight:bold;margin:10px 0 6px;text-transform:uppercase;border-bottom:2px solid #0a1940;padding-bottom:6px}",
    ".st{font-size:11px;font-weight:bold;background:#e8edf5;padding:4px 8px;margin-bottom:5px;border-left:3px solid #0a1940}",
    ".row{display:flex;gap:20px;margin-bottom:3px}.row span{flex:1}.lbl{color:#555;font-size:10px}.val{font-weight:bold}",
    "hr{border:none;border-top:1px solid #ccc;margin:8px 0}table.ft{width:100%;border-collapse:collapse;font-size:10px;margin-top:5px}",
    "table.ft td{border:1px solid #ddd;padding:3px 6px}table.ft tr:nth-child(even){background:#f5f5f5}",
    ".cl{font-size:9.5px;margin-bottom:5px;line-height:1.5}.cl-t{font-weight:bold;font-size:10px}",
    ".sig-area{display:flex;justify-content:space-between;margin-top:16px;gap:30px}.sig-box{flex:1;text-align:center}.sig-box p{font-size:10px;font-weight:bold;margin-bottom:6px}",
    ".tot{background:#0a1940;color:#fff;padding:8px 14px;border-radius:6px;margin:8px 0;display:flex;justify-content:space-between;align-items:center}",
    "@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>",
    "<div class='header'><h1>"+(profil.entreprise||"MAN'S LOCATION")+"</h1><p>LOCATION DE CITADINES EN IDF</p>",
    "<p>SIRET : "+(profil.siret||profil.siren)+" | Tel : "+profil.tel+" | "+profil.adresse+"</p></div>",
    "<div class='body'><div class='title'>Contrat de Location de Vehicule</div>",
    "<div style='margin-bottom:8px'><div class='st'>Le Proprietaire (Loueur)</div>",
    "<div class='row'><span><span class='lbl'>Nom : </span><span class='val'>"+profil.nom+"</span></span><span><span class='lbl'>Tel : </span><span class='val'>"+profil.tel+"</span></span></div>",
    "<div><span class='lbl'>Adresse : </span><span class='val'>"+profil.adresse+"</span></div></div>",
    "<div style='margin-bottom:8px'><div class='st'>Le Locataire</div>",
    "<div class='row'><span><span class='lbl'>Nom : </span><span class='val'>"+contrat.locNom.toUpperCase()+"</span></span><span><span class='lbl'>Tel : </span><span class='val'>"+contrat.locTel+"</span></span></div>",
    "<div><span class='lbl'>Adresse : </span><span class='val'>"+contrat.locAdresse+"</span></div>",
    permisHtml,docsLocHtml,"</div><hr>",
    "<div style='margin-bottom:8px'><div class='st'>1. Vehicule</div>",
    "<div class='row'><span><span class='lbl'>Marque : </span><span class='val'>"+vehicle.marque+"</span></span><span><span class='lbl'>Modele : </span><span class='val'>"+vehicle.modele+"</span></span><span><span class='lbl'>Immat : </span><span class='val'>"+vehicle.immat+"</span></span></div>",
    "<div class='row'><span><span class='lbl'>Couleur : </span><span class='val'>"+vehicle.couleur+"</span></span><span><span class='lbl'>Km depart : </span><span class='val'>"+(contrat.kmDepart||vehicle.km)+" km</span></span></div>",
    kmRow+fuelBar+etatHtml+photosHtml+"</div>",
    "<div style='margin-bottom:8px'><div class='st'>2. Duree &amp; Tarif</div>",
    "<div class='row'><span><span class='lbl'>Debut : </span><span class='val'>"+contrat.dateDebut+" a "+contrat.heureDebut+"</span></span><span><span class='lbl'>Fin : </span><span class='val'>"+contrat.dateFin+" a "+contrat.heureFin+"</span></span><span><span class='lbl'>Duree : </span><span class='val'>"+nb+" jour(s)</span></span></div>",
    tarifHtml+"<p style='margin-top:4px;font-size:9.5px;color:#555'>Tout retard = 20 EUR/heure.</p></div>",
    "<div style='margin-bottom:8px'><div class='st'>3. Paiement</div>",
    "<div class='tot'><span>Total location</span><strong>"+total+" EUR</strong></div>",
    "<div>["+(pm==="especes"?"X":" ")+"] Especes &nbsp; ["+(pm==="virement"?"X":" ")+"] Virement &nbsp; ["+(pm==="autre"?"X":" ")+"] Autre</div></div>",
    "<div style='margin-bottom:8px'><div class='st'>4. Caution - "+vehicle.caution+" EUR ("+cautionMode+")</div>",
    "<p>Caution de <strong>"+vehicle.caution+" EUR</strong> versee avant remise des cles. <strong>Mode : "+cautionMode+"</strong></p>",
    "<table class='ft'><tr style='background:#e8edf5;font-weight:bold'><td colspan='2'>Frais deductibles sur la caution</td></tr>"+fraisRows+"</table></div>",
    "<div style='margin-bottom:8px'><div class='st'>5. Assurance et Responsabilite</div><p>Le vehicule est assure pour le pret a titre gratuit. Le Loueur decline toute responsabilite.</p></div>",
    "<div style='margin-bottom:8px'><div class='st'>Clauses Particulieres</div>"+clausesHtml+"</div>",
    "<hr><p style='font-size:10px;margin-bottom:12px'>Fait a "+profil.ville+", le "+new Date().toLocaleDateString("fr-FR")+"</p>",
    "<div class='sig-area'><div class='sig-box'><p>Signature du Loueur ("+profil.nom+")</p>"+sL+"</div>",
    "<div class='sig-box'><p>Signature du Locataire ("+contrat.locNom+")</p>"+sLoc+"</div></div>",
    "</div></body></html>"].join("");
}

function buildPVRetourHTML(contrat,vehicle,retourData,sigLoueur,sigLocataire,profil){
  const d=retourData,caution=vehicle?.caution||0;
  const total=(contrat.totalCalc||0)+(d.surplusKm||0)+(d.montantRetenu||0);
  const fBar=pct=>"<div style='background:#e5e7eb;border-radius:99px;height:8px;width:120px;display:inline-block;vertical-align:middle;overflow:hidden;margin-left:6px'><div style='width:"+pct+"%;background:"+fuelColor(pct)+";height:100%'></div></div>";
  const carroNOK=CARRO_ELEMENTS.filter(e=>d.carro&&d.carro[e.id]===false);
  const carroRows=carroNOK.length>0?carroNOK.map(e=>"<tr><td>"+e.label+"</td><td style='color:#dc2626;font-weight:700'>Degat</td><td>"+(d.carroNotes&&d.carroNotes[e.id]?d.carroNotes[e.id]:"-")+"</td>"+(d.carroPhotos&&d.carroPhotos[e.id]?"<td><img src='"+d.carroPhotos[e.id]+"' style='width:80px;height:60px;object-fit:cover;border-radius:4px'></td>":"<td>-</td>")+"</tr>").join(""):"<tr><td colspan='4' style='color:#16a34a;font-weight:600;text-align:center'>Aucun degat constate</td></tr>";
  const checksRows=RETOUR_CHECKS.map(c=>{const val=d.checks&&d.checks[c.id];return"<tr><td>"+c.icon+" "+c.label+"</td><td style='font-weight:700;color:"+(val===true?"#16a34a":val===false?"#dc2626":"#6b7280")+"'>"+(val===true?"OK":val===false?"NON":"?")+"</td><td>"+(d.notes&&d.notes[c.id]?d.notes[c.id]:"-")+"</td></tr>";}).join("");
  const sL=sigLoueur?"<img src='"+sigLoueur+"' style='max-width:160px;height:60px;display:block;margin:0 auto;border-bottom:1px solid #333'>":"<div style='border-bottom:1px solid #333;height:60px;width:160px;margin:0 auto'></div>";
  const sLoc=sigLocataire?"<img src='"+sigLocataire+"' style='max-width:160px;height:60px;display:block;margin:0 auto;border-bottom:1px solid #333'>":"<div style='border-bottom:1px solid #333;height:60px;width:160px;margin:0 auto'></div>";
  const kmParcourus=d.kmRetour?parseFloat(d.kmRetour)-parseFloat(contrat.kmDepart||vehicle?.km||0):null;
  return`<!DOCTYPE html><html><head><meta charset='utf-8'><title>PV Retour - ${contrat.locNom}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#111}
.hd{background:#0a1940;color:#fff;padding:14px 20px;text-align:center}.hd h1{font-size:20px;letter-spacing:2px;margin-bottom:4px}.hd p{font-size:9px;opacity:.8;margin:2px 0}
.bd{padding:14px 20px}.title{text-align:center;font-size:15px;font-weight:bold;margin:10px 0 8px;text-transform:uppercase;border-bottom:3px solid #dc2626;padding-bottom:6px;color:#0a1940}
.st{font-size:11px;font-weight:bold;background:#e8edf5;padding:4px 8px;margin-bottom:6px;border-left:3px solid #0a1940}
.lbl{color:#555;font-size:10px}.val{font-weight:bold}hr{border:none;border-top:1px solid #ccc;margin:8px 0}
table{width:100%;border-collapse:collapse;font-size:10px;margin-top:5px}table td,table th{border:1px solid #ddd;padding:4px 7px}
table th{background:#e8edf5;font-weight:700}table tr:nth-child(even){background:#f9f9f9}
.bilan{background:#0a1940;color:#fff;padding:10px 14px;border-radius:8px;margin:10px 0}
.br{display:flex;justify-content:space-between;font-size:12px;padding:3px 0}
.sig-area{display:flex;justify-content:space-between;margin-top:16px;gap:30px}.sig-box{flex:1;text-align:center}.sig-box p{font-size:10px;font-weight:bold;margin-bottom:6px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
<div class='hd'><h1>${profil.entreprise||"MAN'S LOCATION"}</h1><p>LOCATION DE CITADINES EN IDF</p><p>SIRET : ${profil.siret||profil.siren} | Tel : ${profil.tel} | ${profil.adresse}</p></div>
<div class='bd'><div class='title'>Proces-Verbal de Retour de Vehicule</div>
<div style='display:flex;gap:14px;margin-bottom:10px'>
  <div style='flex:1;background:#f8fafc;border-radius:8px;padding:10px;border:1px solid #e5e7eb'><div class='st'>Loueur</div><div><span class='lbl'>Nom : </span><span class='val'>${profil.nom}</span></div><div><span class='lbl'>Tel : </span><span class='val'>${profil.tel}</span></div></div>
  <div style='flex:1;background:#f8fafc;border-radius:8px;padding:10px;border:1px solid #e5e7eb'><div class='st'>Locataire</div><div><span class='lbl'>Nom : </span><span class='val'>${contrat.locNom.toUpperCase()}</span></div><div><span class='lbl'>Tel : </span><span class='val'>${contrat.locTel}</span></div></div>
</div>
<div style='margin-bottom:10px'><div class='st'>1. Vehicule & Dates</div>
  <div><span class='lbl'>Vehicule : </span><span class='val'>${vehicle?.marque||""} ${vehicle?.modele||""} - ${vehicle?.immat||""} (${vehicle?.couleur||""})</span></div>
  <div style='display:flex;gap:20px;margin-top:4px;flex-wrap:wrap'>
    <div><span class='lbl'>Depart : </span><span class='val'>${contrat.dateDebut} a ${contrat.heureDebut}</span></div>
    <div><span class='lbl'>Retour le : </span><span class='val'>${new Date(d.date||Date.now()).toLocaleDateString("fr-FR")}</span></div>
    <div><span class='lbl'>Duree : </span><span class='val'>${contrat.nbJours} jour(s)</span></div>
  </div>
</div>
<div style='margin-bottom:10px'><div class='st'>2. Kilometrage & Carburant</div>
  <table><tr><th>Indicateur</th><th>Depart</th><th>Retour</th><th>Ecart</th></tr>
  <tr><td>Kilometrage</td><td>${contrat.kmDepart||vehicle?.km||"?"} km</td><td><b>${d.kmRetour||"?"} km</b></td><td style='font-weight:700;color:${(d.kmSup||0)>0?"#d97706":"#16a34a"}'>${kmParcourus!==null?kmParcourus+" km":"?"}</td></tr>
  <tr><td>Carburant</td><td>${contrat.carburantDepart||100}% ${fBar(contrat.carburantDepart||100)}</td><td>${d.carburantRetour||0}% ${fBar(d.carburantRetour||0)}</td><td style='font-weight:700;color:${(d.carburantRetour||0)<(contrat.carburantDepart||100)?"#dc2626":"#16a34a"}'>${(d.carburantRetour||0)<(contrat.carburantDepart||100)?"Manquant":"OK"}</td></tr></table>
  ${(d.kmSup||0)>0?"<div style='background:#fef3c7;border-radius:6px;padding:6px 10px;margin-top:6px;font-size:10px;color:#92400e'>Km sup : "+d.kmSup+" km x "+(vehicle?.prixKmSup||0)+" EUR/km = <b>"+(d.surplusKm||0).toFixed(2)+" EUR</b></div>":""}
</div>
<div style='margin-bottom:10px'><div class='st'>3. Etat general</div><table><tr><th>Verification</th><th>Etat</th><th>Observation</th></tr>${checksRows}</table></div>
<div style='margin-bottom:10px'><div class='st'>4. Carrosserie (${carroNOK.length} degat${carroNOK.length>1?"s":""})</div><table><tr><th>Element</th><th>Etat</th><th>Description</th><th>Photo</th></tr>${carroRows}</table></div>
<div style='margin-bottom:10px'><div class='st'>5. Caution - ${caution} EUR</div>
  ${d.cautionRestituee?"<div style='color:#16a34a;font-weight:700;padding:6px 0'>Restituee integralement - "+caution+" EUR</div>":"<div style='color:#dc2626;font-weight:700;padding:4px 0'>Retenue partielle - "+d.montantRetenu+" EUR retenus"+(d.raisonRetenue?" ("+d.raisonRetenue+")":"")+"</div><div style='margin-top:4px'>Montant rembourse : "+Math.max(0,caution-(d.montantRetenu||0))+" EUR</div>"}
</div>
<div class='bilan'>
  <div style='font-weight:800;font-size:13px;margin-bottom:8px'>Bilan financier du retour</div>
  <div class='br'><span style='opacity:.7'>Location (${contrat.nbJours}j)</span><span style='font-weight:700'>${contrat.totalCalc||0} EUR</span></div>
  ${(d.surplusKm||0)>0?"<div class='br'><span style='opacity:.7'>Km supplementaires</span><span style='color:#fbbf24;font-weight:700'>+"+((d.surplusKm||0).toFixed(2))+" EUR</span></div>":""}
  ${(d.montantRetenu||0)>0?"<div class='br'><span style='opacity:.7'>Retenue caution</span><span style='color:#fbbf24;font-weight:700'>+"+d.montantRetenu+" EUR</span></div>":""}
  <div class='br' style='border-top:1px solid rgba(255,255,255,.2);margin-top:4px;padding-top:6px'><span style='font-weight:800'>Total encaisse</span><span style='font-size:16px;font-weight:900;color:#4ade80'>${total.toFixed(2)} EUR</span></div>
</div>
<hr><p style='font-size:10px;margin-bottom:14px'>Fait a ${profil.ville}, le ${new Date().toLocaleDateString("fr-FR")} - Les deux parties reconnaissent l'exactitude du present proces-verbal.</p>
<div class='sig-area'><div class='sig-box'><p>Signature du Loueur (${profil.nom})</p>${sL}</div><div class='sig-box'><p>Signature du Locataire (${contrat.locNom})</p>${sLoc}</div></div>
</div></body></html>`;
}

// ─── COMPOSANTS UI ─────────────────────────────────────────────────────────────

// ⚠️ F et CheckBool sont définis ICI, EN DEHORS de AppContent
// → leur référence est stable entre les renders → plus de perte de focus
const LBL_STYLE={fontSize:11,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3};
const INP_STYLE=(extra={})=>({width:"100%",border:"1px solid #d1d5db",borderRadius:8,padding:"7px 10px",fontSize:12,boxSizing:"border-box",...extra});

function F({k,label,type,span2,form,setForm,touched,setTouched,req}){
  const inv=touched[k]&&!form[k];
  return(
    <div style={span2?{gridColumn:"span 2"}:{}}>
      <label style={LBL_STYLE}>{label}</label>
      <input
        type={type||"text"}
        placeholder={label}
        style={INP_STYLE(inv?{borderColor:"#f87171",background:"#fef2f2"}:{})}
        value={form[k]}
        onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
        onBlur={()=>{if(req.includes(k))setTouched(t=>({...t,[k]:true}));}}
      />
      {inv&&<p style={{color:"#ef4444",fontSize:10,marginTop:2}}>Obligatoire</p>}
    </div>
  );
}

function CheckBool({label,icon,val,onChange}){
  return(
    <div style={{borderRadius:10,border:`2px solid ${val===true?"#16a34a":val===false?"#ef4444":"#e5e7eb"}`,background:val===true?"#f0fdf4":val===false?"#fef2f2":"white",padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:18}}>{icon}</span>
      <span style={{flex:1,fontSize:12,fontWeight:600}}>{label}</span>
      <button onClick={()=>onChange(true)} style={{padding:"4px 10px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:val===true?"#16a34a":"#e5e7eb",color:val===true?"white":"#374151"}}>Oui</button>
      <button onClick={()=>onChange(false)} style={{padding:"4px 10px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:val===false?"#ef4444":"#e5e7eb",color:val===false?"white":"#374151"}}>Non</button>
    </div>
  );
}

function TelInput({value,onChange,placeholder,style}){
  const parts=(value||"").match(/^(\+\d+)\s(.*)$/);
  const code=parts?parts[1]:"+33";
  const num=parts?parts[2]:(value||"");
  function update(c,n){onChange(n?c+" "+n:c+" ");}
  const IS={border:"1px solid #d1d5db",borderRadius:8,padding:"7px 8px",fontSize:12,boxSizing:"border-box",...(style||{})};
  return(
    <div style={{display:"flex",gap:4,width:"100%"}}>
      <select value={code} onChange={e=>update(e.target.value,num)} style={{...IS,width:88,flexShrink:0,padding:"7px 3px"}}>
        {PAYS_CODES.map(p=><option key={p.code} value={p.code}>{p.pays.split(" ")[0]} {p.code}</option>)}
      </select>
      <input value={num} onChange={e=>update(code,e.target.value)} placeholder={placeholder||"Numéro"} style={{...IS,flex:1}}/>
    </div>
  );
}

function FuelGauge({value,onChange,readOnly}){
  const pct=parseInt(value)||0,col=fuelColor(pct);
  const steps=[0,10,20,30,40,50,60,70,80,90,100];
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
      {!readOnly&&<div style={{display:"flex",gap:2,flexWrap:"wrap"}}>{steps.map(s=><button key={s} onClick={()=>onChange(s)} style={{flex:"1 0 auto",padding:"4px 2px",borderRadius:6,border:`2px solid ${pct===s?col:"#e5e7eb"}`,background:pct===s?col:"white",color:pct===s?"white":"#374151",fontSize:10,fontWeight:700,cursor:"pointer",minWidth:28}}>{s===0?"V":s===100?"P":s}</button>)}</div>}
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
      <canvas ref={ref} width={260} height={90} style={{border:"2px dashed #d1d5db",borderRadius:8,background:"white",cursor:"crosshair",touchAction:"none"}} onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={draw} onTouchEnd={stop}/>
      <div style={{display:"flex",gap:8}}>
        <button onClick={clear} style={{padding:"4px 10px",background:"#e5e7eb",border:"none",borderRadius:6,cursor:"pointer",fontSize:11}}>Effacer</button>
        <button onClick={save} style={{padding:"4px 10px",background:saved?"#16a34a":"#2563eb",color:"white",border:"none",borderRadius:6,cursor:"pointer",fontSize:11}}>{saved?"✓ OK":"Valider"}</button>
      </div>
    </div>
  );
}

function PhotosDepart({photos,setPhotos}){
  const labels=["Avant","Arrière","Côté gauche","Côté droit","Intérieur","Jante AVG","Jante AVD","Jante ARG","Jante ARD","Autre"];
  function addPhoto(label,file){if(!file)return;const r=new FileReader();r.onload=ev=>setPhotos(p=>[...p,{id:Date.now(),label,data:ev.target.result,name:file.name}]);r.readAsDataURL(file);}
  function pickFile(label){const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>addPhoto(label,e.target.files[0]);i.click();}
  function pickCamera(label){const i=document.createElement("input");i.type="file";i.accept="image/*";i.capture="environment";i.onchange=e=>addPhoto(label,e.target.files[0]);i.click();}
  function removePhoto(id){setPhotos(p=>p.filter(x=>x.id!==id));}
  return(
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:12}}>
        {labels.map(lb=>(<div key={lb} style={{display:"flex",flexDirection:"column",gap:4}}><div style={{fontSize:10,fontWeight:600,color:"#6b7280",textAlign:"center"}}>{lb}</div><button onClick={()=>pickFile(lb)} style={{background:"#1e3a8a",color:"white",borderRadius:8,padding:"6px 0",fontSize:10,fontWeight:700,cursor:"pointer",border:"none"}}>📁</button><button onClick={()=>pickCamera(lb)} style={{background:"#7c3aed",color:"white",border:"none",borderRadius:8,padding:"5px 0",fontSize:10,fontWeight:700,cursor:"pointer"}}>📷</button></div>))}
      </div>
      {photos.length>0?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8}}>{photos.map(p=>(<div key={p.id} style={{position:"relative",borderRadius:9,overflow:"hidden",border:"2px solid #e5e7eb"}}><img src={p.data} alt={p.label} style={{width:"100%",height:80,objectFit:"cover",display:"block"}}/><div style={{background:"rgba(0,0,0,.55)",color:"white",fontSize:9,fontWeight:600,padding:"2px 5px",position:"absolute",bottom:0,left:0,right:0,textAlign:"center"}}>{p.label}</div><button onClick={()=>removePhoto(p.id)} style={{position:"absolute",top:3,right:3,background:"#ef4444",color:"white",border:"none",borderRadius:"50%",width:18,height:18,fontSize:11,cursor:"pointer",fontWeight:700,lineHeight:"18px",textAlign:"center",padding:0}}>x</button></div>))}</div>:<div style={{textAlign:"center",color:"#9ca3af",fontSize:12,padding:12,background:"#f9fafb",borderRadius:8,border:"1px dashed #d1d5db"}}>Aucune photo</div>}
    </div>
  );
}

function PhotosVehicule({photos,setPhotos,max=5}){
  function addPhoto(file){if(!file)return;if(photos.length>=max){alert("Maximum "+max+" photos");return;}const r=new FileReader();r.onload=ev=>setPhotos(p=>[...p,{id:Date.now(),data:ev.target.result,name:file.name}]);r.readAsDataURL(file);}
  function pickFile(){const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>addPhoto(e.target.files[0]);i.click();}
  function pickCamera(){const i=document.createElement("input");i.type="file";i.accept="image/*";i.capture="environment";i.onchange=e=>addPhoto(e.target.files[0]);i.click();}
  function remove(id){setPhotos(p=>p.filter(x=>x.id!==id));}
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={pickFile} disabled={photos.length>=max} style={{flex:1,padding:"8px 0",background:"#1e3a8a",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",opacity:photos.length>=max?.5:1}}>📁 Galerie</button>
        <button onClick={pickCamera} disabled={photos.length>=max} style={{flex:1,padding:"8px 0",background:"#7c3aed",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",opacity:photos.length>=max?.5:1}}>📷 Photo</button>
        <span style={{fontSize:11,color:"#9ca3af",alignSelf:"center"}}>{photos.length}/{max}</span>
      </div>
      {photos.length>0?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:7}}>{photos.map((p,i)=>(<div key={p.id} style={{position:"relative",borderRadius:8,overflow:"hidden",border:"2px solid #e5e7eb"}}><img src={p.data} alt="" style={{width:"100%",height:75,objectFit:"cover",display:"block"}}/>{i===0&&<div style={{position:"absolute",top:3,left:3,background:"#2563eb",color:"white",fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:4}}>COUV</div>}<button onClick={()=>remove(p.id)} style={{position:"absolute",top:3,right:3,background:"#ef4444",color:"white",border:"none",borderRadius:"50%",width:16,height:16,fontSize:10,cursor:"pointer",fontWeight:700,lineHeight:"16px",textAlign:"center",padding:0}}>x</button></div>))}</div>:<div style={{textAlign:"center",color:"#9ca3af",fontSize:11,padding:10,background:"#f9fafb",borderRadius:8,border:"1px dashed #d1d5db"}}>Aucune photo</div>}
    </div>
  );
}

function PhotosVehiculeModal({vehicle,onClose,onSave}){
  const[photos,setPhotos]=useState((vehicle.photosVehicule||[]).map(p=>({...p})));
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:480,overflow:"hidden"}}>
        <div style={{padding:"14px 18px",background:"#0a1940",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><b style={{color:"white",fontSize:14}}>Photos - {vehicle.marque} {vehicle.modele}</b><div style={{fontSize:10,color:"rgba(255,255,255,.6)"}}>5 photos max</div></div>
          <button onClick={onClose} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:"white"}}>x</button>
        </div>
        <div style={{padding:16}}><PhotosVehicule photos={photos} setPhotos={setPhotos} max={5}/></div>
        <div style={{padding:"12px 16px",borderTop:"1px solid #e5e7eb",display:"flex",gap:8}}>
          <button onClick={()=>onSave(photos)} style={{flex:1,background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
          <button onClick={onClose} style={{padding:"10px 16px",background:"#e5e7eb",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

function DocsLocataire({docs,setDocs}){
  function pickImg(key,capture=false){const i=document.createElement("input");i.type="file";i.accept="image/*";if(capture)i.capture="environment";i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setDocs(d=>({...d,[key]:ev.target.result}));r.readAsDataURL(f);};i.click();}
  function removeImg(key){setDocs(d=>{const n={...d};delete n[key];return n;});}
  const ITEMS=[{key:"cniRecto",label:"CNI / Passeport - Recto",color:"#2563eb",icon:"🪪"},{key:"cniVerso",label:"CNI / Passeport - Verso",color:"#2563eb",icon:"🪪"},{key:"justifDom",label:"Justificatif de domicile",color:"#7c3aed",icon:"🏠"},{key:"photoAr",label:"Photo arrière du véhicule",color:"#16a34a",icon:"🚗"}];
  return(
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {ITEMS.map(({key,label,color,icon})=>(
        <div key={key} style={{borderRadius:10,border:`2px solid ${docs[key]?color:"#e5e7eb"}`,background:docs[key]?"#f8fafc":"white",overflow:"hidden"}}>
          <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>{icon}</span>
            <span style={{flex:1,fontWeight:600,fontSize:12,color:docs[key]?color:"#374151"}}>{label}</span>
            {docs[key]?<button onClick={()=>removeImg(key)} style={{padding:"3px 8px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>Retirer</button>:<div style={{display:"flex",gap:6}}><button onClick={()=>pickImg(key,false)} style={{padding:"5px 10px",background:"#1e3a8a",color:"white",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>📁</button><button onClick={()=>pickImg(key,true)} style={{padding:"5px 10px",background:"#7c3aed",color:"white",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>📷</button></div>}
          </div>
          {docs[key]&&<div style={{padding:"0 12px 10px"}}><img src={docs[key]} alt={label} style={{width:"100%",maxHeight:160,objectFit:"cover",borderRadius:8,border:`2px solid ${color}`}}/></div>}
        </div>
      ))}
    </div>
  );
}

function DemandeVehicule({vehicle,profil,userId}){
  const[open,setOpen]=useState(false);
  const[tab,setTab]=useState("resa");
  const[form,setForm]=useState({prenom:"",nom:"",age:"",tel:"+33 ",email:"",dateDebut:"",dateFin:"",message:""});
  const[question,setQuestion]=useState("");
  const[sent,setSent]=useState(false);
  const[qSent,setQSent]=useState(false);
  const wa=(profil.whatsapp||profil.tel||"").replace(/\D/g,"");
  function sendWhatsApp(){
    const nbJ=form.dateDebut&&form.dateFin?Math.max(1,Math.ceil((new Date(form.dateFin)-new Date(form.dateDebut))/86400000)):null;
    const msg="Bonjour, je vous contacte pour louer un vehicule.\n\nJe m'appelle "+form.prenom+" "+form.nom+", j'ai "+form.age+" ans.\nTel : "+form.tel+"\nEmail : "+form.email+"\n\nJe souhaite louer le "+vehicle.marque+" "+vehicle.modele+" du "+form.dateDebut+" au "+form.dateFin+(nbJ?" ("+nbJ+"j)\n":"\n")+(form.message?"\nMessage : "+form.message+"\n":"")+"\nMerci !";
    window.open("https://wa.me/"+wa+"?text="+encodeURIComponent(msg),"_blank");
    setSent(true);
  }
  async function sendQuestion(){
    if(!question.trim()){alert("Ecrivez votre question");return;}
    if(userId)await supabase.from('questions').insert([{user_id:userId,vehicle_id:vehicle.id,vehicle_label:vehicle.marque+" "+vehicle.modele,client_nom:"Client vitrine",client_tel:"",question:question,lu:false}]);
    setQSent(true);setQuestion("");
  }
  if(!open)return(
    <div style={{display:"flex",gap:6,marginTop:6}}>
      <button onClick={()=>{setOpen(true);setTab("resa");setSent(false);setQSent(false);}} style={{flex:1,padding:"8px 0",background:"#1e3a8a",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>📅 Réserver</button>
      <button onClick={()=>{setOpen(true);setTab("question");setSent(false);setQSent(false);}} style={{flex:1,padding:"8px 0",background:"#f1f5f9",color:"#374151",border:"1px solid #e5e7eb",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>❓ Question</button>
    </div>
  );
  return(
    <div style={{marginTop:8,background:"#f8fafc",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        <button onClick={()=>setTab("resa")} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",cursor:"pointer",fontWeight:tab==="resa"?700:400,background:tab==="resa"?"#1e3a8a":"#e5e7eb",color:tab==="resa"?"white":"#374151",fontSize:12}}>📅 Réservation</button>
        <button onClick={()=>setTab("question")} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",cursor:"pointer",fontWeight:tab==="question"?700:400,background:tab==="question"?"#7c3aed":"#e5e7eb",color:tab==="question"?"white":"#374151",fontSize:12}}>❓ Question</button>
        <button onClick={()=>setOpen(false)} style={{padding:"7px 10px",borderRadius:8,border:"none",cursor:"pointer",background:"#fef2f2",color:"#ef4444",fontSize:12,fontWeight:700}}>✕</button>
      </div>
      {tab==="resa"&&(sent?(
        <div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:32,marginBottom:8}}>✅</div>
          <div style={{fontWeight:700,fontSize:14,color:"#16a34a",marginBottom:6}}>Demande envoyée !</div>
          <button onClick={()=>{setSent(false);setForm({prenom:"",nom:"",age:"",tel:"+33 ",email:"",dateDebut:"",dateFin:"",message:""});}} style={{padding:"8px 16px",background:"#e5e7eb",border:"none",borderRadius:8,fontSize:12,cursor:"pointer"}}>Nouvelle demande</button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <input placeholder="Prénom *" value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box"}}/>
            <input placeholder="Nom *" value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box"}}/>
          </div>
          <input placeholder="Âge *" type="number" value={form.age} onChange={e=>setForm(f=>({...f,age:e.target.value}))} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box",width:"100%"}}/>
          <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Téléphone *</div><TelInput value={form.tel} onChange={v=>setForm(f=>({...f,tel:v}))} placeholder="06 12 34 56 78" style={{padding:"8px 8px",fontSize:13}}/></div>
          <input placeholder="Email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box",width:"100%"}}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Début *</div><input type="date" value={form.dateDebut} onChange={e=>setForm(f=>({...f,dateDebut:e.target.value}))} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,width:"100%",boxSizing:"border-box"}}/></div>
            <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Fin *</div><input type="date" value={form.dateFin} onChange={e=>setForm(f=>({...f,dateFin:e.target.value}))} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,width:"100%",boxSizing:"border-box"}}/></div>
          </div>
          {form.dateDebut&&form.dateFin&&new Date(form.dateFin)>new Date(form.dateDebut)&&<div style={{background:"#eff6ff",borderRadius:8,padding:"7px 10px",fontSize:12,color:"#2563eb",fontWeight:600}}>{Math.ceil((new Date(form.dateFin)-new Date(form.dateDebut))/86400000)} jour(s) — {Math.ceil((new Date(form.dateFin)-new Date(form.dateDebut))/86400000)*vehicle.tarif} EUR</div>}
          <textarea placeholder="Message (optionnel)" value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} rows={2} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,resize:"none",fontFamily:"inherit"}}/>
          <button onClick={()=>{if(!form.prenom||!form.nom||!form.tel||!form.dateDebut||!form.dateFin){alert("Champs * obligatoires");return;}sendWhatsApp();}} style={{width:"100%",padding:"10px 0",background:"#25D366",color:"white",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>💬 Envoyer sur WhatsApp</button>
        </div>
      ))}
      {tab==="question"&&(qSent?(
        <div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:32,marginBottom:8}}>✅</div>
          <div style={{fontWeight:700,fontSize:14,color:"#16a34a",marginBottom:6}}>Question envoyée !</div>
          <button onClick={()=>setQSent(false)} style={{padding:"8px 16px",background:"#e5e7eb",border:"none",borderRadius:8,fontSize:12,cursor:"pointer"}}>Nouvelle question</button>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:12,color:"#6b7280",background:"#eff6ff",borderRadius:8,padding:"10px 12px",border:"1px solid #bfdbfe"}}>Les réponses seront visibles sur ce site.</div>
          <textarea placeholder="Votre question..." value={question} onChange={e=>setQuestion(e.target.value)} rows={4} style={{padding:"10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,resize:"none",fontFamily:"inherit"}}/>
          <button onClick={sendQuestion} style={{width:"100%",padding:"10px 0",background:"#7c3aed",color:"white",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Envoyer la question</button>
        </div>
      ))}
    </div>
  );
}

function RetourModal({contrat,vehicle,profil,onClose,onSave}){
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
  const[sigRetourLoueur,setSigRetourLoueur]=useState(null);
  const[sigRetourLocataire,setSigRetourLocataire]=useState(null);
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
  function handlePhoto(id,file,setter){if(!file)return;const r=new FileReader();r.onload=ev=>setter(p=>({...p,[id]:ev.target.result}));r.readAsDataURL(file);}
  function pickFile(id,setter){const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>handlePhoto(id,e.target.files[0],setter);i.click();}
  function pickCamera(id,setter){const i=document.createElement("input");i.type="file";i.accept="image/*";i.capture="environment";i.onchange=e=>handlePhoto(id,e.target.files[0],setter);i.click();}
  function getRetourData(){return{checks,carro,carroPhotos,carroNotes,photos,notes,cautionRestituee,montantRetenu:retenu,raisonRetenue,rembourse:cautionRestituee?caution:Math.max(0,caution-retenu),kmRetour,kmSup,surplusKm,carburantRetour,date:new Date().toISOString(),sigRetourLoueur,sigRetourLocataire};}
  function downloadPV(){const data=getRetourData();dlPDF(buildPVRetourHTML(contrat,vehicle,data,sigRetourLoueur,sigRetourLocataire,profil));}
  function save(){if(cautionRestituee===null){alert("Précisez si la caution est restituée.");return;}const data=getRetourData();onSave(data);dlPDF(buildPVRetourHTML(contrat,vehicle,data,sigRetourLoueur,sigRetourLocataire,profil));}
  const TABS=[["km","📏 Km"],["carro","🚗 Carrosserie"],["checks","✅ État"],["caution","🔒 Caution"],["sig","✍️ Signatures"]];
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:12}}>
      <div style={{background:"#f8fafc",borderRadius:18,width:"100%",maxWidth:640,maxHeight:"93vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,.3)"}}>
        <div style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{color:"white",fontWeight:800,fontSize:15}}>Retour — {contrat.locNom}</div><div style={{color:"rgba(255,255,255,.65)",fontSize:11}}>{vehicle?.marque} {vehicle?.modele} · {vehicle?.immat}</div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={downloadPV} style={{background:"#fbbf24",color:"#1f2937",border:"none",borderRadius:8,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>📄 PV PDF</button>
            <button onClick={onClose} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:"white"}}>x</button>
          </div>
        </div>
        <div style={{display:"flex",background:"white",borderBottom:"1px solid #e5e7eb",overflowX:"auto"}}>
          {TABS.map(([id,lb])=>(<button key={id} onClick={()=>setTab(id)} style={{flexShrink:0,padding:"9px 10px",fontSize:10,fontWeight:tab===id?700:400,color:tab===id?"#2563eb":"#6b7280",background:"none",border:"none",borderBottom:tab===id?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}}>{lb}</button>))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:14}}>
          {tab==="km"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Kilométrage</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Km au départ</div><div style={{padding:"8px 10px",background:"#f3f4f6",borderRadius:8,fontSize:14,fontWeight:700}}>{contrat.kmDepart||vehicle?.km||"—"} km</div></div>
                <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Km au retour</div><input type="number" style={IS} placeholder="ex: 55350" value={kmRetour} onChange={e=>setKmRetour(e.target.value)}/></div>
              </div>
              {kmRetour&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                <div style={{background:"#eff6ff",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>Parcourus</div><div style={{fontWeight:800,fontSize:16,color:"#2563eb"}}>{kmParcourus} km</div></div>
                <div style={{background:kmSup>0?"#fef3c7":"#f0fdf4",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>Surplus</div><div style={{fontWeight:800,fontSize:16,color:kmSup>0?"#d97706":"#16a34a"}}>{kmSup} km</div></div>
                <div style={{background:surplusKm>0?"#fef2f2":"#f0fdf4",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>A facturer</div><div style={{fontWeight:800,fontSize:16,color:surplusKm>0?"#dc2626":"#16a34a"}}>{surplusKm.toFixed(2)} EUR</div></div>
              </div>}
            </div>
            <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Carburant retour</div>
              <div style={{fontSize:11,color:"#6b7280",marginBottom:8}}>Départ : <b>{contrat.carburantDepart||100}% — {fuelLabel(contrat.carburantDepart||100)}</b></div>
              <FuelGauge value={carburantRetour} onChange={setCarburantRetour}/>
            </div>
          </div>}
          {tab==="carro"&&<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:13}}>Carrosserie ({nbNOK} dégât{nbNOK>1?"s":""})</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{const n={};CARRO_ELEMENTS.forEach(e=>{n[e.id]=true;});setCarro(n);}} style={{padding:"5px 10px",background:"#16a34a",color:"white",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>Tout OK</button>
                <button onClick={()=>{const n={};CARRO_ELEMENTS.forEach(e=>{n[e.id]=null;});setCarro(n);}} style={{padding:"5px 10px",background:"#e5e7eb",color:"#374151",border:"none",borderRadius:7,fontSize:11,cursor:"pointer"}}>Reset</button>
              </div>
            </div>
            {zones.map(zone=>(<div key={zone} style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:"#6b7280",marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>{zone}</div>
              {CARRO_ELEMENTS.filter(e=>e.zone===zone).map(el=>{const val=carro[el.id];return(
                <div key={el.id} style={{borderRadius:9,border:`2px solid ${val===true?"#16a34a":val===false?"#ef4444":"#e5e7eb"}`,background:val===true?"#f0fdf4":val===false?"#fef2f2":"white",marginBottom:5,overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px"}}>
                    <span style={{flex:1,fontSize:12}}>{el.label}</span>
                    <button onClick={()=>setCarro(c=>({...c,[el.id]:true}))} style={{padding:"4px 12px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:val===true?"#16a34a":"#e5e7eb",color:val===true?"white":"#374151"}}>OK</button>
                    <button onClick={()=>setCarro(c=>({...c,[el.id]:false}))} style={{padding:"4px 12px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:val===false?"#ef4444":"#e5e7eb",color:val===false?"white":"#374151"}}>NON</button>
                  </div>
                  {val===false&&<div style={{padding:"0 10px 10px",borderTop:"1px solid #fecaca"}}>
                    <input style={{...IS,marginTop:8,marginBottom:6,background:"white"}} placeholder="Décrire le dégât..." value={carroNotes[el.id]||""} onChange={e=>setCarroNotes(n=>({...n,[el.id]:e.target.value}))}/>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>pickFile(el.id,setCarroPhotos)} style={{flex:1,background:"#1e3a8a",color:"white",borderRadius:7,padding:"6px 0",fontSize:11,fontWeight:700,cursor:"pointer",border:"none"}}>Photo</button>
                      <button onClick={()=>pickCamera(el.id,setCarroPhotos)} style={{flex:1,background:"#7c3aed",color:"white",border:"none",borderRadius:7,padding:"6px 0",fontSize:11,fontWeight:700,cursor:"pointer"}}>Camera</button>
                    </div>
                    {carroPhotos[el.id]&&<div style={{marginTop:7,position:"relative",display:"inline-block"}}><img src={carroPhotos[el.id]} alt="" style={{maxWidth:"100%",maxHeight:120,borderRadius:7,border:"2px solid #fca5a5"}}/><button onClick={()=>setCarroPhotos(p=>{const n={...p};delete n[el.id];return n;})} style={{position:"absolute",top:3,right:3,background:"#ef4444",color:"white",border:"none",borderRadius:"50%",width:20,height:20,fontSize:11,cursor:"pointer",fontWeight:700}}>x</button></div>}
                  </div>}
                </div>
              );})}
            </div>))}
          </div>}
          {tab==="checks"&&<div>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Vérifications générales</div>
            {RETOUR_CHECKS.map(chk=>{const val=checks[chk.id];return(
              <div key={chk.id} style={{borderRadius:10,border:`2px solid ${val===true?"#16a34a":val===false?"#ef4444":"#e5e7eb"}`,background:val===true?"#f0fdf4":val===false?"#fef2f2":"white",marginBottom:8,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px"}}>
                  <span style={{fontSize:20,flexShrink:0}}>{chk.icon}</span>
                  <span style={{flex:1,fontWeight:600,fontSize:12}}>{chk.label}</span>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={()=>setChecks(c=>({...c,[chk.id]:true}))} style={{padding:"5px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:val===true?"#16a34a":"#e5e7eb",color:val===true?"white":"#374151"}}>Oui</button>
                    <button onClick={()=>setChecks(c=>({...c,[chk.id]:false}))} style={{padding:"5px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:val===false?"#ef4444":"#e5e7eb",color:val===false?"white":"#374151"}}>Non</button>
                  </div>
                </div>
                {val===false&&<div style={{padding:"0 12px 12px",borderTop:"1px solid #fecaca"}}>
                  <input style={{...IS,marginTop:8,marginBottom:6,background:"white"}} placeholder="Décrire..." value={notes[chk.id]||""} onChange={e=>setNotes(n=>({...n,[chk.id]:e.target.value}))}/>
                  <div style={{display:"flex",gap:7}}>
                    <button onClick={()=>pickFile(chk.id,setPhotos)} style={{flex:1,background:"#1e3a8a",color:"white",borderRadius:8,padding:"7px 0",fontSize:11,fontWeight:700,cursor:"pointer",border:"none"}}>Galerie</button>
                    <button onClick={()=>pickCamera(chk.id,setPhotos)} style={{flex:1,background:"#7c3aed",color:"white",border:"none",borderRadius:8,padding:"7px 0",fontSize:11,fontWeight:700,cursor:"pointer"}}>Photo</button>
                  </div>
                  {photos[chk.id]&&<div style={{marginTop:8,position:"relative",display:"inline-block"}}><img src={photos[chk.id]} alt="" style={{maxWidth:"100%",maxHeight:140,borderRadius:8,border:"2px solid #fca5a5"}}/><button onClick={()=>setPhotos(p=>{const n={...p};delete n[chk.id];return n;})} style={{position:"absolute",top:4,right:4,background:"#ef4444",color:"white",border:"none",borderRadius:"50%",width:22,height:22,fontSize:12,cursor:"pointer",fontWeight:700}}>x</button></div>}
                </div>}
              </div>
            );})}
          </div>}
          {tab==="caution"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>Caution — {caution} EUR</div>
              <div style={{fontSize:11,color:"#6b7280",marginBottom:12}}>La caution est-elle restituée intégralement ?</div>
              <div style={{display:"flex",gap:10,marginBottom:12}}>
                <button onClick={()=>{setCautionRestituee(true);setMontantRetenu("");setRaisonRetenue("");}} style={{flex:1,padding:"12px 0",borderRadius:10,border:`2px solid ${cautionRestituee===true?"#16a34a":"#e5e7eb"}`,background:cautionRestituee===true?"#16a34a":"white",color:cautionRestituee===true?"white":"#374151",fontWeight:800,fontSize:13,cursor:"pointer"}}>Oui<br/><span style={{fontSize:10,fontWeight:400}}>{caution} EUR remboursés</span></button>
                <button onClick={()=>setCautionRestituee(false)} style={{flex:1,padding:"12px 0",borderRadius:10,border:`2px solid ${cautionRestituee===false?"#ef4444":"#e5e7eb"}`,background:cautionRestituee===false?"#ef4444":"white",color:cautionRestituee===false?"white":"#374151",fontWeight:800,fontSize:13,cursor:"pointer"}}>Non<br/><span style={{fontSize:10,fontWeight:400}}>Retenue partielle</span></button>
              </div>
              {cautionRestituee===false&&<div style={{background:"#fef2f2",borderRadius:10,padding:12,border:"1px solid #fecaca",display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Montant retenu (EUR)</div><input type="number" style={{...IS,background:"white"}} placeholder="ex: 300" value={montantRetenu} onChange={e=>setMontantRetenu(e.target.value)} max={caution}/></div>
                  <div style={{display:"flex",alignItems:"flex-end"}}><div style={{width:"100%",background:"#fee2e2",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:10,color:"#dc2626"}}>Remboursé</div><div style={{fontSize:18,fontWeight:800,color:"#dc2626"}}>{Math.max(0,caution-retenu)} EUR</div></div></div>
                </div>
                <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Motif *</div><input style={{...IS,background:"white"}} placeholder="ex: Rayure aile avant..." value={raisonRetenue} onChange={e=>setRaisonRetenue(e.target.value)}/></div>
              </div>}
              {cautionRestituee===true&&<div style={{background:"#f0fdf4",borderRadius:10,padding:12,border:"1px solid #bbf7d0",textAlign:"center"}}><div style={{fontSize:11,color:"#16a34a",fontWeight:600}}>Caution remboursée intégralement</div><div style={{fontSize:22,fontWeight:900,color:"#16a34a"}}>{caution} EUR</div></div>}
            </div>
            {cautionRestituee!==null&&<div style={{background:"#1e3a8a",borderRadius:12,padding:14,color:"white"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Bilan du retour</div>
              <div style={{display:"flex",flexDirection:"column",gap:6,fontSize:12}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Loyer de base</span><span style={{fontWeight:700}}>{contrat.totalCalc||0} EUR</span></div>
                {surplusKm>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Surplus km</span><span style={{fontWeight:700,color:"#fbbf24"}}>+{surplusKm.toFixed(2)} EUR</span></div>}
                {retenu>0&&<div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Retenue caution</span><span style={{fontWeight:700,color:"#fbbf24"}}>+{retenu} EUR</span></div>}
                <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.2)",paddingTop:6,marginTop:4}}><span style={{fontWeight:700}}>Total encaissé</span><span style={{fontWeight:900,fontSize:16,color:"#4ade80"}}>{(contrat.totalCalc||0)+surplusKm+retenu} EUR</span></div>
              </div>
            </div>}
          </div>}
          {tab==="sig"&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{background:"#eff6ff",borderRadius:12,padding:12,border:"1px solid #bfdbfe",textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:"#1e3a8a",marginBottom:4}}>Signatures du procès-verbal</div></div>
            <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}><SigPad label="Signature du Loueur" onSave={setSigRetourLoueur}/></div>
            <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}><SigPad label="Signature du Locataire" onSave={setSigRetourLocataire}/></div>
            {sigRetourLoueur&&sigRetourLocataire&&<div style={{background:"#f0fdf4",borderRadius:10,padding:10,border:"1px solid #bbf7d0",textAlign:"center",fontSize:12,color:"#16a34a",fontWeight:700}}>Les deux signatures sont enregistrées ✓</div>}
          </div>}
        </div>
        <div style={{padding:"12px 16px",borderTop:"1px solid #e5e7eb",display:"flex",gap:8,background:"white"}}>
          <button onClick={save} disabled={cautionRestituee===null} style={{flex:1,background:cautionRestituee!==null?"#16a34a":"#9ca3af",color:"white",border:"none",borderRadius:10,padding:12,fontSize:13,fontWeight:700,cursor:cautionRestituee!==null?"pointer":"not-allowed"}}>Valider + PV PDF</button>
          <button onClick={downloadPV} style={{padding:"12px 14px",background:"#fbbf24",color:"#1f2937",border:"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>📄</button>
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
          <b style={{fontSize:14}}>{vehicle.marque} {vehicle.modele} — Frais & Clauses</b>
          <button onClick={onClose} style={{fontSize:22,background:"none",border:"none",cursor:"pointer"}}>x</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #e5e7eb",padding:"0 18px"}}>
          {[["frais","Frais"],["clauses","Clauses"]].map(([id,lbl])=>(<button key={id} onClick={()=>setTab(id)} style={{padding:"10px 14px",fontSize:12,fontWeight:tab===id?700:400,color:tab===id?"#2563eb":"#6b7280",background:"none",border:"none",borderBottom:tab===id?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}}>{lbl}</button>))}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {tab==="frais"&&<div>
            {frais.map(f=>(<div key={f.id} style={{display:"flex",gap:8,alignItems:"center",padding:8,background:"#f9fafb",borderRadius:8,marginBottom:6}}>
              <input style={{...IS,flex:1}} value={f.label} onChange={e=>setFrais(x=>x.map(a=>a.id===f.id?{...a,label:e.target.value}:a))}/>
              <input type="number" style={{...IS,width:70}} value={f.montant} onChange={e=>setFrais(x=>x.map(a=>a.id===f.id?{...a,montant:parseFloat(e.target.value)||0}:a))}/>
              <span style={{fontSize:11}}>EUR</span>
              <button onClick={()=>setFrais(x=>x.filter(a=>a.id!==f.id))} style={{padding:"3px 7px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:5,cursor:"pointer"}}>X</button>
            </div>))}
            <div style={{background:"#eff6ff",borderRadius:10,padding:12,border:"1px solid #bfdbfe",marginTop:8}}>
              <div style={{display:"flex",gap:8}}>
                <input style={{...IS,flex:1}} placeholder="Libellé" value={nf.label} onChange={e=>setNf(x=>({...x,label:e.target.value}))}/>
                <input type="number" style={{...IS,width:80}} placeholder="Montant" value={nf.montant} onChange={e=>setNf(x=>({...x,montant:e.target.value}))}/>
                <button onClick={()=>{if(!nf.label||!nf.montant)return;setFrais(x=>[...x,{id:Date.now(),label:nf.label,montant:parseFloat(nf.montant)}]);setNf({label:"",montant:""});}} style={{background:"#1d4ed8",color:"white",border:"none",borderRadius:7,padding:"6px 11px",fontWeight:700,cursor:"pointer"}}>+</button>
              </div>
            </div>
          </div>}
          {tab==="clauses"&&<div>
            {clauses.map((c,i)=>(<div key={c.id} style={{padding:10,background:"#f9fafb",borderRadius:10,border:"1px solid #e5e7eb",marginBottom:8}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                <span style={{fontSize:10,background:"#dbeafe",color:"#1d4ed8",fontWeight:700,padding:"2px 7px",borderRadius:999}}>{i+6}</span>
                <input style={{...IS,flex:1,fontWeight:600}} value={c.titre} onChange={e=>setClauses(x=>x.map(a=>a.id===c.id?{...a,titre:e.target.value}:a))}/>
                <button onClick={()=>setClauses(x=>x.filter(a=>a.id!==c.id))} style={{padding:"3px 7px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:5,cursor:"pointer"}}>X</button>
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
          <button onClick={()=>onSave(frais,clauses)} style={{flex:1,background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
          <button onClick={onClose} style={{padding:"10px 16px",background:"#e5e7eb",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Annuler</button>
        </div>
      </div>
    </div>
  );
}

function Badge({s}){return s==="loué"?<span style={{padding:"2px 8px",fontSize:10,background:"#fef2f2",color:"#dc2626",borderRadius:999,fontWeight:700}}>Loué</span>:<span style={{padding:"2px 8px",fontSize:10,background:"#f0fdf4",color:"#16a34a",borderRadius:999,fontWeight:700}}>Disponible</span>;}

function calcTarifAuto(vehicle,nbJours,heuresLoc,prixJourModifie){
  if(!vehicle)return{prix:0,label:"—"};
  if(prixJourModifie&&parseFloat(prixJourModifie)>0){
    const p=parseFloat(prixJourModifie)*nbJours;
    return{prix:p,label:`Personnalisé — ${prixJourModifie} €/j x ${nbJours}j`};
  }
  const h=heuresLoc||nbJours*24;
  const specials=(vehicle.tarifsSpeciaux||[]).slice().sort((a,b)=>{const ha=TARIFS_PRESETS.find(p=>p.type===a.type)?.heures||9999;const hb=TARIFS_PRESETS.find(p=>p.type===b.type)?.heures||9999;return ha-hb;});
  for(const t of specials){const preset=TARIFS_PRESETS.find(p=>p.type===t.type);if(preset&&h<=preset.heures){const prix=t.unite==="forfait"?parseFloat(t.prix):parseFloat(t.prix)*nbJours;return{prix,label:`${t.label||t.type} — ${t.prix} €`};}}
  return{prix:(vehicle.tarif||0)*nbJours,label:`Standard — ${vehicle.tarif} €/j x ${nbJours}j`};
}

// ─────────────────────────────────────────────
// APP CONTENT
// ─────────────────────────────────────────────
function AppContent(){
  const[user,setUser]=useState(null);
  const[vehicles,setVehicles]=useState([]);
  const[contrats,setContrats]=useState([]);
  const[depenses,setDepenses]=useState([]);
  const[clients,setClients]=useState([]);
  const[profil,setProfil]=useState(INIT_PROFIL);
  const[page,setPage]=useState("dashboard");
  const[selId,setSelId]=useState(null);
  const FORM0={locPrenom:"",locNom:"",locEntreprise:"",locAdresse:"",locTel:"+33 ",locEmail:"",locPermis:"",locReseaux:"",loc2Prenom:"",loc2Nom:"",dateDebut:"",heureDebut:"10:00",dateFin:"",heureFin:"10:00",paiement:"especes",cautionMode:"especes",kmDepart:"",nbJours:1,heuresLoc:24,carburantDepart:100,exterieurPropre:null,interieurPropre:null,prixJourModifie:"",accompte:"",remise:"",codePromo:""};
  const[form,setForm]=useState(FORM0);
  const[photosDepart,setPhotosDepart]=useState([]);
  const[photosVehicleModal,setPhotosVehicleModal]=useState(null);
  const[docsLocataire,setDocsLocataire]=useState({});
  const[questions,setQuestions]=useState([]);
  const[touched,setTouched]=useState({});
  const[sigL,setSigL]=useState(null);
  const[sigLoc,setSigLoc]=useState(null);
  const[vForm,setVForm]=useState({typeVehicule:"voiture",marque:"",modele:"",immat:"",couleur:"",annee:"",km:"",tarif:"",caution:"",kmInclus:"",prixKmSup:"",kmIllimite:false,motorisation:"Essence",boite:"Manuelle",puissanceFiscale:"",vin:"",nbPortes:"",nbPlaces:"",numParc:"",description:"",locationMin48:false});
  const[showAddV,setShowAddV]=useState(false);
  const[editV,setEditV]=useState(null);
  const[toast,setToast]=useState(null);
  const[planMonth,setPlanMonth]=useState(new Date());
  const[planView,setPlanView]=useState("calendrier");
  const ganttRef=useRef(null);
  const[ganttStartDate,setGanttStartDate]=useState(()=>{const d=new Date();d.setDate(1);return d;});
  const[reponseModal,setReponseModal]=useState(null);
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
  const[amendes,setAmendes]=useState([]);
  const[showAddAmende,setShowAddAmende]=useState(false);
  const[amendeForm,setAmendeForm]=useState({vehicleId:"",contratRef:"",date:"",heure:"",montant:"",type:"Excès de vitesse",statut:"A traiter",notes:""});
  const TYPES_AMENDE=["Excès de vitesse","Stationnement","Feu rouge","Téléphone au volant","Non port ceinture","Autre"];
  const STATUTS_AMENDE=["A traiter","En cours","Confirmée","Payée","Contestée"];
  const[reponseText,setReponseText]=useState("");
  const[searchContrat,setSearchContrat]=useState("");
  const[filterVehicleContrat,setFilterVehicleContrat]=useState("");
  const[filterDateDebut,setFilterDateDebut]=useState("");
  const[filterDateFin,setFilterDateFin]=useState("");
  const[searchRetour,setSearchRetour]=useState("");
  const[filterVehicleRetour,setFilterVehicleRetour]=useState("");
  const[filterRetourDateDebut,setFilterRetourDateDebut]=useState("");
  const[filterRetourDateFin,setFilterRetourDateFin]=useState("");
  const[searchClient,setSearchClient]=useState("");
  const[selectedClient,setSelectedClient]=useState(null);
  const[editingClient,setEditingClient]=useState(null);
  const[searchClientContrat,setSearchClientContrat]=useState("");
  const[showClientSuggestions,setShowClientSuggestions]=useState(false);

  const activeUserIdRef=useRef(null);
  const req=["locNom","locAdresse","locTel","dateDebut","dateFin"];

  function findContratForAmende(vehicleId,date,heure){
    if(!vehicleId||!date)return null;
    const dt=new Date(`${date}T${heure||"00:00"}`);
    return contrats.find(c=>c.vehicleId===vehicleId&&new Date(c.dateDebut)<=dt&&new Date(c.dateFin)>=dt)||null;
  }

  function upsertClient(contrat,docs){
    const key=(contrat.locNom||"").trim().toLowerCase()+"_"+(contrat.locTel||"").replace(/\D/g,"").slice(-6);
    setClients(prev=>{
      const existing=prev.find(c=>c.key===key);
      if(existing){return prev.map(c=>c.key===key?{...c,nom:contrat.locNom,tel:contrat.locTel,adresse:contrat.locAdresse,email:contrat.locEmail,permis:contrat.locPermis,docs:{...c.docs,...docs},updatedAt:new Date().toISOString()}:c);}
      return[...prev,{id:Date.now(),key,nom:contrat.locNom,tel:contrat.locTel,adresse:contrat.locAdresse,email:contrat.locEmail||"",permis:contrat.locPermis||"",docs:{...docs},createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}];
    });
  }

  const resetUserData=useCallback(()=>{
    setVehicles([]);setContrats([]);setDepenses([]);setRetours({});setQuestions([]);setClients([]);
    setProfil(INIT_PROFIL);setProfilForm(INIT_PROFIL);
    setSelId(null);setDocsId(null);setContratModalId(null);
    setLastContrat(null);setRetourContratId(null);setTarifsVehicleId(null);
    setDataLoaded(false);
  },[]);

  useEffect(()=>{
    const handleAuthRedirect=async()=>{
      try{const url=new URL(window.location.href);const code=url.searchParams.get("code");if(code){await supabase.auth.exchangeCodeForSession(code);window.history.replaceState({},document.title,url.pathname);return;}if(window.location.hash.includes("access_token=")||window.location.hash.includes("error=")){window.history.replaceState({},document.title,url.pathname);}}catch(err){console.error("Auth redirect error:",err);}
    };
    handleAuthRedirect().then(()=>{supabase.auth.getSession().then(({data:{session}})=>setUser(session?.user||null));});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user||null));
    return()=>subscription.unsubscribe();
  },[]);

  const loadAllData=useCallback(async(uid)=>{
    setDataLoaded(false);
    try{
      const[profRes,vehRes,conRes,depRes,retRes,qRes]=await Promise.all([
        supabase.from('profils').select('*').eq('user_id',uid).maybeSingle(),
        supabase.from('vehicules').select('*').eq('user_id',uid),
        supabase.from('contrats').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
        supabase.from('depenses').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
        supabase.from('retours').select('*').eq('user_id',uid),
        supabase.from('questions').select('*').eq('user_id',uid).order('created_at',{ascending:false}),
      ]);
      if(activeUserIdRef.current!==uid)return;
      const p=profRes.data||{};
      const profData={nom:p.nom||'',entreprise:p.entreprise||'',siren:p.siren||'',siret:p.siret||'',kbis:p.kbis||'',tel:p.tel||'',whatsapp:p.whatsapp||'',snap:p.snap||'',email:p.email||'',adresse:p.adresse||'',ville:p.ville||'',iban:p.iban||''};
      setProfil(profData);setProfilForm(profData);
      if(vehRes.data){setVehicles(vehRes.data.map(v=>({id:v.id,marque:v.marque||'',modele:v.modele||'',immat:v.immat||'',couleur:v.couleur||'',annee:v.annee||'',km:v.km||0,tarif:v.tarif||0,caution:v.caution||1000,kmInclus:v.km_inclus||0,prixKmSup:v.prix_km_sup||0,kmIllimite:v.km_illimite||false,docs:v.docs||[],frais:v.frais||DEF_FRAIS.map(f=>({...f})),clauses:v.clauses||DEF_CLAUSES.map(c=>({...c})),tarifsSpeciaux:v.tarifs_speciaux||[],photosVehicule:v.photos_vehicule||[],publie:v.publie||false})));}
      let loadedContrats=[];
      if(conRes.data){
        loadedContrats=conRes.data.map(c=>({id:c.id,locNom:c.loc_nom||'',locAdresse:c.loc_adresse||'',locTel:c.loc_tel||'',locEmail:c.loc_email||'',locPermis:c.loc_permis||'',dateDebut:c.date_debut||'',heureDebut:c.heure_debut||'10:00',dateFin:c.date_fin||'',heureFin:c.heure_fin||'10:00',paiement:c.paiement||'especes',cautionMode:c.caution_mode||'especes',kmDepart:c.km_depart||'',nbJours:c.nb_jours||1,heuresLoc:c.heures_loc||24,carburantDepart:c.carburant_depart??100,exterieurPropre:c.exterieur_propre,interieurPropre:c.interieur_propre,vehicleId:c.vehicle_id,vehicleLabel:c.vehicle_label||'',immat:c.immat||'',sigL:c.sig_l||null,sigLoc:c.sig_loc||null,totalCalc:c.total_calc||0,tarifLabel:c.tarif_label||'',photosDepart:c.photos_depart||[],docsLocataire:c.docs_locataire||{},fraisSnap:c.frais_snap||[],clausesSnap:c.clauses_snap||[],kmInclus:c.km_inclus,prixKmSup:c.prix_km_sup}));
        setContrats(loadedContrats);
        const clientMap={};
        loadedContrats.forEach(c=>{
          const key=(c.locNom||"").trim().toLowerCase()+"_"+(c.locTel||"").replace(/\D/g,"").slice(-6);
          if(!clientMap[key]){clientMap[key]={id:key,key,nom:c.locNom,tel:c.locTel,adresse:c.locAdresse,email:c.locEmail||"",permis:c.locPermis||"",docs:c.docsLocataire||{},createdAt:c.dateDebut,updatedAt:c.dateDebut};}
          else{clientMap[key]={...clientMap[key],docs:{...clientMap[key].docs,...(c.docsLocataire||{})}};}
        });
        setClients(Object.values(clientMap));
      }
      if(depRes.data){setDepenses(depRes.data.map(d=>({id:d.id,label:d.label||'',montant:d.montant||0,categorie:d.categorie||'Carburant',date:d.date||'',vehicleId:d.vehicle_id||''})));}
      if(retRes.data){const rMap={};retRes.data.forEach(r=>{rMap[r.contrat_id]={id:r.id,kmRetour:r.km_retour||'',carburantRetour:r.carburant_retour??100,montantRetenu:r.montant_retenu||0,raisonRetenue:r.raison_retenue||'',rembourse:r.rembourse||0,kmSup:r.km_sup||0,surplusKm:r.surplus_km||0,cautionRestituee:r.caution_restituee,checks:r.checks||{},carro:r.carro||{},carroPhotos:r.carro_photos||{},carroNotes:r.carro_notes||{},photos:r.photos||{},notes:r.notes||{},date:r.date||''};});setRetours(rMap);}
      if(qRes.data){setQuestions(qRes.data.map(q=>({id:q.id,vehicleLabel:q.vehicle_label||'',clientNom:q.client_nom||'',question:q.question||'',reponse:q.reponse||'',lu:q.lu||false,createdAt:q.created_at||''})));}
    }catch(e){console.error('Error loading data:',e);}
    finally{if(activeUserIdRef.current===uid)setDataLoaded(true);}
  },[]);

  useEffect(()=>{activeUserIdRef.current=user?.id||null;resetUserData();if(user)loadAllData(user.id);},[user,loadAllData,resetUserData]);

  const sel=selId?vehicles.find(v=>v.id===selId)||null:null;
  function toast_(msg,type="success"){setToast({msg,type});setTimeout(()=>setToast(null),3500);}

  function calcJ(d1,h1,d2,h2){
    if(!d1||!d2)return{jours:1,heures:24};
    const t1=new Date(`${d1}T${h1||"10:00"}`),t2=new Date(`${d2}T${h2||"10:00"}`);
    const diff=t2-t1;if(diff<=0)return{jours:1,heures:24};
    return{jours:Math.max(1,Math.ceil(diff/86400000)),heures:Math.ceil(diff/3600000)};
  }

  useEffect(()=>{
    if(form.dateDebut&&form.dateFin){
      const{jours,heures}=calcJ(form.dateDebut,form.heureDebut,form.dateFin,form.heureFin);
      setForm(f=>{if(f.nbJours===jours&&f.heuresLoc===heures)return f;return{...f,nbJours:jours,heuresLoc:heures};});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const cautionsNonRendues=contrats.filter(c=>!retours[c.id]).reduce((s,c)=>{const v=vehicles.find(x=>x.id===c.vehicleId);return s+(v?v.caution:0);},0);
  const devise=DEVISES.find(d=>d.code===(profil.devise||"EUR"))||DEVISES[0];
  const sym=devise.symbol;
  const tarifAuto=sel?calcTarifAuto(sel,form.nbJours,form.heuresLoc,form.prixJourModifie):{prix:0,label:"—"};
  const remise=parseFloat(form.remise)||0;
  const accompte=parseFloat(form.accompte)||0;
  const totalNet=Math.max(0,(tarifAuto.prix||0)-remise);
  const resteAPayer=Math.max(0,totalNet-accompte);
  const inv=k=>touched[k]&&!form[k];
  const nbQSansReponse=questions.filter(q=>!q.reponse).length;

  const contratsFiltres=contrats.filter(c=>{
    const q=searchContrat.toLowerCase();
    const matchQ=!q||(c.locNom.toLowerCase().includes(q)||c.immat.toLowerCase().includes(q)||c.locTel.includes(q));
    const matchV=!filterVehicleContrat||c.vehicleId===filterVehicleContrat;
    const matchD=!filterDateDebut||c.dateDebut>=filterDateDebut;
    const matchF=!filterDateFin||c.dateFin<=filterDateFin;
    return matchQ&&matchV&&matchD&&matchF;
  });

  const retoursFiltres=contrats.filter(c=>retours[c.id]).filter(c=>{
    const q=searchRetour.toLowerCase();
    const r=retours[c.id];
    const matchQ=!q||(c.locNom.toLowerCase().includes(q)||c.immat.toLowerCase().includes(q));
    const matchV=!filterVehicleRetour||c.vehicleId===filterVehicleRetour;
    const retourDate=r.date?r.date.slice(0,10):"";
    const matchD=!filterRetourDateDebut||retourDate>=filterRetourDateDebut;
    const matchF=!filterRetourDateFin||retourDate<=filterRetourDateFin;
    return matchQ&&matchV&&matchD&&matchF;
  });

  const clientSuggestions=searchClientContrat.length>1?clients.filter(c=>c.nom.toLowerCase().includes(searchClientContrat.toLowerCase())||c.tel.includes(searchClientContrat)):[];

  async function saveContrat(){
    const miss=req.filter(k=>!form[k]);
    if(!sel||miss.length>0){const t={};req.forEach(k=>t[k]=true);setTouched(t);toast_("Remplissez tous les champs obligatoires","error");return;}
    const ta=calcTarifAuto(sel,form.nbJours,form.heuresLoc,form.prixJourModifie);
    const locNom=`${form.locPrenom} ${form.locNom}`.trim();
    const c={id:Date.now(),...form,locNom,vehicleId:sel.id,vehicleLabel:sel.marque+" "+sel.modele,immat:sel.immat,sigL,sigLoc,totalCalc:totalNet,tarifLabel:ta.label,remise,accompte,resteAPayer,photosDepart:[...photosDepart],docsLocataire:{...docsLocataire},fraisSnap:(sel.frais||DEF_FRAIS).map(f=>({...f})),clausesSnap:(sel.clauses||DEF_CLAUSES).map(cl=>({...cl})),kmInclus:sel.kmInclus,prixKmSup:sel.prixKmSup};
    setContrats(p=>[c,...p]);
    upsertClient(c,docsLocataire);
    const html=buildContratHTML(c,sel,sigL,sigLoc,profil);
    setLastContrat({contrat:c,vehicle:sel,html});
    toast_("Contrat créé !");
    setForm(FORM0);setTouched({});setSelId(null);setSigL(null);setSigLoc(null);setPhotosDepart([]);setDocsLocataire({});setSearchClientContrat("");
    if(user){
      const{data:ins,error:err}=await supabase.from('contrats').insert([{user_id:user.id,loc_nom:locNom,loc_adresse:c.locAdresse,loc_tel:c.locTel,loc_email:c.locEmail,loc_permis:c.locPermis,date_debut:c.dateDebut,heure_debut:c.heureDebut,date_fin:c.dateFin,heure_fin:c.heureFin,paiement:c.paiement,caution_mode:c.cautionMode,km_depart:c.kmDepart,nb_jours:c.nbJours,heures_loc:c.heuresLoc,carburant_depart:c.carburantDepart,exterieur_propre:c.exterieurPropre,interieur_propre:c.interieurPropre,vehicle_id:c.vehicleId,vehicle_label:c.vehicleLabel,immat:c.immat,sig_l:c.sigL,sig_loc:c.sigLoc,total_calc:c.totalCalc,tarif_label:c.tarifLabel,photos_depart:c.photosDepart,docs_locataire:c.docsLocataire,frais_snap:c.fraisSnap,clauses_snap:c.clausesSnap,km_inclus:c.kmInclus,prix_km_sup:c.prixKmSup}]).select().single();
      if(!err&&ins)setContrats(p=>p.map(x=>x.id===c.id?{...x,id:ins.id}:x));
      if(err)console.error(err);
    }
  }

  function rePrint(c){
    const v=vehicles.find(x=>x.id===c.vehicleId)||{marque:"",modele:"",immat:"",couleur:"",km:0,tarif:0,caution:1000,frais:DEF_FRAIS,clauses:DEF_CLAUSES};
    dlPDF(buildContratHTML(c,{...v,frais:c.fraisSnap||v.frais,clauses:c.clausesSnap||v.clauses},c.sigL,c.sigLoc,profil));
  }

  function reDownloadPV(c){
    const r=retours[c.id];if(!r)return;
    const v=vehicles.find(x=>x.id===c.vehicleId)||{};
    dlPDF(buildPVRetourHTML(c,v,r,r.sigRetourLoueur||null,r.sigRetourLocataire||null,profil));
  }

  async function saveRetour(contratId,data){
    setRetours(r=>({...r,[contratId]:data}));
    const ct=contrats.find(c=>c.id===contratId);
    if(ct&&data.kmRetour)setVehicles(vs=>vs.map(v=>v.id===ct.vehicleId?{...v,km:parseFloat(data.kmRetour)}:v));
    toast_("Retour enregistré + PV PDF généré !");setRetourContratId(null);
    if(user){
      await supabase.from('retours').insert([{user_id:user.id,contrat_id:contratId,km_retour:data.kmRetour||null,carburant_retour:data.carburantRetour??null,montant_retenu:data.montantRetenu||0,raison_retenue:data.raisonRetenue||'',rembourse:data.rembourse||0,km_sup:data.kmSup||0,surplus_km:data.surplusKm||0,caution_restituee:data.cautionRestituee,checks:data.checks||{},carro:data.carro||{},carro_photos:data.carroPhotos||{},carro_notes:data.carroNotes||{},photos:data.photos||{},notes:data.notes||'',date:data.date||new Date().toISOString()}]);
      if(ct&&data.kmRetour)await supabase.from('vehicules').update({km:parseFloat(data.kmRetour)}).eq('id',ct.vehicleId).eq('user_id',user.id);
    }
  }

  async function supprimerRetour(contratId){
    if(!window.confirm("Supprimer ce retour ? Le contrat sera conservé."))return;
    const r=retours[contratId];
    setRetours(prev=>{const n={...prev};delete n[contratId];return n;});
    toast_("Retour supprimé, contrat conservé.");
    if(user&&r?.id){await supabase.from('retours').delete().eq('id',r.id).eq('user_id',user.id);}
  }

  async function addV(){
    if(!vForm.marque||!vForm.modele||!vForm.immat){toast_("Champs manquants","error");return;}
    const base={...vForm,km:+vForm.km,tarif:+vForm.tarif,caution:+vForm.caution||1000,kmInclus:+vForm.kmInclus||0,prixKmSup:+vForm.prixKmSup||0};
    if(editV){
      setVehicles(vs=>vs.map(x=>x.id===editV.id?{...x,...base}:x));toast_("Mis à jour");
      if(user)await supabase.from('vehicules').update({marque:base.marque,modele:base.modele,immat:base.immat,couleur:base.couleur,annee:base.annee,km:base.km,tarif:base.tarif,caution:base.caution,km_inclus:base.kmInclus,prix_km_sup:base.prixKmSup,km_illimite:base.kmIllimite,type_vehicule:base.typeVehicule,vin:base.vin,nb_portes:base.nbPortes,nb_places:base.nbPlaces,num_parc:base.numParc}).eq('id',editV.id).eq('user_id',user.id);
    }else{
      const localId=Date.now();
      setVehicles(vs=>[...vs,{id:localId,...base,docs:[],frais:DEF_FRAIS.map(f=>({...f})),clauses:DEF_CLAUSES.map(c=>({...c})),tarifsSpeciaux:[],photosVehicule:[],publie:false}]);
      toast_("Véhicule ajouté !");
      if(user){const{data:ins,error:err}=await supabase.from('vehicules').insert([{user_id:user.id,marque:base.marque,modele:base.modele,immat:base.immat,couleur:base.couleur,annee:base.annee,km:base.km,tarif:base.tarif,caution:base.caution,km_inclus:base.kmInclus,prix_km_sup:base.prixKmSup,km_illimite:base.kmIllimite,type_vehicule:base.typeVehicule,vin:base.vin,nb_portes:base.nbPortes,nb_places:base.nbPlaces,num_parc:base.numParc,docs:[],frais:DEF_FRAIS.map(f=>({...f})),clauses:DEF_CLAUSES.map(c=>({...c})),tarifs_speciaux:[],photos_vehicule:[],publie:false}]).select().single();if(!err&&ins)setVehicles(vs=>vs.map(x=>x.id===localId?{...x,id:ins.id}:x));if(err)console.error(err);}
    }
    setVForm({typeVehicule:"voiture",marque:"",modele:"",immat:"",couleur:"",annee:"",km:"",tarif:"",caution:"",kmInclus:"",prixKmSup:"",kmIllimite:false,motorisation:"Essence",boite:"Manuelle",puissanceFiscale:"",vin:"",nbPortes:"",nbPlaces:"",numParc:"",description:"",locationMin48:false});setShowAddV(false);setEditV(null);
  }

  function openTarifs(v){setTarifsVehicleId(v.id);setTarifsTemp((v.tarifsSpeciaux||[]).map(t=>({...t})));setNtarif({type:"Week-end (48h)",label:"",prix:"",unite:"forfait"});}
  async function saveTarifs(){
    if(!tarifsVehicleId)return;
    setVehicles(vs=>vs.map(v=>v.id===tarifsVehicleId?{...v,tarifsSpeciaux:[...tarifsTemp]}:v));
    setTarifsVehicleId(null);toast_("Tarifs enregistrés !");
    if(user)await supabase.from('vehicules').update({tarifs_speciaux:[...tarifsTemp]}).eq('id',tarifsVehicleId).eq('user_id',user.id);
  }

  async function togglePublier(v){
    const newVal=!v.publie;
    setVehicles(vs=>vs.map(x=>x.id===v.id?{...x,publie:newVal}:x));
    toast_(newVal?"Véhicule publié en ligne !":"Véhicule retiré de la vitrine");
    if(user)await supabase.from('vehicules').update({publie:newVal}).eq('id',v.id).eq('user_id',user.id);
  }

  async function repondreQuestion(q){
    if(!reponseText.trim())return;
    await supabase.from('questions').update({reponse:reponseText,lu:true}).eq('id',q.id).eq('user_id',user.id);
    setQuestions(qs=>qs.map(x=>x.id===q.id?{...x,reponse:reponseText,lu:true}:x));
    setReponseModal(null);setReponseText("");toast_("Réponse envoyée !");
  }

  async function supprimerQuestion(q){
    setQuestions(qs=>qs.filter(x=>x.id!==q.id));
    if(user)await supabase.from('questions').delete().eq('id',q.id).eq('user_id',user.id);
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
    const dep=depenses.filter(dd=>{const dt=new Date(dd.date);return dt.getMonth()===m&&dt.getFullYear()===a;}).reduce((s,d2)=>s+parseFloat(d2.montant||0),0);
    return{label:d.toLocaleDateString("fr-FR",{month:"short"}),ca,dep};
  });
  const maxCA=Math.max(...caP.map(x=>Math.max(x.ca,x.dep)),1);

  const docsV=vehicles.find(v=>v.id===docsId);
  const contratV=vehicles.find(v=>v.id===contratModalId);
  const retourContrat=contrats.find(c=>c.id===retourContratId);
  const retourVehicle=retourContrat?vehicles.find(v=>v.id===retourContrat.vehicleId):null;



  const PAGES=[
    {id:"vitrine",icon:"🏪",label:"Vitrine"},
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"clients",icon:"👥",label:"Clients"},
    {id:"vehicles",icon:"🚗",label:"Flotte"},
    {id:"contrats_hub",icon:"📋",label:"Contrats"},
    {id:"planning",icon:"📅",label:"Planning"},
    {id:"amendes",icon:"🚨",label:"Amendes"},
    {id:"questions",icon:"❓",label:"Questions"},
    {id:"finances",icon:"💰",label:"Finances"},
    {id:"profil",icon:"👤",label:"Profil"},
  ];

  function KPI(label,val,icon,color,sub,red){
    return(<div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.07)",borderLeft:`4px solid ${color}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><p style={{fontSize:10,color:"#6b7280",marginBottom:3}}>{label}</p><p style={{fontSize:20,fontWeight:800,color:red?"#dc2626":"#1f2937"}}>{val}</p>{sub&&<p style={{fontSize:10,color:"#9ca3af",marginTop:2}}>{sub}</p>}</div><span style={{fontSize:22}}>{icon}</span></div></div>);
  }

  function pickDocFile(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setNewDoc(d=>({...d,file:f.name,fileData:ev.target.result}));r.readAsDataURL(f);}

  if(!user)return <AuthPage/>;
  if(!dataLoaded)return(<div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"#f1f5f9"}}><div style={{textAlign:"center"}}><div style={{fontSize:36,marginBottom:12}}>⏳</div><p style={{color:"#6b7280",fontSize:14}}>Chargement...</p></div></div>);

  const profilVide=!profil.nom&&!profil.entreprise&&!profil.tel;
  if(profilVide)return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"#f1f5f9",padding:16}}>
      <div style={{background:"white",borderRadius:16,padding:"32px 28px",width:"100%",maxWidth:480,boxShadow:"0 4px 24px rgba(0,0,0,0.1)"}}>
        <h1 style={{textAlign:"center",marginBottom:6,fontSize:20,fontWeight:800}}>Bienvenue sur MAN'S LOCATION</h1>
        <p style={{textAlign:"center",color:"#6b7280",marginBottom:24,fontSize:13}}>Remplissez vos informations pour commencer</p>
        {[["nom","Nom complet *"],["entreprise","Nom de l'entreprise *"],["siren","SIREN"],["siret","SIRET"],["kbis","KBIS"],["email","Email"],["adresse","Adresse"],["ville","Ville"],["iban","IBAN"]].map(([k,l])=>(<div key={k} style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3}}>{l}</label><input placeholder={l.replace(" *","")} style={{width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,boxSizing:"border-box"}} value={profilForm[k]||""} onChange={e=>setProfilForm(p=>({...p,[k]:e.target.value}))}/></div>))}
        {[["tel","Téléphone *"],["whatsapp","WhatsApp"]].map(([k,l])=>(<div key={k} style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3}}>{l}</label><TelInput value={profilForm[k]||""} onChange={v=>setProfilForm(p=>({...p,[k]:v}))} placeholder={l.replace(" *","")}/></div>))}
        <div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3}}>Snapchat</label><input placeholder="Nom d'utilisateur" style={{width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,boxSizing:"border-box"}} value={profilForm.snap||""} onChange={e=>setProfilForm(p=>({...p,snap:e.target.value}))}/></div>
        <button onClick={async()=>{if(!profilForm.nom||!profilForm.entreprise||!profilForm.tel)return;setProfil({...profilForm});if(user)await supabase.from('profils').upsert({user_id:user.id,...profilForm},{onConflict:'user_id'});}} style={{width:"100%",padding:"12px",background:"#1d4ed8",color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8}}>Commencer</button>
        <button onClick={()=>supabase.auth.signOut()} style={{width:"100%",padding:"10px",background:"transparent",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:10,fontSize:12,cursor:"pointer",marginTop:8}}>Déconnexion</button>
      </div>
    </div>
  );

  const ganttDays=90;
  const ganttDates=Array.from({length:ganttDays},(_,i)=>{const d=new Date(ganttStartDate);d.setDate(d.getDate()+i);return d;});
  const DW=32;
  const today=new Date();
  const todayOffset=Math.floor((today-ganttStartDate)/86400000);
  const ganttColors=["#2563eb","#7c3aed","#16a34a","#d97706","#dc2626","#0891b2","#be185d"];
  const MONTH_NAMES=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

  function ganttPrevMonth(){setGanttStartDate(d=>{const n=new Date(d);n.setMonth(n.getMonth()-1);return n;});}
  function ganttNextMonth(){setGanttStartDate(d=>{const n=new Date(d);n.setMonth(n.getMonth()+1);return n;});}
  function ganttGoToday(){const d=new Date();d.setDate(1);setGanttStartDate(d);setTimeout(()=>{if(ganttRef.current)ganttRef.current.scrollLeft=0;},100);}

  const clientsFiltres=clients.filter(c=>{
    const q=searchClient.toLowerCase();
    return !q||c.nom.toLowerCase().includes(q)||c.tel.includes(q)||(c.email||"").toLowerCase().includes(q);
  });

  return(
    <div style={{minHeight:"100vh",background:"#f0f4f8"}}>
      <nav style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",boxShadow:"0 2px 12px rgba(0,0,0,.3)",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 10px",height:50,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
            <div style={{background:"white",borderRadius:6,padding:"2px 7px"}}><span style={{color:"#0a1940",fontWeight:900,fontSize:11,letterSpacing:1}}>MAN'S</span></div>
            <span style={{color:"white",fontWeight:700,fontSize:11}}>LOCATION</span>
          </div>
          <div style={{display:"flex",gap:1,flexWrap:"wrap"}}>
            {PAGES.map(p=>(
              <button key={p.id} onClick={()=>setPage(p.id)} style={{padding:"5px 7px",borderRadius:7,fontSize:11,fontWeight:page===p.id?700:400,background:page===p.id?"rgba(255,255,255,0.2)":"transparent",color:page===p.id?"white":"rgba(255,255,255,0.65)",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,position:"relative"}}>
                <span style={{fontSize:14}}>{p.icon}</span>
                <span style={{fontSize:9}}>{p.label}</span>
                {p.id==="questions"&&nbQSansReponse>0&&<span style={{position:"absolute",top:2,right:2,background:"#ef4444",color:"white",borderRadius:"50%",width:14,height:14,fontSize:8,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{nbQSansReponse}</span>}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {toast&&<div style={{position:"fixed",top:14,right:14,zIndex:10000,padding:"10px 16px",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.15)",color:"white",fontSize:12,fontWeight:600,background:toast.type==="error"?"#ef4444":"#16a34a",maxWidth:320}}>{toast.msg}</div>}

      {reponseModal&&(
        <div onClick={e=>{if(e.target===e.currentTarget){setReponseModal(null);setReponseText("");}}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:480,padding:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Répondre à la question</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>{reponseModal.vehicleLabel}</div>
            <div style={{background:"#f1f5f9",borderRadius:8,padding:10,fontSize:12,marginBottom:12,border:"1px solid #e5e7eb"}}>{reponseModal.question}</div>
            <textarea placeholder="Votre réponse..." value={reponseText} onChange={e=>setReponseText(e.target.value)} rows={4} style={{width:"100%",padding:"8px",border:"1px solid #d1d5db",borderRadius:8,fontSize:12,resize:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:12}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>repondreQuestion(reponseModal)} style={{flex:1,background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Envoyer la réponse</button>
              <button onClick={()=>{setReponseModal(null);setReponseText("");}} style={{padding:"10px 16px",background:"#e5e7eb",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {photosVehicleModal&&<PhotosVehiculeModal vehicle={photosVehicleModal} onClose={()=>setPhotosVehicleModal(null)} onSave={async(photos)=>{setVehicles(vs=>vs.map(v=>v.id===photosVehicleModal.id?{...v,photosVehicule:photos}:v));setPhotosVehicleModal(null);toast_("Photos enregistrées !");if(user)await supabase.from('vehicules').update({photos_vehicule:photos}).eq('id',photosVehicleModal.id).eq('user_id',user.id);}}/>}
      {contratModalId&&contratV&&<ContratModal vehicle={contratV} onClose={()=>setContratModalId(null)} onSave={async(fr,cl)=>{setVehicles(vs=>vs.map(v=>v.id===contratModalId?{...v,frais:fr,clauses:cl}:v));setContratModalId(null);toast_("Mis à jour !");if(user)await supabase.from('vehicules').update({frais:fr,clauses:cl}).eq('id',contratModalId).eq('user_id',user.id);}}/>}
      {retourContratId&&retourContrat&&<RetourModal contrat={retourContrat} vehicle={retourVehicle} profil={profil} onClose={()=>setRetourContratId(null)} onSave={data=>saveRetour(retourContratId,data)}/>}

      {selectedClient&&(
        <div onClick={e=>{if(e.target===e.currentTarget){setSelectedClient(null);setEditingClient(null);}}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:560,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"14px 18px",background:"linear-gradient(135deg,#0a1940,#1e3a8a)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><b style={{color:"white",fontSize:15}}>👤 {selectedClient.nom}</b><div style={{color:"rgba(255,255,255,.6)",fontSize:11}}>{selectedClient.tel}</div></div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setEditingClient({...selectedClient})} style={{padding:"5px 10px",background:"rgba(255,255,255,.2)",color:"white",border:"none",borderRadius:7,fontSize:11,cursor:"pointer"}}>Modifier</button>
                <button onClick={()=>{setSelectedClient(null);setEditingClient(null);}} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:"white"}}>x</button>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:16}}>
              {editingClient?(
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>Modifier les informations</div>
                  {[["nom","Nom complet"],["adresse","Adresse"],["email","Email"],["permis","N° Permis"]].map(([k,l])=>(<div key={k}><label style={LBL_STYLE}>{l}</label><input style={INP_STYLE()} value={editingClient[k]||""} onChange={e=>setEditingClient(c=>({...c,[k]:e.target.value}))}/></div>))}
                  <div><label style={LBL_STYLE}>Téléphone</label><TelInput value={editingClient.tel||""} onChange={v=>setEditingClient(c=>({...c,tel:v}))}/></div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setClients(cs=>cs.map(c=>c.key===editingClient.key?{...editingClient}:c));setSelectedClient({...editingClient});setEditingClient(null);toast_("Client mis à jour !");}} style={{flex:1,background:"#16a34a",color:"white",border:"none",borderRadius:8,padding:"8px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
                    <button onClick={()=>setEditingClient(null)} style={{padding:"8px 14px",background:"#e5e7eb",border:"none",borderRadius:8,cursor:"pointer"}}>Annuler</button>
                  </div>
                </div>
              ):(
                <div style={{marginBottom:16}}>
                  {[["Adresse",selectedClient.adresse],["Email",selectedClient.email],["Permis",selectedClient.permis]].filter(([,v])=>v).map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}><span style={{fontSize:11,color:"#6b7280"}}>{l}</span><span style={{fontSize:12,fontWeight:600}}>{v}</span></div>))}
                </div>
              )}
              {(selectedClient.docs?.cniRecto||selectedClient.docs?.cniVerso||selectedClient.docs?.justifDom||selectedClient.docs?.photoAr)&&(
                <div style={{marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Documents</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
                    {selectedClient.docs?.cniRecto&&<div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280",marginBottom:3}}>CNI Recto</div><img src={selectedClient.docs.cniRecto} alt="" style={{width:120,height:85,objectFit:"cover",borderRadius:8,border:"2px solid #2563eb"}}/></div>}
                    {selectedClient.docs?.cniVerso&&<div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280",marginBottom:3}}>CNI Verso</div><img src={selectedClient.docs.cniVerso} alt="" style={{width:120,height:85,objectFit:"cover",borderRadius:8,border:"2px solid #2563eb"}}/></div>}
                    {selectedClient.docs?.justifDom&&<div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280",marginBottom:3}}>Justif. domicile</div><img src={selectedClient.docs.justifDom} alt="" style={{width:120,height:85,objectFit:"cover",borderRadius:8,border:"2px solid #7c3aed"}}/></div>}
                    {selectedClient.docs?.photoAr&&<div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280",marginBottom:3}}>Photo arrière</div><img src={selectedClient.docs.photoAr} alt="" style={{width:120,height:85,objectFit:"cover",borderRadius:8,border:"2px solid #16a34a"}}/></div>}
                  </div>
                </div>
              )}
              <div>
                <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Historique contrats</div>
                {contrats.filter(c=>c.locNom===selectedClient.nom&&c.locTel===selectedClient.tel).length===0
                  ?<div style={{color:"#9ca3af",fontSize:12}}>Aucun contrat</div>
                  :contrats.filter(c=>c.locNom===selectedClient.nom&&c.locTel===selectedClient.tel).map(c=>(<div key={c.id} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",marginBottom:6,border:"1px solid #e5e7eb"}}>
                    <div style={{display:"flex",justifyContent:"space-between"}}>
                      <div><div style={{fontWeight:700,fontSize:12}}>{c.vehicleLabel}</div><div style={{fontSize:11,color:"#6b7280"}}>{c.dateDebut} → {c.dateFin}</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontWeight:800,color:"#1e3a8a"}}>{c.totalCalc} EUR</div>{retours[c.id]&&<div style={{fontSize:10,color:"#16a34a"}}>✅ Retour OK</div>}</div>
                    </div>
                    <button onClick={()=>rePrint(c)} style={{marginTop:6,padding:"3px 8px",background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:6,fontSize:10,cursor:"pointer",fontWeight:600}}>📄 PDF</button>
                  </div>))}
              </div>
            </div>
            <div style={{padding:"12px 16px",borderTop:"1px solid #e5e7eb",background:"white"}}>
              <button onClick={()=>{setForm(f=>({...f,locNom:selectedClient.nom,locTel:selectedClient.tel,locAdresse:selectedClient.adresse||"",locEmail:selectedClient.email||"",locPermis:selectedClient.permis||""}));setDocsLocataire({...selectedClient.docs});setSelectedClient(null);setPage("nouveau");toast_("Client chargé dans le formulaire contrat !");}} style={{width:"100%",background:"#1e3a8a",color:"white",border:"none",borderRadius:10,padding:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Créer un contrat pour ce client</button>
            </div>
          </div>
        </div>
      )}

      {tarifsVehicle&&(
        <div onClick={e=>{if(e.target===e.currentTarget)setTarifsVehicleId(null);}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"14px 18px",background:"#0a1940",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><b style={{fontSize:14,color:"white"}}>Tarifs spéciaux</b><div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>{tarifsVehicle.marque} {tarifsVehicle.modele} · Standard : {tarifsVehicle.tarif} EUR/j</div></div>
              <button onClick={()=>setTarifsVehicleId(null)} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:"white"}}>x</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              {tarifsTemp.map(t=>(<div key={t.id} style={{display:"flex",gap:8,alignItems:"center",padding:10,background:"#f9fafb",borderRadius:10,marginBottom:7,border:"1px solid #e5e7eb"}}>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{t.label||t.type}</div><div style={{fontSize:11,color:"#6b7280"}}>{t.type} · {t.unite==="forfait"?"Forfait":"Par jour"}</div></div>
                <input type="number" style={{width:75,border:"1px solid #d1d5db",borderRadius:6,padding:"5px 7px",fontSize:13,fontWeight:700}} value={t.prix} onChange={e=>setTarifsTemp(ts=>ts.map(x=>x.id===t.id?{...x,prix:e.target.value}:x))}/>
                <span style={{fontSize:12,color:"#6b7280"}}>EUR</span>
                <button onClick={()=>setTarifsTemp(ts=>ts.filter(x=>x.id!==t.id))} style={{padding:"4px 8px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer"}}>X</button>
              </div>))}
              <div style={{background:"#eff6ff",borderRadius:12,padding:14,border:"1px solid #bfdbfe",marginTop:8}}>
                <p style={{fontSize:12,fontWeight:700,color:"#1d4ed8",marginBottom:10}}>+ Nouveau tarif</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><label style={LBL_STYLE}>Durée</label><select style={INP_STYLE()} value={ntarif.type} onChange={e=>setNtarif(x=>({...x,type:e.target.value}))}>{TARIFS_PRESETS.map(p=><option key={p.type}>{p.type}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Nom affiché</label><input style={INP_STYLE()} placeholder="ex: WE 48h" value={ntarif.label} onChange={e=>setNtarif(x=>({...x,label:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Prix (EUR)</label><input type="number" style={INP_STYLE()} placeholder="ex: 130" value={ntarif.prix} onChange={e=>setNtarif(x=>({...x,prix:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Unité</label><select style={INP_STYLE()} value={ntarif.unite} onChange={e=>setNtarif(x=>({...x,unite:e.target.value}))}><option value="forfait">Forfait total</option><option value="jour">Par jour</option></select></div>
                </div>
                <button onClick={()=>{if(!ntarif.prix||parseFloat(ntarif.prix)<=0){toast_("Prix invalide","error");return;}setTarifsTemp(ts=>[...ts,{id:Date.now(),...ntarif,label:ntarif.label||ntarif.type}]);setNtarif({type:"Week-end (48h)",label:"",prix:"",unite:"forfait"});}} style={{width:"100%",background:"#1d4ed8",color:"white",border:"none",borderRadius:8,padding:"8px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
              </div>
            </div>
            <div style={{padding:"12px 16px",borderTop:"1px solid #e5e7eb",display:"flex",gap:8,background:"white"}}>
              <button onClick={saveTarifs} style={{flex:1,background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
              <button onClick={()=>setTarifsVehicleId(null)} style={{padding:"10px 16px",background:"#e5e7eb",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {docsId&&docsV&&(
        <div style={{position:"fixed",inset:0,zIndex:9998,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:18,width:"100%",maxWidth:600,maxHeight:"88vh",display:"flex",flexDirection:"column"}}>
            <div style={{padding:"14px 18px",borderBottom:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><b>{docsV.marque} {docsV.modele}</b><div style={{fontSize:10,color:"#9ca3af"}}>{docsV.immat}</div></div>
              <button onClick={()=>setDocsId(null)} style={{fontSize:22,background:"none",border:"none",cursor:"pointer"}}>x</button>
            </div>
            <div style={{overflowY:"auto",flex:1,padding:14}}>
              <div style={{background:"#eff6ff",borderRadius:10,padding:12,marginBottom:12,border:"1px solid #bfdbfe"}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div><label style={LBL_STYLE}>Type</label><select style={INP_STYLE()} value={newDoc.type} onChange={e=>setNewDoc(d=>({...d,type:e.target.value}))}>{DOC_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Nom *</label><input style={INP_STYLE()} value={newDoc.nom} onChange={e=>setNewDoc(d=>({...d,nom:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Expiration</label><input type="date" style={INP_STYLE()} value={newDoc.expiration} onChange={e=>setNewDoc(d=>({...d,expiration:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Fichier</label><input type="file" accept=".pdf,image/*" style={{width:"100%",fontSize:11}} onChange={pickDocFile}/></div>
                </div>
                <button onClick={async()=>{if(!newDoc.nom){toast_("Donnez un nom","error");return;}const docEntry={id:Date.now(),...newDoc};const updatedDocs=[...(docsV.docs||[]),docEntry];setVehicles(vs=>vs.map(v=>v.id===docsId?{...v,docs:updatedDocs}:v));setNewDoc({type:"Carte grise",nom:"",expiration:"",file:null,fileData:null});toast_("Document ajouté !");if(user)await supabase.from('vehicules').update({docs:updatedDocs}).eq('id',docsId).eq('user_id',user.id);}} style={{marginTop:8,background:"#2563eb",color:"white",border:"none",borderRadius:7,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
              </div>
              {(!docsV.docs||docsV.docs.length===0)?<div style={{textAlign:"center",color:"#9ca3af",padding:24}}><p>Aucun document</p></div>
                :docsV.docs.map(doc=>{const expired=isExp(doc.expiration),soon=isSoon(doc.expiration);return(<div key={doc.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:10,border:`1px solid ${expired?"#fca5a5":soon?"#fde68a":"#e5e7eb"}`,background:expired?"#fef2f2":soon?"#fffbeb":"#f9fafb",marginBottom:6}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:18}}>📄</span><div><div style={{fontWeight:600,fontSize:12}}>{doc.nom}</div><div style={{fontSize:10,color:"#6b7280"}}>{doc.type}{doc.expiration&&<span style={{marginLeft:6,fontWeight:600,color:expired?"#dc2626":soon?"#d97706":"#16a34a"}}>{doc.expiration}</span>}</div></div></div>
                  <div style={{display:"flex",gap:5}}>
                    {doc.fileData&&<button onClick={()=>{const a=document.createElement("a");a.href=doc.fileData;a.download=doc.file||doc.nom;a.click();}} style={{padding:"3px 7px",background:"#dbeafe",color:"#1d4ed8",border:"none",borderRadius:5,cursor:"pointer",fontSize:11}}>DL</button>}
                    <button onClick={async()=>{const updatedDocs=(docsV.docs||[]).filter(d=>d.id!==doc.id);setVehicles(vs=>vs.map(v=>v.id===docsId?{...v,docs:updatedDocs}:v));toast_("Supprimé");if(user)await supabase.from('vehicules').update({docs:updatedDocs}).eq('id',docsId).eq('user_id',user.id);}} style={{padding:"3px 7px",background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:5,cursor:"pointer",fontSize:11}}>X</button>
                  </div>
                </div>);})}
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"16px 12px"}}>

        {/* ── CONTRATS HUB ── */}
        {page==="contrats_hub"&&(
          <div>
            <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937",marginBottom:20}}>Contrats</h1>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:32}}>
              {[
                {id:"nouveau",icon:"📝",label:"Nouveau contrat",desc:"Créer un contrat de location",color:"#1e3a8a",bg:"#eff6ff",border:"#bfdbfe"},
                {id:"retours",icon:"🔄",label:"Retours",desc:"Gérer les retours de véhicules",color:"#16a34a",bg:"#f0fdf4",border:"#bbf7d0"},
                {id:"contrats",icon:"📋",label:"Historique",desc:"Voir tous les contrats",color:"#7c3aed",bg:"#f5f3ff",border:"#ddd6fe"},
              ].map(({id,icon,label,desc,color,bg,border})=>(
                <div key={id} onClick={()=>setPage(id)} style={{background:bg,borderRadius:16,padding:24,border:`2px solid ${border}`,cursor:"pointer",transition:"transform .15s,box-shadow .15s",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}
                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.12)";}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.06)";}}>
                  <div style={{fontSize:40,marginBottom:12}}>{icon}</div>
                  <div style={{fontWeight:800,fontSize:15,color,marginBottom:4}}>{label}</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>{desc}</div>
                </div>
              ))}
            </div>
            {/* Stats rapides */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
              <div style={{background:"white",borderRadius:12,padding:"12px 16px",boxShadow:"0 2px 6px rgba(0,0,0,.06)",borderLeft:"4px solid #1e3a8a"}}><div style={{fontSize:10,color:"#6b7280"}}>Total contrats</div><div style={{fontSize:22,fontWeight:800,color:"#1f2937"}}>{contrats.length}</div></div>
              <div style={{background:"white",borderRadius:12,padding:"12px 16px",boxShadow:"0 2px 6px rgba(0,0,0,.06)",borderLeft:"4px solid #16a34a"}}><div style={{fontSize:10,color:"#6b7280"}}>Retours effectués</div><div style={{fontSize:22,fontWeight:800,color:"#1f2937"}}>{Object.keys(retours).length}</div></div>
              <div style={{background:"white",borderRadius:12,padding:"12px 16px",boxShadow:"0 2px 6px rgba(0,0,0,.06)",borderLeft:"4px solid #d97706"}}><div style={{fontSize:10,color:"#6b7280"}}>En attente retour</div><div style={{fontSize:22,fontWeight:800,color:"#d97706"}}>{contrats.filter(c=>!retours[c.id]).length}</div></div>
              <div style={{background:"white",borderRadius:12,padding:"12px 16px",boxShadow:"0 2px 6px rgba(0,0,0,.06)",borderLeft:"4px solid #2563eb"}}><div style={{fontSize:10,color:"#6b7280"}}>CA total</div><div style={{fontSize:22,fontWeight:800,color:"#2563eb"}}>{contrats.reduce((s,c)=>s+(c.totalCalc||0),0)} €</div></div>
            </div>
          </div>
        )}

        {page==="vitrine"&&(
          <div>
            <div style={{marginBottom:16}}><h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>🏪 Vitrine</h1></div>
            {vehicles.some(v=>v.publie)&&(
              <div style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",borderRadius:14,padding:16,marginBottom:16,color:"white"}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Lien vitrine public</div>
                <div style={{background:"rgba(255,255,255,.1)",borderRadius:8,padding:"8px 12px",fontSize:11,wordBreak:"break-all",marginBottom:8}}>{window.location.origin}/vitrine/{user?.id?.slice(0,8)}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>{navigator.clipboard.writeText(window.location.origin+"/vitrine/"+user?.id?.slice(0,8));toast_("Lien copié !");}} style={{padding:"7px 14px",background:"white",color:"#1e3a8a",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>Copier le lien</button>
                  <button onClick={()=>{const msg="Bonjour, voici notre catalogue : "+window.location.origin+"/vitrine/"+user?.id?.slice(0,8);window.open("https://wa.me/"+(profil.whatsapp||profil.tel||"").replace(/\D/g,"")+"?text="+encodeURIComponent(msg),"_blank");}} style={{padding:"7px 14px",background:"#25D366",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>WhatsApp</button>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
              {vehicles.map(v=>{
                const cover=(v.photosVehicule||[])[0];
                return(<div key={v.id} style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.08)",border:`2px solid ${v.publie?"#2563eb":"#e5e7eb"}`}}>
                  <div style={{height:160,background:"#f1f5f9",position:"relative",overflow:"hidden"}}>
                    {cover?<img src={cover.data} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",flexDirection:"column",gap:6}}><span style={{fontSize:36}}>🚗</span></div>}
                    {v.publie&&<div style={{position:"absolute",top:8,right:8,background:"#2563eb",color:"white",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:99}}>EN LIGNE</div>}
                  </div>
                  <div style={{padding:14}}>
                    <div style={{fontWeight:800,fontSize:15,marginBottom:2}}>{v.marque} {v.modele}</div>
                    <div style={{fontSize:11,color:"#6b7280",marginBottom:10}}>{v.couleur} · {v.annee} · {v.immat}</div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>togglePublier(v)} style={{flex:1,padding:"8px 0",background:v.publie?"#fef2f2":"#1e3a8a",color:v.publie?"#dc2626":"white",border:v.publie?"2px solid #fecaca":"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>{v.publie?"Retirer":"Publier"}</button>
                    </div>
                  </div>
                </div>);
              })}
            </div>
            {vehicles.some(v=>v.publie)&&(
              <div style={{marginTop:20}}>
                <h2 style={{fontSize:14,fontWeight:700,color:"#1f2937",marginBottom:12}}>Aperçu client</h2>
                <div style={{background:"#f8fafc",borderRadius:14,padding:16,border:"2px dashed #e5e7eb"}}>
                  <div style={{textAlign:"center",marginBottom:16}}>
                    <div style={{fontWeight:800,fontSize:18,color:"#0a1940"}}>{profil.entreprise||"MAN'S LOCATION"}</div>
                    <div style={{fontSize:12,color:"#6b7280"}}>Nos véhicules disponibles</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
                    {vehicles.filter(v=>v.publie).map(v=>{
                      const cover=(v.photosVehicule||[])[0];
                      return(<div key={v.id} style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
                        <div style={{height:150,background:"#f1f5f9",overflow:"hidden"}}>
                          {cover?<img src={cover.data} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:32}}>🚗</div>}
                        </div>
                        <div style={{padding:16}}>
                          <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{v.marque} {v.modele}</div>
                          <div style={{fontSize:12,color:"#6b7280",marginBottom:10}}>{v.couleur} · {v.annee}</div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                            <div style={{background:"#eff6ff",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:10,color:"#6b7280"}}>Prix/jour</div><div style={{fontWeight:800,fontSize:15,color:"#2563eb"}}>{v.tarif} EUR</div></div>
                            <div style={{background:"#fef3c7",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:10,color:"#6b7280"}}>Caution</div><div style={{fontWeight:800,fontSize:15,color:"#d97706"}}>{v.caution} EUR</div></div>
                          </div>
                          <DemandeVehicule vehicle={v} profil={profil} userId={user?.id}/>
                        </div>
                      </div>);
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {page==="dashboard"&&(
          <div>
            <div style={{marginBottom:16}}>
              <h1 style={{fontSize:20,fontWeight:800,color:"#1f2937"}}>Bonjour, {profil.nom.split(" ")[0]} 👋</h1>
              <p style={{fontSize:12,color:"#6b7280",textTransform:"capitalize"}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:12,marginBottom:16}}>
              {KPI("CA Locations",caT+" EUR","💶","#2563eb","Ce mois : "+caM+" EUR")}
              {KPI("Extras",(totalRetenues+totalSurplusKm).toFixed(0)+" EUR","🔒","#d97706")}
              {KPI("Bénéfice net",bT.toFixed(0)+" EUR",bT>=0?"📈":"📉",bT>=0?"#16a34a":"#dc2626",null,bT<0)}
              {KPI("Clients",clients.length,"👥","#7c3aed")}
              {KPI("Véhicules",vehicles.length,"🚗","#0891b2",vehicles.filter(v=>statut(v.id)==="loué").length+" en location")}
              {KPI("Cautions non rendues",cautionsNonRendues+" EUR","🔓","#dc2626")}
            </div>
            <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"flex-end",gap:8,height:110}}>
                {caP.map((m,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:88}}><div style={{flex:1,borderRadius:"3px 3px 0 0",background:"#3b82f6",height:(m.ca/maxCA*88)+"px",minHeight:m.ca>0?3:0}}/><div style={{flex:1,borderRadius:"3px 3px 0 0",background:"#f87171",height:(m.dep/maxCA*88)+"px",minHeight:m.dep>0?3:0}}/></div><span style={{fontSize:9,color:"#6b7280",textTransform:"capitalize"}}>{m.label}</span></div>))}
              </div>
            </div>
          </div>
        )}

        {page==="clients"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Clients ({clients.length})</h1>
            </div>
            <div style={{marginBottom:14}}>
              <input placeholder="🔍 Rechercher par nom, téléphone, email..." style={INP_STYLE()} value={searchClient} onChange={e=>setSearchClient(e.target.value)}/>
            </div>
            {clientsFiltres.length===0?<div style={{textAlign:"center",color:"#9ca3af",padding:40,background:"white",borderRadius:14}}><div style={{fontSize:36,marginBottom:8}}>👥</div><p>Aucun client{searchClient?" trouvé":". Les clients sont créés automatiquement lors des contrats."}</p></div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
                {clientsFiltres.map(c=>{
                  const nbContrats=contrats.filter(x=>x.locNom===c.nom&&x.locTel===c.tel).length;
                  const totalCA=contrats.filter(x=>x.locNom===c.nom&&x.locTel===c.tel).reduce((s,x)=>s+(x.totalCalc||0),0);
                  const hasDoc=c.docs&&(c.docs.cniRecto||c.docs.cniVerso||c.docs.justifDom);
                  return(<div key={c.key} onClick={()=>setSelectedClient(c)} style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:"1px solid #e5e7eb",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.12)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.07)"}>
                    <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#1e3a8a,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>👤</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:800,fontSize:14,marginBottom:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.nom}</div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{c.tel}</div>
                        {c.email&&<div style={{fontSize:10,color:"#9ca3af",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.email}</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8,marginTop:12}}>
                      <div style={{flex:1,background:"#eff6ff",borderRadius:8,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>Contrats</div><div style={{fontWeight:800,fontSize:14,color:"#2563eb"}}>{nbContrats}</div></div>
                      <div style={{flex:1,background:"#f0fdf4",borderRadius:8,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>CA total</div><div style={{fontWeight:800,fontSize:14,color:"#16a34a"}}>{totalCA} €</div></div>
                      <div style={{flex:1,background:hasDoc?"#f5f3ff":"#f9fafb",borderRadius:8,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>Docs</div><div style={{fontWeight:800,fontSize:14,color:hasDoc?"#7c3aed":"#9ca3af"}}>{hasDoc?"✓":"—"}</div></div>
                    </div>
                  </div>);
                })}
              </div>}
          </div>
        )}

        {page==="vehicles"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Flotte</h1>
              <button onClick={()=>{setShowAddV(true);setEditV(null);setVForm({marque:"",modele:"",immat:"",couleur:"",annee:"",km:"",tarif:"",caution:"",kmInclus:"",prixKmSup:"",kmIllimite:false,motorisation:"Essence",boite:"Manuelle",puissanceFiscale:"",description:"",locationMin48:false});}} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
            </div>
            {showAddV&&(
              <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.1)",marginBottom:16,border:"2px solid #bfdbfe"}}>
                <h3 style={{fontWeight:700,marginBottom:12,fontSize:14}}>{editV?"Modifier":"Nouveau véhicule"}</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
                  <div><label style={LBL_STYLE}>Marque *</label><select style={INP_STYLE()} value={vForm.marque} onChange={e=>setVForm(f=>({...f,marque:e.target.value,modele:""}))}><option value="">-- Choisir --</option>{Object.keys(CAR_BRANDS).sort().map(b=><option key={b} value={b}>{b}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Modèle *</label><select style={INP_STYLE()} value={vForm.modele} onChange={e=>setVForm(f=>({...f,modele:e.target.value}))} disabled={!vForm.marque}><option value="">-- Choisir --</option>{(CAR_BRANDS[vForm.marque]||[]).map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Immatriculation *</label><input style={INP_STYLE()} value={vForm.immat} onChange={e=>setVForm(f=>({...f,immat:e.target.value.toUpperCase()}))}/></div>
                  <div><label style={LBL_STYLE}>Couleur</label><select style={INP_STYLE()} value={vForm.couleur} onChange={e=>setVForm(f=>({...f,couleur:e.target.value}))}><option value="">-- Choisir --</option>{CAR_COLORS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Année</label><select style={INP_STYLE()} value={vForm.annee} onChange={e=>setVForm(f=>({...f,annee:e.target.value}))}><option value="">-- Choisir --</option>{CAR_YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Motorisation</label><select style={INP_STYLE()} value={vForm.motorisation} onChange={e=>setVForm(f=>({...f,motorisation:e.target.value}))}>{MOTORISATIONS.map(m=><option key={m}>{m}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Boîte</label><select style={INP_STYLE()} value={vForm.boite} onChange={e=>setVForm(f=>({...f,boite:e.target.value}))}>{BOITES.map(b=><option key={b}>{b}</option>)}</select></div>
                  {[["km","Km actuel"],["tarif","Tarif EUR/j"],["caution","Caution EUR"],["kmInclus","Km inclus/loc"],["prixKmSup","Prix km sup EUR"]].map(([k,l])=>(<div key={k}><label style={LBL_STYLE}>{l}</label><input type="number" style={INP_STYLE()} value={vForm[k]} onChange={e=>setVForm(f=>({...f,[k]:e.target.value.replace(/\D/g,"")}))} inputMode="numeric"/></div>))}
                </div>
                <div style={{marginTop:10}}><label style={LBL_STYLE}>Description</label><textarea value={vForm.description} onChange={e=>setVForm(f=>({...f,description:e.target.value}))} rows={2} style={{...INP_STYLE(),resize:"vertical",fontFamily:"inherit"}}/></div>
                <div style={{marginTop:10,display:"flex",gap:16,flexWrap:"wrap"}}>
                  <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={vForm.kmIllimite} onChange={e=>setVForm(f=>({...f,kmIllimite:e.target.checked}))}/><span>Km illimité</span></label>
                </div>
                <div style={{display:"flex",gap:8,marginTop:12}}>
                  <button onClick={addV} style={{background:"#16a34a",color:"white",border:"none",borderRadius:8,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontSize:12}}>{editV?"Mettre à jour":"Ajouter"}</button>
                  <button onClick={()=>{setShowAddV(false);setEditV(null);}} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12}}>Annuler</button>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:14}}>
              {vehicles.map(v=>(<div key={v.id} style={{background:"white",borderRadius:16,boxShadow:"0 2px 10px rgba(0,0,0,.08)",overflow:"hidden",border:"1px solid #e5e7eb"}}>
                <div style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div><div style={{color:"white",fontWeight:800,fontSize:15}}>{v.marque} {v.modele}</div><div style={{color:"rgba(255,255,255,.6)",fontSize:11}}>{v.immat} · {v.couleur}</div></div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}><Badge s={statut(v.id)}/>{v.publie&&<span style={{fontSize:9,background:"#2563eb",color:"white",borderRadius:99,padding:"2px 6px",fontWeight:700}}>EN LIGNE</span>}</div>
                </div>
                <div style={{padding:14}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    {[["Tarif",v.tarif+" EUR/j"],["Caution",v.caution+" EUR"],["Km inclus",v.kmInclus+" km"],["Km sup",v.prixKmSup+" EUR/km"],["Km actuel",(v.km||0).toLocaleString()+" km"]].map(([l,val])=>(<div key={l} style={{background:"#f8fafc",borderRadius:8,padding:"7px 10px"}}><div style={{fontSize:9,color:"#9ca3af"}}>{l}</div><div style={{fontWeight:700,fontSize:12}}>{val}</div></div>))}
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <button onClick={()=>setPhotosVehicleModal(v)} style={{flex:1,padding:"6px 0",background:"#fdf4ff",color:"#9333ea",border:"1px solid #e9d5ff",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Photos{(v.photosVehicule||[]).length>0?" ("+v.photosVehicule.length+")":""}</button>
                    <button onClick={()=>openTarifs(v)} style={{flex:1,padding:"6px 0",background:"#fff7ed",color:"#d97706",border:"1px solid #fed7aa",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Tarifs</button>
                    <button onClick={()=>setContratModalId(v.id)} style={{flex:1,padding:"6px 0",background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Clauses</button>
                    <button onClick={()=>setDocsId(v.id)} style={{flex:1,padding:"6px 0",background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Docs</button>
                    <button onClick={()=>{setEditV(v);setVForm({marque:v.marque,modele:v.modele,immat:v.immat,couleur:v.couleur||"",annee:v.annee||"",km:v.km,tarif:v.tarif,caution:v.caution,kmInclus:v.kmInclus||0,prixKmSup:v.prixKmSup||0,kmIllimite:v.kmIllimite||false,motorisation:"Essence",boite:"Manuelle",puissanceFiscale:"",description:"",locationMin48:false});setShowAddV(true);}} style={{padding:"6px 10px",background:"#f5f3ff",color:"#7c3aed",border:"1px solid #ddd6fe",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Editer</button>
                    <button onClick={async()=>{if(window.confirm("Supprimer ?")){setVehicles(vs=>vs.filter(x=>x.id!==v.id));if(user)await supabase.from('vehicules').delete().eq('id',v.id).eq('user_id',user.id);}}} style={{padding:"6px 10px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:11,cursor:"pointer"}}>X</button>
                  </div>
                </div>
              </div>))}
            </div>
          </div>
        )}

        {page==="nouveau"&&(
          <div style={{maxWidth:680,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>setPage("contrats_hub")} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>← Retour</button>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Nouveau contrat</h1>
            </div>
            <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
              <h3 style={{fontWeight:700,fontSize:13,marginBottom:10}}>Véhicule</h3>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {vehicles.map(v=>(<div key={v.id} onClick={()=>setSelId(v.id===selId?null:v.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,border:`2px solid ${selId===v.id?"#2563eb":"#e5e7eb"}`,background:selId===v.id?"#eff6ff":"#f9fafb",cursor:"pointer"}}>
                  <div><div style={{fontWeight:700,fontSize:13}}>{v.marque} {v.modele}</div><div style={{fontSize:10,color:"#6b7280"}}>{v.immat} · {v.couleur}</div></div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge s={statut(v.id)}/><span style={{fontWeight:700,fontSize:12,color:"#2563eb"}}>{v.tarif} EUR/j</span></div>
                </div>))}
              </div>
            </div>
            {sel&&(<>
              <div style={{background:"#1e3a8a",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>Tarif calculé</div><div style={{color:"white",fontSize:11,marginTop:2}}>{tarifAuto.label}</div></div>
                <div style={{color:"#4ade80",fontWeight:900,fontSize:22}}>{tarifAuto.prix} EUR</div>
              </div>
              <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <h3 style={{fontWeight:700,fontSize:13,marginBottom:10}}>Locataire</h3>
                <div style={{marginBottom:12,position:"relative"}}>
                  <label style={LBL_STYLE}>🔍 Rechercher un client existant</label>
                  <input style={INP_STYLE({background:"#eff6ff",borderColor:"#bfdbfe"})} placeholder="Nom ou téléphone du client..." value={searchClientContrat} onChange={e=>{setSearchClientContrat(e.target.value);setShowClientSuggestions(true);}} onFocus={()=>setShowClientSuggestions(true)}/>
                  {showClientSuggestions&&clientSuggestions.length>0&&(
                    <div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:"1px solid #e5e7eb",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:100,maxHeight:200,overflowY:"auto"}}>
                      {clientSuggestions.map(c=>(<div key={c.key} onClick={()=>{const parts=(c.nom||"").trim().split(" ");const prenom=parts[0]||"";const nom=parts.slice(1).join(" ")||"";setForm(f=>({...f,locPrenom:prenom,locNom:nom,locTel:c.tel,locAdresse:c.adresse||"",locEmail:c.email||"",locPermis:c.permis||""}));setDocsLocataire({...c.docs});setSearchClientContrat(c.nom);setShowClientSuggestions(false);toast_("Client "+c.nom+" chargé !");}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="white"}>
                        <div><div style={{fontWeight:700,fontSize:13}}>{c.nom}</div><div style={{fontSize:11,color:"#6b7280"}}>{c.tel}{c.adresse?" · "+c.adresse:""}</div></div>
                        <div style={{fontSize:10,background:"#eff6ff",color:"#2563eb",borderRadius:6,padding:"2px 6px"}}>{contrats.filter(x=>x.locNom===c.nom).length} contrat{contrats.filter(x=>x.locNom===c.nom).length>1?"s":""}</div>
                      </div>))}
                    </div>
                  )}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><label style={LBL_STYLE}>Prénom *</label><input style={INP_STYLE()} placeholder="Prénom" value={form.locPrenom} onChange={e=>setForm(f=>({...f,locPrenom:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Nom *</label><input style={INP_STYLE(inv("locNom")?{borderColor:"#f87171",background:"#fef2f2"}:{})} placeholder="Nom" value={form.locNom} onChange={e=>setForm(f=>({...f,locNom:e.target.value}))} onBlur={()=>setTouched(t=>({...t,locNom:true}))}/>{inv("locNom")&&<p style={{color:"#ef4444",fontSize:10,marginTop:2}}>Obligatoire</p>}</div>
                  <div style={{gridColumn:"span 2"}}><label style={LBL_STYLE}>Entreprise (optionnel)</label><input style={INP_STYLE()} placeholder="Nom de la société" value={form.locEntreprise||""} onChange={e=>setForm(f=>({...f,locEntreprise:e.target.value}))}/></div>
                  <F k="locAdresse" label="Adresse *" span2 form={form} setForm={setForm} touched={touched} setTouched={setTouched} req={req}/>
                  <div style={{gridColumn:"span 2"}}>
                    <label style={LBL_STYLE}>Téléphone *</label>
                    <TelInput value={form.locTel} onChange={v=>setForm(f=>({...f,locTel:v}))} placeholder="06 12 34 56 78"/>
                    {inv("locTel")&&<p style={{color:"#ef4444",fontSize:10,marginTop:2}}>Obligatoire</p>}
                  </div>
                  <F k="locEmail" label="Email" type="email" form={form} setForm={setForm} touched={touched} setTouched={setTouched} req={req}/>
                  <F k="locPermis" label="N° Permis" form={form} setForm={setForm} touched={touched} setTouched={setTouched} req={req}/>
                  <div style={{gridColumn:"span 2"}}><label style={LBL_STYLE}>Réseaux sociaux</label><input style={INP_STYLE()} placeholder="Instagram, Snapchat, WhatsApp..." value={form.locReseaux||""} onChange={e=>setForm(f=>({...f,locReseaux:e.target.value}))}/></div>
                </div>
                {/* 2ème conducteur */}
                <div style={{marginTop:12,padding:"12px",background:"#f8fafc",borderRadius:10,border:"1px solid #e5e7eb"}}>
                  <div style={{fontWeight:600,fontSize:12,color:"#6b7280",marginBottom:8}}>Deuxième conducteur (optionnel)</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div><label style={LBL_STYLE}>Prénom</label><input style={INP_STYLE()} placeholder="Prénom" value={form.loc2Prenom||""} onChange={e=>setForm(f=>({...f,loc2Prenom:e.target.value}))}/></div>
                    <div><label style={LBL_STYLE}>Nom</label><input style={INP_STYLE()} placeholder="Nom" value={form.loc2Nom||""} onChange={e=>setForm(f=>({...f,loc2Nom:e.target.value}))}/></div>
                  </div>
                </div>
              </div>
              <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <h3 style={{fontWeight:700,fontSize:13,marginBottom:4}}>Documents du locataire</h3>
                <p style={{fontSize:11,color:"#6b7280",marginBottom:12}}>CNI/Passeport · Justificatif domicile · Photo arrière</p>
                <DocsLocataire docs={docsLocataire} setDocs={setDocsLocataire}/>
              </div>
              <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <h3 style={{fontWeight:700,fontSize:13,marginBottom:12}}>Durée</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div><label style={LBL_STYLE}>Début *</label><input type="date" style={INP_STYLE(inv("dateDebut")?{borderColor:"#f87171",background:"#fef2f2"}:{})} value={form.dateDebut} onChange={e=>setForm(f=>({...f,dateDebut:e.target.value}))} onBlur={()=>setTouched(t=>({...t,dateDebut:true}))}/></div>
                  <div><label style={LBL_STYLE}>Heure départ</label><input type="time" style={INP_STYLE()} value={form.heureDebut} onChange={e=>setForm(f=>({...f,heureDebut:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Fin *</label><input type="date" style={INP_STYLE(inv("dateFin")?{borderColor:"#f87171",background:"#fef2f2"}:{})} value={form.dateFin} onChange={e=>setForm(f=>({...f,dateFin:e.target.value}))} onBlur={()=>setTouched(t=>({...t,dateFin:true}))}/></div>
                  <div><label style={LBL_STYLE}>Heure retour</label><input type="time" style={INP_STYLE()} value={form.heureFin} onChange={e=>setForm(f=>({...f,heureFin:e.target.value}))}/></div>
                </div>
                <div style={{marginTop:10,background:"#f0fdf4",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#16a34a",fontWeight:600}}>Durée : {form.nbJours} jour(s) ({form.heuresLoc}h)</div>
              </div>
              <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <h3 style={{fontWeight:700,fontSize:13,marginBottom:12}}>État au départ</h3>
                <div style={{marginBottom:12}}><label style={LBL_STYLE}>Kilométrage départ</label><input type="number" style={INP_STYLE()} placeholder={sel.km} value={form.kmDepart} onChange={e=>setForm(f=>({...f,kmDepart:e.target.value}))}/></div>
                <div style={{marginBottom:12}}><label style={LBL_STYLE}>Carburant au départ</label><FuelGauge value={form.carburantDepart} onChange={v=>setForm(f=>({...f,carburantDepart:v}))}/></div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  <CheckBool label="Extérieur propre" icon="🚿" val={form.exterieurPropre} onChange={v=>setForm(f=>({...f,exterieurPropre:v}))}/>
                  <CheckBool label="Intérieur propre" icon="🧹" val={form.interieurPropre} onChange={v=>setForm(f=>({...f,interieurPropre:v}))}/>
                </div>
              </div>
              <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <h3 style={{fontWeight:700,fontSize:13,marginBottom:4}}>Photos du véhicule au départ</h3>
                <p style={{fontSize:11,color:"#6b7280",marginBottom:12}}>{photosDepart.length} photo{photosDepart.length>1?"s":""}</p>
                <PhotosDepart photos={photosDepart} setPhotos={setPhotosDepart}/>
              </div>
              <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <h3 style={{fontWeight:700,fontSize:13,marginBottom:12}}>💰 Récapitulatif du prix</h3>
                {/* Prix/jour modifiable */}
                <div style={{background:"#eff6ff",borderRadius:10,padding:12,marginBottom:12,border:"1px solid #bfdbfe"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#1e3a8a"}}>💲 Tarification</div>
                    <div style={{fontSize:10,color:"#6b7280"}}>{tarifAuto.label}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div><label style={LBL_STYLE}>Prix/jour modifié ({sym})</label><input type="number" style={INP_STYLE({background:"white"})} placeholder={sel?.tarif||"0"} value={form.prixJourModifie||""} onChange={e=>setForm(f=>({...f,prixJourModifie:e.target.value}))}/></div>
                    <div style={{display:"flex",alignItems:"flex-end"}}><div style={{width:"100%",background:"#1e3a8a",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"rgba(255,255,255,.6)"}}>Sous-total</div><div style={{fontSize:18,fontWeight:900,color:"#4ade80"}}>{tarifAuto.prix} {sym}</div></div></div>
                  </div>
                </div>
                {/* Caution */}
                <div style={{background:"#fef3c7",borderRadius:10,padding:12,marginBottom:10,border:"1px solid #fde68a"}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:6}}>🛡️ Caution — {sel?.caution||0} {sym}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div><label style={LBL_STYLE}>Mode de paiement</label><select style={INP_STYLE({background:"white"})} value={form.paiement} onChange={e=>setForm(f=>({...f,paiement:e.target.value}))}><option value="especes">💵 Espèces</option><option value="cb">💳 Carte bancaire</option><option value="cheque">📄 Chèque</option><option value="virement">🏦 Virement</option><option value="autre">… Autre</option></select></div>
                    <div><label style={LBL_STYLE}>Mode de caution</label><select style={INP_STYLE({background:"white"})} value={form.cautionMode} onChange={e=>setForm(f=>({...f,cautionMode:e.target.value}))}><option value="especes">💵 Espèces</option><option value="cb">💳 Carte bancaire</option><option value="cheque">📄 Chèque</option><option value="virement">🏦 Virement</option><option value="emprunt">🤝 Emprunt</option><option value="autre">… Autre</option></select></div>
                  </div>
                </div>
                {/* Accompte + Remise + Code promo */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div><label style={LBL_STYLE}>💳 Accompte ({sym})</label><input type="number" style={INP_STYLE()} placeholder="0" value={form.accompte||""} onChange={e=>setForm(f=>({...f,accompte:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>🏷️ Remise ({sym})</label><input type="number" style={INP_STYLE()} placeholder="0" value={form.remise||""} onChange={e=>setForm(f=>({...f,remise:e.target.value}))}/></div>
                  <div style={{gridColumn:"span 2"}}><label style={LBL_STYLE}>🎟️ Code promo</label><input style={INP_STYLE()} placeholder="Ex: PROMO10" value={form.codePromo||""} onChange={e=>setForm(f=>({...f,codePromo:e.target.value.toUpperCase()}))}/></div>
                </div>
                {/* Total */}
                <div style={{background:"#0a1940",borderRadius:10,padding:12,color:"white"}}>
                  {remise>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,opacity:.7,marginBottom:4}}><span>Remise</span><span>- {remise} {sym}</span></div>}
                  {accompte>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,opacity:.7,marginBottom:4}}><span>Accompte versé</span><span>- {accompte} {sym}</span></div>}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12}}>Total location ({form.nbJours}j)</span><span style={{fontWeight:900,fontSize:18,color:"#4ade80"}}>{totalNet} {sym}</span></div>
                  {accompte>0&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid rgba(255,255,255,.2)",marginTop:6,paddingTop:6}}><span style={{fontSize:12,fontWeight:700}}>Reste à payer</span><span style={{fontWeight:900,fontSize:16,color:"#fbbf24"}}>{resteAPayer} {sym}</span></div>}
                </div>
              </div>
              <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <h3 style={{fontWeight:700,fontSize:13,marginBottom:12}}>Signatures</h3>
                <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
                  <SigPad label="Signature du loueur" onSave={setSigL}/>
                  <SigPad label="Signature du locataire" onSave={setSigLoc}/>
                </div>
              </div>
              <button onClick={saveContrat} style={{width:"100%",background:"linear-gradient(135deg,#0a1940,#1e3a8a)",color:"white",border:"none",borderRadius:12,padding:14,fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 14px rgba(0,0,0,.2)"}}>
                Créer le contrat — {totalNet} {sym}
              </button>
            </>)}
            {lastContrat&&(<div style={{marginTop:16,background:"#f0fdf4",borderRadius:14,padding:16,border:"2px solid #86efac"}}>
              <div style={{fontWeight:700,color:"#16a34a",marginBottom:8}}>✅ Contrat créé pour {lastContrat.contrat.locNom}</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <button onClick={()=>dlPDF(lastContrat.html)} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>📄 Imprimer / PDF</button>
                <button onClick={()=>setLastContrat(null)} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"8px 12px",fontSize:12,cursor:"pointer"}}>Fermer</button>
              </div>
            </div>)}
          </div>
        )}

        {page==="planning"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Planning</h1>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{display:"flex",background:"white",borderRadius:8,border:"1px solid #e5e7eb",overflow:"hidden"}}>
                  <button onClick={()=>setPlanView("calendrier")} style={{padding:"6px 12px",fontSize:11,fontWeight:planView==="calendrier"?700:400,background:planView==="calendrier"?"#1e3a8a":"white",color:planView==="calendrier"?"white":"#374151",border:"none",cursor:"pointer"}}>Calendrier</button>
                  <button onClick={()=>setPlanView("gantt")} style={{padding:"6px 12px",fontSize:11,fontWeight:planView==="gantt"?700:400,background:planView==="gantt"?"#1e3a8a":"white",color:planView==="gantt"?"white":"#374151",border:"none",cursor:"pointer"}}>Gantt</button>
                </div>
                {planView==="calendrier"&&<>
                  <button onClick={()=>{const d=new Date(planMonth);d.setMonth(d.getMonth()-1);setPlanMonth(new Date(d));}} style={{padding:"5px 12px",background:"white",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:700}}>◀</button>
                  <span style={{fontWeight:700,fontSize:13,minWidth:130,textAlign:"center",textTransform:"capitalize"}}>{planMonth.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}</span>
                  <button onClick={()=>{const d=new Date(planMonth);d.setMonth(d.getMonth()+1);setPlanMonth(new Date(d));}} style={{padding:"5px 12px",background:"white",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:700}}>▶</button>
                </>}
                {planView==="gantt"&&<>
                  <button onClick={ganttPrevMonth} style={{padding:"5px 12px",background:"white",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:700}}>◀</button>
                  <select value={`${ganttStartDate.getFullYear()}-${ganttStartDate.getMonth()}`} onChange={e=>{const[y,m]=e.target.value.split("-");const d=new Date(parseInt(y),parseInt(m),1);setGanttStartDate(d);}} style={{padding:"5px 8px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:12,cursor:"pointer"}}>
                    {Array.from({length:24},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-12+i);return d;}).map(d=><option key={`${d.getFullYear()}-${d.getMonth()}`} value={`${d.getFullYear()}-${d.getMonth()}`}>{MONTH_NAMES[d.getMonth()]} {d.getFullYear()}</option>)}
                  </select>
                  <button onClick={ganttNextMonth} style={{padding:"5px 12px",background:"white",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:700}}>▶</button>
                  <button onClick={ganttGoToday} style={{padding:"5px 12px",background:"#1e3a8a",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700}}>Aujourd'hui</button>
                </>}
              </div>
            </div>
            {planView==="calendrier"&&vehicles.map(v=>{
              const vContrats=contrats.filter(c=>c.vehicleId===v.id);
              return(<div key={v.id} style={{background:"white",borderRadius:14,marginBottom:14,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:"1px solid #e5e7eb"}}>
                <div style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><span style={{color:"white",fontWeight:800,fontSize:13}}>{v.marque} {v.modele}</span><span style={{color:"rgba(255,255,255,.6)",fontSize:11,marginLeft:10}}>{v.immat}</span></div>
                  <Badge s={statut(v.id)}/>
                </div>
                <div style={{overflowX:"auto"}}>
                  <div style={{display:"flex",minWidth:days.length*28+130}}>
                    <div style={{width:130,flexShrink:0}}/>
                    {days.map(d=>{const isToday=d.toDateString()===new Date().toDateString();const isWE=d.getDay()===0||d.getDay()===6;return(<div key={d.getTime()} style={{width:28,flexShrink:0,textAlign:"center",padding:"5px 0",fontSize:10,fontWeight:isToday?800:400,color:isToday?"#2563eb":isWE?"#9ca3af":"#6b7280",background:isToday?"#eff6ff":isWE?"#fafafa":"white",borderLeft:"1px solid #f0f0f0"}}>{d.getDate()}</div>);})}
                  </div>
                  <div style={{display:"flex",minWidth:days.length*28+130,padding:"4px 0"}}>
                    <div style={{width:130,flexShrink:0,padding:"0 8px",fontSize:10,fontWeight:600,color:"#374151",display:"flex",alignItems:"center"}}>Disponibilite</div>
                    {days.map(d=>{const b=isBooked(v.id,d);return(<div key={d.getTime()} style={{width:28,flexShrink:0,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:b?"#dbeafe":"white",borderLeft:"1px solid #f0f0f0"}}><div style={{width:20,height:20,borderRadius:4,background:b?"#2563eb":"#dcfce7"}}/></div>);})}
                  </div>
                </div>
                {vContrats.length>0&&(<div style={{padding:"8px 12px",borderTop:"1px solid #f0f0f0",display:"flex",flexWrap:"wrap",gap:6}}>
                  {vContrats.map(c=>{const mStart=new Date(c.dateDebut).getMonth(),mEnd=new Date(c.dateFin).getMonth(),y=planMonth.getMonth();if(mStart!==y&&mEnd!==y)return null;return(<div key={c.id} style={{background:"#eff6ff",borderRadius:8,padding:"4px 10px",fontSize:11,border:"1px solid #bfdbfe"}}><span style={{fontWeight:700,color:"#1e3a8a"}}>{c.locNom}</span><span style={{color:"#6b7280",marginLeft:6}}>{c.dateDebut} → {c.dateFin}</span></div>);})}
                </div>)}
              </div>);
            })}
            {planView==="gantt"&&(
              <div style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <div style={{padding:"10px 16px",borderBottom:"1px solid #e5e7eb",fontSize:12,color:"#6b7280"}}>
                  Période : <b>{ganttStartDate.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}</b> → <b>{ganttDates[ganttDates.length-1].toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}</b>
                </div>
                <div ref={ganttRef} style={{overflowX:"auto"}}>
                  <div style={{minWidth:150+ganttDays*DW}}>
                    <div style={{display:"flex",borderBottom:"2px solid #e5e7eb",background:"#f8fafc"}}>
                      <div style={{width:150,flexShrink:0,padding:"6px 10px",fontSize:11,fontWeight:700,borderRight:"1px solid #e5e7eb"}}>Véhicule</div>
                      {ganttDates.map((d,i)=>{
                        const isToday=d.toDateString()===today.toDateString();
                        const isWE=d.getDay()===0||d.getDay()===6;
                        const isFirst=d.getDate()===1;
                        return(<div key={i} style={{width:DW,flexShrink:0,textAlign:"center",padding:"4px 0",fontSize:9,color:isToday?"white":isWE?"#9ca3af":"#6b7280",background:isToday?"#2563eb":isWE?"#f0f0f0":"#f8fafc",borderLeft:"1px solid #e8e8e8",position:"relative",fontWeight:isToday?800:400}}>
                          {isFirst&&!isToday&&<div style={{position:"absolute",top:0,left:0,right:0,background:"#1e3a8a",color:"white",fontSize:7,textAlign:"center",lineHeight:"10px"}}>{MONTH_NAMES[d.getMonth()]}</div>}
                          <span style={{position:"relative",top:isFirst&&!isToday?8:0}}>{d.getDate()}</span>
                        </div>);
                      })}
                    </div>
                    {vehicles.map(v=>(
                      <div key={v.id} style={{display:"flex",borderBottom:"1px solid #f0f0f0"}}>
                        <div style={{width:150,flexShrink:0,padding:"8px 10px",fontSize:11,borderRight:"1px solid #e5e7eb",background:"#fafafa"}}>
                          <div style={{fontWeight:700}}>{v.marque} {v.modele}</div>
                          <div style={{fontSize:9,color:"#9ca3af"}}>{v.immat}</div>
                        </div>
                        <div style={{flex:1,position:"relative",height:44}}>
                          {todayOffset>=0&&todayOffset<ganttDays&&<div style={{position:"absolute",left:todayOffset*DW+DW/2,top:0,bottom:0,width:2,background:"#ef4444",zIndex:2,opacity:.5}}/>}
                          {ganttDates.map((d,i)=>{const isWE=d.getDay()===0||d.getDay()===6;return(<div key={i} style={{position:"absolute",left:i*DW,top:0,width:DW,height:"100%",background:isWE?"rgba(0,0,0,.025)":"transparent",borderLeft:"1px solid #f5f5f5"}}/>);})}
                          {contrats.filter(c=>c.vehicleId===v.id&&c.dateDebut&&c.dateFin).map((c,ci)=>{
                            const s=new Date(c.dateDebut),e=new Date(c.dateFin);
                            const off=Math.floor((s-ganttStartDate)/86400000);
                            const w=Math.max(Math.ceil((e-s)/86400000)+1,1);
                            if(off>ganttDays||off+w<0)return null;
                            return(<div key={c.id} style={{position:"absolute",left:Math.max(0,off)*DW+2,top:8,height:28,width:Math.max(Math.min(w+off,ganttDays)-Math.max(off,0),1)*DW-4,background:ganttColors[ci%ganttColors.length],borderRadius:6,display:"flex",alignItems:"center",padding:"0 6px",overflow:"hidden",zIndex:1,cursor:"pointer"}} title={c.locNom+" — "+c.dateDebut+" → "+c.dateFin}>
                              <span style={{color:"white",fontSize:9,fontWeight:700,whiteSpace:"nowrap"}}>{c.locNom}</span>
                            </div>);
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {page==="contrats"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <button onClick={()=>setPage("contrats_hub")} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>← Retour</button>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Historique contrats ({contratsFiltres.length}/{contrats.length})</h1>
            </div>
            <div style={{background:"white",borderRadius:12,padding:14,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)",display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{gridColumn:"span 2"}}><input placeholder="🔍 Nom, immat, téléphone..." style={INP_STYLE()} value={searchContrat} onChange={e=>setSearchContrat(e.target.value)}/></div>
              <div><label style={LBL_STYLE}>Véhicule</label><select style={INP_STYLE()} value={filterVehicleContrat} onChange={e=>setFilterVehicleContrat(e.target.value)}><option value="">Tous</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.marque} {v.modele} — {v.immat}</option>)}</select></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div><label style={LBL_STYLE}>Début après</label><input type="date" style={INP_STYLE()} value={filterDateDebut} onChange={e=>setFilterDateDebut(e.target.value)}/></div>
                <div><label style={LBL_STYLE}>Fin avant</label><input type="date" style={INP_STYLE()} value={filterDateFin} onChange={e=>setFilterDateFin(e.target.value)}/></div>
              </div>
              {(searchContrat||filterVehicleContrat||filterDateDebut||filterDateFin)&&<div style={{gridColumn:"span 2"}}><button onClick={()=>{setSearchContrat("");setFilterVehicleContrat("");setFilterDateDebut("");setFilterDateFin("");}} style={{padding:"5px 12px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:7,fontSize:11,cursor:"pointer",fontWeight:700}}>✕ Effacer filtres</button></div>}
            </div>
            {contratsFiltres.length===0?<div style={{textAlign:"center",color:"#9ca3af",padding:40,background:"white",borderRadius:14}}><p>Aucun contrat trouvé</p></div>
              :contratsFiltres.map(c=>{
                const r=retours[c.id];
                const dl=c.docsLocataire||{};
                const nbDocs=[dl.cniRecto,dl.cniVerso,dl.justifDom,dl.photoAr].filter(Boolean).length;
                return(<div key={c.id} style={{background:"white",borderRadius:14,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:"1px solid #e5e7eb"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{fontWeight:800,fontSize:14}}>{c.locNom.toUpperCase()}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>{c.vehicleLabel} · {c.immat}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>{c.dateDebut} → {c.dateFin} · {c.nbJours}j</div>
                      <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                        {nbDocs>0&&<span style={{fontSize:10,background:"#f5f3ff",color:"#7c3aed",borderRadius:6,padding:"2px 7px",fontWeight:600}}>{nbDocs} doc{nbDocs>1?"s":""}</span>}
                        {(c.photosDepart||[]).length>0&&<span style={{fontSize:10,background:"#f0fdf4",color:"#16a34a",borderRadius:6,padding:"2px 7px",fontWeight:600}}>{c.photosDepart.length} photo{c.photosDepart.length>1?"s":""}</span>}
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:900,fontSize:18,color:"#1e3a8a"}}>{c.totalCalc} EUR</div>
                      {r&&<div style={{fontSize:10,color:"#16a34a",fontWeight:600}}>✅ Retour OK</div>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <button onClick={()=>rePrint(c)} style={{padding:"5px 10px",background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>📄 PDF</button>
                    {!r&&<button onClick={()=>setRetourContratId(c.id)} style={{padding:"5px 10px",background:"#f0fdf4",color:"#16a34a",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>Retour</button>}
                    {r&&<button onClick={()=>reDownloadPV(c)} style={{padding:"5px 10px",background:"#fef3c7",color:"#d97706",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>📄 PV</button>}
                    <button onClick={()=>{const cl=clients.find(x=>x.nom===c.locNom&&x.tel===c.locTel);if(cl)setSelectedClient(cl);}} style={{padding:"5px 10px",background:"#f5f3ff",color:"#7c3aed",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>👤 Fiche</button>
                    <button onClick={async()=>{if(window.confirm("Supprimer ?")){setContrats(cs=>cs.filter(x=>x.id!==c.id));if(user)await supabase.from('contrats').delete().eq('id',c.id).eq('user_id',user.id);}}} style={{padding:"5px 10px",background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:7,fontSize:11,cursor:"pointer"}}>Supprimer</button>
                  </div>
                </div>);
              })}
          </div>
        )}

        {page==="retours"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <button onClick={()=>setPage("contrats_hub")} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>← Retour</button>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Retours</h1>
            </div>
            {contrats.filter(c=>!retours[c.id]).length>0&&(<div style={{marginBottom:16}}>
              <h2 style={{fontSize:13,fontWeight:700,color:"#6b7280",marginBottom:8}}>En attente de retour ({contrats.filter(c=>!retours[c.id]).length})</h2>
              {contrats.filter(c=>!retours[c.id]).map(c=>(<div key={c.id} style={{background:"white",borderRadius:12,padding:12,marginBottom:8,border:"1px solid #fde68a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:700}}>{c.locNom}</div><div style={{fontSize:11,color:"#6b7280"}}>{c.vehicleLabel} · {c.dateDebut} → {c.dateFin}</div></div>
                <button onClick={()=>setRetourContratId(c.id)} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"7px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Faire le retour</button>
              </div>))}
            </div>)}
            {contrats.filter(c=>retours[c.id]).length>0&&(
              <div>
                <h2 style={{fontSize:13,fontWeight:700,color:"#6b7280",marginBottom:8}}>Retours effectués</h2>
                <div style={{background:"white",borderRadius:12,padding:12,marginBottom:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{gridColumn:"span 2"}}><input placeholder="🔍 Nom, immat..." style={INP_STYLE()} value={searchRetour} onChange={e=>setSearchRetour(e.target.value)}/></div>
                  <div><label style={LBL_STYLE}>Véhicule</label><select style={INP_STYLE()} value={filterVehicleRetour} onChange={e=>setFilterVehicleRetour(e.target.value)}><option value="">Tous</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.marque} {v.modele}</option>)}</select></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div><label style={LBL_STYLE}>Retour après</label><input type="date" style={INP_STYLE()} value={filterRetourDateDebut} onChange={e=>setFilterRetourDateDebut(e.target.value)}/></div>
                    <div><label style={LBL_STYLE}>Retour avant</label><input type="date" style={INP_STYLE()} value={filterRetourDateFin} onChange={e=>setFilterRetourDateFin(e.target.value)}/></div>
                  </div>
                  {(searchRetour||filterVehicleRetour||filterRetourDateDebut||filterRetourDateFin)&&<div style={{gridColumn:"span 2"}}><button onClick={()=>{setSearchRetour("");setFilterVehicleRetour("");setFilterRetourDateDebut("");setFilterRetourDateFin("");}} style={{padding:"5px 12px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:7,fontSize:11,cursor:"pointer",fontWeight:700}}>✕ Effacer</button></div>}
                </div>
                {retoursFiltres.map(c=>{const r=retours[c.id];return(<div key={c.id} style={{background:"white",borderRadius:12,padding:14,marginBottom:8,border:"1px solid #e5e7eb"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                    <div>
                      <div style={{fontWeight:700}}>{c.locNom}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>{c.vehicleLabel} · {c.dateDebut} → {c.dateFin}</div>
                      {r.date&&<div style={{fontSize:10,color:"#9ca3af"}}>Retour effectué le {new Date(r.date).toLocaleDateString("fr-FR")}</div>}
                      <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                        {r.kmRetour&&<span style={{fontSize:10,background:"#eff6ff",color:"#2563eb",borderRadius:6,padding:"2px 7px",fontWeight:600}}>{r.kmRetour} km</span>}
                        {r.montantRetenu>0&&<span style={{fontSize:10,background:"#fef2f2",color:"#dc2626",borderRadius:6,padding:"2px 7px",fontWeight:600}}>Retenu : {r.montantRetenu} EUR</span>}
                        {r.cautionRestituee&&<span style={{fontSize:10,background:"#f0fdf4",color:"#16a34a",borderRadius:6,padding:"2px 7px",fontWeight:600}}>Caution OK</span>}
                      </div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:900,fontSize:16,color:"#16a34a"}}>{((c.totalCalc||0)+(r.surplusKm||0)+(r.montantRetenu||0)).toFixed(0)} EUR</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button onClick={()=>reDownloadPV(c)} style={{padding:"6px 12px",background:"#fbbf24",color:"#1f2937",border:"none",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>📄 PV PDF</button>
                    <button onClick={()=>supprimerRetour(c.id)} style={{padding:"6px 12px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>🗑️ Supprimer le retour</button>
                  </div>
                </div>);})}
              </div>
            )}
            {contrats.length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:40}}><p>Aucun contrat enregistré.</p></div>}
          </div>
        )}

        {page==="amendes"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Amendes</h1>
              <button onClick={()=>setShowAddAmende(!showAddAmende)} style={{background:"#dc2626",color:"white",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
            </div>
            {showAddAmende&&(()=>{
              const contratRef=findContratForAmende(amendeForm.vehicleId,amendeForm.date,amendeForm.heure);
              return(<div style={{background:"white",borderRadius:14,padding:18,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.1)",border:"2px solid #fecaca"}}>
                <h3 style={{fontWeight:700,fontSize:14,marginBottom:12,color:"#dc2626"}}>Nouvelle amende</h3>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:10}}>
                  <div><label style={LBL_STYLE}>Véhicule *</label><select style={INP_STYLE()} value={amendeForm.vehicleId} onChange={e=>setAmendeForm(f=>({...f,vehicleId:e.target.value}))}><option value="">-- Choisir --</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.marque} {v.modele} — {v.immat}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Date *</label><input type="date" style={INP_STYLE()} value={amendeForm.date} onChange={e=>setAmendeForm(f=>({...f,date:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Heure</label><input type="time" style={INP_STYLE()} value={amendeForm.heure} onChange={e=>setAmendeForm(f=>({...f,heure:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Type</label><select style={INP_STYLE()} value={amendeForm.type} onChange={e=>setAmendeForm(f=>({...f,type:e.target.value}))}>{TYPES_AMENDE.map(t=><option key={t}>{t}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Montant (EUR)</label><input type="number" style={INP_STYLE()} value={amendeForm.montant} onChange={e=>setAmendeForm(f=>({...f,montant:e.target.value.replace(/\D/g,"")}))} inputMode="numeric"/></div>
                  <div><label style={LBL_STYLE}>Statut</label><select style={INP_STYLE()} value={amendeForm.statut} onChange={e=>setAmendeForm(f=>({...f,statut:e.target.value}))}>{STATUTS_AMENDE.map(s=><option key={s}>{s}</option>)}</select></div>
                </div>
                <div style={{marginBottom:10}}><label style={LBL_STYLE}>Notes</label><textarea style={{...INP_STYLE(),resize:"vertical",fontFamily:"inherit"}} rows={2} value={amendeForm.notes} onChange={e=>setAmendeForm(f=>({...f,notes:e.target.value}))}/></div>
                {amendeForm.vehicleId&&amendeForm.date&&(
                  <div style={{padding:"10px 14px",borderRadius:10,marginBottom:10,background:contratRef?"#f0fdf4":"#fef3c7",border:`1px solid ${contratRef?"#bbf7d0":"#fde68a"}`}}>
                    {contratRef?<div><div style={{fontWeight:700,fontSize:12,color:"#16a34a",marginBottom:2}}>Contrat trouvé automatiquement</div><div style={{fontSize:11}}><b>{contratRef.locNom}</b> — {contratRef.dateDebut} → {contratRef.dateFin}</div><div style={{fontSize:10,color:"#6b7280"}}>Tel : {contratRef.locTel}</div></div>:<div style={{fontSize:12,color:"#92400e"}}>Aucun contrat actif à cette date.</div>}
                  </div>
                )}
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{if(!amendeForm.vehicleId||!amendeForm.date){toast_("Choisissez un véhicule et une date","error");return;}const v=vehicles.find(x=>x.id===amendeForm.vehicleId);const newA={id:Date.now(),...amendeForm,vehicleLabel:v?v.marque+" "+v.modele+" - "+v.immat:"",contratId:contratRef?.id||null,locNom:contratRef?.locNom||"",locTel:contratRef?.locTel||""};setAmendes(a=>[newA,...a]);setAmendeForm({vehicleId:"",contratRef:"",date:"",heure:"",montant:"",type:"Excès de vitesse",statut:"A traiter",notes:""});setShowAddAmende(false);toast_("Amende ajoutée !");}} style={{background:"#dc2626",color:"white",border:"none",borderRadius:8,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontSize:12}}>Enregistrer</button>
                  <button onClick={()=>setShowAddAmende(false)} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12}}>Annuler</button>
                </div>
              </div>);
            })()}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
              {[["A traiter","#dc2626","🚨"],["En cours","#d97706","⏳"],["Confirmée","#2563eb","✅"],["Payée","#16a34a","💰"],["Contestée","#7c3aed","⚖️"]].map(([s,col,icon])=>(<div key={s} style={{background:"white",borderRadius:12,padding:"10px 14px",boxShadow:"0 2px 6px rgba(0,0,0,.06)",borderLeft:`4px solid ${col}`}}><div style={{fontSize:10,color:"#6b7280"}}>{icon} {s}</div><div style={{fontSize:22,fontWeight:800,color:col}}>{amendes.filter(a=>a.statut===s).length}</div></div>))}
            </div>
            {amendes.length===0?<div style={{textAlign:"center",color:"#9ca3af",padding:40,background:"white",borderRadius:14}}><div style={{fontSize:36,marginBottom:8}}>🚨</div><p>Aucune amende enregistrée.</p></div>
              :amendes.map(a=>{
                const colStatut=a.statut==="A traiter"?"#dc2626":a.statut==="En cours"?"#d97706":a.statut==="Confirmée"?"#2563eb":a.statut==="Payée"?"#16a34a":"#7c3aed";
                const contratLie=contrats.find(c=>c.id===a.contratId);
                return(<div key={a.id} style={{background:"white",borderRadius:14,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:`2px solid ${colStatut}22`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}><span style={{fontWeight:800,fontSize:14}}>{a.type}</span><span style={{fontSize:10,background:colStatut+"22",color:colStatut,borderRadius:99,padding:"2px 8px",fontWeight:700}}>{a.statut}</span></div>
                      <div style={{fontSize:11,color:"#6b7280"}}>{a.vehicleLabel}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>{a.date}{a.heure?" à "+a.heure:""}</div>
                      {a.locNom&&<div style={{fontSize:11,marginTop:4}}>Locataire : <b>{a.locNom}</b>{a.locTel?" — "+a.locTel:""}</div>}
                      {a.notes&&<div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{a.notes}</div>}
                    </div>
                    <div>{a.montant&&<div style={{fontWeight:900,fontSize:18,color:"#dc2626"}}>{a.montant} EUR</div>}</div>
                  </div>
                  {contratLie&&<div style={{background:"#eff6ff",borderRadius:8,padding:"6px 10px",marginBottom:8,fontSize:11,border:"1px solid #bfdbfe"}}>Contrat : <b>{contratLie.locNom}</b> — {contratLie.dateDebut} → {contratLie.dateFin}<button onClick={()=>rePrint(contratLie)} style={{marginLeft:8,padding:"2px 8px",background:"#1e3a8a",color:"white",border:"none",borderRadius:5,fontSize:10,cursor:"pointer",fontWeight:700}}>PDF</button></div>}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {STATUTS_AMENDE.filter(s=>s!==a.statut).map(s=>(<button key={s} onClick={()=>setAmendes(as=>as.map(x=>x.id===a.id?{...x,statut:s}:x))} style={{padding:"4px 10px",background:"#f1f5f9",color:"#374151",border:"1px solid #e5e7eb",borderRadius:7,fontSize:10,cursor:"pointer",fontWeight:600}}>{s}</button>))}
                    <button onClick={()=>setAmendes(as=>as.filter(x=>x.id!==a.id))} style={{padding:"4px 10px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:7,fontSize:10,cursor:"pointer"}}>Supprimer</button>
                  </div>
                </div>);
              })}
          </div>
        )}

        {page==="questions"&&(
          <div>
            <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937",marginBottom:4}}>Questions clients</h1>
            <p style={{fontSize:12,color:"#6b7280",marginBottom:16}}>Questions posées depuis la vitrine.</p>
            {questions.length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:40,background:"white",borderRadius:14}}><div style={{fontSize:36,marginBottom:8}}>❓</div><p>Aucune question pour l'instant.</p></div>}
            {questions.filter(q=>!q.reponse).length>0&&(
              <div style={{marginBottom:20}}>
                <h2 style={{fontSize:13,fontWeight:700,color:"#dc2626",marginBottom:8}}>Sans réponse ({questions.filter(q=>!q.reponse).length})</h2>
                {questions.filter(q=>!q.reponse).map(q=>(
                  <div key={q.id} style={{background:"white",borderRadius:12,padding:14,marginBottom:8,border:"2px solid #fde68a"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div><div style={{fontWeight:700,fontSize:13,color:"#1e3a8a"}}>{q.vehicleLabel}</div><div style={{fontSize:10,color:"#9ca3af"}}>{new Date(q.createdAt).toLocaleDateString("fr-FR")}</div></div>
                      <span style={{fontSize:10,background:"#fef3c7",color:"#d97706",borderRadius:99,padding:"2px 8px",fontWeight:700}}>En attente</span>
                    </div>
                    <div style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px",fontSize:12,marginBottom:10,border:"1px solid #e5e7eb"}}>{q.question}</div>
                    <div style={{display:"flex",gap:8}}>
                      <button onClick={()=>{setReponseModal(q);setReponseText("");}} style={{padding:"7px 14px",background:"#1e3a8a",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>Répondre</button>
                      <button onClick={()=>supprimerQuestion(q)} style={{padding:"7px 12px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:12,cursor:"pointer"}}>Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {questions.filter(q=>q.reponse).length>0&&(
              <div>
                <h2 style={{fontSize:13,fontWeight:700,color:"#16a34a",marginBottom:8}}>Répondues ({questions.filter(q=>q.reponse).length})</h2>
                {questions.filter(q=>q.reponse).map(q=>(
                  <div key={q.id} style={{background:"white",borderRadius:12,padding:14,marginBottom:8,border:"1px solid #bbf7d0"}}>
                    <div style={{fontWeight:700,fontSize:13,color:"#1e3a8a",marginBottom:4}}>{q.vehicleLabel}</div>
                    <div style={{background:"#f8fafc",borderRadius:8,padding:"8px 10px",fontSize:11,marginBottom:8}}>Q : {q.question}</div>
                    <div style={{background:"#f0fdf4",borderRadius:8,padding:"8px 10px",fontSize:11,color:"#16a34a",border:"1px solid #bbf7d0",marginBottom:8}}>R : {q.reponse}</div>
                    <button onClick={()=>supprimerQuestion(q)} style={{fontSize:11,padding:"4px 10px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:6,cursor:"pointer"}}>Supprimer</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {page==="finances"&&(
          <div>
            <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937",marginBottom:16}}>Finances</h1>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:16}}>
              {KPI("CA Total",caT+" "+sym,"💶","#2563eb")}
              {KPI("Extras",(totalRetenues+totalSurplusKm).toFixed(0)+" "+sym,"🔒","#d97706")}
              {KPI("Dépenses",dT.toFixed(0)+" "+sym,"📤","#ef4444")}
              {KPI("Bénéfice net",bT.toFixed(0)+" "+sym,bT>=0?"📈":"📉",bT>=0?"#16a34a":"#dc2626",null,bT<0)}
            </div>

            {/* Évolution CA mensuelle */}
            <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:36,height:36,borderRadius:10,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📈</div>
                <div style={{fontWeight:700,fontSize:14}}>Évolution du CA</div>
              </div>
              {caP.every(m=>m.ca===0&&m.dep===0)?<div style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:12}}>Aucune donnée disponible</div>:(
                <div>
                  <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,marginBottom:8}}>
                    {caP.map((m,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:100}}>
                        <div style={{flex:1,borderRadius:"4px 4px 0 0",background:"#3b82f6",height:(m.ca/maxCA*100)+"px",minHeight:m.ca>0?3:0,transition:"height .3s"}}/>
                        <div style={{flex:1,borderRadius:"4px 4px 0 0",background:"#f87171",height:(m.dep/maxCA*100)+"px",minHeight:m.dep>0?3:0,transition:"height .3s"}}/>
                      </div>
                      <span style={{fontSize:9,color:"#6b7280",textTransform:"capitalize"}}>{m.label}</span>
                    </div>))}
                  </div>
                  <div style={{display:"flex",gap:16,fontSize:11,color:"#6b7280"}}>
                    <span><span style={{display:"inline-block",width:10,height:10,background:"#3b82f6",borderRadius:2,marginRight:4}}/>CA</span>
                    <span><span style={{display:"inline-block",width:10,height:10,background:"#f87171",borderRadius:2,marginRight:4}}/>Dépenses</span>
                  </div>
                  <div style={{fontSize:11,color:"#9ca3af",marginTop:4,textAlign:"center"}}>Chiffre d'affaires mensuel (6 derniers mois)</div>
                </div>
              )}
            </div>

            {/* Répartition par véhicule */}
            <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:36,height:36,borderRadius:10,background:"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📊</div>
                <div style={{fontWeight:700,fontSize:14}}>Répartition par véhicule</div>
              </div>
              {vehicles.length===0||contrats.length===0?<div style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:12}}>Aucune donnée disponible</div>:(()=>{
                const vColors=["#2563eb","#7c3aed","#16a34a","#d97706","#dc2626","#0891b2","#be185d","#059669"];
                const vStats=vehicles.map((v,i)=>{
                  const ca=contrats.filter(c=>c.vehicleId===v.id).reduce((s,c)=>s+(c.totalCalc||0),0);
                  return{label:v.marque+" "+v.modele,immat:v.immat,ca,color:vColors[i%vColors.length]};
                }).filter(v=>v.ca>0).sort((a,b)=>b.ca-a.ca);
                const total=vStats.reduce((s,v)=>s+v.ca,0)||1;
                if(vStats.length===0)return<div style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:12}}>Aucune donnée disponible</div>;
                return(<div>
                  {/* Barres horizontales */}
                  <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                    {vStats.map((v,i)=>(<div key={i}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                        <span style={{fontWeight:600}}>{v.label} <span style={{color:"#9ca3af",fontWeight:400}}>({v.immat})</span></span>
                        <span style={{fontWeight:700,color:v.color}}>{v.ca} {sym} — {Math.round(v.ca/total*100)}%</span>
                      </div>
                      <div style={{background:"#f3f4f6",borderRadius:99,height:10,overflow:"hidden"}}>
                        <div style={{width:(v.ca/total*100)+"%",background:v.color,height:"100%",borderRadius:99,transition:"width .4s"}}/>
                      </div>
                    </div>))}
                  </div>
                  {/* Détails */}
                  <div style={{borderTop:"1px solid #f0f0f0",paddingTop:10}}>
                    <div style={{fontWeight:700,fontSize:12,marginBottom:8}}>Détails par véhicule</div>
                    {vStats.map((v,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #f9f9f9",fontSize:11}}>
                      <span style={{display:"flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:"50%",background:v.color,display:"inline-block"}}/>  {v.label}</span>
                      <span style={{fontWeight:700}}>{v.ca} {sym}</span>
                    </div>))}
                  </div>
                </div>);
              })()}
            </div>

            {/* Dépenses */}
            <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <h2 style={{fontWeight:700,fontSize:14}}>Dépenses</h2>
                <button onClick={()=>setShowAddD(!showAddD)} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
              </div>
              {showAddD&&(<div style={{background:"#f8fafc",borderRadius:10,padding:12,marginBottom:12,border:"1px solid #e5e7eb"}}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:8}}>
                  <div><label style={LBL_STYLE}>Libellé</label><input style={INP_STYLE()} value={dForm.label} onChange={e=>setDForm(f=>({...f,label:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Montant {sym}</label><input type="number" style={INP_STYLE()} value={dForm.montant} onChange={e=>setDForm(f=>({...f,montant:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Catégorie</label><select style={INP_STYLE()} value={dForm.categorie} onChange={e=>setDForm(f=>({...f,categorie:e.target.value}))}>{CAT_DEP.map(c=><option key={c}>{c}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Date</label><input type="date" style={INP_STYLE()} value={dForm.date} onChange={e=>setDForm(f=>({...f,date:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Véhicule</label><select style={INP_STYLE()} value={dForm.vehicleId} onChange={e=>setDForm(f=>({...f,vehicleId:e.target.value}))}><option value="">Tous</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.marque} {v.modele}</option>)}</select></div>
                </div>
                <button onClick={async()=>{if(!dForm.label||!dForm.montant){toast_("Remplissez libellé et montant","error");return;}const localId=Date.now();const newDep={id:localId,...dForm};setDepenses(d=>[newDep,...d]);setDForm({label:"",montant:"",categorie:"Carburant",date:new Date().toISOString().slice(0,10),vehicleId:""});setShowAddD(false);toast_("Dépense ajoutée");if(user){const{data:ins,error:err}=await supabase.from('depenses').insert([{user_id:user.id,label:newDep.label,montant:parseFloat(newDep.montant),categorie:newDep.categorie,date:newDep.date,vehicle_id:newDep.vehicleId||null}]).select().single();if(!err&&ins)setDepenses(ds=>ds.map(x=>x.id===localId?{...x,id:ins.id}:x));}}} style={{background:"#16a34a",color:"white",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
              </div>)}
              {depenses.length===0?<p style={{color:"#9ca3af",fontSize:12,textAlign:"center",padding:16}}>Aucune dépense</p>
                :depenses.map(d=>(<div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:8,background:"#f9fafb",marginBottom:5}}>
                  <div><div style={{fontWeight:600,fontSize:12}}>{d.label}</div><div style={{fontSize:10,color:"#9ca3af"}}>{d.categorie} · {d.date}</div></div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontWeight:700,color:"#ef4444"}}>-{d.montant} {sym}</span><button onClick={async()=>{setDepenses(ds=>ds.filter(x=>x.id!==d.id));if(user)await supabase.from('depenses').delete().eq('id',d.id).eq('user_id',user.id);}} style={{padding:"2px 6px",background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:5,cursor:"pointer",fontSize:10}}>X</button></div>
                </div>))}
            </div>
          </div>
        )}

        {page==="profil"&&(
          <div style={{maxWidth:520,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Profil</h1>
              <button onClick={()=>{setProfilEdit(!profilEdit);setProfilForm({...profil});}} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{profilEdit?"Annuler":"Modifier"}</button>
            </div>
            {profilEdit?(<div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
              {[["nom","Nom"],["entreprise","Entreprise"],["siren","SIREN"],["siret","SIRET"],["kbis","KBIS"],["email","Email"],["adresse","Adresse"],["ville","Ville"],["iban","IBAN"]].map(([k,l])=>(<div key={k} style={{marginBottom:10}}><label style={LBL_STYLE}>{l}</label><input style={INP_STYLE()} value={profilForm[k]||""} onChange={e=>setProfilForm(p=>({...p,[k]:e.target.value}))}/></div>))}
              {[["tel","Téléphone"],["whatsapp","WhatsApp"]].map(([k,l])=>(<div key={k} style={{marginBottom:10}}><label style={LBL_STYLE}>{l}</label><TelInput value={profilForm[k]||""} onChange={v=>setProfilForm(p=>({...p,[k]:v}))} placeholder={l}/></div>))}
              <div style={{marginBottom:10}}><label style={LBL_STYLE}>Snapchat</label><input style={INP_STYLE()} placeholder="Nom d'utilisateur Snapchat" value={profilForm.snap||""} onChange={e=>setProfilForm(p=>({...p,snap:e.target.value}))}/></div>
              <div style={{marginBottom:14}}><label style={LBL_STYLE}>💱 Devise</label><select style={INP_STYLE()} value={profilForm.devise||"EUR"} onChange={e=>setProfilForm(p=>({...p,devise:e.target.value}))}>{DEVISES.map(d=><option key={d.code} value={d.code}>{d.label}</option>)}</select></div>
              <button onClick={async()=>{setProfil(profilForm);setProfilEdit(false);toast_("Profil mis à jour");if(user)await supabase.from('profils').upsert({user_id:user.id,...profilForm},{onConflict:'user_id'});}} style={{background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:"10px 0",width:"100%",fontSize:13,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
              <button onClick={()=>supabase.auth.signOut()} style={{marginTop:10,background:"transparent",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:10,padding:"10px 0",width:"100%",fontSize:12,fontWeight:600,cursor:"pointer"}}>Déconnexion</button>
            </div>):(<div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
              <div style={{textAlign:"center",marginBottom:16}}>
                <div style={{width:60,height:60,borderRadius:"50%",background:"#1e3a8a",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",fontSize:24}}>👤</div>
                <div style={{fontWeight:800,fontSize:16}}>{profil.nom}</div>
                <div style={{color:"#6b7280",fontSize:12}}>{profil.entreprise}</div>
              </div>
              {[["SIREN",profil.siren],["SIRET",profil.siret],["KBIS",profil.kbis],["Téléphone",profil.tel],["WhatsApp",profil.whatsapp],["Snapchat",profil.snap],["Email",profil.email],["Adresse",profil.adresse],["Ville",profil.ville],["IBAN",profil.iban]].filter(([,v])=>v).map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}><span style={{fontSize:11,color:"#6b7280"}}>{l}</span><span style={{fontSize:12,fontWeight:600}}>{v}</span></div>))}
              <button onClick={()=>supabase.auth.signOut()} style={{marginTop:14,background:"transparent",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:10,padding:"10px 0",width:"100%",fontSize:12,fontWeight:600,cursor:"pointer"}}>Déconnexion</button>
            </div>)}
          </div>
        )}

      </div>
    </div>
  );
}

function AuthPage(){
  const[mode,setMode]=useState("login");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[showPassword,setShowPassword]=useState(false);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[success,setSuccess]=useState("");
  async function handleSubmit(){
    setLoading(true);setError("");setSuccess("");
    if(mode==="forgot"){const{error:err}=await supabase.auth.resetPasswordForEmail(email);if(err)setError(err.message);else setSuccess("Email envoyé.");setLoading(false);return;}
    let result;
    if(mode==="login")result=await supabase.auth.signInWithPassword({email,password});
    else result=await supabase.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin}});
    if(result.error)setError(result.error.message);
    else if(mode==="signup")setSuccess("Compte créé ! Vérifiez votre email.");
    setLoading(false);
  }
  return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#f1f5f9"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 32px",width:"100%",maxWidth:400,boxShadow:"0 4px 24px rgba(0,0,0,0.1)"}}>
        <h1 style={{textAlign:"center",marginBottom:8,fontSize:22,fontWeight:700}}>MAN'S LOCATION</h1>
        <p style={{textAlign:"center",color:"#6b7280",marginBottom:24,fontSize:14}}>Accès réservé aux professionnels</p>
        {mode!=="forgot"&&(<div style={{display:"flex",marginBottom:24,borderRadius:8,overflow:"hidden",border:"1px solid #e5e7eb"}}>
          {["login","signup"].map(m=>(<button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}} style={{flex:1,padding:"10px",border:"none",cursor:"pointer",background:mode===m?"#1d4ed8":"white",color:mode===m?"white":"#374151",fontWeight:600}}>{m==="login"?"Connexion":"Inscription"}</button>))}
        </div>)}
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,marginBottom:12,fontSize:14,boxSizing:"border-box"}}/>
        {mode!=="forgot"&&(<div style={{position:"relative",marginBottom:16}}>
          <input placeholder="Mot de passe" type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",padding:"10px 12px",paddingRight:40,border:"1px solid #e5e7eb",borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
          <span onClick={()=>setShowPassword(!showPassword)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:18,color:"#6b7280",userSelect:"none"}}>{showPassword?"🙈":"👁️"}</span>
        </div>)}
        {error&&<p style={{color:"red",fontSize:13,marginBottom:12}}>{error}</p>}
        {success&&<p style={{color:"#16a34a",fontSize:13,marginBottom:12}}>{success}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"12px",background:"#1d4ed8",color:"white",border:"none",borderRadius:8,fontWeight:700,fontSize:15,cursor:"pointer"}}>
          {loading?"...":(mode==="login"?"Se connecter":mode==="signup"?"Créer mon compte":"Envoyer le lien")}
        </button>
        {mode==="login"&&<p style={{textAlign:"center",marginTop:14,fontSize:13}}><span onClick={()=>{setMode("forgot");setError("");setSuccess("");}} style={{color:"#1d4ed8",cursor:"pointer",textDecoration:"underline"}}>Mot de passe oublié ?</span></p>}
        {mode==="forgot"&&<p style={{textAlign:"center",marginTop:14,fontSize:13}}><span onClick={()=>{setMode("login");setError("");setSuccess("");}} style={{color:"#1d4ed8",cursor:"pointer",textDecoration:"underline"}}>Retour</span></p>}
      </div>
    </div>
  );
}

export default function App(){
  return <AppContent/>;
}
