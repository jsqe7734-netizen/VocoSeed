// AI Provider types and constants for Settings
export type AIProvider = 'openai' | 'siliconflow' | 'custom';

export interface ProviderOption {
  id: AIProvider;
  name: string;
  logo: string;
  baseUrl: string;
  models: { id: string; name: string; description?: string }[];
}

export const AI_PROVIDERS: ProviderOption[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '🤖',
    baseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: '最强模型' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: '推荐 - 性价比高' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: '快速响应' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: '最便宜' },
    ],
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    logo: '💧',
    baseUrl: 'https://api.siliconflow.cn/v1',
    models: [
      { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen2.5-72B', description: '免费 - 推荐' },
      { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen2.5-32B', description: '免费' },
      { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen2.5-7B', description: '免费 - 快速' },
      { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek-V3', description: '免费 - 新模型' },
      { id: 'THUDM/glm-4-9b-chat', name: 'GLM-4-9B', description: '免费' },
    ],
  },
  {
    id: 'custom',
    name: '自定义',
    logo: '⚙️',
    baseUrl: '',
    models: [],
  },
];
