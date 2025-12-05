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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      athon_pledges: {
        Row: {
          created_at: string
          id: string
          is_flat_donation: boolean | null
          paid: boolean | null
          pledge_amount: number
          stripe_payment_intent_id: string | null
          student_fundraiser_id: string
          supporter_email: string
          supporter_name: string
          total_amount: number | null
          units_completed: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_flat_donation?: boolean | null
          paid?: boolean | null
          pledge_amount: number
          stripe_payment_intent_id?: string | null
          student_fundraiser_id: string
          supporter_email: string
          supporter_name: string
          total_amount?: number | null
          units_completed?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_flat_donation?: boolean | null
          paid?: boolean | null
          pledge_amount?: number
          stripe_payment_intent_id?: string | null
          student_fundraiser_id?: string
          supporter_email?: string
          supporter_name?: string
          total_amount?: number | null
          units_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "athon_pledges_student_fundraiser_id_fkey"
            columns: ["student_fundraiser_id"]
            isOneToOne: false
            referencedRelation: "student_fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_products: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_products_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_tasks: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          days_before_event: number | null
          description: string | null
          display_order: number | null
          id: string
          is_completed: boolean | null
          is_custom: boolean | null
          phase: string
          task: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          days_before_event?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_completed?: boolean | null
          is_custom?: boolean | null
          phase: string
          task: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          days_before_event?: number | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_completed?: boolean | null
          is_custom?: boolean | null
          phase?: string
          task?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          athon_donation_type:
            | Database["public"]["Enums"]["athon_donation_type"]
            | null
          athon_unit_name: string | null
          created_at: string
          description: string | null
          end_date: string | null
          fundraiser_type: Database["public"]["Enums"]["fundraiser_type"]
          goal_amount: number | null
          id: string
          logo_url: string | null
          name: string
          organization_admin_id: string | null
          organization_name: string
          organization_type: string | null
          program_size: number | null
          selected_product_ids: string[] | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          updated_at: string
        }
        Insert: {
          athon_donation_type?:
            | Database["public"]["Enums"]["athon_donation_type"]
            | null
          athon_unit_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          fundraiser_type?: Database["public"]["Enums"]["fundraiser_type"]
          goal_amount?: number | null
          id?: string
          logo_url?: string | null
          name: string
          organization_admin_id?: string | null
          organization_name: string
          organization_type?: string | null
          program_size?: number | null
          selected_product_ids?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          updated_at?: string
        }
        Update: {
          athon_donation_type?:
            | Database["public"]["Enums"]["athon_donation_type"]
            | null
          athon_unit_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          fundraiser_type?: Database["public"]["Enums"]["fundraiser_type"]
          goal_amount?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          organization_admin_id?: string | null
          organization_name?: string
          organization_type?: string | null
          program_size?: number | null
          selected_product_ids?: string[] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_organization_admin_id_fkey"
            columns: ["organization_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_communications: {
        Row: {
          campaign_id: string
          communication_type: string
          content: string | null
          created_at: string | null
          donor_id: string
          id: string
          sent_at: string | null
          sent_by: string | null
          subject: string | null
          template_id: string | null
        }
        Insert: {
          campaign_id: string
          communication_type: string
          content?: string | null
          created_at?: string | null
          donor_id: string
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          subject?: string | null
          template_id?: string | null
        }
        Update: {
          campaign_id?: string
          communication_type?: string
          content?: string | null
          created_at?: string | null
          donor_id?: string
          id?: string
          sent_at?: string | null
          sent_by?: string | null
          subject?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_communications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_communications_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_communications_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_communications_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_metrics: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          lapsed_donors: number | null
          monthly_donors: number | null
          new_donors: number | null
          period_end: string
          period_start: string
          repeat_donors: number | null
          retention_rate: number | null
          total_donors: number | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          lapsed_donors?: number | null
          monthly_donors?: number | null
          new_donors?: number | null
          period_end: string
          period_start: string
          repeat_donors?: number | null
          retention_rate?: number | null
          total_donors?: number | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          lapsed_donors?: number | null
          monthly_donors?: number | null
          new_donors?: number | null
          period_end?: string
          period_start?: string
          repeat_donors?: number | null
          retention_rate?: number | null
          total_donors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_surveys: {
        Row: {
          campaign_id: string
          created_at: string | null
          donor_id: string
          feedback: string | null
          id: string
          improvement_suggestions: string | null
          preferred_update_frequency: string | null
          satisfaction_rating: number | null
          would_recommend: boolean | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          donor_id: string
          feedback?: string | null
          id?: string
          improvement_suggestions?: string | null
          preferred_update_frequency?: string | null
          satisfaction_rating?: number | null
          would_recommend?: boolean | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          donor_id?: string
          feedback?: string | null
          id?: string
          improvement_suggestions?: string | null
          preferred_update_frequency?: string | null
          satisfaction_rating?: number | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "donor_surveys_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_surveys_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_tasks: {
        Row: {
          campaign_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          donor_id: string
          due_date: string
          id: string
          is_completed: boolean | null
          notes: string | null
          task_type: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          donor_id: string
          due_date: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          task_type: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          donor_id?: string
          due_date?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          task_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donor_tasks_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          campaign_id: string
          communication_preference: string | null
          connection_to_org: string | null
          created_at: string | null
          display_name: string | null
          display_on_wall: boolean | null
          donation_count: number | null
          email: string
          first_donation_at: string | null
          id: string
          interests: string[] | null
          is_thanked: boolean | null
          last_donation_at: string | null
          marketing_consent: boolean | null
          marketing_consent_at: string | null
          marketing_consent_ip: string | null
          name: string
          notes: string | null
          phone: string | null
          segment: Database["public"]["Enums"]["donor_segment"] | null
          thanked_at: string | null
          total_donated: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          communication_preference?: string | null
          connection_to_org?: string | null
          created_at?: string | null
          display_name?: string | null
          display_on_wall?: boolean | null
          donation_count?: number | null
          email: string
          first_donation_at?: string | null
          id?: string
          interests?: string[] | null
          is_thanked?: boolean | null
          last_donation_at?: string | null
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          marketing_consent_ip?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          segment?: Database["public"]["Enums"]["donor_segment"] | null
          thanked_at?: string | null
          total_donated?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          communication_preference?: string | null
          connection_to_org?: string | null
          created_at?: string | null
          display_name?: string | null
          display_on_wall?: boolean | null
          donation_count?: number | null
          email?: string
          first_donation_at?: string | null
          id?: string
          interests?: string[] | null
          is_thanked?: boolean | null
          last_donation_at?: string | null
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          marketing_consent_ip?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          segment?: Database["public"]["Enums"]["donor_segment"] | null
          thanked_at?: string | null
          total_donated?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donors_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_ab_tests: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          name: string
          started_at: string | null
          status: string | null
          variant_a_subject: string
          variant_a_template_id: string | null
          variant_b_subject: string
          variant_b_template_id: string | null
          winner: string | null
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name: string
          started_at?: string | null
          status?: string | null
          variant_a_subject: string
          variant_a_template_id?: string | null
          variant_b_subject: string
          variant_b_template_id?: string | null
          winner?: string | null
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          name?: string
          started_at?: string | null
          status?: string | null
          variant_a_subject?: string
          variant_a_template_id?: string | null
          variant_b_subject?: string
          variant_b_template_id?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_ab_tests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_ab_tests_variant_a_template_id_fkey"
            columns: ["variant_a_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_ab_tests_variant_b_template_id_fkey"
            columns: ["variant_b_template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          campaign_id: string | null
          created_at: string | null
          id: string
          is_system: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          body: string
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_tracking: {
        Row: {
          ab_test_id: string | null
          click_count: number | null
          clicked_at: string | null
          communication_id: string | null
          donor_id: string
          id: string
          open_count: number | null
          opened_at: string | null
          sent_at: string | null
          variant: string | null
        }
        Insert: {
          ab_test_id?: string | null
          click_count?: number | null
          clicked_at?: string | null
          communication_id?: string | null
          donor_id: string
          id?: string
          open_count?: number | null
          opened_at?: string | null
          sent_at?: string | null
          variant?: string | null
        }
        Update: {
          ab_test_id?: string | null
          click_count?: number | null
          clicked_at?: string | null
          communication_id?: string | null
          donor_id?: string
          id?: string
          open_count?: number | null
          opened_at?: string | null
          sent_at?: string | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_ab_test_id_fkey"
            columns: ["ab_test_id"]
            isOneToOne: false
            referencedRelation: "email_ab_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "donor_communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_tracking_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_updates: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          image_url: string | null
          sent_at: string | null
          stat_description: string | null
          stat_value: string | null
          story: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          sent_at?: string | null
          stat_description?: string | null
          stat_value?: string | null
          story?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          sent_at?: string | null
          stat_description?: string | null
          stat_value?: string | null
          story?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_updates_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_cost: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          subtotal: number
          unit_cost?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal?: number
          unit_cost?: number | null
          unit_price?: number
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
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string | null
          customer_phone: string | null
          delivered_at: string | null
          delivery_method: string | null
          delivery_notes: string | null
          delivery_status: string | null
          id: string
          profit_amount: number | null
          shipped_at: string | null
          shipping_address: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          student_fundraiser_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          delivery_notes?: string | null
          delivery_status?: string | null
          id?: string
          profit_amount?: number | null
          shipped_at?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          student_fundraiser_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          customer_phone?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          delivery_notes?: string | null
          delivery_status?: string | null
          id?: string
          profit_amount?: number | null
          shipped_at?: string | null
          shipping_address?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          student_fundraiser_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_student_fundraiser_id_fkey"
            columns: ["student_fundraiser_id"]
            isOneToOne: false
            referencedRelation: "student_fundraisers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          product_id?: string
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
      products: {
        Row: {
          average_raised_per_student: number | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          inventory_count: number | null
          is_active: boolean | null
          name: string
          price: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          average_raised_per_student?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          inventory_count?: number | null
          is_active?: boolean | null
          name: string
          price: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          average_raised_per_student?: number | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          inventory_count?: number | null
          is_active?: boolean | null
          name?: string
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          children_names: string[] | null
          communication_preference: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          interests: string[] | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          children_names?: string[] | null
          communication_preference?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          interests?: string[] | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          children_names?: string[] | null
          communication_preference?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          interests?: string[] | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          campaign_id: string | null
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number | null
          file_path: string | null
          id: string
          is_visible_to_students: boolean | null
          resource_type: string
          student_only_for: string | null
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          campaign_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          file_path?: string | null
          id?: string
          is_visible_to_students?: boolean | null
          resource_type?: string
          student_only_for?: string | null
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          campaign_id?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          file_path?: string | null
          id?: string
          is_visible_to_students?: boolean | null
          resource_type?: string
          student_only_for?: string | null
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_student_only_for_fkey"
            columns: ["student_only_for"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_emails: {
        Row: {
          campaign_id: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          recipient_segment: string | null
          scheduled_for: string
          sent_at: string | null
          status: string | null
          subject: string
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          recipient_segment?: string | null
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          subject: string
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          recipient_segment?: string | null
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_emails_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_emails_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fundraisers: {
        Row: {
          campaign_id: string
          created_at: string
          custom_message: string | null
          id: string
          is_active: boolean | null
          page_slug: string
          personal_goal: number | null
          student_id: string
          total_raised: number | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          custom_message?: string | null
          id?: string
          is_active?: boolean | null
          page_slug: string
          personal_goal?: number | null
          student_id: string
          total_raised?: number | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          custom_message?: string | null
          id?: string
          is_active?: boolean | null
          page_slug?: string
          personal_goal?: number | null
          student_id?: string
          total_raised?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fundraisers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fundraisers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_invitations: {
        Row: {
          account_created: boolean | null
          campaign_id: string
          created_at: string
          id: string
          invitation_sent: boolean | null
          invitation_sent_at: string | null
          student_email: string
          student_name: string
          user_id: string | null
        }
        Insert: {
          account_created?: boolean | null
          campaign_id: string
          created_at?: string
          id?: string
          invitation_sent?: boolean | null
          invitation_sent_at?: string | null
          student_email: string
          student_name: string
          user_id?: string | null
        }
        Update: {
          account_created?: boolean | null
          campaign_id?: string
          created_at?: string
          id?: string
          invitation_sent?: boolean | null
          invitation_sent_at?: string | null
          student_email?: string
          student_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_invitations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      task_reminders: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          reminder_date: string
          sent: boolean | null
          sent_at: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          reminder_date: string
          sent?: boolean | null
          sent_at?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          reminder_date?: string
          sent?: boolean | null
          sent_at?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_reminders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_reminders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "campaign_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_reminders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student" | "organization_admin" | "super_admin"
      athon_donation_type: "pledge_per_unit" | "flat_donation"
      campaign_status: "draft" | "active" | "paused" | "completed"
      donor_segment:
        | "first_time"
        | "recurring"
        | "lapsed"
        | "major"
        | "business"
      fundraiser_type:
        | "product"
        | "walkathon"
        | "readathon"
        | "jogathon"
        | "other_athon"
      order_status:
        | "pending"
        | "processing"
        | "completed"
        | "cancelled"
        | "refunded"
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
      app_role: ["admin", "student", "organization_admin", "super_admin"],
      athon_donation_type: ["pledge_per_unit", "flat_donation"],
      campaign_status: ["draft", "active", "paused", "completed"],
      donor_segment: ["first_time", "recurring", "lapsed", "major", "business"],
      fundraiser_type: [
        "product",
        "walkathon",
        "readathon",
        "jogathon",
        "other_athon",
      ],
      order_status: [
        "pending",
        "processing",
        "completed",
        "cancelled",
        "refunded",
      ],
    },
  },
} as const
