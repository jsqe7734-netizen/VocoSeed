import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/useApp';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import VoiceRecordButton from '../components/VoiceRecordButton';
import IdeaCard from '../components/IdeaCard';
import { Mic, Sparkles, TrendingUp, Zap, ChevronRight, AlertCircle, Settings } from 'lucide-react';
import { generateId, randomDelay } from '../utils/helpers';
import { aiQuestions } from '../data/mockData';
import { speechRecognition } from '../services/speechRecognition';
import { baiduSpeechRecognition } from '../services/baiduSpeechRecognition';
import type { Idea, Message } from '../data/types';

export default function HomePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLTextAreaElement>(null);

  const speechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const baiduConfigured = !!(import.meta.env.VITE_BAIDU_APP_ID &&
    import.meta.env.VITE_BAIDU_API_KEY &&
    import.meta.env.VITE_BAIDU_SECRET_KEY);

  const recentIdeas = state.ideas.slice(0, 5);

  const startRecording = async () => {
    setRecordingError(null);
    console.log('[Voice] Starting recording...', { speechSupported, baiduConfigured });

    if (baiduConfigured) {
      console.log('[Voice] Using Baidu speech recognition');
      const permissionResult = await baiduSpeechRecognition.checkMicrophonePermission();
      if (!permissionResult.allowed) {
        setRecordingError(permissionResult.error || '无法访问麦克风，请检查浏览器权限');
        return;
      }

      const success = await baiduSpeechRecognition.start({
        onInterim: (text) => {
          console.log('[Voice] Baidu interim:', text);
          setTranscript(text);
          setShowTranscript(true);
        },
        onFinal: (text) => {
          console.log('[Voice] Baidu final:', text);
          setTranscript(text);
          if (!text.trim()) {
            setRecordingError('未能识别到语音，请重试');
          }
        },
        onError: (error) => {
          console.error('[Voice] Baidu speech error:', error);
          setRecordingError(error);
          setIsRecording(false);
        },
        onStatusChange: (status) => {
          console.log('[Voice] Baidu status:', status);
          setIsRecording(status === 'listening');
        },
      });

      if (success) {
        setIsRecording(true);
        setTranscript('');
        setShowTranscript(true);
      }
      return;
    }

    if (speechSupported) {
      console.log('[Voice] Using Web Speech API');
      const success = speechRecognition.start({
        onInterim: (text) => {
          setTranscript(text);
          setShowTranscript(true);
        },
        onFinal: (text) => {
          setTranscript(text);
          if (!text.trim()) {
            setRecordingError('未能识别到语音，请重试');
          }
        },
        onError: (error) => {
          console.error('Speech recognition error:', error);
          if (error === 'network-error' || error === 'network') {
            console.log('[Voice] Network error, falling back to simulation');
            setRecordingError(null);
            simulateRecording();
            return;
          }
          setRecordingError(getSpeechErrorMessage(error));
          setIsRecording(false);
        },
        onStatusChange: (status) => {
          console.log('[Voice] Web Speech status:', status);
          if (status === 'idle' && !transcript) {
            console.log('[Voice] Recognition stopped without result, falling back to simulation');
            simulateRecording();
          }
          setIsRecording(status === 'listening');
        },
      });

      if (success) {
        setIsRecording(true);
        setTranscript('');
        setShowTranscript(true);
      } else {
        console.log('[Voice] Failed to start, falling back to simulation');
        simulateRecording();
      }
    } else {
      console.log('[Voice] Web Speech not supported, using simulation mode');
      simulateRecording();
    }
  };

  const simulateRecording = () => {
    setIsRecording(true);
    setTranscript('');
    setShowTranscript(true);

    const phrases = [
      '我想做一个能自动浇花的花盆...',
      '这样出差的时候就不用担心植物枯死了...',
      '最好能根据不同的植物种类...',
      '自动调整浇水的时间和量...',
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < phrases.length) {
        setTranscript(prev => prev + phrases[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    (window as unknown as Record<string, unknown>).__recordingInterval = interval;
  };

  const stopRecording = async () => {
    setIsRecording(false);

    if (baiduConfigured) {
      await baiduSpeechRecognition.stop();
    } else if (speechSupported) {
      speechRecognition.stop();
    } else {
      clearInterval((window as unknown as Record<string, unknown>).__recordingInterval as ReturnType<typeof setInterval>);
    }

    if (!transcript && !baiduConfigured && !speechSupported) {
      setTranscript('我想做一个智能办公助手，帮助上班族管理日程和提醒重要事项。');
    }
  };

  const handleRecordComplete = async () => {
    if (!transcript.trim()) return;

    const newIdea: Idea = {
      id: generateId(),
      title: transcript.slice(0, 20) + (transcript.length > 20 ? '...' : ''),
      transcript: transcript,
      messages: [],
      searchResults: [],
      status: 'chatting',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      keywords: [],
      progress: 10,
    };

    dispatch({ type: 'ADD_IDEA', payload: newIdea });
    dispatch({ type: 'SET_CURRENT_IDEA', payload: newIdea });

    await randomDelay(1500, 2500);

    const firstQuestion = aiQuestions.default[Math.floor(Math.random() * aiQuestions.default.length)];
    const aiMessage: Message = {
      id: generateId(),
      role: 'ai',
      content: firstQuestion,
      timestamp: Date.now(),
    };

    dispatch({
      type: 'ADD_MESSAGE',
      payload: { ideaId: newIdea.id, message: aiMessage },
    });

    navigate('/chat');
  };

  const handleIdeaClick = (idea: Idea) => {
    dispatch({ type: 'SET_CURRENT_IDEA', payload: idea });
    navigate('/chat');
  };

  const getSpeechErrorMessage = (error: string): string => {
    const errorMessages: Record<string, string> = {
      'no-speech': '没有检测到语音，请重试',
      'no-speech-detected': '没有检测到语音，请重试',
      'audio-capture': '无法访问麦克风，请检查权限',
      'no-microphone-found': '未检测到麦克风设备',
      'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许',
      'microphone-permission-denied': '麦克风权限被拒绝，请在浏览器设置中允许',
      'network': '语音识别需要联网（可能需要 VPN）',
      'network-error': '语音识别需要联网（可能需要 VPN）',
      'not-supported': '您的浏览器不支持语音识别',
      'recognition-aborted': '语音识别被中断',
      'baidu-not-configured': '请先配置百度语音识别 API',
      'recognition-failed': '语音识别失败，请重试',
    };
    return errorMessages[error] || '语音识别出错，请重试';
  };

  const forceSimulateMode = () => {
    setRecordingError(null);
    simulateRecording();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="VocoSeed" />

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Hero Section */}
        <section className="px-6 pt-8 pb-12">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl font-bold mb-2 text-warm-primary">
              让每个想法都能<span className="gradient-text">生根发芽</span>
            </h1>
            <p className="text-warm-muted text-sm">
              说出你的创意，AI教练陪你深入思考
            </p>
          </div>

          {/* Main Recording Button */}
          <div className="flex flex-col items-center mb-8">
            <VoiceRecordButton
              isRecording={isRecording}
              onClick={isRecording ? stopRecording : startRecording}
              size="large"
              showText={true}
            />
            {recordingError && (
              <div className="mt-4 animate-slide-up">
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      {recordingError.includes('\n') ? (
                        <div className="space-y-2">
                          <p>{recordingError.split('\n')[0]}</p>
                          <div className="text-xs text-red-500/70 space-y-1 pl-2 border-l-2 border-red-200">
                            {recordingError.split('\n').slice(1).map((line, i) => (
                              <p key={i}>{line}</p>
                            ))}
                          </div>
                        </div>
                      ) : (
                        recordingError
                      )}
                    </div>
                  </div>
                </div>

                {(recordingError.includes('权限') || recordingError.includes('麦克风')) && (
                  <button
                    onClick={() => {
                      navigator.mediaDevices?.getUserMedia({ audio: true })
                        .then(stream => {
                          stream.getTracks().forEach(track => track.stop());
                          setRecordingError(null);
                        })
                        .catch(() => {
                          alert('请在浏览器设置中允许麦克风权限');
                        });
                    }}
                    className="mt-3 w-full py-2.5 px-4 bg-surface border border-border rounded-2xl text-sm text-warm-secondary hover:bg-surface-light transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings size={14} />
                    查看权限设置
                  </button>
                )}

                {(recordingError.includes('网络') || recordingError.includes('VPN')) && (
                  <button
                    onClick={forceSimulateMode}
                    className="mt-3 w-full py-2.5 px-4 bg-surface border border-border rounded-2xl text-sm text-warm-secondary hover:bg-surface-light transition-colors"
                  >
                    使用模拟模式
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Live Transcript */}
          {showTranscript && (
            <div className="bg-surface border border-border rounded-3xl p-4 mb-8 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-warm-muted">实时转写</span>
              </div>
              <textarea
                ref={transcriptRef}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="说出你的创意..."
                className="w-full h-32 bg-transparent text-sm leading-relaxed resize-none focus:outline-none placeholder-warm-muted text-warm-primary"
              />
              <div className="flex justify-end gap-2 mt-2">
                {!isRecording && (
                  <>
                    <button
                      onClick={() => {
                        setTranscript('');
                        setShowTranscript(false);
                      }}
                      className="px-4 py-2 text-sm text-warm-muted hover:text-warm-primary transition-colors"
                    >
                      重新录制
                    </button>
                    <button
                      onClick={handleRecordComplete}
                      className="px-5 py-2 text-sm btn-primary rounded-full"
                    >
                      开始追问
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Stats Cards */}
        <section className="px-6 mb-8">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="card p-4 text-center hover:border-primary transition-colors touch-scale"
            >
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Sparkles size={18} className="text-amber-500" />
              </div>
              <p className="text-xl font-bold text-warm-primary">{state.profile.stats.totalIdeas}</p>
              <p className="text-xs text-warm-muted mt-1">创意总数</p>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="card p-4 text-center hover:border-secondary transition-colors touch-scale"
            >
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Zap size={18} className="text-orange-500" />
              </div>
              <p className="text-xl font-bold text-warm-primary">{state.profile.stats.totalConversations}</p>
              <p className="text-xs text-warm-muted mt-1">对话轮次</p>
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="card p-4 text-center hover:border-accent transition-colors touch-scale"
            >
              <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <TrendingUp size={18} className="text-pink-500" />
              </div>
              <p className="text-xl font-bold text-warm-primary">{state.profile.stats.streak}</p>
              <p className="text-xs text-warm-muted mt-1">连续天数</p>
            </button>
          </div>
        </section>

        {/* Recent Ideas */}
        {recentIdeas.length > 0 && (
          <section className="px-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-base text-warm-primary">最近的创意</h2>
              <button
                onClick={() => navigate('/history')}
                className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 transition-colors"
              >
                查看全部
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
              {recentIdeas.map(idea => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onClick={() => handleIdeaClick(idea)}
                  compact
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {state.ideas.length === 0 && (
          <section className="px-6 text-center py-12">
            <div className="card p-8 inline-block">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mic size={28} className="text-amber-500" />
              </div>
              <h3 className="font-medium text-lg text-warm-primary mb-2">还没有创意？</h3>
              <p className="text-warm-muted text-sm mb-6">
                点击上方麦克风，说出你的第一个创意
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 card text-sm text-warm-muted">
                <span>试试说：</span>
                <span className="gradient-text-warm font-medium">"我想做一个读书分享App"</span>
              </div>
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
