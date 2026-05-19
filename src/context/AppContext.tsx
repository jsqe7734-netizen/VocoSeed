import React, { createContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Idea, UserProfile, Message } from '../data/types';
import { initialProfile, sampleIdeas } from '../data/mockData';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { ideaService } from '../services/supabase/ideaService';
import { authService } from '../services/supabase/authService';
import { statsService } from '../services/supabase/statsService';

interface AppState {
  ideas: Idea[];
  currentIdea: Idea | null;
  profile: UserProfile;
  isRecording: boolean;
  isSpeaking: boolean;
  isSupabaseConnected: boolean;
  isLoading: boolean;
}

type AppAction =
  | { type: 'SET_IDEAS'; payload: Idea[] }
  | { type: 'ADD_IDEA'; payload: Idea }
  | { type: 'UPDATE_IDEAS'; payload: Idea }
  | { type: 'DELETE_IDEA'; payload: string }
  | { type: 'SET_CURRENT_IDEA'; payload: Idea | null }
  | { type: 'SET_PROFILE'; payload: UserProfile }
  | { type: 'SET_RECORDING'; payload: boolean }
  | { type: 'SET_SPEAKING'; payload: boolean }
  | { type: 'ADD_MESSAGE'; payload: { ideaId: string; message: Message } }
  | { type: 'UPDATE_PROGRESS'; payload: { ideaId: string; progress: number } }
  | { type: 'SET_SUPABASE_CONNECTED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_KEYWORDS'; payload: { ideaId: string; keywords: string[] } };

const initialState: AppState = {
  ideas: [],
  currentIdea: null,
  profile: initialProfile,
  isRecording: false,
  isSpeaking: false,
  isSupabaseConnected: false,
  isLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_IDEAS':
      return { ...state, ideas: action.payload };
    case 'ADD_IDEA':
      return { ...state, ideas: [action.payload, ...state.ideas] };
    case 'UPDATE_IDEAS':
      return {
        ...state,
        ideas: state.ideas.map(idea =>
          idea.id === action.payload.id ? action.payload : idea
        ),
        currentIdea:
          state.currentIdea?.id === action.payload.id
            ? action.payload
            : state.currentIdea,
      };
    case 'DELETE_IDEA':
      return {
        ...state,
        ideas: state.ideas.filter(idea => idea.id !== action.payload),
        currentIdea:
          state.currentIdea?.id === action.payload ? null : state.currentIdea,
      };
    case 'SET_CURRENT_IDEA':
      return { ...state, currentIdea: action.payload };
    case 'SET_PROFILE':
      return { ...state, profile: action.payload };
    case 'SET_RECORDING':
      return { ...state, isRecording: action.payload };
    case 'SET_SPEAKING':
      return { ...state, isSpeaking: action.payload };
    case 'ADD_MESSAGE': {
      const updatedIdeas = state.ideas.map(idea =>
        idea.id === action.payload.ideaId
          ? { ...idea, messages: [...idea.messages, action.payload.message], updatedAt: Date.now() }
          : idea
      );
      const updatedCurrentIdea = updatedIdeas.find(i => i.id === action.payload.ideaId);
      return {
        ...state,
        ideas: updatedIdeas,
        currentIdea:
          state.currentIdea?.id === action.payload.ideaId
            ? updatedCurrentIdea || null
            : state.currentIdea,
      };
    }
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        ideas: state.ideas.map(idea =>
          idea.id === action.payload.ideaId
            ? { ...idea, progress: action.payload.progress }
            : idea
        ),
        currentIdea:
          state.currentIdea?.id === action.payload.ideaId
            ? { ...state.currentIdea, progress: action.payload.progress }
            : state.currentIdea,
      };
    case 'UPDATE_KEYWORDS':
      return {
        ...state,
        ideas: state.ideas.map(idea =>
          idea.id === action.payload.ideaId
            ? { ...idea, keywords: action.payload.keywords }
            : idea
        ),
        currentIdea:
          state.currentIdea?.id === action.payload.ideaId
            ? { ...state.currentIdea, keywords: action.payload.keywords }
            : state.currentIdea,
      };
    case 'SET_SUPABASE_CONNECTED':
      return { ...state, isSupabaseConnected: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 检查 Supabase 连接和初始化数据
  useEffect(() => {
    const initSupabase = async () => {
      try {
        // 检查 Supabase 配置
        if (!isSupabaseConfigured) {
          console.warn('Supabase not configured, using localStorage');
          // 使用 localStorage 作为后备
          const savedIdeas = localStorage.getItem('vocoseed_ideas');
          if (savedIdeas) {
            dispatch({ type: 'SET_IDEAS', payload: JSON.parse(savedIdeas) });
          } else {
            dispatch({ type: 'SET_IDEAS', payload: sampleIdeas });
          }

          const savedProfile = localStorage.getItem('vocoseed_profile');
          if (savedProfile) {
            dispatch({ type: 'SET_PROFILE', payload: JSON.parse(savedProfile) });
          }
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        // 检查认证状态
        const sessionResult = await authService.getSession();
        
        if (sessionResult.data.session) {
          dispatch({ type: 'SET_SUPABASE_CONNECTED', payload: true });
          
          // 获取用户数据
          try {
            const [ideas, stats] = await Promise.all([
              ideaService.getAllIdeas(),
              statsService.getUserStats(),
            ]);

            dispatch({ type: 'SET_IDEAS', payload: ideas });
            
            // 更新统计信息
            dispatch({
              type: 'SET_PROFILE',
              payload: {
                ...initialProfile,
                isLoggedIn: true,
                usage: {
                  recordingsThisMonth: stats.recordings_this_month,
                  recordingsLimit: stats.recordings_limit,
                  searchesToday: stats.searches_today,
                  searchesLimit: stats.searches_limit,
                },
                stats: {
                  totalIdeas: stats.total_ideas,
                  totalConversations: stats.total_conversations,
                  streak: stats.streak,
                },
              },
            });

            // 更新连续登录天数
            await statsService.updateStreak();
          } catch (err) {
            console.error('Error fetching data:', err);
            dispatch({ type: 'SET_IDEAS', payload: sampleIdeas });
          }
        } else {
          // 未登录，使用本地存储
          const savedIdeas = localStorage.getItem('vocoseed_ideas');
          if (savedIdeas) {
            dispatch({ type: 'SET_IDEAS', payload: JSON.parse(savedIdeas) });
          } else {
            dispatch({ type: 'SET_IDEAS', payload: sampleIdeas });
          }

          const savedProfile = localStorage.getItem('vocoseed_profile');
          if (savedProfile) {
            dispatch({ type: 'SET_PROFILE', payload: JSON.parse(savedProfile) });
          }
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Supabase initialization failed:', error);
        // 回退到 localStorage
        const savedIdeas = localStorage.getItem('vocoseed_ideas');
        if (savedIdeas) {
          dispatch({ type: 'SET_IDEAS', payload: JSON.parse(savedIdeas) });
        } else {
          dispatch({ type: 'SET_IDEAS', payload: sampleIdeas });
        }

        const savedProfile = localStorage.getItem('vocoseed_profile');
        if (savedProfile) {
          dispatch({ type: 'SET_PROFILE', payload: JSON.parse(savedProfile) });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initSupabase();
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: subscription } = authService.onAuthStateChange(async (session) => {
      if (session) {
        dispatch({ type: 'SET_SUPABASE_CONNECTED', payload: true });
        // 用户登录，获取数据
        try {
          const ideas = await ideaService.getAllIdeas();
          const stats = await statsService.getUserStats();
          
          dispatch({ type: 'SET_IDEAS', payload: ideas });
          dispatch({
            type: 'SET_PROFILE',
            payload: {
              ...initialProfile,
              isLoggedIn: true,
              usage: {
                recordingsThisMonth: stats.recordings_this_month,
                recordingsLimit: stats.recordings_limit,
                searchesToday: stats.searches_today,
                searchesLimit: stats.searches_limit,
              },
              stats: {
                totalIdeas: stats.total_ideas,
                totalConversations: stats.total_conversations,
                streak: stats.streak,
              },
            },
          });
        } catch (err) {
          console.error('Error loading user data:', err);
        }
      } else {
        dispatch({ type: 'SET_SUPABASE_CONNECTED', payload: false });
        dispatch({
          type: 'SET_PROFILE',
          payload: { ...initialProfile, isLoggedIn: false },
        });
      }
    });

    return () => {
      if (subscription && 'subscription' in subscription && subscription.subscription) {
        subscription.subscription.unsubscribe();
      } else if (subscription && 'unsubscribe' in subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // 保存到 localStorage（作为后备方案）
  useEffect(() => {
    if (state.ideas.length > 0) {
      localStorage.setItem('vocoseed_ideas', JSON.stringify(state.ideas));
    }
  }, [state.ideas]);

  useEffect(() => {
    localStorage.setItem('vocoseed_profile', JSON.stringify(state.profile));
  }, [state.profile]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}
