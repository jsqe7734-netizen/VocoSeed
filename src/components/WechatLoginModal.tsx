import { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';

interface WechatLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WechatLoginModal({ isOpen, onClose, onSuccess }: WechatLoginModalProps) {
  const [step, setStep] = useState<'qrcode' | 'scanning' | 'success'>('qrcode');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setStep('qrcode');
      setCountdown(0);
      return;
    }

    // 模拟扫码流程
    const timers: ReturnType<typeof setTimeout>[] = [];

    // 2秒后显示扫描中
    timers.push(setTimeout(() => {
      setStep('scanning');
    }, 2000));

    // 5秒后显示成功
    timers.push(setTimeout(() => {
      setStep('success');
    }, 5000));

    // 6.5秒后自动关闭并登录
    timers.push(setTimeout(() => {
      onSuccess();
      onClose();
    }, 6500));

    // 二维码倒计时刷新
    timers.push(setTimeout(() => {
      setCountdown(120);
    }, 100));

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [isOpen, onSuccess, onClose]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-[360px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">微信登录</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'qrcode' && (
            <div className="flex flex-col items-center">
              {/* 二维码区域 */}
              <div className="w-48 h-48 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl flex items-center justify-center mb-4 border-2 border-dashed border-green-200">
                <div className="text-center">
                  <div className="text-6xl mb-2">📱</div>
                  <p className="text-sm text-gray-500">正在加载二维码...</p>
                </div>
              </div>
              
              {/* 二维码说明 */}
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700 mb-1">使用微信扫码登录</p>
                <p className="text-xs text-gray-400">二维码有效期 {countdown}s</p>
              </div>

              {/* 备用操作 */}
              <div className="mt-6 pt-4 border-t border-gray-100 w-full">
                <button
                  onClick={onClose}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {step === 'scanning' && (
            <div className="flex flex-col items-center">
              {/* 扫描动画 */}
              <div className="w-48 h-48 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl flex items-center justify-center mb-4 border-2 border-green-300 relative overflow-hidden">
                <div className="text-6xl animate-pulse">📱</div>
                {/* 扫描线动画 */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-b from-green-500 to-transparent animate-bounce" />
              </div>

              {/* 扫描状态 */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Loader2 size={20} className="text-green-500 animate-spin" />
                  <p className="text-sm font-medium text-gray-700">扫描成功</p>
                </div>
                <p className="text-xs text-gray-400">请在手机上确认登录</p>
              </div>

              {/* 手机图标 */}
              <div className="mt-6 flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                <span className="text-2xl">📱</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-700">等待确认</p>
                  <p className="text-xs text-gray-400">请在微信中点击"确认登录"</p>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-4">
              {/* 成功动画 */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce-in">
                <CheckCircle size={48} className="text-green-500" />
              </div>

              {/* 成功信息 */}
              <div className="text-center mb-6">
                <p className="text-lg font-semibold text-gray-900 mb-1">登录成功</p>
                <p className="text-sm text-gray-500">正在跳转...</p>
              </div>

              {/* 成功状态 */}
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm font-medium">微信授权成功</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
