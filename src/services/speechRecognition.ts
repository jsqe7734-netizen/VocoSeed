// Web Speech API 语音识别服务

export interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

// 类型声明
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean = false;
  private continuousTranscript: string = '';
  private onInterimChange: ((transcript: string) => void) | null = null;
  private onFinalChange: ((transcript: string) => void) | null = null;
  private onError: ((error: string) => void) | null = null;
  private onStatusChange: ((status: SpeechRecognitionStatus) => void) | null = null;

  constructor() {
    this.isSupported = this.checkSupport();
    if (this.isSupported) {
      this.initRecognition();
    }
  }

  private checkSupport(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  private initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'zh-CN';
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.onStatusChange?.('listening');
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (finalTranscript) {
        this.continuousTranscript += finalTranscript;
        this.onFinalChange?.(this.continuousTranscript);
      }
      
      if (interimTranscript) {
        this.onInterimChange?.(this.continuousTranscript + interimTranscript);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);

      // Provide user-friendly error messages
      let userMessage: string;
      switch (event.error) {
        case 'not-allowed':
        case 'permission-denied':
          userMessage = 'microphone-permission-denied';
          console.warn('Microphone permission denied. Please allow microphone access in your browser settings.');
          break;
        case 'no-speech':
          userMessage = 'no-speech-detected';
          break;
        case 'network':
          userMessage = 'network-error';
          console.warn('Network error during speech recognition. Please check your connection.');
          break;
        case 'audio-capture':
          userMessage = 'no-microphone-found';
          console.warn('No microphone found or microphone not available.');
          break;
        case 'aborted':
          userMessage = 'recognition-aborted';
          break;
        default:
          userMessage = event.error;
      }

      this.onError?.(userMessage);
      this.onStatusChange?.('error');
    };

    this.recognition.onend = () => {
      this.onStatusChange?.('idle');
    };
  }

  // 检查是否支持语音识别
  getIsSupported(): boolean {
    return this.isSupported;
  }

  // 设置语言
  setLanguage(lang: string) {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  // 开始录音
  start(options?: {
    onInterim?: (transcript: string) => void;
    onFinal?: (transcript: string) => void;
    onError?: (error: string) => void;
    onStatusChange?: (status: SpeechRecognitionStatus) => void;
  }) {
    if (!this.recognition || !this.isSupported) {
      options?.onError?.('not-supported');
      return false;
    }

    this.continuousTranscript = '';
    this.onInterimChange = options?.onInterim || null;
    this.onFinalChange = options?.onFinal || null;
    this.onError = options?.onError || null;
    this.onStatusChange = options?.onStatusChange || null;

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      this.onError?.('network');
      return false;
    }
  }

  // 停止录音
  stop(): string {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error('Failed to stop speech recognition:', error);
      }
    }
    return this.continuousTranscript;
  }

  // 中止录音
  abort() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.error('Failed to abort speech recognition:', error);
      }
    }
    this.continuousTranscript = '';
  }
}

export const speechRecognition = new SpeechRecognitionService();
