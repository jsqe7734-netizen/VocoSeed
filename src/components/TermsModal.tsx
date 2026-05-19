import { X } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
}

const TERMS_CONTENT = `# 用户服务协议

## 1. 服务条款的接受

欢迎使用 Vocoseed 服务。本协议规定了您使用我们服务的权利和义务。

## 2. 用户账号

您需要注册一个账号才能使用我们的服务。您需要提供准确的注册信息。

## 3. 使用规则

- 您必须年满18岁才能使用本服务
- 您不得使用本服务进行非法活动
- 您不得侵犯他人的知识产权

## 4. 隐私政策

我们重视您的隐私。请查看我们的隐私政策了解详情。

## 5. 服务变更

我们保留随时变更服务的权利。

## 6. 免责声明

本服务仅供参考，不构成任何专业建议。

## 7. 协议修改

我们可能随时修改本协议，请定期查看更新。`;

const PRIVACY_CONTENT = `# 隐私政策

## 1. 信息收集

我们收集以下信息：

- 您的注册信息（邮箱、昵称等）
- 您使用服务的行为数据
- 设备信息和日志

## 2. 信息使用

我们使用收集的信息来：

- 提供和改进服务
- 个性化您的体验
- 发送重要通知
- 进行安全监控

## 3. 信息共享

我们不会向第三方出售您的个人信息，但可能会在以下情况下共享：

- 法律要求
- 保护我们的权利
- 服务提供商（签署保密协议）

## 4. 数据安全

我们采取合理的安全措施保护您的数据，但无法保证绝对安全。

## 5. 您的权利

您有权访问、更正或删除您的个人信息。

## 6. 政策变更

我们可能随时更新本政策，请定期查看。`;

export default function TermsModal({ isOpen, onClose, type }: TermsModalProps) {
  if (!isOpen) return null;

  const content = type === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT;
  const title = type === 'terms' ? '用户服务协议' : '隐私政策';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-xl animate-scale-in">
        <div className="sticky top-0 bg-surface border-b border-surface-light px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-light rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="prose prose-invert max-w-none">
            {content.split('\n').map((line, index) => {
              if (line.startsWith('## ')) {
                return <h2 key={index} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
              }
              if (line.startsWith('# ')) {
                return <h1 key={index} className="text-xl font-bold mb-4">{line.slice(2)}</h1>;
              }
              if (line.startsWith('- ')) {
                return <li key={index} className="ml-4 mb-1">{line.slice(2)}</li>;
              }
              return <p key={index} className="mb-2 text-sm leading-relaxed">{line}</p>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
