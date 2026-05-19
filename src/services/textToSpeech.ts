// 文字转语音服务 (Text-to-Speech)

export interface TTSOptions {
  lang?: string;
  rate?: number; // 0.1 - 10
  pitch?: number; // 0 - 2
  volume?: number; // 0 - 1
}

export interface TTSVoice {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

export type TTSStatus = 'idle' | 'speaking' | 'paused' | 'error';

class TextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isSupportedFlag: boolean = false;
  private onStartCallback: (() => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.synth = (window as any).speechSynthesis;
      this.isSupportedFlag = true;
      this.loadVoices();
      
      if (this.synth) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices() {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  // 检查是否支持 TTS
  getIsSupported(): boolean {
    return this.isSupportedFlag;
  }

  // 获取所有可用的声音
  getVoices(): TTSVoice[] {
    return this.voices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
      default: voice.default,
    }));
  }

  // 获取中文声音
  getChineseVoice(): SpeechSynthesisVoice | null {
    const chineseVoices = this.voices.filter(v => 
      v.lang.includes('zh') || v.lang.includes('CN')
    );
    
    const femaleVoice = chineseVoices.find(v => 
      v.name.toLowerCase().includes('female') || 
      v.name.toLowerCase().includes('woman') ||
      v.name.includes('Ting') ||
      v.name.includes('Yaoyao') ||
      v.name.includes('Huihui')
    );
    
    if (femaleVoice) return femaleVoice;
    if (chineseVoices.length > 0) return chineseVoices[0];
    return this.voices[0] || null;
  }

  // 说话
  speak(text: string, options?: TTSOptions): boolean {
    if (!this.synth || !this.isSupportedFlag) {
      this.onErrorCallback?.('语音合成不支持');
      return false;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.lang = options?.lang || 'zh-CN';
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.0;
    utterance.volume = options?.volume || 1.0;

    const chineseVoice = this.getChineseVoice();
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    utterance.onstart = () => {
      this.onStartCallback?.();
    };

    utterance.onend = () => {
      this.onEndCallback?.();
    };

    utterance.onerror = (event) => {
      const errorMessage = event.error || 'unknown';
      if (errorMessage !== 'canceled') {
        this.onErrorCallback?.(errorMessage);
      }
    };

    this.synth.speak(utterance);
    
    return true;
  }

  // 停止朗读
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // 暂停
  pause() {
    if (this.synth) {
      this.synth.pause();
    }
  }

  // 继续
  resume() {
    if (this.synth) {
      this.synth.resume();
    }
  }

  // 检查是否正在朗读
  isSpeaking(): boolean {
    return this.synth?.speaking || false;
  }

  // 设置回调
  setCallbacks(callbacks: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (error: string) => void;
  }) {
    this.onStartCallback = callbacks.onStart || null;
    this.onEndCallback = callbacks.onEnd || null;
    this.onErrorCallback = callbacks.onError || null;
  }
}

export const textToSpeech = new TextToSpeechService();

// 使用示例:
// textToSpeech.speak('你好，这是一个测试');
// textToSpeech.stop();
// textToSpeech.setCallbacks({
//   onStart: () => console.log('开始朗读'),
//   onEnd: () => console.log('朗读结束'),
//   onError: (e) => console.error('朗读错误:', e),
// });
