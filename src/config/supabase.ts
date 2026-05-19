import { createClient } from '@supabase/supabase-js';

// 从环境变量中获取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 检查是否配置了 Supabase
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// 仅在配置了时才创建客户端
let supabaseInstance = null;

if (isSupabaseConfigured) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

// 导出一个可以安全使用的 supabase 对象
export const supabase = supabaseInstance;

// 导出类型辅助函数
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          nickname: string | null;
          avatar_url: string | null;
          member_type: 'free' | 'pro' | 'team';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nickname?: string | null;
          avatar_url?: string | null;
          member_type?: 'free' | 'pro' | 'team';
        };
        Update: {
          id?: string;
          email?: string;
          nickname?: string | null;
          avatar_url?: string | null;
          member_type?: 'free' | 'pro' | 'team';
        };
      };
      ideas: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          transcript: string | null;
          status: 'recording' | 'chatting' | 'searching' | 'generating' | 'completed';
          progress: number;
          keywords: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          transcript?: string | null;
          status?: 'recording' | 'chatting' | 'searching' | 'generating' | 'completed';
          progress?: number;
          keywords?: string[];
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          transcript?: string | null;
          status?: 'recording' | 'chatting' | 'searching' | 'generating' | 'completed';
          progress?: number;
          keywords?: string[];
        };
      };
      messages: {
        Row: {
          id: string;
          idea_id: string;
          role: 'user' | 'ai' | 'system';
          content: string;
          message_type: 'text' | 'image';
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          role: 'user' | 'ai' | 'system';
          content: string;
          message_type?: 'text' | 'image';
          image_url?: string | null;
        };
        Update: {
          id?: string;
          idea_id?: string;
          role?: 'user' | 'ai' | 'system';
          content?: string;
          message_type?: 'text' | 'image';
          image_url?: string | null;
        };
      };
      search_results: {
        Row: {
          id: string;
          idea_id: string;
          result_type: 'patent' | 'paper' | 'product' | 'report';
          title: string;
          source: string | null;
          summary: string | null;
          url: string | null;
          cited: number | null;
          year: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          result_type: 'patent' | 'paper' | 'product' | 'report';
          title: string;
          source?: string | null;
          summary?: string | null;
          url?: string | null;
          cited?: number | null;
          year?: number | null;
        };
        Update: {
          id?: string;
          idea_id?: string;
          result_type?: 'patent' | 'paper' | 'product' | 'report';
          title?: string;
          source?: string | null;
          summary?: string | null;
          url?: string | null;
          cited?: number | null;
          year?: number | null;
        };
      };
      usage_stats: {
        Row: {
          id: string;
          user_id: string;
          recordings_this_month: number;
          recordings_limit: number;
          searches_today: number;
          searches_limit: number;
          total_ideas: number;
          total_conversations: number;
          streak: number;
          last_active_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recordings_this_month?: number;
          recordings_limit?: number;
          searches_today?: number;
          searches_limit?: number;
          total_ideas?: number;
          total_conversations?: number;
          streak?: number;
          last_active_date?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recordings_this_month?: number;
          recordings_limit?: number;
          searches_today?: number;
          searches_limit?: number;
          total_ideas?: number;
          total_conversations?: number;
          streak?: number;
          last_active_date?: string;
        };
      };
    };
  };
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
