export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_action_logs: {
        Row: {
          action: string;
          admin_id: string;
          changes: Json | null;
          created_at: string | null;
          id: string;
          ip_address: string | null;
          target_id: string | null;
          target_type: string | null;
        };
        Insert: {
          action: string;
          admin_id: string;
          changes?: Json | null;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Update: {
          action?: string;
          admin_id?: string;
          changes?: Json | null;
          created_at?: string | null;
          id?: string;
          ip_address?: string | null;
          target_id?: string | null;
          target_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_action_logs_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["id"];
          },
        ];
      };
      admins: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          last_active_at: string | null;
          last_login_at: string | null;
          last_login_ip: string | null;
          name: string;
          role: string;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          created_at?: string | null;
          id: string;
          is_active?: boolean | null;
          last_active_at?: string | null;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          name: string;
          role?: string;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_active_at?: string | null;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          name?: string;
          role?: string;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          assigned_profile_ids: string[] | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          last_active_at: string | null;
          last_login_at: string | null;
          last_login_ip: string | null;
          name: string;
          referral_code: string;
          total_game_revenue: number | null;
          total_gift_revenue: number | null;
          total_revenue: number | null;
          updated_at: string | null;
          username: string;
        };
        Insert: {
          assigned_profile_ids?: string[] | null;
          created_at?: string | null;
          id: string;
          is_active?: boolean | null;
          last_active_at?: string | null;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          name: string;
          referral_code: string;
          total_game_revenue?: number | null;
          total_gift_revenue?: number | null;
          total_revenue?: number | null;
          updated_at?: string | null;
          username: string;
        };
        Update: {
          assigned_profile_ids?: string[] | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_active_at?: string | null;
          last_login_at?: string | null;
          last_login_ip?: string | null;
          name?: string;
          referral_code?: string;
          total_game_revenue?: number | null;
          total_gift_revenue?: number | null;
          total_revenue?: number | null;
          updated_at?: string | null;
          username?: string;
        };
        Relationships: [];
      };
      charging_cards: {
        Row: {
          amount: number;
          bonus_amount: number | null;
          created_at: string | null;
          created_by: string;
          display_order: number | null;
          id: string;
          is_active: boolean | null;
          name: string;
          total_amount: number | null;
        };
        Insert: {
          amount: number;
          bonus_amount?: number | null;
          created_at?: string | null;
          created_by?: string;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
        };
        Update: {
          amount?: number;
          bonus_amount?: number | null;
          created_at?: string | null;
          created_by?: string;
          display_order?: number | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "charging_cards_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_profiles: {
        Row: {
          active_chats: number | null;
          age: number;
          assigned_agent_id: string | null;
          assigned_by_admin_id: string | null;
          bio: string | null;
          chat_cost: number | null;
          chat_request_count: number | null;
          created_at: string | null;
          height: number | null;
          id: string;
          image: string | null;
          image_object_id: string | null;
          interests: Json | null;
          is_active: boolean | null;
          is_online: boolean | null;
          job: string | null;
          name: string;
          total_chats: number | null;
          total_gift_value: number | null;
          total_gifts_received: number | null;
          total_messages: number | null;
          weight: number | null;
        };
        Insert: {
          active_chats?: number | null;
          age: number;
          assigned_agent_id?: string | null;
          assigned_by_admin_id?: string | null;
          bio?: string | null;
          chat_cost?: number | null;
          chat_request_count?: number | null;
          created_at?: string | null;
          height?: number | null;
          id?: string;
          image?: string | null;
          image_object_id?: string | null;
          interests?: Json | null;
          is_active?: boolean | null;
          is_online?: boolean | null;
          job?: string | null;
          name: string;
          total_chats?: number | null;
          total_gift_value?: number | null;
          total_gifts_received?: number | null;
          total_messages?: number | null;
          weight?: number | null;
        };
        Update: {
          active_chats?: number | null;
          age?: number;
          assigned_agent_id?: string | null;
          assigned_by_admin_id?: string | null;
          bio?: string | null;
          chat_cost?: number | null;
          chat_request_count?: number | null;
          created_at?: string | null;
          height?: number | null;
          id?: string;
          image?: string | null;
          image_object_id?: string | null;
          interests?: Json | null;
          is_active?: boolean | null;
          is_online?: boolean | null;
          job?: string | null;
          name?: string;
          total_chats?: number | null;
          total_gift_value?: number | null;
          total_gifts_received?: number | null;
          total_messages?: number | null;
          weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "chat_profiles_assigned_agent_id_fkey";
            columns: ["assigned_agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_rooms: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          last_message: string | null;
          last_message_at: string | null;
          last_message_sender_type: string | null;
          profile_gifts_count: number | null;
          profile_gifts_value: number | null;
          profile_id: string;
          status: string | null;
          unread_count: number | null;
          user_gifts_count: number | null;
          user_gifts_value: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_message?: string | null;
          last_message_at?: string | null;
          last_message_sender_type?: string | null;
          profile_gifts_count?: number | null;
          profile_gifts_value?: number | null;
          profile_id: string;
          status?: string | null;
          unread_count?: number | null;
          user_gifts_count?: number | null;
          user_gifts_value?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_message?: string | null;
          last_message_at?: string | null;
          last_message_sender_type?: string | null;
          profile_gifts_count?: number | null;
          profile_gifts_value?: number | null;
          profile_id?: string;
          status?: string | null;
          unread_count?: number | null;
          user_gifts_count?: number | null;
          user_gifts_value?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_rooms_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "chat_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_rooms_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      deposit_requests: {
        Row: {
          amount: number;
          bonus_amount: number | null;
          created_at: string | null;
          depositor_name: string | null;
          id: string;
          processed_at: string | null;
          processed_by: string | null;
          reject_reason: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          bonus_amount?: number | null;
          created_at?: string | null;
          depositor_name?: string | null;
          id?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          reject_reason?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          bonus_amount?: number | null;
          created_at?: string | null;
          depositor_name?: string | null;
          id?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          reject_reason?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "deposit_requests_processed_by_fkey";
            columns: ["processed_by"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "deposit_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_bets: {
        Row: {
          bet_amount: number;
          bet_type: string;
          bet_value: string;
          created_at: string | null;
          id: string;
          odds: number;
          round_id: string;
          settled_at: string | null;
          status: string;
          user_id: string;
          win_amount: number | null;
        };
        Insert: {
          bet_amount: number;
          bet_type: string;
          bet_value: string;
          created_at?: string | null;
          id?: string;
          odds: number;
          round_id: string;
          settled_at?: string | null;
          status?: string;
          user_id: string;
          win_amount?: number | null;
        };
        Update: {
          bet_amount?: number;
          bet_type?: string;
          bet_value?: string;
          created_at?: string | null;
          id?: string;
          odds?: number;
          round_id?: string;
          settled_at?: string | null;
          status?: string;
          user_id?: string;
          win_amount?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_bets_round_id_fkey";
            columns: ["round_id"];
            isOneToOne: false;
            referencedRelation: "game_rounds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "game_bets_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_chats: {
        Row: {
          created_at: string | null;
          game_type: string;
          id: string;
          message: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          game_type: string;
          id?: string;
          message: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          game_type?: string;
          id?: string;
          message?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "game_chats_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      game_rounds: {
        Row: {
          betting_end_time: string | null;
          created_at: string | null;
          end_time: string | null;
          game_type: string;
          id: string;
          is_settled: boolean | null;
          profit: number | null;
          reserved_at: string | null;
          reserved_by: string | null;
          reserved_result: Json | null;
          result: Json | null;
          round_number: number | null;
          settled_at: string | null;
          start_time: string | null;
          status: string;
          total_bet_amount: number | null;
          total_win_amount: number | null;
          updated_at: string | null;
        };
        Insert: {
          betting_end_time?: string | null;
          created_at?: string | null;
          end_time?: string | null;
          game_type: string;
          id?: string;
          is_settled?: boolean | null;
          profit?: number | null;
          reserved_at?: string | null;
          reserved_by?: string | null;
          reserved_result?: Json | null;
          result?: Json | null;
          round_number?: number | null;
          settled_at?: string | null;
          start_time?: string | null;
          status?: string;
          total_bet_amount?: number | null;
          total_win_amount?: number | null;
          updated_at?: string | null;
        };
        Update: {
          betting_end_time?: string | null;
          created_at?: string | null;
          end_time?: string | null;
          game_type?: string;
          id?: string;
          is_settled?: boolean | null;
          profit?: number | null;
          reserved_at?: string | null;
          reserved_by?: string | null;
          reserved_result?: Json | null;
          result?: Json | null;
          round_number?: number | null;
          settled_at?: string | null;
          start_time?: string | null;
          status?: string;
          total_bet_amount?: number | null;
          total_win_amount?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_rounds_reserved_by_fkey";
            columns: ["reserved_by"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["id"];
          },
        ];
      };
      game_settings: {
        Row: {
          betting_end_seconds: number | null;
          game_type: string;
          id: string;
          is_active: boolean | null;
          max_bet: number | null;
          min_bet: number | null;
          odds: Json | null;
          round_duration_seconds: number | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          betting_end_seconds?: number | null;
          game_type: string;
          id?: string;
          is_active?: boolean | null;
          max_bet?: number | null;
          min_bet?: number | null;
          odds?: Json | null;
          round_duration_seconds?: number | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          betting_end_seconds?: number | null;
          game_type?: string;
          id?: string;
          is_active?: boolean | null;
          max_bet?: number | null;
          min_bet?: number | null;
          odds?: Json | null;
          round_duration_seconds?: number | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "game_settings_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["id"];
          },
        ];
      };
      gift_inventory: {
        Row: {
          acquired_at: string | null;
          gift_id: string;
          id: string;
          owner_id: string;
          owner_type: string;
          quantity: number;
        };
        Insert: {
          acquired_at?: string | null;
          gift_id: string;
          id?: string;
          owner_id: string;
          owner_type?: string;
          quantity?: number;
        };
        Update: {
          acquired_at?: string | null;
          gift_id?: string;
          id?: string;
          owner_id?: string;
          owner_type?: string;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "gift_inventory_gift_id_fkey";
            columns: ["gift_id"];
            isOneToOne: false;
            referencedRelation: "gifts";
            referencedColumns: ["id"];
          },
        ];
      };
      gift_transactions: {
        Row: {
          agent_id: string | null;
          agent_revenue: number | null;
          created_at: string | null;
          gift_id: string;
          id: string;
          points_amount: number;
          quantity: number | null;
          receiver_id: string;
          receiver_type: string;
          room_id: string | null;
          sender_id: string;
          sender_type: string;
          transaction_type: string | null;
        };
        Insert: {
          agent_id?: string | null;
          agent_revenue?: number | null;
          created_at?: string | null;
          gift_id: string;
          id?: string;
          points_amount: number;
          quantity?: number | null;
          receiver_id: string;
          receiver_type: string;
          room_id?: string | null;
          sender_id: string;
          sender_type: string;
          transaction_type?: string | null;
        };
        Update: {
          agent_id?: string | null;
          agent_revenue?: number | null;
          created_at?: string | null;
          gift_id?: string;
          id?: string;
          points_amount?: number;
          quantity?: number | null;
          receiver_id?: string;
          receiver_type?: string;
          room_id?: string | null;
          sender_id?: string;
          sender_type?: string;
          transaction_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "gift_transactions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gift_transactions_gift_id_fkey";
            columns: ["gift_id"];
            isOneToOne: false;
            referencedRelation: "gifts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "gift_transactions_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      gifts: {
        Row: {
          buy_price: number;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          emoji: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          sell_price: number;
        };
        Insert: {
          buy_price: number;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          emoji?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          sell_price: number;
        };
        Update: {
          buy_price?: number;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          emoji?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          sell_price?: number;
        };
        Relationships: [];
      };
      login_logs: {
        Row: {
          created_at: string | null;
          device_info: Json | null;
          failure_reason: string | null;
          id: string;
          ip_address: string;
          login_status: string | null;
          user_agent: string | null;
          user_id: string | null;
          user_type: string | null;
        };
        Insert: {
          created_at?: string | null;
          device_info?: Json | null;
          failure_reason?: string | null;
          id?: string;
          ip_address: string;
          login_status?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          user_type?: string | null;
        };
        Update: {
          created_at?: string | null;
          device_info?: Json | null;
          failure_reason?: string | null;
          id?: string;
          ip_address?: string;
          login_status?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
          user_type?: string | null;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string | null;
          created_at: string | null;
          gift_id: string | null;
          gift_quantity: number | null;
          id: string;
          is_read: boolean | null;
          message: string;
          message_type: string | null;
          read_at: string | null;
          room_id: string;
          sender_id: string;
          sender_type: string;
          type: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          gift_id?: string | null;
          gift_quantity?: number | null;
          id?: string;
          is_read?: boolean | null;
          message: string;
          message_type?: string | null;
          read_at?: string | null;
          room_id: string;
          sender_id: string;
          sender_type: string;
          type?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          gift_id?: string | null;
          gift_quantity?: number | null;
          id?: string;
          is_read?: boolean | null;
          message?: string;
          message_type?: string | null;
          read_at?: string | null;
          room_id?: string;
          sender_id?: string;
          sender_type?: string;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "chat_rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      notices: {
        Row: {
          author_id: string | null;
          category: string | null;
          content: string;
          created_at: string | null;
          id: string;
          is_pinned: boolean | null;
          is_published: boolean | null;
          title: string;
          updated_at: string | null;
          view_count: number | null;
        };
        Insert: {
          author_id?: string | null;
          category?: string | null;
          content: string;
          created_at?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          is_published?: boolean | null;
          title: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Update: {
          author_id?: string | null;
          category?: string | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          is_published?: boolean | null;
          title?: string;
          updated_at?: string | null;
          view_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "notices_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["id"];
          },
        ];
      };
      point_transactions: {
        Row: {
          admin_id: string | null;
          amount: number;
          balance_after: number;
          balance_before: number;
          created_at: string | null;
          description: string | null;
          id: string;
          related_id: string | null;
          related_type: string | null;
          type: string;
          user_id: string;
        };
        Insert: {
          admin_id?: string | null;
          amount: number;
          balance_after: number;
          balance_before: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          related_id?: string | null;
          related_type?: string | null;
          type: string;
          user_id: string;
        };
        Update: {
          admin_id?: string | null;
          amount?: number;
          balance_after?: number;
          balance_before?: number;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          related_id?: string | null;
          related_type?: string | null;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "point_transactions_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "point_transactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          account_holder: string | null;
          account_number: string | null;
          agent_id: string | null;
          bank: string | null;
          created_at: string | null;
          deleted_at: string | null;
          email: string;
          gift_inventory_count: number | null;
          gift_inventory_value: number | null;
          id: string;
          is_online: boolean | null;
          join_ip: string | null;
          last_activity: string | null;
          last_login_ip: string | null;
          last_login_at: string | null;
          name: string;
          nickname: string;
          phone: string | null;
          points: number;
          profile_image: string | null;
          status: string;
          total_deposited: number;
          total_withdrawn: number;
          updated_at: string | null;
        };
        Insert: {
          account_holder?: string | null;
          account_number?: string | null;
          agent_id?: string | null;
          bank?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email: string;
          gift_inventory_count?: number | null;
          gift_inventory_value?: number | null;
          id: string;
          is_online?: boolean | null;
          join_ip?: string | null;
          last_activity?: string | null;
          last_login_ip?: string | null;
          last_login_at?: string | null;
          name: string;
          nickname: string;
          phone?: string | null;
          points?: number;
          profile_image?: string | null;
          status?: string;
          total_deposited?: number;
          total_withdrawn?: number;
          updated_at?: string | null;
        };
        Update: {
          account_holder?: string | null;
          account_number?: string | null;
          agent_id?: string | null;
          bank?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string;
          gift_inventory_count?: number | null;
          gift_inventory_value?: number | null;
          id?: string;
          is_online?: boolean | null;
          join_ip?: string | null;
          last_activity?: string | null;
          last_login_ip?: string | null;
          last_login_at?: string | null;
          name?: string;
          nickname?: string;
          phone?: string | null;
          points?: number;
          profile_image?: string | null;
          status?: string;
          total_deposited?: number;
          total_withdrawn?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      system_settings: {
        Row: {
          key: string;
          value: string;
          description: string | null;
          updated_at: string | null;
        };
        Insert: {
          key: string;
          value: string;
          description?: string | null;
          updated_at?: string | null;
        };
        Update: {
          key?: string;
          value?: string;
          description?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      withdrawal_requests: {
        Row: {
          account_holder: string;
          account_number: string;
          amount: number;
          bank: string;
          created_at: string | null;
          id: string;
          processed_at: string | null;
          processed_by: string | null;
          reject_reason: string | null;
          status: string;
          user_id: string;
        };
        Insert: {
          account_holder: string;
          account_number: string;
          amount: number;
          bank: string;
          created_at?: string | null;
          id?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          reject_reason?: string | null;
          status?: string;
          user_id: string;
        };
        Update: {
          account_holder?: string;
          account_number?: string;
          amount?: number;
          bank?: string;
          created_at?: string | null;
          id?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          reject_reason?: string | null;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_processed_by_fkey";
            columns: ["processed_by"];
            isOneToOne: false;
            referencedRelation: "admins";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "withdrawal_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_points: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_type: string;
          p_reference_id: string | null;
          p_description: string | null;
        };
        Returns: number;
      };
      admin_force_process_round: {
        Args: {
          p_round_id: string;
          p_result: Json | null;
        };
        Returns: Json;
      };
      admin_gift_grant: {
        Args: {
          p_owner_id: string;
          p_gift_id: string;
          p_quantity: number;
          p_owner_type?: string;
          p_admin_id?: string | null;
        };
        Returns: string;
      };
      admin_gift_revoke: {
        Args: {
          p_owner_id: string;
          p_gift_id: string;
          p_quantity: number;
          p_owner_type?: string;
          p_admin_id?: string | null;
        };
        Returns: string;
      };
      admin_game_tick: {
        Args: {
          p_game_type: string | null;
        };
        Returns: Json;
      };
      admin_reclaim_gift_inventory: {
        Args: {
          p_gift_id: string;
        };
        Returns: Json;
      };
      game_tick_client: {
        Args: {
          p_game_type: string | null;
        };
        Returns: Json;
      };
      game_chat_send: {
        Args: {
          p_game_type: string;
          p_message: string;
        };
        Returns: string;
      };
      game_chat_list: {
        Args: {
          p_game_type: string;
          p_limit?: number;
        };
        Returns: Json;
      };
      game_chat_get: {
        Args: {
          p_id: string;
        };
        Returns: Json;
      };
      ladder_game_chat_send: {
        Args: {
          p_message: string;
        };
        Returns: string;
      };
      ladder_game_chat_list: {
        Args: {
          p_limit?: number;
        };
        Returns: Json;
      };
      ladder_game_chat_get: {
        Args: {
          p_id: string;
        };
        Returns: Json;
      };
      ladder_game_chat_list_admin: {
        Args: {
          p_user_id: string;
          p_limit?: number;
          p_from?: string;
          p_to?: string;
        };
        Returns: Json;
      };
      powerball_game_chat_send: {
        Args: {
          p_message: string;
        };
        Returns: string;
      };
      powerball_game_chat_list: {
        Args: {
          p_limit?: number;
        };
        Returns: Json;
      };
      powerball_game_chat_get: {
        Args: {
          p_id: string;
        };
        Returns: Json;
      };
      powerball_game_chat_list_admin: {
        Args: {
          p_user_id: string;
          p_limit?: number;
          p_from?: string;
          p_to?: string;
        };
        Returns: Json;
      };
      gift_buy: {
        Args: {
          p_gift_id: string;
          p_quantity: number;
        };
        Returns: string;
      };
      gift_sell: {
        Args: {
          p_gift_id: string;
          p_quantity: number;
        };
        Returns: string;
      };
      get_server_time: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      increment_notice_view: {
        Args: {
          p_notice_id: string;
        };
        Returns: number;
      };
      chat_mark_read: {
        Args: {
          p_room_id: string;
          p_reader_type: string;
        };
        Returns: null;
      };
      chat_send_gift_profile: {
        Args: {
          p_room_id: string;
          p_gift_id: string;
          p_quantity: number;
        };
        Returns: Json;
      };
      chat_send_gift_user: {
        Args: {
          p_room_id: string;
          p_gift_id: string;
          p_quantity: number;
        };
        Returns: Json;
      };
      chat_send_message: {
        Args: {
          p_room_id: string;
          p_sender_type: string;
          p_content: string;
          p_message_type: string;
          p_gift_id: string | null;
          p_gift_quantity: number | null;
        };
        Returns: string;
      };
      check_phone_duplicate: {
        Args: {
          p_phone: string;
        };
        Returns: boolean;
      };
      create_or_get_chat_room: {
        Args: {
          p_profile_id: string;
        };
        Returns: Json;
      };
      place_bet: {
        Args: {
          p_user_id: string;
          p_round_id: string;
          p_bet_type: string;
          p_amount: number;
          p_odds: number;
        };
        Returns: string;
      };
      update_chat_profile_gift_stats: {
        Args: {
          p_room_id: string;
          p_delta_count: number;
          p_delta_value: number;
        };
        Returns: null;
      };

      update_chat_room_gift_stats: {
        Args: {
          p_room_id: string;
          p_sender_type: string;
          p_delta_count: number;
          p_delta_value: number;
        };
        Returns: null;
      };
      get_session_timeout: {
        Args: {
          p_role?: string;
        };
        Returns: number;
      };
      update_admin_last_active: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
