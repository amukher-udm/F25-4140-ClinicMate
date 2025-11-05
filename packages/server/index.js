import express from 'express';
import path from 'path';
import ViteExpress from 'vite-express';
import dotenv from 'dotenv';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config(); //configures process.env from .env file

const app = express(); // initilize express app
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

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
