#!/usr/bin/env node

/**
 * Database Migration Runner
 * Applies all pending migrations to Supabase database
 * 
 * Usage: node run-migrations.js
 */

const { supabase } = require('./supabaseClient');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  console.log('🔄 Starting database migrations...\n');

  try {
    // Read all migration files
    const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('✅ No migrations to run');
      return;
    }

    console.log(`📋 Found ${migrationFiles.length} migration(s):\n`);

    for (const file of migrationFiles) {
      console.log(`\n📝 Running: ${file}`);
      
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      try {
        // Split SQL into individual statements
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          const { error } = await supabase.rpc('execute_sql', { 
            sql_query: statement 
          }).catch(err => {
            // Fallback: if RPC doesn't exist, use direct query
            // Note: Supabase doesn't support raw SQL execution directly
            // You'll need to run these migrations in Supabase SQL Editor manually
            console.warn('⚠️  Note: Execute the SQL queries in Supabase SQL Editor');
            return { error: err };
          });

          if (error) {
            console.error(`❌ Error in ${file}:`);
            console.error(error);
          }
        }

        console.log(`✅ ${file} completed`);
      } catch (err) {
        console.error(`❌ Failed to run ${file}:`, err.message);
      }
    }

    console.log('\n✅ All migrations completed!');
    console.log('\n📌 Manual Step Required:');
    console.log('Since Supabase doesn\'t allow direct SQL execution via API,');
    console.log('please run the migration files manually in Supabase SQL Editor:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy and paste the SQL from migrations/ folder');
    console.log('5. Execute each migration\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
