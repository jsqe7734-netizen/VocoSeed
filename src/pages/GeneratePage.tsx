import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/useApp';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { openaiService, SYSTEM_PROMPTS } from '../services/openai';
import type { Idea } from '../data/types';
import { 
  Presentation, BarChart3, Lightbulb, 
  Download, Copy, Check, Loader2,
  Brain, AlertCircle
} from 'lucide-react';
import { cn } from '../utils/helpers';

type GenerationType = 'ppt' | 'business' | 'analysis' | 'summary';

interface GenerationOption {
  id: GenerationType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const generationOptions: GenerationOption[] = [
  {
    id: 'ppt',
    title: 'PPT 大纲',
    description: '生成演示文稿结构和建议内容',
    icon: <Presentation size={24} />,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'business',
    title: '商业计划',
    description: '生成完整的商业计划书框架',
    icon: <BarChart3 size={24} />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'analysis',
    title: '深度分析',
    description: 'SWOT、市场、竞品等多维度分析',
    icon: <Brain size={24} />,
    color: 'from-amber-500 to-orange-500',
  },
  {
    id: 'summary',
    title: '创意摘要',
    description: '一键生成简洁的创意总结',
    icon: <Lightbulb size={24} />,
    color: 'from-emerald-500 to-teal-500',
  },
];

export default function GeneratePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [selectedType, setSelectedType] = useState<GenerationType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentIdea = state.currentIdea;

  const handleGenerate = async () => {
    if (!currentIdea || !selectedType || !openaiService.isConfigured()) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedContent(null);

    try {
      const prompt = buildPrompt(currentIdea, selectedType);
      
      const response = await openaiService.chat([
        { role: 'system', content: SYSTEM_PROMPTS.assistant },
        { role: 'user', content: prompt },
      ]);

      setGeneratedContent(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    
    try {
      await navigator.clipboard.writeText(generatedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleExport = async () => {
    if (!currentIdea || !generatedContent) return;

    // 将生成的内容添加到搜索结果
    const exportContent = `# ${currentIdea.title}\n\n## ${getTypeTitle(selectedType!)}\n\n${generatedContent}\n\n---\n原始想法：${currentIdea.transcript}`;
    
    // 创建下载
    const blob = new Blob([exportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentIdea.title.slice(0, 15)}_${selectedType}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportToIdea = () => {
    if (!currentIdea || !generatedContent) return;

    // 更新创意状态
    dispatch({
      type: 'UPDATE_IDEAS',
      payload: { 
        ...currentIdea, 
        status: 'completed',
        progress: 100,
      },
    });

    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        title="生成内容" 
        showBack 
        rightAction={
          generatedContent && (
            <button
              onClick={() => {
                setSelectedType(null);
                setGeneratedContent(null);
              }}
              className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-full transition-colors"
            >
              重新生成
            </button>
          )
        }
      />

      <main className="flex-1 overflow-y-auto pb-32">
        {!currentIdea ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-slate-500" />
            </div>
            <h3 className="font-medium text-lg mb-2">请先选择一个创意</h3>
            <p className="text-slate-400 text-sm mb-6">
              在首页或历史记录中选择一个创意来生成内容
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              前往首页
            </button>
          </div>
        ) : !openaiService.isConfigured() ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-amber-400" />
            </div>
            <h3 className="font-medium text-lg mb-2">需要配置 API</h3>
            <p className="text-slate-400 text-sm mb-6">
              请先在设置页面配置 OpenAI API Key
            </p>
            <button
              onClick={() => navigate('/settings')}
              className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
            >
              去设置
            </button>
          </div>
        ) : !generatedContent ? (
          <>
            {/* Current Idea Preview */}
            <div className="px-4 py-4 bg-surface/50 border-b border-surface-light">
              <p className="text-xs text-slate-500 mb-1">当前创意</p>
              <p className="font-medium">{currentIdea.title}</p>
              <p className="text-sm text-slate-400 mt-1 line-clamp-2">{currentIdea.transcript}</p>
            </div>

            {/* Generation Options */}
            <div className="p-4">
              <h3 className="font-display font-semibold mb-4">选择生成类型</h3>
              <div className="grid grid-cols-2 gap-3">
                {generationOptions.map(option => (
                  <button
                    key={option.id}
                    onClick={() => setSelectedType(option.id)}
                    className={cn(
                      'p-4 rounded-2xl border text-left transition-all',
                      selectedType === option.id
                        ? 'border-primary bg-primary/10'
                        : 'border-surface-light bg-surface hover:border-surface-light/80'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl bg-gradient-to-br mb-3 flex items-center justify-center text-white',
                      option.color
                    )}>
                      {option.icon}
                    </div>
                    <h4 className="font-medium mb-1">{option.title}</h4>
                    <p className="text-xs text-slate-400">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="px-4">
              <button
                onClick={handleGenerate}
                disabled={!selectedType || isGenerating}
                className={cn(
                  'w-full py-4 rounded-2xl font-semibold text-white transition-all flex items-center justify-center gap-2',
                  selectedType && !isGenerating
                    ? 'bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90'
                    : 'bg-surface-light cursor-not-allowed'
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Brain size={20} />
                    生成 {selectedType ? getTypeTitle(selectedType) : ''}
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mx-4 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </>
        ) : (
          <div className="p-4">
            {/* Success Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <Check size={16} className="text-green-400" />
              </div>
              <span className="font-medium">生成完成</span>
            </div>

            {/* Generated Content */}
            <div className="bg-surface border border-surface-light rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold flex items-center gap-2">
                  {selectedType && (
                    <span className={cn(
                      'w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-sm',
                      generationOptions.find(o => o.id === selectedType)?.color
                    )}>
                      {generationOptions.find(o => o.id === selectedType)?.icon}
                    </span>
                  )}
                  {getTypeTitle(selectedType!)}
                </h3>
              </div>
              
              <div className="prose prose-sm prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-300 bg-background rounded-xl p-4 font-sans">
                  {generatedContent}
                </pre>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-surface-light rounded-xl hover:bg-surface-light transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={18} className="text-green-400" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    复制
                  </>
                )}
              </button>
              <button
                onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-surface-light rounded-xl hover:bg-surface-light transition-colors"
              >
                <Download size={18} />
                导出
              </button>
              <button
                onClick={handleExportToIdea}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-indigo-600 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                完成
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

// Helper functions
function getTypeTitle(type: GenerationType): string {
  const titles: Record<GenerationType, string> = {
    ppt: 'PPT 大纲',
    business: '商业计划',
    analysis: '深度分析',
    summary: '创意摘要',
  };
  return titles[type];
}

function buildPrompt(idea: Idea, type: GenerationType): string {
  const basePrompt = `基于以下创意，生成相应的内容：

创意标题：${idea.title}
原始想法：${idea.transcript}
关键词：${idea.keywords.join('、')}`;

  const typePrompts: Record<GenerationType, string> = {
    ppt: `请生成一个专业的 PPT 大纲，包括：
1. 封面标题和副标题
2. 目录结构
3. 每个章节的标题和简要内容建议
4. 结束页

请用 Markdown 格式输出，使用 ## 作为标题，- 作为列表项。`,

    business: `请生成一份完整的商业计划书框架，包括：
1. 执行摘要
2. 问题与痛点
3. 解决方案
4. 目标市场
5. 商业模式
6. 竞争优势
7. 营销策略
8. 团队介绍
9. 财务预测
10. 融资计划

请用 Markdown 格式详细输出，每个部分要有具体的内容建议。`,

    analysis: `请对这个创意进行多维度的深度分析：
1. SWOT 分析（优势、劣势、机会、威胁）
2. 目标用户画像
3. 市场规模估算
4. 竞争格局分析
5. 风险与挑战
6. 成功关键因素

请用 Markdown 格式，条理清晰地输出。`,

    summary: `请用简洁清晰的语言，总结这个创意的核心要点，包括：
1. 一句话概括（不超过30字）
2. 核心价值主张
3. 主要特点（3-5点）
4. 适合人群

用 Markdown 格式输出，便于快速阅读。`,
  };

  return basePrompt + '\n\n' + typePrompts[type];
}
