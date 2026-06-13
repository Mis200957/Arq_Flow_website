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
          workflow: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          event: string
          id?: string
          level?: string
          payload?: Json | null
          workflow: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          event?: string
          id?: string
          level?: string
          payload?: Json | null
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
          fallback_behavior: string
          form_data_raw: Json | null
          greeting_message: string | null
          health_status: string | null
          id: string
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
          fallback_behavior?: string
          form_data_raw?: Json | null
          greeting_message?: string | null
          health_status?: string | null
          id?: string
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
          fallback_behavior?: string
          form_data_raw?: Json | null
          greeting_message?: string | null
          health_status?: string | null
          id?: string
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
          free_messages_used: number
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
          free_messages_used?: number
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
          free_messages_used?: number
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
          input_tokens: number
          intent: string | null
          media_type: string
          media_url: string | null
          model: string | null
          output_tokens: number
          sentiment_score: number | null
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
          input_tokens?: number
          intent?: string | null
          media_type?: string
          media_url?: string | null
          model?: string | null
          output_tokens?: number
          sentiment_score?: number | null
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
          input_tokens?: number
          intent?: string | null
          media_type?: string
          media_url?: string | null
          model?: string | null
          output_tokens?: number
          sentiment_score?: number | null
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
          created_at: string
          customer_id: string | null
          delivery_address: string | null
          delivery_fee_egp: number
          discount_egp: number
          id: string
          items: Json
          notes: string | null
          order_number: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal_egp: number
          tax_egp: number
          total_egp: number
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id?: string | null
          delivery_address?: string | null
          delivery_fee_egp?: number
          discount_egp?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_egp?: number
          tax_egp?: number
          total_egp?: number
          type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string | null
          delivery_address?: string | null
          delivery_fee_egp?: number
          discount_egp?: number
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
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
            foreignKeyName: "orders_customer_id_fkey"
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
          max_tokens: number
          media_support: Json
          memory_window: number
          message_limit: number
          monthly_fee_egp: number
          name: string
          name_ar: string
          setup_fee_egp: number
          tier_level: number
          tools: Json
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
          max_tokens: number
          media_support?: Json
          memory_window: number
          message_limit: number
          monthly_fee_egp: number
          name: string
          name_ar: string
          setup_fee_egp: number
          tier_level: number
          tools?: Json
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
          max_tokens?: number
          media_support?: Json
          memory_window?: number
          message_limit?: number
          monthly_fee_egp?: number
          name?: string
          name_ar?: string
          setup_fee_egp?: number
          tier_level?: number
          tools?: Json
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
      usage_counters: {
        Row: {
          business_id: string
          cost_egp: number
          id: string
          input_tokens: number
          message_limit: number
          messages_used: number
          output_tokens: number
          period_end: string
          period_start: string
          updated_at: string
        }
        Insert: {
          business_id: string
          cost_egp?: number
          id?: string
          input_tokens?: number
          message_limit: number
          messages_used?: number
          output_tokens?: number
          period_end: string
          period_start: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          cost_egp?: number
          id?: string
          input_tokens?: number
          message_limit?: number
          messages_used?: number
          output_tokens?: number
          period_end?: string
          period_start?: string
          updated_at?: string
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
          message_limit: number
          messages_used: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      next_order_number: { Args: { b_id: string }; Returns: string }
      owns_business: { Args: { b_id: string }; Returns: boolean }
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
      payment_type: "setup" | "monthly" | "upgrade"
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
      payment_type: ["setup", "monthly", "upgrade"],
      subscription_status: ["active", "past_due", "cancelled", "paused"],
      user_role: ["client", "admin"],
    },
  },
} as const
