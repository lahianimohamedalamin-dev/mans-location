import React, { createContext, useReducer, useContext, useEffect } from 'react';
import { supabase } from '../supabase';

const AppContext = createContext();

const initialState = {
  vehicles: [],
  contrats: [],
  depenses: [],
  profil: { nom: 'ZAURY Anas', entreprise: "MAN'S LOCATION" },
  user: null
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_VEHICLES':
      return { ...state, vehicles: action.payload };
    case 'SET_CONTRATS':
      return { ...state, contrats: action.payload };
    case 'SET_DEPENSES':
      return { ...state, depenses: action.payload };
    case 'SET_PROFIL':
      return { ...state, profil: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SAVE_VEHICLE':
    case 'SAVE_CONTRAT':
    case 'SAVE_DEPENSE':
    case 'SAVE_PROFIL':
    case 'SAVE_RETOUR':
      return state; // Optimistic handled in useEffect
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load/Save helper
  const saveToSupabase = async (table, data) => {
    const { error } = await supabase
      .from(table)
      .upsert(data, { onConflict: 'id' });
    if (error) console.error(`Save ${table} error:`, error);
  };

// SAVE handlers - dispatch SAVE_* to trigger

  useEffect(() => {
    const loadData = async () => {
      const { data: vehicles } = await supabase.from('vehicles').select('*');
      dispatch({ type: 'SET_VEHICLES', payload: vehicles || [] });

      const { data: contrats } = await supabase.from('contrats').select('*').order('id', { ascending: false });
      dispatch({ type: 'SET_CONTRATS', payload: contrats || [] });
      
      const { data: depenses } = await supabase.from('depenses').select('*');
      dispatch({ type: 'SET_DEPENSES', payload: depenses || [] });
    };
    loadData();
  }, []);

  const saveHelpers = {
    saveVehicle: async (vehicle) => {
      await saveToSupabase('vehicles', vehicle);
      // Reload or optimistic update
      const { data } = await supabase.from('vehicles').select('*').eq('id', vehicle.id).single();
      dispatch({ type: 'SET_VEHICLES', payload: state.vehicles.map(v => v.id === vehicle.id ? data : v) });
    },
    saveContrat: async (contrat) => {
      await saveToSupabase('contrats', contrat);
      const { data } = await supabase.from('contrats').select('*').eq('id', contrat.id).single();
      dispatch({ type: 'SET_CONTRATS', payload: [data, ...state.contrats.filter(c => c.id !== contrat.id)] });
    },
    saveDepense: async (depense) => {
      await saveToSupabase('depenses', depense);
      const { data } = await supabase.from('depenses').select('*').eq('id', depense.id).single();
      dispatch({ type: 'SET_DEPENSES', payload: [...state.depenses.filter(d => d.id !== depense.id), data] });
    },
    saveProfil: async (profil) => {
      await saveToSupabase('profil', { id: 1, ...profil });
      dispatch({ type: 'SET_PROFIL', payload: profil });
    },
    saveRetour: async (retourId, data) => {
      await saveToSupabase('retours', { id: retourId, ...data });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, saveHelpers }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext doit être utilisé dans AppProvider');
  return context;
};

