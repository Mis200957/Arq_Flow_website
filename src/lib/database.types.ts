export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agents: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          business_id: string
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          revoked: boolean
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          revoked?: boolean
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          revoked?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      appointments: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          doctor_id: string | null
          ends_at: string | null
          id: string
          notes: string | null
          patient_id: string | null
          service_id: string | null
          source: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          doctor_id?: string | null
          ends_at?: string | null
          id: string
          notes?: string | null
          patient_id?: string | null
          service_id?: string | null
          source?: string
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          doctor_id?: string | null
          ends_at?: string | null
          id?: string
          notes?: string | null
          patient_id?: string | null
          service_id?: string | null
          source?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "medical_services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          business_id: string | null
          created_at: string
          event: string
          id: string
          level: string
          payload: Json | null
          processed_at: string | null
          workflow: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          event: string
          id?: string
          level?: string
          payload?: Json | null
          processed_at?: string | null
          workflow: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          event?: string
          id?: string
          level?: string
          payload?: Json | null
          processed_at?: string | null
          workflow?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          audience_tags: string[]
          business_id: string
          content: string
          created_at: string
          failed_count: number
          id: string
          scheduled_at: string | null
          sent_count: number
          status: string
          title: string
        }
        Insert: {
          audience_tags?: string[]
          business_id: string
          content: string
          created_at?: string
          failed_count?: number
          id?: string
          scheduled_at?: string | null
          sent_count?: number
          status?: string
          title: string
        }
        Update: {
          audience_tags?: string[]
          business_id?: string
          content?: string
          created_at?: string
          failed_count?: number
          id?: string
          scheduled_at?: string | null
          sent_count?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_files: {
        Row: {
          bucket: string
          business_id: string
          created_at: string
          file_name: string
          id: string
          kind: string
          mime_type: string | null
          size_bytes: number | null
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          bucket: string
          business_id: string
          created_at?: string
          file_name: string
          id?: string
          kind?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          bucket?: string
          business_id?: string
          created_at?: string
          file_name?: string
          id?: string
          kind?: string
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_files_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          business_id: string
          closed: boolean
          closes: string | null
          created_at: string
          day_of_week: number
          id: string
          notes: string | null
          opens: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          closed?: boolean
          closes?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          notes?: string | null
          opens?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          closed?: boolean
          closes?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          notes?: string | null
          opens?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          activated_at: string | null
          address: string | null
          assistant_personality: string | null
          business_name: string
          business_type: string
          contact_email: string | null
          contact_phone: string
          created_at: string
          delivery_info: string | null
          description: string | null
          enabled_modules: Json | null
          fallback_behavior: string
          form_data_raw: Json | null
          greeting_message: string | null
          health_status: string | null
          id: string
          industry_config: Json
          instance_name: string | null
          internal_notes: string | null
          knowledge_base_raw: string | null
          languages: string[]
          last_health_check: string | null
          location: string | null
          logo_url: string | null
          monthly_fee_egp: number | null
          next_billing_date: string | null
          order_id: string
          order_instructions: string | null
          owner_id: string | null
          owner_name: string | null
          paid_at: string | null
          payment_methods: string[]
          plan_id: string
          policy: string | null
          primary_goal: string | null
          return_policy: string | null
          setup_fee_egp: number | null
          social_media: Json
          status: Database["public"]["Enums"]["business_status"]
          system_prompt: string | null
          tone_of_voice: string
          updated_at: string
          webhook_path: string | null
          website: string | null
          whatsapp_number: string | null
          workflow_id: string | null
          working_hours: string | null
        }
        Insert: {
          activated_at?: string | null
          address?: string | null
          assistant_personality?: string | null
          business_name: string
          business_type: string
          contact_email?: string | null
          contact_phone: string
          created_at?: string
          delivery_info?: string | null
          description?: string | null
          enabled_modules?: Json | null
          fallback_behavior?: string
          form_data_raw?: Json | null
          greeting_message?: string | null
          health_status?: string | null
          id?: string
          industry_config?: Json
          instance_name?: string | null
          internal_notes?: string | null
          knowledge_base_raw?: string | null
          languages?: string[]
          last_health_check?: string | null
          location?: string | null
          logo_url?: string | null
          monthly_fee_egp?: number | null
          next_billing_date?: string | null
          order_id: string
          order_instructions?: string | null
          owner_id?: string | null
          owner_name?: string | null
          paid_at?: string | null
          payment_methods?: string[]
          plan_id: string
          policy?: string | null
          primary_goal?: string | null
          return_policy?: string | null
          setup_fee_egp?: number | null
          social_media?: Json
          status?: Database["public"]["Enums"]["business_status"]
          system_prompt?: string | null
          tone_of_voice?: string
          updated_at?: string
          webhook_path?: string | null
          website?: string | null
          whatsapp_number?: string | null
          workflow_id?: string | null
          working_hours?: string | null
        }
        Update: {
          activated_at?: string | null
          address?: string | null
          assistant_personality?: string | null
          business_name?: string
          business_type?: string
          contact_email?: string | null
          contact_phone?: string
          created_at?: string
          delivery_info?: string | null
          description?: string | null
          enabled_modules?: Json | null
          fallback_behavior?: string
          form_data_raw?: Json | null
          greeting_message?: string | null
          health_status?: string | null
          id?: string
          industry_config?: Json
          instance_name?: string | null
          internal_notes?: string | null
          knowledge_base_raw?: string | null
          languages?: string[]
          last_health_check?: string | null
          location?: string | null
          logo_url?: string | null
          monthly_fee_egp?: number | null
          next_billing_date?: string | null
          order_id?: string
          order_instructions?: string | null
          owner_id?: string | null
          owner_name?: string | null
          paid_at?: string | null
          payment_methods?: string[]
          plan_id?: string
          policy?: string | null
          primary_goal?: string | null
          return_policy?: string | null
          setup_fee_egp?: number | null
          social_media?: Json
          status?: Database["public"]["Enums"]["business_status"]
          system_prompt?: string | null
          tone_of_voice?: string
          updated_at?: string
          webhook_path?: string | null
          website?: string | null
          whatsapp_number?: string | null
          workflow_id?: string | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      case_clients: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          name: string
          national_id: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          name: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          name?: string
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_clients_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      case_documents: {
        Row: {
          bucket: string | null
          business_id: string
          case_id: string | null
          created_at: string
          id: string
          notes: string | null
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bucket?: string | null
          business_id: string
          case_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          bucket?: string | null
          business_id?: string
          case_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          business_id: string
          case_number: string | null
          client_id: string | null
          court: string | null
          created_at: string
          description: string | null
          id: string
          next_hearing: string | null
          practice_area: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          case_number?: string | null
          client_id?: string | null
          court?: string | null
          created_at?: string
          description?: string | null
          id?: string
          next_hearing?: string | null
          practice_area?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          case_number?: string | null
          client_id?: string | null
          court?: string | null
          created_at?: string
          description?: string | null
          id?: string
          next_hearing?: string | null
          practice_area?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "case_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          description: string | null
          id: string
          kind: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      class_attendance: {
        Row: {
          business_id: string
          checked_in_at: string
          class_id: string | null
          created_at: string
          id: string
          member_name: string | null
          membership_id: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          checked_in_at?: string
          class_id?: string | null
          created_at?: string
          id?: string
          member_name?: string | null
          membership_id?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          checked_in_at?: string
          class_id?: string | null
          created_at?: string
          id?: string
          member_name?: string | null
          membership_id?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_attendance_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_attendance_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          active: boolean
          business_id: string
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          recurring: string | null
          starts_at: string | null
          trainer_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          recurring?: string | null
          starts_at?: string | null
          trainer_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          recurring?: string | null
          starts_at?: string | null
          trainer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      consultation_requests: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          details: string | null
          doctor_id: string | null
          id: string
          name: string | null
          patient_id: string | null
          phone: string | null
          preferred_at: string | null
          source: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          details?: string | null
          doctor_id?: string | null
          id?: string
          name?: string | null
          patient_id?: string | null
          phone?: string | null
          preferred_at?: string | null
          source?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          details?: string | null
          doctor_id?: string | null
          id?: string
          name?: string | null
          patient_id?: string | null
          phone?: string | null
          preferred_at?: string | null
          source?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultation_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_requests_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultation_requests_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          id: string
          last_message_at: string | null
          message_count: number
          status: Database["public"]["Enums"]["conversation_status"]
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          status?: Database["public"]["Enums"]["conversation_status"]
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          last_message_at?: string | null
          message_count?: number
          status?: Database["public"]["Enums"]["conversation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          business_id: string
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          active?: boolean
          business_id: string
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          active?: boolean
          business_id?: string
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean
          business_id: string
          capacity: number | null
          created_at: string
          description: string | null
          id: string
          level: string | null
          name: string
          price_egp: number | null
          schedule: string | null
          starts_on: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          level?: string | null
          name: string
          price_egp?: number | null
          schedule?: string | null
          starts_on?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          id?: string
          level?: string | null
          name?: string
          price_egp?: number | null
          schedule?: string | null
          starts_on?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_preferences: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          customer_id: string
          id: string
          source: string
          type: string
          value: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          source?: string
          type: string
          value: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          source?: string
          type?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_preferences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          business_id: string
          channel: string
          company: string | null
          conversation_summary: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          last_interaction_at: string | null
          metadata: Json
          name: string | null
          phone: string
          sentiment: number | null
          tags: string[]
          total_orders: number
          total_spent_egp: number
          updated_at: string
        }
        Insert: {
          business_id: string
          channel?: string
          company?: string | null
          conversation_summary?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_interaction_at?: string | null
          metadata?: Json
          name?: string | null
          phone: string
          sentiment?: number | null
          tags?: string[]
          total_orders?: number
          total_spent_egp?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          channel?: string
          company?: string | null
          conversation_summary?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_interaction_at?: string | null
          metadata?: Json
          name?: string | null
          phone?: string
          sentiment?: number | null
          tags?: string[]
          total_orders?: number
          total_spent_egp?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_zones: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          eta_text: string | null
          fee_egp: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          eta_text?: string | null
          fee_egp?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          eta_text?: string | null
          fee_egp?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_zones_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          active: boolean
          bio: string | null
          business_id: string
          created_at: string
          id: string
          languages: string[]
          name: string
          phone: string | null
          photo_url: string | null
          sort_order: number
          specialty: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          business_id: string
          created_at?: string
          id?: string
          languages?: string[]
          name: string
          phone?: string | null
          photo_url?: string | null
          sort_order?: number
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          business_id?: string
          created_at?: string
          id?: string
          languages?: string[]
          name?: string
          phone?: string | null
          photo_url?: string | null
          sort_order?: number
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          business_id: string
          course_id: string | null
          created_at: string
          enrolled_on: string
          id: string
          notes: string | null
          status: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          course_id?: string | null
          created_at?: string
          enrolled_on?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          course_id?: string | null
          created_at?: string
          enrolled_on?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      escalations: {
        Row: {
          assigned_to: string | null
          business_id: string
          context: string | null
          conversation_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          reason: string | null
          reason_code: string
          resolved: boolean
          resolved_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          context?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          reason?: string | null
          reason_code?: string
          resolved?: boolean
          resolved_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          context?: string | null
          conversation_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          reason?: string | null
          reason_code?: string
          resolved?: boolean
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escalations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          appointment_id: string | null
          business_id: string
          created_at: string
          doctor_id: string | null
          due_date: string
          id: string
          notes: string | null
          patient_id: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          business_id: string
          created_at?: string
          doctor_id?: string | null
          due_date: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          business_id?: string
          created_at?: string
          doctor_id?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          patient_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          id_number: string | null
          name: string
          nationality: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          id_number?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          id_number?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          business_id: string
          connected_number: string | null
          created_at: string
          evolution_status: string
          health_status: string | null
          id: string
          instance_name: string
          last_health_check: string | null
          qr_sent_at: string | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          business_id: string
          connected_number?: string | null
          created_at?: string
          evolution_status?: string
          health_status?: string | null
          id?: string
          instance_name: string
          last_health_check?: string | null
          qr_sent_at?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          business_id?: string
          connected_number?: string | null
          created_at?: string
          evolution_status?: string
          health_status?: string | null
          id?: string
          instance_name?: string
          last_health_check?: string | null
          qr_sent_at?: string | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instances_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_egp: number
          business_id: string
          created_at: string
          due_date: string | null
          id: string
          number: string
          paid_at: string | null
          payment_id: string | null
          pdf_path: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          tax_egp: number
          total_egp: number
        }
        Insert: {
          amount_egp: number
          business_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          number: string
          paid_at?: string | null
          payment_id?: string | null
          pdf_path?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_egp?: number
          total_egp: number
        }
        Update: {
          amount_egp?: number
          business_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          number?: string
          paid_at?: string | null
          payment_id?: string | null
          pdf_path?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          tax_egp?: number
          total_egp?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base: {
        Row: {
          active: boolean
          answer: string
          business_id: string
          category: string | null
          created_at: string
          id: string
          kind: string
          language: string
          question: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          business_id: string
          category?: string | null
          created_at?: string
          id?: string
          kind?: string
          language?: string
          question?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          business_id?: string
          category?: string | null
          created_at?: string
          id?: string
          kind?: string
          language?: string
          question?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      links: {
        Row: {
          active: boolean
          business_id: string
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          url: string
        }
        Insert: {
          active?: boolean
          business_id: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          url: string
        }
        Update: {
          active?: boolean
          business_id?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "links_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_services: {
        Row: {
          active: boolean
          business_id: string
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          price_egp: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price_egp?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price_egp?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          ends_on: string | null
          id: string
          member_name: string
          notes: string | null
          phone: string | null
          plan_name: string | null
          price_egp: number | null
          starts_on: string | null
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          ends_on?: string | null
          id?: string
          member_name: string
          notes?: string | null
          phone?: string | null
          plan_name?: string | null
          price_egp?: number | null
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          ends_on?: string | null
          id?: string
          member_name?: string
          notes?: string | null
          phone?: string | null
          plan_name?: string | null
          price_egp?: number | null
          starts_on?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          business_id: string
          content: string | null
          conversation_id: string | null
          cost_egp: number
          created_at: string
          customer_id: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          escalated: boolean
          id: string
          intent: string | null
          media_type: string
          media_url: string | null
          model: string | null
          sentiment_score: number | null
          total_tokens: number
          wa_message_id: string | null
        }
        Insert: {
          business_id: string
          content?: string | null
          conversation_id?: string | null
          cost_egp?: number
          created_at?: string
          customer_id?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          escalated?: boolean
          id?: string
          intent?: string | null
          media_type?: string
          media_url?: string | null
          model?: string | null
          sentiment_score?: number | null
          total_tokens?: number
          wa_message_id?: string | null
        }
        Update: {
          business_id?: string
          content?: string | null
          conversation_id?: string | null
          cost_egp?: number
          created_at?: string
          customer_id?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          escalated?: boolean
          id?: string
          intent?: string | null
          media_type?: string
          media_url?: string | null
          model?: string | null
          sentiment_score?: number | null
          total_tokens?: number
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          business_id: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string
          coupon: string | null
          created_at: string
          customer_id: string | null
          delivery_address: string | null
          delivery_fee_egp: number
          discount_egp: number
          id: string
          items: string
          notes: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_egp: number
          tax_egp: number
          total_egp: number
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          coupon?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_address?: string | null
          delivery_fee_egp?: number
          discount_egp?: number
          id: string
          items: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_egp?: number
          tax_egp?: number
          total_egp?: number
          type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          coupon?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_address?: string | null
          delivery_fee_egp?: number
          discount_egp?: number
          id?: string
          items?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_egp?: number
          tax_egp?: number
          total_egp?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_coupon_fkey"
            columns: ["coupon"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          date_of_birth: string | null
          email: string | null
          gender: string | null
          id: string
          medical_notes: string | null
          name: string
          phone: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          medical_notes?: string | null
          name: string
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          medical_notes?: string | null
          name?: string
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_egp: number
          business_id: string
          created_at: string
          id: string
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          plan_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshot_path: string | null
          status: Database["public"]["Enums"]["payment_status"]
          transaction_ref: string
        }
        Insert: {
          amount_egp: number
          business_id: string
          created_at?: string
          id?: string
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          plan_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref: string
        }
        Update: {
          amount_egp?: number
          business_id?: string
          created_at?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          plan_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshot_path?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          transaction_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          ai_model: string
          created_at: string
          fallback_model: string
          features: Json
          features_ar: Json
          highlighted: boolean
          id: string
          margin_egp: number
          max_tokens: number
          media_support: Json
          memory_window: number
          message_limit: number
          monthly_fee_egp: number
          name: string
          name_ar: string
          setup_fee_egp: number
          tier_level: number
          token_budget_egp: number | null
          tools: Json
          validity_days: number
        }
        Insert: {
          active?: boolean
          ai_model: string
          created_at?: string
          fallback_model?: string
          features?: Json
          features_ar?: Json
          highlighted?: boolean
          id: string
          margin_egp?: number
          max_tokens: number
          media_support?: Json
          memory_window: number
          message_limit: number
          monthly_fee_egp: number
          name: string
          name_ar: string
          setup_fee_egp: number
          tier_level: number
          token_budget_egp?: number | null
          tools?: Json
          validity_days?: number
        }
        Update: {
          active?: boolean
          ai_model?: string
          created_at?: string
          fallback_model?: string
          features?: Json
          features_ar?: Json
          highlighted?: boolean
          id?: string
          margin_egp?: number
          max_tokens?: number
          media_support?: Json
          memory_window?: number
          message_limit?: number
          monthly_fee_egp?: number
          name?: string
          name_ar?: string
          setup_fee_egp?: number
          tier_level?: number
          token_budget_egp?: number | null
          tools?: Json
          validity_days?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          available: boolean
          business_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price_egp: number | null
          sort_order: number
          stock_qty: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          business_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price_egp?: number | null
          sort_order?: number
          stock_qty?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          business_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price_egp?: number | null
          sort_order?: number
          stock_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          description: string | null
          discount_text: string | null
          ends_on: string | null
          id: string
          starts_on: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          description?: string | null
          discount_text?: string | null
          ends_on?: string | null
          id?: string
          starts_on?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          description?: string | null
          discount_text?: string | null
          ends_on?: string | null
          id?: string
          starts_on?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          active: boolean
          address: string | null
          agent_id: string | null
          area_sqm: number | null
          bathrooms: number | null
          bedrooms: number | null
          business_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          images: string[]
          location: string | null
          price_egp: number | null
          purpose: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          agent_id?: string | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          business_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          location?: string | null
          price_egp?: number | null
          purpose?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          agent_id?: string | null
          area_sqm?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          business_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          location?: string | null
          price_egp?: number | null
          purpose?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      property_requests: {
        Row: {
          assigned_agent_id: string | null
          budget_egp: number | null
          business_id: string
          created_at: string
          customer_id: string | null
          details: string | null
          id: string
          name: string | null
          phone: string | null
          preferred_location: string | null
          request_type: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          budget_egp?: number | null
          business_id: string
          created_at?: string
          customer_id?: string | null
          details?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          preferred_location?: string | null
          request_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          budget_egp?: number | null
          business_id?: string
          created_at?: string
          customer_id?: string | null
          details?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          preferred_location?: string | null
          request_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_requests_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      property_visits: {
        Row: {
          agent_id: string | null
          business_id: string
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          property_id: string | null
          request_id: string | null
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          business_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          request_id?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          business_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          request_id?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_visits_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_visits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_visits_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "property_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          business_id: string
          check_in: string
          check_out: string
          created_at: string
          customer_id: string | null
          guest_id: string | null
          guests_count: number
          id: string
          notes: string | null
          room_id: string | null
          source: string
          status: string
          total_egp: number | null
          updated_at: string
        }
        Insert: {
          business_id: string
          check_in: string
          check_out: string
          created_at?: string
          customer_id?: string | null
          guest_id?: string | null
          guests_count?: number
          id?: string
          notes?: string | null
          room_id?: string | null
          source?: string
          status?: string
          total_egp?: number | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          check_in?: string
          check_out?: string
          created_at?: string
          customer_id?: string | null
          guest_id?: string | null
          guests_count?: number
          id?: string
          notes?: string | null
          room_id?: string | null
          source?: string
          status?: string
          total_egp?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          active: boolean
          amenities: string[]
          business_id: string
          capacity: number | null
          created_at: string
          floor: string | null
          id: string
          rate_egp: number | null
          room_number: string
          room_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amenities?: string[]
          business_id: string
          capacity?: number | null
          created_at?: string
          floor?: string | null
          id?: string
          rate_egp?: number | null
          room_number: string
          room_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amenities?: string[]
          business_id?: string
          capacity?: number | null
          created_at?: string
          floor?: string | null
          id?: string
          rate_egp?: number | null
          room_number?: string
          room_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          details: string | null
          id: string
          name: string | null
          phone: string | null
          preferred_at: string | null
          service_id: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          details?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          preferred_at?: string | null
          service_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          details?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          preferred_at?: string | null
          service_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          business_id: string
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          price_egp: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          price_egp?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          price_egp?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          parent_name: string | null
          parent_phone: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          business_id: string
          cancel_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          business_id: string
          cancel_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          business_id?: string
          cancel_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          active: boolean
          bio: string | null
          business_id: string
          created_at: string
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          subject: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          business_id: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          subject?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          id: string
          name: string
          phone: string | null
          skill: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          skill?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          skill?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technicians_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          active: boolean
          bio: string | null
          business_id: string
          created_at: string
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          business_id: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          business_id?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          balance_egp: number
          business_id: string
          cost_egp: number
          id: string
          message_limit: number
          messages_used: number
          period_end: string
          period_start: string
          total_tokens: number
          updated_at: string
          wallet_egp: number
        }
        Insert: {
          balance_egp?: number
          business_id: string
          cost_egp?: number
          id?: string
          message_limit: number
          messages_used?: number
          period_end: string
          period_start: string
          total_tokens?: number
          updated_at?: string
          wallet_egp?: number
        }
        Update: {
          balance_egp?: number
          business_id?: string
          cost_egp?: number
          id?: string
          message_limit?: number
          messages_used?: number
          period_end?: string
          period_start?: string
          total_tokens?: number
          updated_at?: string
          wallet_egp?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          events: string[]
          id: string
          secret: string
          url: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          events?: string[]
          id?: string
          secret: string
          url: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          events?: string[]
          id?: string
          secret?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_endpoints_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string | null
          id: string
          notes: string | null
          order_number: string | null
          request_id: string | null
          scheduled_at: string | null
          status: string
          technician_id: string | null
          title: string | null
          total_egp: number | null
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          request_id?: string | null
          scheduled_at?: string | null
          status?: string
          technician_id?: string | null
          title?: string | null
          total_egp?: number | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          request_id?: string | null
          scheduled_at?: string | null
          status?: string
          technician_id?: string | null
          title?: string | null
          total_egp?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_usage: {
        Args: {
          b_id: string
          in_tokens: number
          msg_cost: number
          out_tokens: number
        }
        Returns: {
          allowed: boolean
          balance_egp: number
          cost_egp: number
          expires_on: string
          remaining_display_egp: number
          remaining_egp: number
          wallet_egp: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      next_order_number: { Args: { b_id: string }; Returns: string }
      owns_business: { Args: { b_id: string }; Returns: boolean }
      wallet_status: {
        Args: { b_id: string }
        Returns: {
          allowed: boolean
          balance_egp: number
          biz_status: string
          cost_egp: number
          expires_on: string
          remaining_display_egp: number
          remaining_egp: number
          used_pct: number
          wallet_egp: number
        }[]
      }
      wallet_topup: {
        Args: {
          add_budget: number
          add_wallet: number
          b_id: string
          msg_limit: number
          new_end: string
        }
        Returns: {
          balance_egp: number
          period_end: string
          period_start: string
          wallet_egp: number
        }[]
      }
    }
    Enums: {
      business_status:
        | "draft"
        | "pending_payment"
        | "pending_approval"
        | "provisioning"
        | "active"
        | "suspended"
        | "cancelled"
      conversation_status: "open" | "escalated" | "closed"
      invoice_status: "draft" | "open" | "paid" | "void"
      message_direction: "inbound" | "outbound"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_method: "instapay" | "vodafone_cash" | "wepay"
      payment_status: "pending" | "approved" | "rejected"
      payment_type: "setup" | "monthly" | "upgrade" | "renewal" | "topup"
      subscription_status: "active" | "past_due" | "cancelled" | "paused"
      user_role: "client" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      business_status: [
        "draft",
        "pending_payment",
        "pending_approval",
        "provisioning",
        "active",
        "suspended",
        "cancelled",
      ],
      conversation_status: ["open", "escalated", "closed"],
      invoice_status: ["draft", "open", "paid", "void"],
      message_direction: ["inbound", "outbound"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_method: ["instapay", "vodafone_cash", "wepay"],
      payment_status: ["pending", "approved", "rejected"],
      payment_type: ["setup", "monthly", "upgrade", "renewal", "topup"],
      subscription_status: ["active", "past_due", "cancelled", "paused"],
      user_role: ["client", "admin"],
    },
  },
} as const
