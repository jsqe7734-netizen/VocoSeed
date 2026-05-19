export interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  type?: 'text' | 'image';
  imageUrl?: string;
}

export interface Idea {
  id: string;
  title: string;
  transcript: string;
  messages: Message[];
  searchResults: SearchResult[];
  status: 'recording' | 'chatting' | 'searching' | 'generating' | 'completed';
  createdAt: number;
  updatedAt: number;
  keywords: string[];
  progress: number;
}

export interface SearchResult {
  id: string;
  type: 'patent' | 'paper' | 'product' | 'report';
  title: string;
  source: string;
  summary: string;
  url?: string;
  cited?: number;
  year?: number;
}

export interface UserProfile {
  name: string;
  avatar: string;
  isLoggedIn: boolean;
  email: string;
  nickname: string;
  memberType: 'free' | 'pro' | 'team';
  usage: {
    recordingsThisMonth: number;
    recordingsLimit: number;
    searchesToday: number;
    searchesLimit: number;
  };
  stats: {
    totalIdeas: number;
    totalConversations: number;
    streak: number;
  };
}
