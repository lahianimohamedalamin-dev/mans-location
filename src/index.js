import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';

// Chargement séparé : la vitrine et l'app sont 2 bundles distincts
// => un visiteur vitrine ne télécharge PAS le code de l'app
const App     = React.lazy(() => import('./App'));
const Vitrine = React.lazy(() => import('./Vitrine'));

const isVitrine = window.location.pathname.startsWith('/vitrine/');

// Écran de chargement minimaliste
function Loader() {
  return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',
      minHeight:'100vh',background:'#0a1940'}}>
      <div style={{textAlign:'center'}}>
        <img src="/logo.png" alt="Man's Loc"
          style={{height:80,width:'auto',marginBottom:16,opacity:.9}}/>
        <div style={{color:'rgba(255,255,255,.6)',fontSize:13}}>Chargement…</div>
      </div>
    </div>
  );
}

// Error boundary pour éviter la page blanche en cas d'erreur
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={err:null}; }
  static getDerivedStateFromError(e){ return {err:e}; }
  render(){
    if(this.state.err){
      // Effacer le localStorage corrompu et recharger
      try{ localStorage.removeItem('ml_page'); }catch{}
      return(
        <div style={{display:'flex',flexDirection:'column',justifyContent:'center',
          alignItems:'center',minHeight:'100vh',background:'#0a1940',padding:24,textAlign:'center'}}>
          <img src="/logo.png" alt="Man's Loc" style={{height:70,marginBottom:20,opacity:.8}}/>
          <div style={{color:'white',fontWeight:700,fontSize:16,marginBottom:8}}>
            Une erreur est survenue
          </div>
          <div style={{color:'rgba(255,255,255,.6)',fontSize:13,marginBottom:24}}>
            {this.state.err?.message||'Erreur inconnue'}
          </div>
          <button onClick={()=>window.location.reload()}
            style={{background:'#fbbf24',color:'#1f2937',border:'none',borderRadius:10,
              padding:'12px 28px',fontWeight:700,fontSize:14,cursor:'pointer'}}>
            Recharger l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <Suspense fallback={<Loader/>}>
        {isVitrine ? <Vitrine/> : <App/>}
      </Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);

reportWebVitals();
