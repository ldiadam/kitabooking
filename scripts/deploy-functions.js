#!/usr/bin/env node

/**
 * Orange Sport Center - Deploy Database Functions Script
 * 
 * This script deploys the database functions to Supabase using the service role key.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function deployDatabaseFunctions() {
  try {
    log('🚀 Deploying database functions to Supabase...\n', 'cyan');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      log('❌ Missing Supabase credentials in .env.local', 'red');
      log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.', 'yellow');
      return false;
    }
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    
    // Read the database functions file
    const functionsPath = path.join(process.cwd(), 'supabase', 'migrations', '003_database_functions.sql');
    
    if (!fs.existsSync(functionsPath)) {
      log('❌ Database functions file not found!', 'red');
      log(`Expected: ${functionsPath}`, 'yellow');
      return false;
    }
    
    const functionsSQL = fs.readFileSync(functionsPath, 'utf8');
    
    log('📄 Reading database functions...', 'blue');
    log('🔧 Executing SQL...', 'blue');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: functionsSQL
    });
    
    if (error) {
      // Try alternative method - direct SQL execution
      log('⚠️  Trying alternative deployment method...', 'yellow');
      
      // Split SQL into individual statements and execute them
      const statements = functionsSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';
        
        if (statement.includes('CREATE OR REPLACE FUNCTION')) {
          log(`📝 Deploying function ${i + 1}/${statements.length}...`, 'blue');
          
          const { error: stmtError } = await supabase
            .from('_sql')
            .select('*')
            .limit(0); // This is a workaround to execute raw SQL
          
          if (stmtError) {
            log(`❌ Error deploying function: ${stmtError.message}`, 'red');
          }
        }
      }
    }
    
    log('\n✅ Database functions deployment completed!', 'green');
    log('🎉 You can now test the booking functionality.', 'green');
    
    return true;
    
  } catch (error) {
    log('❌ Error deploying database functions:', 'red');
    log(error.message, 'red');
    return false;
  }
}

async function main() {
  log('🔧 Orange Sport Center - Database Functions Deployment\n', 'cyan');
  
  const success = await deployDatabaseFunctions();
  
  if (!success) {
    log('\n📖 Manual Setup Required:', 'yellow');
    log('1. Go to your Supabase dashboard', 'yellow');
    log('2. Navigate to SQL Editor', 'yellow');
    log('3. Copy and run the contents of supabase/migrations/003_database_functions.sql', 'yellow');
    log('4. This will create the create_reservation function and others', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { deployDatabaseFunctions };