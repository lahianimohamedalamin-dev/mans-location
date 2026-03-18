import { useState, useEffect } from 'react';
import { supabase } from './supabase';

/** Valide qu'un numéro de téléphone ne contient que des caractères autorisés */
function safeTel(tel){ return /^[+\d\s\-()\\.]+$/.test(tel||"")?tel:""; }

export default function Vitrine() {
  const [profil, setProfil] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const slug = window.location.pathname.split('/vitrine/')[1];

  useEffect(() => {
    if (!slug) return;
    async function load() {
      const { data: profils } = await supabase
        .from('profils')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      setProfil(profils);

      const { data: vehs } = await supabase
        .from('vehicules')
        .select('*')
        .eq('user_id', profils?.user_id)
        .eq('publie', true);
      setVehicles(vehs || []);

      setLoading(false);
    }
    load();
  }, [slug]);

  async function envoyerQuestion(vehicleId, vehicleLabel, question, tel) {
    await supabase.from('questions').insert([{
      user_id: profil?.user_id,
      vehicle_id: vehicleId,
      vehicle_label: vehicleLabel,
      client_nom: 'Client vitrine',
      client_tel: tel || '',
      question: question,
      lu: false
    }]);
  }

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
        padding:'20px', textAlign:'center', color:'white' }}>
        <h1 style={{ fontSize:24, fontWeight:800, marginBottom:4 }}>
          {profil.entreprise || 'Location de véhicules'}
        </h1>
        <p style={{ fontSize:13, opacity:.8 }}>
          {profil.adresse}{profil.ville && ' · ' + profil.ville}
        </p>
        {safeTel(profil.tel) && (
          <a href={`tel:${safeTel(profil.tel)}`} style={{ color:'#4ade80',
            fontSize:14, fontWeight:700, textDecoration:'none' }}>
            📞 {profil.tel}
          </a>
        )}
      </div>

      {/* Véhicules */}
      <div style={{ maxWidth:960, margin:'0 auto', padding:16 }}>
        <h2 style={{ fontSize:16, fontWeight:700, color:'#1f2937',
          margin:'16px 0 12px' }}>Nos véhicules disponibles</h2>

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
                onQuestion={envoyerQuestion}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CarteVehicule({ vehicle, profil, onQuestion }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('resa');
  const [form, setForm] = useState({
    prenom:'', nom:'', age:'', tel:'+33 ',
    email:'', dateDebut:'', dateFin:'', message:''
  });
  const [question, setQuestion] = useState('');
  const [sent, setSent] = useState(false);
  const [qSent, setQSent] = useState(false);

  const cover = (vehicle.photos_vehicule || [])[0];
  const wa = (profil.whatsapp || profil.tel || '').replace(/\D/g, '');

  function sendWhatsApp() {
    const nbJ = form.dateDebut && form.dateFin
      ? Math.max(1, Math.ceil(
          (new Date(form.dateFin) - new Date(form.dateDebut)) / 86400000
        )) : null;
    const msg = `Bonjour, je souhaite louer le ${vehicle.marque} ${vehicle.modele}.\n`
      + `Je m'appelle ${form.prenom} ${form.nom}, j'ai ${form.age} ans.\n`
      + `Tel : ${form.tel}\nEmail : ${form.email}\n`
      + `Du ${form.dateDebut} au ${form.dateFin}`
      + (nbJ ? ` (${nbJ} jour${nbJ > 1 ? 's' : ''})\n` : '\n')
      + (form.message ? `\nMessage : ${form.message}` : '');
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(msg), '_blank');
    setSent(true);
  }

  async function sendQuestion() {
    if (!question.trim()) return;
    await onQuestion(
      vehicle.id,
      vehicle.marque + ' ' + vehicle.modele,
      question,
      ''
    );
    setQSent(true);
    setQuestion('');
  }

  const IS = {
    width:'100%', border:'1px solid #d1d5db',
    borderRadius:8, padding:'9px 11px',
    fontSize:14, boxSizing:'border-box'
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
        <div style={{ fontWeight:800, fontSize:18, marginBottom:2 }}>
          {vehicle.marque} {vehicle.modele}
        </div>
        <div style={{ fontSize:13, color:'#6b7280', marginBottom:12 }}>
          {vehicle.couleur} · {vehicle.annee}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
          gap:8, marginBottom:14 }}>
          <div style={{ background:'#eff6ff', borderRadius:8,
            padding:'10px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#6b7280' }}>Prix/jour</div>
            <div style={{ fontWeight:800, color:'#2563eb', fontSize:16 }}>{vehicle.tarif} €</div>
          </div>
          <div style={{ background:'#fef3c7', borderRadius:8,
            padding:'10px', textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#6b7280' }}>Caution</div>
            <div style={{ fontWeight:800, color:'#d97706', fontSize:16 }}>{vehicle.caution} €</div>
          </div>
        </div>

        {/* Boutons */}
        {!open ? (
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { setOpen(true); setTab('resa'); }}
              style={{ flex:1, padding:'10px 0', background:'#1e3a8a',
                color:'white', border:'none', borderRadius:8,
                fontSize:14, fontWeight:700, cursor:'pointer' }}>
              📅 Réserver
            </button>
            <button onClick={() => { setOpen(true); setTab('question'); }}
              style={{ flex:1, padding:'10px 0', background:'#f1f5f9',
                color:'#374151', border:'1px solid #e5e7eb',
                borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              ❓ Question
            </button>
          </div>
        ) : (
          <div style={{ background:'#f8fafc', borderRadius:10,
            padding:14, border:'1px solid #e5e7eb' }}>
            {/* Tabs */}
            <div style={{ display:'flex', gap:6, marginBottom:14 }}>
              <button onClick={() => setTab('resa')}
                style={{ flex:1, padding:'8px 0', borderRadius:7, border:'none',
                  cursor:'pointer', fontWeight:tab==='resa'?700:400,
                  background:tab==='resa'?'#1e3a8a':'#e5e7eb',
                  color:tab==='resa'?'white':'#374151', fontSize:13 }}>
                📅 Réservation
              </button>
              <button onClick={() => setTab('question')}
                style={{ flex:1, padding:'8px 0', borderRadius:7, border:'none',
                  cursor:'pointer', fontWeight:tab==='question'?700:400,
                  background:tab==='question'?'#7c3aed':'#e5e7eb',
                  color:tab==='question'?'white':'#374151', fontSize:13 }}>
                ❓ Question
              </button>
              <button onClick={() => setOpen(false)}
                style={{ padding:'8px 12px', borderRadius:7, border:'none',
                  cursor:'pointer', background:'#fef2f2',
                  color:'#ef4444', fontSize:13, fontWeight:700 }}>
                ✕
              </button>
            </div>

            {/* Réservation */}
            {tab === 'resa' && (sent ? (
              <div style={{ textAlign:'center', padding:'16px 0' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                <div style={{ fontWeight:700, color:'#16a34a', marginBottom:8, fontSize:15 }}>
                  Demande envoyée !
                </div>
                <button onClick={() => {
                  setSent(false);
                  setForm({ prenom:'', nom:'', age:'', tel:'+33 ',
                    email:'', dateDebut:'', dateFin:'', message:'' });
                }} style={{ padding:'8px 16px', background:'#e5e7eb',
                  border:'none', borderRadius:8, cursor:'pointer', fontSize:13 }}>
                  Nouvelle demande
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <input placeholder="Prénom *" value={form.prenom}
                    onChange={e => setForm(f => ({...f, prenom:e.target.value}))}
                    style={IS}/>
                  <input placeholder="Nom *" value={form.nom}
                    onChange={e => setForm(f => ({...f, nom:e.target.value}))}
                    style={IS}/>
                </div>
                <input placeholder="Âge *" type="number" value={form.age}
                  onChange={e => setForm(f => ({...f, age:e.target.value}))}
                  style={IS}/>
                <input placeholder="Téléphone *" value={form.tel}
                  onChange={e => setForm(f => ({...f, tel:e.target.value}))}
                  style={IS}/>
                <input placeholder="Email" value={form.email}
                  onChange={e => setForm(f => ({...f, email:e.target.value}))}
                  style={IS}/>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>Début *</div>
                    <input type="date" value={form.dateDebut}
                      onChange={e => setForm(f => ({...f, dateDebut:e.target.value}))}
                      style={IS}/>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>Fin *</div>
                    <input type="date" value={form.dateFin}
                      onChange={e => setForm(f => ({...f, dateFin:e.target.value}))}
                      style={IS}/>
                  </div>
                </div>
                {form.dateDebut && form.dateFin &&
                  new Date(form.dateFin) > new Date(form.dateDebut) && (
                  <div style={{ background:'#eff6ff', borderRadius:8,
                    padding:'8px 11px', fontSize:13, color:'#2563eb', fontWeight:600 }}>
                    {Math.ceil((new Date(form.dateFin) - new Date(form.dateDebut)) / 86400000)} jour(s) —{' '}
                    {Math.ceil((new Date(form.dateFin) - new Date(form.dateDebut)) / 86400000) * vehicle.tarif} €
                  </div>
                )}
                <textarea placeholder="Message (optionnel)" value={form.message}
                  onChange={e => setForm(f => ({...f, message:e.target.value}))}
                  rows={3} style={{ ...IS, resize:'none', fontFamily:'inherit' }}/>
                <button onClick={() => {
                  if (!form.prenom || !form.nom || !form.tel ||
                      !form.dateDebut || !form.dateFin) {
                    alert('Remplissez les champs obligatoires *'); return;
                  }
                  sendWhatsApp();
                }} style={{ width:'100%', padding:'11px 0', background:'#25D366',
                  color:'white', border:'none', borderRadius:10,
                  fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  💬 Envoyer sur WhatsApp
                </button>
              </div>
            ))}

            {/* Question */}
            {tab === 'question' && (qSent ? (
              <div style={{ textAlign:'center', padding:'16px 0' }}>
                <div style={{ fontSize:36, marginBottom:8 }}>✅</div>
                <div style={{ fontWeight:700, color:'#16a34a', marginBottom:8, fontSize:15 }}>
                  Question envoyée !
                </div>
                <button onClick={() => setQSent(false)}
                  style={{ padding:'8px 16px', background:'#e5e7eb',
                    border:'none', borderRadius:8, cursor:'pointer', fontSize:13 }}>
                  Nouvelle question
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <textarea placeholder="Votre question..." value={question}
                  onChange={e => setQuestion(e.target.value)} rows={4}
                  style={{ ...IS, resize:'none', fontFamily:'inherit' }}/>
                <button onClick={sendQuestion}
                  style={{ width:'100%', padding:'11px 0', background:'#7c3aed',
                    color:'white', border:'none', borderRadius:10,
                    fontSize:14, fontWeight:700, cursor:'pointer' }}>
                  Envoyer la question
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
