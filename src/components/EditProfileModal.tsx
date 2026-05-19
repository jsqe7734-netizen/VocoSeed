import { useState } from 'react';
import { X, Camera, User, Check, AlertCircle, Loader2 } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { nickname: string; avatar: string }) => void;
  initialNickname: string;
  initialAvatar: string;
}

export default function EditProfileModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialNickname,
  initialAvatar 
}: EditProfileModalProps) {
  const [nickname, setNickname] = useState(initialNickname);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarOptions = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=vocoseed',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=creative1',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=creative2',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=creative3',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=creative4',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=creative5',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=creative6',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=creative7',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=creative8',
  ];

  const handleSave = async () => {
    if (!nickname.trim()) {
      setError('昵称不能为空');
      return;
    }

    if (nickname.length > 20) {
      setError('昵称不能超过20个字符');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 模拟保存
      await new Promise(resolve => setTimeout(resolve, 800));
      onSave({ nickname: nickname.trim(), avatar });
      onClose();
    } catch (err) {
      setError('保存失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-[400px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">编辑资料</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Avatar Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                头像
              </label>
              <div className="grid grid-cols-5 gap-3">
                {avatarOptions.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setAvatar(url)}
                    className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      avatar === url
                        ? 'border-primary shadow-lg scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`头像 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Camera size={14} />
                <span>点击选择头像</span>
              </div>
            </div>

            {/* Avatar Preview */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden">
                  <img
                    src={avatar}
                    alt="头像预览"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Camera size={16} className="text-white" />
                </div>
              </div>
            </div>

            {/* Nickname Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                昵称
              </label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setError(null);
                  }}
                  placeholder="给自己起个昵称"
                  maxLength={20}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-primary focus:bg-white transition-colors"
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{nickname.length}/20 字符</span>
                {error && (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {error}
                  </span>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">设置建议</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 使用真实昵称方便记忆</li>
                <li>• 避免使用特殊字符</li>
                <li>• 昵称将显示在你的创意卡片上</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              isLoading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary to-indigo-600 text-white hover:opacity-90'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Check size={18} />
                <span>保存</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
