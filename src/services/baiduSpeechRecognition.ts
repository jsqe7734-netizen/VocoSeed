/**
 * 百度智能云语音识别服务（REST API 方式）
 * 支持录音后发送识别，国内访问稳定
 * 
 * 使用前需要在 .env 中配置：
 * VITE_BAIDU_APP_ID=你的App ID
 * VITE_BAIDU_API_KEY=你的API Key
 * VITE_BAIDU_SECRET_KEY=你的Secret Key
 * 
 * 注册地址: https://console.bce.baidu.com/speech
 * 免费额度: 每日500次调用
 */

export type SpeechRecognitionStatus = 'idle' | 'listening' | 'processing' | 'error';

export interface SpeechRecognitionCallbacks {
  onInterim?: (transcript: string) => void;
  onFinal?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: SpeechRecognitionStatus) => void;
}

class BaiduSpeechRecognitionService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private callbacks: SpeechRecognitionCallbacks = {};
  private isRecording = false;
  private audioChunks: Float32Array[] = [];

  isConfigured(): boolean {
    return !!(
      import.meta.env.VITE_BAIDU_APP_ID &&
      import.meta.env.VITE_BAIDU_API_KEY &&
      import.meta.env.VITE_BAIDU_SECRET_KEY
    );
  }

  async checkMicrophonePermission(): Promise<{ allowed: boolean; error?: string }> {
    // 检查浏览器是否支持麦克风 API
    if (!navigator.mediaDevices) {
      return { allowed: false, error: '您的浏览器不支持麦克风功能，请使用 Chrome、Safari 或 Edge 浏览器' };
    }

    if (!navigator.mediaDevices.getUserMedia) {
      return { allowed: false, error: '您的浏览器不支持麦克风 API，请使用 Chrome、Safari 或 Edge 浏览器' };
    }

    // 检查是否在安全上下文中（HTTPS 或 localhost）
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && !location.hostname.includes('127.')) {
      return { allowed: false, error: '麦克风功能需要安全连接，请使用 HTTPS 访问或 localhost' };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return { allowed: true };
    } catch (error: unknown) {
      const err = error as Error & { name?: string };
      console.error('[Baidu Speech] Microphone permission error:', err);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return {
          allowed: false,
          error: '麦克风权限被拒绝。请在浏览器设置中允许麦克风权限：\n\n1. 点击浏览器地址栏左侧的锁定图标\n2. 选择"网站设置"\n3. 在麦克风选项中选择"允许"'
        };
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        return {
          allowed: false,
          error: '未检测到麦克风设备。请确保您的设备已连接麦克风'
        };
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        return {
          allowed: false,
          error: '麦克风被其他应用占用。请关闭其他正在使用麦克风的程序后重试'
        };
      }

      return {
        allowed: false,
        error: `无法访问麦克风: ${err.message || '未知错误'}`
      };
    }
  }

  private async getAccessToken(): Promise<string> {
    // 每次都获取新 token，避免过期问题
    const apiKey = import.meta.env.VITE_BAIDU_API_KEY;
    const secretKey = import.meta.env.VITE_BAIDU_SECRET_KEY;

    const tokenUrl = `/baidu-token/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`;
    console.log('[Baidu Speech] Fetching access token...');

    try {
      const response = await fetch(tokenUrl, { method: 'POST' });

      if (!response.ok) {
        const text = await response.text().catch(() => '无法读取响应');
        console.error('[Baidu Speech] Token fetch failed:', response.status, text);
        throw new Error(`获取令牌失败: HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('[Baidu Speech] Token error:', data.error, data.error_description);
        throw new Error(data.error_description || data.error);
      }

      const accessToken = data.access_token;
      console.log('[Baidu Speech] Token obtained:', accessToken.substring(0, 20) + '...');
      return accessToken;
    } catch (error) {
      console.error('[Baidu Speech] Token fetch error:', error);
      throw error;
    }
  }

  private pcmToBase64(pcmData: Float32Array): string {
    const uint8Array = new Uint8Array(pcmData.length * 2);
    for (let i = 0; i < pcmData.length; i++) {
      const sample = Math.max(-1, Math.min(1, pcmData[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      uint8Array[i * 2] = intSample & 0xFF;
      uint8Array[i * 2 + 1] = (intSample >> 8) & 0xFF;
    }
    // 分块处理避免栈溢出
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
    }
    return btoa(binary);
  }

  private mergeAudioChunks(): Float32Array {
    const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return merged;
  }

  private async recognizeAudio(base64Audio: string, audioSampleCount: number): Promise<string> {
    const token = await this.getAccessToken();
    const appId = import.meta.env.VITE_BAIDU_APP_ID;
    console.log('[Baidu Speech] Using token:', token.substring(0, 20) + '...', 'appId:', appId);

    const response = await fetch(`/baidu-asr/server_api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format: 'pcm',
        rate: 16000,
        channel: 1,
        token: token,
        cuid: `vocoseed_${appId}_${Date.now()}`,
        len: audioSampleCount * 2,
        speech: base64Audio,
        dev_pid: 1537, // 中文普通话
      }),
    });

    if (!response.ok) {
      throw new Error(`识别请求失败: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (data.err_no !== 0) {
      console.error('[Baidu Speech] Recognition failed:', data);
      throw new Error(data.err_msg || `识别失败: ${data.err_no}`);
    }

    return data.result?.join('') || '';
  }

  async start(callbacks: SpeechRecognitionCallbacks): Promise<boolean> {
    if (this.isRecording) {
      return false;
    }

    if (!this.isConfigured()) {
      callbacks.onError?.('baidu-not-configured');
      callbacks.onStatusChange?.('error');
      return false;
    }

    this.callbacks = callbacks;
    this.audioChunks = [];

    try {
      console.log('[Baidu Speech] Starting recording...');
      
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (event) => {
        if (!this.isRecording) return;
        const inputData = event.inputBuffer.getChannelData(0);
        this.audioChunks.push(new Float32Array(inputData));
      };

      this.sourceNode.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isRecording = true;
      this.callbacks.onStatusChange?.('listening');
      console.log('[Baidu Speech] Recording started');
      return true;
    } catch (error) {
      console.error('[Baidu Speech] Start error:', error);
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
    console.log('[Baidu Speech] Recording stopped, processing...');

    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    try {
      const mergedAudio = this.mergeAudioChunks();
      console.log('[Baidu Speech] Audio size:', mergedAudio.length, 'samples');
      const base64Audio = this.pcmToBase64(mergedAudio);
      console.log('[Baidu Speech] Base64 size:', base64Audio.length, 'chars');
      
      if (base64Audio.length === 0) {
        throw new Error('未录制到音频数据');
      }

      console.log('[Baidu Speech] Sending audio for recognition...');
      const transcript = await this.recognizeAudio(base64Audio, mergedAudio.length);

      this.callbacks.onFinal?.(transcript);
      this.callbacks.onStatusChange?.('idle');
      
      return transcript;
    } catch (error) {
      console.error('[Baidu Speech] Recognition error:', error);
      this.callbacks.onError?.(`识别失败: ${error instanceof Error ? error.message : error}`);
      this.callbacks.onStatusChange?.('error');
      return '';
    }
  }

  private cleanup() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isRecording = false;
  }

  abort() {
    this.isRecording = false;
    this.cleanup();
    this.callbacks.onStatusChange?.('idle');
  }
}

export const baiduSpeechRecognition = new BaiduSpeechRecognitionService();
