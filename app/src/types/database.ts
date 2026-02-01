// Database types for Supabase
// Generated based on SCHEMA.md

export type SnakeStatus =
  | 'F_BREEDER'
  | 'M_BREEDER'
  | 'F_HOLDBACK'
  | 'M_HOLDBACK'
  | 'F_AVAILABLE'
  | 'M_AVAILABLE'
  | 'ON_HOLD'

export type RackSize = 'XL' | 'L' | 'S'

export type PairingStatus = 'ACTIVE' | 'OVULATED' | 'LAID' | 'COMPLETE'

export type InheritanceType = 'DOMINANT' | 'CO_DOMINANT' | 'RECESSIVE'

export interface Snake {
  id: string
  user_id: string
  snake_number: number
  name: string | null
  sex: 'M' | 'F' | null
  morph: string | null
  genetics: string | null
  date_of_birth: string | null
  year: number | null
  weight_grams: number | null
  status: SnakeStatus | null
  rack_size: RackSize | null
  price: number | null
  photo_url: string | null
  notes: string | null
  clutch_id: string | null
  clutch_letter: string | null
  consecutive_meals: number
  last_meal_date: string | null
  created_at: string
  updated_at: string
}

export interface WeightLog {
  id: string
  user_id: string
  snake_id: string
  weight_grams: number
  recorded_at: string
  notes: string | null
  created_at: string
}

export interface FeedingLog {
  id: string
  user_id: string
  snake_id: string
  fed_at: string
  accepted: boolean
  notes: string | null
  created_at: string
}

export interface Pairing {
  id: string
  user_id: string
  female_id: string
  pairing_start: string | null
  ovulation_date: string | null
  pre_lay_shed_date: string | null
  status: PairingStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PairingMale {
  id: string
  user_id: string
  pairing_id: string
  male_id: string
  lock_count: number
  last_lock_date: string | null
  created_at: string
}

export interface FollicleCheck {
  id: string
  user_id: string
  pairing_id: string
  checked_at: string
  follicle_size_mm: number | null
  notes: string | null
  next_check_due: string | null
  created_at: string
}

export interface Clutch {
  id: string
  user_id: string
  clutch_number: string
  pairing_id: string | null
  lay_date: string | null
  egg_count: number
  fertile_count: number
  slug_count: number
  kink_count: number
  expected_hatch_date: string | null
  actual_hatch_date: string | null
  hatch_count: number
  remarks: string | null
  created_at: string
  updated_at: string
}

export interface Morph {
  id: string
  name: string
  inheritance: InheritanceType | null
  description: string | null
  created_at: string
}

// Supabase Database type for client
export interface Database {
  public: {
    Tables: {
      snakes: {
        Row: Snake
        Insert: Omit<Snake, 'id' | 'snake_number' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Snake, 'id' | 'snake_number' | 'created_at' | 'updated_at'>>
      }
      weight_logs: {
        Row: WeightLog
        Insert: Omit<WeightLog, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<WeightLog, 'id' | 'created_at'>>
      }
      feeding_logs: {
        Row: FeedingLog
        Insert: Omit<FeedingLog, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<FeedingLog, 'id' | 'created_at'>>
      }
      pairings: {
        Row: Pairing
        Insert: Omit<Pairing, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Pairing, 'id' | 'created_at' | 'updated_at'>>
      }
      pairing_males: {
        Row: PairingMale
        Insert: Omit<PairingMale, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<PairingMale, 'id' | 'created_at'>>
      }
      follicle_checks: {
        Row: FollicleCheck
        Insert: Omit<FollicleCheck, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<FollicleCheck, 'id' | 'created_at'>>
      }
      clutches: {
        Row: Clutch
        Insert: Omit<Clutch, 'id' | 'created_at' | 'updated_at'> & { id?: string }
        Update: Partial<Omit<Clutch, 'id' | 'created_at' | 'updated_at'>>
      }
      morphs: {
        Row: Morph
        Insert: Omit<Morph, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<Morph, 'id' | 'created_at'>>
      }
    }
  }
}
