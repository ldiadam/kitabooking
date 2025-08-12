#!/usr/bin/env node

/**
 * Orange Sport Center - Database Setup Script
 * 
 * This script helps automate the database setup process by:
 * 1. Checking environment variables
 * 2. Testing Supabase connection
 * 3. Providing setup instructions
 */

const fs = require('fs');
const path = require('path');

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

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found!', 'red');
    log('Please create .env.local file with your Supabase credentials.', 'yellow');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = [];
  const placeholderVars = [];
  
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    } else {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && (match[1].includes('placeholder') || match[1].includes('your_'))) {
        placeholderVars.push(varName);
      }
    }
  });
  
  if (missingVars.length > 0) {
    log('❌ Missing environment variables:', 'red');
    missingVars.forEach(varName => log(`  - ${varName}`, 'red'));
    return false;
  }
  
  if (placeholderVars.length > 0) {
    log('⚠️  Placeholder values detected:', 'yellow');
    placeholderVars.forEach(varName => log(`  - ${varName}`, 'yellow'));
    log('Please update these with your actual Supabase credentials.', 'yellow');
    return false;
  }
  
  log('✅ Environment variables configured correctly!', 'green');
  return true;
}

function checkMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    log('❌ Migrations directory not found!', 'red');
    return false;
  }
  
  const requiredMigrations = [
    '001_initial_schema.sql',
    '002_rls_policies.sql',
    '003_database_functions.sql',
    '004_sample_data.sql'
  ];
  
  const missingMigrations = [];
  
  requiredMigrations.forEach(filename => {
    const filePath = path.join(migrationsDir, filename);
    if (!fs.existsSync(filePath)) {
      missingMigrations.push(filename);
    }
  });
  
  if (missingMigrations.length > 0) {
    log('❌ Missing migration files:', 'red');
    missingMigrations.forEach(filename => log(`  - ${filename}`, 'red'));
    return false;
  }
  
  log('✅ All migration files found!', 'green');
  return true;
}

function printSetupInstructions() {
  log('\n🚀 Orange Sport Center Database Setup', 'cyan');
  log('=====================================\n', 'cyan');
  
  log('Next steps to complete your database setup:', 'bright');
  log('');
  
  log('1. 📋 Copy your Supabase credentials:', 'blue');
  log('   • Go to https://app.supabase.com');
  log('   • Select your project');
  log('   • Navigate to Settings → API');
  log('   • Copy Project URL and anon key');
  log('');
  
  log('2. 🔧 Update .env.local file:', 'blue');
  log('   • Replace placeholder values with actual credentials');
  log('   • Save the file');
  log('');
  
  log('3. 🗄️  Run database migrations:', 'blue');
  log('   • Go to your Supabase dashboard');
  log('   • Navigate to SQL Editor');
  log('   • Run each migration file in order:');
  log('     - 001_initial_schema.sql');
  log('     - 002_rls_policies.sql');
  log('     - 003_database_functions.sql');
  log('     - 004_sample_data.sql');
  log('');
  
  log('4. 👤 Create admin user:', 'blue');
  log('   • Go to Authentication → Users');
  log('   • Add a new user');
  log('   • Update user role to "superadmin" in profiles table');
  log('');
  
  log('5. ✅ Test your setup:', 'blue');
  log('   • Run: npm run dev');
  log('   • Visit: http://localhost:3000');
  log('   • Try signing up/logging in');
  log('');
  
  log('📖 For detailed instructions, see DATABASE_SETUP.md', 'magenta');
  log('');
}

function testSupabaseConnection() {
  try {
    // Try to load environment variables
    require('dotenv').config({ path: '.env.local' });
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      log('❌ Supabase credentials not found in environment', 'red');
      return false;
    }
    
    if (supabaseUrl.includes('placeholder') || supabaseKey.includes('placeholder')) {
      log('⚠️  Placeholder credentials detected', 'yellow');
      return false;
    }
    
    // Basic URL validation
    try {
      new URL(supabaseUrl);
      log('✅ Supabase URL format is valid', 'green');
    } catch {
      log('❌ Invalid Supabase URL format', 'red');
      return false;
    }
    
    log('✅ Supabase credentials look good!', 'green');
    return true;
    
  } catch (error) {
    log('❌ Error checking Supabase connection:', 'red');
    log(error.message, 'red');
    return false;
  }
}

function main() {
  log('🔍 Checking Orange Sport Center database setup...\n', 'cyan');
  
  const envOk = checkEnvFile();
  const migrationsOk = checkMigrationFiles();
  const connectionOk = envOk ? testSupabaseConnection() : false;
  
  log('');
  
  if (envOk && migrationsOk && connectionOk) {
    log('🎉 Setup looks good! Your database should be ready.', 'green');
    log('Run the migrations in your Supabase dashboard to complete setup.', 'green');
  } else {
    log('⚠️  Setup needs attention. Please follow the instructions below.', 'yellow');
  }
  
  printSetupInstructions();
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvFile,
  checkMigrationFiles,
  testSupabaseConnection
};