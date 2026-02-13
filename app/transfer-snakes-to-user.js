/**
 * Script to transfer all snakes to a specific user account
 *
 * Run with: node --env-file=.env transfer-snakes-to-user.js <email>
 *
 * Requires .env file with:
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY=xxx (service key, not anon key, to bypass RLS)
 */

import { createClient } from '@supabase/supabase-js'

async function main() {
  const targetEmail = process.argv[2]

  if (!targetEmail) {
    console.error('Usage: node --env-file=.env transfer-snakes-to-user.js <email>')
    console.error('Example: node --env-file=.env transfer-snakes-to-user.js poloyaux@gmail.com')
    process.exit(1)
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file')
    console.log('\nRequired .env variables:')
    console.log('  SUPABASE_URL=https://xxx.supabase.co')
    console.log('  SUPABASE_SERVICE_KEY=xxx')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Find target user by email
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

  if (userError) {
    console.error('Error fetching users:', userError)
    process.exit(1)
  }

  const targetUser = userData.users.find(u => u.email === targetEmail)

  if (!targetUser) {
    console.error(`User not found: ${targetEmail}`)
    console.log('\nAvailable users:')
    userData.users.forEach(u => console.log(`  - ${u.email} (${u.id})`))
    process.exit(1)
  }

  console.log(`Target user: ${targetUser.email} (${targetUser.id})`)

  // Count current snakes
  const { count, error: countError } = await supabase
    .from('snakes')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('Error counting snakes:', countError)
    process.exit(1)
  }

  console.log(`Found ${count} snakes to transfer`)

  // Update all snakes to belong to target user
  const { data, error: updateError } = await supabase
    .from('snakes')
    .update({ user_id: targetUser.id })
    .neq('user_id', targetUser.id) // Only update if not already owned
    .select('id')

  if (updateError) {
    console.error('Error transferring snakes:', updateError)
    process.exit(1)
  }

  console.log(`\n✓ Transferred ${data.length} snakes to ${targetEmail}`)
}

main().catch(console.error)
