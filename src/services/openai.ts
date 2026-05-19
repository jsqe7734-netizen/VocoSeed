export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ImageGenerationResponse {
  created: number;
  data: {
    url?: string;
    b64_json?: string;
  }[];
}

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  imageModel: string;
}

// 从 localStorage 加载配置，优先使用本地配置
function loadConfig(): AIConfig {
  const localApiKey = localStorage.getItem('vocoseed_api_key');
  const localBaseUrl = localStorage.getItem('vocoseed_base_url');
  const localModel = localStorage.getItem('vocoseed_model');

  const baseUrl = localBaseUrl || import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1';

  return {
    apiKey: localApiKey || import.meta.env.VITE_OPENAI_API_KEY || '',
    baseUrl: baseUrl,
    model: localModel || import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
    imageModel: import.meta.env.VITE_DALLE_MODEL || 'dall-e-3',
  };
}

const DEFAULT_CONFIG = loadConfig();

export class OpenAIService {
  private config: AIConfig;

  constructor(config?: Partial<AIConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    console.log('[Vocoseed] API Request:', {
      url: `${this.config.baseUrl}/chat/completions`,
      model: this.config.model,
      messageCount: messages.length,
    });

    // SiliconFlow 等服务需要未编码的模型名称，直接使用
    // encodeURIComponent 会把 "/" 编码成 "%2F"，导致 "Model does not exist" 错误
    const model = this.config.model;

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    console.log('[Vocoseed] API Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);

      // SiliconFlow API error format: { code, message, data }
      // OpenAI-compatible error format: { error: { message, type, code } }
      let errorMessage: string;

      if (errorData.message) {
        // SiliconFlow format
        errorMessage = errorData.message;
        if (errorData.code) {
          errorMessage = `Error ${errorData.code}: ${errorMessage}`;
        }
      } else if (errorData.error?.message) {
        // OpenAI-compatible format
        errorMessage = errorData.error.message;
      } else if (errorData.error) {
        // Some other error format
        errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
      } else {
        errorMessage = `API request failed: ${response.status}`;
      }

      // Provide more helpful error messages for common issues
      if (response.status === 401) {
        throw new Error('API key is invalid or expired. Please check your API key in settings.');
      } else if (response.status === 400) {
        throw new Error(`Bad request (400): ${errorMessage}`);
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(errorMessage);
    }

    const data: ChatCompletionResponse = await response.json();
    console.log('[Vocoseed] API Response data:', data);
    return data.choices[0]?.message?.content || '';
  }

  async generateImage(prompt: string, size: '1024x1024' | '512x512' | '256x256' = '1024x1024'): Promise<string> {
    if (!this.config.apiKey) {
      throw new Error('OpenAI API key is not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    const response = await fetch(`${this.config.baseUrl}/images/generations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: this.config.imageModel,
        prompt,
        n: 1,
        size,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `Image generation failed: ${response.status}`);
    }

    const data: ImageGenerationResponse = await response.json();
    const imageUrl = data.data[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned from API');
    }

    return imageUrl;
  }

  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  updateConfig(newConfig: Partial<AIConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

export const openaiService = new OpenAIService();

export const SYSTEM_PROMPTS = {
  assistant: `你是一个友好的AI助手，名叫 Vocoseed。你的任务是帮助用户完善他们的想法，提出深入的问题，并引导对话以获得更清晰的创意表达。

请遵循以下原则：
1. 用简洁、友好的语言回答
2. 提出有洞察力的问题来帮助用户思考
3. 适当总结用户表达的想法
4. 保持对话自然流畅
5. 如果用户提到图像相关的内容，可以建议生成配图`,

  imageGeneration: `你是一个创意图像描述助手。当用户要求生成图片时，你需要将他们的想法转化成一个详细、有创意的图像描述词（英文）。描述应该包括：
- 主体内容
- 风格（如：写实、插画、漫画、水彩等）
- 色彩氛围
- 背景环境
- 任何特殊元素

只返回英文描述词，不要其他内容。`,
};
