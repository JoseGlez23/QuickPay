// src/utils/supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Obtén estos valores de tu proyecto en supabase.com
const supabaseUrl = 'https://yxnbpsssmojpvgryjyof.supabase.co'; // Reemplaza con tu URL
const supabaseAnonKey = 'sb_secret_7fNwm8CMxOolHbOrvG5ZXA_cyFP6k66'; // Reemplaza con tu clave anónima

// Crea el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});