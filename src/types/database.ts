export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          phone: string | null
          address: string | null
          user_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          phone?: string | null
          address?: string | null
          user_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          phone?: string | null
          address?: string | null
          user_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      venue_types: {
        Row: {
          id: string
          name: string
          description: string | null
          slot_duration: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          slot_duration?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          slot_duration?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          name: string
          venue_type_id: string | null
          image_url: string | null
          description: string | null
          base_price: number
          weekend_price: number | null
          facilities: string | null
          rules: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          venue_type_id?: string | null
          image_url?: string | null
          description?: string | null
          base_price: number
          weekend_price?: number | null
          facilities?: string | null
          rules?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          venue_type_id?: string | null
          image_url?: string | null
          description?: string | null
          base_price?: number
          weekend_price?: number | null
          facilities?: string | null
          rules?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      venue_time_slots: {
        Row: {
          id: string
          venue_id: string
          start_time: string
          end_time: string
          price_weekday: number | null
          price_weekend: number | null
          is_active: boolean
        }
        Insert: {
          id?: string
          venue_id: string
          start_time: string
          end_time: string
          price_weekday?: number | null
          price_weekend?: number | null
          is_active?: boolean
        }
        Update: {
          id?: string
          venue_id?: string
          start_time?: string
          end_time?: string
          price_weekday?: number | null
          price_weekend?: number | null
          is_active?: boolean
        }
      }
      reservations: {
        Row: {
          id: string
          reservation_code: string
          user_id: string | null
          venue_id: string | null
          reservation_date: string
          start_time: string
          end_time: string
          duration: number
          base_price: number | null
          discount_amount: number
          total_price: number | null
          customer_name: string | null
          customer_phone: string | null
          customer_email: string | null
          status: string
          payment_status: string
          payment_method: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reservation_code: string
          user_id?: string | null
          venue_id?: string | null
          reservation_date: string
          start_time: string
          end_time: string
          duration: number
          base_price?: number | null
          discount_amount?: number
          total_price?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_email?: string | null
          status?: string
          payment_status?: string
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reservation_code?: string
          user_id?: string | null
          venue_id?: string | null
          reservation_date?: string
          start_time?: string
          end_time?: string
          duration?: number
          base_price?: number | null
          discount_amount?: number
          total_price?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_email?: string | null
          status?: string
          payment_status?: string
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      financial_transactions: {
        Row: {
          id: string
          reservation_id: string | null
          transaction_type: string
          amount: number
          description: string | null
          transaction_date: string
          created_by: string | null
        }
        Insert: {
          id?: string
          reservation_id?: string | null
          transaction_type: string
          amount: number
          description?: string | null
          transaction_date?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          reservation_id?: string | null
          transaction_type?: string
          amount?: number
          description?: string | null
          transaction_date?: string
          created_by?: string | null
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string | null
          image_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string | null
          image_url?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      albums: {
        Row: {
          id: string
          name: string
          description: string | null
          cover_image_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          cover_image_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          cover_image_url?: string | null
          created_at?: string
        }
      }
      photos: {
        Row: {
          id: string
          album_id: string
          filename: string | null
          image_url: string | null
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          album_id: string
          filename?: string | null
          image_url?: string | null
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          album_id?: string
          filename?: string | null
          image_url?: string | null
          caption?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Profile = Tables<'profiles'>
export type Venue = Tables<'venues'>
export type VenueType = Tables<'venue_types'>
export type VenueTimeSlot = Tables<'venue_time_slots'>
export type Reservation = Tables<'reservations'>
export type FinancialTransaction = Tables<'financial_transactions'>
export type Event = Tables<'events'>
export type Album = Tables<'albums'>
export type Photo = Tables<'photos'>