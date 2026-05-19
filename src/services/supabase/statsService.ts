import { supabase } from '../../config/supabase';

// 统计服务
export const statsService = {
  // 获取用户统计信息
  async getUserStats() {
    if (!supabase) {
      return {
        recordings_this_month: 0,
        recordings_limit: 10,
        searches_today: 0,
        searches_limit: 5,
        total_ideas: 0,
        total_conversations: 0,
        streak: 1,
      };
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', userData.user!.id)
      .single();

    if (error) throw error;
    return data;
  },

  // 增加录音计数
  async incrementRecordingCount() {
    if (!supabase) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('usage_stats')
      .select('recordings_this_month, recordings_limit, total_ideas')
      .eq('user_id', userData.user!.id)
      .single();

    if (error) throw error;

    // 检查是否超限
    if (data.recordings_this_month >= data.recordings_limit) {
      throw new Error('本月录音次数已达上限');
    }

    const { error: updateError } = await supabase
      .from('usage_stats')
      .update({
        recordings_this_month: data.recordings_this_month + 1,
        total_ideas: data.total_ideas + 1,
      })
      .eq('user_id', userData.user!.id);

    if (updateError) throw updateError;
  },

  // 增加搜索计数
  async incrementSearchCount() {
    if (!supabase) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('usage_stats')
      .select('searches_today, searches_limit')
      .eq('user_id', userData.user!.id)
      .single();

    if (error) throw error;

    // 检查是否超限
    if (data.searches_today >= data.searches_limit) {
      throw new Error('今日搜索次数已达上限');
    }

    const { error: updateError } = await supabase
      .from('usage_stats')
      .update({
        searches_today: data.searches_today + 1,
      })
      .eq('user_id', userData.user!.id);

    if (updateError) throw updateError;
  },

  // 增加对话计数
  async incrementConversationCount() {
    if (!supabase) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { error } = await supabase.rpc('increment_conversation_count', {
      user_id_param: userData.user!.id,
    });

    if (error) {
      // 如果 RPC 不存在，尝试直接更新
      console.warn('RPC increment_conversation_count not available:', error);
    }
  },

  // 更新连续登录天数
  async updateStreak() {
    if (!supabase) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('usage_stats')
      .select('streak, last_active_date')
      .eq('user_id', userData.user!.id)
      .single();

    if (error) throw error;

    const today = new Date().toISOString().split('T')[0];
    const lastActive = data.last_active_date;

    // 如果今天已经登录过，不需要更新
    if (lastActive === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // 如果昨天登录过，连续天数+1，否则重置为1
    const newStreak = lastActive === yesterdayStr ? data.streak + 1 : 1;

    const { error: updateError } = await supabase
      .from('usage_stats')
      .update({
        streak: newStreak,
        last_active_date: today,
      })
      .eq('user_id', userData.user!.id);

    if (updateError) throw updateError;
  },

  // 重置每日搜索计数（可以在服务器端定时任务执行）
  async resetDailySearches() {
    if (!supabase) return;
    const { error } = await supabase.rpc('reset_daily_searches');
    if (error) {
      console.warn('RPC reset_daily_searches not available:', error);
    }
  },

  // 重置每月录音计数
  async resetMonthlyRecordings() {
    if (!supabase) return;
    const { error } = await supabase.rpc('reset_monthly_recordings');
    if (error) {
      console.warn('RPC reset_monthly_recordings not available:', error);
    }
  },
};
