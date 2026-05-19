import { supabase } from '../../config/supabase';
import type { Idea, Message, SearchResult } from '../../data/types';

// Idea 相关服务
export const ideaService = {
  // 获取所有 Idea
  async getAllIdeas(): Promise<Idea[]> {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('ideas')
      .select(`
        *,
        messages (
          id,
          role,
          content,
          message_type,
          image_url,
          created_at
        ),
        search_results (
          id,
          result_type,
          title,
          source,
          summary,
          url,
          cited,
          year
        )
      `)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    // 转换数据格式
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      transcript: item.transcript || '',
      status: item.status,
      progress: item.progress,
      keywords: item.keywords || [],
      createdAt: new Date(item.created_at).getTime(),
      updatedAt: new Date(item.updated_at).getTime(),
      messages: (item.messages || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        type: msg.message_type,
        imageUrl: msg.image_url,
        timestamp: new Date(msg.created_at).getTime(),
      })),
      searchResults: (item.search_results || []).map((result: any) => ({
        id: result.id,
        type: result.result_type,
        title: result.title,
        source: result.source,
        summary: result.summary,
        url: result.url,
        cited: result.cited,
        year: result.year,
      })),
    }));
  },

  // 获取单个 Idea
  async getIdeaById(id: string): Promise<Idea | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('ideas')
      .select(`
        *,
        messages (
          id,
          role,
          content,
          message_type,
          image_url,
          created_at
        ),
        search_results (
          id,
          result_type,
          title,
          source,
          summary,
          url,
          cited,
          year
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: data.id,
      title: data.title,
      transcript: data.transcript || '',
      status: data.status,
      progress: data.progress,
      keywords: data.keywords || [],
      createdAt: new Date(data.created_at).getTime(),
      updatedAt: new Date(data.updated_at).getTime(),
      messages: (data.messages || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        type: msg.message_type,
        imageUrl: msg.image_url,
        timestamp: new Date(msg.created_at).getTime(),
      })),
      searchResults: (data.search_results || []).map((result: any) => ({
        id: result.id,
        type: result.result_type,
        title: result.title,
        source: result.source,
        summary: result.summary,
        url: result.url,
        cited: result.cited,
        year: result.year,
      })),
    };
  },

  // 创建新 Idea
  async createIdea(idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'searchResults'>): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('ideas')
      .insert({
        user_id: userData.user!.id,
        title: idea.title,
        transcript: idea.transcript,
        status: idea.status,
        progress: idea.progress,
        keywords: idea.keywords,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  // 更新 Idea
  async updateIdea(id: string, updates: Partial<Idea>): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('ideas')
      .update({
        title: updates.title,
        transcript: updates.transcript,
        status: updates.status,
        progress: updates.progress,
        keywords: updates.keywords,
      })
      .eq('id', id);

    if (error) throw error;
  },

  // 删除 Idea
  async deleteIdea(id: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 添加消息
  async addMessage(ideaId: string, message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        idea_id: ideaId,
        role: message.role,
        content: message.content,
        message_type: message.type || 'text',
        image_url: message.imageUrl,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  // 批量添加消息
  async addMessages(ideaId: string, messages: Omit<Message, 'id' | 'timestamp'>[]): Promise<string[]> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('messages')
      .insert(
        messages.map(msg => ({
          idea_id: ideaId,
          role: msg.role,
          content: msg.content,
          message_type: msg.type || 'text',
          image_url: msg.imageUrl,
        }))
      )
      .select('id');

    if (error) throw error;
    return data.map(item => item.id);
  },

  // 添加搜索结果
  async addSearchResult(ideaId: string, searchResult: Omit<SearchResult, 'id'>): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('search_results')
      .insert({
        idea_id: ideaId,
        result_type: searchResult.type,
        title: searchResult.title,
        source: searchResult.source,
        summary: searchResult.summary,
        url: searchResult.url,
        cited: searchResult.cited,
        year: searchResult.year,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  },

  // 批量添加搜索结果
  async addSearchResults(ideaId: string, searchResults: Omit<SearchResult, 'id'>[]): Promise<string[]> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('search_results')
      .insert(
        searchResults.map(result => ({
          idea_id: ideaId,
          result_type: result.type,
          title: result.title,
          source: result.source,
          summary: result.summary,
          url: result.url,
          cited: result.cited,
          year: result.year,
        }))
      )
      .select('id');

    if (error) throw error;
    return data.map(item => item.id);
  },

  // 订阅 Idea 实时更新
  subscribeToIdeas(callback: (payload: any) => void) {
    if (!supabase) {
      return { unsubscribe: () => {} };
    }
    return supabase
      .channel('public:ideas')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ideas',
      }, callback)
      .subscribe();
  },
};
