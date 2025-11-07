import express from 'express';
import path from 'path';
import ViteExpress from 'vite-express';
import dotenv from 'dotenv';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config(); //configures process.env from .env file

const app = express(); // initilize express app
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Connect to the database
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dummy API route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Add your API routes here
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from Express!' });
});

app.get('/api/profile_data', async (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) {
    return res.status(400).json({ error: 'user_id query parameter is required' });
  }
  const { data, error } = await supabase
  .from('patients')
  .select(
    `
    *,
    address: address_fk!inner(*)
    `
  )
  .eq('user_id', user_id);
  if (error) {
    console.error('Error fetching patients:', error);
    return res.status(500).json({ error: 'Failed to fetch patients' });
  }
   res.json({ patients: data });
})

if (isDev) {
    // --- Development: use vite-express to run Vite as middleware ---
    const frontendRoot = path.resolve(__dirname, '../client');
    ViteExpress.config({ 
      mode: "development",
      inlineViteConfig: { root: frontendRoot },
    });
  
    ViteExpress.listen(app, PORT, () => {
      console.log(`Server running on http://localhost:${PORT} with ViteExpress`);
    });

} else {
    // In production, serve built files
    const distDir = path.resolve(__dirname, '../client/dist');
    app.use(express.static(distDir));
  
    //default to index.html for SPA
    app.get('*', (req, res) => {
      res.sendFile('index.html', { root: '../client/dist' });
    });
  
    app.listen(PORT, () => {
      console.log(`Server running on Port:${PORT}`);
    });
}
