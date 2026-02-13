import { supabase } from './supabase'
import type { Snake, Clutch } from '../types/database'
import type { PairingWithRelations } from '../components/PairingCard'

// Compact summary for SnakeCard display
export interface LineageSummary {
  hasParents: boolean
  damName: string | null
  sireNames: string[]
  siblingCount: number
  offspringCount: number
  offspringClutchCount: number
}

// Full data for LineageModal
export interface LineageParent {
  id: string
  name: string | null
  breeder_id: string | null
  morph: string | null
  weight_grams: number | null
  sex: 'M' | 'F' | null
}

export interface LineageSibling {
  id: string
  name: string | null
  breeder_id: string | null
  clutch_letter: string | null
  sex: 'M' | 'F' | null
  morph: string | null
  weight_grams: number | null
}

export interface LineageOffspringClutch {
  clutch_id: string
  clutch_number: string
  babies: LineageSibling[]
}

export interface LineageData {
  dam: LineageParent | null
  sires: LineageParent[]
  clutchNumber: string | null
  multiSire: boolean
  siblings: LineageSibling[]
  offspringClutches: LineageOffspringClutch[]
}

function formatName(snake: { name: string | null; breeder_id: string | null }): string {
  if (snake.name && snake.breeder_id) return `${snake.name} (${snake.breeder_id})`
  return snake.name || snake.breeder_id || 'Unknown'
}

/** Compute lineage summaries client-side from already-fetched data (no extra API calls) */
export function computeLineageSummaries(
  snakes: Snake[],
  pairings: PairingWithRelations[],
  clutches: Clutch[]
): Map<string, LineageSummary> {
  const summaries = new Map<string, LineageSummary>()

  const clutchById = new Map(clutches.map(c => [c.id, c]))
  const pairingById = new Map(pairings.map(p => [p.id, p]))

  // Snakes grouped by clutch_id (for sibling counting + offspring counting)
  const snakesByClutch = new Map<string, Snake[]>()
  for (const s of snakes) {
    if (s.clutch_id) {
      const arr = snakesByClutch.get(s.clutch_id) || []
      arr.push(s)
      snakesByClutch.set(s.clutch_id, arr)
    }
  }

  // Snake → pairing IDs (as dam or sire)
  const pairingIdsBySnake = new Map<string, Set<string>>()
  for (const p of pairings) {
    const femaleSet = pairingIdsBySnake.get(p.female_id) || new Set()
    femaleSet.add(p.id)
    pairingIdsBySnake.set(p.female_id, femaleSet)
    for (const pm of p.pairing_males) {
      const maleSet = pairingIdsBySnake.get(pm.male_id) || new Set()
      maleSet.add(p.id)
      pairingIdsBySnake.set(pm.male_id, maleSet)
    }
  }

  // Clutches grouped by pairing_id
  const clutchesByPairing = new Map<string, Clutch[]>()
  for (const c of clutches) {
    if (c.pairing_id) {
      const arr = clutchesByPairing.get(c.pairing_id) || []
      arr.push(c)
      clutchesByPairing.set(c.pairing_id, arr)
    }
  }

  for (const snake of snakes) {
    let hasParents = false
    let damName: string | null = null
    let sireNames: string[] = []
    let siblingCount = 0

    if (snake.clutch_id) {
      const clutch = clutchById.get(snake.clutch_id)
      if (clutch?.pairing_id) {
        const pairing = pairingById.get(clutch.pairing_id)
        if (pairing) {
          hasParents = true
          damName = formatName(pairing.female)
          sireNames = pairing.pairing_males.map(pm => formatName(pm.male))
        }
      }
      const clutchSnakes = snakesByClutch.get(snake.clutch_id) || []
      siblingCount = Math.max(0, clutchSnakes.length - 1)
    }

    let offspringCount = 0
    let offspringClutchCount = 0
    const pairingIds = pairingIdsBySnake.get(snake.id)
    if (pairingIds) {
      const offspringClutchIds = new Set<string>()
      for (const pId of pairingIds) {
        for (const c of clutchesByPairing.get(pId) || []) {
          offspringClutchIds.add(c.id)
        }
      }
      offspringClutchCount = offspringClutchIds.size
      for (const cId of offspringClutchIds) {
        offspringCount += (snakesByClutch.get(cId) || []).length
      }
    }

    if (hasParents || offspringCount > 0) {
      summaries.set(snake.id, {
        hasParents,
        damName,
        sireNames,
        siblingCount,
        offspringCount,
        offspringClutchCount,
      })
    }
  }

  return summaries
}

async function fetchOffspring(snakeId: string): Promise<LineageOffspringClutch[]> {
  const [damPairings, sirePairings] = await Promise.all([
    supabase.from('pairings').select('id').eq('female_id', snakeId),
    supabase.from('pairing_males').select('pairing_id').eq('male_id', snakeId),
  ])

  const pairingIds = new Set<string>()
  for (const p of damPairings.data || []) pairingIds.add(p.id)
  for (const pm of sirePairings.data || []) pairingIds.add(pm.pairing_id)

  if (pairingIds.size === 0) return []

  const { data: clutchData } = await supabase
    .from('clutches')
    .select('id, clutch_number')
    .in('pairing_id', [...pairingIds])

  if (!clutchData || clutchData.length === 0) return []

  const { data: babies } = await supabase
    .from('snakes')
    .select('id, name, breeder_id, clutch_id, clutch_letter, sex, morph, weight_grams')
    .in('clutch_id', clutchData.map(c => c.id))

  return clutchData
    .map(c => ({
      clutch_id: c.id,
      clutch_number: c.clutch_number,
      babies: ((babies || []).filter(b => b.clutch_id === c.id)) as LineageSibling[],
    }))
    .filter(c => c.babies.length > 0)
}

/** Fetch full lineage data for modal (called on demand when modal opens) */
export async function fetchLineage(snake: Snake): Promise<LineageData> {
  // Start offspring query immediately (runs in parallel with parent queries)
  const offspringPromise = fetchOffspring(snake.id)

  let dam: LineageParent | null = null
  let sires: LineageParent[] = []
  let clutchNumber: string | null = null
  let multiSire = false
  let siblings: LineageSibling[] = []

  if (snake.clutch_id) {
    const [clutchResult, siblingsResult] = await Promise.all([
      supabase
        .from('clutches')
        .select('clutch_number, pairing_id')
        .eq('id', snake.clutch_id)
        .single(),
      supabase
        .from('snakes')
        .select('id, name, breeder_id, clutch_letter, sex, morph, weight_grams')
        .eq('clutch_id', snake.clutch_id)
        .neq('id', snake.id),
    ])

    siblings = (siblingsResult.data || []) as LineageSibling[]

    if (clutchResult.data) {
      clutchNumber = clutchResult.data.clutch_number

      if (clutchResult.data.pairing_id) {
        const { data: pairingData } = await supabase
          .from('pairings')
          .select(`
            female:snakes!female_id(id, name, breeder_id, morph, weight_grams, sex),
            pairing_males(
              male:snakes(id, name, breeder_id, morph, weight_grams, sex)
            )
          `)
          .eq('id', clutchResult.data.pairing_id)
          .single()

        if (pairingData) {
          dam = pairingData.female as unknown as LineageParent
          sires = ((pairingData.pairing_males || []) as unknown as { male: LineageParent }[])
            .map(pm => pm.male)
          multiSire = sires.length > 1
        }
      }
    }
  }

  const offspringClutches = await offspringPromise

  return { dam, sires, clutchNumber, multiSire, siblings, offspringClutches }
}
