import { useState } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import { openaiService } from '../services/openai';
import { speechRecognition } from '../services/speechRecognition';
import { textToSpeech } from '../services/textToSpeech';
import { AI_PROVIDERS } from '../data/providers';
import {
  Key, Globe, Mic, Volume2, Check, AlertCircle,
  Shield, Zap, RefreshCw,
  Copy, Eye, EyeOff, TestTube, Bell, Server
} from 'lucide-react';
import { cn } from '../utils/helpers';

interface APIConfig {
  provider: 'openai' | 'siliconflow' | 'custom';
  apiKey: string;
  baseUrl: string;
  model: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'api' | 'voice' | 'notification' | 'about'>('api');

  // API 设置
  const [apiConfig, setApiConfig] = useState<APIConfig>(() => {
    const saved = localStorage.getItem('vocoseed_provider') as APIConfig['provider'] | null;
    let provider: APIConfig['provider'] = 'openai';
    if (saved === 'openai' || saved === 'siliconflow' || saved === 'custom') {
      provider = saved;
    } else {
      const savedBaseUrl = localStorage.getItem('vocoseed_base_url');
      if (savedBaseUrl?.includes('siliconflow')) provider = 'siliconflow';
      else if (savedBaseUrl?.includes('openai')) provider = 'openai';
    }

    const savedApiKey = localStorage.getItem('vocoseed_api_key') || import.meta.env.VITE_OPENAI_API_KEY || '';
    const savedBaseUrl = localStorage.getItem('vocoseed_base_url') || import.meta.env.VITE_OPENAI_BASE_URL || '';
    const savedModel = localStorage.getItem('vocoseed_model') || import.meta.env.VITE_OPENAI_MODEL || '';

    return {
      provider,
      apiKey: savedApiKey,
      baseUrl: savedBaseUrl || AI_PROVIDERS.find(p => p.id === provider)?.baseUrl || '',
      model: savedModel || AI_PROVIDERS.find(p => p.id === provider)?.models[0]?.id || '',
    };
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  // 当前选中的供应商信息
  const currentProvider = AI_PROVIDERS.find(p => p.id === apiConfig.provider) || AI_PROVIDERS[0];
  
  // 语音设置
  const [speechLang, setSpeechLang] = useState(localStorage.getItem('vocoseed_speech_lang') || 'zh-CN');
  const [ttsRate, setTtsRate] = useState(Number(localStorage.getItem('vocoseed_tts_rate')) || 1.0);
  const [ttsPitch, setTtsPitch] = useState(Number(localStorage.getItem('vocoseed_tts_pitch')) || 1.0);
  const [autoPlayTTS, setAutoPlayTTS] = useState(localStorage.getItem('vocoseed_auto_tts') === 'true');
  
  // 系统状态
  const [speechSupported] = useState(speechRecognition.getIsSupported());
  const [ttsSupported] = useState(textToSpeech.getIsSupported());

  // 通知设置
  const [notifications, setNotifications] = useState({
    ideaReminder: localStorage.getItem('vocoseed_notify_idea') !== 'false',
    dailySummary: localStorage.getItem('vocoseed_notify_summary') === 'true',
    soundEffects: localStorage.getItem('vocoseed_notify_sound') !== 'false',
  });

  const saveApiConfig = () => {
    localStorage.setItem('vocoseed_provider', apiConfig.provider);
    localStorage.setItem('vocoseed_api_key', apiConfig.apiKey);
    localStorage.setItem('vocoseed_base_url', apiConfig.baseUrl);
    localStorage.setItem('vocoseed_model', apiConfig.model);
    
    // 更新服务配置
    openaiService.updateConfig({
      apiKey: apiConfig.apiKey,
      baseUrl: apiConfig.baseUrl,
      model: apiConfig.model,
    });
    
    setTestResult({ success: true, message: '设置已保存' });
    setTimeout(() => setTestResult(null), 3000);
  };

  const testApiConnection = async () => {
    if (!apiConfig.apiKey) {
      setTestResult({ success: false, message: '请先输入 API Key' });
      return;
    }
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const tempService = new (await import('../services/openai')).OpenAIService({
        apiKey: apiConfig.apiKey,
        baseUrl: apiConfig.baseUrl,
        model: apiConfig.model,
        imageModel: apiConfig.provider === 'siliconflow' ? 'stabilityai/stable-diffusion-3-medium' : 'dall-e-3',
      });
      
      const response = await tempService.chat([
        { role: 'user', content: 'Hi, reply with "OK"' }
      ]);
      
      if (response.toLowerCase().includes('ok') || response.length > 0) {
        setTestResult({ success: true, message: `${currentProvider.name} 连接成功！` });
      } else {
        setTestResult({ success: false, message: '响应异常，请检查配置' });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '连接失败';
      setTestResult({ success: false, message: errorMsg });
    } finally {
      setIsTesting(false);
    }
  };

  const testSpeechRecognition = () => {
    if (!speechSupported) {
      alert('您的浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器');
      return;
    }
    
    speechRecognition.start({
      onInterim: (text) => console.log('识别中:', text),
      onFinal: (text) => {
        alert(`识别结果: ${text}`);
      },
      onError: (error) => {
        alert(`语音识别错误: ${error}`);
      },
    });
    
    setTimeout(() => {
      speechRecognition.stop();
    }, 5000);
  };

  const testTTS = (text: string = '你好，这是一个语音测试') => {
    if (!ttsSupported) {
      alert('您的浏览器不支持语音合成');
      return;
    }
    
    textToSpeech.speak(text, {
      rate: ttsRate,
      pitch: ttsPitch,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: 'api', label: 'API 配置', icon: Key },
    { id: 'voice', label: '语音设置', icon: Mic },
    { id: 'notification', label: '通知', icon: Bell },
    { id: 'about', label: '关于', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="设置" showBack />
      
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Tabs */}
        <div className="px-4 py-3 border-b border-surface-light">
          <div className="flex gap-2 bg-surface rounded-xl p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeTab === tab.id 
                      ? 'bg-primary text-white' 
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* API 配置 */}
        {activeTab === 'api' && (
          <div className="p-4 space-y-4">
            {/* 状态提示 */}
            <div className={cn(
              'flex items-center gap-3 p-4 rounded-xl',
              openaiService.isConfigured() 
                ? 'bg-green-500/10 border border-green-500/30' 
                : 'bg-amber-500/10 border border-amber-500/30'
            )}>
              {openaiService.isConfigured() ? (
                <Check size={20} className="text-green-400" />
              ) : (
                <AlertCircle size={20} className="text-amber-400" />
              )}
              <div>
                <p className="font-medium">
                  {openaiService.isConfigured() ? 'API 已配置' : 'API 未配置'}
                </p>
                <p className="text-sm text-slate-400">
                  {openaiService.isConfigured() 
                    ? `${currentProvider.name} 已连接` 
                    : `选择 ${AI_PROVIDERS.find(p => p.id === 'siliconflow')?.name || '硅基流动'} 获取免费额度`}
                </p>
              </div>
            </div>

            {/* 服务商选择 */}
            <div className="bg-surface border border-surface-light rounded-2xl p-4">
              <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                <Server size={16} className="text-slate-400" />
                选择服务商
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AI_PROVIDERS.map(provider => (
                  <button
                    key={provider.id}
                    onClick={() => setApiConfig(prev => ({ ...prev, provider: provider.id }))}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all',
                      apiConfig.provider === provider.id
                        ? 'border-primary bg-primary/10'
                        : 'border-surface-light hover:border-slate-600'
                    )}
                  >
                    <span className="text-2xl">{provider.logo}</span>
                    <span className="text-xs font-medium">{provider.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* API Key */}
            <div className="bg-surface border border-surface-light rounded-2xl p-4">
              <label className="block text-sm font-medium mb-2">
                API Key <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiConfig.apiKey}
                  onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
                  placeholder={apiConfig.provider === 'siliconflow' ? 'sk-...' : 'sk-...'}
                  className="w-full px-4 py-3 bg-background border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary placeholder-slate-500"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {apiConfig.provider === 'siliconflow' 
                  ? '从 siliconflow.cn 控制台获取 API Key'
                  : apiConfig.provider === 'openai'
                  ? '从 OpenAI Platform 获取你的 API Key'
                  : '输入你的自定义 API Key'}
              </p>
            </div>

            {/* Base URL - 仅自定义模式显示 */}
            {apiConfig.provider === 'custom' && (
              <div className="bg-surface border border-surface-light rounded-2xl p-4">
                <label className="block text-sm font-medium mb-2">
                  Base URL
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={apiConfig.baseUrl}
                    onChange={(e) => setApiConfig({...apiConfig, baseUrl: e.target.value})}
                    placeholder="https://api.example.com/v1"
                    className="w-full px-4 py-3 bg-background border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary placeholder-slate-500"
                  />
                  <button
                    onClick={() => copyToClipboard(apiConfig.baseUrl)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Model */}
            {apiConfig.provider !== 'custom' && currentProvider.models.length > 0 && (
              <div className="bg-surface border border-surface-light rounded-2xl p-4">
                <label className="block text-sm font-medium mb-2">
                  模型
                </label>
                <select
                  value={apiConfig.model}
                  onChange={(e) => setApiConfig({...apiConfig, model: e.target.value})}
                  className="w-full px-4 py-3 bg-background border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary"
                >
                  {currentProvider.models.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.description ? `- ${model.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 自定义模型输入 */}
            {apiConfig.provider === 'custom' && (
              <div className="bg-surface border border-surface-light rounded-2xl p-4">
                <label className="block text-sm font-medium mb-2">
                  模型名称
                </label>
                <input
                  type="text"
                  value={apiConfig.model}
                  onChange={(e) => setApiConfig({...apiConfig, model: e.target.value})}
                  placeholder="e.g., gpt-4o-mini"
                  className="w-full px-4 py-3 bg-background border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary placeholder-slate-500"
                />
              </div>
            )}

            {/* 当前配置信息 */}
            {apiConfig.provider === 'siliconflow' && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Globe size={18} className="text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-primary">推荐使用硅基流动</p>
                    <p className="text-xs text-slate-400 mt-1">
                      注册送额度，支持 Qwen2.5、DeepSeek 等免费模型。
                      <a 
                        href="https://siliconflow.cn" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline ml-1"
                      >
                        立即注册 →
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Test Result */}
            {testResult && (
              <div className={cn(
                'flex items-center gap-3 p-4 rounded-xl animate-slide-up',
                testResult.success 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              )}>
                {testResult.success ? (
                  <Check size={20} className="text-green-400" />
                ) : (
                  <AlertCircle size={20} className="text-red-400" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={testApiConnection}
                disabled={isTesting}
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-surface-light rounded-xl hover:bg-surface-light transition-colors disabled:opacity-50"
              >
                {isTesting ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <TestTube size={18} />
                )}
                测试连接
              </button>
              <button
                onClick={saveApiConfig}
                className="flex-1 py-3 bg-gradient-to-r from-primary to-indigo-600 rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                保存设置
              </button>
            </div>

            {/* Help */}
            <div className="bg-surface/50 border border-surface-light rounded-xl p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Shield size={16} className="text-slate-400" />
                安全提示
              </h4>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• API Key 只存储在本地浏览器中</li>
                <li>• 不会上传到任何服务器</li>
                <li>• 刷新页面后需要重新输入</li>
                <li>• 建议设置 API Key 额度避免额外费用</li>
              </ul>
            </div>
          </div>
        )}

        {/* 语音设置 */}
        {activeTab === 'voice' && (
          <div className="p-4 space-y-4">
            {/* 语音识别 */}
            <div className="bg-surface border border-surface-light rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    speechSupported ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}>
                    <Mic size={20} className={speechSupported ? 'text-green-400' : 'text-red-400'} />
                  </div>
                  <div>
                    <h3 className="font-medium">语音识别</h3>
                    <p className="text-xs text-slate-400">
                      {speechSupported ? '您的浏览器支持' : '不支持，请使用 Chrome'}
                    </p>
                  </div>
                </div>
                {speechSupported && (
                  <button
                    onClick={testSpeechRecognition}
                    className="px-4 py-2 bg-surface-light rounded-lg text-sm hover:bg-primary/20 transition-colors"
                  >
                    测试
                  </button>
                )}
              </div>
              
              <div>
                <label className="block text-sm text-slate-400 mb-2">识别语言</label>
                <select
                  value={speechLang}
                  onChange={(e) => {
                    setSpeechLang(e.target.value);
                    localStorage.setItem('vocoseed_speech_lang', e.target.value);
                    speechRecognition.setLanguage(e.target.value);
                  }}
                  className="w-full px-4 py-3 bg-background border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary"
                >
                  <option value="zh-CN">中文 (普通话)</option>
                  <option value="en-US">English (US)</option>
                  <option value="ja-JP">日本語</option>
                  <option value="ko-KR">한국어</option>
                </select>
              </div>
            </div>

            {/* 语音合成 */}
            <div className="bg-surface border border-surface-light rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    ttsSupported ? 'bg-green-500/10' : 'bg-red-500/10'
                  )}>
                    <Volume2 size={20} className={ttsSupported ? 'text-green-400' : 'text-red-400'} />
                  </div>
                  <div>
                    <h3 className="font-medium">语音朗读</h3>
                    <p className="text-xs text-slate-400">
                      {ttsSupported ? '您的浏览器支持' : '不支持'}
                    </p>
                  </div>
                </div>
                {ttsSupported && (
                  <button
                    onClick={() => testTTS()}
                    className="px-4 py-2 bg-surface-light rounded-lg text-sm hover:bg-primary/20 transition-colors"
                  >
                    测试
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">自动朗读 AI 回复</span>
                  <button
                    onClick={() => {
                      const newValue = !autoPlayTTS;
                      setAutoPlayTTS(newValue);
                      localStorage.setItem('vocoseed_auto_tts', String(newValue));
                    }}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative',
                      autoPlayTTS ? 'bg-primary' : 'bg-surface-light'
                    )}
                  >
                    <span className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      autoPlayTTS ? 'left-7' : 'left-1'
                    )} />
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">语速</span>
                    <span className="text-slate-300">{ttsRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsRate}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setTtsRate(value);
                      localStorage.setItem('vocoseed_tts_rate', String(value));
                    }}
                    className="w-full h-2 bg-surface-light rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>慢</span>
                    <span>正常</span>
                    <span>快</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">音调</span>
                    <span className="text-slate-300">{ttsPitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsPitch}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setTtsPitch(value);
                      localStorage.setItem('vocoseed_tts_pitch', String(value));
                    }}
                    className="w-full h-2 bg-surface-light rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>低</span>
                    <span>正常</span>
                    <span>高</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 通知设置 */}
        {activeTab === 'notification' && (
          <div className="p-4 space-y-4">
            <div className="bg-surface border border-surface-light rounded-2xl p-4 space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Bell size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">通知设置</h3>
                  <p className="text-xs text-slate-400">管理应用通知偏好</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm">创意提醒</p>
                    <p className="text-xs text-slate-400">提醒你继续完善未完成的创意</p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !notifications.ideaReminder;
                      setNotifications({ ...notifications, ideaReminder: newValue });
                      localStorage.setItem('vocoseed_notify_idea', String(newValue));
                    }}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative',
                      notifications.ideaReminder ? 'bg-primary' : 'bg-surface-light'
                    )}
                  >
                    <span className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      notifications.ideaReminder ? 'left-7' : 'left-1'
                    )} />
                  </button>
                </div>

                <div className="border-t border-surface-light" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm">每日总结</p>
                    <p className="text-xs text-slate-400">每天发送创意总结报告</p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !notifications.dailySummary;
                      setNotifications({ ...notifications, dailySummary: newValue });
                      localStorage.setItem('vocoseed_notify_summary', String(newValue));
                    }}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative',
                      notifications.dailySummary ? 'bg-primary' : 'bg-surface-light'
                    )}
                  >
                    <span className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      notifications.dailySummary ? 'left-7' : 'left-1'
                    )} />
                  </button>
                </div>

                <div className="border-t border-surface-light" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm">提示音</p>
                    <p className="text-xs text-slate-400">播放操作反馈音效</p>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !notifications.soundEffects;
                      setNotifications({ ...notifications, soundEffects: newValue });
                      localStorage.setItem('vocoseed_notify_sound', String(newValue));
                    }}
                    className={cn(
                      'w-12 h-6 rounded-full transition-colors relative',
                      notifications.soundEffects ? 'bg-primary' : 'bg-surface-light'
                    )}
                  >
                    <span className={cn(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      notifications.soundEffects ? 'left-7' : 'left-1'
                    )} />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Bell size={20} className="text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400">提示</p>
                  <p className="text-xs text-slate-400 mt-1">
                    通知功能需要浏览器授权才能正常工作，请在浏览器设置中允许通知权限。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 关于 */}
        {activeTab === 'about' && (
          <div className="p-4 space-y-4">
            <div className="bg-surface border border-surface-light rounded-2xl p-6 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🌱</span>
              </div>
              <h2 className="font-display font-bold text-xl mb-1">VocoSeed</h2>
              <p className="text-sm text-slate-400 mb-4">版本 1.0.0</p>
              <p className="text-sm text-slate-400">
                让每个想法都能生根发芽
              </p>
            </div>

            <div className="bg-surface border border-surface-light rounded-2xl p-4">
              <h3 className="font-medium mb-3">功能特点</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Mic size={16} className="text-primary" />
                  语音录制创意
                </li>
                <li className="flex items-center gap-2">
                  <Volume2 size={16} className="text-secondary" />
                  AI 对话深入思考
                </li>
                <li className="flex items-center gap-2">
                  <Globe size={16} className="text-amber-400" />
                  智能检索相关信息
                </li>
                <li className="flex items-center gap-2">
                  <Key size={16} className="text-emerald-400" />
                  生成完整方案
                </li>
              </ul>
            </div>

            <div className="bg-surface border border-surface-light rounded-2xl p-4">
              <h3 className="font-medium mb-3">技术栈</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-surface-light/50 rounded-lg p-2">
                  <span className="text-slate-300">前端框架</span>
                  <p className="text-white mt-1">React + TypeScript</p>
                </div>
                <div className="bg-surface-light/50 rounded-lg p-2">
                  <span className="text-slate-300">构建工具</span>
                  <p className="text-white mt-1">Vite</p>
                </div>
                <div className="bg-surface-light/50 rounded-lg p-2">
                  <span className="text-slate-300">样式</span>
                  <p className="text-white mt-1">Tailwind CSS</p>
                </div>
                <div className="bg-surface-light/50 rounded-lg p-2">
                  <span className="text-slate-300">AI</span>
                  <p className="text-white mt-1">OpenAI GPT-4</p>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 py-4">
              <p>Made with ❤️ by VocoSeed Team</p>
              <p className="mt-1">© 2024 All Rights Reserved</p>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
