import express from 'express';
import path from 'path';
import ViteExpress from 'vite-express';
import dotenv from 'dotenv';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
require('dotenv').config()
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

// --- SUPABASE CLIENT INITIALIZATION ---
// Create a single Supabase client for interacting with your database
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Check .env file.");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);


//Check Auth 
const checkAuth = async (req, res, next) => {
  // 1. Check for an 'Authorization' header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ error: 'Unauthorized: No token provided' });

  // 2. Extract the token
  const token = authHeader.split(' ')[1];

  // 3. Verify the token with Supabase
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error)
      return res.status(401).json({ error: 'Unauthorized: ' + error.message });
    if (!user)
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });

    // 4. Attach user info to the request and proceed
    req.user = user;
    next();
  } catch (error) {
    console.error('Unexpected error in auth middleware:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};


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
//Sign up expecting {email,password,first_name,last_name} from form
app.post('/api/sign-up', async (req, res) => {//Sign up api
  const formData = req.body
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      // Optional: Specify a redirect URL after email confirmation
      emailRedirectTo: 'http://localhost:3000/Profile'
    }

  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  else {
    const { data2, error2 } = await supabase
      .from('patients')
      .upsert({ id: data.user.uuid, first_name: formData.first_name, last_name: formData.last_name })
      .select()
    if (error2) {
      return res.status(400).json({ error: error.message });
    }
    return res.json({ message: 'Sign-in successful' }, { status: 200 })
  }
});
//Log in api expects {email,password}
app.post('/api/log-in', async (req, res) => {//Log in api
  const formData = req.body
  const email = formData.email;
  const password = formData.password;

  const { error } = await _supabase.auth.signInWithPassword({
    email: email,
    password: password,
    options: {
      // Optional: Specify a redirect URL after email confirmation
      emailRedirectTo: 'http://localhost:3000/Profile'
    }
  });

  //Block editables

  if (error) {
    return res.status(400).json({ error: error.message });
  }
  return res.json({ message: 'Sign-in successful' }, { status: 200 })
});

app.get('/api/profile_data', (req, res) => {
  hospitals = []
  res.json({});
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
