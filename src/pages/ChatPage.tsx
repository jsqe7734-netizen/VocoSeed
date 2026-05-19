import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/useApp';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import ChatBubble, { TypingIndicator } from '../components/ChatBubble';
import VoiceRecordButton from '../components/VoiceRecordButton';
import { Send, Search, FileText, MoreVertical, Image, Loader2, Wand2, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { generateId, extractKeywords } from '../utils/helpers';
import { quickReplies, fallbackResponses } from '../data/mockData';
import type { Message } from '../data/types';
import { openaiService, SYSTEM_PROMPTS, type ChatMessage } from '../services/openai';
import { textToSpeech } from '../services/textToSpeech';
import { speechRecognition } from '../services/speechRecognition';
import { baiduSpeechRecognition } from '../services/baiduSpeechRecognition';

// Helper to get fallback response (called within event handlers, not during render)
const getRandomFallbackResponse = () => {
  const index = Math.floor(Math.random() * fallbackResponses.length);
  return fallbackResponses[index];
};

// Helper to create message with timestamp (called within event handlers)
const createUserMessage = (content: string): Message => ({
  id: generateId(),
  role: 'user',
  content,
  timestamp: Date.now(),
});

const createAiMessage = (content: string): Message => ({
  id: generateId(),
  role: 'ai',
  content,
  timestamp: Date.now(),
});

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

function ImageGenerationModal({ isOpen, onClose, onGenerate, isGenerating }: ImageModalProps) {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<'1024x1024' | '512x512' | '256x256'>('1024x1024');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    await onGenerate(prompt);
    setPrompt('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface border border-surface-light rounded-2xl w-full max-w-md p-6 animate-scale-in">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wand2 size={20} className="text-primary" />
          AI 图像生成
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">图像描述</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要生成的图像..."
              rows={4}
              className="w-full px-4 py-3 bg-background border border-surface-light rounded-xl text-sm resize-none focus:outline-none focus:border-primary placeholder-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">图像尺寸</label>
            <div className="flex gap-2">
              {(['1024x1024', '512x512', '256x256'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm border transition-colors ${
                    size === s
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-surface-light text-slate-400 hover:border-primary/50'
                  }`}
                >
                  {s.split('x')[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-surface-light rounded-xl hover:bg-surface-light transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="flex-1 py-3 bg-gradient-to-r from-primary to-indigo-600 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  生成
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoPlayTTS, setAutoPlayTTS] = useState(() => localStorage.getItem('vocoseed_auto_tts') === 'true');
  const [isAILooping, setIsAILooping] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const stateRef = useRef(state);
  const stopLoopRef = useRef(false); // 使用 ref 来跟踪停止请求（同步）
  
  // Keep stateRef updated
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Use currentIdea from state, or fallback to most recently updated idea
  const currentIdea = state.currentIdea ||
    (state.ideas.length > 0
      ? state.ideas.reduce((latest, idea) =>
          idea.updatedAt > (latest?.updatedAt || 0) ? idea : latest
        , state.ideas[0])
      : null);

  useEffect(() => {
    if (currentIdea) return;
    
    if (state.ideas.length > 0) {
      // Find the idea that's in 'chatting' status, or use the most recent one
      const chattingIdea = state.ideas.find(i => i.status === 'chatting');
      if (chattingIdea) {
        dispatch({ type: 'SET_CURRENT_IDEA', payload: chattingIdea });
      } else {
        // Use the most recently updated idea
        const latestIdea = state.ideas.reduce((latest, idea) =>
          idea.updatedAt > (latest?.updatedAt || 0) ? idea : latest
        , state.ideas[0]);
        dispatch({ type: 'SET_CURRENT_IDEA', payload: latestIdea });
      }
    }
  }, [currentIdea, state.ideas, dispatch]);

  useEffect(() => {
    if (!currentIdea && state.ideas.length === 0) {
      navigate('/');
    }
  }, [currentIdea, state.ideas.length, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentIdea?.messages]);

  // Auto-show quick replies after AI message
  const lastMessage = currentIdea?.messages[currentIdea.messages.length - 1];
  const shouldShowQuickReplies = lastMessage?.role === 'ai';
  const shouldAutoPlayTTS = autoPlayTTS && textToSpeech.getIsSupported() && lastMessage?.role === 'ai' && !lastMessage.imageUrl;

  useEffect(() => {
    if (shouldShowQuickReplies) {
      setShowQuickReplies(true);
    }
  }, [shouldShowQuickReplies]);

  useEffect(() => {
    if (shouldAutoPlayTTS && lastMessage) {
      textToSpeech.speak(lastMessage.content, {
        rate: Number(localStorage.getItem('vocoseed_tts_rate')) || 1.0,
        pitch: Number(localStorage.getItem('vocoseed_tts_pitch')) || 1.0,
      });
      setIsSpeaking(true);
    }
  }, [shouldAutoPlayTTS, lastMessage?.content]);

  // 停止朗读
  const stopSpeaking = () => {
    textToSpeech.stop();
    setIsSpeaking(false);
  };

  // 切换自动朗读
  const toggleAutoPlayTTS = () => {
    const newValue = !autoPlayTTS;
    setAutoPlayTTS(newValue);
    localStorage.setItem('vocoseed_auto_tts', String(newValue));
  };

  // AI 持续回复功能 - 修复版
  const startAILooping = async () => {
    if (isTyping || isAILooping) return;
    
    setIsAILooping(true);
    setLoopCount(0);
    stopLoopRef.current = false; // 重置停止标志
    
    // AI 引导问题列表（固定3条）
    const aiPrompts = [
      "让我进一步了解你的想法。你能具体描述一下这个创意的核心价值吗？",
      "很好！关于这个创意，你考虑过目标用户群体吗？",
      "非常棒！我还想知道，这个创意相比现有方案有什么优势？",
    ];
    
    const loop = async () => {
      // 每次循环开始前检查是否应该停止（使用同步 ref 检查）
      if (stopLoopRef.current) {
        setIsAILooping(false);
        setLoopCount(0);
        return;
      }
      
      // 达到3条后自动停止
      if (loopCount >= 3) {
        setIsAILooping(false);
        setLoopCount(0);
        stopLoopRef.current = true;
        return;
      }
      
      const prompt = aiPrompts[loopCount];
      setLoopCount(prev => prev + 1);
      
      // 添加 AI 消息
      const aiMessage = createAiMessage(prompt);
      const idea = state.currentIdea || state.ideas[0];
      if (idea) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { ideaId: idea.id, message: aiMessage },
        });
        
        const newProgress = Math.min(100, idea.progress + 10);
        dispatch({
          type: 'UPDATE_PROGRESS',
          payload: { ideaId: idea.id, progress: newProgress },
        });
        
        setShowQuickReplies(true);
      }
      
      // 等待一段时间后继续下一条（让用户有时间查看）
      await new Promise(resolve => {
        if (stopLoopRef.current) {
          resolve(null);
          return;
        }
        setTimeout(resolve, 2000);
      });
      
      // 继续下一次循环前再次检查停止标志
      if (stopLoopRef.current) {
        setIsAILooping(false);
        setLoopCount(0);
        return;
      }
      
      // 继续下一次循环
      await loop();
    };
    
    await loop();
  };

  const stopAILooping = () => {
    stopLoopRef.current = true; // 同步设置停止标志
    setIsAILooping(false);
    setLoopCount(0);
  };

  const stopRecordingServices = async () => {
    setIsRecording(false);
    const baiduConfigured = !!(import.meta.env.VITE_BAIDU_APP_ID &&
      import.meta.env.VITE_BAIDU_API_KEY &&
      import.meta.env.VITE_BAIDU_SECRET_KEY);
    if (baiduConfigured) {
      try { await baiduSpeechRecognition.stop(); } catch(e) {}
    } else {
      try { speechRecognition.stop(); } catch(e) {}
    }
  };

  const sendMessage = async (content: string) => {
    if (isRecording) {
      stopRecordingServices();
    }
    
    if (!content.trim()) return;
    
    // 从 state 获取 currentIdea（使用 state 而不是 stateRef，因为 state 是响应式的）
    const currentState = state;
    const idea = currentState.currentIdea || 
      (currentState.ideas.length > 0
        ? currentState.ideas.reduce((latest, i) =>
            i.updatedAt > (latest?.updatedAt || 0) ? i : latest
          , currentState.ideas[0])
        : null);
    
    if (!idea) {
      console.warn('[Vocoseed] No idea found, cannot send message');
      return;
    }

    const userMessage = createUserMessage(content);

    dispatch({
      type: 'ADD_MESSAGE',
      payload: { ideaId: idea.id, message: userMessage },
    });

    setInputValue('');
    setShowQuickReplies(false);

    const newProgress = Math.min(100, idea.progress + 15);
    dispatch({
      type: 'UPDATE_PROGRESS',
      payload: { ideaId: idea.id, progress: newProgress },
    });

    setIsTyping(true);

    try {
      if (openaiService.isConfigured()) {
        // 使用最新 state 构建对话历史
        const latestIdea = currentState.ideas.find(i => i.id === idea.id) || idea;
        const conversationHistory: ChatMessage[] = [
          { role: 'system', content: SYSTEM_PROMPTS.assistant },
          { role: 'user', content: `用户原始想法：${latestIdea.transcript}` },
          ...latestIdea.messages
            .filter(m => m.role === 'user' || m.role === 'ai')
            .map(m => ({
              role: (m.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
              content: m.content,
            })),
          { role: 'user' as const, content },
        ];

        const aiResponse = await openaiService.chat(conversationHistory);
        const aiMessage = createAiMessage(aiResponse);

        // 使用最新 state 中的 ideaId
        const finalIdea = currentState.ideas.find(i => i.id === idea.id);
        if (finalIdea) {
          dispatch({
            type: 'ADD_MESSAGE',
            payload: { ideaId: finalIdea.id, message: aiMessage },
          });
        } else {
          console.error('[Vocoseed] finalIdea not found! idea.id:', idea.id);
          console.error('[Vocoseed] Available ideas:', currentState.ideas.map(i => i.id));
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const aiMessage = createAiMessage(getRandomFallbackResponse());

        const finalIdea = currentState.ideas.find(i => i.id === idea.id);
        if (finalIdea) {
          dispatch({
            type: 'ADD_MESSAGE',
            payload: { ideaId: finalIdea.id, message: aiMessage },
          });
        }
      }
    } catch (error) {
      console.error('AI error:', error);
      const errorContent = `抱歉，AI 服务出现了问题：${error instanceof Error ? error.message : '未知错误'}`;
      const errorMessage = createAiMessage(errorContent);

      const finalIdea = currentState.ideas.find(i => i.id === idea.id);
      if (finalIdea) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { ideaId: finalIdea.id, message: errorMessage },
        });
      }
    } finally {
      setIsTyping(false);
    }

    // 从 stateRef 获取最新的 idea，避免覆盖已经添加的消息
    const latestIdeaForKeywords = stateRef.current.ideas.find(i => i.id === idea.id);
    if (latestIdeaForKeywords) {
      const allText = latestIdeaForKeywords.messages.map(m => m.content).join(' ') + ' ' + content;
      const keywords = extractKeywords(allText);
      if (keywords.length > 0) {
        dispatch({
          type: 'UPDATE_KEYWORDS',
          payload: { ideaId: latestIdeaForKeywords.id, keywords: [...new Set([...latestIdeaForKeywords.keywords, ...keywords])] },
        });
      }
    }
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      stopRecordingServices();
      if (inputValue.trim()) {
        sendMessage(inputValue);
      }
      return;
    }

    const speechSupported = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
    const baiduConfigured = !!(import.meta.env.VITE_BAIDU_APP_ID &&
      import.meta.env.VITE_BAIDU_API_KEY &&
      import.meta.env.VITE_BAIDU_SECRET_KEY);

    setInputValue('');

    if (baiduConfigured) {
      const permissionResult = await baiduSpeechRecognition.checkMicrophonePermission();
      if (!permissionResult.allowed) {
        alert(permissionResult.error || '无法访问麦克风');
        return;
      }
      await baiduSpeechRecognition.start({
        onInterim: (text) => setInputValue(text),
        onFinal: (text) => setInputValue(text),
        onError: () => setIsRecording(false),
        onStatusChange: (status) => setIsRecording(status === 'listening'),
      });
    } else if (speechSupported) {
      speechRecognition.start({
        onInterim: (text) => setInputValue(text),
        onFinal: (text) => setInputValue(text),
        onError: () => setIsRecording(false),
        onStatusChange: (status) => setIsRecording(status === 'listening'),
      });
    } else {
      setIsRecording(true);
      setTimeout(() => {
        setIsRecording(false);
        sendMessage('我觉得可以，这样用户会更方便');
      }, 2000);
    }
  };

  const handleGenerateSolution = () => {
    if (currentIdea) {
      dispatch({
        type: 'UPDATE_IDEAS',
        payload: { ...currentIdea, status: 'generating' },
      });
      navigate('/generate');
    }
  };

  const handleSearch = () => {
    if (currentIdea) {
      dispatch({
        type: 'UPDATE_IDEAS',
        payload: { ...currentIdea, status: 'searching' },
      });
      navigate('/search');
    }
  };

  const handleImageGenerate = async (prompt: string) => {
    if (!currentIdea || !openaiService.isConfigured()) return;

    setIsGeneratingImage(true);
    setShowImageModal(false);

    const userMessage = createUserMessage(`请求生成图像：${prompt}`);
    userMessage.type = 'text';
    dispatch({
      type: 'ADD_MESSAGE',
      payload: { ideaId: currentIdea.id, message: userMessage },
    });

    setIsTyping(true);

    try {
      const imageUrl = await openaiService.generateImage(prompt);
      const aiMessage = createAiMessage('图像已生成！');
      aiMessage.type = 'image';
      aiMessage.imageUrl = imageUrl;
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { ideaId: currentIdea.id, message: aiMessage },
      });
    } catch (error) {
      const errorContent = `图像生成失败：${error instanceof Error ? error.message : '未知错误'}`;
      const errorMessage = createAiMessage(errorContent);
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { ideaId: currentIdea.id, message: errorMessage },
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (!currentIdea) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title={currentIdea.title.slice(0, 15) + (currentIdea.title.length > 15 ? '...' : '')}
        showBack
        rightAction={
          <div className="flex items-center gap-1">
            {/* TTS Toggle */}
            {textToSpeech.getIsSupported() && (
              <button
                onClick={isSpeaking ? stopSpeaking : toggleAutoPlayTTS}
                className={`p-2 -mr-1 rounded-full transition-colors ${
                  isSpeaking
                    ? 'bg-primary/20 text-primary'
                    : autoPlayTTS
                      ? 'bg-green-500/20 text-green-400'
                      : 'hover:bg-surface-light text-slate-400'
                }`}
                title={isSpeaking ? '停止朗读' : autoPlayTTS ? '自动朗读已开启' : '开启自动朗读'}
              >
                {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            )}
            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-2 -mr-2 rounded-full hover:bg-surface-light transition-colors"
              >
                <MoreVertical size={20} />
              </button>
              {showMoreMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-surface-light rounded-xl shadow-lg z-50 py-2 animate-scale-in">
                    <button
                      onClick={() => {
                        handleGenerateSolution();
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-surface-light transition-colors flex items-center gap-3"
                    >
                      <FileText size={18} className="text-primary" />
                      生成方案
                    </button>
                    <button
                      onClick={() => {
                        handleSearch();
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-surface-light transition-colors flex items-center gap-3"
                    >
                      <Search size={18} className="text-primary" />
                      检索相关信息
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        }
      />

      {/* Progress bar */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${currentIdea.progress}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{currentIdea.progress}%</span>
        </div>
      </div>

      {/* Initial transcript */}
      <div className="px-4 py-3 bg-surface/50 border-y border-surface-light">
        <p className="text-sm text-slate-400">
          <span className="text-slate-500">原始想法：</span>
          {currentIdea.transcript}
        </p>
      </div>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-60">
        <div className="space-y-4">
          {currentIdea.messages.map(message => (
            <ChatBubble key={message.id} message={message} />
          ))}
          
          {isTyping && <TypingIndicator />}
        </div>

        <div ref={messagesEndRef} />
      </main>

      {/* Quick replies */}
      {showQuickReplies && !isTyping && (
        <div className="fixed bottom-36 left-4 right-4 max-w-[480px] mx-auto animate-slide-up z-30">
          {/* AI 继续说按钮 */}
          {!isAILooping && (
            <div className="mb-2 flex justify-center">
              <button
                onClick={startAILooping}
                className="px-4 py-2 bg-gradient-to-r from-primary to-indigo-600 text-white text-sm rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity touch-scale shadow-lg"
              >
                <Sparkles size={16} />
                AI 继续引导
              </button>
            </div>
          )}
          
          {/* 停止按钮 */}
          {isAILooping && (
            <div className="mb-2 flex justify-center">
              <button
                onClick={stopAILooping}
                className="px-4 py-2 bg-red-500 text-white text-sm rounded-full flex items-center gap-2 hover:bg-red-600 transition-colors touch-scale shadow-lg"
              >
                <Loader2 size={16} className="animate-spin" />
                停止 ({loopCount}/3)
              </button>
            </div>
          )}
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {quickReplies.map(reply => (
              <button
                key={reply}
                onClick={() => sendMessage(reply)}
                className="flex-shrink-0 px-4 py-2 bg-surface border border-surface-light rounded-full text-sm text-slate-300 hover:border-primary hover:text-white transition-colors touch-scale"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="fixed bottom-20 left-4 right-4 max-w-[480px] mx-auto z-20">
        {/* Empty space - actions moved to menu */}
      </div>

      {/* Input bar */}
      <div className="fixed bottom-16 left-0 right-0 glass border-t border-surface-light z-50">
        <div className="max-w-[480px] mx-auto px-4 py-3">
          <div className="flex items-end gap-3">
            {/* Image generation button */}
            <button
              onClick={() => setShowImageModal(true)}
              disabled={!openaiService.isConfigured()}
              className="w-12 h-12 bg-surface border border-surface-light rounded-full flex items-center justify-center hover:border-primary/50 transition-colors touch-scale disabled:opacity-40 disabled:cursor-not-allowed"
              title="AI 图像生成"
            >
              <Image size={20} className={openaiService.isConfigured() ? 'text-primary' : 'text-slate-500'} />
            </button>

            <div className="flex-1 bg-surface border border-surface-light rounded-2xl overflow-hidden">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={openaiService.isConfigured() ? "输入你的回答..." : "配置 API Key 后开始 AI 对话"}
                rows={1}
                className="w-full px-4 py-3 bg-transparent text-sm resize-none focus:outline-none placeholder-slate-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(inputValue);
                  }
                }}
              />
            </div>
            
            {inputValue.trim() && !isRecording ? (
              <button
                onClick={() => sendMessage(inputValue)}
                className="w-12 h-12 bg-gradient-to-br from-primary to-indigo-600 rounded-full flex items-center justify-center touch-scale"
              >
                <Send size={20} className="text-white" />
              </button>
            ) : (
              <VoiceRecordButton
                isRecording={isRecording}
                onClick={handleVoiceInput}
                size="medium"
              />
            )}
          </div>
        </div>
      </div>

      <BottomNav />

      {/* Image Generation Modal */}
      <ImageGenerationModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onGenerate={handleImageGenerate}
        isGenerating={isGeneratingImage}
      />
    </div>
  );
}
