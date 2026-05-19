/**
 * 浏览器原生语音识别服务
 * 使用 Web Speech API，无需配置 API Key
 * 
 * 优点：
 * - 完全本地运行，不需要网络请求
 * - 不需要配置任何 API
 * 
 * 缺点：
 * - 依赖浏览器支持（Chrome 效果最好）
 * - 需要用户授权麦克风权限
 */

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';

export interface SpeechRecognitionCallbacks {
  onInterim?: (transcript: string) => void;
  onFinal?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: SpeechRecognitionStatus) => void;
}

// 检查浏览器支持
const SpeechRecognition = window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;

class BrowserSpeechRecognitionService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private callbacks: SpeechRecognitionCallbacks = {};
  private isRecording = false;
  private finalTranscript = '';

  isConfigured(): boolean {
    return !!SpeechRecognition;
  }

  async checkMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }

  async start(callbacks: SpeechRecognitionCallbacks): Promise<boolean> {
    if (this.isRecording) {
      return false;
    }

    if (!this.isConfigured()) {
      callbacks.onError?.('browser-not-supported');
      callbacks.onStatusChange?.('error');
      return false;
    }

    this.callbacks = callbacks;
    this.finalTranscript = '';
    this.isRecording = true;

    try {
      console.log('[Browser Speech] Starting recognition...');

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'zh-CN'; // 中文
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        console.log('[Browser Speech] Recognition started');
        this.callbacks.onStatusChange?.('listening');
      };

      this.recognition.onresult = (event: { resultIndex: number; results: { length: number; [index: number]: { length: number; [i: number]: { transcript: string; isFinal: boolean } } } }) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i][0].isFinal) {
            this.finalTranscript += transcript;
            this.callbacks.onFinal?.(this.finalTranscript);
          } else {
            interimTranscript += transcript;
            this.callbacks.onInterim?.(this.finalTranscript + interimTranscript);
          }
        }
      };

      this.recognition.onerror = (event: { error: string }) => {
        console.error('[Browser Speech] Error:', event.error);
        if (event.error === 'no-speech') {
          // 没有语音输入不算错误，只是结束
          this.callbacks.onStatusChange?.('idle');
        } else if (event.error === 'not-allowed') {
          this.callbacks.onError?.('麦克风权限被拒绝');
          this.callbacks.onStatusChange?.('error');
        } else if (event.error === 'network') {
          this.callbacks.onError?.('网络错误，请检查网络连接');
          this.callbacks.onStatusChange?.('error');
        } else {
          this.callbacks.onError?.(`识别错误: ${event.error}`);
          this.callbacks.onStatusChange?.('error');
        }
        this.isRecording = false;
      };

      this.recognition.onend = () => {
        console.log('[Browser Speech] Recognition ended');
        if (this.isRecording) {
          // 如果还在 recording 状态，说明是意外结束，重新开始
          try {
            this.recognition?.start();
          } catch {
            this.callbacks.onStatusChange?.('idle');
            this.isRecording = false;
          }
        } else {
          this.callbacks.onStatusChange?.('idle');
        }
      };

      this.recognition.start();
      return true;
    } catch (error) {
      console.error('[Browser Speech] Start error:', error);
      this.callbacks.onError?.('启动失败');
      this.callbacks.onStatusChange?.('error');
      this.cleanup();
      return false;
    }
  }

  async stop(): Promise<string> {
    if (!this.isRecording) {
      return '';
    }

    this.isRecording = false;
    this.callbacks.onStatusChange?.('processing');
    console.log('[Browser Speech] Stopping...');

    if (this.recognition) {
      this.recognition.stop();
    }

    // 返回最终识别的文本
    return this.finalTranscript;
  }

  private cleanup() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // 忽略
      }
      this.recognition = null;
    }
    this.isRecording = false;
  }

  abort() {
    this.isRecording = false;
    this.cleanup();
    this.callbacks.onStatusChange?.('idle');
  }
}

export const browserSpeechRecognition = new BrowserSpeechRecognitionService();
