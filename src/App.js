import { supabase } from './supabase';
import { useState, useEffect, useRef, useCallback, Fragment } from "react";

const DEF_FRAIS=[
  {id:1,label:"Rayure",montant:300},{id:2,label:"Jantes rayées",montant:300},
  {id:3,label:"Élément touché",montant:300},{id:4,label:"Siège abîmé",montant:350},
  {id:5,label:"Mise en fourrière",montant:250},{id:6,label:"Dégât RSV",montant:17000},
  {id:7,label:"Carburant manquant",montant:20},
  {id:8,label:"Nettoyage véhicule",montant:50},
  {id:9,label:"Forfait tabac (mineur)",montant:20},{id:10,label:"Forfait tabac (fort)",montant:80},
  {id:11,label:"Frais gestion amende",montant:50},
  {id:12,label:"Sortie territoire non autorisée",montant:250},
  {id:13,label:"Immobilisation journalière",montant:60},
];
const DEF_CLAUSES=[];
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
  // === VOITURES ===
  "Alfa Romeo":["Giulia","Stelvio","Tonale","Giulietta","MiTo","4C"],
  "Aston Martin":["Vantage","DB11","DBS","DBX","Valkyrie"],
  "Audi":["A1","A3","A4","A5","A6","A7","A8","Q2","Q3","Q5","Q7","Q8","TT","R8","S3","S4","S5","S6","S7","RS3","RS4","RS5","RS6","RS7","e-tron","Q4 e-tron","etron GT"],
  "BMW":["Série 1","Série 2","Série 2 Gran Coupé","Série 3","Série 4","Série 4 Gran Coupé","Série 5","Série 7","Série 8","X1","X2","X3","X4","X5","X6","X7","XM","Z4","i3","i4","i5","i7","iX","iX1","iX3","M2","M3","M4","M5","M8","X3M","X4M","X5M","X6M"],
  "Bentley":["Continental GT","Bentayga","Flying Spur"],
  "Bugatti":["Chiron","Chiron Sport","Chiron Super Sport","Veyron","Divo"],
  "Chevrolet":["Camaro","Corvette","Silverado","Tahoe","Colorado","Equinox","Traverse","Suburban"],
  "Citroën":["C1","C3","C3 Aircross","C4","C4 X","C5 Aircross","C5 X","Berlingo","Jumpy","Jumper","SpaceTourer","ë-C4","ë-Berlingo","ë-Jumpy","ë-Jumper","Ami"],
  "Cupra":["Ateca","Formentor","Leon","Born","Tavascan"],
  "Dacia":["Sandero","Sandero Stepway","Duster","Jogger","Spring","Logan"],
  "Dodge":["Challenger","Charger","Durango","Ram 1500"],
  "DS":["DS 3","DS 4","DS 7","DS 9"],
  "Ferrari":["488 GTB","F8 Tributo","F8 Spider","296 GTB","296 GTS","Roma","Portofino M","SF90 Stradale","812 Superfast","812 GTS","Purosangue","GTC4Lusso"],
  "Fiat":["500","500X","500e","Panda","Tipo","Doblo","Ducato","Scudo","Talento"],
  "Ford":["Fiesta","Focus","Focus ST","Puma","Kuga","Mustang","Mustang Mach-E","Mondeo","Ranger","Transit","Transit Custom","Transit Connect","Transit Courier","Explorer","eTransit"],
  "GMC":["Sierra","Canyon","Savana"],
  "Honda":["Jazz","Civic","Civic Type R","Accord","HR-V","CR-V","ZR-V","e","NSX","e:Ny1"],
  "Hyundai":["i10","i20","i30","i30 N","Elantra","Kona","Tucson","Santa Fe","Ioniq 5","Ioniq 6","Ioniq 9","Bayon","H1"],
  "Iveco":["Daily Van","Daily Châssis","Daily Bus","eDaily"],
  "Isuzu":["D-Max"],
  "Jaguar":["XE","XF","XJ","E-Pace","F-Pace","I-Pace","F-Type"],
  "Jeep":["Renegade","Compass","Cherokee","Grand Cherokee","Wrangler","Gladiator","Avenger"],
  "Kia":["Picanto","Rio","Ceed","ProCeed","XCeed","Sportage","Sorento","Stinger","EV6","EV9","EV3","Stonic","Niro"],
  "Koenigsegg":["Jesko","Agera RS","Regera","Gemera"],
  "Lamborghini":["Huracan","Huracan EVO","Huracan STO","Huracan Tecnica","Aventador","Aventador SVJ","Revuelto","Urus","Urus S","Sian"],
  "Land Rover":["Defender","Discovery","Discovery Sport","Range Rover","Range Rover Sport","Range Rover Velar","Range Rover Evoque"],
  "MAN Utilitaire":["TGE"],
  "Maserati":["Ghibli","Quattroporte","Levante","MC20","GranTurismo","Grecale"],
  "Maxus":["V80","V90","eDeliver 3","eDeliver 9","T60"],
  "Mazda":["Mazda2","Mazda3","Mazda6","CX-3","CX-30","CX-5","CX-60","CX-90","MX-5"],
  "McLaren":["540C","570S","600LT","720S","750S","765LT","Artura","P1","Senna"],
  "Mercedes":["Classe A","Classe B","CLA","CLS","Classe C","Classe E","Classe S","Classe V","AMG GT","GLA","GLB","GLC","GLE","GLS","Classe G","EQA","EQB","EQC","EQE","EQS","EQE SUV","EQS SUV","A 35 AMG","A 45 AMG","C 43 AMG","C 63 AMG","E 53 AMG","E 63 AMG","S 63 AMG","G 63 AMG","Citan","Vito","Sprinter","eSprinter","eVito"],
  "Mini":["Cooper","Cooper S","Countryman","Clubman","Paceman","Convertible","Electric"],
  "Mitsubishi":["Space Star","ASX","Eclipse Cross","Outlander","L200"],
  "Nissan":["Micra","Juke","Qashqai","X-Trail","Ariya","Leaf","GT-R","Navara","NV200","eNV200","NV300","NV400","Townstar","Interstar"],
  "Opel":["Corsa","Corsa-e","Astra","Astra-e","Insignia","Mokka","Mokka-e","Crossland","Grandland","Combo","Combo-e","Vivaro","Vivaro-e","Movano","Movano-e"],
  "Pagani":["Huayra","Huayra BC","Zonda","Utopia"],
  "Peugeot":["108","208","308","408","508","2008","3008","5008","Rifter","Traveller","Partner","Expert","Boxer","e-208","e-2008","e-308","e-3008","e-5008","e-Expert","e-Boxer"],
  "Piaggio":["Porter","Ape"],
  "Porsche":["718 Boxster","718 Cayman","911","Cayenne","Macan","Panamera","Taycan"],
  "RAM":["1500","2500","3500","ProMaster","ProMaster City"],
  "Renault":["Twingo","Clio","Megane","Megane RS","Talisman","Captur","Kadjar","Austral","Arkana","Koleos","Scenic","Zoe","Rafale","Kangoo","Kangoo Van","Trafic","Master","Express Van","Alaskan"],
  "Rimac":["Nevera"],
  "Rolls-Royce":["Ghost","Phantom","Wraith","Cullinan","Dawn","Silver Shadow"],
  "Seat":["Ibiza","Leon","Arona","Ateca","Tarraco"],
  "Skoda":["Fabia","Scala","Octavia","Superb","Kamiq","Karoq","Kodiaq","Enyaq"],
  "Subaru":["Impreza","WRX","BRZ","Forester","Outback","XV","Solterra","Legacy"],
  "Suzuki":["Swift","Swift Sport","Ignis","Vitara","S-Cross","Jimny"],
  "Tesla":["Model S","Model 3","Model X","Model Y","Cybertruck","Roadster"],
  "Toyota":["Aygo X","Yaris","Yaris Cross","Corolla","Corolla Cross","Camry","Prius","C-HR","RAV4","Highlander","Land Cruiser","Hilux","GR86","GR Yaris","GR Supra","bZ4X","Proace","Proace City"],
  "Volkswagen":["Polo","Golf","Golf GTI","Golf R","Arteon","T-Cross","T-Roc","Tiguan","Touareg","Passat","ID.3","ID.4","ID.5","ID.Buzz","Amarok","Caddy","Caddy Cargo","Transporter","Crafter","ID.Buzz Cargo","Multivan"],
  "Volvo":["V40","V60","V90","S60","S90","XC40","XC60","XC90","EX30","EX90","C40"],
  // === MOTOS ===
  "Aprilia":["RS 660","RSV4","Tuono 660","Tuono V4","Tuareg 660","Shiver 900","Dorsoduro 900"],
  "Benelli":["BN 125","BN 302","TRK 502","TRK 502X","Leoncino 500","Leoncino 800","752S"],
  "BMW Motorrad":["G 310 R","G 310 GS","F 750 GS","F 850 GS","F 900 R","F 900 XR","S 1000 R","S 1000 RR","M 1000 RR","R 1250 R","R 1250 RS","R 1250 GS","R 1250 GS Adventure","R 18","C 400 X","C 400 GT"],
  "CF Moto":["125 NK","300 NK","650 NK","650 MT","700 CLX","800 MT"],
  "Ducati":["Monster","Monster 937","Monster 1200","Panigale V2","Panigale V4","Streetfighter V2","Streetfighter V4","Multistrada 950","Multistrada V4","Diavel","XDiavel","Hypermotard 950","Scrambler 800","Scrambler 1100"],
  "Harley-Davidson":["Iron 883","Forty Eight","Street 750","Sportster S","Nightster","Fat Boy","Breakout","Street Bob","Heritage Classic","Road King","Street Glide","Road Glide","Pan America 1250"],
  "Honda Moto":["CB 125 R","CB 300 R","CB 500 F","CB 650 R","CB 1000 R","CBR 125 R","CBR 300 R","CBR 500 R","CBR 650 R","CBR 1000 RR","Africa Twin","NC 750 X","Rebel 500","Rebel 1100","Forza 125","Forza 350","X-ADV 750","SH 125","SH 350"],
  "Indian":["Scout","Scout Bobber","Chief","Springfield","Challenger","Pursuit","FTR 1200"],
  "Kawasaki":["Z 125","Z 300","Z 400","Z 650","Z 900","ZH2","Ninja 125","Ninja 300","Ninja 400","Ninja 650","Ninja ZX-6R","Ninja ZX-10R","Ninja H2","Versys 650","Versys 1000","Vulcan S"],
  "KTM":["125 Duke","390 Duke","790 Duke","890 Duke","1290 Super Duke","125 RC","390 RC","390 Adventure","790 Adventure","890 Adventure","1290 Adventure"],
  "Kymco":["Agility 125","Like 125","XTown 300","AK 550"],
  "Moto Guzzi":["V7","V9","V85 TT","California","Audace","Eldorado"],
  "MV Agusta":["Brutale 800","Brutale 1000","Dragster 800","F3","F4","Superveloce","Turismo Veloce"],
  "SYM":["Jet 14","Symphony 125","Cruisym 300","Maxsym 400"],
  "Suzuki Moto":["GSX-S 125","GSX-S 750","GSX-S 1000","GSX-R 125","GSX-R 600","GSX-R 750","GSX-R 1000","V-Strom 650","V-Strom 1050","SV 650","Burgman 125","Burgman 400","Hayabusa"],
  "Triumph":["Street Triple","Speed Triple","Trident 660","Tiger 660","Tiger 850","Tiger 900","Tiger 1200","Bonneville T100","Bonneville T120","Thruxton","Bobber","Rocket 3"],
  "Vespa":["Primavera","Sprint","GTS 125","GTS 300","GTV"],
  "Yamaha":["MT-125","MT-03","MT-07","MT-09","MT-10","R125","R3","R6","R7","R1","R1M","Tracer 7","Tracer 9","Ténéré 700","XSR 125","XSR 700","XSR 900","NMAX 125","XMAX 125","XMAX 300","TMAX"],
  "Zero Motorcycles":["SR","S","SR/F","FX","FXS","DSR","DS"],
};
const CAR_COLORS=["Noir","Blanc","Gris","Argent","Bleu","Rouge","Vert","Beige","Marron","Orange","Jaune","Violet","Rose","Bordeaux","Bleu nuit","Gris anthracite","Blanc nacré","Noir métallisé","Bleu métallisé","Gris métallisé"];
const CURRENT_YEAR=new Date().getFullYear();
const CAR_YEARS=Array.from({length:30},(_,i)=>CURRENT_YEAR-i);
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

function fuelLabel(pct){if(pct>=100)return"Plein";if(pct>=75)return"3/4";if(pct>=50)return"1/2";if(pct>=25)return"1/4";return"Réserve";}
function fuelColor(pct){if(pct>=60)return"#16a34a";if(pct>=30)return"#d97706";return"#dc2626";}

/** Échappe les caractères HTML spéciaux pour prévenir les injections XSS dans les PDF générés */
function escHtml(str){
  if(str==null)return"";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#x27;");
}

function dlPDF(html){
  const win=window.open('','_blank');
  if(!win){alert("Autorisez les popups");return;}
  win.document.write(html);win.document.close();win.focus();
  setTimeout(()=>win.print(),600);
}

function buildContratHTML(contrat,vehicle,sigL,sigLoc,profil){
  const nb=contrat.nbJours||1,total=contrat.totalCalc||0,pm=contrat.paiement;
  const frais=vehicle.frais||DEF_FRAIS,clauses=vehicle.clauses||DEF_CLAUSES;
  const fraisRows=frais.map(f=>"<tr><td>"+escHtml(f.label)+"</td><td style='text-align:right;font-weight:bold'>"+escHtml(f.montant)+" EUR</td></tr>").join("");
  const clausesHtml=clauses.map((c,i)=>"<div class='cl'><span class='cl-t'>"+(i+1)+". "+escHtml(c.titre)+"</span><br>"+escHtml(c.texte)+"</div>").join("");
  const sL=sigL?"<img src='"+sigL+"' style='max-width:160px;height:60px;display:block;margin:0 auto;border-bottom:1px solid #333'>":"<div style='border-bottom:1px solid #333;height:60px;width:160px;margin:0 auto'></div>";
  const sLoc=sigLoc?"<img src='"+sigLoc+"' style='max-width:160px;height:60px;display:block;margin:0 auto;border-bottom:1px solid #333'>":"<div style='border-bottom:1px solid #333;height:60px;width:160px;margin:0 auto'></div>";
  const fuelPct=contrat.carburantDepart||0;
  const fuelBar="<div style='margin:4px 0'><span style='font-size:10px;color:#555'>Carburant depart : </span><span style='font-weight:bold'>"+fuelPct+"% — "+fuelLabel(fuelPct)+"</span></div>";
  const cautionMode=contrat.cautionMode==="especes"?"Especes":contrat.cautionMode==="virement"?"Virement bancaire":contrat.cautionMode==="emprunt"?"Emprunt bancaire":contrat.cautionMode==="cb"?"Carte bancaire":contrat.cautionMode==="cheque"?"Cheque":"Autre";
  const photosDepart=contrat.photosDepart||[];
  const photosHtml=photosDepart.length>0?"<div style='display:flex;flex-wrap:wrap;gap:6px;margin-top:6px'>"+photosDepart.map(p=>"<img src='"+p.data+"' style='width:120px;height:90px;object-fit:cover;border-radius:6px'>").join("")+"</div>":"";
  const dl=contrat.docsLocataire||{};
  let docsLocHtml="";
  if(dl.cniRecto||dl.cniVerso||dl.justifDom||dl.photoAr){
    docsLocHtml="<div style='margin-top:8px;padding:8px;background:#f8fafc;border-radius:6px'><div style='font-size:10px;font-weight:bold;color:#0a1940;margin-bottom:6px'>Pieces jointes locataire</div><div style='display:flex;flex-wrap:wrap;gap:8px'>";
    if(dl.cniRecto)docsLocHtml+="<div style='text-align:center'><div style='font-size:10px;font-weight:bold;color:#0a1940;margin-bottom:3px'>CNI Recto</div><img src='"+dl.cniRecto+"' style='width:150px;height:110px;object-fit:contain;border-radius:6px;border:1px solid #ddd;background:#f8fafc'></div>";
    if(dl.cniVerso)docsLocHtml+="<div style='text-align:center'><div style='font-size:10px;font-weight:bold;color:#0a1940;margin-bottom:3px'>CNI Verso</div><img src='"+dl.cniVerso+"' style='width:150px;height:110px;object-fit:contain;border-radius:6px;border:1px solid #ddd;background:#f8fafc'></div>";
    if(dl.justifDom)docsLocHtml+="<div style='text-align:center'><div style='font-size:10px;font-weight:bold;color:#0a1940;margin-bottom:3px'>Justif. domicile</div><img src='"+dl.justifDom+"' style='width:150px;height:110px;object-fit:contain;border-radius:6px;border:1px solid #ddd;background:#f8fafc'></div>";
    if(dl.photoAr)docsLocHtml+="<div style='text-align:center'><div style='font-size:10px;font-weight:bold;color:#0a1940;margin-bottom:3px'>Photo locataire</div><img src='"+dl.photoAr+"' style='width:150px;height:110px;object-fit:contain;border-radius:6px;border:1px solid #ddd;background:#f8fafc'></div>";
    docsLocHtml+="</div></div>";
  }
  const remise=parseFloat(contrat.remise)||0;
  const accompte=parseFloat(contrat.accompte)||0;
  const resteAPayer=parseFloat(contrat.resteAPayer)||Math.max(0,total-accompte);
  const kmInclusParJour=contrat.kmInclus||0;
  const kmInclus=kmInclusParJour*(contrat.nbJours||1);
  const prixKmSup=contrat.prixKmSup;
  const ext=contrat.exterieurPropre;
  const intr=contrat.interieurPropre;
  const etatHtml="<div style='display:flex;gap:12px;margin-top:4px'>"
    +"<div><span style='font-size:10px;color:#555'>Exterieur : </span><span style='font-weight:bold'>"+(ext===true?"Propre":ext===false?"Sale":"N/A")+"</span></div>"
    +"<div><span style='font-size:10px;color:#555'>Interieur : </span><span style='font-weight:bold'>"+(intr===true?"Propre":intr===false?"Sale":"N/A")+"</span></div>"
    +"</div>";
  const loc2=((contrat.loc2Prenom||"")+" "+(contrat.loc2Nom||"")).trim();
  const CG_ARTICLES=[
    {n:1,t:"Objet et champ d'application",x:"Le present contrat regit les conditions dans lesquelles le loueur met temporairement a disposition du locataire le vehicule designe ci-dessus. La location est consentie a titre strictement personnel, temporaire et non transmissible. Toute sous-location, pret, cession ou mise a disposition a un tiers non autorise par ecrit entraine la resiliation immediate et automatique du contrat aux torts exclusifs du locataire, sans remboursement d'aucune somme versee, et sans prejudice de toutes actions en dommages et interets."},
    {n:2,t:"Conditions d'acces, conducteurs autorises et controle d'identite",x:"Le locataire et tout conducteur autorise doivent : avoir l'age minimum exige, etre titulaires d'un permis de conduire valide correspondant a la categorie du vehicule, presenter une piece d'identite valide et fournir des informations exactes et completes. Seul le locataire designe est autorise a conduire le vehicule. L'ajout d'un conducteur supplementaire est possible uniquement avec l'accord ecrit prealable du loueur ; le conducteur ajoute doit satisfaire aux memes conditions d'acces. Toute conduite par un tiers non expressement autorise par ecrit est strictement interdite. Toute declaration inexacte ou document falsifie entraine la nullite totale des garanties d'assurance et engage la responsabilite financiere integrale du locataire."},
    {n:3,t:"Usage autorise et interdictions absolues",x:"Le locataire s'engage a utiliser le vehicule avec diligence et prudence, conformement a sa destination normale. Sont strictement interdits : transport remunere de personnes ou marchandises, participation a toute competition ou rallye, circulation hors voies carrossables, conduite sous emprise d'alcool ou de stupefiants, tout usage illegal ou contraire a l'ordre public. Tout usage non conforme engage la pleine responsabilite du locataire, y compris la nullite des garanties d'assurance."},
    {n:4,t:"Etat des lieux et degradations",x:"Un etat des lieux contradictoire est realise au depart et au retour avec photographies et signatures des deux parties. A defaut de reserves emises au moment de la remise du vehicule, celui-ci est repute conforme, propre et en parfait etat de marche. Toute degradation constatee au retour sera retenue sur le depot de garantie selon le tableau des frais deductibles. Les frais excedant le montant du depot seront integralement factures au locataire."},
    {n:5,t:"Assurance, responsabilite civile et sinistres",x:"Le vehicule beneficie au minimum d'une assurance responsabilite civile obligatoire couvrant les dommages causes aux tiers. En cas de sinistre dont la responsabilite du locataire est engagee, ou en cas d'accident sans tiers identifie, le locataire reste redevable de la franchise contractuelle, des frais de gestion, des dommages non couverts, des pertes d'exploitation dues a l'immobilisation du vehicule, et de la perte de valeur residuelle. En cas d'accident grave (RSV), la responsabilite financiere du locataire est pleinement engagee selon le tableau des frais deductibles. Les garanties sont inapplicables en cas de conduite sous influence, fausse declaration, conducteur non autorise ou usage prohibe. Tout sinistre doit etre declare au loueur dans les plus brefs delais avec constat amiable signe."},
    {n:6,t:"Infractions routieres et frais de gestion",x:"Le locataire est exclusivement et personnellement responsable de toutes contraventions, peages, stationnements abusifs et infractions commises pendant la duree de la location. Il autorise expressement le loueur a transmettre ses coordonnees completes aux autorites competentes, a regler les amendes pour son compte et a y ajouter des frais de gestion par dossier (voir tableau des frais deductibles). Toute mise en fourriere est aux frais exclusifs du locataire."},
    {n:7,t:"Depot de garantie et prelevement",x:"Le depot de garantie obligatoire permet au loueur de proceder sans delai aux prélèvements suivants : dommages constates, franchises, frais administratifs, pertes d'exploitation, carburant manquant, depassements kilometriques, retard de restitution, frais de nettoyage, amendes et tout solde restant du. L'ensemble des montants applicables figure dans le tableau des frais deductibles en page precedente. La restitution du solde s'effectue dans un delai raisonnable sauf contestation necessitant une expertise contradictoire."},
    {n:8,t:"Restitution, carburant et penalites d'immobilisation",x:"Le vehicule doit etre restitue a la date, heure et lieu convenus, dans un etat identique a celui du depart (hors usure normale), avec le meme niveau de carburant et une proprete interieure et exterieure assuree. Le carburant manquant sera facture selon le tableau des frais deductibles. Tout retard de restitution est facture au tarif journalier en vigueur. Toute immobilisation du vehicule causee par une faute du locataire entraine une facturation journaliere jusqu'a la remise en etat complete (voir tableau des frais deductibles)."},
    {n:9,t:"Interdictions specifiques — territoire et tabac",x:"Le vehicule ne peut etre utilise que sur le territoire francais metropolitain, sauf accord ecrit du loueur. Toute sortie non autorisee engage la responsabilite integrale du locataire (voir tableau des frais deductibles). Le vehicule est strictement non-fumeur : toute odeur ou trace de tabac constatee au retour entraine l'application du forfait tabac figure dans le tableau des frais deductibles. Le vehicule doit etre rendu propre interieurement et exterieurement, faute de quoi les frais de nettoyage correspondants seront retenus."},
    {n:10,t:"Donnees personnelles — RGPD",x:"Les donnees personnelles collectees servent exclusivement a l'execution du present contrat, a la gestion des sinistres, infractions et paiements, ainsi qu'au respect des obligations legales. Elles sont conservees pendant toute la duree de prescription legale applicable, ou plus longtemps en cas de procedure judiciaire. Conformement au RGPD, le locataire dispose d'un droit d'acces, de rectification, d'effacement et de portabilite de ses donnees, exercable par demande ecrite aupres du loueur."},
    {n:11,t:"Resiliation et manquements",x:"Le loueur peut resilier immediatement et unilateralement le present contrat en cas de non-respect de l'une quelconque des obligations, de fausse declaration, de non-paiement, ou d'usage prohibe. En cas de resiliation aux torts du locataire, aucune somme versee ne sera remboursee ; le depot de garantie sera conserve et les frais excedentaires factures. En dehors de tout litige, la resiliation peut intervenir avec un preavis raisonnable, ou selon les conditions expressement prevues au contrat."},
    {n:12,t:"Droit applicable et reglement des litiges",x:"Le present contrat est regi exclusivement par le droit francais. En cas de differend, les parties s'engagent a rechercher une resolution amiable pendant un delai de 30 jours a compter de la mise en demeure. A defaut d'accord, les tribunaux competents du lieu d'etablissement du loueur seront seuls competents, sous reserve des dispositions imperatives de protection du consommateur."},
  ];
  const cgHtml=CG_ARTICLES.map(a=>"<div class='cg'><span class='cg-t'>Art. "+a.n+" — "+escHtml(a.t)+"</span><br>"+escHtml(a.x)+"</div>").join("");
  return["<!DOCTYPE html><html><head><meta charset='utf-8'><title>Contrat "+escHtml(contrat.locNom)+"</title>",
    "<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#111}",
    ".header{background:#0a1940;color:#fff;padding:14px 20px;text-align:center}.header h1{font-size:22px;letter-spacing:2px;margin-bottom:4px}.header p{font-size:9px;opacity:.8;margin:2px 0}",
    ".body{padding:14px 20px}.title{text-align:center;font-size:14px;font-weight:bold;margin:10px 0 6px;text-transform:uppercase;border-bottom:2px solid #0a1940;padding-bottom:6px}",
    ".st{font-size:11px;font-weight:bold;background:#e8edf5;padding:4px 8px;margin-bottom:5px;border-left:3px solid #0a1940}",
    ".lbl{color:#555;font-size:10px}.val{font-weight:bold}",
    "hr{border:none;border-top:1px solid #ccc;margin:8px 0}table.ft{width:100%;border-collapse:collapse;font-size:10px;margin-top:5px}",
    "table.ft td{border:1px solid #ddd;padding:3px 6px}",
    ".cl{font-size:9.5px;margin-bottom:5px;line-height:1.4}.cl-t{font-weight:bold;font-size:10px}",
    ".cg{font-size:8.5px;margin-bottom:4px;line-height:1.4;color:#333}.cg-t{font-weight:bold;font-size:9px;color:#0a1940}",
    ".sig-area{display:flex;justify-content:space-between;margin-top:16px;gap:30px}.sig-box{flex:1;text-align:center}.sig-box p{font-size:10px;font-weight:bold;margin-bottom:6px}",
    ".tot{background:#0a1940;color:#fff;padding:8px 14px;border-radius:6px;margin:8px 0;display:flex;justify-content:space-between;align-items:center}",
    ".row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0}",
    "@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>",
    // EN-TÊTE LOUEUR
    "<div class='header'>",
    "<h1>"+escHtml(profil.entreprise||"MAN'S LOCATION")+"</h1>",
    "<p>SIRET : "+escHtml(profil.siret||profil.siren||"—")+" | Tel : "+escHtml(profil.tel||"—")+(profil.email?" | "+escHtml(profil.email):"")+"</p>",
    "<p>"+escHtml(profil.adresse||"")+(profil.ville?", "+escHtml(profil.ville):"")+"</p>",
    "</div>",
    "<div class='body'>",
    "<div class='title'>Contrat de Location de Vehicule</div>",
    // PARTIES
    "<div style='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px'>",
    // LOUEUR
    "<div><div class='st'>Loueur</div>",
    "<div><span class='lbl'>Societe : </span><span class='val'>"+escHtml(profil.entreprise||"—")+"</span></div>",
    "<div><span class='lbl'>Representant : </span><span class='val'>"+escHtml(profil.nom||"—")+"</span></div>",
    "<div><span class='lbl'>SIRET : </span><span class='val'>"+escHtml(profil.siret||profil.siren||"—")+"</span></div>",
    "<div><span class='lbl'>Adresse : </span><span class='val'>"+escHtml(profil.adresse||"—")+(profil.ville?", "+escHtml(profil.ville):"")+"</span></div>",
    "<div><span class='lbl'>Tel : </span><span class='val'>"+escHtml(profil.tel||"—")+"</span></div>",
    "</div>",
    // LOCATAIRE
    "<div><div class='st'>Locataire</div>",
    "<div><span class='lbl'>Nom : </span><span class='val'>"+escHtml(contrat.locNom||"—").toUpperCase()+"</span></div>",
    (contrat.locEntreprise?"<div><span class='lbl'>Entreprise : </span><span class='val'>"+escHtml(contrat.locEntreprise)+"</span></div>":""),
    "<div><span class='lbl'>Adresse : </span><span class='val'>"+escHtml(contrat.locAdresse||"—")+"</span></div>",
    ((contrat.locCodePostal||contrat.locVille)?"<div><span class='lbl'>CP / Ville : </span><span class='val'>"+escHtml((contrat.locCodePostal||"")+" "+(contrat.locVille||"")).trim()+"</span></div>":""),
    "<div><span class='lbl'>Tel : </span><span class='val'>"+escHtml(contrat.locTel||"—")+"</span></div>",
    (contrat.locEmail?"<div><span class='lbl'>Email : </span><span class='val'>"+escHtml(contrat.locEmail)+"</span></div>":""),
    (contrat.locPermis?"<div><span class='lbl'>N° Permis : </span><span class='val'>"+escHtml(contrat.locPermis)+"</span></div>":""),
    (loc2?"<div style='margin-top:4px;padding:4px 6px;background:#fef9c3;border-radius:4px;font-size:10px'><b>2eme conducteur :</b> "+escHtml(loc2)+"</div>":""),
    docsLocHtml,
    "</div>",
    "</div><hr>",
    // VEHICULE
    "<div style='margin-bottom:8px'><div class='st'>Vehicule — Objet du contrat</div>",
    "<div style='display:grid;grid-template-columns:1fr 1fr;gap:2px'>",
    "<div><span class='lbl'>Marque/Modele : </span><span class='val'>"+escHtml(vehicle.marque||"")+" "+escHtml(vehicle.modele||"")+"</span></div>",
    "<div><span class='lbl'>Immatriculation : </span><span class='val'>"+escHtml(vehicle.immat||contrat.immat||"—")+"</span></div>",
    (vehicle.couleur?"<div><span class='lbl'>Couleur : </span><span class='val'>"+escHtml(vehicle.couleur)+"</span></div>":""),
    (vehicle.annee?"<div><span class='lbl'>Annee : </span><span class='val'>"+escHtml(vehicle.annee)+"</span></div>":""),
    (vehicle.vin?"<div><span class='lbl'>VIN : </span><span class='val'>"+escHtml(vehicle.vin)+"</span></div>":""),
    "<div><span class='lbl'>Km depart : </span><span class='val'>"+escHtml(String(contrat.kmDepart||vehicle.km||"—"))+" km</span></div>",
    "</div>",
    fuelBar,etatHtml,photosHtml,"</div><hr>",
    // PÉRIODE + LIEU
    "<div style='margin-bottom:8px'><div class='st'>Periode de location et lieu</div>",
    "<div><span class='lbl'>Lieu de prise en charge : </span><span class='val'>"+escHtml(profil.adresse||"—")+(profil.ville?", "+escHtml(profil.ville):"")+"</span></div>",
    "<div><span class='lbl'>Depart : </span><span class='val'>"+escHtml(contrat.dateDebut||"—")+" a "+escHtml(contrat.heureDebut||"—")+"</span></div>",
    "<div><span class='lbl'>Lieu de restitution : </span><span class='val'>"+escHtml(profil.adresse||"—")+(profil.ville?", "+escHtml(profil.ville):"")+"</span></div>",
    "<div><span class='lbl'>Retour prevu : </span><span class='val'>"+escHtml(contrat.dateFin||"—")+" a "+escHtml(contrat.heureFin||"—")+"</span> — <span class='val'>"+nb+" jour(s)</span></div>",
    "</div><hr>",
    // PAIEMENT + FINANCES
    "<div style='margin-bottom:8px'><div class='st'>Conditions financieres</div>",
    (contrat.tarifLabel?"<div><span class='lbl'>Tarif : </span><span class='val'>"+escHtml(contrat.tarifLabel)+"</span></div>":""),
    ((kmInclus&&!contrat.kmIllimite)?"<div><span class='lbl'>Km inclus : </span><span class='val'>"+escHtml(String(kmInclus))+" km total ("+escHtml(String(kmInclusParJour))+" km/j × "+escHtml(String(contrat.nbJours||1))+" j)</span></div>":""),
    (contrat.kmIllimite?"<div><span class='lbl'>Kilometrage : </span><span class='val'>Illimite</span></div>":""),
    ((prixKmSup&&!contrat.kmIllimite)?"<div><span class='lbl'>Prix km sup : </span><span class='val'>"+escHtml(String(prixKmSup))+" EUR/km</span></div>":""),
    "<div class='row' style='margin-top:6px'><span>Montant location</span><span style='font-weight:bold'>"+total+" EUR</span></div>",
    (remise>0?"<div class='row'><span>Remise</span><span style='font-weight:bold;color:#16a34a'>- "+remise+" EUR</span></div>":""),
    "<div class='tot'><span>Total net</span><strong>"+(total)+" EUR</strong></div>",
    (accompte>0?"<div class='row'><span>Accompte verse</span><span style='font-weight:bold;color:#2563eb'>- "+accompte+" EUR</span></div>":""),
    (accompte>0?"<div class='row' style='font-size:12px;font-weight:bold;border-top:1px solid #ccc;padding-top:4px;margin-top:4px'><span>Reste a payer</span><span style='color:#dc2626'>"+resteAPayer+" EUR</span></div>":""),
    "<div style='margin-top:6px'>["+(pm==="especes"?"X":" ")+"] Especes ["+(pm==="cb"?"X":" ")+"] CB ["+(pm==="virement"?"X":" ")+"] Virement ["+(pm==="cheque"?"X":" ")+"] Cheque</div>",
    "</div><hr>",
    // CAUTION + ASSURANCE
    "<div style='display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px'>",
    "<div><div class='st'>Caution / Depot de garantie</div>",
    "<div><span class='lbl'>Montant : </span><span class='val'>"+escHtml(String(vehicle.caution||"—"))+" EUR</span></div>",
    "<div><span class='lbl'>Mode : </span><span class='val'>"+escHtml(cautionMode)+"</span></div>",
    "<table class='ft' style='margin-top:6px'><tr style='background:#e8edf5;font-weight:bold'><td colspan='2'>Frais deductibles</td></tr>"+fraisRows+"</table>",
    "</div>",
    "<div><div class='st'>Assurance</div>",
    "<div style='font-size:10px;line-height:1.5'>",
    "<div>&#10003; Responsabilite civile obligatoire souscrite</div>",
    "<div><span class='lbl'>Franchise en cas de sinistre :</span><br><span style='font-weight:bold;color:#dc2626'>Montant de la caution retenue selon responsabilite</span></div>",
    "<div style='margin-top:4px;font-size:9px;color:#555'>Le locataire est tenu de signaler tout sinistre dans les plus brefs delais au loueur, avec constat amiable signe le cas echeant.</div>",
    "</div></div>",
    "</div><hr>",
    // CONDITIONS PARTICULIERES (clauses vehicule)
    "<div style='margin-bottom:8px'><div class='st'>Conditions particulieres</div>"+clausesHtml+"</div>",
    // CONDITIONS GENERALES DE LOCATION
    "<div style='margin-bottom:8px;page-break-before:always'><div class='st'>Conditions generales de location</div>",
    "<div style='font-size:8px;color:#6b7280;margin-bottom:4px'>En signant ce contrat, le locataire reconnait avoir lu, compris et accepte sans reserve les conditions generales ci-dessous.</div>",
    cgHtml+"</div><hr>",
    // SIGNATURES
    "<p style='font-size:10px;margin-bottom:6px'>Lu et approuve — Fait a "+escHtml(profil.ville||"—")+", le "+new Date().toLocaleDateString("fr-FR")+"</p>",
    "<div class='sig-area'>",
    "<div class='sig-box'><p>Loueur — "+escHtml(profil.nom||profil.entreprise||"—")+"</p>"+sL+"<p style='font-size:9px;margin-top:4px'>Signature + Cachet</p></div>",
    "<div class='sig-box'><p>Locataire — "+escHtml(contrat.locNom||"—")+"</p>"+sLoc+"<p style='font-size:9px;margin-top:4px'>Bon pour accord, lu et approuve</p></div>",
    "</div>",
    "</div></body></html>"].join("");
}

function buildPVRetourHTML(contrat,vehicle,retourData,sigLoueur,sigLocataire,profil){
  const d=retourData,caution=vehicle?.caution||0;
  const total=(contrat.totalCalc||0)+(d.surplusKm||0)+(d.montantRetenu||0);
  const fBar=pct=>"<div style='background:#e5e7eb;border-radius:99px;height:8px;width:120px;display:inline-block;vertical-align:middle;overflow:hidden;margin-left:6px'><div style='width:"+pct+"%;background:"+fuelColor(pct)+";height:100%'></div></div>";
  const carroNOK=CARRO_ELEMENTS.filter(e=>d.carro&&d.carro[e.id]===false);
  const carroRows=carroNOK.length>0?carroNOK.map(e=>"<tr><td>"+e.label+"</td><td style='color:#dc2626;font-weight:700'>Degat</td><td>"+(d.carroNotes&&d.carroNotes[e.id]?d.carroNotes[e.id]:"-")+"</td>"+(d.carroPhotos&&d.carroPhotos[e.id]?"<td><img src='"+d.carroPhotos[e.id]+"' style='width:80px;height:60px;object-fit:cover;border-radius:4px'></td>":"<td>-</td>")+"</tr>").join(""):"<tr><td colspan='4' style='color:#16a34a;font-weight:600;text-align:center'>Aucun degat</td></tr>";
  const checksRows=RETOUR_CHECKS.map(c=>{const val=d.checks&&d.checks[c.id];return"<tr><td>"+c.icon+" "+c.label+"</td><td style='font-weight:700;color:"+(val===true?"#16a34a":val===false?"#dc2626":"#6b7280")+"'>"+(val===true?"OK":val===false?"NON":"?")+"</td><td>"+(d.notes&&d.notes[c.id]?d.notes[c.id]:"-")+"</td></tr>";}).join("");
  const sL=sigLoueur?"<img src='"+sigLoueur+"' style='max-width:160px;height:60px;display:block;margin:0 auto;border-bottom:1px solid #333'>":"<div style='border-bottom:1px solid #333;height:60px;width:160px;margin:0 auto'></div>";
  const sLoc=sigLocataire?"<img src='"+sigLocataire+"' style='max-width:160px;height:60px;display:block;margin:0 auto;border-bottom:1px solid #333'>":"<div style='border-bottom:1px solid #333;height:60px;width:160px;margin:0 auto'></div>";
  const kmParcourus=d.kmRetour?parseFloat(d.kmRetour)-parseFloat(contrat.kmDepart||vehicle?.km||0):null;
  return`<!DOCTYPE html><html><head><meta charset='utf-8'><title>PV Retour - ${contrat.locNom}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#111}
.hd{background:#0a1940;color:#fff;padding:14px 20px;text-align:center}.hd h1{font-size:20px;letter-spacing:2px;margin-bottom:4px}
.bd{padding:14px 20px}.title{text-align:center;font-size:15px;font-weight:bold;margin:10px 0 8px;text-transform:uppercase;border-bottom:3px solid #dc2626;padding-bottom:6px;color:#0a1940}
.st{font-size:11px;font-weight:bold;background:#e8edf5;padding:4px 8px;margin-bottom:6px;border-left:3px solid #0a1940}
.lbl{color:#555;font-size:10px}.val{font-weight:bold}hr{border:none;border-top:1px solid #ccc;margin:8px 0}
table{width:100%;border-collapse:collapse;font-size:10px;margin-top:5px}table td,table th{border:1px solid #ddd;padding:4px 7px}
table th{background:#e8edf5;font-weight:700}
.bilan{background:#0a1940;color:#fff;padding:10px 14px;border-radius:8px;margin:10px 0}
.br{display:flex;justify-content:space-between;font-size:12px;padding:3px 0}
.sig-area{display:flex;justify-content:space-between;margin-top:16px;gap:30px}.sig-box{flex:1;text-align:center}.sig-box p{font-size:10px;font-weight:bold;margin-bottom:6px}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
<div class='hd'><h1>${profil.entreprise||"MAN'S LOCATION"}</h1><p>SIRET : ${profil.siret||profil.siren} | Tel : ${profil.tel}</p></div>
<div class='bd'><div class='title'>Proces-Verbal de Retour</div>
<div style='margin-bottom:10px'><div class='st'>Véhicule & Dates</div>
  <div><span class='lbl'>Vehicule : </span><span class='val'>${vehicle?.marque||""} ${vehicle?.modele||""} - ${vehicle?.immat||""}</span></div>
  <div><span class='lbl'>Depart : </span><span class='val'>${contrat.dateDebut}</span> — <span class='lbl'>Retour : </span><span class='val'>${new Date(d.date||Date.now()).toLocaleDateString("fr-FR")}</span></div>
</div>
<div style='margin-bottom:10px'><div class='st'>Kilometrage & Carburant</div>
  <table><tr><th>Indicateur</th><th>Depart</th><th>Retour</th><th>Ecart</th></tr>
  <tr><td>Kilometrage</td><td>${contrat.kmDepart||vehicle?.km||"?"} km</td><td><b>${d.kmRetour||"?"} km</b></td><td>${kmParcourus!==null?kmParcourus+" km":"?"}</td></tr>
  <tr><td>Carburant</td><td>${contrat.carburantDepart||100}% ${fBar(contrat.carburantDepart||100)}</td><td>${d.carburantRetour||0}% ${fBar(d.carburantRetour||0)}</td><td>${(d.carburantRetour||0)<(contrat.carburantDepart||100)?"Manquant":"OK"}</td></tr></table>
</div>
<div style='margin-bottom:10px'><div class='st'>Etat general</div><table><tr><th>Verification</th><th>Etat</th><th>Observation</th></tr>${checksRows}</table></div>
<div style='margin-bottom:10px'><div class='st'>Carrosserie</div><table><tr><th>Element</th><th>Etat</th><th>Description</th><th>Photo</th></tr>${carroRows}</table></div>
<div style='margin-bottom:10px'><div class='st'>Caution - ${caution} EUR</div>
  ${d.cautionRestituee?"<div style='color:#16a34a;font-weight:700'>Restituee : "+caution+" EUR</div>":"<div style='color:#dc2626;font-weight:700'>Retenue : "+d.montantRetenu+" EUR"+(d.raisonRetenue?" ("+d.raisonRetenue+")":"")+"</div><div>Rembourse : "+Math.max(0,caution-(d.montantRetenu||0))+" EUR</div>"}
</div>
<div class='bilan'>
  <div style='font-weight:800;font-size:13px;margin-bottom:8px'>Bilan financier</div>
  <div class='br'><span>Location</span><span>${contrat.totalCalc||0} EUR</span></div>
  ${(d.surplusKm||0)>0?"<div class='br'><span>Km sup</span><span>+"+((d.surplusKm||0).toFixed(2))+" EUR</span></div>":""}
  ${(d.montantRetenu||0)>0?"<div class='br'><span>Retenue</span><span>+"+d.montantRetenu+" EUR</span></div>":""}
  <div class='br' style='border-top:1px solid rgba(255,255,255,.2);margin-top:4px;padding-top:6px'><span style='font-weight:800'>Total</span><span style='font-size:16px;font-weight:900;color:#4ade80'>${total.toFixed(2)} EUR</span></div>
</div>
<hr><p style='font-size:10px;margin-bottom:14px'>Fait a ${profil.ville}, le ${new Date().toLocaleDateString("fr-FR")}</p>
<div class='sig-area'><div class='sig-box'><p>Loueur (${profil.nom})</p>${sL}</div><div class='sig-box'><p>Locataire (${contrat.locNom})</p>${sLoc}</div></div>
</div></body></html>`;
}

// ─── STYLES GLOBAUX ────────────────────────────────────────────────────────────
const LBL_STYLE={fontSize:11,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3};
const INP_STYLE=(extra={})=>({width:"100%",border:"1px solid #d1d5db",borderRadius:8,padding:"7px 10px",fontSize:12,boxSizing:"border-box",...extra});

// ─── COMPOSANTS ────────────────────────────────────────────────────────────────
function F({k,label,type,span2,form,setForm,touched,setTouched,req}){
  const inv=touched[k]&&!form[k];
  return (
    <div style={span2?{gridColumn:"span 2"}:{}}>
      <label style={LBL_STYLE}>{label}</label>
      <input type={type||"text"} placeholder={label} style={INP_STYLE(inv?{borderColor:"#f87171",background:"#fef2f2"}:{})} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} onBlur={()=>{if(req.includes(k))setTouched(t=>({...t,[k]:true}));}}/>
      {inv&&<p style={{color:"#ef4444",fontSize:10,marginTop:2}}>Obligatoire</p>}
    </div>
  );
}

function CheckBool({label,icon,val,onChange}){
  return (
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
  return (
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
  return (
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
  return (
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
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:12}}>
        {labels.map(lb=>(
          <div key={lb} style={{display:"flex",flexDirection:"column",gap:4}}>
            <div style={{fontSize:10,fontWeight:600,color:"#6b7280",textAlign:"center"}}>{lb}</div>
            <button onClick={()=>pickFile(lb)} style={{background:"#1e3a8a",color:"white",borderRadius:8,padding:"6px 0",fontSize:10,fontWeight:700,cursor:"pointer",border:"none"}}>📁</button>
            <button onClick={()=>pickCamera(lb)} style={{background:"#7c3aed",color:"white",border:"none",borderRadius:8,padding:"5px 0",fontSize:10,fontWeight:700,cursor:"pointer"}}>📷</button>
          </div>
        ))}
      </div>
      {photos.length>0
        ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:8}}>
          {photos.map(p=>(
            <div key={p.id} style={{position:"relative",borderRadius:9,overflow:"hidden",border:"2px solid #e5e7eb"}}>
              <img src={p.data} alt={p.label} style={{width:"100%",height:80,objectFit:"cover",display:"block"}}/>
              <div style={{background:"rgba(0,0,0,.55)",color:"white",fontSize:9,fontWeight:600,padding:"2px 5px",position:"absolute",bottom:0,left:0,right:0,textAlign:"center"}}>{p.label}</div>
              <button onClick={()=>removePhoto(p.id)} style={{position:"absolute",top:3,right:3,background:"#ef4444",color:"white",border:"none",borderRadius:"50%",width:18,height:18,fontSize:11,cursor:"pointer",fontWeight:700,lineHeight:"18px",textAlign:"center",padding:0}}>x</button>
            </div>
          ))}
        </div>
        :<div style={{textAlign:"center",color:"#9ca3af",fontSize:12,padding:12,background:"#f9fafb",borderRadius:8,border:"1px dashed #d1d5db"}}>Aucune photo</div>}
    </div>
  );
}

function PhotosVehicule({photos,setPhotos,max=5}){
  function addPhoto(file){if(!file)return;if(photos.length>=max){alert("Maximum "+max+" photos");return;}const r=new FileReader();r.onload=ev=>setPhotos(p=>[...p,{id:Date.now(),data:ev.target.result,name:file.name}]);r.readAsDataURL(file);}
  function pickFile(){const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>addPhoto(e.target.files[0]);i.click();}
  function pickCamera(){const i=document.createElement("input");i.type="file";i.accept="image/*";i.capture="environment";i.onchange=e=>addPhoto(e.target.files[0]);i.click();}
  function remove(id){setPhotos(p=>p.filter(x=>x.id!==id));}
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:10}}>
        <button onClick={pickFile} disabled={photos.length>=max} style={{flex:1,padding:"8px 0",background:"#1e3a8a",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",opacity:photos.length>=max?.5:1}}>📁 Galerie</button>
        <button onClick={pickCamera} disabled={photos.length>=max} style={{flex:1,padding:"8px 0",background:"#7c3aed",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",opacity:photos.length>=max?.5:1}}>📷 Photo</button>
        <span style={{fontSize:11,color:"#9ca3af",alignSelf:"center"}}>{photos.length}/{max}</span>
      </div>
      {photos.length>0
        ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(90px,1fr))",gap:7}}>
          {photos.map((p,i)=>(
            <div key={p.id} style={{position:"relative",borderRadius:8,overflow:"hidden",border:"2px solid #e5e7eb"}}>
              <img src={p.data} alt="" style={{width:"100%",height:75,objectFit:"cover",display:"block"}}/>
              {i===0&&<div style={{position:"absolute",top:3,left:3,background:"#2563eb",color:"white",fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:4}}>COUV</div>}
              <button onClick={()=>remove(p.id)} style={{position:"absolute",top:3,right:3,background:"#ef4444",color:"white",border:"none",borderRadius:"50%",width:16,height:16,fontSize:10,cursor:"pointer",fontWeight:700,lineHeight:"16px",textAlign:"center",padding:0}}>x</button>
            </div>
          ))}
        </div>
        :<div style={{textAlign:"center",color:"#9ca3af",fontSize:11,padding:10,background:"#f9fafb",borderRadius:8,border:"1px dashed #d1d5db"}}>Aucune photo</div>}
    </div>
  );
}

function PhotosVehiculeModal({vehicle,onClose,onSave}){
  const[photos,setPhotos]=useState((vehicle.photosVehicule||[]).map(p=>({...p})));
  return (
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
  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {ITEMS.map(({key,label,color,icon})=>(
        <div key={key} style={{borderRadius:10,border:`2px solid ${docs[key]?color:"#e5e7eb"}`,background:docs[key]?"#f8fafc":"white",overflow:"hidden"}}>
          <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>{icon}</span>
            <span style={{flex:1,fontWeight:600,fontSize:12,color:docs[key]?color:"#374151"}}>{label}</span>
            {docs[key]
              ?<button onClick={()=>removeImg(key)} style={{padding:"3px 8px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>Retirer</button>
              :<div style={{display:"flex",gap:6}}>
                <button onClick={()=>pickImg(key,false)} style={{padding:"5px 10px",background:"#1e3a8a",color:"white",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>📁</button>
                <button onClick={()=>pickImg(key,true)} style={{padding:"5px 10px",background:"#7c3aed",color:"white",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>📷</button>
              </div>}
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
    const msg="Bonjour, je souhaite louer le "+vehicle.marque+" "+vehicle.modele+" du "+form.dateDebut+" au "+form.dateFin+(nbJ?" ("+nbJ+"j)\n":"\n")+"Nom : "+form.prenom+" "+form.nom+"\nTel : "+form.tel;
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
      <button onClick={()=>{setOpen(true);setTab("resa");}} style={{flex:1,padding:"8px 0",background:"#1e3a8a",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>📅 Réserver</button>
      <button onClick={()=>{setOpen(true);setTab("question");}} style={{flex:1,padding:"8px 0",background:"#f1f5f9",color:"#374151",border:"1px solid #e5e7eb",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>❓ Question</button>
    </div>
  );
  return(
    <div style={{marginTop:8,background:"#f8fafc",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}>
      <div style={{display:"flex",gap:6,marginBottom:12}}>
        <button onClick={()=>setTab("resa")} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",cursor:"pointer",fontWeight:tab==="resa"?700:400,background:tab==="resa"?"#1e3a8a":"#e5e7eb",color:tab==="resa"?"white":"#374151",fontSize:12}}>📅 Réservation</button>
        <button onClick={()=>setTab("question")} style={{flex:1,padding:"7px 0",borderRadius:8,border:"none",cursor:"pointer",fontWeight:tab==="question"?700:400,background:tab==="question"?"#7c3aed":"#e5e7eb",color:tab==="question"?"white":"#374151",fontSize:12}}>❓ Question</button>
        <button onClick={()=>setOpen(false)} style={{padding:"7px 10px",borderRadius:8,border:"none",cursor:"pointer",background:"#fef2f2",color:"#ef4444",fontSize:12,fontWeight:700}}>✕</button>
      </div>
      {tab==="resa"&&(sent
        ?<div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:32,marginBottom:8}}>✅</div>
          <div style={{fontWeight:700,fontSize:14,color:"#16a34a",marginBottom:6}}>Demande envoyée !</div>
          <button onClick={()=>{setSent(false);setForm({prenom:"",nom:"",age:"",tel:"+33 ",email:"",dateDebut:"",dateFin:"",message:""});}} style={{padding:"8px 16px",background:"#e5e7eb",border:"none",borderRadius:8,fontSize:12,cursor:"pointer"}}>Nouvelle demande</button>
        </div>
        :<div style={{display:"flex",flexDirection:"column",gap:9}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <input placeholder="Prénom *" value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box"}}/>
            <input placeholder="Nom *" value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,boxSizing:"border-box"}}/>
          </div>
          <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Téléphone *</div><TelInput value={form.tel} onChange={v=>setForm(f=>({...f,tel:v}))} placeholder="06 12 34 56 78"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Début *</div><input type="date" value={form.dateDebut} onChange={e=>setForm(f=>({...f,dateDebut:e.target.value}))} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,width:"100%",boxSizing:"border-box"}}/></div>
            <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Fin *</div><input type="date" value={form.dateFin} onChange={e=>setForm(f=>({...f,dateFin:e.target.value}))} style={{padding:"8px 10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,width:"100%",boxSizing:"border-box"}}/></div>
          </div>
          <button onClick={()=>{if(!form.prenom||!form.nom||!form.tel||!form.dateDebut||!form.dateFin){alert("Champs * obligatoires");return;}sendWhatsApp();}} style={{width:"100%",padding:"10px 0",background:"#25D366",color:"white",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>💬 Envoyer sur WhatsApp</button>
        </div>)}
      {tab==="question"&&(qSent
        ?<div style={{textAlign:"center",padding:"16px 0"}}>
          <div style={{fontSize:32,marginBottom:8}}>✅</div>
          <div style={{fontWeight:700,fontSize:14,color:"#16a34a"}}>Question envoyée !</div>
          <button onClick={()=>setQSent(false)} style={{padding:"8px 16px",background:"#e5e7eb",border:"none",borderRadius:8,fontSize:12,cursor:"pointer",marginTop:8}}>Nouvelle question</button>
        </div>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>
          <textarea placeholder="Votre question..." value={question} onChange={e=>setQuestion(e.target.value)} rows={4} style={{padding:"10px",border:"1px solid #d1d5db",borderRadius:8,fontSize:13,resize:"none",fontFamily:"inherit"}}/>
          <button onClick={sendQuestion} style={{width:"100%",padding:"10px 0",background:"#7c3aed",color:"white",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Envoyer la question</button>
        </div>)}
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
  const[fraisSup,setFraisSup]=useState({carburantManquant:"",nettoyageInt:"",nettoyageExt:""});
  const totalFraisSup=(parseFloat(fraisSup.carburantManquant)||0)+(parseFloat(fraisSup.nettoyageInt)||0)+(parseFloat(fraisSup.nettoyageExt)||0);
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
  const kmInclus=parseFloat(contrat.kmInclus||vehicle?.kmInclus||0)*parseFloat(contrat.nbJours||1);
  const prixKmSup=parseFloat(vehicle?.prixKmSup||0);
  const kmSup=Math.max(0,kmParcourus-kmInclus);
  const surplusKm=kmSup*prixKmSup;
  const zones=[...new Set(CARRO_ELEMENTS.map(e=>e.zone))];
  const nbNOK=CARRO_ELEMENTS.filter(e=>carro[e.id]===false).length;
  const sym=(DEVISES.find(d=>d.code===(profil?.devise||"EUR"))||DEVISES[0]).symbol;
  const IS=INP_STYLE();
  function handlePhoto(id,file,setter){if(!file)return;const r=new FileReader();r.onload=ev=>setter(p=>({...p,[id]:ev.target.result}));r.readAsDataURL(file);}
  function pickFile(id,setter){const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>handlePhoto(id,e.target.files[0],setter);i.click();}
  function pickCamera(id,setter){const i=document.createElement("input");i.type="file";i.accept="image/*";i.capture="environment";i.onchange=e=>handlePhoto(id,e.target.files[0],setter);i.click();}
  function getRetourData(){return{checks,carro,carroPhotos,carroNotes,photos,notes,cautionRestituee,montantRetenu:retenu,raisonRetenue,rembourse:cautionRestituee?caution:Math.max(0,caution-retenu),kmRetour,kmSup,surplusKm,carburantRetour,fraisSup,totalFraisSup,date:new Date().toISOString(),sigRetourLoueur,sigRetourLocataire};}
  function downloadPV(){const data=getRetourData();dlPDF(buildPVRetourHTML(contrat,vehicle,data,sigRetourLoueur,sigRetourLocataire,profil));}
  function save(){if(cautionRestituee===null){alert("Précisez si la caution est restituée.");return;}const data=getRetourData();onSave(data);dlPDF(buildPVRetourHTML(contrat,vehicle,data,sigRetourLoueur,sigRetourLocataire,profil));}
  const TABS=[["km","Km"],["frais","Frais sup."],["carro","Carrosserie"],["checks","État"],["caution","Caution"],["sig","Signatures"]];
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
          {TABS.map(([id,lb])=><button key={id} onClick={()=>setTab(id)} style={{flexShrink:0,padding:"9px 10px",fontSize:10,fontWeight:tab===id?700:400,color:tab===id?"#2563eb":"#6b7280",background:"none",border:"none",borderBottom:tab===id?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}}>{lb}</button>)}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:14}}>
          {tab==="km"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Kilométrage</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Km au départ</div><div style={{padding:"8px 10px",background:"#f3f4f6",borderRadius:8,fontSize:14,fontWeight:700}}>{contrat.kmDepart||vehicle?.km||"—"} km</div></div>
                <div><div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Km au retour</div><input type="number" style={IS} placeholder="ex: 55350" value={kmRetour} onChange={e=>setKmRetour(e.target.value)}/></div>
              </div>
              {kmInclus>0&&!contrat.kmIllimite&&<div style={{fontSize:11,color:"#6b7280",marginBottom:4}}>Km autorisés : <b style={{color:"#1e3a8a"}}>{kmInclus} km</b> ({parseFloat(contrat.kmInclus||vehicle?.kmInclus||0)} km/j × {contrat.nbJours||1} j)</div>}
              {kmRetour&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                <div style={{background:"#eff6ff",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>Parcourus</div><div style={{fontWeight:800,fontSize:16,color:"#2563eb"}}>{kmParcourus} km</div></div>
                <div style={{background:kmSup>0?"#fef3c7":"#f0fdf4",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>Surplus</div><div style={{fontWeight:800,fontSize:16,color:kmSup>0?"#d97706":"#16a34a"}}>{kmSup} km</div></div>
                <div style={{background:surplusKm>0?"#fef2f2":"#f0fdf4",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>A facturer</div><div style={{fontWeight:800,fontSize:16,color:surplusKm>0?"#dc2626":"#16a34a"}}>{surplusKm.toFixed(2)} EUR</div></div>
              </div>}
            </div>
            <div style={{background:"white",borderRadius:12,padding:14,border:"1px solid #e5e7eb"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Carburant retour</div>
              <FuelGauge value={carburantRetour} onChange={setCarburantRetour}/>
            </div>
          </div>}
          {tab==="frais"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e5e7eb"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:22}}>🛢️</span>
                <div style={{fontWeight:700,fontSize:14,color:"#0a1940"}}>Frais de carburant</div>
              </div>
              <label style={LBL_STYLE}>Carburant manquant ({sym})</label>
              <input type="number" style={IS} placeholder="ex: 40" value={fraisSup.carburantManquant} onChange={e=>setFraisSup(f=>({...f,carburantManquant:e.target.value}))}/>
            </div>
            <div style={{background:"white",borderRadius:12,padding:16,border:"1px solid #e5e7eb"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:22}}>🧹</span>
                <div style={{fontWeight:700,fontSize:14,color:"#0a1940"}}>Frais de nettoyage</div>
              </div>
              <label style={LBL_STYLE}>Nettoyage intérieur ({sym})</label>
              <input type="number" style={{...IS,marginBottom:10}} placeholder="ex: 80" value={fraisSup.nettoyageInt} onChange={e=>setFraisSup(f=>({...f,nettoyageInt:e.target.value}))}/>
              <label style={LBL_STYLE}>Nettoyage extérieur ({sym})</label>
              <input type="number" style={IS} placeholder="ex: 50" value={fraisSup.nettoyageExt} onChange={e=>setFraisSup(f=>({...f,nettoyageExt:e.target.value}))}/>
            </div>
            {totalFraisSup>0&&<div style={{background:"#0a1940",borderRadius:12,padding:14,color:"white"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Total frais supplémentaires</div>
              {fraisSup.carburantManquant&&parseFloat(fraisSup.carburantManquant)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,opacity:.8,marginBottom:4}}><span>Carburant manquant</span><span>{fraisSup.carburantManquant} {sym}</span></div>}
              {fraisSup.nettoyageInt&&parseFloat(fraisSup.nettoyageInt)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,opacity:.8,marginBottom:4}}><span>Nettoyage intérieur</span><span>{fraisSup.nettoyageInt} {sym}</span></div>}
              {fraisSup.nettoyageExt&&parseFloat(fraisSup.nettoyageExt)>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,opacity:.8,marginBottom:4}}><span>Nettoyage extérieur</span><span>{fraisSup.nettoyageExt} {sym}</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.2)",marginTop:6,paddingTop:6}}><span style={{fontWeight:800}}>Total</span><span style={{fontWeight:900,fontSize:16,color:"#fbbf24"}}>{totalFraisSup.toFixed(2)} {sym}</span></div>
            </div>}
          </div>}
          {tab==="carro"&&<div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:13}}>Carrosserie ({nbNOK} dégât{nbNOK>1?"s":""})</div>
              <div style={{display:"flex",gap:6}}>
                <button onClick={()=>{const n={};CARRO_ELEMENTS.forEach(e=>{n[e.id]=true;});setCarro(n);}} style={{padding:"5px 10px",background:"#16a34a",color:"white",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>Tout OK</button>
                <button onClick={()=>{const n={};CARRO_ELEMENTS.forEach(e=>{n[e.id]=null;});setCarro(n);}} style={{padding:"5px 10px",background:"#e5e7eb",color:"#374151",border:"none",borderRadius:7,fontSize:11,cursor:"pointer"}}>Reset</button>
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
                  );
                })}
              </div>
            ))}
          </div>}
          {tab==="checks"&&<div>
            <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Vérifications générales</div>
            {RETOUR_CHECKS.map(chk=>{
              const val=checks[chk.id];
              return(
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
              );
            })}
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
              {cautionRestituee===true&&<div style={{background:"#f0fdf4",borderRadius:10,padding:12,border:"1px solid #bbf7d0",textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,color:"#16a34a"}}>{caution} EUR remboursés ✓</div></div>}
            </div>
            {cautionRestituee!==null&&<div style={{background:"#1e3a8a",borderRadius:12,padding:14,color:"white"}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>Bilan du retour</div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{opacity:.7}}>Loyer</span><span style={{fontWeight:700}}>{contrat.totalCalc||0} EUR</span></div>
              {surplusKm>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{opacity:.7}}>Surplus km</span><span style={{fontWeight:700,color:"#fbbf24"}}>+{surplusKm.toFixed(2)} EUR</span></div>}
              {retenu>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{opacity:.7}}>Retenue</span><span style={{fontWeight:700,color:"#fbbf24"}}>+{retenu} EUR</span></div>}
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.2)",paddingTop:6,marginTop:4}}><span style={{fontWeight:700}}>Total encaissé</span><span style={{fontWeight:900,fontSize:16,color:"#4ade80"}}>{(contrat.totalCalc||0)+surplusKm+retenu} EUR</span></div>
            </div>}
          </div>}
          {tab==="sig"&&<div style={{display:"flex",flexDirection:"column",gap:16}}>
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
  const OLD_CLAUSES_TITRES=["Clause d'immobilisation","Carburant","Amendes & Infractions","État du véhicule","Utilisation du véhicule","Véhicule RSV","Exclusivité de conduite","Limitation géographique","Interdiction de sous-location","Non-fumeur","Dégradations"];
  // Auto-migration : on fusionne les frais sauvés avec les nouveaux défauts (sans doublons)
  function migratefrais(saved){
    const labels=saved.map(f=>f.label.toLowerCase());
    const extras=DEF_FRAIS.filter(d=>!labels.includes(d.label.toLowerCase()));
    // Retirer les entrées obsolètes remplacées (Retour véhicule sale → Nettoyage véhicule)
    const cleaned=saved.filter(f=>f.label!=="Retour véhicule sale");
    return [...cleaned,...extras];
  }
  const[frais,setFrais]=useState(()=>migratefrais(vehicle.frais.map(f=>({...f}))));
  const[clauses,setClauses]=useState(()=>vehicle.clauses.filter(c=>!OLD_CLAUSES_TITRES.includes(c.titre)).map(c=>({...c})));
  const[nf,setNf]=useState({label:"",montant:""});
  const[nc,setNc]=useState({titre:"",texte:""});
  const[tab,setTab]=useState("frais");
  const IS=INP_STYLE();
  return(
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:640,height:"85vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <b style={{fontSize:14}}>{vehicle.marque} {vehicle.modele} — Frais & Clauses</b>
          <button onClick={onClose} style={{fontSize:22,background:"none",border:"none",cursor:"pointer"}}>x</button>
        </div>
        <div style={{display:"flex",borderBottom:"1px solid #e5e7eb",padding:"0 18px"}}>
          {[["frais","Frais"],["clauses","Clauses"]].map(([id,lbl])=><button key={id} onClick={()=>setTab(id)} style={{padding:"10px 14px",fontSize:12,fontWeight:tab===id?700:400,color:tab===id?"#2563eb":"#6b7280",background:"none",border:"none",borderBottom:tab===id?"2px solid #2563eb":"2px solid transparent",cursor:"pointer"}}>{lbl}</button>)}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:16}}>
          {tab==="frais"&&<div>
            <div style={{display:"flex",justifyContent:"flex-end",marginBottom:8}}>
              <button onClick={()=>setFrais(DEF_FRAIS.map(f=>({...f})))} style={{fontSize:11,padding:"4px 10px",background:"#fef3c7",color:"#b45309",border:"1px solid #fde68a",borderRadius:6,cursor:"pointer",fontWeight:600}}>↺ Réinitialiser aux défauts</button>
            </div>
            {frais.map(f=>(
              <div key={f.id} style={{display:"flex",gap:8,alignItems:"center",padding:8,background:"#f9fafb",borderRadius:8,marginBottom:6}}>
                <input style={{...IS,flex:1}} value={f.label} onChange={e=>setFrais(x=>x.map(a=>a.id===f.id?{...a,label:e.target.value}:a))}/>
                <input type="number" style={{...IS,width:70}} value={f.montant} onChange={e=>setFrais(x=>x.map(a=>a.id===f.id?{...a,montant:parseFloat(e.target.value)||0}:a))}/>
                <span style={{fontSize:11}}>EUR</span>
                <button onClick={()=>setFrais(x=>x.filter(a=>a.id!==f.id))} style={{padding:"3px 7px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:5,cursor:"pointer"}}>X</button>
              </div>
            ))}
            <div style={{background:"#eff6ff",borderRadius:10,padding:12,border:"1px solid #bfdbfe",marginTop:8}}>
              <div style={{display:"flex",gap:8}}>
                <input style={{...IS,flex:1}} placeholder="Libellé" value={nf.label} onChange={e=>setNf(x=>({...x,label:e.target.value}))}/>
                <input type="number" style={{...IS,width:80}} placeholder="Montant" value={nf.montant} onChange={e=>setNf(x=>({...x,montant:e.target.value}))}/>
                <button onClick={()=>{if(!nf.label||!nf.montant)return;setFrais(x=>[...x,{id:Date.now(),label:nf.label,montant:parseFloat(nf.montant)}]);setNf({label:"",montant:""});}} style={{background:"#1d4ed8",color:"white",border:"none",borderRadius:7,padding:"6px 11px",fontWeight:700,cursor:"pointer"}}>+</button>
              </div>
            </div>
          </div>}
          {tab==="clauses"&&<div>
            {clauses.length===0&&<div style={{textAlign:"center",color:"#9ca3af",fontSize:12,padding:24,background:"#f9fafb",borderRadius:10,marginBottom:8}}>Aucune clause particulière — les conditions générales (12 articles) s'appliquent automatiquement dans le contrat PDF.</div>}
            {clauses.map((c,i)=>(
              <div key={c.id} style={{padding:10,background:"#f9fafb",borderRadius:10,border:"1px solid #e5e7eb",marginBottom:8}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:10,background:"#dbeafe",color:"#1d4ed8",fontWeight:700,padding:"2px 7px",borderRadius:999}}>{i+1}</span>
                  <input style={{...IS,flex:1,fontWeight:600}} value={c.titre} onChange={e=>setClauses(x=>x.map(a=>a.id===c.id?{...a,titre:e.target.value}:a))}/>
                  <button onClick={()=>setClauses(x=>x.filter(a=>a.id!==c.id))} style={{padding:"3px 7px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:5,cursor:"pointer"}}>X</button>
                </div>
                <textarea style={{...IS,resize:"vertical",minHeight:50,fontFamily:"inherit"}} value={c.texte} onChange={e=>setClauses(x=>x.map(a=>a.id===c.id?{...a,texte:e.target.value}:a))}/>
              </div>
            ))}
            <div style={{background:"#f0fdf4",borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:11,color:"#15803d"}}>ℹ️ Les clauses ici sont des conditions <b>spécifiques à ce véhicule</b>. Les 12 articles de conditions générales sont déjà inclus automatiquement dans tous les contrats.</div>
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

function Badge({s}){
  return s==="loué"
    ?<span style={{padding:"2px 8px",fontSize:10,background:"#fef2f2",color:"#dc2626",borderRadius:999,fontWeight:700}}>Loué</span>
    :<span style={{padding:"2px 8px",fontSize:10,background:"#f0fdf4",color:"#16a34a",borderRadius:999,fontWeight:700}}>Disponible</span>;
}

function calcTarifAuto(vehicle,nbJours,heuresLoc,prixJourModifie){
  if(!vehicle)return{prix:0,label:"—"};
  if(prixJourModifie&&parseFloat(prixJourModifie)>0){
    const p=parseFloat(prixJourModifie)*nbJours;
    return{prix:p,label:`Personnalisé — ${prixJourModifie} €/j x ${nbJours}j`};
  }
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
  return{prix:(vehicle.tarif||0)*nbJours,label:`Standard — ${vehicle.tarif} €/j x ${nbJours}j`};
}

// ─────────────────────────────────────────────
// APP CONTENT
// ─────────────────────────────────────────────
function ResetPasswordModal({onDone}){
  const[pwd,setPwd]=useState("");
  const[pwd2,setPwd2]=useState("");
  const[show,setShow]=useState(false);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[success,setSuccess]=useState("");
  async function handleReset(){
    if(pwd.length<6){setError("Minimum 6 caractères");return;}
    if(pwd!==pwd2){setError("Les mots de passe ne correspondent pas");return;}
    setLoading(true);setError("");
    const{error:e}=await supabase.auth.updateUser({password:pwd});
    setLoading(false);
    if(e){setError(e.message);return;}
    setSuccess("Mot de passe modifié !");
    setTimeout(()=>onDone(),2000);
  }
  const eyeBtn={background:"none",border:"none",cursor:"pointer",position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:16,padding:0};
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"white",borderRadius:16,padding:32,width:"100%",maxWidth:380,margin:"0 16px"}}>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:20,textAlign:"center"}}>Nouveau mot de passe</h2>
        {error&&<div style={{background:"#fef2f2",color:"#dc2626",padding:"10px 14px",borderRadius:8,marginBottom:12,fontSize:13}}>{error}</div>}
        {success&&<div style={{background:"#f0fdf4",color:"#16a34a",padding:"10px 14px",borderRadius:8,marginBottom:12,fontSize:13}}>{success}</div>}
        <div style={{position:"relative",marginBottom:10}}>
          <input type={show?"text":"password"} placeholder="Nouveau mot de passe" value={pwd} onChange={e=>setPwd(e.target.value)} style={{width:"100%",padding:"10px 36px 10px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
          <button style={eyeBtn} onClick={()=>setShow(s=>!s)}>{show?"🙈":"👁️"}</button>
        </div>
        <div style={{position:"relative",marginBottom:16}}>
          <input type={show?"text":"password"} placeholder="Confirmer le mot de passe" value={pwd2} onChange={e=>setPwd2(e.target.value)} style={{width:"100%",padding:"10px 36px 10px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
          <button style={eyeBtn} onClick={()=>setShow(s=>!s)}>{show?"🙈":"👁️"}</button>
        </div>
        <button onClick={handleReset} disabled={loading} style={{width:"100%",padding:"12px",background:"#1d4ed8",color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer"}}>{loading?"...":"Enregistrer"}</button>
      </div>
    </div>
  );
}

function AppContent(){
  const[user,setUser]=useState(null);
  const[showResetPassword,setShowResetPassword]=useState(false);
  const[vehicles,setVehicles]=useState([]);
  const[contrats,setContrats]=useState([]);
  const[depenses,setDepenses]=useState([]);
  const[clients,setClients]=useState([]);
  const[profil,setProfil]=useState(INIT_PROFIL);
  const[page,setPage]=useState("vitrine");
  const[selId,setSelId]=useState(null);
  const FORM0={locPrenom:"",locNom:"",locEntreprise:"",locAdresse:"",locCodePostal:"",locVille:"",locTel:"+33 ",locEmail:"",locPermis:"",locReseaux:"",loc2Prenom:"",loc2Nom:"",dateDebut:"",heureDebut:"10:00",dateFin:"",heureFin:"10:00",paiement:"especes",cautionMode:"especes",kmDepart:"",nbJours:1,heuresLoc:24,carburantDepart:100,exterieurPropre:null,interieurPropre:null,prixJourModifie:"",accompte:"",remise:"",codePromo:""};
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
  const[finPeriode,setFinPeriode]=useState("6mois");
  const[profilEdit,setProfilEdit]=useState(false);
  const[profilForm,setProfilForm]=useState(INIT_PROFIL);
  const[secuEdit,setSecuEdit]=useState(false);
  const[secuForm,setSecuForm]=useState({newEmail:"",newPassword:"",confirmPassword:""});
  const[secuLoading,setSecuLoading]=useState(false);
  const[docsId,setDocsId]=useState(null);
  const[contratModalId,setContratModalId]=useState(null);
  const[newDoc,setNewDoc]=useState({type:"Carte grise",nom:"",expiration:"",file:null,fileData:null});
  const[lastContrat,setLastContrat]=useState(null);
  const[retourContratId,setRetourContratId]=useState(null);
  const[prolonContrat,setProlonContrat]=useState(null);
  const[prolonDateFin,setProlonDateFin]=useState("");
  const[prolonHeureFin,setProlonHeureFin]=useState("10:00");
  const[retours,setRetours]=useState({});
  const[tarifsVehicleId,setTarifsVehicleId]=useState(null);
  const[tarifsTemp,setTarifsTemp]=useState([]);
  const[ntarif,setNtarif]=useState({type:"Week-end (48h)",label:"",prix:"",unite:"forfait"});
  const[dataLoaded,setDataLoaded]=useState(false);
  const[amendes,setAmendes]=useState([]);
  const[showAddAmende,setShowAddAmende]=useState(false);
  const[amendeForm,setAmendeForm]=useState({vehicleId:"",contratRef:"",date:"",heure:"",montant:"",type:"Excès de vitesse",statut:"A traiter",notes:"",photoData:null});
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
  const[deleteClientConfirm,setDeleteClientConfirm]=useState(null);
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
    // Listener d'abord, AVANT l'échange de code
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      if(event==="PASSWORD_RECOVERY"){setShowResetPassword(true);}
      setUser(session?.user||null);
    });
    // Puis échange du code
    const handleAuthRedirect=async()=>{
      try{
        const url=new URL(window.location.href);
        const code=url.searchParams.get("code");
        if(code){await supabase.auth.exchangeCodeForSession(code);window.history.replaceState({},document.title,url.pathname);}
      }catch(err){console.error("Auth redirect error:",err);}
      supabase.auth.getSession().then(({data:{session}})=>setUser(session?.user||null));
    };
    handleAuthRedirect();
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
      const profData={nom:p.nom||'',entreprise:p.entreprise||'',siren:p.siren||'',siret:p.siret||'',kbis:p.kbis||'',tel:p.tel||'',whatsapp:p.whatsapp||'',snap:p.snap||'',email:p.email||'',adresse:p.adresse||'',ville:p.ville||'',iban:p.iban||'',devise:p.devise||'EUR'};
      setProfil(profData);setProfilForm(profData);
      if(vehRes.data){
        setVehicles(vehRes.data.map(v=>({id:v.id,typeVehicule:v.type_vehicule||'voiture',marque:v.marque||'',modele:v.modele||'',immat:v.immat||'',couleur:v.couleur||'',annee:v.annee||'',km:v.km||0,tarif:v.tarif||0,caution:v.caution||1000,kmInclus:v.km_inclus||0,prixKmSup:v.prix_km_sup||0,kmIllimite:v.km_illimite||false,vin:v.vin||'',nbPortes:v.nb_portes||'',nbPlaces:v.nb_places||'',numParc:v.num_parc||'',docs:v.docs||[],frais:v.frais||DEF_FRAIS.map(f=>({...f})),clauses:v.clauses||DEF_CLAUSES.map(c=>({...c})),tarifsSpeciaux:v.tarifs_speciaux||[],photosVehicule:v.photos_vehicule||[],publie:v.publie||false})));
      }
      let loadedContrats=[];
      if(conRes.data){
        loadedContrats=conRes.data.map(c=>({id:c.id,locNom:c.loc_nom||'',locPrenom:c.loc_prenom||'',locAdresse:c.loc_adresse||'',locTel:c.loc_tel||'',locEmail:c.loc_email||'',locPermis:c.loc_permis||'',dateDebut:c.date_debut||'',heureDebut:c.heure_debut||'10:00',dateFin:c.date_fin||'',heureFin:c.heure_fin||'10:00',paiement:c.paiement||'especes',cautionMode:c.caution_mode||'especes',kmDepart:c.km_depart||'',nbJours:c.nb_jours||1,heuresLoc:c.heures_loc||24,carburantDepart:c.carburant_depart??100,exterieurPropre:c.exterieur_propre,interieurPropre:c.interieur_propre,vehicleId:c.vehicle_id,vehicleLabel:c.vehicle_label||'',immat:c.immat||'',sigL:c.sig_l||null,sigLoc:c.sig_loc||null,totalCalc:c.total_calc||0,tarifLabel:c.tarif_label||'',remise:c.remise||0,accompte:c.accompte||0,resteAPayer:c.reste_a_payer||0,prixJourModifie:c.prix_jour_modifie||'',photosDepart:c.photos_depart||[],docsLocataire:c.docs_locataire||{},fraisSnap:c.frais_snap||[],clausesSnap:c.clauses_snap||[],kmInclus:c.km_inclus,prixKmSup:c.prix_km_sup}));
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
      if(retRes.data){
        const rMap={};
        retRes.data.forEach(r=>{rMap[r.contrat_id]={id:r.id,kmRetour:r.km_retour||'',carburantRetour:r.carburant_retour??100,montantRetenu:r.montant_retenu||0,raisonRetenue:r.raison_retenue||'',rembourse:r.rembourse||0,kmSup:r.km_sup||0,surplusKm:r.surplus_km||0,cautionRestituee:r.caution_restituee,checks:r.checks||{},carro:r.carro||{},carroPhotos:r.carro_photos||{},carroNotes:r.carro_notes||{},photos:r.photos||{},notes:r.notes||{},date:r.date||''};});
        setRetours(rMap);
      }
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
    const diff=t2-t1;
    if(diff<=0)return{jours:1,heures:24};
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
  const caT=contrats.reduce((s,c)=>s+(c.totalCalc||0),0);
  function inPeriodFin(dateStr){if(!dateStr)return false;const d=new Date(dateStr);const now=new Date();if(finPeriode==="mois")return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();if(finPeriode==="6mois"){const cutoff=new Date(now);cutoff.setMonth(cutoff.getMonth()-5);cutoff.setDate(1);return d>=cutoff;}if(finPeriode==="annee")return d.getFullYear()===now.getFullYear();return true;}
  const fContrats=contrats.filter(c=>inPeriodFin(c.dateDebut));
  const fDepenses=depenses.filter(d=>inPeriodFin(d.date));
  const caT_f=fContrats.reduce((s,c)=>s+(c.totalCalc||0),0);
  const dT_f=fDepenses.reduce((s,d)=>s+parseFloat(d.montant||0),0);
  const totalRetenues_f=fContrats.reduce((s,c)=>s+(retours[c.id]?.montantRetenu||0),0);
  const totalSurplusKm_f=fContrats.reduce((s,c)=>s+(retours[c.id]?.surplusKm||0),0);
  const cautionsNonRendues_f=contrats.filter(c=>!retours[c.id]&&inPeriodFin(c.dateDebut)).reduce((s,c)=>{const v=vehicles.find(x=>x.id===c.vehicleId);return s+(v?v.caution:0);},0);
  const bT_f=caT_f+totalRetenues_f+totalSurplusKm_f-dT_f;
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

  const clientsFiltres=clients.filter(c=>{
    const q=searchClient.toLowerCase();
    return !q||c.nom.toLowerCase().includes(q)||c.tel.includes(q)||(c.email||"").toLowerCase().includes(q);
  });

  const clientSuggestions=searchClientContrat.length>1?clients.filter(c=>c.nom.toLowerCase().includes(searchClientContrat.toLowerCase())||c.tel.includes(searchClientContrat)):[];

  async function saveContrat(){
    const miss=req.filter(k=>!form[k]);
    if(!sel||miss.length>0){const t={};req.forEach(k=>t[k]=true);setTouched(t);toast_("Remplissez tous les champs obligatoires","error");return;}
    const conflict=contrats.find(c=>c.vehicleId===sel.id&&c.dateDebut&&c.dateFin&&form.dateDebut&&form.dateFin&&form.dateDebut<=c.dateFin&&form.dateFin>=c.dateDebut);
    if(conflict){toast_(`⚠️ Conflit ! ${sel.marque} ${sel.modele} est déjà réservé du ${conflict.dateDebut} au ${conflict.dateFin} par ${conflict.locNom}`,"error");return;}
    const locNom=`${form.locPrenom} ${form.locNom}`.trim();
    const c={id:Date.now(),...form,locNom,vehicleId:sel.id,vehicleLabel:sel.marque+" "+sel.modele,immat:sel.immat,sigL,sigLoc,totalCalc:totalNet,tarifLabel:tarifAuto.label,remise,accompte,resteAPayer,photosDepart:[...photosDepart],docsLocataire:{...docsLocataire},fraisSnap:(sel.frais||DEF_FRAIS).map(f=>({...f})),clausesSnap:(sel.clauses||DEF_CLAUSES).map(cl=>({...cl})),kmInclus:sel.kmInclus,prixKmSup:sel.prixKmSup};
    setContrats(p=>[c,...p]);
    upsertClient(c,docsLocataire);
    const html=buildContratHTML(c,sel,sigL,sigLoc,profil);
    setLastContrat({contrat:c,vehicle:sel,html});
    toast_("Contrat créé !");
    setForm(FORM0);setTouched({});setSelId(null);setSigL(null);setSigLoc(null);setPhotosDepart([]);setDocsLocataire({});setSearchClientContrat("");
    if(user){
      const{data:ins,error:err}=await supabase.from('contrats').insert([{user_id:user.id,loc_prenom:form.locPrenom||'',loc_nom:locNom,loc_adresse:form.locAdresse,loc_tel:form.locTel,loc_email:form.locEmail,loc_permis:form.locPermis,date_debut:form.dateDebut,heure_debut:form.heureDebut,date_fin:form.dateFin,heure_fin:form.heureFin,paiement:form.paiement,caution_mode:form.cautionMode,km_depart:form.kmDepart,nb_jours:form.nbJours,heures_loc:form.heuresLoc,carburant_depart:form.carburantDepart,exterieur_propre:form.exterieurPropre,interieur_propre:form.interieurPropre,vehicle_id:c.vehicleId,vehicle_label:c.vehicleLabel,immat:c.immat,sig_l:c.sigL,sig_loc:c.sigLoc,total_calc:c.totalCalc,tarif_label:c.tarifLabel,remise:c.remise||0,accompte:c.accompte||0,reste_a_payer:c.resteAPayer||0,prix_jour_modifie:form.prixJourModifie||null,photos_depart:c.photosDepart,docs_locataire:c.docsLocataire,frais_snap:c.fraisSnap,clauses_snap:c.clausesSnap,km_inclus:c.kmInclus,prix_km_sup:c.prixKmSup}]).select().single();
      if(!err&&ins)setContrats(p=>p.map(x=>x.id===c.id?{...x,id:ins.id}:x));
      if(err){console.error(err);toast_("Erreur sauvegarde contrat: "+err.message,"error");}
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

  function ouvrirProlon(c){
    setProlonContrat(c);
    setProlonDateFin("");
    setProlonHeureFin(c.heureFin||"10:00");
  }
  async function prolongerContrat(){
    if(!prolonContrat||!prolonDateFin)return;
    const c=prolonContrat;
    const v=vehicles.find(x=>x.id===c.vehicleId);
    const debut=new Date(c.dateDebut);
    const fin=new Date(prolonDateFin);
    if(fin<=debut){toast_("La nouvelle date doit être après le début","error");return;}
    const newNbJours=Math.max(1,Math.ceil((fin-debut)/86400000));
    const tarifJ=parseFloat(c.tarifLabel?.match(/(\d+(?:\.\d+)?)\s*€\/j/)?.[1])||( v?v.tarif:0);
    const newTotal=Math.max(0,tarifJ*newNbJours-(c.remise||0));
    const newLabel=`Prolongé — ${tarifJ} €/j x ${newNbJours}j`;
    const updated={...c,dateFin:prolonDateFin,heureFin:prolonHeureFin,nbJours:newNbJours,totalCalc:newTotal,tarifLabel:newLabel};
    setContrats(cs=>cs.map(x=>x.id===c.id?updated:x));
    if(user){await supabase.from('contrats').update({date_fin:prolonDateFin,heure_fin:prolonHeureFin,nb_jours:newNbJours,total_calc:newTotal,tarif_label:newLabel}).eq('id',c.id).eq('user_id',user.id);}
    toast_("Contrat prolongé jusqu'au "+prolonDateFin+" !");
    setProlonContrat(null);
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
    if(!window.confirm("Supprimer ce retour ?"))return;
    const r=retours[contratId];
    setRetours(prev=>{const n={...prev};delete n[contratId];return n;});
    toast_("Retour supprimé.");
    if(user&&r?.id)await supabase.from('retours').delete().eq('id',r.id).eq('user_id',user.id);
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
      if(user){
        const{data:ins,error:err}=await supabase.from('vehicules').insert([{user_id:user.id,marque:base.marque,modele:base.modele,immat:base.immat,couleur:base.couleur,annee:base.annee,km:base.km,tarif:base.tarif,caution:base.caution,km_inclus:base.kmInclus,prix_km_sup:base.prixKmSup,km_illimite:base.kmIllimite,type_vehicule:base.typeVehicule,vin:base.vin,nb_portes:base.nbPortes,nb_places:base.nbPlaces,num_parc:base.numParc,docs:[],frais:DEF_FRAIS.map(f=>({...f})),clauses:DEF_CLAUSES.map(c=>({...c})),tarifs_speciaux:[],photos_vehicule:[],publie:false}]).select().single();
        if(!err&&ins)setVehicles(vs=>vs.map(x=>x.id===localId?{...x,id:ins.id}:x));
        if(err)console.error(err);
      }
    }
    setVForm({typeVehicule:"voiture",marque:"",modele:"",immat:"",couleur:"",annee:"",km:"",tarif:"",caution:"",kmInclus:"",prixKmSup:"",kmIllimite:false,motorisation:"Essence",boite:"Manuelle",puissanceFiscale:"",vin:"",nbPortes:"",nbPlaces:"",numParc:"",description:"",locationMin48:false});
    setShowAddV(false);setEditV(null);
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
    toast_(newVal?"Véhicule publié !":"Véhicule retiré de la vitrine");
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

  const caP=(()=>{
    const now=new Date();
    if(finPeriode==="mois"){
      const daysInMonth=new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
      return Array.from({length:4},(_,i)=>{
        const wStart=new Date(now.getFullYear(),now.getMonth(),1+i*7);
        const wEnd=new Date(now.getFullYear(),now.getMonth(),Math.min(7+i*7,daysInMonth));
        const ca=contrats.filter(c=>{const cd=new Date(c.dateDebut);return cd>=wStart&&cd<=wEnd;}).reduce((s,c)=>s+(c.totalCalc||0),0);
        const dep=depenses.filter(dd=>{const dt=new Date(dd.date);return dt>=wStart&&dt<=wEnd;}).reduce((s,d2)=>s+parseFloat(d2.montant||0),0);
        return{label:"S"+(i+1),ca,dep};
      });
    }
    if(finPeriode==="annee"){
      return Array.from({length:12},(_,i)=>{
        const d=new Date(now.getFullYear(),i,1);
        const ca=contrats.filter(c=>{const cd=new Date(c.dateDebut);return cd.getMonth()===i&&cd.getFullYear()===now.getFullYear();}).reduce((s,c)=>s+(c.totalCalc||0),0);
        const dep=depenses.filter(dd=>{const dt=new Date(dd.date);return dt.getMonth()===i&&dt.getFullYear()===now.getFullYear();}).reduce((s,d2)=>s+parseFloat(d2.montant||0),0);
        return{label:d.toLocaleDateString("fr-FR",{month:"short"}),ca,dep};
      });
    }
    return Array.from({length:6},(_,i)=>{
      const now=new Date();
      const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
      const m=d.getMonth(),a=d.getFullYear();
      const ca=contrats.filter(c=>{const cd=new Date(c.dateDebut);return cd.getMonth()===m&&cd.getFullYear()===a;}).reduce((s,c)=>s+(c.totalCalc||0),0);
      const dep=depenses.filter(dd=>{const dt=new Date(dd.date);return dt.getMonth()===m&&dt.getFullYear()===a;}).reduce((s,d2)=>s+parseFloat(d2.montant||0),0);
      return{label:d.toLocaleDateString("fr-FR",{month:"short"}),ca,dep};
    });
  })();
  const maxCA=Math.max(...caP.map(x=>Math.max(x.ca,x.dep)),1);

  const docsV=vehicles.find(v=>v.id===docsId);
  const contratV=vehicles.find(v=>v.id===contratModalId);
  const retourContrat=contrats.find(c=>c.id===retourContratId);
  const retourVehicle=retourContrat?vehicles.find(v=>v.id===retourContrat.vehicleId):null;

  const ganttDays=90;
  const ganttDates=Array.from({length:ganttDays},(_,i)=>{const d=new Date(ganttStartDate);d.setDate(d.getDate()+i);return d;});
  const DW=32;
  const today=new Date();
  const todayOffset=Math.floor((today-ganttStartDate)/86400000);
  const ganttColors=["#2563eb","#7c3aed","#16a34a","#d97706","#dc2626","#0891b2","#be185d"];
  const MONTH_NAMES=["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
  function ganttPrevMonth(){setGanttStartDate(d=>{const n=new Date(d);n.setMonth(n.getMonth()-1);return n;});}
  function ganttNextMonth(){setGanttStartDate(d=>{const n=new Date(d);n.setMonth(n.getMonth()+1);return n;});}
  function ganttGoToday(){const d=new Date();d.setDate(1);setGanttStartDate(d);}

  const PAGES=[
    {id:"vitrine",icon:"🏪",label:"Vitrine"},
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
    return(
      <div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.07)",borderLeft:`4px solid ${color}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div>
            <p style={{fontSize:10,color:"#6b7280",marginBottom:3}}>{label}</p>
            <p style={{fontSize:20,fontWeight:800,color:red?"#dc2626":"#1f2937"}}>{val}</p>
            {sub&&<p style={{fontSize:10,color:"#9ca3af",marginTop:2}}>{sub}</p>}
          </div>
          <span style={{fontSize:22}}>{icon}</span>
        </div>
      </div>
    );
  }

  function pickDocFile(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setNewDoc(d=>({...d,file:f.name,fileData:ev.target.result}));r.readAsDataURL(f);}

  if(!user)return <AuthPage/>;
  if(showResetPassword)return <ResetPasswordModal onDone={()=>setShowResetPassword(false)}/>;
  if(!dataLoaded)return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"#f1f5f9"}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:36,marginBottom:12}}>⏳</div><p style={{color:"#6b7280",fontSize:14}}>Chargement...</p></div>
    </div>
  );

  const profilVide=!profil.nom&&!profil.entreprise&&!profil.tel;
  if(profilVide)return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"100vh",background:"#f1f5f9",padding:16}}>
      <div style={{background:"white",borderRadius:16,padding:"32px 28px",width:"100%",maxWidth:480,boxShadow:"0 4px 24px rgba(0,0,0,0.1)"}}>
        <h1 style={{textAlign:"center",marginBottom:6,fontSize:20,fontWeight:800}}>Bienvenue sur MAN'S LOCATION</h1>
        <p style={{textAlign:"center",color:"#6b7280",marginBottom:24,fontSize:13}}>Remplissez vos informations pour commencer</p>
        {[["nom","Nom complet *"],["entreprise","Nom de l'entreprise *"],["siren","SIREN"],["siret","SIRET"],["kbis","KBIS"],["email","Email"],["adresse","Adresse"],["ville","Ville"],["iban","IBAN"]].map(([k,l])=>(
          <div key={k} style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3}}>{l}</label>
            <input placeholder={l.replace(" *","")} style={{width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,boxSizing:"border-box"}} value={profilForm[k]||""} onChange={e=>setProfilForm(p=>({...p,[k]:e.target.value}))}/>
          </div>
        ))}
        {[["tel","Téléphone *"],["whatsapp","WhatsApp"]].map(([k,l])=>(
          <div key={k} style={{marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:600,color:"#6b7280",display:"block",marginBottom:3}}>{l}</label>
            <TelInput value={profilForm[k]||""} onChange={v=>setProfilForm(p=>({...p,[k]:v}))} placeholder={l.replace(" *","")}/>
          </div>
        ))}
        <button onClick={async()=>{if(!profilForm.nom||!profilForm.entreprise||!profilForm.tel)return;setProfil({...profilForm});if(user)await supabase.from('profils').upsert({user_id:user.id,slug:user.id.slice(0,8),...profilForm},{onConflict:'user_id'});}} style={{width:"100%",padding:"12px",background:"#1d4ed8",color:"white",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",marginTop:8}}>Commencer</button>
        <button onClick={()=>supabase.auth.signOut()} style={{width:"100%",padding:"10px",background:"transparent",color:"#6b7280",border:"1px solid #e5e7eb",borderRadius:10,fontSize:12,cursor:"pointer",marginTop:8}}>Déconnexion</button>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#f0f4f8"}}>
      <nav style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",boxShadow:"0 2px 12px rgba(0,0,0,.3)",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 8px",height:54,display:"flex",alignItems:"center",gap:4}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
            <div style={{background:"white",borderRadius:6,padding:"2px 6px"}}><span style={{color:"#0a1940",fontWeight:900,fontSize:10,letterSpacing:1}}>MAN'S</span></div>
            <span style={{color:"white",fontWeight:700,fontSize:10,whiteSpace:"nowrap"}}>LOCATION</span>
          </div>
          <div style={{display:"flex",overflowX:"auto",gap:0,WebkitOverflowScrolling:"touch",msOverflowStyle:"none",scrollbarWidth:"none",flex:1}}>
            {PAGES.map(p=>(
              <button key={p.id} onClick={()=>setPage(p.id)} style={{flexShrink:0,padding:"4px 6px",borderRadius:6,fontSize:10,fontWeight:page===p.id?700:400,background:page===p.id?"rgba(255,255,255,0.2)":"transparent",color:page===p.id?"white":"rgba(255,255,255,0.65)",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:1,position:"relative",minWidth:44}}>
                <span style={{fontSize:16}}>{p.icon}</span>
                <span style={{fontSize:8,whiteSpace:"nowrap"}}>{p.label}</span>
                {p.id==="questions"&&nbQSansReponse>0&&<span style={{position:"absolute",top:1,right:1,background:"#ef4444",color:"white",borderRadius:"50%",width:13,height:13,fontSize:7,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{nbQSansReponse}</span>}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {toast&&<div style={{position:"fixed",top:14,right:14,zIndex:10000,padding:"10px 16px",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.15)",color:"white",fontSize:12,fontWeight:600,background:toast.type==="error"?"#ef4444":"#16a34a",maxWidth:320}}>{toast.msg}</div>}

      {/* Modals */}
      {reponseModal&&(
        <div onClick={e=>{if(e.target===e.currentTarget){setReponseModal(null);setReponseText("");}}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:480,padding:20}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>Répondre à la question</div>
            <div style={{background:"#f1f5f9",borderRadius:8,padding:10,fontSize:12,marginBottom:12,border:"1px solid #e5e7eb"}}>{reponseModal.question}</div>
            <textarea placeholder="Votre réponse..." value={reponseText} onChange={e=>setReponseText(e.target.value)} rows={4} style={{width:"100%",padding:"8px",border:"1px solid #d1d5db",borderRadius:8,fontSize:12,resize:"none",fontFamily:"inherit",boxSizing:"border-box",marginBottom:12}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>repondreQuestion(reponseModal)} style={{flex:1,background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Envoyer</button>
              <button onClick={()=>{setReponseModal(null);setReponseText("");}} style={{padding:"10px 16px",background:"#e5e7eb",border:"none",borderRadius:10,fontSize:13,cursor:"pointer"}}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {photosVehicleModal&&<PhotosVehiculeModal vehicle={photosVehicleModal} onClose={()=>setPhotosVehicleModal(null)} onSave={async(photos)=>{setVehicles(vs=>vs.map(v=>v.id===photosVehicleModal.id?{...v,photosVehicule:photos}:v));setPhotosVehicleModal(null);toast_("Photos enregistrées !");if(user)await supabase.from('vehicules').update({photos_vehicule:photos}).eq('id',photosVehicleModal.id).eq('user_id',user.id);}}/>}
      {contratModalId&&contratV&&<ContratModal vehicle={contratV} onClose={()=>setContratModalId(null)} onSave={async(fr,cl)=>{setVehicles(vs=>vs.map(v=>v.id===contratModalId?{...v,frais:fr,clauses:cl}:v));setContratModalId(null);toast_("Mis à jour !");if(user)await supabase.from('vehicules').update({frais:fr,clauses:cl}).eq('id',contratModalId).eq('user_id',user.id);}}/>}
      {retourContratId&&retourContrat&&<RetourModal contrat={retourContrat} vehicle={retourVehicle} profil={profil} onClose={()=>setRetourContratId(null)} onSave={data=>saveRetour(retourContratId,data)}/>}

      {/* Modal fiche client */}
      {selectedClient&&(
        <div onClick={e=>{if(e.target===e.currentTarget){setSelectedClient(null);setEditingClient(null);setDeleteClientConfirm(null);}}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:560,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"14px 18px",background:"linear-gradient(135deg,#0a1940,#1e3a8a)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><b style={{color:"white",fontSize:15}}>👤 {selectedClient.nom}</b><div style={{color:"rgba(255,255,255,.6)",fontSize:11}}>{selectedClient.tel}</div></div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setEditingClient({...selectedClient})} style={{padding:"5px 10px",background:"rgba(255,255,255,.2)",color:"white",border:"none",borderRadius:7,fontSize:11,cursor:"pointer"}}>Modifier</button>
                <button onClick={()=>{setSelectedClient(null);setEditingClient(null);setDeleteClientConfirm(null);}} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:"white"}}>x</button>
              </div>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:16}}>
              {editingClient?(
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                  {[["nom","Nom complet"],["adresse","Adresse"],["email","Email"],["permis","N° Permis"]].map(([k,l])=>(
                    <div key={k}><label style={LBL_STYLE}>{l}</label><input style={INP_STYLE()} value={editingClient[k]||""} onChange={e=>setEditingClient(c=>({...c,[k]:e.target.value}))}/></div>
                  ))}
                  <div><label style={LBL_STYLE}>Téléphone</label><TelInput value={editingClient.tel||""} onChange={v=>setEditingClient(c=>({...c,tel:v}))}/></div>
                  {/* Documents dans mode édition */}
                  <div>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:8,borderTop:"1px solid #e5e7eb",paddingTop:10}}>Documents</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {[{k:"cniRecto",l:"CNI / Passeport - Recto",col:"#2563eb",ic:"🪪"},{k:"cniVerso",l:"CNI / Passeport - Verso",col:"#2563eb",ic:"🪪"},{k:"justifDom",l:"Justificatif de domicile",col:"#7c3aed",ic:"🏠"},{k:"photoAr",l:"Photo locataire",col:"#16a34a",ic:"👤"}].map(({k,l,col,ic})=>{
                        const src=(editingClient.docs||{})[k];
                        function pickD(capture){const i=document.createElement("input");i.type="file";i.accept="image/*,application/pdf";if(capture)i.capture="environment";i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setEditingClient(c=>({...c,docs:{...(c.docs||{}),[k]:ev.target.result}}));r.readAsDataURL(f);};i.click();}
                        function dlD(){const ext=src.startsWith("data:image/png")?"png":src.startsWith("data:image/gif")?"gif":src.startsWith("data:application/pdf")?"pdf":"jpg";const a=document.createElement("a");a.href=src;a.download=`${(editingClient.nom||"client").replace(/\s+/g,"_")}_${k}.${ext}`;a.click();}
                        return(
                          <div key={k} style={{borderRadius:10,border:`2px solid ${src?col:"#e5e7eb"}`,background:src?"#f8fafc":"white",overflow:"hidden"}}>
                            <div style={{padding:"8px 12px",display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontSize:16}}>{ic}</span>
                              <span style={{flex:1,fontWeight:600,fontSize:11,color:src?col:"#374151"}}>{l}</span>
                              {src?(
                                <div style={{display:"flex",gap:4}}>
                                  <button onClick={()=>window.open(src,"_blank")} style={{padding:"3px 7px",background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:5,cursor:"pointer",fontSize:10,fontWeight:700}}>👁</button>
                                  <button onClick={dlD} style={{padding:"3px 7px",background:col,color:"white",border:"none",borderRadius:5,cursor:"pointer",fontSize:10,fontWeight:700}}>⬇</button>
                                  <button onClick={()=>setEditingClient(c=>{const d={...(c.docs||{})};delete d[k];return{...c,docs:d};})} style={{padding:"3px 7px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:5,cursor:"pointer",fontSize:10,fontWeight:700}}>✕</button>
                                </div>
                              ):(
                                <div style={{display:"flex",gap:4}}>
                                  <button onClick={()=>pickD(false)} title="Galerie" style={{padding:"4px 8px",background:"#1e3a8a",color:"white",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>📁</button>
                                  <button onClick={()=>pickD(true)} title="Caméra" style={{padding:"4px 8px",background:"#7c3aed",color:"white",border:"none",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer"}}>📷</button>
                                </div>
                              )}
                            </div>
                            {src&&<div style={{padding:"0 12px 10px"}}><img src={src} alt={l} style={{width:"100%",maxHeight:140,objectFit:"contain",borderRadius:8,border:`2px solid ${col}`,background:"#f1f5f9",cursor:"zoom-in"}} onClick={()=>window.open(src,"_blank")}/></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,marginTop:4}}>
                    <button onClick={async()=>{const updated={...editingClient};setClients(cs=>cs.map(c=>c.key===updated.key?updated:c));setSelectedClient(updated);setEditingClient(null);toast_("Client mis à jour !");if(user){const lastC=contrats.filter(c=>c.locNom===updated.nom&&c.locTel===updated.tel).sort((a,b)=>new Date(b.dateDebut)-new Date(a.dateDebut))[0];if(lastC)await supabase.from('contrats').update({docs_locataire:updated.docs||{}}).eq('id',lastC.id).eq('user_id',user.id);}}} style={{flex:1,background:"#16a34a",color:"white",border:"none",borderRadius:8,padding:"8px 0",fontSize:13,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
                    <button onClick={()=>setEditingClient(null)} style={{padding:"8px 14px",background:"#e5e7eb",border:"none",borderRadius:8,cursor:"pointer"}}>Annuler</button>
                  </div>
                </div>
              ):(
                <div style={{marginBottom:16}}>
                  {[["Adresse",selectedClient.adresse],["Email",selectedClient.email],["Permis",selectedClient.permis]].filter(([,v])=>v).map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}><span style={{fontSize:11,color:"#6b7280"}}>{l}</span><span style={{fontSize:12,fontWeight:600}}>{v}</span></div>
                  ))}
                </div>
              )}
              {(selectedClient.docs?.cniRecto||selectedClient.docs?.cniVerso||selectedClient.docs?.justifDom||selectedClient.docs?.photoAr)&&(
                <div style={{marginBottom:16}}>
                  <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Documents</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
                    {[["cniRecto","CNI Recto","#2563eb"],["cniVerso","CNI Verso","#2563eb"],["justifDom","Justif. domicile","#7c3aed"],["photoAr","Photo locataire","#16a34a"]].map(([k,lbl,col])=>{
                      const src=selectedClient.docs?.[k];
                      if(!src)return null;
                      function dlDoc(){
                        const ext=src.startsWith("data:image/png")?"png":src.startsWith("data:image/gif")?"gif":src.startsWith("data:application/pdf")?"pdf":"jpg";
                        const a=document.createElement("a");a.href=src;a.download=`${selectedClient.nom.replace(/\s+/g,"_")}_${k}.${ext}`;a.click();
                      }
                      return(
                        <div key={k} style={{borderRadius:10,border:`2px solid ${col}`,overflow:"hidden",background:"white"}}>
                          <img src={src} alt={lbl} style={{width:"100%",height:120,objectFit:"contain",background:"#f8fafc",display:"block",cursor:"zoom-in"}} onClick={()=>window.open(src,"_blank")}/>
                          <div style={{padding:"6px 8px",background:"#f8fafc",borderTop:`1px solid ${col}22`}}>
                            <div style={{fontSize:10,fontWeight:700,color:col,marginBottom:4}}>{lbl}</div>
                            <button onClick={dlDoc} style={{width:"100%",padding:"4px 0",background:col,color:"white",border:"none",borderRadius:5,fontSize:10,fontWeight:700,cursor:"pointer"}}>⬇ Télécharger</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div>
                <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Historique contrats</div>
                {contrats.filter(c=>c.locNom===selectedClient.nom&&c.locTel===selectedClient.tel).length===0
                  ?<div style={{color:"#9ca3af",fontSize:12}}>Aucun contrat</div>
                  :contrats.filter(c=>c.locNom===selectedClient.nom&&c.locTel===selectedClient.tel).map(c=>(
                    <div key={c.id} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",marginBottom:6,border:"1px solid #e5e7eb"}}>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <div><div style={{fontWeight:700,fontSize:12}}>{c.vehicleLabel}</div><div style={{fontSize:11,color:"#6b7280"}}>{c.dateDebut} → {c.dateFin}</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontWeight:800,color:"#1e3a8a"}}>{c.totalCalc} {sym}</div>{retours[c.id]&&<div style={{fontSize:10,color:"#16a34a"}}>✅ Retour OK</div>}</div>
                      </div>
                      <button onClick={()=>rePrint(c)} style={{marginTop:6,padding:"3px 8px",background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:6,fontSize:10,cursor:"pointer",fontWeight:600}}>📄 PDF</button>
                    </div>
                  ))}
              </div>
            </div>
            <div style={{padding:"12px 16px",borderTop:"1px solid #e5e7eb",background:"white"}}>
              <div style={{display:"flex",gap:8,marginBottom:deleteClientConfirm!==null?8:0}}>
                <button onClick={()=>{setForm(f=>({...f,locNom:selectedClient.nom,locTel:selectedClient.tel,locAdresse:selectedClient.adresse||"",locEmail:selectedClient.email||"",locPermis:selectedClient.permis||""}));setDocsLocataire({...selectedClient.docs});setSelectedClient(null);setDeleteClientConfirm("");setPage("nouveau");toast_("Client chargé !");}} style={{flex:1,background:"#1e3a8a",color:"white",border:"none",borderRadius:10,padding:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>Créer un contrat pour ce client</button>
                <button onClick={()=>setDeleteClientConfirm(prev=>prev===null?"":null)} style={{padding:"10px 14px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer"}}>🗑️</button>
              </div>
              {deleteClientConfirm!==null&&(
                <div style={{background:"#fef2f2",borderRadius:10,padding:12,border:"1px solid #fecaca",marginTop:8}}>
                  <p style={{fontSize:12,color:"#dc2626",fontWeight:600,marginBottom:8}}>Pour confirmer la suppression, tapez <b>SUPPRIMER</b> :</p>
                  <input value={deleteClientConfirm||""} onChange={e=>setDeleteClientConfirm(e.target.value)} placeholder="SUPPRIMER" style={{width:"100%",padding:"8px 10px",border:"2px solid #fca5a5",borderRadius:8,fontSize:13,fontFamily:"monospace",boxSizing:"border-box",marginBottom:8,outline:"none"}}/>
                  <div style={{display:"flex",gap:8}}>
                    <button disabled={deleteClientConfirm!=="SUPPRIMER"} onClick={()=>{setClients(cs=>cs.filter(c=>c.key!==selectedClient.key));setSelectedClient(null);setDeleteClientConfirm("");toast_("Client supprimé");}} style={{flex:1,background:deleteClientConfirm==="SUPPRIMER"?"#dc2626":"#e5e7eb",color:deleteClientConfirm==="SUPPRIMER"?"white":"#9ca3af",border:"none",borderRadius:8,padding:"8px 0",fontSize:13,fontWeight:700,cursor:deleteClientConfirm==="SUPPRIMER"?"pointer":"not-allowed"}}>Confirmer la suppression</button>
                    <button onClick={()=>setDeleteClientConfirm("")} style={{padding:"8px 14px",background:"#e5e7eb",border:"none",borderRadius:8,fontSize:12,cursor:"pointer"}}>Annuler</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal tarifs */}
      {tarifsVehicle&&(
        <div onClick={e=>{if(e.target===e.currentTarget)setTarifsVehicleId(null);}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"white",borderRadius:16,width:"100%",maxWidth:520,maxHeight:"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"14px 18px",background:"#0a1940",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><b style={{fontSize:14,color:"white"}}>Tarifs spéciaux</b><div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>{tarifsVehicle.marque} {tarifsVehicle.modele} · Standard : {tarifsVehicle.tarif} {sym}/j</div></div>
              <button onClick={()=>setTarifsVehicleId(null)} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",color:"white"}}>x</button>
            </div>
            <div style={{flex:1,overflowY:"auto",padding:14}}>
              {tarifsTemp.map(t=>(
                <div key={t.id} style={{display:"flex",gap:8,alignItems:"center",padding:10,background:"#f9fafb",borderRadius:10,marginBottom:7,border:"1px solid #e5e7eb"}}>
                  <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13}}>{t.label||t.type}</div><div style={{fontSize:11,color:"#6b7280"}}>{t.type} · {t.unite==="forfait"?"Forfait":"Par jour"}</div></div>
                  <input type="number" style={{width:75,border:"1px solid #d1d5db",borderRadius:6,padding:"5px 7px",fontSize:13,fontWeight:700}} value={t.prix} onChange={e=>setTarifsTemp(ts=>ts.map(x=>x.id===t.id?{...x,prix:e.target.value}:x))}/>
                  <span style={{fontSize:12,color:"#6b7280"}}>{sym}</span>
                  <button onClick={()=>setTarifsTemp(ts=>ts.filter(x=>x.id!==t.id))} style={{padding:"4px 8px",background:"#fef2f2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer"}}>X</button>
                </div>
              ))}
              <div style={{background:"#eff6ff",borderRadius:12,padding:14,border:"1px solid #bfdbfe",marginTop:8}}>
                <p style={{fontSize:12,fontWeight:700,color:"#1d4ed8",marginBottom:10}}>+ Nouveau tarif</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                  <div><label style={LBL_STYLE}>Durée</label><select style={INP_STYLE()} value={ntarif.type} onChange={e=>setNtarif(x=>({...x,type:e.target.value}))}>{TARIFS_PRESETS.map(p=><option key={p.type}>{p.type}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Nom affiché</label><input style={INP_STYLE()} placeholder="ex: WE 48h" value={ntarif.label} onChange={e=>setNtarif(x=>({...x,label:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Prix ({sym})</label><input type="number" style={INP_STYLE()} placeholder="ex: 130" value={ntarif.prix} onChange={e=>setNtarif(x=>({...x,prix:e.target.value}))}/></div>
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

      {/* Modal docs véhicule */}
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
              {(!docsV.docs||docsV.docs.length===0)
                ?<div style={{textAlign:"center",color:"#9ca3af",padding:24}}><p>Aucun document</p></div>
                :docsV.docs.map(doc=>{
                  const expired=isExp(doc.expiration),soon=isSoon(doc.expiration);
                  return(
                    <div key={doc.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:10,border:`1px solid ${expired?"#fca5a5":soon?"#fde68a":"#e5e7eb"}`,background:expired?"#fef2f2":soon?"#fffbeb":"#f9fafb",marginBottom:6}}>
                      <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:18}}>📄</span><div><div style={{fontWeight:600,fontSize:12}}>{doc.nom}</div><div style={{fontSize:10,color:"#6b7280"}}>{doc.type}{doc.expiration&&<span style={{marginLeft:6,fontWeight:600,color:expired?"#dc2626":soon?"#d97706":"#16a34a"}}>{doc.expiration}</span>}</div></div></div>
                      <div style={{display:"flex",gap:5}}>
                        {doc.fileData&&<button onClick={()=>{const a=document.createElement("a");a.href=doc.fileData;a.download=doc.file||doc.nom;a.click();}} style={{padding:"3px 7px",background:"#dbeafe",color:"#1d4ed8",border:"none",borderRadius:5,cursor:"pointer",fontSize:11}}>DL</button>}
                        <button onClick={async()=>{const updatedDocs=(docsV.docs||[]).filter(d=>d.id!==doc.id);setVehicles(vs=>vs.map(v=>v.id===docsId?{...v,docs:updatedDocs}:v));toast_("Supprimé");if(user)await supabase.from('vehicules').update({docs:updatedDocs}).eq('id',docsId).eq('user_id',user.id);}} style={{padding:"3px 7px",background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:5,cursor:"pointer",fontSize:11}}>X</button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"12px 10px",boxSizing:"border-box"}}>

        {/* VITRINE */}
        {page==="vitrine"&&(
          <div>
            <div style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",borderRadius:14,padding:"14px 16px",marginBottom:14,color:"white"}}>
              <div style={{fontSize:16,fontWeight:800,marginBottom:2}}>Bonjour, {profil.nom.split(" ")[0]} 👋</div>
              <div style={{fontSize:11,opacity:.7,textTransform:"capitalize"}}>{new Date().toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(80px,1fr))",gap:8,marginTop:12}}>
                <div style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,opacity:.7}}>CA total</div><div style={{fontWeight:800,fontSize:14}}>{caT} {sym}</div></div>
                <div style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,opacity:.7}}>Véhicules</div><div style={{fontWeight:800,fontSize:14}}>{vehicles.length}</div></div>
                <div style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,opacity:.7}}>Contrats</div><div style={{fontWeight:800,fontSize:14}}>{contrats.length}</div></div>
              </div>
            </div>
            {vehicles.some(v=>v.publie)&&(
              <div style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",borderRadius:14,padding:16,marginBottom:16,color:"white"}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Lien vitrine public</div>
                <div style={{background:"rgba(255,255,255,.1)",borderRadius:8,padding:"8px 12px",fontSize:11,wordBreak:"break-all",marginBottom:8}}>{window.location.origin}/vitrine/{user?.id?.slice(0,8)}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>{navigator.clipboard.writeText(window.location.origin+"/vitrine/"+user?.id?.slice(0,8));toast_("Lien copié !");}} style={{padding:"7px 14px",background:"white",color:"#1e3a8a",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>Copier le lien</button>
                  <button onClick={()=>window.open(window.location.origin+"/vitrine/"+user?.id?.slice(0,8),"_blank")} style={{padding:"7px 14px",background:"rgba(255,255,255,.15)",color:"white",border:"1px solid rgba(255,255,255,.4)",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>Ouvrir</button>
                  <button onClick={()=>{const msg="Bonjour, voici notre catalogue : "+window.location.origin+"/vitrine/"+user?.id?.slice(0,8);window.open("https://wa.me/"+(profil.whatsapp||profil.tel||"").replace(/\D/g,"")+"?text="+encodeURIComponent(msg),"_blank");}} style={{padding:"7px 14px",background:"#25D366",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>WhatsApp</button>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
              {vehicles.map(v=>{
                const cover=(v.photosVehicule||[])[0];
                return(
                  <div key={v.id} style={{background:"white",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.08)",border:`2px solid ${v.publie?"#2563eb":"#e5e7eb"}`}}>
                    <div style={{height:160,background:"#f1f5f9",position:"relative",overflow:"hidden"}}>
                      {cover?<img src={cover.data} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%"}}><span style={{fontSize:36}}>🚗</span></div>}
                      {v.publie&&<div style={{position:"absolute",top:8,right:8,background:"#2563eb",color:"white",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:99}}>EN LIGNE</div>}
                    </div>
                    <div style={{padding:14}}>
                      <div style={{fontWeight:800,fontSize:15,marginBottom:2}}>{v.marque} {v.modele}</div>
                      <div style={{fontSize:11,color:"#6b7280",marginBottom:10}}>{v.couleur} · {v.annee} · {v.immat}</div>
                      <button onClick={()=>togglePublier(v)} style={{width:"100%",padding:"8px 0",background:v.publie?"#fef2f2":"#1e3a8a",color:v.publie?"#dc2626":"white",border:v.publie?"2px solid #fecaca":"none",borderRadius:10,fontSize:12,fontWeight:700,cursor:"pointer"}}>{v.publie?"Retirer de la vitrine":"Publier"}</button>
                    </div>
                  </div>
                );
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
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
                    {vehicles.filter(v=>v.publie).map(v=>{
                      const cover=(v.photosVehicule||[])[0];
                      return(
                        <div key={v.id} style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
                          <div style={{height:150,background:"#f1f5f9",overflow:"hidden"}}>
                            {cover?<img src={cover.data} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:32}}>🚗</div>}
                          </div>
                          <div style={{padding:16}}>
                            <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{v.marque} {v.modele}</div>
                            <div style={{fontSize:12,color:"#6b7280",marginBottom:10}}>{v.couleur} · {v.annee}</div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                              <div style={{background:"#eff6ff",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:10,color:"#6b7280"}}>Prix/jour</div><div style={{fontWeight:800,fontSize:15,color:"#2563eb"}}>{v.tarif} {sym}</div></div>
                              <div style={{background:"#fef3c7",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:10,color:"#6b7280"}}>Caution</div><div style={{fontWeight:800,fontSize:15,color:"#d97706"}}>{v.caution} {sym}</div></div>
                            </div>
                            <DemandeVehicule vehicle={v} profil={profil} userId={user?.id}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CLIENTS */}
        {page==="clients"&&(
          <div>
            <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937",marginBottom:12}}>Clients ({clients.length})</h1>
            <div style={{marginBottom:14}}>
              <input placeholder="🔍 Rechercher..." style={INP_STYLE()} value={searchClient} onChange={e=>setSearchClient(e.target.value)}/>
            </div>
            {clientsFiltres.length===0
              ?<div style={{textAlign:"center",color:"#9ca3af",padding:40,background:"white",borderRadius:14}}><div style={{fontSize:36,marginBottom:8}}>👥</div><p>Aucun client{searchClient?" trouvé":". Créés automatiquement lors des contrats."}</p></div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
                {clientsFiltres.map(c=>{
                  const nbContrats=contrats.filter(x=>x.locNom===c.nom&&x.locTel===c.tel).length;
                  const totalCA=contrats.filter(x=>x.locNom===c.nom&&x.locTel===c.tel).reduce((s,x)=>s+(x.totalCalc||0),0);
                  const hasDoc=c.docs&&(c.docs.cniRecto||c.docs.cniVerso||c.docs.justifDom);
                  return(
                    <div key={c.key} onClick={()=>setSelectedClient(c)} style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:"1px solid #e5e7eb",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,.12)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.07)"}>
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
                        <div style={{flex:1,background:"#f0fdf4",borderRadius:8,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>CA total</div><div style={{fontWeight:800,fontSize:14,color:"#16a34a"}}>{totalCA} {sym}</div></div>
                        <div style={{flex:1,background:hasDoc?"#f5f3ff":"#f9fafb",borderRadius:8,padding:"6px 8px",textAlign:"center"}}><div style={{fontSize:9,color:"#6b7280"}}>Docs</div><div style={{fontWeight:800,fontSize:14,color:hasDoc?"#7c3aed":"#9ca3af"}}>{hasDoc?"✓":"—"}</div></div>
                      </div>
                    </div>
                  );
                })}
              </div>}
          </div>
        )}

        {/* FLOTTE */}
        {page==="vehicles"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Flotte</h1>
              <button onClick={()=>{setShowAddV(true);setEditV(null);setVForm({typeVehicule:"voiture",marque:"",modele:"",immat:"",couleur:"",annee:"",km:"",tarif:"",caution:"",kmInclus:"",prixKmSup:"",kmIllimite:false,motorisation:"Essence",boite:"Manuelle",puissanceFiscale:"",vin:"",nbPortes:"",nbPlaces:"",numParc:"",description:"",locationMin48:false});}} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
            </div>
            {showAddV&&(
              <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 12px rgba(0,0,0,.1)",marginBottom:16,border:"2px solid #bfdbfe"}}>
                <h3 style={{fontWeight:700,marginBottom:12,fontSize:14}}>{editV?"Modifier":"Nouveau véhicule"}</h3>
                <div style={{marginBottom:10}}>
                  <label style={LBL_STYLE}>Type de véhicule</label>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {[{id:"voiture",label:"Voiture",icon:"🚗"},{id:"vsp",label:"VSP",icon:"🚘"},{id:"2roues",label:"2 roues",icon:"🏍️"},{id:"utilitaire",label:"Utilitaire",icon:"🚚"},{id:"semi",label:"Semi",icon:"🚛"},{id:"autocar",label:"Autocar",icon:"🚌"},{id:"camping",label:"Camping-car",icon:"🚐"},{id:"autre",label:"Autre",icon:"🚙"}].map(t=>(
                      <button key={t.id} onClick={()=>setVForm(f=>({...f,typeVehicule:t.id}))} style={{padding:"6px 12px",borderRadius:8,border:`2px solid ${vForm.typeVehicule===t.id?"#2563eb":"#e5e7eb"}`,background:vForm.typeVehicule===t.id?"#eff6ff":"white",fontSize:11,fontWeight:vForm.typeVehicule===t.id?700:400,cursor:"pointer"}}>{t.icon} {t.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10}}>
                  <div><label style={LBL_STYLE}>Marque *</label><select style={INP_STYLE()} value={vForm.marque} onChange={e=>setVForm(f=>({...f,marque:e.target.value,modele:""}))}><option value="">-- Choisir --</option>{Object.keys(CAR_BRANDS).sort().map(b=><option key={b} value={b}>{b}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Modèle *</label><select style={INP_STYLE()} value={vForm.modele} onChange={e=>setVForm(f=>({...f,modele:e.target.value}))} disabled={!vForm.marque}><option value="">-- Choisir --</option>{(CAR_BRANDS[vForm.marque]||[]).map(m=><option key={m} value={m}>{m}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Immatriculation *</label><input style={INP_STYLE()} value={vForm.immat} onChange={e=>setVForm(f=>({...f,immat:e.target.value.toUpperCase()}))}/></div>
                  <div><label style={LBL_STYLE}>Couleur</label><select style={INP_STYLE()} value={vForm.couleur} onChange={e=>setVForm(f=>({...f,couleur:e.target.value}))}><option value="">-- Choisir --</option>{CAR_COLORS.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Année</label><select style={INP_STYLE()} value={vForm.annee} onChange={e=>setVForm(f=>({...f,annee:e.target.value}))}><option value="">-- Choisir --</option>{CAR_YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Motorisation</label><select style={INP_STYLE()} value={vForm.motorisation} onChange={e=>setVForm(f=>({...f,motorisation:e.target.value}))}>{MOTORISATIONS.map(m=><option key={m}>{m}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>Boîte</label><select style={INP_STYLE()} value={vForm.boite} onChange={e=>setVForm(f=>({...f,boite:e.target.value}))}>{BOITES.map(b=><option key={b}>{b}</option>)}</select></div>
                  <div><label style={LBL_STYLE}>N° VIN</label><input style={INP_STYLE()} placeholder="VF1RFD..." value={vForm.vin||""} onChange={e=>setVForm(f=>({...f,vin:e.target.value.toUpperCase()}))}/></div>
                  <div><label style={LBL_STYLE}>Nb portes</label><input type="number" style={INP_STYLE()} placeholder="5" value={vForm.nbPortes||""} onChange={e=>setVForm(f=>({...f,nbPortes:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>Nb places</label><input type="number" style={INP_STYLE()} placeholder="5" value={vForm.nbPlaces||""} onChange={e=>setVForm(f=>({...f,nbPlaces:e.target.value}))}/></div>
                  <div><label style={LBL_STYLE}>N° parc</label><input style={INP_STYLE()} placeholder="001" value={vForm.numParc||""} onChange={e=>setVForm(f=>({...f,numParc:e.target.value}))}/></div>
                  {[["km","Km actuel"],["tarif","Tarif "+sym+"/j"],["caution","Caution "+sym],["kmInclus","Km inclus"],["prixKmSup","Prix km sup "+sym]].map(([k,l])=>(
                    <div key={k}><label style={LBL_STYLE}>{l}</label><input type="number" style={INP_STYLE()} value={vForm[k]} onChange={e=>setVForm(f=>({...f,[k]:e.target.value.replace(/\D/g,"")}))} inputMode="numeric"/></div>
                  ))}
                </div>
                <div style={{marginTop:10}}>
                  <label style={{display:"flex",alignItems:"center",gap:6,fontSize:12,cursor:"pointer"}}><input type="checkbox" checked={vForm.kmIllimite} onChange={e=>setVForm(f=>({...f,kmIllimite:e.target.checked}))}/><span>Km illimité</span></label>
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
                    <div style={{display:"flex",gap:4,alignItems:"center"}}><Badge s={statut(v.id)}/>{v.publie&&<span style={{fontSize:9,background:"#2563eb",color:"white",borderRadius:99,padding:"2px 6px",fontWeight:700}}>EN LIGNE</span>}</div>
                  </div>
                  <div style={{padding:14}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                      {[["Tarif",v.tarif+" "+sym+"/j"],["Caution",v.caution+" "+sym],["Km inclus",v.kmInclus+" km"],["Km sup",v.prixKmSup+" "+sym+"/km"],["Km actuel",(v.km||0).toLocaleString()+" km"]].map(([l,val])=>(
                        <div key={l} style={{background:"#f8fafc",borderRadius:8,padding:"7px 10px"}}><div style={{fontSize:9,color:"#9ca3af"}}>{l}</div><div style={{fontWeight:700,fontSize:12}}>{val}</div></div>
                      ))}
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <button onClick={()=>setPhotosVehicleModal(v)} style={{flex:1,padding:"6px 0",background:"#fdf4ff",color:"#9333ea",border:"1px solid #e9d5ff",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Photos{(v.photosVehicule||[]).length>0?" ("+(v.photosVehicule.length)+")":""}</button>
                      <button onClick={()=>openTarifs(v)} style={{flex:1,padding:"6px 0",background:"#fff7ed",color:"#d97706",border:"1px solid #fed7aa",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Tarifs</button>
                      <button onClick={()=>setContratModalId(v.id)} style={{flex:1,padding:"6px 0",background:"#eff6ff",color:"#2563eb",border:"1px solid #bfdbfe",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Clauses</button>
                      <button onClick={()=>setDocsId(v.id)} style={{flex:1,padding:"6px 0",background:"#f0fdf4",color:"#16a34a",border:"1px solid #bbf7d0",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Docs</button>
                      <button onClick={()=>{setEditV(v);setVForm({typeVehicule:v.typeVehicule||"voiture",marque:v.marque,modele:v.modele,immat:v.immat,couleur:v.couleur||"",annee:v.annee||"",km:v.km,tarif:v.tarif,caution:v.caution,kmInclus:v.kmInclus||0,prixKmSup:v.prixKmSup||0,kmIllimite:v.kmIllimite||false,motorisation:"Essence",boite:"Manuelle",puissanceFiscale:"",vin:v.vin||"",nbPortes:v.nbPortes||"",nbPlaces:v.nbPlaces||"",numParc:v.numParc||"",description:"",locationMin48:false});setShowAddV(true);}} style={{padding:"6px 10px",background:"#f5f3ff",color:"#7c3aed",border:"1px solid #ddd6fe",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>Editer</button>
                      <button onClick={async()=>{if(window.confirm("Supprimer ?")){setVehicles(vs=>vs.filter(x=>x.id!==v.id));if(user)await supabase.from('vehicules').delete().eq('id',v.id).eq('user_id',user.id);}}} style={{padding:"6px 10px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:11,cursor:"pointer"}}>X</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CONTRATS HUB */}
        {page==="contrats_hub"&&(
          <div>
            <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937",marginBottom:20}}>Contrats</h1>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:24}}>
              {[{id:"nouveau",icon:"📝",label:"Nouveau contrat",desc:"Créer un contrat de location",color:"#1e3a8a",bg:"#eff6ff",border:"#bfdbfe"},{id:"retours",icon:"🔄",label:"Retours",desc:"Gérer les retours de véhicules",color:"#16a34a",bg:"#f0fdf4",border:"#bbf7d0"},{id:"contrats",icon:"📋",label:"Historique",desc:"Voir tous les contrats",color:"#7c3aed",bg:"#f5f3ff",border:"#ddd6fe"}].map(x=>(
                <div key={x.id} onClick={()=>setPage(x.id)} style={{background:x.bg,borderRadius:16,padding:24,border:`2px solid ${x.border}`,cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.12)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.06)";}}>
                  <div style={{fontSize:40,marginBottom:12}}>{x.icon}</div>
                  <div style={{fontWeight:800,fontSize:15,color:x.color,marginBottom:4}}>{x.label}</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>{x.desc}</div>
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:20}}>
              <div style={{background:"white",borderRadius:12,padding:"12px 16px",boxShadow:"0 2px 6px rgba(0,0,0,.06)",borderLeft:"4px solid #1e3a8a"}}><div style={{fontSize:10,color:"#6b7280"}}>Total contrats</div><div style={{fontSize:22,fontWeight:800}}>{contrats.length}</div></div>
              <div style={{background:"white",borderRadius:12,padding:"12px 16px",boxShadow:"0 2px 6px rgba(0,0,0,.06)",borderLeft:"4px solid #16a34a"}}><div style={{fontSize:10,color:"#6b7280"}}>Retours effectués</div><div style={{fontSize:22,fontWeight:800}}>{Object.keys(retours).length}</div></div>
              <div style={{background:"white",borderRadius:12,padding:"12px 16px",boxShadow:"0 2px 6px rgba(0,0,0,.06)",borderLeft:"4px solid #d97706"}}><div style={{fontSize:10,color:"#6b7280"}}>En attente</div><div style={{fontSize:22,fontWeight:800,color:"#d97706"}}>{contrats.filter(c=>!retours[c.id]).length}</div></div>
              <div style={{background:"white",borderRadius:12,padding:"12px 16px",boxShadow:"0 2px 6px rgba(0,0,0,.06)",borderLeft:"4px solid #2563eb"}}><div style={{fontSize:10,color:"#6b7280"}}>CA total</div><div style={{fontSize:22,fontWeight:800,color:"#2563eb"}}>{caT} {sym}</div></div>
            </div>
            {contrats.filter(c=>!retours[c.id]).length>0&&(
              <div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:"1px solid #fde68a"}}>
                <div style={{fontWeight:800,fontSize:13,color:"#b45309",marginBottom:10}}>🔄 Contrats en cours ({contrats.filter(c=>!retours[c.id]).length})</div>
                {contrats.filter(c=>!retours[c.id]).map(c=>(
                  <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #f9fafb",gap:8,flexWrap:"wrap"}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:13}}>{c.locNom}</div>
                      <div style={{fontSize:11,color:"#6b7280"}}>{c.vehicleLabel} · fin le <b style={{color:"#dc2626"}}>{c.dateFin}</b></div>
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>ouvrirProlon(c)} style={{padding:"5px 10px",background:"#fef3c7",color:"#b45309",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>⏳ Prolonger</button>
                      <button onClick={()=>setRetourContratId(c.id)} style={{padding:"5px 10px",background:"#f0fdf4",color:"#16a34a",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>Retour</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* NOUVEAU CONTRAT */}
        {page==="nouveau"&&(
          <div style={{maxWidth:680,margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
              <button onClick={()=>setPage("contrats_hub")} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>← Retour</button>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Nouveau contrat</h1>
            </div>
            <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
              <h3 style={{fontWeight:700,fontSize:13,marginBottom:10}}>Véhicule</h3>
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {vehicles.map(v=>(
                  <div key={v.id} onClick={()=>setSelId(v.id===selId?null:v.id)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderRadius:10,border:`2px solid ${selId===v.id?"#2563eb":"#e5e7eb"}`,background:selId===v.id?"#eff6ff":"#f9fafb",cursor:"pointer"}}>
                    <div><div style={{fontWeight:700,fontSize:13}}>{v.marque} {v.modele}</div><div style={{fontSize:10,color:"#6b7280"}}>{v.immat} · {v.couleur}</div></div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge s={statut(v.id)}/><span style={{fontWeight:700,fontSize:12,color:"#2563eb"}}>{v.tarif} {sym}/j</span></div>
                  </div>
                ))}
              </div>
            </div>
            {sel&&(
              <div>
                <div style={{background:"#1e3a8a",borderRadius:12,padding:"12px 16px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{color:"rgba(255,255,255,.7)",fontSize:10}}>Tarif calculé</div><div style={{color:"white",fontSize:11,marginTop:2}}>{tarifAuto.label}</div></div>
                  <div style={{color:"#4ade80",fontWeight:900,fontSize:22}}>{tarifAuto.prix} {sym}</div>
                </div>
                <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                  <h3 style={{fontWeight:700,fontSize:13,marginBottom:10}}>Locataire</h3>
                  <div style={{marginBottom:12,position:"relative"}}>
                    <label style={LBL_STYLE}>🔍 Rechercher un client existant</label>
                    <input style={INP_STYLE({background:"#eff6ff",borderColor:"#bfdbfe"})} placeholder="Nom ou téléphone..." value={searchClientContrat} onChange={e=>{setSearchClientContrat(e.target.value);setShowClientSuggestions(true);}} onFocus={()=>setShowClientSuggestions(true)}/>
                    {showClientSuggestions&&clientSuggestions.length>0&&(
                      <div style={{position:"absolute",top:"100%",left:0,right:0,background:"white",border:"1px solid #e5e7eb",borderRadius:10,boxShadow:"0 8px 24px rgba(0,0,0,.12)",zIndex:100,maxHeight:200,overflowY:"auto"}}>
                        {clientSuggestions.map(c=>(
                          <div key={c.key} onClick={()=>{const parts=(c.nom||"").trim().split(" ");setForm(f=>({...f,locPrenom:parts[0]||"",locNom:parts.slice(1).join(" ")||"",locTel:c.tel,locAdresse:c.adresse||"",locEmail:c.email||"",locPermis:c.permis||""}));setDocsLocataire({...c.docs});setSearchClientContrat(c.nom);setShowClientSuggestions(false);toast_("Client chargé !");}} style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center"}} onMouseEnter={e=>e.currentTarget.style.background="#f8fafc"} onMouseLeave={e=>e.currentTarget.style.background="white"}>
                            <div><div style={{fontWeight:700,fontSize:13}}>{c.nom}</div><div style={{fontSize:11,color:"#6b7280"}}>{c.tel}</div></div>
                            <div style={{fontSize:10,background:"#eff6ff",color:"#2563eb",borderRadius:6,padding:"2px 6px"}}>{contrats.filter(x=>x.locNom===c.nom).length} contrat{contrats.filter(x=>x.locNom===c.nom).length>1?"s":""}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div><label style={LBL_STYLE}>Prénom *</label><input style={INP_STYLE()} placeholder="Prénom" value={form.locPrenom} onChange={e=>setForm(f=>({...f,locPrenom:e.target.value}))}/></div>
                    <div>
                      <label style={LBL_STYLE}>Nom *</label>
                      <input style={INP_STYLE(inv("locNom")?{borderColor:"#f87171",background:"#fef2f2"}:{})} placeholder="Nom" value={form.locNom} onChange={e=>setForm(f=>({...f,locNom:e.target.value}))} onBlur={()=>setTouched(t=>({...t,locNom:true}))}/>
                      {inv("locNom")&&<p style={{color:"#ef4444",fontSize:10,marginTop:2}}>Obligatoire</p>}
                    </div>
                    <div style={{gridColumn:"span 2"}}><label style={LBL_STYLE}>Entreprise (optionnel)</label><input style={INP_STYLE()} placeholder="Nom de la société" value={form.locEntreprise||""} onChange={e=>setForm(f=>({...f,locEntreprise:e.target.value}))}/></div>
                    <F k="locAdresse" label="Adresse *" span2 form={form} setForm={setForm} touched={touched} setTouched={setTouched} req={req}/>
                  <F k="locCodePostal" label="Code postal" form={form} setForm={setForm} touched={touched} setTouched={setTouched} req={req}/>
                  <F k="locVille" label="Ville" form={form} setForm={setForm} touched={touched} setTouched={setTouched} req={req}/>
                    <div style={{gridColumn:"span 2"}}>
                      <label style={LBL_STYLE}>Téléphone *</label>
                      <TelInput value={form.locTel} onChange={v=>setForm(f=>({...f,locTel:v}))} placeholder="06 12 34 56 78"/>
                      {inv("locTel")&&<p style={{color:"#ef4444",fontSize:10,marginTop:2}}>Obligatoire</p>}
                    </div>
                    <F k="locEmail" label="Email" type="email" form={form} setForm={setForm} touched={touched} setTouched={setTouched} req={req}/>
                    <F k="locPermis" label="N° Permis" form={form} setForm={setForm} touched={touched} setTouched={setTouched} req={req}/>
                    <div style={{gridColumn:"span 2"}}><label style={LBL_STYLE}>Réseaux sociaux</label><input style={INP_STYLE()} placeholder="Instagram, Snapchat..." value={form.locReseaux||""} onChange={e=>setForm(f=>({...f,locReseaux:e.target.value}))}/></div>
                  </div>
                  <div style={{marginTop:12,padding:12,background:"#f8fafc",borderRadius:10,border:"1px solid #e5e7eb"}}>
                    <div style={{fontWeight:600,fontSize:12,color:"#6b7280",marginBottom:8}}>Deuxième conducteur (optionnel)</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div><label style={LBL_STYLE}>Prénom</label><input style={INP_STYLE()} placeholder="Prénom" value={form.loc2Prenom||""} onChange={e=>setForm(f=>({...f,loc2Prenom:e.target.value}))}/></div>
                      <div><label style={LBL_STYLE}>Nom</label><input style={INP_STYLE()} placeholder="Nom" value={form.loc2Nom||""} onChange={e=>setForm(f=>({...f,loc2Nom:e.target.value}))}/></div>
                    </div>
                  </div>
                </div>
                <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                  <h3 style={{fontWeight:700,fontSize:13,marginBottom:4}}>Documents du locataire</h3>
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
                  <h3 style={{fontWeight:700,fontSize:13,marginBottom:4}}>Photos au départ</h3>
                  <p style={{fontSize:11,color:"#6b7280",marginBottom:12}}>{photosDepart.length} photo{photosDepart.length>1?"s":""}</p>
                  <PhotosDepart photos={photosDepart} setPhotos={setPhotosDepart}/>
                </div>
                <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                  <h3 style={{fontWeight:700,fontSize:13,marginBottom:12}}>💰 Récapitulatif du prix</h3>
                  <div style={{background:"#eff6ff",borderRadius:10,padding:12,marginBottom:10,border:"1px solid #bfdbfe"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#1e3a8a"}}>💲 Tarification</div>
                      <div style={{fontSize:10,color:"#6b7280"}}>{tarifAuto.label}</div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div><label style={LBL_STYLE}>Prix/jour modifié ({sym})</label><input type="number" style={INP_STYLE({background:"white"})} placeholder={sel?.tarif||"0"} value={form.prixJourModifie||""} onChange={e=>setForm(f=>({...f,prixJourModifie:e.target.value}))}/></div>
                      <div style={{display:"flex",alignItems:"flex-end"}}><div style={{width:"100%",background:"#1e3a8a",borderRadius:8,padding:"8px 10px",textAlign:"center"}}><div style={{fontSize:9,color:"rgba(255,255,255,.6)"}}>Sous-total</div><div style={{fontSize:18,fontWeight:900,color:"#4ade80"}}>{tarifAuto.prix} {sym}</div></div></div>
                    </div>
                  </div>
                  <div style={{background:"#fef3c7",borderRadius:10,padding:12,marginBottom:10,border:"1px solid #fde68a"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:6}}>🛡️ Caution — {sel?.caution||0} {sym}</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                      <div><label style={LBL_STYLE}>Mode paiement</label><select style={INP_STYLE({background:"white"})} value={form.paiement} onChange={e=>setForm(f=>({...f,paiement:e.target.value}))}><option value="especes">💵 Espèces</option><option value="cb">💳 CB</option><option value="cheque">📄 Chèque</option><option value="virement">🏦 Virement</option><option value="autre">… Autre</option></select></div>
                      <div><label style={LBL_STYLE}>Mode caution</label><select style={INP_STYLE({background:"white"})} value={form.cautionMode} onChange={e=>setForm(f=>({...f,cautionMode:e.target.value}))}><option value="especes">💵 Espèces</option><option value="cb">💳 CB</option><option value="cheque">📄 Chèque</option><option value="virement">🏦 Virement</option><option value="emprunt">🤝 Emprunt</option><option value="autre">… Autre</option></select></div>
                    </div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div><label style={LBL_STYLE}>💳 Accompte ({sym})</label><input type="number" style={INP_STYLE()} placeholder="0" value={form.accompte||""} onChange={e=>setForm(f=>({...f,accompte:e.target.value}))}/></div>
                    <div><label style={LBL_STYLE}>🏷️ Remise ({sym})</label><input type="number" style={INP_STYLE()} placeholder="0" value={form.remise||""} onChange={e=>setForm(f=>({...f,remise:e.target.value}))}/></div>
                    <div style={{gridColumn:"span 2"}}><label style={LBL_STYLE}>🎟️ Code promo</label><input style={INP_STYLE()} placeholder="Ex: PROMO10" value={form.codePromo||""} onChange={e=>setForm(f=>({...f,codePromo:e.target.value.toUpperCase()}))}/></div>
                  </div>
                  <div style={{background:"#0a1940",borderRadius:10,padding:12,color:"white"}}>
                    {remise>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,opacity:.7,marginBottom:4}}><span>Remise</span><span>- {remise} {sym}</span></div>}
                    {accompte>0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:11,opacity:.7,marginBottom:4}}><span>Accompte</span><span>- {accompte} {sym}</span></div>}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12}}>Total ({form.nbJours}j)</span><span style={{fontWeight:900,fontSize:18,color:"#4ade80"}}>{totalNet} {sym}</span></div>
                    {accompte>0&&<div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.2)",marginTop:6,paddingTop:6}}><span style={{fontSize:12,fontWeight:700}}>Reste à payer</span><span style={{fontWeight:900,fontSize:16,color:"#fbbf24"}}>{resteAPayer} {sym}</span></div>}
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
              </div>
            )}
            {lastContrat&&(
              <div style={{marginTop:16,background:"#f0fdf4",borderRadius:14,padding:16,border:"2px solid #86efac"}}>
                <div style={{fontWeight:700,color:"#16a34a",marginBottom:8}}>✅ Contrat créé pour {lastContrat.contrat.locNom}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button onClick={()=>dlPDF(lastContrat.html)} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>📄 Imprimer / PDF</button>
                  <button onClick={()=>setLastContrat(null)} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"8px 12px",fontSize:12,cursor:"pointer"}}>Fermer</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PLANNING */}
        {page==="planning"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Planning</h1>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <div style={{display:"flex",background:"white",borderRadius:8,border:"1px solid #e5e7eb",overflow:"hidden"}}>
                  <button onClick={()=>setPlanView("calendrier")} style={{padding:"6px 12px",fontSize:11,fontWeight:planView==="calendrier"?700:400,background:planView==="calendrier"?"#1e3a8a":"white",color:planView==="calendrier"?"white":"#374151",border:"none",cursor:"pointer"}}>Calendrier</button>
                  <button onClick={()=>setPlanView("gantt")} style={{padding:"6px 12px",fontSize:11,fontWeight:planView==="gantt"?700:400,background:planView==="gantt"?"#1e3a8a":"white",color:planView==="gantt"?"white":"#374151",border:"none",cursor:"pointer"}}>Gantt</button>
                </div>
                {planView==="calendrier"&&(
                  <>
                    <button onClick={()=>{const d=new Date(planMonth);d.setMonth(d.getMonth()-1);setPlanMonth(new Date(d));}} style={{padding:"5px 12px",background:"white",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:700}}>◀</button>
                    <span style={{fontWeight:700,fontSize:13,minWidth:130,textAlign:"center",textTransform:"capitalize"}}>{planMonth.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}</span>
                    <button onClick={()=>{const d=new Date(planMonth);d.setMonth(d.getMonth()+1);setPlanMonth(new Date(d));}} style={{padding:"5px 12px",background:"white",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:700}}>▶</button>
                  </>
                )}
                {planView==="gantt"&&(
                  <>
                    <button onClick={ganttPrevMonth} style={{padding:"5px 12px",background:"white",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:700}}>◀</button>
                    <select value={`${ganttStartDate.getFullYear()}-${ganttStartDate.getMonth()}`} onChange={e=>{const[y,m]=e.target.value.split("-");setGanttStartDate(new Date(parseInt(y),parseInt(m),1));}} style={{padding:"5px 8px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:12}}>
                      {Array.from({length:24},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-12+i);return d;}).map(d=><option key={`${d.getFullYear()}-${d.getMonth()}`} value={`${d.getFullYear()}-${d.getMonth()}`}>{MONTH_NAMES[d.getMonth()]} {d.getFullYear()}</option>)}
                    </select>
                    <button onClick={ganttNextMonth} style={{padding:"5px 12px",background:"white",border:"1px solid #e5e7eb",borderRadius:8,cursor:"pointer",fontWeight:700}}>▶</button>
                    <button onClick={ganttGoToday} style={{padding:"5px 12px",background:"#1e3a8a",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700}}>Aujourd'hui</button>
                  </>
                )}
              </div>
            </div>
            {planView==="calendrier"&&vehicles.map((v,vi)=>{
              const vContrats=contrats.filter(c=>c.vehicleId===v.id);
              const vColor=ganttColors[vi%ganttColors.length];
              return(
                <div key={v.id} style={{background:"white",borderRadius:14,marginBottom:14,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:`1px solid #e5e7eb`,borderLeft:`4px solid ${vColor}`}}>
                  <div style={{background:"linear-gradient(135deg,#0a1940,#1e3a8a)",padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><span style={{color:"white",fontWeight:800,fontSize:13}}>{v.marque} {v.modele}</span><span style={{color:"rgba(255,255,255,.6)",fontSize:11,marginLeft:10}}>{v.immat}</span></div>
                    <Badge s={statut(v.id)}/>
                  </div>
                  <div style={{overflowX:"auto"}}>
                    <div style={{display:"flex",minWidth:days.length*28+130}}>
                      <div style={{width:130,flexShrink:0}}/>
                      {days.map(d=>{
                        const isToday=d.toDateString()===new Date().toDateString();
                        const isWE=d.getDay()===0||d.getDay()===6;
                        return <div key={d.getTime()} style={{width:28,flexShrink:0,textAlign:"center",padding:"5px 0",fontSize:10,fontWeight:isToday?800:400,color:isToday?"#2563eb":isWE?"#9ca3af":"#6b7280",background:isToday?"#eff6ff":isWE?"#fafafa":"white",borderLeft:"1px solid #f0f0f0"}}>{d.getDate()}</div>;
                      })}
                    </div>
                    <div style={{display:"flex",minWidth:days.length*28+130,padding:"4px 0"}}>
                      <div style={{width:130,flexShrink:0,padding:"0 8px",fontSize:10,fontWeight:600,color:"#374151",display:"flex",alignItems:"center"}}>Disponibilite</div>
                      {days.map(d=>{
                        const b=isBooked(v.id,d);
                        return <div key={d.getTime()} style={{width:28,flexShrink:0,height:28,display:"flex",alignItems:"center",justifyContent:"center",background:b?vColor+"22":"white",borderLeft:"1px solid #f0f0f0"}}><div style={{width:20,height:20,borderRadius:4,background:b?vColor:"#dcfce7"}}/></div>;
                      })}
                    </div>
                  </div>
                  {vContrats.length>0&&(
                    <div style={{padding:"8px 12px",borderTop:"1px solid #f0f0f0",display:"flex",flexWrap:"wrap",gap:6}}>
                      {vContrats.map(c=>{
                        const mStart=new Date(c.dateDebut).getMonth(),mEnd=new Date(c.dateFin).getMonth(),y=planMonth.getMonth();
                        if(mStart!==y&&mEnd!==y)return null;
                        return <div key={c.id} style={{background:vColor+"18",borderRadius:8,padding:"4px 10px",fontSize:11,border:`1px solid ${vColor}44`}}><span style={{fontWeight:700,color:vColor}}>{c.locNom}</span><span style={{color:"#6b7280",marginLeft:6}}>{c.dateDebut} → {c.dateFin}</span></div>;
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {planView==="gantt"&&(
              <div style={{background:"white",borderRadius:14,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <div ref={ganttRef} style={{overflowX:"auto"}}>
                  <div style={{minWidth:150+ganttDays*DW}}>
                    <div style={{display:"flex",borderBottom:"2px solid #e5e7eb",background:"#f8fafc"}}>
                      <div style={{width:150,flexShrink:0,padding:"6px 10px",fontSize:11,fontWeight:700,borderRight:"1px solid #e5e7eb"}}>Véhicule</div>
                      {ganttDates.map((d,i)=>{
                        const isToday=d.toDateString()===today.toDateString();
                        const isWE=d.getDay()===0||d.getDay()===6;
                        const isFirst=d.getDate()===1;
                        return(
                          <div key={i} style={{width:DW,flexShrink:0,textAlign:"center",padding:"4px 0",fontSize:9,color:isToday?"white":isWE?"#9ca3af":"#6b7280",background:isToday?"#2563eb":isWE?"#f0f0f0":"#f8fafc",borderLeft:"1px solid #e8e8e8",position:"relative",fontWeight:isToday?800:400}}>
                            {isFirst&&!isToday&&<div style={{position:"absolute",top:0,left:0,right:0,background:"#1e3a8a",color:"white",fontSize:7,textAlign:"center",lineHeight:"10px"}}>{MONTH_NAMES[d.getMonth()]}</div>}
                            <span style={{position:"relative",top:isFirst&&!isToday?8:0}}>{d.getDate()}</span>
                          </div>
                        );
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
                          {ganttDates.map((d,i)=>{
                            const isWE=d.getDay()===0||d.getDay()===6;
                            return <div key={i} style={{position:"absolute",left:i*DW,top:0,width:DW,height:"100%",background:isWE?"rgba(0,0,0,.025)":"transparent",borderLeft:"1px solid #f5f5f5"}}/>;
                          })}
                          {contrats.filter(c=>c.vehicleId===v.id&&c.dateDebut&&c.dateFin).map((c,ci)=>{
                            const s=new Date(c.dateDebut),e=new Date(c.dateFin);
                            const off=Math.floor((s-ganttStartDate)/86400000);
                            const w=Math.max(Math.ceil((e-s)/86400000)+1,1);
                            if(off>ganttDays||off+w<0)return null;
                            return(
                              <div key={c.id} style={{position:"absolute",left:Math.max(0,off)*DW+2,top:8,height:28,width:Math.max(Math.min(w+off,ganttDays)-Math.max(off,0),1)*DW-4,background:ganttColors[ci%ganttColors.length],borderRadius:6,display:"flex",alignItems:"center",padding:"0 6px",overflow:"hidden",zIndex:1,cursor:"pointer"}} title={c.locNom+" — "+c.dateDebut+" → "+c.dateFin}>
                                <span style={{color:"white",fontSize:9,fontWeight:700,whiteSpace:"nowrap"}}>{c.locNom}</span>
                              </div>
                            );
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

        {/* HISTORIQUE CONTRATS */}
        {page==="contrats"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <button onClick={()=>setPage("contrats_hub")} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>← Retour</button>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Historique ({contratsFiltres.length}/{contrats.length})</h1>
            </div>
            <div style={{background:"white",borderRadius:12,padding:14,marginBottom:14,display:"flex",flexDirection:"column",gap:8}}>
              <input placeholder="🔍 Nom, immat, téléphone..." style={INP_STYLE()} value={searchContrat} onChange={e=>setSearchContrat(e.target.value)}/>
              <div><label style={LBL_STYLE}>Véhicule</label><select style={INP_STYLE()} value={filterVehicleContrat} onChange={e=>setFilterVehicleContrat(e.target.value)}><option value="">Tous</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.marque} {v.modele} — {v.immat}</option>)}</select></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div><label style={LBL_STYLE}>Début après</label><input type="date" style={INP_STYLE()} value={filterDateDebut} onChange={e=>setFilterDateDebut(e.target.value)}/></div>
                <div><label style={LBL_STYLE}>Fin avant</label><input type="date" style={INP_STYLE()} value={filterDateFin} onChange={e=>setFilterDateFin(e.target.value)}/></div>
              </div>
              {(searchContrat||filterVehicleContrat||filterDateDebut||filterDateFin)&&<div><button onClick={()=>{setSearchContrat("");setFilterVehicleContrat("");setFilterDateDebut("");setFilterDateFin("");}} style={{padding:"5px 12px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:7,fontSize:11,cursor:"pointer",fontWeight:700}}>✕ Effacer</button></div>}
            </div>
            {contratsFiltres.length===0
              ?<div style={{textAlign:"center",color:"#9ca3af",padding:40,background:"white",borderRadius:14}}><p>Aucun contrat trouvé</p></div>
              :contratsFiltres.map(c=>{
                const r=retours[c.id];
                const dl=c.docsLocataire||{};
                const nbDocs=[dl.cniRecto,dl.cniVerso,dl.justifDom,dl.photoAr].filter(Boolean).length;
                return(
                  <div key={c.id} style={{background:"white",borderRadius:14,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:"1px solid #e5e7eb"}}>
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
                        <div style={{fontWeight:900,fontSize:18,color:"#1e3a8a"}}>{c.totalCalc} {sym}</div>
                        {r&&<div style={{fontSize:10,color:"#16a34a",fontWeight:600}}>✅ Retour OK</div>}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <button onClick={()=>rePrint(c)} style={{padding:"5px 10px",background:"#eff6ff",color:"#2563eb",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>📄 PDF</button>
                      {!r&&<button onClick={()=>setRetourContratId(c.id)} style={{padding:"5px 10px",background:"#f0fdf4",color:"#16a34a",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>Retour</button>}
                      {!r&&<button onClick={()=>ouvrirProlon(c)} style={{padding:"5px 10px",background:"#fef3c7",color:"#b45309",border:"none",borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer"}}>⏳ Prolonger</button>}
                      {r&&<button onClick={()=>reDownloadPV(c)} style={{padding:"5px 10px",background:"#fef3c7",color:"#d97706",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>📄 PV</button>}
                      <button onClick={()=>{const cl=clients.find(x=>x.nom===c.locNom&&x.tel===c.locTel);if(cl)setSelectedClient(cl);}} style={{padding:"5px 10px",background:"#f5f3ff",color:"#7c3aed",border:"none",borderRadius:7,fontSize:11,fontWeight:600,cursor:"pointer"}}>👤 Fiche</button>
                      <button onClick={async()=>{if(window.confirm("Supprimer ?")){setContrats(cs=>cs.filter(x=>x.id!==c.id));if(user)await supabase.from('contrats').delete().eq('id',c.id).eq('user_id',user.id);}}} style={{padding:"5px 10px",background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:7,fontSize:11,cursor:"pointer"}}>Supprimer</button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* RETOURS */}
        {page==="retours"&&(
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <button onClick={()=>setPage("contrats_hub")} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer",fontWeight:600}}>← Retour</button>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Retours</h1>
            </div>
            {contrats.filter(c=>!retours[c.id]).length>0&&(
              <div style={{marginBottom:16}}>
                <h2 style={{fontSize:13,fontWeight:700,color:"#6b7280",marginBottom:8}}>En attente ({contrats.filter(c=>!retours[c.id]).length})</h2>
                {contrats.filter(c=>!retours[c.id]).map(c=>(
                  <div key={c.id} style={{background:"white",borderRadius:12,padding:12,marginBottom:8,border:"1px solid #fde68a",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <div><div style={{fontWeight:700}}>{c.locNom}</div><div style={{fontSize:11,color:"#6b7280"}}>{c.vehicleLabel} · {c.dateDebut} → {c.dateFin}</div></div>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>ouvrirProlon(c)} style={{background:"#fef3c7",color:"#b45309",border:"none",borderRadius:8,padding:"7px 10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>⏳ Prolonger</button>
                      <button onClick={()=>setRetourContratId(c.id)} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"7px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Faire le retour</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {contrats.filter(c=>retours[c.id]).length>0&&(
              <div>
                <h2 style={{fontSize:13,fontWeight:700,color:"#6b7280",marginBottom:8}}>Retours effectués</h2>
                <div style={{background:"white",borderRadius:12,padding:12,marginBottom:12,display:"flex",flexDirection:"column",gap:8}}>
                  <input placeholder="🔍 Nom, immat..." style={INP_STYLE()} value={searchRetour} onChange={e=>setSearchRetour(e.target.value)}/>
                  <div><label style={LBL_STYLE}>Véhicule</label><select style={INP_STYLE()} value={filterVehicleRetour} onChange={e=>setFilterVehicleRetour(e.target.value)}><option value="">Tous</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.marque} {v.modele}</option>)}</select></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div><label style={LBL_STYLE}>Après</label><input type="date" style={INP_STYLE()} value={filterRetourDateDebut} onChange={e=>setFilterRetourDateDebut(e.target.value)}/></div>
                    <div><label style={LBL_STYLE}>Avant</label><input type="date" style={INP_STYLE()} value={filterRetourDateFin} onChange={e=>setFilterRetourDateFin(e.target.value)}/></div>
                  </div>
                  {(searchRetour||filterVehicleRetour||filterRetourDateDebut||filterRetourDateFin)&&<div><button onClick={()=>{setSearchRetour("");setFilterVehicleRetour("");setFilterRetourDateDebut("");setFilterRetourDateFin("");}} style={{padding:"5px 12px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:7,fontSize:11,cursor:"pointer",fontWeight:700}}>✕ Effacer</button></div>}
                </div>
                {retoursFiltres.map(c=>{
                  const r=retours[c.id];
                  return(
                    <div key={c.id} style={{background:"white",borderRadius:12,padding:14,marginBottom:8,border:"1px solid #e5e7eb"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div>
                          <div style={{fontWeight:700}}>{c.locNom}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>{c.vehicleLabel} · {c.dateDebut} → {c.dateFin}</div>
                          {r.date&&<div style={{fontSize:10,color:"#9ca3af"}}>Retour le {new Date(r.date).toLocaleDateString("fr-FR")}</div>}
                          <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                            {r.kmRetour&&<span style={{fontSize:10,background:"#eff6ff",color:"#2563eb",borderRadius:6,padding:"2px 7px",fontWeight:600}}>{r.kmRetour} km</span>}
                            {r.montantRetenu>0&&<span style={{fontSize:10,background:"#fef2f2",color:"#dc2626",borderRadius:6,padding:"2px 7px",fontWeight:600}}>Retenu : {r.montantRetenu} {sym}</span>}
                            {r.cautionRestituee&&<span style={{fontSize:10,background:"#f0fdf4",color:"#16a34a",borderRadius:6,padding:"2px 7px",fontWeight:600}}>Caution OK</span>}
                          </div>
                        </div>
                        <div style={{fontWeight:900,fontSize:16,color:"#16a34a"}}>{((c.totalCalc||0)+(r.surplusKm||0)+(r.montantRetenu||0)).toFixed(0)} {sym}</div>
                      </div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <button onClick={()=>reDownloadPV(c)} style={{padding:"6px 12px",background:"#fbbf24",color:"#1f2937",border:"none",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>📄 PV PDF</button>
                        <button onClick={()=>supprimerRetour(c.id)} style={{padding:"6px 12px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer"}}>🗑️ Supprimer</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {contrats.length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:40}}><p>Aucun contrat enregistré.</p></div>}
          </div>
        )}

        {/* AMENDES */}
        {page==="amendes"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Amendes</h1>
              <button onClick={()=>setShowAddAmende(!showAddAmende)} style={{background:"#dc2626",color:"white",border:"none",borderRadius:10,padding:"8px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
            </div>
            {showAddAmende&&(()=>{
              const contratRef=findContratForAmende(amendeForm.vehicleId,amendeForm.date,amendeForm.heure);
              return(
                <div style={{background:"white",borderRadius:14,padding:18,marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,.1)",border:"2px solid #fecaca"}}>
                  <h3 style={{fontWeight:700,fontSize:14,marginBottom:12,color:"#dc2626"}}>Nouvelle amende</h3>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:10}}>
                    <div><label style={LBL_STYLE}>Véhicule *</label><select style={INP_STYLE()} value={amendeForm.vehicleId} onChange={e=>setAmendeForm(f=>({...f,vehicleId:e.target.value}))}><option value="">-- Choisir --</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.marque} {v.modele} — {v.immat}</option>)}</select></div>
                    <div><label style={LBL_STYLE}>Date *</label><input type="date" style={INP_STYLE()} value={amendeForm.date} onChange={e=>setAmendeForm(f=>({...f,date:e.target.value}))}/></div>
                    <div><label style={LBL_STYLE}>Heure</label><input type="time" style={INP_STYLE()} value={amendeForm.heure} onChange={e=>setAmendeForm(f=>({...f,heure:e.target.value}))}/></div>
                    <div><label style={LBL_STYLE}>Type</label><select style={INP_STYLE()} value={amendeForm.type} onChange={e=>setAmendeForm(f=>({...f,type:e.target.value}))}>{TYPES_AMENDE.map(t=><option key={t}>{t}</option>)}</select></div>
                    <div><label style={LBL_STYLE}>Montant ({sym})</label><input type="number" style={INP_STYLE()} value={amendeForm.montant} onChange={e=>setAmendeForm(f=>({...f,montant:e.target.value.replace(/\D/g,"")}))} inputMode="numeric"/></div>
                    <div><label style={LBL_STYLE}>Statut</label><select style={INP_STYLE()} value={amendeForm.statut} onChange={e=>setAmendeForm(f=>({...f,statut:e.target.value}))}>{STATUTS_AMENDE.map(s=><option key={s}>{s}</option>)}</select></div>
                  </div>
                  <div style={{marginBottom:10}}><label style={LBL_STYLE}>Notes</label><textarea style={{...INP_STYLE(),resize:"vertical",fontFamily:"inherit"}} rows={2} value={amendeForm.notes} onChange={e=>setAmendeForm(f=>({...f,notes:e.target.value}))}/></div>
                  <div style={{marginBottom:10}}>
                    <label style={LBL_STYLE}>📷 Photo de l'amende</label>
                    {amendeForm.photoData
                      ?<div style={{position:"relative",display:"inline-block",marginTop:4}}>
                        <img src={amendeForm.photoData} alt="amende" style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:10,border:"2px solid #fecaca"}}/>
                        <button onClick={()=>setAmendeForm(f=>({...f,photoData:null}))} style={{position:"absolute",top:6,right:6,background:"#ef4444",color:"white",border:"none",borderRadius:"50%",width:22,height:22,fontSize:12,cursor:"pointer",fontWeight:700}}>x</button>
                      </div>
                      :<div style={{display:"flex",gap:8,marginTop:4}}>
                        <button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setAmendeForm(x=>({...x,photoData:ev.target.result}));r.readAsDataURL(f);};i.click();}} style={{flex:1,padding:"8px 0",background:"#1e3a8a",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>📁 Galerie</button>
                        <button onClick={()=>{const i=document.createElement("input");i.type="file";i.accept="image/*";i.capture="environment";i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setAmendeForm(x=>({...x,photoData:ev.target.result}));r.readAsDataURL(f);};i.click();}} style={{flex:1,padding:"8px 0",background:"#7c3aed",color:"white",border:"none",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer"}}>📷 Caméra</button>
                      </div>}
                  </div>
                  {amendeForm.vehicleId&&amendeForm.date&&(
                    <div style={{padding:"10px 14px",borderRadius:10,marginBottom:10,background:contratRef?"#f0fdf4":"#fef3c7",border:`1px solid ${contratRef?"#bbf7d0":"#fde68a"}`}}>
                      {contratRef?<div><div style={{fontWeight:700,fontSize:12,color:"#16a34a",marginBottom:2}}>Contrat trouvé</div><div style={{fontSize:11}}><b>{contratRef.locNom}</b> — {contratRef.dateDebut} → {contratRef.dateFin}</div></div>:<div style={{fontSize:12,color:"#92400e"}}>Aucun contrat actif à cette date.</div>}
                    </div>
                  )}
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{if(!amendeForm.vehicleId||!amendeForm.date){toast_("Choisissez un véhicule et une date","error");return;}const v=vehicles.find(x=>x.id===amendeForm.vehicleId);                    const newA={id:Date.now(),...amendeForm,vehicleLabel:v?v.marque+" "+v.modele+" - "+v.immat:"",contratId:contratRef?.id||null,locNom:contratRef?.locNom||"",locTel:contratRef?.locTel||""};setAmendes(a=>[newA,...a]);setAmendeForm({vehicleId:"",contratRef:"",date:"",heure:"",montant:"",type:"Excès de vitesse",statut:"A traiter",notes:"",photoData:null});setShowAddAmende(false);toast_("Amende ajoutée !");}} style={{background:"#dc2626",color:"white",border:"none",borderRadius:8,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontSize:12}}>Enregistrer</button>
                    <button onClick={()=>setShowAddAmende(false)} style={{background:"#e5e7eb",border:"none",borderRadius:8,padding:"8px 14px",cursor:"pointer",fontSize:12}}>Annuler</button>
                  </div>
                </div>
              );
            })()}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
              {[["A traiter","#dc2626","🚨"],["En cours","#d97706","⏳"],["Confirmée","#2563eb","✅"],["Payée","#16a34a","💰"],["Contestée","#7c3aed","⚖️"]].map(([s,col,icon])=>(
                <div key={s} style={{background:"white",borderRadius:12,padding:"10px 14px",boxShadow:"0 2px 6px rgba(0,0,0,.06)",borderLeft:`4px solid ${col}`}}>
                  <div style={{fontSize:10,color:"#6b7280"}}>{icon} {s}</div>
                  <div style={{fontSize:22,fontWeight:800,color:col}}>{amendes.filter(a=>a.statut===s).length}</div>
                </div>
              ))}
            </div>
            {amendes.length===0
              ?<div style={{textAlign:"center",color:"#9ca3af",padding:40,background:"white",borderRadius:14}}><div style={{fontSize:36,marginBottom:8}}>🚨</div><p>Aucune amende.</p></div>
              :amendes.map(a=>{
                const colStatut=a.statut==="A traiter"?"#dc2626":a.statut==="En cours"?"#d97706":a.statut==="Confirmée"?"#2563eb":a.statut==="Payée"?"#16a34a":"#7c3aed";
                const contratLie=contrats.find(c=>c.id===a.contratId);
                return(
                  <div key={a.id} style={{background:"white",borderRadius:14,padding:14,marginBottom:10,boxShadow:"0 2px 8px rgba(0,0,0,.07)",border:`2px solid ${colStatut}22`}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                      <div>
                        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}><span style={{fontWeight:800,fontSize:14}}>{a.type}</span><span style={{fontSize:10,background:colStatut+"22",color:colStatut,borderRadius:99,padding:"2px 8px",fontWeight:700}}>{a.statut}</span></div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{a.vehicleLabel}</div>
                        <div style={{fontSize:11,color:"#6b7280"}}>{a.date}{a.heure?" à "+a.heure:""}</div>
                        {a.locNom&&<div style={{fontSize:11,marginTop:4}}>Locataire : <b>{a.locNom}</b></div>}
                      </div>
                      {a.montant&&<div style={{fontWeight:900,fontSize:18,color:"#dc2626"}}>{a.montant} {sym}</div>}
                    </div>
                    {contratLie&&<div style={{background:"#eff6ff",borderRadius:8,padding:"6px 10px",marginBottom:8,fontSize:11,border:"1px solid #bfdbfe"}}>Contrat : <b>{contratLie.locNom}</b> — {contratLie.dateDebut} → {contratLie.dateFin}<button onClick={()=>rePrint(contratLie)} style={{marginLeft:8,padding:"2px 8px",background:"#1e3a8a",color:"white",border:"none",borderRadius:5,fontSize:10,cursor:"pointer",fontWeight:700}}>PDF</button></div>}
                    {a.photoData&&<div style={{marginBottom:8}}><img src={a.photoData} alt="amende" style={{width:"100%",maxHeight:160,objectFit:"cover",borderRadius:10,border:"2px solid #fecaca"}}/></div>}
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {STATUTS_AMENDE.filter(s=>s!==a.statut).map(s=><button key={s} onClick={()=>setAmendes(as=>as.map(x=>x.id===a.id?{...x,statut:s}:x))} style={{padding:"4px 10px",background:"#f1f5f9",color:"#374151",border:"1px solid #e5e7eb",borderRadius:7,fontSize:10,cursor:"pointer",fontWeight:600}}>{s}</button>)}
                      <button onClick={()=>setAmendes(as=>as.filter(x=>x.id!==a.id))} style={{padding:"4px 10px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:7,fontSize:10,cursor:"pointer"}}>Supprimer</button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* QUESTIONS */}
        {page==="questions"&&(
          <div>
            <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937",marginBottom:4}}>Questions clients</h1>
            <p style={{fontSize:12,color:"#6b7280",marginBottom:16}}>Questions posées depuis la vitrine.</p>
            {questions.length===0&&<div style={{textAlign:"center",color:"#9ca3af",padding:40,background:"white",borderRadius:14}}><div style={{fontSize:36,marginBottom:8}}>❓</div><p>Aucune question.</p></div>}
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

        {/* MODAL PROLONGEMENT */}
        {prolonContrat&&(()=>{
          const c=prolonContrat;
          const v=vehicles.find(x=>x.id===c.vehicleId);
          const tarifJ=parseFloat(c.tarifLabel?.match(/(\d+(?:\.\d+)?)\s*€\/j/)?.[1])||(v?v.tarif:0);
          const debutD=new Date(c.dateDebut);
          const finNouvelle=prolonDateFin?new Date(prolonDateFin):null;
          const newNbJours=finNouvelle?Math.max(1,Math.ceil((finNouvelle-debutD)/86400000)):c.nbJours;
          const joursExtra=newNbJours-c.nbJours;
          const newTotal=Math.max(0,tarifJ*newNbJours-(c.remise||0));
          const coutExtra=tarifJ*Math.max(0,joursExtra);
          return(
            <div onClick={e=>{if(e.target===e.currentTarget)setProlonContrat(null);}} style={{position:"fixed",inset:0,zIndex:9999,background:"rgba(0,0,0,.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
              <div style={{background:"white",borderRadius:18,padding:22,width:"100%",maxWidth:400,boxShadow:"0 8px 40px rgba(0,0,0,.2)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                  <div>
                    <div style={{fontWeight:900,fontSize:16,color:"#1e3a8a"}}>⏳ Prolonger le contrat</div>
                    <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{c.locNom} · {c.vehicleLabel}</div>
                  </div>
                  <button onClick={()=>setProlonContrat(null)} style={{background:"#f3f4f6",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:14,fontWeight:700}}>✕</button>
                </div>
                <div style={{background:"#f8fafc",borderRadius:10,padding:12,marginBottom:14,fontSize:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:"#6b7280"}}>Début</span><span style={{fontWeight:700}}>{c.dateDebut} à {c.heureDebut}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:"#6b7280"}}>Fin actuelle</span><span style={{fontWeight:700,color:"#dc2626"}}>{c.dateFin} à {c.heureFin}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#6b7280"}}>Durée actuelle</span><span style={{fontWeight:700}}>{c.nbJours} jour{c.nbJours>1?"s":""}</span></div>
                </div>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:11,color:"#6b7280",fontWeight:700,display:"block",marginBottom:4}}>Nouvelle date de fin</label>
                  <input type="date" min={c.dateFin} value={prolonDateFin} onChange={e=>setProlonDateFin(e.target.value)} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"2px solid #e5e7eb",fontSize:13,fontWeight:600,boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:16}}>
                  <label style={{fontSize:11,color:"#6b7280",fontWeight:700,display:"block",marginBottom:4}}>Heure de restitution</label>
                  <input type="time" value={prolonHeureFin} onChange={e=>setProlonHeureFin(e.target.value)} style={{width:"100%",padding:"9px 12px",borderRadius:8,border:"2px solid #e5e7eb",fontSize:13,fontWeight:600,boxSizing:"border-box"}}/>
                </div>
                {finNouvelle&&joursExtra>0&&(
                  <div style={{background:"#fef3c7",borderRadius:10,padding:12,marginBottom:16,border:"1px solid #fde68a"}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:"#92400e"}}>Jours supplémentaires</span><span style={{fontWeight:800,color:"#b45309"}}>+ {joursExtra} jour{joursExtra>1?"s":""}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:"#92400e"}}>Coût extension ({tarifJ} {sym}/j)</span><span style={{fontWeight:800,color:"#b45309"}}>+ {coutExtra} {sym}</span></div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,borderTop:"1px solid #fde68a",paddingTop:8,marginTop:4}}><span style={{fontWeight:700,color:"#1f2937"}}>Nouveau total</span><span style={{fontWeight:900,color:"#1e3a8a",fontSize:16}}>{newTotal} {sym}</span></div>
                  </div>
                )}
                {finNouvelle&&joursExtra<=0&&prolonDateFin&&(
                  <div style={{background:"#fef2f2",borderRadius:10,padding:10,marginBottom:16,fontSize:12,color:"#dc2626",fontWeight:600}}>La nouvelle date doit être après le {c.dateFin}</div>
                )}
                <button onClick={prolongerContrat} disabled={!prolonDateFin||!finNouvelle||joursExtra<=0} style={{width:"100%",padding:12,background:(!prolonDateFin||!finNouvelle||joursExtra<=0)?"#d1d5db":"#1e3a8a",color:"white",border:"none",borderRadius:10,fontSize:13,fontWeight:800,cursor:(!prolonDateFin||!finNouvelle||joursExtra<=0)?"not-allowed":"pointer"}}>
                  Confirmer la prolongation
                </button>
              </div>
            </div>
          );
        })()}

        {/* FINANCES */}
        {page==="finances"&&(
          <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Finances</h1>
              <div style={{display:"flex",gap:6}}>
                {[["mois","Ce mois"],["6mois","6 mois"],["annee","Cette année"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setFinPeriode(k)} style={{padding:"5px 12px",borderRadius:8,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",background:finPeriode===k?"#1e3a8a":"#e5e7eb",color:finPeriode===k?"white":"#374151"}}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              {KPI("CA Total",caT_f+" "+sym,"💶","#2563eb")}
              {KPI("Extras",(totalRetenues_f+totalSurplusKm_f).toFixed(0)+" "+sym,"🔒","#d97706")}
              {KPI("Dépenses",dT_f.toFixed(0)+" "+sym,"📤","#ef4444")}
              {KPI("Bénéfice net",bT_f.toFixed(0)+" "+sym,bT_f>=0?"📈":"📉",bT_f>=0?"#16a34a":"#dc2626",null,bT_f<0)}
              <div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.07)",borderLeft:"4px solid #dc2626"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <p style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Cautions en attente de retour</p>
                    <p style={{fontSize:20,fontWeight:800,color:"#dc2626"}}>{cautionsNonRendues_f} {sym}</p>
                    <p style={{fontSize:10,color:"#9ca3af",marginTop:2}}>{contrats.filter(c=>!retours[c.id]&&inPeriodFin(c.dateDebut)).length} contrat{contrats.filter(c=>!retours[c.id]&&inPeriodFin(c.dateDebut)).length>1?"s":""} sans retour</p>
                  </div>
                  <span style={{fontSize:22}}>⏳</span>
                </div>
              </div>
              <div style={{background:"white",borderRadius:14,padding:16,boxShadow:"0 2px 8px rgba(0,0,0,.07)",borderLeft:"4px solid #16a34a"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <p style={{fontSize:10,color:"#6b7280",marginBottom:3}}>Cautions retenues (retours)</p>
                    <p style={{fontSize:20,fontWeight:800,color:"#16a34a"}}>{totalRetenues_f.toFixed(0)} {sym}</p>
                    <p style={{fontSize:10,color:"#9ca3af",marginTop:2}}>Encaissées sur retours effectués</p>
                  </div>
                  <span style={{fontSize:22}}>✅</span>
                </div>
              </div>
            </div>
            <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:36,height:36,borderRadius:10,background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📈</div>
                <div style={{fontWeight:700,fontSize:14}}>Évolution du CA</div>
              </div>
              {caP.every(m=>m.ca===0&&m.dep===0)
                ?<div style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:12}}>Aucune donnée disponible</div>
                :<div>
                  <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,marginBottom:8}}>
                    {caP.map((m,i)=>(
                      <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                        <div style={{width:"100%",display:"flex",gap:2,alignItems:"flex-end",height:100}}>
                          <div title={"CA : "+m.ca+" "+sym} style={{flex:1,borderRadius:"4px 4px 0 0",background:"#3b82f6",height:(m.ca/maxCA*100)+"px",minHeight:m.ca>0?3:0,cursor:"pointer",position:"relative"}} onMouseEnter={e=>{const t=document.createElement("div");t.id="chart-tip";t.style.cssText="position:fixed;background:#1e293b;color:white;padding:4px 8px;borderRadius:6px;fontSize:11px;fontWeight:700;pointerEvents:none;zIndex:9999;whiteSpace:nowrap";t.textContent="CA : "+m.ca+" "+sym;document.body.appendChild(t);const rect=e.currentTarget.getBoundingClientRect();t.style.left=(rect.left+rect.width/2-t.offsetWidth/2)+"px";t.style.top=(rect.top-28)+"px";}} onMouseLeave={()=>{const t=document.getElementById("chart-tip");if(t)t.remove();}}/>
                          <div title={"Dépenses : "+m.dep+" "+sym} style={{flex:1,borderRadius:"4px 4px 0 0",background:"#f87171",height:(m.dep/maxCA*100)+"px",minHeight:m.dep>0?3:0,cursor:"pointer"}} onMouseEnter={e=>{const t=document.createElement("div");t.id="chart-tip";t.style.cssText="position:fixed;background:#1e293b;color:white;padding:4px 8px;borderRadius:6px;fontSize:11px;fontWeight:700;pointerEvents:none;zIndex:9999;whiteSpace:nowrap";t.textContent="Dép. : "+m.dep.toFixed(0)+" "+sym;document.body.appendChild(t);const rect=e.currentTarget.getBoundingClientRect();t.style.left=(rect.left+rect.width/2-t.offsetWidth/2)+"px";t.style.top=(rect.top-28)+"px";}} onMouseLeave={()=>{const t=document.getElementById("chart-tip");if(t)t.remove();}}/>
                        </div>
                        <span style={{fontSize:9,color:"#6b7280",textTransform:"capitalize"}}>{m.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:16,fontSize:11,color:"#6b7280"}}>
                    <span><span style={{display:"inline-block",width:10,height:10,background:"#3b82f6",borderRadius:2,marginRight:4}}/>CA</span>
                    <span><span style={{display:"inline-block",width:10,height:10,background:"#f87171",borderRadius:2,marginRight:4}}/>Dépenses</span>
                  </div>
                </div>}
            </div>
            <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)",marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                <div style={{width:36,height:36,borderRadius:10,background:"#f5f3ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📊</div>
                <div style={{fontWeight:700,fontSize:14}}>Répartition par véhicule</div>
              </div>
              {vehicles.length===0||contrats.length===0
                ?<div style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:12}}>Aucune donnée disponible</div>
                :(()=>{
                  const vColors=["#2563eb","#7c3aed","#16a34a","#d97706","#dc2626","#0891b2","#be185d","#059669"];
                  const vStats=vehicles.map((v,i)=>{
                    const ca=contrats.filter(c=>c.vehicleId===v.id).reduce((s,c)=>s+(c.totalCalc||0),0);
                    return{label:v.marque+" "+v.modele,immat:v.immat,ca,color:vColors[i%vColors.length]};
                  }).filter(v=>v.ca>0).sort((a,b)=>b.ca-a.ca);
                  const total=vStats.reduce((s,v)=>s+v.ca,0)||1;
                  if(vStats.length===0)return <div style={{textAlign:"center",color:"#9ca3af",padding:24,fontSize:12}}>Aucune donnée disponible</div>;
                  return(
                    <div>
                      <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                        {vStats.map((v,i)=>(
                          <div key={i}>
                            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                              <span style={{fontWeight:600}}>{v.label} <span style={{color:"#9ca3af",fontWeight:400}}>({v.immat})</span></span>
                              <span style={{fontWeight:700,color:v.color}}>{v.ca} {sym} — {Math.round(v.ca/total*100)}%</span>
                            </div>
                            <div style={{background:"#f3f4f6",borderRadius:99,height:10,overflow:"hidden"}}>
                              <div style={{width:(v.ca/total*100)+"%",background:v.color,height:"100%",borderRadius:99}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
            </div>
            {(()=>{
              const now=new Date();
              function inPeriod(dateStr){
                if(!dateStr)return false;
                const d=new Date(dateStr);
                if(finPeriode==="mois")return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
                if(finPeriode==="6mois"){const cutoff=new Date(now);cutoff.setMonth(cutoff.getMonth()-5);cutoff.setDate(1);return d>=cutoff;}
                if(finPeriode==="annee")return d.getFullYear()===now.getFullYear();
                return true;
              }
              const vColors=["#2563eb","#7c3aed","#16a34a","#d97706","#dc2626","#0891b2","#be185d","#059669"];
              const rows=vehicles.map((v,i)=>{
                const vContrats=contrats.filter(c=>c.vehicleId===v.id&&inPeriod(c.dateDebut));
                const ca=vContrats.reduce((s,c)=>s+(c.totalCalc||0),0);
                const dep=depenses.filter(d=>d.vehicleId===v.id&&inPeriod(d.date)).reduce((s,d)=>s+parseFloat(d.montant||0),0);
                const caution=vContrats.reduce((s,c)=>s+(retours[c.id]?.montantRetenu||0),0);
                return{label:v.marque+" "+v.modele,immat:v.immat,ca,dep,caution,net:ca-dep+caution,color:vColors[i%vColors.length]};
              });
              const totalCA=rows.reduce((s,r)=>s+r.ca,0);
              const totalDep=rows.reduce((s,r)=>s+r.dep,0);
              const totalCaution=rows.reduce((s,r)=>s+r.caution,0);
              const totalNet=totalCA-totalDep+totalCaution;
              return(
                <div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)",marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                    <div style={{width:36,height:36,borderRadius:10,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🚗</div>
                    <div style={{fontWeight:700,fontSize:14}}>Bilan par véhicule</div>
                  </div>
                  {rows.length===0
                    ?<div style={{textAlign:"center",color:"#9ca3af",padding:20,fontSize:12}}>Aucun véhicule</div>
                    :<div style={{overflowX:"auto"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px 80px 80px",gap:"0 8px",minWidth:360}}>
                        <span style={{fontSize:10,color:"#9ca3af",fontWeight:700,padding:"0 0 8px 0",borderBottom:"2px solid #f3f4f6"}}>VÉHICULE</span>
                        <span style={{fontSize:10,color:"#2563eb",fontWeight:700,textAlign:"right",padding:"0 0 8px 0",borderBottom:"2px solid #f3f4f6"}}>CA</span>
                        <span style={{fontSize:10,color:"#ef4444",fontWeight:700,textAlign:"right",padding:"0 0 8px 0",borderBottom:"2px solid #f3f4f6"}}>DÉPENSES</span>
                        <span style={{fontSize:10,color:"#d97706",fontWeight:700,textAlign:"right",padding:"0 0 8px 0",borderBottom:"2px solid #f3f4f6"}}>CAUTION</span>
                        <span style={{fontSize:10,color:"#16a34a",fontWeight:700,textAlign:"right",padding:"0 0 8px 0",borderBottom:"2px solid #f3f4f6"}}>NET</span>
                        {rows.map((r,i)=>(
                          <Fragment key={i}>
                            <div style={{padding:"8px 0",borderBottom:"1px solid #f9fafb"}}>
                              <div style={{fontWeight:700,fontSize:12,color:r.color}}>{r.label}</div>
                              <div style={{fontSize:10,color:"#9ca3af"}}>{r.immat}</div>
                            </div>
                            <span style={{fontWeight:700,fontSize:12,color:"#2563eb",textAlign:"right",padding:"8px 0",borderBottom:"1px solid #f9fafb"}}>{r.ca} {sym}</span>
                            <span style={{fontWeight:700,fontSize:12,color:"#ef4444",textAlign:"right",padding:"8px 0",borderBottom:"1px solid #f9fafb"}}>{r.dep.toFixed(0)} {sym}</span>
                            <span style={{fontWeight:700,fontSize:12,color:"#d97706",textAlign:"right",padding:"8px 0",borderBottom:"1px solid #f9fafb"}}>{r.caution>0?r.caution.toFixed(0)+" "+sym:"—"}</span>
                            <span style={{fontWeight:700,fontSize:12,color:r.net>=0?"#16a34a":"#dc2626",textAlign:"right",padding:"8px 0",borderBottom:"1px solid #f9fafb"}}>{r.net.toFixed(0)} {sym}</span>
                          </Fragment>
                        ))}
                        <span style={{fontWeight:800,fontSize:12,color:"#1f2937",padding:"10px 0 0 0",borderTop:"2px solid #1e3a8a"}}>TOTAL</span>
                        <span style={{fontWeight:800,fontSize:12,color:"#2563eb",textAlign:"right",padding:"10px 0 0 0",borderTop:"2px solid #1e3a8a"}}>{totalCA} {sym}</span>
                        <span style={{fontWeight:800,fontSize:12,color:"#ef4444",textAlign:"right",padding:"10px 0 0 0",borderTop:"2px solid #1e3a8a"}}>{totalDep.toFixed(0)} {sym}</span>
                        <span style={{fontWeight:800,fontSize:12,color:"#d97706",textAlign:"right",padding:"10px 0 0 0",borderTop:"2px solid #1e3a8a"}}>{totalCaution>0?totalCaution.toFixed(0)+" "+sym:"—"}</span>
                        <span style={{fontWeight:800,fontSize:12,color:totalNet>=0?"#16a34a":"#dc2626",textAlign:"right",padding:"10px 0 0 0",borderTop:"2px solid #1e3a8a"}}>{totalNet.toFixed(0)} {sym}</span>
                      </div>
                    </div>}
                </div>
              );
            })()}
            <div style={{background:"white",borderRadius:14,padding:16,marginBottom:14,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <h2 style={{fontWeight:700,fontSize:14}}>Dépenses</h2>
                <button onClick={()=>setShowAddD(!showAddD)} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"6px 12px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Ajouter</button>
              </div>
              {showAddD&&(
                <div style={{background:"#f8fafc",borderRadius:10,padding:12,marginBottom:12,border:"1px solid #e5e7eb"}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:8}}>
                    <div><label style={LBL_STYLE}>Libellé</label><input style={INP_STYLE()} value={dForm.label} onChange={e=>setDForm(f=>({...f,label:e.target.value}))}/></div>
                    <div><label style={LBL_STYLE}>Montant {sym}</label><input type="number" style={INP_STYLE()} value={dForm.montant} onChange={e=>setDForm(f=>({...f,montant:e.target.value}))}/></div>
                    <div><label style={LBL_STYLE}>Catégorie</label><select style={INP_STYLE()} value={dForm.categorie} onChange={e=>setDForm(f=>({...f,categorie:e.target.value}))}>{CAT_DEP.map(c=><option key={c}>{c}</option>)}</select></div>
                    <div><label style={LBL_STYLE}>Date</label><input type="date" style={INP_STYLE()} value={dForm.date} onChange={e=>setDForm(f=>({...f,date:e.target.value}))}/></div>
                    <div><label style={LBL_STYLE}>Véhicule</label><select style={INP_STYLE()} value={dForm.vehicleId} onChange={e=>setDForm(f=>({...f,vehicleId:e.target.value}))}><option value="">Tous</option>{vehicles.map(v=><option key={v.id} value={v.id}>{v.marque} {v.modele}</option>)}</select></div>
                  </div>
                  <button onClick={async()=>{if(!dForm.label||!dForm.montant){toast_("Remplissez libellé et montant","error");return;}const localId=Date.now();const newDep={id:localId,...dForm};setDepenses(d=>[newDep,...d]);setDForm({label:"",montant:"",categorie:"Carburant",date:new Date().toISOString().slice(0,10),vehicleId:""});setShowAddD(false);toast_("Dépense ajoutée");if(user){const{data:ins,error:err}=await supabase.from('depenses').insert([{user_id:user.id,label:newDep.label,montant:parseFloat(newDep.montant),categorie:newDep.categorie,date:newDep.date,vehicle_id:newDep.vehicleId||null}]).select().single();if(!err&&ins)setDepenses(ds=>ds.map(x=>x.id===localId?{...x,id:ins.id}:x));}}} style={{background:"#16a34a",color:"white",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
                </div>
              )}
              {depenses.length===0
                ?<p style={{color:"#9ca3af",fontSize:12,textAlign:"center",padding:16}}>Aucune dépense</p>
                :depenses.map(d=>{
                  const veh=vehicles.find(v=>v.id===d.vehicleId);
                  return(
                    <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderRadius:10,background:"#f9fafb",marginBottom:6,border:"1px solid #e5e7eb"}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:12}}>{d.label}</div>
                        <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>
                          <span style={{fontSize:10,color:"#6b7280"}}>{d.categorie} · {d.date}</span>
                          {veh&&<span style={{fontSize:10,background:"#eff6ff",color:"#2563eb",borderRadius:6,padding:"1px 6px",fontWeight:600}}>🚗 {veh.marque} {veh.modele} — {veh.immat}</span>}
                          {!veh&&d.vehicleId&&<span style={{fontSize:10,background:"#f3f4f6",color:"#9ca3af",borderRadius:6,padding:"1px 6px"}}>Véhicule supprimé</span>}
                          {!d.vehicleId&&<span style={{fontSize:10,background:"#f3f4f6",color:"#9ca3af",borderRadius:6,padding:"1px 6px"}}>Tous véhicules</span>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                        <span style={{fontWeight:700,color:"#ef4444"}}>-{d.montant} {sym}</span>
                        <button onClick={async()=>{setDepenses(ds=>ds.filter(x=>x.id!==d.id));if(user)await supabase.from('depenses').delete().eq('id',d.id).eq('user_id',user.id);}} style={{padding:"2px 6px",background:"#fef2f2",color:"#dc2626",border:"none",borderRadius:5,cursor:"pointer",fontSize:10}}>X</button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* PROFIL */}
        {page==="profil"&&(
          <div style={{maxWidth:520,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h1 style={{fontSize:18,fontWeight:800,color:"#1f2937"}}>Profil</h1>
              <button onClick={()=>{setProfilEdit(!profilEdit);setProfilForm({...profil});}} style={{background:"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{profilEdit?"Annuler":"Modifier"}</button>
            </div>
            {profilEdit
              ?<div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                {[["nom","Nom"],["entreprise","Entreprise"],["siren","SIREN"],["siret","SIRET"],["kbis","KBIS"],["email","Email"],["adresse","Adresse"],["ville","Ville"],["iban","IBAN"]].map(([k,l])=>(
                  <div key={k} style={{marginBottom:10}}><label style={LBL_STYLE}>{l}</label><input style={INP_STYLE()} value={profilForm[k]||""} onChange={e=>setProfilForm(p=>({...p,[k]:e.target.value}))}/></div>
                ))}
                {[["tel","Téléphone"],["whatsapp","WhatsApp"]].map(([k,l])=>(
                  <div key={k} style={{marginBottom:10}}><label style={LBL_STYLE}>{l}</label><TelInput value={profilForm[k]||""} onChange={v=>setProfilForm(p=>({...p,[k]:v}))} placeholder={l}/></div>
                ))}
                <div style={{marginBottom:10}}><label style={LBL_STYLE}>Snapchat</label><input style={INP_STYLE()} value={profilForm.snap||""} onChange={e=>setProfilForm(p=>({...p,snap:e.target.value}))}/></div>
                <div style={{marginBottom:14}}><label style={LBL_STYLE}>💱 Devise</label><select style={INP_STYLE()} value={profilForm.devise||"EUR"} onChange={e=>setProfilForm(p=>({...p,devise:e.target.value}))}>{DEVISES.map(d=><option key={d.code} value={d.code}>{d.label}</option>)}</select></div>
                <button onClick={async()=>{setProfil(profilForm);setProfilEdit(false);toast_("Profil mis à jour");if(user)await supabase.from('profils').upsert({user_id:user.id,slug:user.id.slice(0,8),...profilForm},{onConflict:'user_id'});}} style={{background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:"10px 0",width:"100%",fontSize:13,fontWeight:700,cursor:"pointer"}}>Enregistrer</button>
              </div>
              :<div style={{background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
                <div style={{textAlign:"center",marginBottom:16}}>
                  <div style={{width:60,height:60,borderRadius:"50%",background:"#1e3a8a",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",fontSize:24}}>👤</div>
                  <div style={{fontWeight:800,fontSize:16}}>{profil.nom}</div>
                  <div style={{color:"#6b7280",fontSize:12}}>{profil.entreprise}</div>
                </div>
                {[["SIREN",profil.siren],["SIRET",profil.siret],["KBIS",profil.kbis],["Téléphone",profil.tel],["WhatsApp",profil.whatsapp],["Snapchat",profil.snap],["Email",profil.email],["Adresse",profil.adresse],["Ville",profil.ville],["IBAN",profil.iban],["Devise",profil.devise]].filter(([,v])=>v).map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}><span style={{fontSize:11,color:"#6b7280"}}>{l}</span><span style={{fontSize:12,fontWeight:600}}>{v}</span></div>
                ))}
              </div>}
            {/* SECURITE */}
            <div style={{marginTop:16,background:"white",borderRadius:14,padding:18,boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:secuEdit?14:0}}>
                <span style={{fontSize:13,fontWeight:700,color:"#1f2937"}}>Securite</span>
                <button onClick={()=>{setSecuEdit(!secuEdit);setSecuForm({newEmail:"",newPassword:"",confirmPassword:""});}} style={{background:secuEdit?"#6b7280":"#1e3a8a",color:"white",border:"none",borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{secuEdit?"Annuler":"Modifier"}</button>
              </div>
              {secuEdit&&<div>
                <div style={{marginBottom:10}}><label style={LBL_STYLE}>Nouvel email</label><input style={INP_STYLE()} type="email" placeholder={user?.email||""} value={secuForm.newEmail} onChange={e=>setSecuForm(p=>({...p,newEmail:e.target.value}))}/></div>
                <div style={{marginBottom:10}}><label style={LBL_STYLE}>Nouveau mot de passe</label><input style={INP_STYLE()} type="password" placeholder="Laisser vide pour ne pas changer" value={secuForm.newPassword} onChange={e=>setSecuForm(p=>({...p,newPassword:e.target.value}))}/></div>
                <div style={{marginBottom:14}}><label style={LBL_STYLE}>Confirmer mot de passe</label><input style={INP_STYLE()} type="password" placeholder="Confirmer le nouveau mot de passe" value={secuForm.confirmPassword} onChange={e=>setSecuForm(p=>({...p,confirmPassword:e.target.value}))}/></div>
                <button onClick={async()=>{
                  if(secuForm.newPassword&&secuForm.newPassword!==secuForm.confirmPassword){toast_("Les mots de passe ne correspondent pas");return;}
                  if(!secuForm.newEmail&&!secuForm.newPassword){toast_("Remplis au moins un champ");return;}
                  setSecuLoading(true);
                  const updates={};
                  if(secuForm.newEmail)updates.email=secuForm.newEmail;
                  if(secuForm.newPassword)updates.password=secuForm.newPassword;
                  const{error}=await supabase.auth.updateUser(updates);
                  setSecuLoading(false);
                  if(error){toast_(error.message);}else{
                    toast_(secuForm.newEmail?"Email mis a jour - verifie ta boite mail":"Mot de passe mis a jour");
                    setSecuEdit(false);
                    setSecuForm({newEmail:"",newPassword:"",confirmPassword:""});
                  }
                }} disabled={secuLoading} style={{background:"#16a34a",color:"white",border:"none",borderRadius:10,padding:"10px 0",width:"100%",fontSize:13,fontWeight:700,cursor:"pointer"}}>{secuLoading?"...":"Enregistrer"}</button>
              </div>}
              {!secuEdit&&<div style={{marginTop:8,fontSize:12,color:"#6b7280"}}>Email : {user?.email}</div>}
              {!secuEdit&&<button onClick={()=>supabase.auth.signOut()} style={{marginTop:14,background:"#ef4444",color:"white",border:"none",borderRadius:10,padding:"10px 0",width:"100%",fontSize:13,fontWeight:700,cursor:"pointer"}}>Se deconnecter</button>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const MAX_LOGIN_ATTEMPTS=5;
const LOCKOUT_DURATION_MS=15*60*1000; // 15 minutes

function AuthPage(){
  const[mode,setMode]=useState("login");
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[showPassword,setShowPassword]=useState(false);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[success,setSuccess]=useState("");
  const[attempts,setAttempts]=useState(0);
  const[lockedUntil,setLockedUntil]=useState(null);
  const[remaining,setRemaining]=useState(0);
  const[needsConfirm,setNeedsConfirm]=useState(false);
  const[resendLoading,setResendLoading]=useState(false);
  const[resendDone,setResendDone]=useState(false);

  // Décompte si verrouillé
  useEffect(()=>{
    if(!lockedUntil)return;
    const tick=()=>{
      const left=lockedUntil-Date.now();
      if(left<=0){setLockedUntil(null);setAttempts(0);setRemaining(0);}
      else setRemaining(Math.ceil(left/1000));
    };
    tick();
    const t=setInterval(tick,1000);
    return()=>clearInterval(t);
  },[lockedUntil]);

  const isLocked=lockedUntil&&Date.now()<lockedUntil;

  async function handleSubmit(){
    if(isLocked)return;
    // Validation basique côté client
    if(!email.trim()||!email.includes("@")){setError("Adresse email invalide.");return;}
    if(mode!=="forgot"&&password.length<6){setError("Le mot de passe doit contenir au moins 6 caractères.");return;}

    setLoading(true);setError("");setSuccess("");
    if(mode==="forgot"){
      const{error:fErr}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:window.location.origin});
      if(fErr){setError("Erreur : "+fErr.message);setLoading(false);return;}
      setSuccess("Email de réinitialisation envoyé ! Vérifiez votre boîte mail (et spam).");
      setLoading(false);return;
    }
    let result;
    if(mode==="login")result=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});
    else result=await supabase.auth.signUp({email:email.trim().toLowerCase(),password,options:{emailRedirectTo:window.location.origin}});

    if(result.error){
      const msg=result.error.message||"";
      if(msg.toLowerCase().includes("email not confirmed")||msg.toLowerCase().includes("not confirmed")){
        setNeedsConfirm(true);
        setError("");
      } else {
        const newAttempts=attempts+1;
        setAttempts(newAttempts);
        if(newAttempts>=MAX_LOGIN_ATTEMPTS){
          setLockedUntil(Date.now()+LOCKOUT_DURATION_MS);
          setError("Trop de tentatives. Accès bloqué pendant 15 minutes.");
        } else {
          setError("Email ou mot de passe incorrect. ("+(MAX_LOGIN_ATTEMPTS-newAttempts)+" tentative(s) restante(s))");
        }
      }
    } else if(mode==="signup"){
      setNeedsConfirm(true);
      setSuccess("Compte créé ! Un email de confirmation a été envoyé à "+email.trim().toLowerCase());
    }
    setLoading(false);
  }

  return(
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#f1f5f9"}}>
      <div style={{background:"white",borderRadius:16,padding:"40px 32px",width:"100%",maxWidth:400,boxShadow:"0 4px 24px rgba(0,0,0,0.1)"}}>
        <h1 style={{textAlign:"center",marginBottom:8,fontSize:22,fontWeight:700}}>MAN'S LOCATION</h1>
        <p style={{textAlign:"center",color:"#6b7280",marginBottom:24,fontSize:14}}>Accès réservé aux professionnels</p>
        {mode!=="forgot"&&(
          <div style={{display:"flex",marginBottom:24,borderRadius:8,overflow:"hidden",border:"1px solid #e5e7eb"}}>
            {["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}} style={{flex:1,padding:"10px",border:"none",cursor:"pointer",background:mode===m?"#1d4ed8":"white",color:mode===m?"white":"#374151",fontWeight:600}}>{m==="login"?"Connexion":"Inscription"}</button>)}
          </div>
        )}
        {isLocked&&(
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,textAlign:"center"}}>
            <div style={{fontSize:13,color:"#dc2626",fontWeight:700}}>Accès temporairement bloqué</div>
            <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>Réessayez dans {Math.floor(remaining/60)}:{String(remaining%60).padStart(2,"0")}</div>
          </div>
        )}
        <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} autoComplete="email" style={{width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,marginBottom:12,fontSize:14,boxSizing:"border-box"}}/>
        {mode!=="forgot"&&(
          <div style={{position:"relative",marginBottom:16}}>
            <input placeholder="Mot de passe" type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} autoComplete={mode==="login"?"current-password":"new-password"} style={{width:"100%",padding:"10px 12px",paddingRight:40,border:"1px solid #e5e7eb",borderRadius:8,fontSize:14,boxSizing:"border-box"}}/>
            <span onClick={()=>setShowPassword(!showPassword)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",cursor:"pointer",fontSize:18,color:"#6b7280",userSelect:"none"}}>{showPassword?"🙈":"👁️"}</span>
          </div>
        )}
        {error&&<p style={{color:"#dc2626",fontSize:13,marginBottom:12,background:"#fef2f2",padding:"8px 10px",borderRadius:7,border:"1px solid #fecaca"}}>{error}</p>}
        {success&&<p style={{color:"#16a34a",fontSize:13,marginBottom:12,background:"#f0fdf4",padding:"8px 10px",borderRadius:7,border:"1px solid #bbf7d0"}}>{success}</p>}
        {needsConfirm&&(
          <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:10,padding:"14px 16px",marginBottom:14}}>
            <div style={{fontWeight:700,fontSize:13,color:"#b45309",marginBottom:6}}>📧 Email de confirmation requis</div>
            <div style={{fontSize:12,color:"#78350f",marginBottom:10}}>Un email de confirmation a été envoyé à <b>{email.trim().toLowerCase()}</b>.<br/>Vérifiez votre boîte de réception et vos <b>spams</b>. Cliquez sur le lien pour activer votre compte.</div>
            {resendDone
              ?<div style={{fontSize:12,color:"#16a34a",fontWeight:600}}>✅ Email renvoyé ! Vérifiez vos spams.</div>
              :<button onClick={async()=>{setResendLoading(true);await supabase.auth.resend({type:"signup",email:email.trim().toLowerCase(),options:{emailRedirectTo:window.location.origin}});setResendLoading(false);setResendDone(true);}} disabled={resendLoading} style={{width:"100%",padding:"8px 0",background:"#d97706",color:"white",border:"none",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer"}}>{resendLoading?"Envoi...":"🔁 Renvoyer l'email de confirmation"}</button>
            }
          </div>
        )}
        <button onClick={handleSubmit} disabled={loading||isLocked} style={{width:"100%",padding:"12px",background:isLocked?"#9ca3af":"#1d4ed8",color:"white",border:"none",borderRadius:8,fontWeight:700,fontSize:15,cursor:isLocked?"not-allowed":"pointer"}}>
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
