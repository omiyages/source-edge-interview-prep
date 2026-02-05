#!/usr/bin/env node

// API-based Database Backup Script
// Uses Supabase JavaScript client to backup data

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://satshobhbkjptsbmfsia.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key_here';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tables to backup
const tables = [
    'profiles',
    'user_stages',
    'stage_transitions',
    'admin_notes',
    'user_rejections',
    'dropdown_options',
    'interviews',
    'jobs',
    'user_jobs'
];

async function backupTable(tableName) {
    try {
        console.log(`📊 Backing up table: ${tableName}`);
        const { data, error } = await supabase
            .from(tableName)
            .select('*');
        
        if (error) {
            console.error(`❌ Error backing up ${tableName}:`, error);
            return null;
        }
        
        // Save to JSON file
        const filename = `${tableName}_backup.json`;
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        console.log(`✅ ${tableName} backed up to ${filename}`);
        
        return data;
    } catch (err) {
        console.error(`❌ Error backing up ${tableName}:`, err);
        return null;
    }
}

async function backupAllTables() {
    console.log('🗃️  Starting API-based database backup...');
    
    const results = {};
    
    for (const table of tables) {
        results[table] = await backupTable(table);
    }
    
    // Create summary
    const summary = {
        backupDate: new Date().toISOString(),
        tables: Object.keys(results).length,
        successful: Object.values(results).filter(r => r !== null).length,
        failed: Object.values(results).filter(r => r === null).length
    };
    
    fs.writeFileSync('backup_summary.json', JSON.stringify(summary, null, 2));
    console.log('📋 Backup summary created: backup_summary.json');
    console.log(`✅ Backup completed: ${summary.successful}/${summary.tables} tables successful`);
}

backupAllTables().catch(console.error);
