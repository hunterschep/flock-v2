export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: string
          name: string
          domain: string
          logo_url: string | null
          website: string | null
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          domain: string
          logo_url?: string | null
          website?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          domain?: string
          logo_url?: string | null
          website?: string | null
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          // Identity
          id: string
          email: string
          personal_email: string | null
          full_name: string
          
          // Institution
          institution_id: string | null
          grad_year: number
          
          // Location
          city: string | null
          state: string | null
          country: string
          latitude: number | null
          longitude: number | null
          location: unknown | null // PostGIS geography type
          
          // Status
          status: 'employed' | 'grad_school' | 'looking' | 'internship' | 'other' | null
          
          // Employment
          employer: string | null
          job_title: string | null
          
          // Grad school
          grad_school: string | null
          program: string | null
          degree: string | null
          
          // Bio & Social
          bio: string | null
          linkedin_url: string | null
          twitter_url: string | null
          instagram_url: string | null
          personal_website: string | null
          
          // Roommate
          looking_for_roommate: boolean
          roommate_budget_min: number | null
          roommate_budget_max: number | null
          roommate_move_date: string | null
          roommate_neighborhoods: string[] | null
          
          // Privacy
          profile_visible: boolean
          show_location: boolean
          show_employer: boolean
          show_school: boolean
          
          // Onboarding
          onboarding_completed: boolean
          email_verified: boolean
          profile_completeness: number
          last_active_at: string
          last_location_update: string | null
          
          // Metadata
          metadata: Json
          search_vector: unknown | null // tsvector type
          
          // Timestamps
          created_at: string
          updated_at: string
        }
        Insert: {
          // Identity (required)
          id: string
          email: string
          personal_email?: string | null
          full_name: string
          
          // Institution
          institution_id?: string | null
          grad_year: number
          
          // Location
          city?: string | null
          state?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          location?: unknown | null
          
          // Status
          status?: 'employed' | 'grad_school' | 'looking' | 'internship' | 'other' | null
          
          // Employment
          employer?: string | null
          job_title?: string | null
          
          // Grad school
          grad_school?: string | null
          program?: string | null
          degree?: string | null
          
          // Bio & Social
          bio?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          instagram_url?: string | null
          personal_website?: string | null
          
          // Roommate
          looking_for_roommate?: boolean
          roommate_budget_min?: number | null
          roommate_budget_max?: number | null
          roommate_move_date?: string | null
          roommate_neighborhoods?: string[] | null
          
          // Privacy
          profile_visible?: boolean
          show_location?: boolean
          show_employer?: boolean
          show_school?: boolean
          
          // Onboarding
          onboarding_completed?: boolean
          email_verified?: boolean
          profile_completeness?: number
          last_active_at?: string
          last_location_update?: string | null
          
          // Metadata
          metadata?: Json
          search_vector?: unknown | null
          
          // Timestamps
          created_at?: string
          updated_at?: string
        }
        Update: {
          // Identity
          id?: string
          email?: string
          personal_email?: string | null
          full_name?: string
          
          // Institution
          institution_id?: string | null
          grad_year?: number
          
          // Location
          city?: string | null
          state?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          location?: unknown | null
          
          // Status
          status?: 'employed' | 'grad_school' | 'looking' | 'internship' | 'other' | null
          
          // Employment
          employer?: string | null
          job_title?: string | null
          
          // Grad school
          grad_school?: string | null
          program?: string | null
          degree?: string | null
          
          // Bio & Social
          bio?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          instagram_url?: string | null
          personal_website?: string | null
          
          // Roommate
          looking_for_roommate?: boolean
          roommate_budget_min?: number | null
          roommate_budget_max?: number | null
          roommate_move_date?: string | null
          roommate_neighborhoods?: string[] | null
          
          // Privacy
          profile_visible?: boolean
          show_location?: boolean
          show_employer?: boolean
          
          // Onboarding
          onboarding_completed?: boolean
          email_verified?: boolean
          profile_completeness?: number
          last_active_at?: string
          
          // Metadata
          metadata?: Json
          search_vector?: unknown | null
          
          // Timestamps
          created_at?: string
          updated_at?: string
        }
      }
      user_connections: {
        Row: {
          id: string
          user_id: string
          target_user_id: string
          connection_type: 'blocked' | 'hidden' | 'favorited'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_user_id: string
          connection_type: 'blocked' | 'hidden' | 'favorited'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_user_id?: string
          connection_type?: 'blocked' | 'hidden' | 'favorited'
          created_at?: string
        }
      }
    }
    Views: {
      user_stats: {
        Row: {
          total_users: number
          onboarded_users: number
          visible_users: number
          users_with_location: number
          looking_for_roommate: number
          employed: number
          in_grad_school: number
          looking_for_work: number
          avg_profile_completeness: number
          active_last_7_days: number
          active_last_30_days: number
        }
      }
    }
    Functions: {
      get_current_user_data: {
        Args: Record<string, never>
        Returns: {
          institution_id: string | null
          onboarding_completed: boolean
          location: unknown | null
        }[]
      }
      get_nearby_users: {
        Args: {
          user_location: unknown
          distance_meters?: number
          max_results?: number
        }
        Returns: {
          id: string
          full_name: string
          distance_miles: number
        }[]
      }
      search_users: {
        Args: {
          search_query: string
          max_results?: number
        }
        Returns: {
          id: string
          full_name: string
          bio: string | null
          rank: number
        }[]
      }
    }
  }
}
