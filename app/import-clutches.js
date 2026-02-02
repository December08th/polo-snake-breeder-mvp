/**
 * Script to import clutches from Polo's spreadsheet
 *
 * Run with: node --env-file=.env import-clutches.js
 *
 * Requires .env file with:
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY=xxx (service key, not anon key, to bypass RLS)
 */

import { createClient } from '@supabase/supabase-js'

// Clutch data from Polo's spreadsheet (parsed from screenshot)
// Dates are DD/MM format, year comes from clutch ID (C5-23 = 2023, C7-24 = 2024, etc.)
const clutchData = [
  {
    clutch_number: 'C5-23',
    lay_date: '2023-04-14',
    fertile_count: 2,
    slug_count: 1,
    kink_count: 1,
    actual_hatch_date: '2023-06-08',
    hatch_count: 0,
    remarks: 'badly kinked/euthanized x1'
  },
  {
    clutch_number: 'C6-23',
    lay_date: '2023-05-05',
    fertile_count: 5,
    slug_count: 0,
    kink_count: 0,
    actual_hatch_date: '2023-07-01',
    hatch_count: 2,
    remarks: null
  },
  {
    clutch_number: 'C7-24',
    lay_date: '2024-03-03',
    fertile_count: 4,
    slug_count: 0,
    kink_count: 0,
    actual_hatch_date: '2024-04-30',
    hatch_count: 4,
    remarks: null
  },
  {
    clutch_number: 'C8-24',
    lay_date: '2024-04-23',
    fertile_count: 5,
    slug_count: 0,
    kink_count: 0,
    actual_hatch_date: '2024-06-17',
    hatch_count: 4,
    remarks: null
  },
  {
    clutch_number: 'C9-24',
    lay_date: '2024-04-28',
    fertile_count: 3,
    slug_count: 2,
    kink_count: 1,
    actual_hatch_date: '2024-06-23',
    hatch_count: 2,
    remarks: null
  },
  {
    clutch_number: 'C10-25',
    lay_date: '2025-04-14',
    fertile_count: 5,
    slug_count: 0,
    kink_count: 0,
    actual_hatch_date: '2025-06-09',
    hatch_count: 2,
    remarks: null
  },
  {
    clutch_number: 'C11-25',
    lay_date: '2025-05-11',
    fertile_count: 2,
    slug_count: 5,
    kink_count: 1,
    actual_hatch_date: '2025-07-06',
    hatch_count: 1,
    remarks: 'single egg clutch. cut open on day 56.'
  },
  {
    clutch_number: 'C12-25',
    lay_date: '2025-05-13',
    fertile_count: 5,
    slug_count: 0,
    kink_count: 0,
    actual_hatch_date: '2025-07-07',
    hatch_count: 3,
    remarks: null
  },
  {
    clutch_number: 'C13-25',
    lay_date: '2025-05-13',
    fertile_count: 5,
    slug_count: 0,
    kink_count: 0,
    actual_hatch_date: '2025-07-08',
    hatch_count: 2,
    remarks: 'Dual sired clutch'
  },
  {
    clutch_number: 'C14-25',
    lay_date: '2025-05-20',
    fertile_count: 6,
    slug_count: 0,
    kink_count: 1,
    actual_hatch_date: '2025-07-18',
    hatch_count: 4,
    remarks: null
  },
  {
    clutch_number: 'C15-25',
    lay_date: '2025-05-31',
    fertile_count: 10,
    slug_count: 0,
    kink_count: 1,
    actual_hatch_date: '2025-07-28',
    hatch_count: 3,
    remarks: '2 tiny eggs were looking bad. Cut open day 55. Tiny snakes, one died.'
  },
  {
    clutch_number: 'C16-25',
    lay_date: '2025-06-23',
    fertile_count: 3,
    slug_count: 3,
    kink_count: 1,
    actual_hatch_date: '2025-08-21',
    hatch_count: 1,
    remarks: 'one of the "good" eggs has no veins but tiny red spots. *died day 30'
  },
  {
    clutch_number: 'C17-25',
    lay_date: '2025-07-16',
    fertile_count: 6,
    slug_count: 0,
    kink_count: 0,
    actual_hatch_date: '2025-09-12',
    hatch_count: 1,
    remarks: '1 Panda Pied → kinked!'
  }
]

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Find Polo's user account
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

  if (userError) {
    console.error('Error fetching users:', userError)
    process.exit(1)
  }

  const poloUser = userData.users.find(u => u.email === 'poloyaux@gmail.com')

  if (!poloUser) {
    console.error('Polo user not found (poloyaux@gmail.com)')
    console.log('\nAvailable users:')
    userData.users.forEach(u => console.log(`  - ${u.email} (${u.id})`))
    process.exit(1)
  }

  console.log(`Found Polo's account: ${poloUser.email} (${poloUser.id})`)

  // Prepare clutches for insertion
  const clutchesToInsert = clutchData.map(clutch => ({
    user_id: poloUser.id,
    clutch_number: clutch.clutch_number,
    pairing_id: null,
    lay_date: clutch.lay_date,
    egg_count: clutch.fertile_count + clutch.slug_count,
    fertile_count: clutch.fertile_count,
    slug_count: clutch.slug_count,
    kink_count: clutch.kink_count,
    expected_hatch_date: addDays(clutch.lay_date, 57),
    actual_hatch_date: clutch.actual_hatch_date,
    hatch_count: clutch.hatch_count,
    remarks: clutch.remarks
  }))

  console.log(`\nInserting ${clutchesToInsert.length} clutches...`)

  // Insert clutches
  const { data, error } = await supabase
    .from('clutches')
    .insert(clutchesToInsert)
    .select()

  if (error) {
    console.error('Error inserting clutches:', error)
    process.exit(1)
  }

  console.log(`\n✓ Successfully imported ${data.length} clutches:`)
  data.forEach(c => {
    console.log(`  - ${c.clutch_number}: laid ${c.lay_date}, hatched ${c.actual_hatch_date}`)
  })
}

function addDays(dateStr, days) {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

main().catch(console.error)
