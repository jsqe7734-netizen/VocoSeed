import { useState } from 'react';
import { X, Edit2, Check, AlertCircle, Loader2 } from 'lucide-react';

interface EditIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { title: string }) => void;
  initialTitle: string;
}

export default function EditIdeaModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialTitle 
}: EditIdeaModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }

    if (title.length > 100) {
      setError('标题不能超过100个字符');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onSave({ title: title.trim() });
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
      <div className="bg-white rounded-3xl shadow-2xl w-[400px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Edit2 size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-gray-900">编辑创意</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                创意标题
              </label>
              <textarea
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                }}
                placeholder="描述你的创意..."
                maxLength={100}
                rows={3}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-primary focus:bg-white transition-colors resize-none"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{title.length}/100 字符</span>
                {error && (
                  <span className="text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {error}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-amber-900 mb-2">💡 提示</h4>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• 清晰简洁的标题能帮助你快速识别创意</li>
                <li>• 建议包含创意的核心关键词</li>
                <li>• 你可以随时修改标题</li>
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
