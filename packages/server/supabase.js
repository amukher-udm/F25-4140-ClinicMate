require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

class ClinicStorage {
    constructor() {
        // Check if an instance already exists
        if (ClinicStorage.instance) {
            return ClinicStorage.instance; // Return the existing instance
        }

        // If no instance exists, create one and store it
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseAnonKey) {
            console.error("Supabase URL or Anon Key is missing. Check .env file.");
            process.exit(1);
        }
        this.supabase = createClient(supabaseUrl, supabaseAnonKey)
        ClinicStorage.instance = this; // Store the current instance
    }

  checkAuth = async (req, res, next) => {
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

    
}

