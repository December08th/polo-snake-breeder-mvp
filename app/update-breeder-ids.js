/**
 * Script to update existing snakes with their original breeder IDs
 *
 * Run with: node --env-file=.env update-breeder-ids.js
 *
 * Requires .env file with:
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY=xxx (service key, not anon key, to bypass RLS)
 */

import { createClient } from '@supabase/supabase-js'

// Breeder ID mappings from Polo's original system
// Format: { name, morph, breeder_id, weight (optional for disambiguation) }
const breederIdMappings = [
  { name: 'Penny', morph: 'Clown Het Pied', breeder_id: '#9' },
  { name: 'Hong Tong', morph: 'Pied', breeder_id: '#8' },
  { name: 'Benzo', morph: 'Sandblast Killer Pied', breeder_id: '#16' },
  { name: 'Khanna', morph: 'Enchi Het Tri-Stripe', breeder_id: '#21 C5-23-A' },
  { name: 'Kai', morph: 'Black Pastel Pied', breeder_id: '#4' },
  { name: 'Chapo', morph: 'Yellow Belly Pastel Desert Ghost', breeder_id: '#15' },
  { name: 'Absinthe', morph: 'Confusion Enchi Pastel', breeder_id: '#11' },
  { name: 'Hgna', morph: 'Enchi Pastel Het Tri-Stripe', breeder_id: '#20 C6-23-C' },
  { name: 'Lilith', morph: 'Black Head DH Clown Pied', breeder_id: '#35' },
  { name: 'Ivy', morph: 'Cinnamon', breeder_id: '#1' },
  { name: "Kellogg's", morph: 'Black Pastel Albino', breeder_id: '#7' },
  { name: 'Heads-Up', morph: 'Black Pastel Pied', breeder_id: '#2' },
  { name: 'Cryptic', morph: 'Pastel Crypton', breeder_id: '#12' },
  { name: 'Raphaële', morph: 'Hurricane Coral Glow Pinstripe Het Clown', breeder_id: '#34' },
  { name: 'Riot', morph: 'Confusion Enchi Pastel Het Tri-Stripe', breeder_id: '#19 C8-23-B' },
  { name: 'Sami', morph: 'Tri-Stripe Het Albino', breeder_id: '#17' },
  { name: 'Naama H', morph: 'Mahogany Het Clown', breeder_id: '#36' },
  { name: 'Esperanza', morph: 'Albino Het Tri-Stripe', breeder_id: '#23 C8-24-C' },
  { name: 'Barouf', morph: 'Confusion Enchi DH Tri-Stripe Albino', breeder_id: '#29 C8-23-D' },
  { name: 'Makita', morph: 'Sandblast Pewter Het Pied', breeder_id: '#61 C10-25-E' },
  { name: 'Ricardo', morph: 'Confusion Yellow Belly Het Desert Ghost', breeder_id: '#53 C14-25-A' },
  { name: 'Inky', morph: 'Black Pastel Pied Het Clown', breeder_id: '#52 C15-25-C' },
  { name: 'Mocca', morph: 'Black Pastel Pied Het Clown', breeder_id: '#38 C15-25-A' },
  { name: 'Annabelle', morph: 'Spotnose Killer Clown', breeder_id: '#64 C12-25-D' },
  { name: 'Dame', morph: 'Black Pastel Pied Het Clown', breeder_id: '#66 C15-25-I' },
  { name: 'Estrella', morph: 'Confusion Super Pastel Het Desert Ghost', breeder_id: '#57 C14-25-E' },
  { name: 'Sandale', morph: 'Sandblast Pastel Pied', breeder_id: '#68 C16-25-B' },
  { name: 'Corona', morph: 'Confusion Enchi Albino', breeder_id: '#58 C14-25-E' },

  // Unnamed snakes - match by morph (and weight for duplicates)
  { name: null, morph: 'Pastel Crypton', breeder_id: '#26 C7-24-D' },
  { name: null, morph: 'Black Pastel DH Tri-Stripe Albino', breeder_id: '#28 C9-24-B' },
  { name: null, morph: 'Sandblast Pastel Het Pied', breeder_id: '#37 C10-25-A' },
  { name: null, morph: 'DH Clown Pied', breeder_id: '#63 C15-25-F' },
  { name: null, morph: 'Pewter (Sandblast) Het Pied', breeder_id: '#50 C10-25-C' },
  { name: null, morph: 'Confusion Enchi Het Albino', breeder_id: '#51 C13-25-D' },
  { name: null, morph: 'Confusion Yellow Belly Pastel Het Desert Ghost', breeder_id: '#54 C14-25-C' },
  { name: null, morph: 'Crypton', breeder_id: '#45 C12-25-C' },
  { name: null, morph: 'Enchi Het Tri-Stripe', breeder_id: '#42 C11-25-A' },
  { name: null, morph: 'Black Pastel Pied', breeder_id: '#71 C17-25-C' },
  { name: null, morph: 'Pastel', breeder_id: '#64 C12-25-B' },
  { name: null, morph: 'Spotnose Killer Crypton', breeder_id: '#47 C12-25-E' },
  { name: null, morph: 'Confusion Albino', breeder_id: '#49 C13-25-B' },

  // Snakes with same morph but different weights - need special handling
  // #44 - Sandblast Pastel Het Pied (different from #37 C10-25-A - no clutch ref)
  { name: null, morph: 'Sandblast Pastel Het Pied', breeder_id: '#44', noClutchRef: true },

  // Two snakes with "Confusion Yellow Belly Het Desert Ghost"
  { name: null, morph: 'Confusion Yellow Belly Het Desert Ghost', breeder_id: '#54 C14-25-B' },

  // Two snakes with "Black Pastel Pied Het Clown" at different weights (70g and 40g)
  { name: null, morph: 'Black Pastel Pied Het Clown (70g)', breeder_id: '#65 C15-25-H', weight: 70 },
  { name: null, morph: 'Black Pastel Pied Het Clown (40g)', breeder_id: '#65 C15-25-H', weight: 40 },
]

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables')
    console.log('\nUsage:')
    console.log('  SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx node update-breeder-ids.js')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Fetch all snakes
  const { data: snakes, error } = await supabase
    .from('snakes')
    .select('id, name, morph, weight_grams, breeder_id')
    .is('breeder_id', null) // Only update snakes that don't have a breeder_id yet

  if (error) {
    console.error('Error fetching snakes:', error)
    process.exit(1)
  }

  console.log(`Found ${snakes.length} snakes without breeder_id\n`)

  let updated = 0
  let notFound = []

  for (const snake of snakes) {
    // Find matching mapping
    let mapping = breederIdMappings.find(m => {
      // Match by name if available
      if (m.name && snake.name) {
        return m.name.toLowerCase() === snake.name.toLowerCase()
      }
      // For unnamed snakes, match by morph
      if (!m.name && !snake.name) {
        // Handle weight-specific matches
        if (m.weight && snake.weight_grams) {
          return m.morph === snake.morph && Math.abs(m.weight - snake.weight_grams) < 20
        }
        return m.morph === snake.morph
      }
      return false
    })

    if (mapping) {
      const { error: updateError } = await supabase
        .from('snakes')
        .update({ breeder_id: mapping.breeder_id })
        .eq('id', snake.id)

      if (updateError) {
        console.error(`Error updating snake ${snake.id}:`, updateError)
      } else {
        console.log(`Updated: ${snake.name || '(unnamed)'} - ${snake.morph} → ${mapping.breeder_id}`)
        updated++
      }
    } else {
      notFound.push(snake)
    }
  }

  console.log(`\n✓ Updated ${updated} snakes`)

  if (notFound.length > 0) {
    console.log(`\n⚠ Could not find breeder_id for ${notFound.length} snakes:`)
    for (const snake of notFound) {
      console.log(`  - ${snake.name || '(unnamed)'}: ${snake.morph}`)
    }
  }
}

main().catch(console.error)
