import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

// ── Validation téléphone ─────────────────────────────────────────────────────
function safeTel(tel) {
  return /^[+\d\s\-()\\.]+$/.test(tel || '') ? tel : '';
}

// ── Lightbox plein écran ─────────────────────────────────────────────────────
function Lightbox({ srcs, startIndex = 0, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  const prev = useCallback(() => setIdx(i => (i - 1 + srcs.length) % srcs.length), [srcs.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % srcs.length), [srcs.length]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape')     onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, onClose]);

  const btnCircle = {
    border: 'none',
    background: 'rgba(255,255,255,.18)',
    color: 'white',
    width: 44,
    height: 44,
    borderRadius: '50%',
    fontSize: 24,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(0,0,0,.96)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        style={{ ...btnCircle, position: 'absolute', top: 18, right: 18 }}
      >✕</button>

      {/* Image + flèches */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}
      >
        {srcs.length > 1 && (
          <button onClick={prev} style={{ ...btnCircle, position: 'absolute', left: -56, top: '50%', transform: 'translateY(-50%)' }}>‹</button>
        )}
        <img
          src={srcs[idx]}
          alt=""
          style={{ maxWidth: '95vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: 8 }}
        />
        {srcs.length > 1 && (
          <button onClick={next} style={{ ...btnCircle, position: 'absolute', right: -56, top: '50%', transform: 'translateY(-50%)' }}>›</button>
        )}
      </div>

      {/* Points de navigation + compteur */}
      {srcs.length > 1 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20 }}
        >
          {srcs.map((_, i) => (
            <div
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === idx ? 'white' : 'rgba(255,255,255,.4)',
                cursor: 'pointer',
                transition: 'width .2s',
              }}
            />
          ))}
        </div>
      )}
      <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, marginTop: 10 }}>
        {idx + 1} / {srcs.length}
      </div>
    </div>
  );
}

// ── Calendrier de disponibilités ─────────────────────────────────────────────
function CalendrierDispo({ reservations }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const MOIS = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
  ];
  const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

  function toStr(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const todayStr = toStr(today);

  function isBooked(d) {
    const s = toStr(d);
    return reservations.some(r => s >= r.dateDebut && s <= r.dateFin);
  }

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const canPrev = year > today.getFullYear() ||
    (year === today.getFullYear() && month > today.getMonth());

  function prevM() {
    if (!canPrev) return;
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextM() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  return (
    <div style={{
      margin: '14px 0', background: '#f8fafc',
      borderRadius: 12, padding: '12px', border: '1px solid #e5e7eb',
    }}>
      {/* En-tête mois */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button
          onClick={prevM}
          disabled={!canPrev}
          style={{
            border: 'none',
            background: canPrev ? '#e5e7eb' : 'transparent',
            width: 32, height: 32, borderRadius: 8,
            cursor: canPrev ? 'pointer' : 'default',
            color: canPrev ? '#374151' : '#d1d5db',
            fontSize: 18, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >‹</button>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#1e3a8a' }}>
          {MOIS[month]} {year}
        </span>
        <button
          onClick={nextM}
          style={{
            border: 'none', background: '#e5e7eb',
            width: 32, height: 32, borderRadius: 8,
            cursor: 'pointer', color: '#374151',
            fontSize: 18, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >›</button>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 10, fontSize: 12, color: '#6b7280' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, background: '#d1fae5', borderRadius: 4, border: '1px solid #6ee7b7' }} />
          Disponible
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ display: 'inline-block', width: 14, height: 14, background: '#f3f4f6', borderRadius: 4, border: '1px solid #d1d5db' }} />
          Non disponible
        </span>
      </div>

      {/* Grille */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
        {JOURS.map((j, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 11, color: '#6b7280',
            fontWeight: 700, padding: '4px 0',
            borderBottom: '2px solid #e5e7eb', marginBottom: 2,
          }}>
            {j}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const dStr    = toStr(d);
          const past    = dStr < todayStr;
          const booked  = !past && isBooked(d);
          const isToday = dStr === todayStr;
          return (
            <div key={i} style={{
              textAlign: 'center',
              fontSize: 13,
              padding: '7px 2px',
              borderRadius: 7,
              background: past ? 'transparent' : booked ? '#f3f4f6' : '#d1fae5',
              color:      past ? '#d1d5db'     : booked ? '#9ca3af'  : '#15803d',
              fontWeight: isToday ? 900 : 500,
              border: isToday ? '2px solid #2563eb' : '2px solid transparent',
              boxSizing: 'border-box',
            }}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Modal détail véhicule ────────────────────────────────────────────────────
function VehiculeDetailModal({ vehicle, profil, reservations, onClose }) {
  const photos   = (vehicle.photos_vehicule || []).map(p => p.data || p);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const [form, setForm] = useState({ prenom: '', nom: '', age: '', dateDebut: '', dateFin: '', message: '' });
  const [sent, setSent]  = useState(false);

  const wa = (profil.whatsapp || profil.tel || '').replace(/\D/g, '');
  const hasContact = !!(safeTel(profil.tel) || wa);

  function nbJours() {
    if (!form.dateDebut || !form.dateFin) return 0;
    return Math.max(1, Math.ceil((new Date(form.dateFin) - new Date(form.dateDebut)) / 86400000));
  }

  function sendWhatsApp() {
    const j = nbJours();
    const msg =
      `Bonjour, je souhaite louer le ${vehicle.marque} ${vehicle.modele}.\n`
      + `Je m'appelle ${form.prenom} ${form.nom}${form.age ? `, ${form.age} ans` : ''}.\n`
      + `Du ${form.dateDebut} au ${form.dateFin}`
      + (j ? ` (${j} jour${j > 1 ? 's' : ''}) — ${j * vehicle.tarif} €\n` : '\n')
      + (form.message ? `\nMessage : ${form.message}` : '');
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(msg), '_blank');
    setSent(true);
  }

  const IS = {
    width: '100%', border: '1px solid #d1d5db', borderRadius: 8,
    padding: '9px 11px', fontSize: 14, boxSizing: 'border-box',
  };

  const chips = [
    vehicle.puissance_fiscale && { icon: '⚡', label: `${vehicle.puissance_fiscale} CV fiscaux` },
    vehicle.nb_portes          && { icon: '🚪', label: `${vehicle.nb_portes} portes` },
    vehicle.nb_places          && { icon: '👥', label: `${vehicle.nb_places} places` },
    vehicle.motorisation       && { icon: '⛽', label: vehicle.motorisation },
    vehicle.boite              && { icon: '⚙️', label: `Boîte ${vehicle.boite}` },
    (vehicle.km_illimite
      ? { icon: '🛣️', label: 'Km illimité' }
      : vehicle.km_inclus
        ? { icon: '🛣️', label: `${vehicle.km_inclus} km inclus/j` }
        : null),
  ].filter(Boolean);

  return (
    <>
      {lightbox && photos.length > 0 && (
        <Lightbox srcs={photos} startIndex={photoIdx} onClose={() => setLightbox(false)} />
      )}
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,.7)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          overflowY: 'auto', padding: '20px 0',
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'white', borderRadius: 20,
            maxWidth: 680, width: '100%', margin: '0 20px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 60px rgba(0,0,0,.3)',
          }}
        >
          {/* Bouton fermer modal */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                border: 'none', background: 'rgba(0,0,0,.4)',
                color: 'white', width: 36, height: 36, borderRadius: '50%',
                fontSize: 18, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>

            {/* Section galerie */}
            {photos.length > 0 ? (
              <div>
                {/* Photo principale */}
                <div
                  onClick={() => setLightbox(true)}
                  style={{ position: 'relative', cursor: 'zoom-in', height: 280, background: '#1a1a2e', overflow: 'hidden' }}
                >
                  <img
                    src={photos[photoIdx]}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Badge nombre photos */}
                  {photos.length > 1 && (
                    <div style={{
                      position: 'absolute', bottom: 10, right: 10,
                      background: 'rgba(0,0,0,.6)', color: 'white',
                      borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700,
                    }}>
                      📷 {photos.length} photos
                    </div>
                  )}
                </div>
                {/* Miniatures */}
                {photos.length > 1 && (
                  <div style={{ display: 'flex', gap: 6, padding: '8px 10px', background: '#0a1940', overflowX: 'auto' }}>
                    {photos.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        onClick={() => setPhotoIdx(i)}
                        style={{
                          width: 80, height: 60, objectFit: 'cover',
                          borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                          border: i === photoIdx ? '2px solid #2563eb' : '2px solid transparent',
                          opacity: i === photoIdx ? 1 : 0.65,
                          transition: 'opacity .2s',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ height: 200, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72 }}>
                🚗
              </div>
            )}
          </div>

          {/* Section infos */}
          <div style={{ padding: 20 }}>
            {/* Titre */}
            <div style={{ fontSize: 24, fontWeight: 900, color: '#0a1940', marginBottom: 4 }}>
              {vehicle.marque} {vehicle.modele}
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>
              {[vehicle.couleur, vehicle.annee, vehicle.type_vehicule].filter(Boolean).join(' · ')}
            </div>

            {/* Chips caractéristiques */}
            {chips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                {chips.map((c, i) => (
                  <div key={i} style={{
                    background: '#f1f5f9', borderRadius: 8, padding: '8px 12px',
                    fontSize: 12, fontWeight: 700, color: '#374151',
                  }}>
                    {c.icon} {c.label}
                  </div>
                ))}
              </div>
            )}

            {/* Tarifs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, background: '#eff6ff', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Prix / jour</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#2563eb' }}>{vehicle.tarif} €</div>
              </div>
              <div style={{ flex: 1, background: '#fff7ed', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Caution</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#ea580c' }}>{vehicle.caution} €</div>
              </div>
            </div>

            {/* Disponibilités */}
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0a1940', marginBottom: 4 }}>
              Disponibilités
            </div>
            <CalendrierDispo reservations={reservations} />

            {/* Réservation */}
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0a1940', margin: '18px 0 12px' }}>
              Réservation
            </div>

            {!hasContact ? (
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, textAlign: 'center', color: '#6b7280', fontSize: 14, border: '1px solid #e5e7eb' }}>
                Contactez-nous directement pour réserver.
              </div>
            ) : sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 16, marginBottom: 12 }}>
                  Message envoyé sur WhatsApp !
                </div>
                <button
                  onClick={() => { setSent(false); setForm({ prenom: '', nom: '', age: '', dateDebut: '', dateFin: '', message: '' }); }}
                  style={{ padding: '8px 20px', background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
                >
                  Nouvelle demande
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input placeholder="Prénom *" value={form.prenom}
                    onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} style={IS} />
                  <input placeholder="Nom *" value={form.nom}
                    onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} style={IS} />
                </div>
                <input placeholder="Âge *" type="number" min="18" max="99" value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))} style={IS} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>Date début *</div>
                    <input type="date" value={form.dateDebut}
                      onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))} style={IS} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3 }}>Date fin *</div>
                    <input type="date" value={form.dateFin}
                      onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))} style={IS} />
                  </div>
                </div>
                {nbJours() > 0 && (
                  <div style={{ background: '#eff6ff', borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#2563eb', fontWeight: 700 }}>
                    {nbJours()} jour{nbJours() > 1 ? 's' : ''} — Total : {nbJours() * vehicle.tarif} €
                  </div>
                )}
                <textarea
                  placeholder="Message (optionnel)" value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={2} style={{ ...IS, resize: 'none', fontFamily: 'inherit' }}
                />
                <button
                  onClick={() => {
                    if (!form.prenom || !form.nom || !form.age || !form.dateDebut || !form.dateFin) {
                      alert('Merci de remplir les champs obligatoires *');
                      return;
                    }
                    sendWhatsApp();
                  }}
                  style={{
                    width: '100%', padding: '13px 0',
                    background: '#25D366', color: 'white',
                    border: 'none', borderRadius: 10,
                    fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  💬 Réserver sur WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Carte véhicule ────────────────────────────────────────────────────────────
function CarteVehicule({ vehicle, profil, reservations }) {
  const [showDetail, setShowDetail] = useState(false);
  const [hovered, setHovered]       = useState(false);

  const photos = (vehicle.photos_vehicule || []).map(p => p.data || p);
  const cover  = photos[0];

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'white', borderRadius: 14, overflow: 'hidden',
          boxShadow: hovered
            ? '0 12px 32px rgba(10,25,64,.18)'
            : '0 2px 8px rgba(0,0,0,.08)',
          transform: hovered ? 'translateY(-4px)' : 'none',
          transition: 'box-shadow .2s, transform .2s',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Photo */}
        <div
          onClick={() => setShowDetail(true)}
          style={{ position: 'relative', height: 220, background: '#f1f5f9', overflow: 'hidden', cursor: 'pointer' }}
        >
          {cover
            ? <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 64 }}>🚗</div>
          }
          {photos.length > 1 && (
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              background: 'rgba(0,0,0,.55)', color: 'white',
              borderRadius: 20, padding: '3px 9px', fontSize: 12, fontWeight: 700,
            }}>
              📷 {photos.length}
            </div>
          )}
        </div>

        {/* Infos */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 19, color: '#0a1940', lineHeight: 1.2 }}>
            {vehicle.marque} {vehicle.modele}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {[vehicle.couleur, vehicle.annee].filter(Boolean).join(' · ')}
          </div>

          {/* Chips tarif/caution */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1, background: '#eff6ff', borderRadius: 8,
              padding: '8px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Prix/jour</div>
              <div style={{ fontWeight: 800, color: '#2563eb', fontSize: 15 }}>{vehicle.tarif} €</div>
            </div>
            <div style={{
              flex: 1, background: '#fff7ed', borderRadius: 8,
              padding: '8px 10px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Caution</div>
              <div style={{ fontWeight: 800, color: '#ea580c', fontSize: 15 }}>{vehicle.caution} €</div>
            </div>
          </div>

          {/* Bouton */}
          <button
            onClick={() => setShowDetail(true)}
            style={{
              width: '100%', marginTop: 4,
              padding: '12px 0',
              background: 'linear-gradient(135deg, #0a1940 0%, #2563eb 100%)',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 800, cursor: 'pointer',
              letterSpacing: '.3px',
            }}
          >
            🔍 Voir & Réserver →
          </button>
        </div>
      </div>

      {showDetail && (
        <VehiculeDetailModal
          vehicle={vehicle}
          profil={profil}
          reservations={reservations}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  );
}

// ── Vitrine principale ───────────────────────────────────────────────────────
export default function Vitrine() {
  const [profil,       setProfil]       = useState(null);
  const [vehicles,     setVehicles]     = useState([]);
  const [reservations, setReservations] = useState({});
  const [loading,      setLoading]      = useState(true);

  const slug = (window.location.pathname.split('/vitrine/')[1] || '').replace(/\/$/, '').trim();

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    async function load() {
      // 1. Profil par user_id exact
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

      // 4. Contrats → disponibilités
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚗</div>
        <p style={{ color: '#6b7280', fontSize: 15 }}>Chargement en cours…</p>
      </div>
    </div>
  );

  if (!profil) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f1f5f9' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
        <p style={{ color: '#6b7280', fontSize: 16 }}>Vitrine introuvable.</p>
      </div>
    </div>
  );

  const wa = (profil.whatsapp || profil.tel || '').replace(/\D/g, '');

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'Arial, sans-serif' }}>

      {/* ── Header hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a1940 0%, #1e3a8a 60%, #2563eb 100%)',
        padding: '40px 20px', textAlign: 'center', color: 'white',
      }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🚗</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-.5px' }}>
          {profil.entreprise || 'Location de véhicules'}
        </h1>
        {(profil.adresse || profil.ville) && (
          <p style={{ fontSize: 14, opacity: .75, margin: '0 0 14px' }}>
            {[profil.adresse, profil.ville].filter(Boolean).join(' · ')}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          {safeTel(profil.tel) && (
            <a href={`tel:${safeTel(profil.tel)}`}
              style={{ color: '#4ade80', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
              📞 {profil.tel}
            </a>
          )}
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              style={{
                background: '#25D366', color: 'white',
                padding: '8px 18px', borderRadius: 24,
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              💬 WhatsApp
            </a>
          )}
        </div>
        <p style={{ fontSize: 13, opacity: .55, marginTop: 16, marginBottom: 0 }}>
          📍 Location de véhicules professionnelle
        </p>
      </div>

      {/* ── Section véhicules ── */}
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '0 16px 40px' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0a1940', margin: '24px 0' }}>
          Nos véhicules
        </h2>

        {vehicles.length === 0 ? (
          <div style={{
            textAlign: 'center', color: '#9ca3af',
            padding: 48, background: 'white', borderRadius: 14,
            boxShadow: '0 2px 8px rgba(0,0,0,.06)',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🚗</div>
            <p style={{ fontSize: 15 }}>Aucun véhicule disponible pour le moment.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))',
            gap: 20,
          }}>
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
