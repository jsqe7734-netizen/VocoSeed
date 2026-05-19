import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/useApp';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import WechatLoginModal from '../components/WechatLoginModal';
import PhoneLoginModal from '../components/PhoneLoginModal';
import TermsModal from '../components/TermsModal';
import { Eye, EyeOff, Mail, Lock, User, Check, Sparkles, Phone, MessageCircle } from 'lucide-react';
import { cn } from '../utils/helpers';
import { authService } from '../services/supabase/authService';

type AuthMode = 'login' | 'register';
type LoginMethod = 'email' | 'phone';

export default function AuthPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isWechatModalOpen, setIsWechatModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<'terms' | 'privacy' | null>(null);

  useEffect(() => {
    if (state.profile.isLoggedIn) {
      navigate('/profile');
    }
  }, [state.profile.isLoggedIn, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendVerificationCode = async () => {
    if (!phone || phone.length !== 11) {
      setError('请输入正确的11位手机号');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCountdown(60);
      alert(`验证码已发送至 ${phone}`);
    } catch {
      setError('发送验证码失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWechatLogin = () => {
    setIsWechatModalOpen(true);
  };

  const handleWechatLoginSuccess = () => {
    dispatch({
      type: 'SET_PROFILE',
      payload: {
        ...state.profile,
        isLoggedIn: true,
        nickname: '微信用户',
        memberType: 'free',
      },
    });
    navigate('/profile');
  };

  const handlePhoneLoginSuccess = (phone: string) => {
    dispatch({
      type: 'SET_PROFILE',
      payload: {
        ...state.profile,
        isLoggedIn: true,
        nickname: `用户${phone.slice(-4)}`,
        memberType: 'free',
      },
    });
    navigate('/profile');
  };

  const handlePhoneLogin = async () => {
    if (!phone || !verificationCode) {
      setError('请填写手机号和验证码');
      return;
    }

    if (phone.length !== 11) {
      setError('请输入正确的11位手机号');
      return;
    }

    if (verificationCode.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      dispatch({
        type: 'SET_PROFILE',
        payload: {
          ...state.profile,
          isLoggedIn: true,
          nickname: `用户${phone.slice(-4)}`,
          memberType: 'free',
        },
      });
      navigate('/profile');
    } catch {
      setError('登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (loginMethod === 'phone') {
      return handlePhoneLogin();
    }

    if (!email || !password) {
      setError('请填写邮箱和密码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 调用 Supabase 登录 API
      await authService.signIn(email, password);

      dispatch({
        type: 'SET_PROFILE',
        payload: {
          ...state.profile,
          isLoggedIn: true,
          email: email,
          nickname: nickname || email.split('@')[0],
          memberType: 'free',
        },
      });
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password || !nickname) {
      setError('请填写所有必填项');
      return;
    }

    if (!agreed) {
      setError('请同意用户协议');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为 6 位');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 调用 Supabase 注册 API
      await authService.signUp(email, password, nickname);

      dispatch({
        type: 'SET_PROFILE',
        payload: {
          ...state.profile,
          isLoggedIn: true,
          email: email,
          nickname: nickname,
          memberType: 'free',
        },
      });
      navigate('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={mode === 'login' ? '登录' : '注册'} showBack />

      <main className="flex-1 overflow-y-auto pb-24 px-4">
        {/* Logo */}
        <div className="flex flex-col items-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Vocoseed</h1>
          <p className="text-sm text-slate-400 mt-1">记录灵感，实现创意</p>
        </div>

        {/* 登录方式切换 */}
        {mode === 'login' && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setLoginMethod('email'); setError(null); }}
              className={cn(
                'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                loginMethod === 'email'
                  ? 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg'
                  : 'bg-surface border border-surface-light text-slate-600 hover:border-primary/50'
              )}
            >
              <Mail size={16} />
              邮箱登录
            </button>
            <button
              onClick={() => { setIsPhoneModalOpen(true); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 bg-surface border border-surface-light text-slate-600 hover:border-primary/50"
            >
              <Phone size={16} />
              手机登录
            </button>
          </div>
        )}

        {/* 手机号登录表单 */}
        {mode === 'login' && loginMethod === 'phone' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm text-slate-400 mb-2">手机号</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="请输入手机号"
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">验证码</label>
              <div className="relative">
                <MessageCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="请输入验证码"
                  className="w-full pl-11 pr-28 py-3 bg-surface border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-500"
                />
                <button
                  onClick={handleSendVerificationCode}
                  disabled={countdown > 0 || isLoading}
                  className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    countdown > 0
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90'
                  )}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 邮箱登录表单 */}
        {mode === 'login' && loginMethod === 'email' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">邮箱</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入你的邮箱"
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full pl-11 pr-12 py-3 bg-surface border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 注册表单 */}
        {mode === 'register' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">昵称</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="设置你的昵称"
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">邮箱</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="输入你的邮箱"
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="设置密码（至少6位）"
                  className="w-full pl-11 pr-12 py-3 bg-surface border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">确认密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full pl-11 pr-4 py-3 bg-surface border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex items-start gap-3">
              <button
                onClick={() => setAgreed(!agreed)}
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
                  agreed
                    ? 'bg-primary border-primary shadow-md'
                    : 'border-slate-400 hover:border-primary/50 hover:bg-primary/5'
                )}
              >
                {agreed && <Check size={14} className="text-white" />}
              </button>
              <span className="text-sm text-slate-400 leading-relaxed">
                我已阅读并同意{' '}
                <button onClick={() => setShowTermsModal('terms')} className="text-primary hover:underline">《用户服务协议》</button>
                {' '}和{' '}
                <button onClick={() => setShowTermsModal('privacy')} className="text-primary hover:underline">《隐私政策》</button>
              </span>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* 提交按钮 */}
        <button
          onClick={mode === 'login' ? handleLogin : handleRegister}
          disabled={isLoading}
          className={cn(
            'w-full py-3 bg-gradient-to-r from-primary to-indigo-600 rounded-xl font-semibold text-white transition-all',
            isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
          )}
        >
          {isLoading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
        </button>

        {/* 切换模式 */}
        <div className="text-center text-sm text-slate-400">
          {mode === 'login' ? (
            <>
              还没有账号？{' '}
              <button
                onClick={() => { setMode('register'); setError(null); }}
                className="text-primary hover:underline"
              >
                立即注册
              </button>
            </>
          ) : (
            <>
              已有账号？{' '}
              <button
                onClick={() => { setMode('login'); setError(null); }}
                className="text-primary hover:underline"
              >
                立即登录
              </button>
            </>
          )}
        </div>

        {/* 第三方登录 */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-light" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-background text-sm text-slate-500">其他登录方式</span>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleWechatLogin}
              className="flex-1 py-3 bg-white border border-gray-200 rounded-xl hover:border-green-500/50 hover:shadow-md transition-all"
            >
              <span className="text-green-500 text-sm font-medium flex items-center justify-center gap-2">
                微信登录
              </span>
            </button>
          </div>
        </div>
      </main>

      <BottomNav />

      {/* 微信登录弹窗 */}
      <WechatLoginModal
        isOpen={isWechatModalOpen}
        onClose={() => setIsWechatModalOpen(false)}
        onSuccess={handleWechatLoginSuccess}
      />

      {/* 手机号登录弹窗 */}
      <PhoneLoginModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onSuccess={handlePhoneLoginSuccess}
      />

      {/* 协议弹窗 */}
      <TermsModal
        isOpen={!!showTermsModal}
        onClose={() => setShowTermsModal(null)}
        type={showTermsModal || 'terms'}
      />
    </div>
  );
}
