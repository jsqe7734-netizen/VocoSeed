import { supabase } from '../../config/supabase';

// 用户认证相关服务
export const authService = {
  // 注册新用户
  async signUp(email: string, password: string, nickname?: string) {
    if (!supabase) throw new Error('Supabase not configured');
    console.log('[Auth] Attempting to sign up:', { email, nickname });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname || email.split('@')[0],
        },
      },
    });

    if (error) {
      console.error('[Auth] Sign up error:', error);
      throw error;
    }
    console.log('[Auth] Sign up successful:', data);
    return data;
  },

  // 登录用户
  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // 发送 OTP 验证码到邮箱
  async signInWithOTP(email: string) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) throw error;
    return data;
  },

  // 验证 OTP 并登录
  async verifyOTP(email: string, token: string) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) throw error;
    return data;
  },

  // 使用手机号+验证码登录
  async signInWithPhone(phone: string) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });

    if (error) throw error;
    return data;
  },

  // 验证手机验证码
  async verifyPhoneOTP(phone: string, token: string) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) throw error;
    return data;
  },

  // 微信登录
  async signInWithWeChat() {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'wechat' as any,
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    return data;
  },

  // 登出用户
  async signOut() {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 获取当前会话
  async getSession() {
    if (!supabase) return { data: { session: null } };
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { data };
  },

  // 获取当前用户
  async getCurrentUser() {
    if (!supabase) return { data: { user: null } };
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data;
  },

  // 监听认证状态变化
  onAuthStateChange(callback: (session: any) => void) {
    if (!supabase) {
      return { data: { subscription: null }, unsubscribe: () => {} };
    }
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },

  // 重置密码
  async resetPassword(email: string) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  },

  // 更新密码
  async updatePassword(newPassword: string) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  },

  // 更新用户资料
  async updateProfile(data: { email?: string; nickname?: string; avatar_url?: string }) {
    if (!supabase) throw new Error('Supabase not configured');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', userData.user!.id)
      .select()
      .single();

    if (error) throw error;
    return profile;
  },
};
