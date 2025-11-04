import express from 'express';
import path from 'path';

import ViteExpress from 'vite-express';
import dotenv from 'dotenv';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clinicApi } from './lib/clinic-api.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config(); //configures process.env from .env file

const app = express(); // initilize express app
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory user store for development / demo purposes
// In production this should be replaced with a database or Supabase queries.
const users = {
  '1': {
    id: '1',
    firstName: 'John',
    preferredName: 'John',
    lastName: 'Doe',
    country: 'USA',
    middleInitial: 'A',
    timeZone: 'America/New_York',
    email: 'johndoe@email.com',
    emailUpdatedAt: new Date().toISOString(),
    phone: '(123) 456-7890',
    phoneUpdatedAt: new Date().toISOString(),
    address: '123 MainStreet, City, State, Zipcode',
    addressUpdatedAt: new Date().toISOString()
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

// Return user data (development mock). Replace with DB/Supabase logic as needed.
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const user = users[id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

// Update user data (partial updates allowed)
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const existing = users[id];
  if (!existing) return res.status(404).json({ error: 'User not found' });
  const updates = req.body || {};

  // Apply updates shallowly and update timestamps for known contact fields
  const merged = { ...existing, ...updates };
  if (updates.email) merged.emailUpdatedAt = new Date().toISOString();
  if (updates.phone) merged.phoneUpdatedAt = new Date().toISOString();
  if (updates.address) merged.addressUpdatedAt = new Date().toISOString();

  users[id] = merged;
  return res.json(merged);
});

// API endpoints for Explore page
app.get('/api/specialties', async (req, res) => {
  try {
    const specialties = await clinicApi.listSpecialties();
    res.json(specialties);
  } catch (error) {
    console.error('Error fetching specialties:', error);
    res.status(500).json({ error: 'Failed to fetch specialties' });
  }
});

app.get('/api/hospitals', async (req, res) => {
  try {
    const { query = '', specialtyId, page = 1, perPage = 10 } = req.query;
    const filters = {};
    if (specialtyId) filters.specialtyId = parseInt(specialtyId);
    
    const result = await clinicApi.searchHospitals({ 
      query, 
      filters, 
      page: parseInt(page), 
      perPage: parseInt(perPage) 
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const { query = '', specialtyId, hospitalId, page = 1, perPage = 10 } = req.query;
    const filters = {};
    if (specialtyId) filters.specialtyId = parseInt(specialtyId);
    if (hospitalId) filters.hospitalId = parseInt(hospitalId);
    
    const result = await clinicApi.searchDoctors({ 
      query, 
      filters, 
      page: parseInt(page), 
      perPage: parseInt(perPage) 
    });
    res.json(result);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// Add your API routes here
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hello from Express!' });
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