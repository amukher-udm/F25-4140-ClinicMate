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

// API route to get profile data from 'patients' table
// Returns an array of patient objects 
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
  res.json({ patients: data[0] });
});

//Sign up expecting {email,password,first_name,last_name} from form
app.post('/api/sign_up', async (req, res) => {//Sign up api
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
app.post('/api/log_in', async (req, res) => {//Log in api
  const formData = req.body
  const email = formData.email;
  const password = formData.password;

  const { error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
    options: {
      // Optional: Specify a redirect URL after email confirmation
      emailRedirectTo: 'http://localhost:3000/Profile'
    }
})
});

app.get('/api/explore_page', async (req, res) => {
  
  try {
   const { data: hospitals, error: hospitalError } = await supabase
    .from('hospitals')
    .select(
      `
      *,
      ...address!inner()
      `,
    );

    if (hospitalError) {
      console.error('Error fetching hospitals:', hospitalError);
      return res.status(500).json({ error: 'Failed to fetch hospitals' });
    }

    const { data: doctors, error: doctorError } = await supabase
    .from('doctors')
    .select(
      `
      *,
      ...hospitals!inner(
        ...address!inner()
      ),
      ...specialty!inner()
      `,
    )
    if (doctorError) {
      console.error('Error fetching doctors:', doctorError);
      return res.status(500).json({ error: 'Failed to fetch doctors' });
    }
    
    res.json({ hospitals, doctors });
  } catch (err) {
    console.error('Unexpected error in /api/explore_page:', err);
    res.status(500).json({ error: err.message });
  }
});


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
