import type { Idea, SearchResult, UserProfile } from './types';

export const aiQuestions: Record<string, string[]> = {
  default: [
    "你为什么会有这个想法？是遇到了什么具体问题吗？",
    "你能详细描述一下你的目标用户是谁吗？",
    "市面上有类似的产品或服务吗？你觉得它们有什么不足？",
    "这个想法的核心价值主张是什么？用一句话概括。",
    "你希望用户使用你的产品后能获得什么改变？",
  ],
  tech: [
    "你想解决的技术痛点是什么？",
    "你考虑过这个技术方案的实现难度吗？",
    "你的技术创新点在哪里？",
    "有没有考虑过使用现有的开源技术来加速开发？",
  ],
  business: [
    "你的商业模式是什么？如何盈利？",
    "你预估的市场规模有多大？",
    "你的目标用户群体有什么特征？",
    "你打算如何获取第一批用户？",
  ],
};

export const searchResults: SearchResult[] = [
  {
    id: '1',
    type: 'patent',
    title: '智能灌溉系统及方法',
    source: '中国专利 CN202410001234.5',
    summary: '一种基于土壤湿度和天气预测的自动灌溉系统，通过物联网传感器实时监测土壤状态。',
    year: 2024,
  },
  {
    id: '2',
    type: 'product',
    title: '小米智能花盆 Pro',
    source: '小米生态链产品',
    summary: '集成土壤检测、自动浇水、LED生长灯于一体，支持手机APP远程控制和数据记录。',
  },
  {
    id: '3',
    type: 'paper',
    title: 'IoT-based Smart Agriculture: A Comprehensive Survey',
    source: 'IEEE IoT Journal',
    summary: '综述了物联网在智慧农业中的应用，包括环境监测、自动化灌溉、精准施肥等技术。',
    cited: 328,
    year: 2023,
  },
  {
    id: '4',
    type: 'report',
    title: '2024年全球智能家居市场分析报告',
    source: '艾瑞咨询',
    summary: '预计2024-2028年智能家居市场年复合增长率达15%，其中智能园艺类产品增速最快。',
  },
  {
    id: '5',
    type: 'patent',
    title: '植物生长状态监测方法及装置',
    source: '美国专利 US20240123456A1',
    summary: '利用计算机视觉技术分析植物叶片颜色和形态，自动判断生长状态并生成养护建议。',
    year: 2024,
  },
  {
    id: '6',
    type: 'paper',
    title: 'Plant Disease Detection Using Deep Learning',
    source: 'Nature Plants',
    summary: '提出了一种基于卷积神经网络的植物病害识别方法，准确率达到98.5%。',
    cited: 1250,
    year: 2023,
  },
];

export const quickReplies = [
  "让我想想...",
  "这是个很好的问题",
  "我还没有仔细考虑过",
  "你可以给我一些建议吗？",
];

export const fallbackResponses = [
  '这是一个很好的想法！能告诉我更多关于它的细节吗？',
  '我理解你的意思。你希望这个想法解决什么问题呢？',
  '很有创意！有什么具体的实施方向吗？',
];

export const initialProfile: UserProfile = {
  name: '创意用户',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vocoseed',
  isLoggedIn: false,
  email: '',
  nickname: '',
  memberType: 'free',
  usage: {
    recordingsThisMonth: 3,
    recordingsLimit: 10,
    searchesToday: 2,
    searchesLimit: 5,
  },
  stats: {
    totalIdeas: 12,
    totalConversations: 47,
    streak: 5,
  },
};

export const sampleIdeas: Idea[] = [
  {
    id: '1',
    title: '智能自动浇花器',
    transcript: '我想做一个能自动浇花的花盆，这样我出差的时候就不用担心植物会枯死了。',
    messages: [
      {
        id: 'm1',
        role: 'ai',
        content: '这个想法很有趣！请问你主要养的是什么类型的植物？多肉、绿植还是开花植物？',
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'm2',
        role: 'user',
        content: '主要是一些绿萝和吊兰，偶尔也有多肉。',
        timestamp: Date.now() - 3500000,
      },
      {
        id: 'm3',
        role: 'ai',
        content: '明白了，不同植物的需水量差异很大。市场上已有的小米花盆主要针对多肉设计。你觉得你的差异化在哪里？',
        timestamp: Date.now() - 3400000,
      },
    ],
    searchResults: [],
    status: 'chatting',
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 3400000,
    keywords: ['自动浇花', '植物养护', '智能家居'],
    progress: 60,
  },
  {
    id: '2',
    title: '大学生简历优化工具',
    transcript: '我想做一个帮助大学生写简历的工具，基于AI分析简历并给出修改建议。',
    messages: [],
    searchResults: [],
    status: 'completed',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    keywords: ['简历', 'AI', '求职'],
    progress: 100,
  },
  {
    id: '3',
    title: '社区共享厨房APP',
    transcript: '我想做一个让邻居们可以共享厨房做饭的APP，解决一些人家里没有厨房的问题。',
    messages: [],
    searchResults: [],
    status: 'completed',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
    keywords: ['共享经济', '社区', '美食'],
    progress: 100,
  },
];

export const solutionTemplate = {
  painPoints: [
    '城市年轻人工作繁忙，经常出差或加班，难以照顾家中植物',
    '现有智能花盆功能单一，无法根据不同植物调整灌溉策略',
    '植物养护知识门槛高，新手容易浇水过多或过少导致植物死亡',
  ],
  targetUsers: [
    '都市白领：经常加班、出差，有绿植装饰需求但时间有限',
    '养花新手：希望养好植物但缺乏经验，需要智能辅助',
    '植物爱好者：家中植物种类多，需要统一管理',
  ],
  coreFeatures: [
    '多传感器监测：土壤湿度、光照强度、环境温度',
    'AI植物识别：根据植物种类自动匹配养护方案',
    '智能灌溉：按需浇水，支持定时和手动模式',
    '远程控制：手机APP实时查看和操控',
    '数据记录：生成植物生长报告和养护提醒',
  ],
  competitorAnalysis: [
    { name: '小米智能花盆', advantage: '品牌、渠道', disadvantage: '功能单一，仅支持多肉' },
    { name: 'Plantlink', advantage: '精确监测', disadvantage: '仅监测不控制' },
    { name: 'Parrot Pot', advantage: '自动灌溉', disadvantage: 'APP体验差，电池续航短' },
  ],
  nextSteps: [
    '进行用户调研，验证需求真实性',
    '技术选型，确定传感器方案和通信协议',
    '制作MVP，聚焦核心灌溉功能',
    '小规模测试，收集用户反馈迭代',
  ],
};
