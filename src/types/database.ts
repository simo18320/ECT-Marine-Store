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
      ai_conversations: {
        Row: {
          id: string
          last_message_at: string
          profile_id: string
          started_at: string
          yacht_id: string | null
        }
        Insert: {
          id?: string
          last_message_at?: string
          profile_id: string
          started_at?: string
          yacht_id?: string | null
        }
        Update: {
          id?: string
          last_message_at?: string
          profile_id?: string
          started_at?: string
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_recommendations: {
        Row: {
          confidence: number | null
          conversation_id: string | null
          created_at: string
          data_sources: string[]
          id: string
          input: Json
          model: string
          outcome: string | null
          profile_id: string
          recommendation: Json
          yacht_id: string | null
        }
        Insert: {
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string
          data_sources?: string[]
          id?: string
          input: Json
          model: string
          outcome?: string | null
          profile_id: string
          recommendation: Json
          yacht_id?: string | null
        }
        Update: {
          confidence?: number | null
          conversation_id?: string | null
          created_at?: string
          data_sources?: string[]
          id?: string
          input?: Json
          model?: string
          outcome?: string | null
          profile_id?: string
          recommendation?: Json
          yacht_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      air_quality_devices: {
        Row: {
          device_type: string
          id: string
          installed_at: string | null
          is_active: boolean
          location: string | null
          serial_number: string | null
          yacht_id: string
        }
        Insert: {
          device_type?: string
          id?: string
          installed_at?: string | null
          is_active?: boolean
          location?: string | null
          serial_number?: string | null
          yacht_id: string
        }
        Update: {
          device_type?: string
          id?: string
          installed_at?: string | null
          is_active?: boolean
          location?: string | null
          serial_number?: string | null
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "air_quality_devices_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
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
      brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          website?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          billing_address: Json | null
          created_at: string
          credit_terms_days: number
          id: string
          name: string
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          billing_address?: Json | null
          created_at?: string
          credit_terms_days?: number
          id?: string
          name: string
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          billing_address?: Json | null
          created_at?: string
          credit_terms_days?: number
          id?: string
          name?: string
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          profile_id: string
          role: string
        }
        Insert: {
          company_id: string
          created_at?: string
          profile_id: string
          role?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          profile_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          customer_id: string
          full_name: string
          id: string
          is_default: boolean
          label: string | null
          line1: string
          line2: string | null
          phone: string | null
          postal_code: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          customer_id: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1: string
          line2?: string | null
          phone?: string | null
          postal_code: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          customer_id?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string | null
          line1?: string
          line2?: string | null
          phone?: string | null
          postal_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string
          equipment_type_id: string | null
          id: string
          installation_date: string | null
          last_maintenance_date: string | null
          location: string | null
          maintenance_interval_days: number | null
          manufacturer: string | null
          model: string | null
          next_maintenance_date: string | null
          qr_code_token: string
          serial_number: string | null
          status: string
          updated_at: string
          yacht_id: string
        }
        Insert: {
          created_at?: string
          equipment_type_id?: string | null
          id?: string
          installation_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_interval_days?: number | null
          manufacturer?: string | null
          model?: string | null
          next_maintenance_date?: string | null
          qr_code_token?: string
          serial_number?: string | null
          status?: string
          updated_at?: string
          yacht_id: string
        }
        Update: {
          created_at?: string
          equipment_type_id?: string | null
          id?: string
          installation_date?: string | null
          last_maintenance_date?: string | null
          location?: string | null
          maintenance_interval_days?: number | null
          manufacturer?: string | null
          model?: string | null
          next_maintenance_date?: string | null
          qr_code_token?: string
          serial_number?: string | null
          status?: string
          updated_at?: string
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_installations: {
        Row: {
          equipment_id: string
          id: string
          installed_at: string
          installed_by: string | null
          product_id: string
          removed_at: string | null
        }
        Insert: {
          equipment_id: string
          id?: string
          installed_at?: string
          installed_by?: string | null
          product_id: string
          removed_at?: string | null
        }
        Update: {
          equipment_id?: string
          id?: string
          installed_at?: string
          installed_by?: string | null
          product_id?: string
          removed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_installations_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_installations_installed_by_fkey"
            columns: ["installed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_installations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_types: {
        Row: {
          category: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      filter_installations: {
        Row: {
          filter_id: string
          id: string
          installed_at: string
          product_id: string
          removed_at: string | null
        }
        Insert: {
          filter_id: string
          id?: string
          installed_at?: string
          product_id: string
          removed_at?: string | null
        }
        Update: {
          filter_id?: string
          id?: string
          installed_at?: string
          product_id?: string
          removed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filter_installations_filter_id_fkey"
            columns: ["filter_id"]
            isOneToOne: false
            referencedRelation: "filters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filter_installations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      filters: {
        Row: {
          created_at: string
          equipment_id: string | null
          filter_type: string | null
          id: string
          installation_date: string | null
          location: string | null
          operating_hours: number | null
          product_id: string
          qr_code_token: string
          replacement_interval_days: number | null
          yacht_id: string
        }
        Insert: {
          created_at?: string
          equipment_id?: string | null
          filter_type?: string | null
          id?: string
          installation_date?: string | null
          location?: string | null
          operating_hours?: number | null
          product_id: string
          qr_code_token?: string
          replacement_interval_days?: number | null
          yacht_id: string
        }
        Update: {
          created_at?: string
          equipment_id?: string | null
          filter_type?: string | null
          id?: string
          installation_date?: string | null
          location?: string | null
          operating_hours?: number | null
          product_id?: string
          qr_code_token?: string
          replacement_interval_days?: number | null
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "filters_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filters_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filters_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          current_stock: number
          id: string
          product_id: string
          reorder_point: number
          reorder_quantity: number
          reserved_stock: number
          updated_at: string
          warehouse_location: string | null
        }
        Insert: {
          current_stock?: number
          id?: string
          product_id: string
          reorder_point?: number
          reorder_quantity?: number
          reserved_stock?: number
          updated_at?: string
          warehouse_location?: string | null
        }
        Update: {
          current_stock?: number
          id?: string
          product_id?: string
          reorder_point?: number
          reorder_quantity?: number
          reserved_stock?: number
          updated_at?: string
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          note: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          note?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          note?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_quotes: {
        Row: {
          created_at: string
          currency: string
          estimated_days: number | null
          id: string
          price: number
          provider: string
          shipment_context: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          estimated_days?: number | null
          id?: string
          price: number
          provider: string
          shipment_context?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          estimated_days?: number | null
          id?: string
          price?: number
          provider?: string
          shipment_context?: string | null
        }
        Relationships: []
      }
      maintenance_records: {
        Row: {
          created_at: string
          description: string | null
          equipment_id: string | null
          filter_id: string | null
          id: string
          performed_at: string
          performed_by: string | null
          products_used: Json
          service_request_id: string | null
          yacht_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          equipment_id?: string | null
          filter_id?: string | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          products_used?: Json
          service_request_id?: string | null
          yacht_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          equipment_id?: string | null
          filter_id?: string | null
          id?: string
          performed_at?: string
          performed_by?: string | null
          products_used?: Json
          service_request_id?: string | null
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_filter_id_fkey"
            columns: ["filter_id"]
            isOneToOne: false
            referencedRelation: "filters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_service_request_fk"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          name_snapshot: string
          order_id: string
          product_id: string
          quantity: number
          sku_snapshot: string
          unit_price: number
          variant_id: string | null
          vat_rate: number
        }
        Insert: {
          id?: string
          line_total: number
          name_snapshot: string
          order_id: string
          product_id: string
          quantity: number
          sku_snapshot: string
          unit_price: number
          variant_id?: string | null
          vat_rate: number
        }
        Update: {
          id?: string
          line_total?: number
          name_snapshot?: string
          order_id?: string
          product_id?: string
          quantity?: number
          sku_snapshot?: string
          unit_price?: number
          variant_id?: string | null
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address_id: string | null
          company_id: string | null
          created_at: string
          currency: string
          customer_id: string
          discount_total: number
          grand_total: number
          id: string
          notes: string | null
          order_number: string
          shipping_address_id: string | null
          shipping_total: number
          status: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id: string | null
          subtotal: number
          updated_at: string
          vat_total: number
        }
        Insert: {
          billing_address_id?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          customer_id: string
          discount_total?: number
          grand_total?: number
          id?: string
          notes?: string | null
          order_number: string
          shipping_address_id?: string | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          subtotal?: number
          updated_at?: string
          vat_total?: number
        }
        Update: {
          billing_address_id?: string | null
          company_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string
          discount_total?: number
          grand_total?: number
          id?: string
          notes?: string | null
          order_number?: string
          shipping_address_id?: string | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          stripe_checkout_session_id?: string | null
          subtotal?: number
          updated_at?: string
          vat_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "customer_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          order_id: string
          raw_event: Json | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          order_id: string
          raw_event?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          order_id?: string
          raw_event?: Json | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_bundle_items: {
        Row: {
          bundle_product_id: string
          component_product_id: string
          id: string
          quantity: number
        }
        Insert: {
          bundle_product_id: string
          component_product_id: string
          id?: string
          quantity?: number
        }
        Update: {
          bundle_product_id?: string
          component_product_id?: string
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_bundle_items_bundle_product_id_fkey"
            columns: ["bundle_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_bundle_items_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_compatibility: {
        Row: {
          compatible_manufacturer: string | null
          compatible_model: string | null
          connection_type: string | null
          created_at: string
          dimensions_constraint: Json | null
          equipment_type_id: string | null
          flow_rate_range: string | null
          id: string
          notes: string | null
          product_id: string
          source: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          compatible_manufacturer?: string | null
          compatible_model?: string | null
          connection_type?: string | null
          created_at?: string
          dimensions_constraint?: Json | null
          equipment_type_id?: string | null
          flow_rate_range?: string | null
          id?: string
          notes?: string | null
          product_id: string
          source: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          compatible_manufacturer?: string | null
          compatible_model?: string | null
          connection_type?: string | null
          created_at?: string
          dimensions_constraint?: Json | null
          equipment_type_id?: string | null
          flow_rate_range?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          source?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_compatibility_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compatibility_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_compatibility_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_documents: {
        Row: {
          doc_type: string
          id: string
          product_id: string
          title: string
          url: string
        }
        Insert: {
          doc_type?: string
          id?: string
          product_id: string
          title: string
          url: string
        }
        Update: {
          doc_type?: string
          id?: string
          product_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt_text?: string | null
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt_text?: string | null
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recommendations: {
        Row: {
          created_at: string
          id: string
          priority: number
          product_id: string
          reason: string | null
          recommended_product_id: string
          rule_source: string
        }
        Insert: {
          created_at?: string
          id?: string
          priority?: number
          product_id: string
          reason?: string | null
          recommended_product_id: string
          rule_source?: string
        }
        Update: {
          created_at?: string
          id?: string
          priority?: number
          product_id?: string
          reason?: string | null
          recommended_product_id?: string
          rule_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_replacements: {
        Row: {
          id: string
          product_id: string
          replaces_product_id: string
        }
        Insert: {
          id?: string
          product_id: string
          replaces_product_id: string
        }
        Update: {
          id?: string
          product_id?: string
          replaces_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_replacements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_replacements_replaces_product_id_fkey"
            columns: ["replaces_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_override: number | null
          product_id: string
          sku: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_override?: number | null
          product_id: string
          sku: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_override?: number | null
          product_id?: string
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          application: string | null
          brand_id: string | null
          category_id: string | null
          certifications: string[]
          created_at: string
          delivery_estimate:
            | Database["public"]["Enums"]["product_delivery_estimate"]
            | null
          description: string | null
          dimensions: Json | null
          id: string
          is_active: boolean
          is_bundle: boolean
          name: string
          operating_conditions: Json | null
          purchase_cost: number | null
          replacement_interval_days: number | null
          requires_compliance_ack: boolean
          search_vector: unknown
          selling_price: number
          shipping_cost: number | null
          short_description: string | null
          sku: string
          slug: string
          technical_specs: Json
          unit: string
          updated_at: string
          vat_rate: number
          weight_kg: number | null
        }
        Insert: {
          application?: string | null
          brand_id?: string | null
          category_id?: string | null
          certifications?: string[]
          created_at?: string
          delivery_estimate?:
            | Database["public"]["Enums"]["product_delivery_estimate"]
            | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean
          is_bundle?: boolean
          name: string
          operating_conditions?: Json | null
          purchase_cost?: number | null
          replacement_interval_days?: number | null
          requires_compliance_ack?: boolean
          search_vector?: unknown
          selling_price: number
          shipping_cost?: number | null
          short_description?: string | null
          sku: string
          slug: string
          technical_specs?: Json
          unit?: string
          updated_at?: string
          vat_rate?: number
          weight_kg?: number | null
        }
        Update: {
          application?: string | null
          brand_id?: string | null
          category_id?: string | null
          certifications?: string[]
          created_at?: string
          delivery_estimate?:
            | Database["public"]["Enums"]["product_delivery_estimate"]
            | null
          description?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean
          is_bundle?: boolean
          name?: string
          operating_conditions?: Json | null
          purchase_cost?: number | null
          replacement_interval_days?: number | null
          requires_compliance_ack?: boolean
          search_vector?: unknown
          selling_price?: number
          shipping_cost?: number | null
          short_description?: string | null
          sku?: string
          slug?: string
          technical_specs?: Json
          unit?: string
          updated_at?: string
          vat_rate?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          company_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"]
          company_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      replacement_schedules: {
        Row: {
          due_date: string | null
          equipment_id: string | null
          filter_id: string | null
          id: string
          last_calculated_at: string
          product_id: string
          status: Database["public"]["Enums"]["replacement_status"]
        }
        Insert: {
          due_date?: string | null
          equipment_id?: string | null
          filter_id?: string | null
          id?: string
          last_calculated_at?: string
          product_id: string
          status?: Database["public"]["Enums"]["replacement_status"]
        }
        Update: {
          due_date?: string | null
          equipment_id?: string | null
          filter_id?: string | null
          id?: string
          last_calculated_at?: string
          product_id?: string
          status?: Database["public"]["Enums"]["replacement_status"]
        }
        Relationships: [
          {
            foreignKeyName: "replacement_schedules_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replacement_schedules_filter_id_fkey"
            columns: ["filter_id"]
            isOneToOne: false
            referencedRelation: "filters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replacement_schedules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_suppliers: {
        Row: {
          rfq_id: string
          sent_at: string | null
          supplier_id: string
        }
        Insert: {
          rfq_id: string
          sent_at?: string | null
          supplier_id: string
        }
        Update: {
          rfq_id?: string
          sent_at?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_suppliers_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rfqs: {
        Row: {
          created_at: string
          created_by: string | null
          destination: string | null
          id: string
          product_id: string
          quantity: number
          requested_delivery_date: string | null
          specification: string | null
          status: Database["public"]["Enums"]["rfq_status"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          destination?: string | null
          id?: string
          product_id: string
          quantity: number
          requested_delivery_date?: string | null
          specification?: string | null
          status?: Database["public"]["Enums"]["rfq_status"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          destination?: string | null
          id?: string
          product_id?: string
          quantity?: number
          requested_delivery_date?: string | null
          specification?: string | null
          status?: Database["public"]["Enums"]["rfq_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rfqs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfqs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sensor_readings: {
        Row: {
          device_id: string
          id: string
          reading_type: string
          recorded_at: string
          unit: string | null
          value: number
        }
        Insert: {
          device_id: string
          id?: string
          reading_type: string
          recorded_at: string
          unit?: string | null
          value: number
        }
        Update: {
          device_id?: string
          id?: string
          reading_type?: string
          recorded_at?: string
          unit?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "air_quality_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          preferred_date: string | null
          requested_by: string | null
          service_type: string
          status: Database["public"]["Enums"]["service_request_status"]
          updated_at: string
          yacht_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          preferred_date?: string | null
          requested_by?: string | null
          service_type: string
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
          yacht_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          preferred_date?: string | null
          requested_by?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["service_request_status"]
          updated_at?: string
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_delivery: string | null
          created_at: string
          expected_delivery: string | null
          id: string
          order_id: string | null
          provider: string | null
          shipping_cost: number | null
          status: Database["public"]["Enums"]["shipment_status"]
          supplier_order_id: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          actual_delivery?: string | null
          created_at?: string
          expected_delivery?: string | null
          id?: string
          order_id?: string | null
          provider?: string | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["shipment_status"]
          supplier_order_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          actual_delivery?: string | null
          created_at?: string
          expected_delivery?: string | null
          id?: string
          order_id?: string | null
          provider?: string | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["shipment_status"]
          supplier_order_id?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_supplier_order_id_fkey"
            columns: ["supplier_order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          id: boolean
          restock_label: string
          restock_mode: boolean
          updated_at: string
        }
        Insert: {
          id?: boolean
          restock_label?: string
          restock_mode?: boolean
          updated_at?: string
        }
        Update: {
          id?: boolean
          restock_label?: string
          restock_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      supplier_order_items: {
        Row: {
          id: string
          line_total: number
          product_id: string
          quantity: number
          supplier_order_id: string
          unit_cost: number
        }
        Insert: {
          id?: string
          line_total: number
          product_id: string
          quantity: number
          supplier_order_id: string
          unit_cost: number
        }
        Update: {
          id?: string
          line_total?: number
          product_id?: string
          quantity?: number
          supplier_order_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_order_items_supplier_order_id_fkey"
            columns: ["supplier_order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          landed_cost: number | null
          rfq_id: string | null
          status: string
          supplier_id: string
          total_cost: number | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          landed_cost?: number | null
          rfq_id?: string | null
          status?: string
          supplier_id: string
          total_cost?: number | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          landed_cost?: number | null
          rfq_id?: string | null
          status?: string
          supplier_id?: string
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_products: {
        Row: {
          currency: string
          description: string | null
          external_sku: string | null
          id: string
          last_verified_at: string | null
          lead_time_days: number | null
          moq: number | null
          product_id: string | null
          shipping_estimate: number | null
          supplier_id: string
          unit_price: number | null
        }
        Insert: {
          currency?: string
          description?: string | null
          external_sku?: string | null
          id?: string
          last_verified_at?: string | null
          lead_time_days?: number | null
          moq?: number | null
          product_id?: string | null
          shipping_estimate?: number | null
          supplier_id: string
          unit_price?: number | null
        }
        Update: {
          currency?: string
          description?: string | null
          external_sku?: string | null
          id?: string
          last_verified_at?: string | null
          lead_time_days?: number | null
          moq?: number | null
          product_id?: string | null
          shipping_estimate?: number | null
          supplier_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_quotes: {
        Row: {
          created_at: string
          currency: string
          duties_cost: number | null
          handling_cost: number | null
          id: string
          landed_cost: number | null
          lead_time_days: number | null
          moq: number | null
          payment_terms: string | null
          rfq_id: string
          score: number | null
          shipping_cost: number | null
          supplier_id: string
          unit_price: number
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          duties_cost?: number | null
          handling_cost?: number | null
          id?: string
          landed_cost?: number | null
          lead_time_days?: number | null
          moq?: number | null
          payment_terms?: string | null
          rfq_id: string
          score?: number | null
          shipping_cost?: number | null
          supplier_id: string
          unit_price: number
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          duties_cost?: number | null
          handling_cost?: number | null
          id?: string
          landed_cost?: number | null
          lead_time_days?: number | null
          moq?: number | null
          payment_terms?: string | null
          rfq_id?: string
          score?: number | null
          shipping_cost?: number | null
          supplier_id?: string
          unit_price?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_quotes_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "rfqs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_scoring_weights: {
        Row: {
          id: boolean
          lead_time_weight: number
          moq_weight: number
          payment_terms_weight: number
          price_weight: number
          quality_weight: number
          reliability_weight: number
          shipping_weight: number
          updated_at: string
        }
        Insert: {
          id?: boolean
          lead_time_weight?: number
          moq_weight?: number
          payment_terms_weight?: number
          price_weight?: number
          quality_weight?: number
          reliability_weight?: number
          shipping_weight?: number
          updated_at?: string
        }
        Update: {
          id?: boolean
          lead_time_weight?: number
          moq_weight?: number
          payment_terms_weight?: number
          price_weight?: number
          quality_weight?: number
          reliability_weight?: number
          shipping_weight?: number
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          certifications: string[]
          confidence: number | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          quality_score: number | null
          reliability_score: number | null
          source: string | null
          status: Database["public"]["Enums"]["supplier_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          certifications?: string[]
          confidence?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          certifications?: string[]
          confidence?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["supplier_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      water_analysis: {
        Row: {
          created_at: string
          id: string
          lab_report_url: string | null
          parameters: Json
          sample_point: string | null
          sampled_at: string
          yacht_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lab_report_url?: string | null
          parameters?: Json
          sample_point?: string | null
          sampled_at?: string
          yacht_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lab_report_url?: string | null
          parameters?: Json
          sample_point?: string | null
          sampled_at?: string
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_analysis_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      yacht_users: {
        Row: {
          created_at: string
          profile_id: string
          role: string
          yacht_id: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          role?: string
          yacht_id: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          role?: string
          yacht_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yacht_users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yacht_users_yacht_id_fkey"
            columns: ["yacht_id"]
            isOneToOne: false
            referencedRelation: "yachts"
            referencedColumns: ["id"]
          },
        ]
      }
      yachts: {
        Row: {
          air_monitoring_notes: string | null
          build_year: number | null
          company_id: string | null
          created_at: string
          crew_count: number | null
          cruising_area: string | null
          desalination_system: string | null
          filtration_notes: string | null
          flag: string | null
          freshwater_production_lpd: number | null
          guest_count: number | null
          hvac_notes: string | null
          id: string
          length_m: number | null
          name: string
          owner_id: string
          updated_at: string
          uv_notes: string | null
          water_tank_capacity_l: number | null
          yacht_type: string | null
        }
        Insert: {
          air_monitoring_notes?: string | null
          build_year?: number | null
          company_id?: string | null
          created_at?: string
          crew_count?: number | null
          cruising_area?: string | null
          desalination_system?: string | null
          filtration_notes?: string | null
          flag?: string | null
          freshwater_production_lpd?: number | null
          guest_count?: number | null
          hvac_notes?: string | null
          id?: string
          length_m?: number | null
          name: string
          owner_id: string
          updated_at?: string
          uv_notes?: string | null
          water_tank_capacity_l?: number | null
          yacht_type?: string | null
        }
        Update: {
          air_monitoring_notes?: string | null
          build_year?: number | null
          company_id?: string | null
          created_at?: string
          crew_count?: number | null
          cruising_area?: string | null
          desalination_system?: string | null
          filtration_notes?: string | null
          flag?: string | null
          freshwater_production_lpd?: number | null
          guest_count?: number | null
          hvac_notes?: string | null
          id?: string
          length_m?: number | null
          name?: string
          owner_id?: string
          updated_at?: string
          uv_notes?: string | null
          water_tank_capacity_l?: number | null
          yacht_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yachts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yachts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      availability_status: {
        Args: { p: Database["public"]["Tables"]["products"]["Row"] }
        Returns: string
      }
    }
    Enums: {
      account_type:
        | "individual"
        | "business"
        | "shipyard"
        | "management_company"
        | "service_company"
      inventory_movement_type:
        | "purchase"
        | "sale"
        | "return"
        | "adjustment"
        | "damage"
        | "transfer"
      order_status:
        | "pending"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_status:
        | "pending"
        | "succeeded"
        | "failed"
        | "refunded"
        | "partially_refunded"
      product_delivery_estimate:
        | "ships_immediately"
        | "ships_2_3_days"
        | "made_to_order"
      replacement_status: "ok" | "due_soon" | "due" | "overdue" | "unknown"
      rfq_status: "draft" | "sent" | "quoted" | "awarded" | "cancelled"
      service_request_status:
        | "new"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
      shipment_status:
        | "ordered"
        | "processing"
        | "ready_to_ship"
        | "shipped"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "delayed"
        | "exception"
      supplier_status:
        | "discovered"
        | "under_review"
        | "qualified"
        | "approved"
        | "preferred"
        | "blocked"
      user_role:
        | "customer"
        | "b2b_user"
        | "b2b_admin"
        | "ect_operator"
        | "ect_admin"
        | "super_admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      account_type: [
        "individual",
        "business",
        "shipyard",
        "management_company",
        "service_company",
      ],
      inventory_movement_type: [
        "purchase",
        "sale",
        "return",
        "adjustment",
        "damage",
        "transfer",
      ],
      order_status: [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_status: [
        "pending",
        "succeeded",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      product_delivery_estimate: [
        "ships_immediately",
        "ships_2_3_days",
        "made_to_order",
      ],
      replacement_status: ["ok", "due_soon", "due", "overdue", "unknown"],
      rfq_status: ["draft", "sent", "quoted", "awarded", "cancelled"],
      service_request_status: [
        "new",
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
      ],
      shipment_status: [
        "ordered",
        "processing",
        "ready_to_ship",
        "shipped",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "delayed",
        "exception",
      ],
      supplier_status: [
        "discovered",
        "under_review",
        "qualified",
        "approved",
        "preferred",
        "blocked",
      ],
      user_role: [
        "customer",
        "b2b_user",
        "b2b_admin",
        "ect_operator",
        "ect_admin",
        "super_admin",
      ],
    },
  },
} as const
