// src/utils/supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Obtén estos valores de tu proyecto en supabase.com
const supabaseUrl = 'https://yxnbpsssmojpvgryjyof.supabase.co'; // Reemplaza con tu URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bmJwc3NzbW9qcHZncnlqeW9mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODI3NDg0OCwiZXhwIjoyMDgzODUwODQ4fQ.jDMhewcFTlMNxgcC3-QeySSZ04MLAhWeM6oj4FOvdR0'; // Reemplaza con tu clave anónima

// Crea el cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});