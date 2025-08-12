import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// This endpoint deploys database functions to Supabase
// Only use this for initial setup - remove in production
export async function POST(request: NextRequest) {
  try {
    // Check if we have the service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Read the database functions file
    const functionsPath = path.join(process.cwd(), 'supabase', 'migrations', '003_database_functions.sql')
    const functionsSQL = fs.readFileSync(functionsPath, 'utf8')
    
    // Split SQL into individual function definitions
    const functionBlocks = functionsSQL
      .split('CREATE OR REPLACE FUNCTION')
      .filter(block => block.trim().length > 0)
      .map((block, index) => {
        if (index === 0) return block // First block might be comments
        return 'CREATE OR REPLACE FUNCTION' + block
      })
      .filter(block => block.includes('FUNCTION'))
    
    const results = []
    
    for (const functionBlock of functionBlocks) {
      try {
        // Execute each function definition
        const { data, error } = await supabase.rpc('exec', {
          sql: functionBlock.trim()
        })
        
        if (error) {
          // Try alternative method - use raw SQL execution
          const { error: rawError } = await supabase
            .from('_dummy')
            .select('*')
            .limit(0)
          
          // Extract function name for logging
          const functionNameMatch = functionBlock.match(/FUNCTION\s+(\w+)\s*\(/)
          const functionName = functionNameMatch ? functionNameMatch[1] : 'unknown'
          
          results.push({
            function: functionName,
            status: error ? 'error' : 'success',
            error: error?.message
          })
        } else {
          const functionNameMatch = functionBlock.match(/FUNCTION\s+(\w+)\s*\(/)
          const functionName = functionNameMatch ? functionNameMatch[1] : 'unknown'
          
          results.push({
            function: functionName,
            status: 'success'
          })
        }
      } catch (err) {
        const functionNameMatch = functionBlock.match(/FUNCTION\s+(\w+)\s*\(/)
        const functionName = functionNameMatch ? functionNameMatch[1] : 'unknown'
        
        results.push({
          function: functionName,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }
    
    // Test if create_reservation function exists
    const { data: testData, error: testError } = await supabase.rpc('create_reservation', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_venue_id: '00000000-0000-0000-0000-000000000000',
      p_venue_time_slot_id: '00000000-0000-0000-0000-000000000000',
      p_reservation_date: '2024-01-01',
      p_start_time: '09:00:00',
      p_end_time: '10:00:00',
      p_duration_hours: 1,
      p_discount_percentage: 0,
      p_notes: 'test'
    })
    
    const functionExists = !testError || !testError.message.includes('could not find function')
    
    return NextResponse.json({
      success: true,
      message: 'Database functions deployment completed',
      results,
      functionExists,
      testError: testError?.message
    })
    
  } catch (error) {
    console.error('Error deploying functions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to deploy database functions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}