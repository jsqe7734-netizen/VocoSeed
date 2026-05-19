import { useState, useEffect } from 'react';
import { X, Phone, MessageCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PhoneLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phone: string) => void;
}

export default function PhoneLoginModal({ isOpen, onClose, onSuccess }: PhoneLoginModalProps) {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('input');
      setPhone('');
      setCode('');
      setCountdown(0);
      setIsLoading(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (phone.length !== 11) {
      setError('请输入正确的11位手机号');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 模拟发送验证码
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 实际项目中，这里应该调用后端 API 发送短信
      // await smsService.sendVerificationCode(phone);
      
      setStep('verify');
      setCountdown(60);
    } catch (err) {
      setError('发送验证码失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('请输入6位验证码');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 模拟验证
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 实际项目中，这里应该调用后端 API 验证验证码
      // const result = await smsService.verifyCode(phone, code);
      // if (!result.valid) throw new Error('验证码错误');
      
      onSuccess(phone);
      onClose();
    } catch (err) {
      setError('验证码错误，请重新输入');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-[380px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">手机号登录</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' && (
            <div className="space-y-4">
              {/* 手机号输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  手机号
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                      setError(null);
                    }}
                    placeholder="请输入手机号"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-primary focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* 发送按钮 */}
              <button
                onClick={handleSendCode}
                disabled={isLoading || phone.length !== 11}
                className={cn(
                  'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                  isLoading || phone.length !== 11
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-indigo-600 text-white hover:opacity-90'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>发送中...</span>
                  </>
                ) : (
                  <>
                    <MessageCircle size={18} />
                    <span>发送验证码</span>
                  </>
                )}
              </button>

              {/* 隐私提示 */}
              <p className="text-xs text-gray-400 text-center">
                点击发送即表示同意
                <button className="text-primary hover:underline mx-1">《用户服务协议》</button>
                和
                <button className="text-primary hover:underline mx-1">《隐私政策》</button>
              </p>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              {/* 成功提示 */}
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-green-700">
                <CheckCircle size={18} />
                <span>验证码已发送至 {phone}</span>
              </div>

              {/* 验证码输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  验证码
                </label>
                <div className="relative">
                  <MessageCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                      setError(null);
                    }}
                    placeholder="请输入6位验证码"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base tracking-widest text-center focus:outline-none focus:border-primary focus:bg-white transition-colors"
                    maxLength={6}
                  />
                </div>
              </div>

              {/* 倒计时和重新发送 */}
              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => setStep('input')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  修改手机号
                </button>
                <button
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isLoading}
                  className={cn(
                    'transition-colors',
                    countdown > 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-primary hover:text-primary/80'
                  )}
                >
                  {countdown > 0 ? `${countdown}s 后重新发送` : '重新发送'}
                </button>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* 验证按钮 */}
              <button
                onClick={handleVerify}
                disabled={isLoading || code.length !== 6}
                className={cn(
                  'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                  isLoading || code.length !== 6
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-primary to-indigo-600 text-white hover:opacity-90'
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>验证中...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>验证并登录</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
