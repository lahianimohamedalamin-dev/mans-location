import { useState, useEffect } from 'react';
import { supabase } from './supabase';

function safeTel(tel){ return /^[+\d\s\-()\\.]+$/.test(tel||"")?tel:""; }

// ── Calendrier de disponibilités ─────────────────────────────────────────────
function CalendrierDispo({ reservations }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  function toStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  const todayStr = toStr(today);

  function isBooked(d) {
    const s = toStr(d);
    return reservations.some(r => s >= r.dateDebut && s <= r.dateFin);
  }

  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startDow  = (firstDay.getDay() + 6) % 7; // lundi = 0

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));

  const canPrev = year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth());

  function prevM() {
    if (month === 0) { setMonth(11); setYear(y => y-1); }
    else setMonth(m => m-1);
  }
  function nextM() {
    if (month === 11) { setMonth(0); setYear(y => y+1); }
    else setMonth(m => m+1);
  }

  return (
    <div style={{ margin:'12px 0' }}>
      {/* En-tête mois */}
      <div style={{ display:'flex', alignItems:'center',
        justifyContent:'space-between', marginBottom:6 }}>
        <button onClick={prevM} disabled={!canPrev}
          style={{ border:'none', background:'none', padding:'0 6px',
            fontSize:18, cursor:canPrev?'pointer':'default',
            color:canPrev?'#374151':'#d1d5db', fontWeight:700 }}>‹</button>
        <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>
          {MOIS[month]} {year}
        </span>
        <button onClick={nextM}
          style={{ border:'none', background:'none', padding:'0 6px',
            fontSize:18, cursor:'pointer', color:'#374151', fontWeight:700 }}>›</button>
      </div>

      {/* Légende */}
      <div style={{ display:'flex', gap:14, marginBottom:6, fontSize:11, color:'#6b7280' }}>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ display:'inline-block', width:12, height:12,
            background:'#d1fae5', borderRadius:3, border:'1px solid #6ee7b7' }}/>
          Disponible
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ display:'inline-block', width:12, height:12,
            background:'#f3f4f6', borderRadius:3, border:'1px solid #d1d5db' }}/>
          Non disponible
        </span>
      </div>

      {/* Grille */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:2 }}>
        {['L','M','M','J','V','S','D'].map((j,i) => (
          <div key={i} style={{ textAlign:'center', fontSize:10,
            color:'#9ca3af', fontWeight:700, paddingBottom:2 }}>{j}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`}/>;
          const dStr   = toStr(d);
          const past   = dStr < todayStr;
          const booked = !past && isBooked(d);
          const isToday = dStr === todayStr;
          return (
            <div key={i} style={{
              textAlign:'center', fontSize:12, padding:'4px 2px',
              borderRadius:4,
              background: past   ? 'transparent'
                        : booked ? '#f3f4f6'
                        :          '#d1fae5',
              color: past   ? '#d1d5db'
                   : booked ? '#9ca3af'
                   :          '#15803d',
              fontWeight: isToday ? 800 : 400,
              border: isToday ? '2px solid #2563eb' : '2px solid transparent',
            }}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page principale Vitrine ──────────────────────────────────────────────────
export default function Vitrine() {
  const [profil,       setProfil]       = useState(null);
  const [vehicles,     setVehicles]     = useState([]);
  const [reservations, setReservations] = useState({});
  const [loading,      setLoading]      = useState(true);

  const slug = (window.location.pathname.split('/vitrine/')[1] || '').replace(/\/$/, '').trim();

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    async function load() {
      // 1. Profil par user_id (UUID complet)
      let profils = null;
      const { data: byId } = await supabase
        .from('profils').select('*').eq('user_id', slug).maybeSingle();
      profils = byId;

      // 2. Fallback slug personnalisé
      if (!profils) {
        const { data: bySlug } = await supabase
          .from('profils').select('*').eq('slug', slug).maybeSingle();
        profils = bySlug || null;
      }

      setProfil(profils);
      if (!profils) { setLoading(false); return; }

      // 3. Véhicules publiés
      const { data: vehs } = await supabase
        .from('vehicules').select('*')
        .eq('user_id', profils.user_id).eq('publie', true);
      setVehicles(vehs || []);

      // 4. Dates de réservation (sans info client)
      if (vehs && vehs.length > 0) {
        const ids = vehs.map(v => v.id);
        const { data: contrats } = await supabase
          .from('contrats')
          .select('vehicle_id,date_debut,date_fin')
          .in('vehicle_id', ids);
        if (contrats) {
          const map = {};
          contrats.forEach(c => {
            if (!map[c.vehicle_id]) map[c.vehicle_id] = [];
            map[c.vehicle_id].push({ dateDebut: c.date_debut, dateFin: c.date_fin });
          });
          setReservations(map);
        }
      }

      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center',
      minHeight:'100vh', background:'#f1f5f9' }}>
      <p style={{ color:'#6b7280' }}>Chargement...</p>
    </div>
  );

  if (!profil) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center',
      minHeight:'100vh', background:'#f1f5f9' }}>
      <p style={{ color:'#6b7280' }}>Vitrine introuvable.</p>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'Arial,sans-serif' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0a1940,#1e3a8a)',
        padding:'24px 20px', textAlign:'center', color:'white' }}>
        <h1 style={{ fontSize:24, fontWeight:800, margin:'0 0 4px' }}>
          {profil.entreprise || 'Location de véhicules'}
        </h1>
        <p style={{ fontSize:13, opacity:.8, margin:'0 0 10px' }}>
          {profil.adresse}{profil.ville && ' · ' + profil.ville}
        </p>
        {safeTel(profil.tel) && (
          <a href={`tel:${safeTel(profil.tel)}`}
            style={{ color:'#4ade80', fontSize:15, fontWeight:700, textDecoration:'none' }}>
            📞 {profil.tel}
          </a>
        )}
      </div>

      {/* Véhicules */}
      <div style={{ maxWidth:980, margin:'0 auto', padding:16 }}>
        <h2 style={{ fontSize:15, fontWeight:700, color:'#1f2937', margin:'16px 0 12px' }}>
          Nos véhicules
        </h2>

        {vehicles.length === 0 ? (
          <div style={{ textAlign:'center', color:'#9ca3af', padding:40,
            background:'white', borderRadius:14 }}>
            Aucun véhicule disponible pour le moment.
          </div>
        ) : (
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
            {vehicles.map(v => (
              <CarteVehicule
                key={v.id}
                vehicle={v}
                profil={profil}
                reservations={reservations[v.id] || []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Carte véhicule ────────────────────────────────────────────────────────────
function CarteVehicule({ vehicle, profil, reservations }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    prenom:'', nom:'', tel:'+33 ', dateDebut:'', dateFin:'', message:''
  });
  const [sent, setSent] = useState(false);

  const cover = (vehicle.photos_vehicule || [])[0];
  const wa    = (profil.whatsapp || profil.tel || '').replace(/\D/g, '');

  function nbJours() {
    if (!form.dateDebut || !form.dateFin) return 0;
    return Math.max(1, Math.ceil(
      (new Date(form.dateFin) - new Date(form.dateDebut)) / 86400000
    ));
  }

  function sendWhatsApp() {
    const j = nbJours();
    const msg =
      `Bonjour, je souhaite louer le ${vehicle.marque} ${vehicle.modele}.\n`
      + `Je m'appelle ${form.prenom} ${form.nom}.\n`
      + `Tél : ${form.tel}\n`
      + `Du ${form.dateDebut} au ${form.dateFin}`
      + (j ? ` (${j} jour${j > 1 ? 's' : ''})\n` : '\n')
      + (form.message ? `\nMessage : ${form.message}` : '');
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(msg), '_blank');
    setSent(true);
  }

  const IS = {
    width:'100%', border:'1px solid #d1d5db', borderRadius:8,
    padding:'9px 11px', fontSize:14, boxSizing:'border-box'
  };

  return (
    <div style={{ background:'white', borderRadius:14, overflow:'hidden',
      boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}>

      {/* Photo */}
      <div style={{ height:180, background:'#f1f5f9', overflow:'hidden' }}>
        {cover
          ? <img src={cover.data} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : <div style={{ display:'flex', alignItems:'center',
              justifyContent:'center', height:'100%', fontSize:48 }}>🚗</div>
        }
      </div>

      <div style={{ padding:16 }}>
        {/* Titre */}
        <div style={{ fontWeight:800, fontSize:18, marginBottom:2 }}>
          {vehicle.marque} {vehicle.modele}
        </div>
        <div style={{ fontSize:13, color:'#6b7280', marginBottom:12 }}>
          {vehicle.couleur} · {vehicle.annee}
        </div>

        {/* Prix */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
          gap:8, marginBottom:14 }}>
          <div style={{ background:'#eff6ff', borderRadius:8, padding:10, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#6b7280' }}>Prix/jour</div>
            <div style={{ fontWeight:800, color:'#2563eb', fontSize:16 }}>{vehicle.tarif} €</div>
          </div>
          <div style={{ background:'#fef3c7', borderRadius:8, padding:10, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#6b7280' }}>Caution</div>
            <div style={{ fontWeight:800, color:'#d97706', fontSize:16 }}>{vehicle.caution} €</div>
          </div>
        </div>

        {/* Calendrier disponibilités */}
        <CalendrierDispo reservations={reservations} />

        {/* Formulaire réservation WhatsApp */}
        {!open ? (
          <button onClick={() => setOpen(true)}
            style={{ width:'100%', padding:'11px 0', background:'#25D366',
              color:'white', border:'none', borderRadius:10,
              fontSize:14, fontWeight:700, cursor:'pointer' }}>
            💬 Réserver sur WhatsApp
          </button>
        ) : sent ? (
          <div style={{ textAlign:'center', padding:'16px 0',
            background:'#f0fdf4', borderRadius:10, border:'1px solid #bbf7d0' }}>
            <div style={{ fontSize:32, marginBottom:6 }}>✅</div>
            <div style={{ fontWeight:700, color:'#16a34a', marginBottom:10, fontSize:15 }}>
              Message envoyé !
            </div>
            <button onClick={() => { setSent(false); setForm({ prenom:'', nom:'',
              tel:'+33 ', dateDebut:'', dateFin:'', message:'' }); setOpen(false); }}
              style={{ padding:'8px 18px', background:'#e5e7eb', border:'none',
                borderRadius:8, cursor:'pointer', fontSize:13 }}>
              Fermer
            </button>
          </div>
        ) : (
          <div style={{ background:'#f8fafc', borderRadius:10, padding:14,
            border:'1px solid #e5e7eb', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:4 }}>
              <span style={{ fontWeight:700, fontSize:13, color:'#374151' }}>
                Demande de réservation
              </span>
              <button onClick={() => setOpen(false)}
                style={{ border:'none', background:'#fef2f2', color:'#ef4444',
                  borderRadius:6, padding:'4px 10px', cursor:'pointer',
                  fontSize:13, fontWeight:700 }}>✕</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <input placeholder="Prénom *" value={form.prenom}
                onChange={e => setForm(f => ({...f, prenom:e.target.value}))} style={IS}/>
              <input placeholder="Nom *" value={form.nom}
                onChange={e => setForm(f => ({...f, nom:e.target.value}))} style={IS}/>
            </div>
            <input placeholder="Téléphone *" value={form.tel}
              onChange={e => setForm(f => ({...f, tel:e.target.value}))} style={IS}/>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <div>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:3 }}>Date début *</div>
                <input type="date" value={form.dateDebut}
                  onChange={e => setForm(f => ({...f, dateDebut:e.target.value}))} style={IS}/>
              </div>
              <div>
                <div style={{ fontSize:11, color:'#6b7280', marginBottom:3 }}>Date fin *</div>
                <input type="date" value={form.dateFin}
                  onChange={e => setForm(f => ({...f, dateFin:e.target.value}))} style={IS}/>
              </div>
            </div>

            {nbJours() > 0 && (
              <div style={{ background:'#eff6ff', borderRadius:8,
                padding:'8px 11px', fontSize:13, color:'#2563eb', fontWeight:600 }}>
                {nbJours()} jour{nbJours() > 1 ? 's' : ''} — {nbJours() * vehicle.tarif} €
              </div>
            )}

            <textarea placeholder="Message (optionnel)" value={form.message}
              onChange={e => setForm(f => ({...f, message:e.target.value}))}
              rows={2} style={{ ...IS, resize:'none', fontFamily:'inherit' }}/>

            <button onClick={() => {
              if (!form.prenom || !form.nom || !form.tel ||
                  !form.dateDebut || !form.dateFin) {
                alert('Merci de remplir les champs obligatoires *'); return;
              }
              sendWhatsApp();
            }} style={{ width:'100%', padding:'11px 0', background:'#25D366',
              color:'white', border:'none', borderRadius:10,
              fontSize:14, fontWeight:700, cursor:'pointer' }}>
              💬 Envoyer sur WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
