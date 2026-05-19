import { useState } from 'react';
import { 
  Mic, Sparkles, Search, FileText, ChevronRight, ChevronLeft,
  Check, X, Zap, Brain, Lightbulb, ArrowRight
} from 'lucide-react';
import { cn } from '../utils/helpers';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '欢迎使用 VocoSeed',
    description: '让你的创意从想法变成现实。VocoSeed 是一个 AI 驱动的创意孵化工具，帮助你深入思考、完善和实现你的想法。',
    icon: <Sparkles className="w-12 h-12 text-primary" />,
  },
  {
    id: 'record',
    title: '语音录制创意',
    description: '点击麦克风，用语音说出你的想法。我们的 AI 会实时转写你的话，让你专注于思考，而不是打字。',
    icon: <Mic className="w-12 h-12 text-red-400" />,
    highlight: 'recording',
  },
  {
    id: 'chat',
    title: 'AI 对话深入思考',
    description: 'VocoSeed 的 AI 教练会通过提问，引导你深入思考你的想法，发现盲点，完善细节。',
    icon: <Brain className="w-12 h-12 text-secondary" />,
    highlight: 'chat',
  },
  {
    id: 'search',
    title: '智能检索信息',
    description: '我们会自动检索相关的专利、论文、产品和市场报告，为你的想法提供参考。',
    icon: <Search className="w-12 h-12 text-amber-400" />,
    highlight: 'search',
  },
  {
    id: 'export',
    title: '生成完整方案',
    description: '将你的想法整理成完整的文档，包括痛点分析、目标用户、核心功能和下一步计划。',
    icon: <FileText className="w-12 h-12 text-emerald-400" />,
    highlight: 'export',
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const goNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const goPrev = () => {
    if (!isFirstStep) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('vocoseed_onboarding_complete', 'true');
    onComplete();
  };

  const skipOnboarding = () => {
    handleComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌱</span>
          <span className="font-display font-bold text-lg">VocoSeed</span>
        </div>
        <button
          onClick={skipOnboarding}
          className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          跳过
        </button>
      </div>

      {/* Progress */}
      <div className="px-4 mb-4">
        <div className="flex gap-1.5">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'h-1 flex-1 rounded-full transition-all duration-300',
                index <= currentStep ? 'bg-primary' : 'bg-surface-light'
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className={cn(
          'text-center max-w-md transition-all duration-300',
          isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        )}>
          {/* Icon */}
          <div className="w-24 h-24 mx-auto mb-8 bg-surface rounded-3xl flex items-center justify-center animate-float">
            {step.icon}
          </div>

          {/* Title */}
          <h2 className="font-display text-2xl font-bold mb-4">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-slate-400 leading-relaxed">
            {step.description}
          </p>

          {/* Feature highlight */}
          {step.highlight && (
            <div className="mt-6 p-4 bg-surface/50 border border-surface-light rounded-2xl">
              <FeatureHighlight type={step.highlight} />
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goPrev}
            disabled={isFirstStep}
            className={cn(
              'flex items-center gap-1 px-4 py-2 rounded-full transition-colors',
              isFirstStep 
                ? 'text-slate-600 cursor-not-allowed' 
                : 'text-slate-400 hover:text-white'
            )}
          >
            <ChevronLeft size={18} />
            上一步
          </button>

          <div className="flex gap-1">
            {steps.map((s, index) => (
              <button
                key={s.id}
                onClick={() => {
                  setIsAnimating(true);
                  setTimeout(() => {
                    setCurrentStep(index);
                    setIsAnimating(false);
                  }, 200);
                }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === currentStep 
                    ? 'bg-primary w-6' 
                    : index < currentStep 
                      ? 'bg-primary/50' 
                      : 'bg-surface-light'
                )}
              />
            ))}
          </div>

          <button
            onClick={goNext}
            className="flex items-center gap-1 px-4 py-2 text-primary hover:text-primary/80 transition-colors"
          >
            {isLastStep ? '开始使用' : '下一步'}
            <ChevronRight size={18} />
          </button>
        </div>

        {/* CTA Button */}
        <button
          onClick={goNext}
          className="w-full py-4 bg-gradient-to-r from-primary to-indigo-600 rounded-2xl font-semibold text-white hover:opacity-90 transition-opacity touch-scale"
        >
          {isLastStep ? (
            <span className="flex items-center justify-center gap-2">
              开始探索
              <ArrowRight size={20} />
            </span>
          ) : (
            '继续'
          )}
        </button>
      </div>
    </div>
  );
}

// Feature highlight component
function FeatureHighlight({ type }: { type: string }) {
  switch (type) {
    case 'recording':
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <Mic size={18} className="text-red-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">按住说话，松开发送</p>
            <p className="text-xs text-slate-500">支持实时转写</p>
          </div>
        </div>
      );
    case 'chat':
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center">
            <Zap size={18} className="text-secondary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">AI 教练引导深入思考</p>
            <p className="text-xs text-slate-500">提出有洞察力的问题</p>
          </div>
        </div>
      );
    case 'search':
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
            <Search size={18} className="text-amber-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">一键检索相关信息</p>
            <p className="text-xs text-slate-500">专利、论文、产品、报告</p>
          </div>
        </div>
      );
    case 'export':
      return (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <FileText size={18} className="text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">导出完整创意方案</p>
            <p className="text-xs text-slate-500">支持 Markdown 和 PDF</p>
          </div>
        </div>
      );
    default:
      return null;
  }
}

// Tip component for showing tips in the app
interface TipProps {
  type: 'tip' | 'success' | 'warning';
  title: string;
  message: string;
  onClose?: () => void;
}

export function TipCard({ type, title, message, onClose }: TipProps) {
  const icons = {
    tip: <Lightbulb size={18} className="text-amber-400" />,
    success: <Check size={18} className="text-green-400" />,
    warning: <Zap size={18} className="text-red-400" />,
  };

  const bgColors = {
    tip: 'bg-amber-500/10 border-amber-500/30',
    success: 'bg-green-500/10 border-green-500/30',
    warning: 'bg-red-500/10 border-red-500/30',
  };

  return (
    <div className={cn(
      'flex items-start gap-3 p-4 rounded-xl border animate-slide-up',
      bgColors[type]
    )}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-xs text-slate-400 mt-1">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 text-slate-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
