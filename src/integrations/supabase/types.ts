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
      accounts: {
        Row: {
          account_subtype: Database["public"]["Enums"]["account_subtype"] | null
          account_type: Database["public"]["Enums"]["account_type"]
          code: string
          created_at: string | null
          default_vat_percentage: number | null
          default_vat_rate_type:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          description: string | null
          id: string
          is_active: boolean | null
          is_header: boolean | null
          is_system: boolean | null
          name: string
          name_nl: string | null
          normal_balance: Database["public"]["Enums"]["transaction_direction"]
          organization_id: string
          parent_id: string | null
          rgs_code: string | null
          sort_order: number | null
          tags: string[] | null
          updated_at: string | null
          vat_box_mapping: string | null
        }
        Insert: {
          account_subtype?:
            | Database["public"]["Enums"]["account_subtype"]
            | null
          account_type: Database["public"]["Enums"]["account_type"]
          code: string
          created_at?: string | null
          default_vat_percentage?: number | null
          default_vat_rate_type?:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_header?: boolean | null
          is_system?: boolean | null
          name: string
          name_nl?: string | null
          normal_balance?: Database["public"]["Enums"]["transaction_direction"]
          organization_id: string
          parent_id?: string | null
          rgs_code?: string | null
          sort_order?: number | null
          tags?: string[] | null
          updated_at?: string | null
          vat_box_mapping?: string | null
        }
        Update: {
          account_subtype?:
            | Database["public"]["Enums"]["account_subtype"]
            | null
          account_type?: Database["public"]["Enums"]["account_type"]
          code?: string
          created_at?: string | null
          default_vat_percentage?: number | null
          default_vat_rate_type?:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_header?: boolean | null
          is_system?: boolean | null
          name?: string
          name_nl?: string | null
          normal_balance?: Database["public"]["Enums"]["transaction_direction"]
          organization_id?: string
          parent_id?: string | null
          rgs_code?: string | null
          sort_order?: number | null
          tags?: string[] | null
          updated_at?: string | null
          vat_box_mapping?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_decisions: {
        Row: {
          action_type: Database["public"]["Enums"]["ai_action_type"]
          alternatives: Json | null
          confidence: number
          created_at: string | null
          decision: Json
          factors: Json | null
          id: string
          input_id: string
          input_summary: string | null
          input_type: string
          model_version: string | null
          organization_id: string
          overridden_at: string | null
          overridden_by: string | null
          override_reason: string | null
          override_value: Json | null
          processing_time_ms: number | null
          reasoning: string
          reasoning_nl: string | null
          was_accepted: boolean | null
          was_overridden: boolean | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["ai_action_type"]
          alternatives?: Json | null
          confidence: number
          created_at?: string | null
          decision: Json
          factors?: Json | null
          id?: string
          input_id: string
          input_summary?: string | null
          input_type: string
          model_version?: string | null
          organization_id: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          override_value?: Json | null
          processing_time_ms?: number | null
          reasoning: string
          reasoning_nl?: string | null
          was_accepted?: boolean | null
          was_overridden?: boolean | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["ai_action_type"]
          alternatives?: Json | null
          confidence?: number
          created_at?: string | null
          decision?: Json
          factors?: Json | null
          id?: string
          input_id?: string
          input_summary?: string | null
          input_type?: string
          model_version?: string | null
          organization_id?: string
          overridden_at?: string | null
          overridden_by?: string | null
          override_reason?: string | null
          override_value?: Json | null
          processing_time_ms?: number | null
          reasoning?: string
          reasoning_nl?: string | null
          was_accepted?: boolean | null
          was_overridden?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_decisions_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      anomalies: {
        Row: {
          ai_decision_id: string | null
          anomaly_type: string
          confidence: number | null
          created_at: string | null
          description: string
          description_nl: string | null
          entity_id: string
          entity_type: string
          id: string
          organization_id: string
          related_entity_id: string | null
          related_entity_type: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["notification_severity"]
          status: string
          suggestion: string | null
          suggestion_nl: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_decision_id?: string | null
          anomaly_type: string
          confidence?: number | null
          created_at?: string | null
          description: string
          description_nl?: string | null
          entity_id: string
          entity_type: string
          id?: string
          organization_id: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          status?: string
          suggestion?: string | null
          suggestion_nl?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_decision_id?: string | null
          anomaly_type?: string
          confidence?: number | null
          created_at?: string | null
          description?: string
          description_nl?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          status?: string
          suggestion?: string | null
          suggestion_nl?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomalies_ai_decision_id_fkey"
            columns: ["ai_decision_id"]
            isOneToOne: false
            referencedRelation: "ai_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomalies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anomalies_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          change_summary: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          session_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: Database["public"]["Enums"]["user_role"] | null
        }
        Insert: {
          action: string
          change_summary?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          session_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Update: {
          action?: string
          change_summary?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          session_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: Database["public"]["Enums"]["user_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_id: string | null
          balance_date: string | null
          bank_name: string | null
          bic: string | null
          connection_id: string | null
          connection_provider: string | null
          connection_status: string | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          iban: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          last_sync_at: string | null
          name: string
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          balance_date?: string | null
          bank_name?: string | null
          bic?: string | null
          connection_id?: string | null
          connection_provider?: string | null
          connection_status?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          iban: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_sync_at?: string | null
          name: string
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          balance_date?: string | null
          bank_name?: string | null
          bic?: string | null
          connection_id?: string | null
          connection_provider?: string | null
          connection_status?: string | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          iban?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          last_sync_at?: string | null
          name?: string
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          account_id: string | null
          ai_category_suggestion: string | null
          ai_confidence: number | null
          ai_contact_suggestion: string | null
          ai_reasoning: string | null
          amount: number
          bank_account_id: string
          contact_id: string | null
          counterparty_iban: string | null
          counterparty_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          external_id: string | null
          id: string
          journal_entry_id: string | null
          match_confidence: number | null
          match_method: string | null
          matched_invoice_id: string | null
          notes: string | null
          organization_id: string
          payment_reference: string | null
          raw_data: Json | null
          status: Database["public"]["Enums"]["bank_tx_status"]
          tags: string[] | null
          transaction_date: string
          transaction_hash: string | null
          updated_at: string | null
          value_date: string | null
        }
        Insert: {
          account_id?: string | null
          ai_category_suggestion?: string | null
          ai_confidence?: number | null
          ai_contact_suggestion?: string | null
          ai_reasoning?: string | null
          amount: number
          bank_account_id: string
          contact_id?: string | null
          counterparty_iban?: string | null
          counterparty_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          journal_entry_id?: string | null
          match_confidence?: number | null
          match_method?: string | null
          matched_invoice_id?: string | null
          notes?: string | null
          organization_id: string
          payment_reference?: string | null
          raw_data?: Json | null
          status?: Database["public"]["Enums"]["bank_tx_status"]
          tags?: string[] | null
          transaction_date: string
          transaction_hash?: string | null
          updated_at?: string | null
          value_date?: string | null
        }
        Update: {
          account_id?: string | null
          ai_category_suggestion?: string | null
          ai_confidence?: number | null
          ai_contact_suggestion?: string | null
          ai_reasoning?: string | null
          amount?: number
          bank_account_id?: string
          contact_id?: string | null
          counterparty_iban?: string | null
          counterparty_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_id?: string | null
          id?: string
          journal_entry_id?: string | null
          match_confidence?: number | null
          match_method?: string | null
          matched_invoice_id?: string | null
          notes?: string | null
          organization_id?: string
          payment_reference?: string | null
          raw_data?: Json | null
          status?: Database["public"]["Enums"]["bank_tx_status"]
          tags?: string[] | null
          transaction_date?: string
          transaction_hash?: string | null
          updated_at?: string | null
          value_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_ai_category_suggestion_fkey"
            columns: ["ai_category_suggestion"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_ai_contact_suggestion_fkey"
            columns: ["ai_contact_suggestion"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_matched_invoice_id_fkey"
            columns: ["matched_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cashflow_entries: {
        Row: {
          amount: number
          category: string | null
          confidence: number | null
          contact_id: string | null
          created_at: string | null
          date: string
          description: string | null
          entry_type: string
          id: string
          organization_id: string
          prediction_model: string | null
          source_id: string | null
          source_type: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          confidence?: number | null
          contact_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          entry_type: string
          id?: string
          organization_id: string
          prediction_model?: string | null
          source_id?: string | null
          source_type?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          confidence?: number | null
          contact_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          entry_type?: string
          id?: string
          organization_id?: string
          prediction_model?: string | null
          source_id?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cashflow_entries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cashflow_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_street: string | null
          bic: string | null
          btw_number: string | null
          btw_number_verified: boolean | null
          btw_number_verified_at: string | null
          created_at: string | null
          default_account_id: string | null
          default_currency: string | null
          default_vat_rate_type:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          email: string | null
          iban: string | null
          id: string
          is_active: boolean | null
          is_customer: boolean | null
          is_domestic: boolean | null
          is_eu: boolean | null
          is_supplier: boolean | null
          kvk_number: string | null
          legal_name: string | null
          name: string
          notes: string | null
          organization_id: string
          payment_terms_days: number | null
          phone: string | null
          tags: string[] | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          bic?: string | null
          btw_number?: string | null
          btw_number_verified?: boolean | null
          btw_number_verified_at?: string | null
          created_at?: string | null
          default_account_id?: string | null
          default_currency?: string | null
          default_vat_rate_type?:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          email?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_customer?: boolean | null
          is_domestic?: boolean | null
          is_eu?: boolean | null
          is_supplier?: boolean | null
          kvk_number?: string | null
          legal_name?: string | null
          name: string
          notes?: string | null
          organization_id: string
          payment_terms_days?: number | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          bic?: string | null
          btw_number?: string | null
          btw_number_verified?: boolean | null
          btw_number_verified_at?: string | null
          created_at?: string | null
          default_account_id?: string | null
          default_currency?: string | null
          default_vat_rate_type?:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          email?: string | null
          iban?: string | null
          id?: string
          is_active?: boolean | null
          is_customer?: boolean | null
          is_domestic?: boolean | null
          is_eu?: boolean | null
          is_supplier?: boolean | null
          kvk_number?: string | null
          legal_name?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          payment_terms_days?: number | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          bank_transaction_id: string | null
          contact_id: string | null
          created_at: string | null
          document_hash: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          duplicate_of: string | null
          extracted_amount: number | null
          extracted_currency: string | null
          extracted_date: string | null
          extracted_iban: string | null
          extracted_invoice_number: string | null
          extracted_supplier_name: string | null
          extracted_vat_amount: number | null
          extracted_vat_number: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          invoice_id: string | null
          is_duplicate: boolean | null
          is_validated: boolean | null
          journal_entry_id: string | null
          notes: string | null
          ocr_confidence: number | null
          ocr_data: Json | null
          ocr_status: string | null
          ocr_text: string | null
          organization_id: string
          storage_bucket: string | null
          tags: string[] | null
          updated_at: string | null
          uploaded_by: string | null
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          bank_transaction_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          document_hash?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          duplicate_of?: string | null
          extracted_amount?: number | null
          extracted_currency?: string | null
          extracted_date?: string | null
          extracted_iban?: string | null
          extracted_invoice_number?: string | null
          extracted_supplier_name?: string | null
          extracted_vat_amount?: number | null
          extracted_vat_number?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          invoice_id?: string | null
          is_duplicate?: boolean | null
          is_validated?: boolean | null
          journal_entry_id?: string | null
          notes?: string | null
          ocr_confidence?: number | null
          ocr_data?: Json | null
          ocr_status?: string | null
          ocr_text?: string | null
          organization_id: string
          storage_bucket?: string | null
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          bank_transaction_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          document_hash?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          duplicate_of?: string | null
          extracted_amount?: number | null
          extracted_currency?: string | null
          extracted_date?: string | null
          extracted_iban?: string | null
          extracted_invoice_number?: string | null
          extracted_supplier_name?: string | null
          extracted_vat_amount?: number | null
          extracted_vat_number?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          invoice_id?: string | null
          is_duplicate?: boolean | null
          is_validated?: boolean | null
          journal_entry_id?: string | null
          notes?: string | null
          ocr_confidence?: number | null
          ocr_data?: Json | null
          ocr_status?: string | null
          ocr_text?: string | null
          organization_id?: string
          storage_bucket?: string | null
          tags?: string[] | null
          updated_at?: string | null
          uploaded_by?: string | null
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_health_snapshots: {
        Row: {
          accounts_payable: number | null
          accounts_receivable: number | null
          cash_balance: number | null
          created_at: string | null
          current_ratio: number | null
          debt_ratio: number | null
          expenses_mtd: number | null
          expenses_ytd: number | null
          health_factors: Json | null
          health_score: number | null
          id: string
          income_tax_reserve: number | null
          net_working_capital: number | null
          organization_id: string
          profit_mtd: number | null
          profit_ytd: number | null
          quick_ratio: number | null
          revenue_mtd: number | null
          revenue_ytd: number | null
          snapshot_date: string
          total_tax_reserve: number | null
          vat_reserve: number | null
        }
        Insert: {
          accounts_payable?: number | null
          accounts_receivable?: number | null
          cash_balance?: number | null
          created_at?: string | null
          current_ratio?: number | null
          debt_ratio?: number | null
          expenses_mtd?: number | null
          expenses_ytd?: number | null
          health_factors?: Json | null
          health_score?: number | null
          id?: string
          income_tax_reserve?: number | null
          net_working_capital?: number | null
          organization_id: string
          profit_mtd?: number | null
          profit_ytd?: number | null
          quick_ratio?: number | null
          revenue_mtd?: number | null
          revenue_ytd?: number | null
          snapshot_date: string
          total_tax_reserve?: number | null
          vat_reserve?: number | null
        }
        Update: {
          accounts_payable?: number | null
          accounts_receivable?: number | null
          cash_balance?: number | null
          created_at?: string | null
          current_ratio?: number | null
          debt_ratio?: number | null
          expenses_mtd?: number | null
          expenses_ytd?: number | null
          health_factors?: Json | null
          health_score?: number | null
          id?: string
          income_tax_reserve?: number | null
          net_working_capital?: number | null
          organization_id?: string
          profit_mtd?: number | null
          profit_ytd?: number | null
          quick_ratio?: number | null
          revenue_mtd?: number | null
          revenue_ytd?: number | null
          snapshot_date?: string
          total_tax_reserve?: number | null
          vat_reserve?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_health_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          month: number
          notes: string | null
          organization_id: string
          quarter: number | null
          status: Database["public"]["Enums"]["period_status"]
          year: number
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          month: number
          notes?: string | null
          organization_id: string
          quarter?: number | null
          status?: Database["public"]["Enums"]["period_status"]
          year: number
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          month?: number
          notes?: string | null
          organization_id?: string
          quarter?: number | null
          status?: Database["public"]["Enums"]["period_status"]
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_periods_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_periods_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      icp_report_lines: {
        Row: {
          abc_amount: number | null
          contact_country: string
          contact_id: string | null
          contact_name: string | null
          contact_vat_number: string
          created_at: string | null
          goods_amount: number | null
          icp_report_id: string
          id: string
          services_amount: number | null
          total_amount: number | null
        }
        Insert: {
          abc_amount?: number | null
          contact_country: string
          contact_id?: string | null
          contact_name?: string | null
          contact_vat_number: string
          created_at?: string | null
          goods_amount?: number | null
          icp_report_id: string
          id?: string
          services_amount?: number | null
          total_amount?: number | null
        }
        Update: {
          abc_amount?: number | null
          contact_country?: string
          contact_id?: string | null
          contact_name?: string | null
          contact_vat_number?: string
          created_at?: string | null
          goods_amount?: number | null
          icp_report_id?: string
          id?: string
          services_amount?: number | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "icp_report_lines_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icp_report_lines_icp_report_id_fkey"
            columns: ["icp_report_id"]
            isOneToOne: false
            referencedRelation: "icp_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      icp_reports: {
        Row: {
          created_at: string | null
          filed_at: string | null
          id: string
          organization_id: string
          period_number: number
          period_type: Database["public"]["Enums"]["vat_frequency"]
          status: string
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          filed_at?: string | null
          id?: string
          organization_id: string
          period_number: number
          period_type: Database["public"]["Enums"]["vat_frequency"]
          status?: string
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          filed_at?: string | null
          id?: string
          organization_id?: string
          period_number?: number
          period_type?: Database["public"]["Enums"]["vat_frequency"]
          status?: string
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "icp_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          account_id: string | null
          created_at: string | null
          description: string
          discount_percentage: number | null
          id: string
          invoice_id: string
          line_number: number
          line_total: number
          quantity: number | null
          unit_price: number
          vat_amount: number
          vat_percentage: number
          vat_rate_type: Database["public"]["Enums"]["vat_rate_type"]
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          description: string
          discount_percentage?: number | null
          id?: string
          invoice_id: string
          line_number: number
          line_total: number
          quantity?: number | null
          unit_price: number
          vat_amount?: number
          vat_percentage?: number
          vat_rate_type?: Database["public"]["Enums"]["vat_rate_type"]
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          description?: string
          discount_percentage?: number | null
          id?: string
          invoice_id?: string
          line_number?: number
          line_total?: number
          quantity?: number | null
          unit_price?: number
          vat_amount?: number
          vat_percentage?: number
          vat_rate_type?: Database["public"]["Enums"]["vat_rate_type"]
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          ai_confidence: number | null
          ai_reasoning: string | null
          amount_due: number | null
          amount_paid: number | null
          contact_id: string | null
          contact_name: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          document_id: string | null
          due_date: string | null
          duplicate_hash: string | null
          exchange_rate: number | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          journal_entry_id: string | null
          notes: string | null
          ocr_data: Json | null
          organization_id: string
          paid_date: string | null
          payment_method: string | null
          payment_reference: string | null
          potential_duplicate_of: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tags: string[] | null
          total_amount: number
          total_vat: number
          updated_at: string | null
          vat_summary: Json | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          amount_due?: number | null
          amount_paid?: number | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          document_id?: string | null
          due_date?: string | null
          duplicate_hash?: string | null
          exchange_rate?: number | null
          id?: string
          invoice_date: string
          invoice_number: string
          invoice_type: Database["public"]["Enums"]["invoice_type"]
          journal_entry_id?: string | null
          notes?: string | null
          ocr_data?: Json | null
          organization_id: string
          paid_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          potential_duplicate_of?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tags?: string[] | null
          total_amount?: number
          total_vat?: number
          updated_at?: string | null
          vat_summary?: Json | null
        }
        Update: {
          ai_confidence?: number | null
          ai_reasoning?: string | null
          amount_due?: number | null
          amount_paid?: number | null
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          document_id?: string | null
          due_date?: string | null
          duplicate_hash?: string | null
          exchange_rate?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: Database["public"]["Enums"]["invoice_type"]
          journal_entry_id?: string | null
          notes?: string | null
          ocr_data?: Json | null
          organization_id?: string
          paid_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          potential_duplicate_of?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tags?: string[] | null
          total_amount?: number
          total_vat?: number
          updated_at?: string | null
          vat_summary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_potential_duplicate_of_fkey"
            columns: ["potential_duplicate_of"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          ai_confidence: number | null
          ai_generated: boolean | null
          ai_reasoning: string | null
          attachments: string[] | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          entry_number: number
          fiscal_period_id: string | null
          id: string
          is_reversal: boolean | null
          organization_id: string
          posted_at: string | null
          posted_by: string | null
          reference: string | null
          reversed_by_entry_id: string | null
          reverses_entry_id: string | null
          source_id: string | null
          source_type: string | null
          status: Database["public"]["Enums"]["journal_status"]
          tags: string[] | null
          updated_at: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          ai_reasoning?: string | null
          attachments?: string[] | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          entry_number?: number
          fiscal_period_id?: string | null
          id?: string
          is_reversal?: boolean | null
          organization_id: string
          posted_at?: string | null
          posted_by?: string | null
          reference?: string | null
          reversed_by_entry_id?: string | null
          reverses_entry_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["journal_status"]
          tags?: string[] | null
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_generated?: boolean | null
          ai_reasoning?: string | null
          attachments?: string[] | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          entry_number?: number
          fiscal_period_id?: string | null
          id?: string
          is_reversal?: boolean | null
          organization_id?: string
          posted_at?: string | null
          posted_by?: string | null
          reference?: string | null
          reversed_by_entry_id?: string | null
          reverses_entry_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: Database["public"]["Enums"]["journal_status"]
          tags?: string[] | null
          updated_at?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reversed_by_entry_id_fkey"
            columns: ["reversed_by_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_reverses_entry_id_fkey"
            columns: ["reverses_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          bank_transaction_id: string | null
          contact_id: string | null
          cost_center: string | null
          created_at: string | null
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          invoice_id: string | null
          journal_entry_id: string
          line_number: number
          project: string | null
          vat_account_id: string | null
          vat_amount: number | null
          vat_box: string | null
          vat_percentage: number | null
          vat_rate_type: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Insert: {
          account_id: string
          bank_transaction_id?: string | null
          contact_id?: string | null
          cost_center?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          journal_entry_id: string
          line_number: number
          project?: string | null
          vat_account_id?: string | null
          vat_amount?: number | null
          vat_box?: string | null
          vat_percentage?: number | null
          vat_rate_type?: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Update: {
          account_id?: string
          bank_transaction_id?: string | null
          contact_id?: string | null
          cost_center?: string | null
          created_at?: string | null
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          journal_entry_id?: string
          line_number?: number
          project?: string | null
          vat_account_id?: string | null
          vat_amount?: number | null
          vat_box?: string | null
          vat_percentage?: number | null
          vat_rate_type?: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_vat_account_id_fkey"
            columns: ["vat_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          category: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          message_nl: string | null
          organization_id: string
          read_at: string | null
          severity: Database["public"]["Enums"]["notification_severity"]
          title: string
          user_id: string | null
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          message_nl?: string | null
          organization_id: string
          read_at?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          title: string
          user_id?: string | null
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          message_nl?: string | null
          organization_id?: string
          read_at?: string | null
          severity?: Database["public"]["Enums"]["notification_severity"]
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invited_at: string | null
          is_owner: boolean | null
          organization_id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          is_owner?: boolean | null
          organization_id: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          is_owner?: boolean | null
          organization_id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_street: string | null
          btw_number: string | null
          created_at: string | null
          default_currency: string | null
          email: string | null
          fiscal_year_start_month: number | null
          iban: string | null
          id: string
          kor_eligible: boolean | null
          kor_threshold_amount: number | null
          kvk_number: string | null
          legal_name: string | null
          logo_url: string | null
          name: string
          org_type: Database["public"]["Enums"]["org_type"]
          phone: string | null
          settings: Json | null
          updated_at: string | null
          vat_frequency: Database["public"]["Enums"]["vat_frequency"]
          vat_scheme: Database["public"]["Enums"]["vat_scheme"]
          website: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          btw_number?: string | null
          created_at?: string | null
          default_currency?: string | null
          email?: string | null
          fiscal_year_start_month?: number | null
          iban?: string | null
          id?: string
          kor_eligible?: boolean | null
          kor_threshold_amount?: number | null
          kvk_number?: string | null
          legal_name?: string | null
          logo_url?: string | null
          name: string
          org_type?: Database["public"]["Enums"]["org_type"]
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
          vat_frequency?: Database["public"]["Enums"]["vat_frequency"]
          vat_scheme?: Database["public"]["Enums"]["vat_scheme"]
          website?: string | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          btw_number?: string | null
          created_at?: string | null
          default_currency?: string | null
          email?: string | null
          fiscal_year_start_month?: number | null
          iban?: string | null
          id?: string
          kor_eligible?: boolean | null
          kor_threshold_amount?: number | null
          kvk_number?: string | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          org_type?: Database["public"]["Enums"]["org_type"]
          phone?: string | null
          settings?: Json | null
          updated_at?: string | null
          vat_frequency?: Database["public"]["Enums"]["vat_frequency"]
          vat_scheme?: Database["public"]["Enums"]["vat_scheme"]
          website?: string | null
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          allocation_date: string
          amount: number
          bank_transaction_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          invoice_id: string
          organization_id: string
        }
        Insert: {
          allocation_date: string
          amount: number
          bank_transaction_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id: string
          organization_id: string
        }
        Update: {
          allocation_date?: string
          amount?: number
          bank_transaction_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          invoice_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_rules: {
        Row: {
          assign_account_id: string | null
          assign_contact_id: string | null
          assign_description: string | null
          assign_vat_percentage: number | null
          assign_vat_rate_type:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_applied_at: string | null
          match_amount_max: number | null
          match_amount_min: number | null
          match_counterparty: string | null
          match_description: string | null
          match_direction: string | null
          name: string
          organization_id: string
          priority: number | null
          times_applied: number | null
          updated_at: string | null
        }
        Insert: {
          assign_account_id?: string | null
          assign_contact_id?: string | null
          assign_description?: string | null
          assign_vat_percentage?: number | null
          assign_vat_rate_type?:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          match_amount_max?: number | null
          match_amount_min?: number | null
          match_counterparty?: string | null
          match_description?: string | null
          match_direction?: string | null
          name: string
          organization_id: string
          priority?: number | null
          times_applied?: number | null
          updated_at?: string | null
        }
        Update: {
          assign_account_id?: string | null
          assign_contact_id?: string | null
          assign_description?: string | null
          assign_vat_percentage?: number | null
          assign_vat_rate_type?:
            | Database["public"]["Enums"]["vat_rate_type"]
            | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_applied_at?: string | null
          match_amount_max?: number | null
          match_amount_min?: number | null
          match_counterparty?: string | null
          match_description?: string | null
          match_direction?: string | null
          name?: string
          organization_id?: string
          priority?: number | null
          times_applied?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_rules_assign_account_id_fkey"
            columns: ["assign_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_rules_assign_contact_id_fkey"
            columns: ["assign_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_patterns: {
        Row: {
          account_id: string | null
          amount_variance: number | null
          confidence: number | null
          contact_id: string | null
          counterparty_name: string | null
          created_at: string | null
          description: string
          detected_by: string | null
          expected_day: number | null
          frequency: string | null
          id: string
          is_active: boolean | null
          last_seen_date: string | null
          next_expected_date: string | null
          organization_id: string
          sample_transactions: string[] | null
          times_matched: number | null
          typical_amount: number | null
          updated_at: string | null
          vat_rate_type: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Insert: {
          account_id?: string | null
          amount_variance?: number | null
          confidence?: number | null
          contact_id?: string | null
          counterparty_name?: string | null
          created_at?: string | null
          description: string
          detected_by?: string | null
          expected_day?: number | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_date?: string | null
          next_expected_date?: string | null
          organization_id: string
          sample_transactions?: string[] | null
          times_matched?: number | null
          typical_amount?: number | null
          updated_at?: string | null
          vat_rate_type?: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Update: {
          account_id?: string | null
          amount_variance?: number | null
          confidence?: number | null
          contact_id?: string | null
          counterparty_name?: string | null
          created_at?: string | null
          description?: string
          detected_by?: string | null
          expected_day?: number | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          last_seen_date?: string | null
          next_expected_date?: string | null
          organization_id?: string
          sample_transactions?: string[] | null
          times_matched?: number | null
          typical_amount?: number | null
          updated_at?: string | null
          vat_rate_type?: Database["public"]["Enums"]["vat_rate_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_patterns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_patterns_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_patterns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_reserves: {
        Row: {
          calculated_amount: number
          calculation_details: Json | null
          created_at: string | null
          id: string
          notes: string | null
          organization_id: string
          paid_amount: number | null
          period_month: number | null
          period_year: number
          remaining_amount: number | null
          reserve_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          calculated_amount?: number
          calculation_details?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          period_month?: number | null
          period_year: number
          remaining_amount?: number | null
          reserve_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          calculated_amount?: number
          calculation_details?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          period_month?: number | null
          period_year?: number
          remaining_amount?: number | null
          reserve_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_reserves_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          settings: Json | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          settings?: Json | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          settings?: Json | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      vat_rates: {
        Row: {
          created_at: string | null
          description: string
          description_nl: string | null
          icp_box: string | null
          id: string
          import_box: string | null
          is_active: boolean | null
          is_system: boolean | null
          organization_id: string
          percentage: number
          purchase_base_box: string | null
          purchase_box: string | null
          rate_type: Database["public"]["Enums"]["vat_rate_type"]
          sales_base_box: string | null
          sales_box: string | null
          sort_order: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          description_nl?: string | null
          icp_box?: string | null
          id?: string
          import_box?: string | null
          is_active?: boolean | null
          is_system?: boolean | null
          organization_id: string
          percentage: number
          purchase_base_box?: string | null
          purchase_box?: string | null
          rate_type: Database["public"]["Enums"]["vat_rate_type"]
          sales_base_box?: string | null
          sales_box?: string | null
          sort_order?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          description_nl?: string | null
          icp_box?: string | null
          id?: string
          import_box?: string | null
          is_active?: boolean | null
          is_system?: boolean | null
          organization_id?: string
          percentage?: number
          purchase_base_box?: string | null
          purchase_box?: string | null
          rate_type?: Database["public"]["Enums"]["vat_rate_type"]
          sales_base_box?: string | null
          sales_box?: string | null
          sort_order?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vat_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vat_return_lines: {
        Row: {
          base_amount: number
          contact_country: string | null
          contact_id: string | null
          contact_vat_number: string | null
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string | null
          journal_entry_id: string | null
          journal_line_id: string | null
          vat_amount: number
          vat_box: string
          vat_percentage: number
          vat_rate_type: Database["public"]["Enums"]["vat_rate_type"]
          vat_return_id: string
        }
        Insert: {
          base_amount: number
          contact_country?: string | null
          contact_id?: string | null
          contact_vat_number?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          journal_entry_id?: string | null
          journal_line_id?: string | null
          vat_amount: number
          vat_box: string
          vat_percentage: number
          vat_rate_type: Database["public"]["Enums"]["vat_rate_type"]
          vat_return_id: string
        }
        Update: {
          base_amount?: number
          contact_country?: string | null
          contact_id?: string | null
          contact_vat_number?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string | null
          journal_entry_id?: string | null
          journal_line_id?: string | null
          vat_amount?: number
          vat_box?: string
          vat_percentage?: number
          vat_rate_type?: Database["public"]["Enums"]["vat_rate_type"]
          vat_return_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vat_return_lines_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vat_return_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vat_return_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vat_return_lines_journal_line_id_fkey"
            columns: ["journal_line_id"]
            isOneToOne: false
            referencedRelation: "journal_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vat_return_lines_vat_return_id_fkey"
            columns: ["vat_return_id"]
            isOneToOne: false
            referencedRelation: "vat_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      vat_returns: {
        Row: {
          box_1a_base: number | null
          box_1a_vat: number | null
          box_1b_base: number | null
          box_1b_vat: number | null
          box_1c_base: number | null
          box_1c_vat: number | null
          box_1d_base: number | null
          box_1d_vat: number | null
          box_1e_base: number | null
          box_1e_vat: number | null
          box_2a_base: number | null
          box_2a_vat: number | null
          box_3a_base: number | null
          box_3b_base: number | null
          box_3c_base: number | null
          box_4a_base: number | null
          box_4a_vat: number | null
          box_4b_base: number | null
          box_4b_vat: number | null
          box_5a_vat: number | null
          box_5b_vat: number | null
          box_5c_vat: number | null
          box_5d_vat: number | null
          box_5e_vat: number | null
          box_5f_vat: number | null
          calculation_details: Json | null
          created_at: string | null
          errors: string[] | null
          filed_at: string | null
          filed_by: string | null
          filing_reference: string | null
          id: string
          organization_id: string
          period_end: string
          period_number: number
          period_start: string
          period_type: Database["public"]["Enums"]["vat_frequency"]
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          warnings: string[] | null
          year: number
        }
        Insert: {
          box_1a_base?: number | null
          box_1a_vat?: number | null
          box_1b_base?: number | null
          box_1b_vat?: number | null
          box_1c_base?: number | null
          box_1c_vat?: number | null
          box_1d_base?: number | null
          box_1d_vat?: number | null
          box_1e_base?: number | null
          box_1e_vat?: number | null
          box_2a_base?: number | null
          box_2a_vat?: number | null
          box_3a_base?: number | null
          box_3b_base?: number | null
          box_3c_base?: number | null
          box_4a_base?: number | null
          box_4a_vat?: number | null
          box_4b_base?: number | null
          box_4b_vat?: number | null
          box_5a_vat?: number | null
          box_5b_vat?: number | null
          box_5c_vat?: number | null
          box_5d_vat?: number | null
          box_5e_vat?: number | null
          box_5f_vat?: number | null
          calculation_details?: Json | null
          created_at?: string | null
          errors?: string[] | null
          filed_at?: string | null
          filed_by?: string | null
          filing_reference?: string | null
          id?: string
          organization_id: string
          period_end: string
          period_number: number
          period_start: string
          period_type: Database["public"]["Enums"]["vat_frequency"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          warnings?: string[] | null
          year: number
        }
        Update: {
          box_1a_base?: number | null
          box_1a_vat?: number | null
          box_1b_base?: number | null
          box_1b_vat?: number | null
          box_1c_base?: number | null
          box_1c_vat?: number | null
          box_1d_base?: number | null
          box_1d_vat?: number | null
          box_1e_base?: number | null
          box_1e_vat?: number | null
          box_2a_base?: number | null
          box_2a_vat?: number | null
          box_3a_base?: number | null
          box_3b_base?: number | null
          box_3c_base?: number | null
          box_4a_base?: number | null
          box_4a_vat?: number | null
          box_4b_base?: number | null
          box_4b_vat?: number | null
          box_5a_vat?: number | null
          box_5b_vat?: number | null
          box_5c_vat?: number | null
          box_5d_vat?: number | null
          box_5e_vat?: number | null
          box_5f_vat?: number | null
          calculation_details?: Json | null
          created_at?: string | null
          errors?: string[] | null
          filed_at?: string | null
          filed_by?: string | null
          filing_reference?: string | null
          id?: string
          organization_id?: string
          period_end?: string
          period_number?: number
          period_start?: string
          period_type?: Database["public"]["Enums"]["vat_frequency"]
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          warnings?: string[] | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vat_returns_filed_by_fkey"
            columns: ["filed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vat_returns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vat_returns_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_vat_return: {
        Args: { p_end_date: string; p_org_id: string; p_start_date: string }
        Returns: Json
      }
      get_user_org_ids: { Args: never; Returns: string[] }
      get_user_role_in_org: {
        Args: { p_org_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      seed_chart_of_accounts: { Args: { p_org_id: string }; Returns: undefined }
      seed_vat_rates: { Args: { p_org_id: string }; Returns: undefined }
      setup_new_organization: {
        Args: { p_org_id: string; p_user_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      account_subtype:
        | "cash"
        | "bank"
        | "accounts_receivable"
        | "inventory"
        | "prepaid"
        | "fixed_asset"
        | "accumulated_depreciation"
        | "other_asset"
        | "accounts_payable"
        | "credit_card"
        | "vat_payable"
        | "vat_receivable"
        | "payroll_liability"
        | "loan"
        | "other_liability"
        | "owner_equity"
        | "retained_earnings"
        | "owner_draw"
        | "other_equity"
        | "sales_revenue"
        | "service_revenue"
        | "other_income"
        | "interest_income"
        | "cost_of_goods"
        | "operating_expense"
        | "payroll_expense"
        | "rent"
        | "utilities"
        | "insurance"
        | "office_supplies"
        | "travel"
        | "marketing"
        | "professional_fees"
        | "depreciation_expense"
        | "interest_expense"
        | "tax_expense"
        | "other_expense"
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      ai_action_type:
        | "categorize"
        | "match"
        | "detect_anomaly"
        | "detect_duplicate"
        | "extract_ocr"
        | "suggest_entry"
        | "validate_vat"
      bank_tx_status:
        | "new"
        | "matched"
        | "partial_match"
        | "manually_matched"
        | "excluded"
        | "reconciled"
      document_type:
        | "invoice"
        | "receipt"
        | "bank_statement"
        | "contract"
        | "tax_filing"
        | "other"
      invoice_status:
        | "draft"
        | "sent"
        | "paid"
        | "partial"
        | "overdue"
        | "cancelled"
        | "credited"
      invoice_type:
        | "sales"
        | "purchase"
        | "credit_note_sales"
        | "credit_note_purchase"
      journal_status: "draft" | "posted" | "voided"
      notification_severity: "info" | "warning" | "error" | "critical"
      org_type:
        | "eenmanszaak"
        | "vof"
        | "bv"
        | "nv"
        | "stichting"
        | "maatschap"
        | "cv"
      payment_status:
        | "pending"
        | "matched"
        | "partial"
        | "unmatched"
        | "excluded"
      period_status: "open" | "closing" | "closed" | "locked"
      transaction_direction: "debit" | "credit"
      user_role: "entrepreneur" | "bookkeeper" | "accountant" | "admin"
      vat_frequency: "monthly" | "quarterly" | "yearly"
      vat_rate_type:
        | "high"
        | "low"
        | "zero"
        | "exempt"
        | "reverse_charge"
        | "icp"
        | "export"
        | "import"
        | "margin"
      vat_scheme: "standard" | "kor"
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
      account_subtype: [
        "cash",
        "bank",
        "accounts_receivable",
        "inventory",
        "prepaid",
        "fixed_asset",
        "accumulated_depreciation",
        "other_asset",
        "accounts_payable",
        "credit_card",
        "vat_payable",
        "vat_receivable",
        "payroll_liability",
        "loan",
        "other_liability",
        "owner_equity",
        "retained_earnings",
        "owner_draw",
        "other_equity",
        "sales_revenue",
        "service_revenue",
        "other_income",
        "interest_income",
        "cost_of_goods",
        "operating_expense",
        "payroll_expense",
        "rent",
        "utilities",
        "insurance",
        "office_supplies",
        "travel",
        "marketing",
        "professional_fees",
        "depreciation_expense",
        "interest_expense",
        "tax_expense",
        "other_expense",
      ],
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      ai_action_type: [
        "categorize",
        "match",
        "detect_anomaly",
        "detect_duplicate",
        "extract_ocr",
        "suggest_entry",
        "validate_vat",
      ],
      bank_tx_status: [
        "new",
        "matched",
        "partial_match",
        "manually_matched",
        "excluded",
        "reconciled",
      ],
      document_type: [
        "invoice",
        "receipt",
        "bank_statement",
        "contract",
        "tax_filing",
        "other",
      ],
      invoice_status: [
        "draft",
        "sent",
        "paid",
        "partial",
        "overdue",
        "cancelled",
        "credited",
      ],
      invoice_type: [
        "sales",
        "purchase",
        "credit_note_sales",
        "credit_note_purchase",
      ],
      journal_status: ["draft", "posted", "voided"],
      notification_severity: ["info", "warning", "error", "critical"],
      org_type: [
        "eenmanszaak",
        "vof",
        "bv",
        "nv",
        "stichting",
        "maatschap",
        "cv",
      ],
      payment_status: [
        "pending",
        "matched",
        "partial",
        "unmatched",
        "excluded",
      ],
      period_status: ["open", "closing", "closed", "locked"],
      transaction_direction: ["debit", "credit"],
      user_role: ["entrepreneur", "bookkeeper", "accountant", "admin"],
      vat_frequency: ["monthly", "quarterly", "yearly"],
      vat_rate_type: [
        "high",
        "low",
        "zero",
        "exempt",
        "reverse_charge",
        "icp",
        "export",
        "import",
        "margin",
      ],
      vat_scheme: ["standard", "kor"],
    },
  },
} as const
