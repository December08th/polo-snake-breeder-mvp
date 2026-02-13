// Import script for Polo's snake collection
// Run with: node import-snakes.js

const SUPABASE_URL = 'https://guqxoychegqxreywfinv.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1cXhveWNoZWdxeHJleXdmaW52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MTk2NjQsImV4cCI6MjA4NTQ5NTY2NH0.OeWTWwcnpx54ZoB1M20tQJKGtekWY5I7724mgd4uFl8'
const USER_ID = '4e7f53e3-5116-45c3-adaf-d4aaf072f9b3'

// Snake data from Polo's spreadsheet (WhatsApp images)
const snakes = [
  // XL RACKS 2000g+
  { name: 'Penny', sex: 'F', morph: 'Clown Het Pied', weight_grams: 2600, status: 'F_BREEDER', rack_size: 'XL' },
  { name: 'Hong Tong', sex: 'F', morph: 'Pied', weight_grams: 2440, status: 'F_BREEDER', rack_size: 'XL' },
  { name: 'Benzo', sex: 'F', morph: 'Sandblast Killer Pied', weight_grams: 2300, status: 'F_BREEDER', rack_size: 'XL' },
  { name: 'Khanna', sex: 'F', morph: 'Enchi Het Tri-Stripe', genetics: 'Poss Het Albino', weight_grams: 2240, status: 'F_BREEDER', rack_size: 'XL' },
  { name: 'Kai', sex: 'F', morph: 'Black Pastel Pied', weight_grams: 2220, status: 'F_BREEDER', rack_size: 'XL' },
  { name: 'Chapo', sex: 'M', morph: 'Yellow Belly Pastel Desert Ghost', weight_grams: 2100, status: 'M_BREEDER', rack_size: 'XL' },
  { name: 'Absinthe', sex: 'M', morph: 'Confusion Enchi Pastel', weight_grams: 2600, status: 'M_BREEDER', rack_size: 'XL' },

  // L RACKS 500-2000g
  { name: 'Hgna', sex: 'F', morph: 'Enchi Pastel Het Tri-Stripe', genetics: 'Poss Het Albino', weight_grams: 1900, status: 'F_BREEDER', rack_size: 'L' },
  { name: 'Lilith', sex: 'F', morph: 'Black Head DH Clown Pied', weight_grams: 1840, status: 'F_BREEDER', rack_size: 'L' },
  { name: 'Ivy', sex: 'F', morph: 'Cinnamon', weight_grams: 1820, status: 'F_BREEDER', rack_size: 'L' },
  { name: "Kellogg's", sex: 'F', morph: 'Black Pastel Albino', weight_grams: 1800, status: 'F_BREEDER', rack_size: 'L' },
  { name: 'Heads-Up', sex: 'F', morph: 'Black Pastel Pied', weight_grams: 1740, status: 'ON_HOLD', rack_size: 'L', price: 12000 },
  { name: 'Cryptic', sex: 'F', morph: 'Pastel Crypton', weight_grams: 1700, status: 'F_BREEDER', rack_size: 'L' },
  { name: 'Raphaële', sex: 'F', morph: 'Hurricane Coral Glow Pinstripe Het Clown', genetics: 'Poss Het Hypo', weight_grams: 1600, status: 'F_BREEDER', rack_size: 'L' },
  { name: 'Riot', sex: 'F', morph: 'Confusion Enchi Pastel Het Tri-Stripe', genetics: 'Poss Het Albino', weight_grams: 1500, status: 'F_HOLDBACK', rack_size: 'L' },
  { name: 'Sami', sex: 'F', morph: 'Tri-Stripe Het Albino', weight_grams: 1400, status: 'F_BREEDER', rack_size: 'L' },
  { name: 'Naama H', sex: 'F', morph: 'Mahogany Het Clown', weight_grams: null, status: 'F_BREEDER', rack_size: 'L' },
  { name: null, sex: 'M', morph: 'Pastel Crypton', weight_grams: 1180, status: 'ON_HOLD', rack_size: 'L', price: 5000 },
  { name: 'Esperanza', sex: 'F', morph: 'Albino Het Tri-Stripe', weight_grams: null, status: 'F_HOLDBACK', rack_size: 'L' },
  { name: 'Barouf', sex: 'F', morph: 'Confusion Enchi DH Tri-Stripe Albino', weight_grams: null, status: 'F_HOLDBACK', rack_size: 'L' },
  { name: null, sex: 'M', morph: 'Black Pastel DH Tri-Stripe Albino', weight_grams: null, status: 'M_AVAILABLE', rack_size: 'L', price: 5000 },

  // S RACKS < 500g
  { name: 'Makita', sex: 'F', morph: 'Sandblast Pewter Het Pied', weight_grams: null, status: 'F_HOLDBACK', rack_size: 'S' },
  { name: null, sex: 'F', morph: 'Sandblast Pastel Het Pied', weight_grams: null, status: 'F_AVAILABLE', rack_size: 'S' },
  { name: null, sex: 'F', morph: 'DH Clown Pied', weight_grams: null, status: 'F_AVAILABLE', rack_size: 'S' },
  { name: 'Ricardo', sex: 'M', morph: 'Confusion Yellow Belly Het Desert Ghost', weight_grams: 290, status: 'M_HOLDBACK', rack_size: 'S' },
  { name: null, sex: 'F', morph: 'Pewter (Sandblast) Het Pied', weight_grams: null, status: 'F_AVAILABLE', rack_size: 'S', price: 7000 },
  { name: 'Inky', sex: 'F', morph: 'Black Pastel Pied Het Clown', weight_grams: null, status: 'F_AVAILABLE', rack_size: 'S' },
  { name: null, sex: 'M', morph: 'Confusion Enchi Het Albino', genetics: 'Poss Het Tri-Stripe', weight_grams: 250, status: 'M_AVAILABLE', rack_size: 'S', price: 18000 },
  { name: null, sex: 'F', morph: 'Confusion Yellow Belly Pastel Het Desert Ghost', weight_grams: 260, status: 'F_AVAILABLE', rack_size: 'S' },
  { name: null, sex: 'F', morph: 'Sandblast Pastel Het Pied', weight_grams: null, status: 'F_AVAILABLE', rack_size: 'S' },
  { name: null, sex: 'M', morph: 'Crypton', weight_grams: 200, status: 'M_AVAILABLE', rack_size: 'S', price: 8000 },
  { name: null, sex: 'M', morph: 'Enchi Het Tri-Stripe', genetics: 'Poss Het Albino', weight_grams: null, status: 'M_AVAILABLE', rack_size: 'S' },
  { name: null, sex: 'M', morph: 'Black Pastel Pied', weight_grams: 200, status: 'M_HOLDBACK', rack_size: 'S' },
  { name: 'Mocca', sex: 'M', morph: 'Black Pastel Pied Het Clown', weight_grams: 200, status: 'M_HOLDBACK', rack_size: 'S' },
  { name: 'Annabelle', sex: 'F', morph: 'Spotnose Killer Clown', weight_grams: 190, status: 'F_AVAILABLE', rack_size: 'S' },
  { name: null, sex: 'F', morph: 'Pastel', weight_grams: 190, status: 'F_AVAILABLE', rack_size: 'S', price: 5000 },
  { name: null, sex: 'F', morph: 'Confusion Yellow Belly Het Desert Ghost', weight_grams: 190, status: 'F_HOLDBACK', rack_size: 'S' },
  { name: 'Dame', sex: 'F', morph: 'Black Pastel Pied Het Clown', weight_grams: null, status: 'F_HOLDBACK', rack_size: 'S' },
  { name: null, sex: 'M', morph: 'Spotnose Killer Crypton', weight_grams: 170, status: 'M_AVAILABLE', rack_size: 'S', price: 11000 },
  { name: 'Estrella', sex: 'M', morph: 'Confusion Super Pastel Het Desert Ghost', genetics: 'Yellow Belly', weight_grams: null, status: 'M_HOLDBACK', rack_size: 'S' },
  { name: null, sex: 'M', morph: 'Confusion Albino', genetics: 'Poss Het Tri-Stripe', weight_grams: 150, status: 'M_AVAILABLE', rack_size: 'S', price: 22000 },
  { name: 'Sandale', sex: 'F', morph: 'Sandblast Pastel Pied', weight_grams: 140, status: 'F_AVAILABLE', rack_size: 'S' },
  { name: 'Corona', sex: 'F', morph: 'Confusion Enchi Albino', genetics: 'Poss Het Tri-Stripe', weight_grams: null, status: 'F_HOLDBACK', rack_size: 'S' },
  { name: null, sex: 'F', morph: 'Black Pastel Pied Het Clown', weight_grams: 70, status: 'ON_HOLD', rack_size: 'S', price: 5000 },
  { name: null, sex: 'F', morph: 'Black Pastel Pied Het Clown', weight_grams: 40, status: 'ON_HOLD', rack_size: 'S', price: 15000 },
]

async function importSnakes() {
  console.log(`Importing ${snakes.length} snakes for user ${USER_ID}...`)

  let successCount = 0
  let errorCount = 0

  for (const snake of snakes) {
    const payload = {
      user_id: USER_ID,
      name: snake.name,
      sex: snake.sex,
      morph: snake.morph,
      genetics: snake.genetics || null,
      weight_grams: snake.weight_grams,
      status: snake.status,
      rack_size: snake.rack_size,
      price: snake.price || null,
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/snakes`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        successCount++
        const label = snake.name || snake.morph
        console.log(`✓ Added: ${label} (${snake.sex})`)
      } else {
        errorCount++
        const error = await response.text()
        console.error(`✗ Failed: ${snake.name || snake.morph} - ${error}`)
      }
    } catch (err) {
      errorCount++
      console.error(`✗ Error: ${snake.name || snake.morph} - ${err.message}`)
    }
  }

  console.log(`\nDone! ${successCount} snakes imported, ${errorCount} errors.`)
}

importSnakes()
