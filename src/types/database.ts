export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      glucose_readings: {
        Row: {
          id: string;
          user_id: string;
          glucose_level: number;
          timestamp: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          glucose_level: number;
          timestamp?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          glucose_level?: number;
          timestamp?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      insulin_applications: {
        Row: {
          id: string;
          user_id: string;
          insulin_type: string;
          units: number;
          timestamp: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          insulin_type: string;
          units: number;
          timestamp?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          insulin_type?: string;
          units?: number;
          timestamp?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meals: {
        Row: {
          id: string;
          user_id: string;
          timestamp: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          timestamp?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          timestamp?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meal_items: {
        Row: {
          id: string;
          meal_id: string;
          name: string;
          is_custom: boolean;
          high_glycemic: boolean;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          meal_id: string;
          name: string;
          is_custom?: boolean;
          high_glycemic?: boolean;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          meal_id?: string;
          name?: string;
          is_custom?: boolean;
          high_glycemic?: boolean;
          category?: string;
          created_at?: string;
        };
      };
    };
  };
}