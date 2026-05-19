import { useCallback } from 'react';
import { useApp } from '../context/useApp';
import { ideaService } from '../services/supabase/ideaService';
import { statsService } from '../services/supabase/statsService';
import type { Idea, Message, SearchResult } from '../data/types';
import { generateId } from '../utils/helpers';

export function useSupabase() {
  const { state, dispatch } = useApp();

  // 添加新创意
  const addIdea = useCallback(async (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (state.isSupabaseConnected) {
        // 使用 Supabase
        const newIdeaId = await ideaService.createIdea(idea);
        const fullIdea = await ideaService.getIdeaById(newIdeaId);
        
        if (fullIdea) {
          dispatch({ type: 'ADD_IDEA', payload: fullIdea });
          await statsService.incrementRecordingCount();
          return fullIdea.id;
        }
      } else {
        // 使用本地存储
        const newIdea: Idea = {
          ...idea,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        dispatch({ type: 'ADD_IDEA', payload: newIdea });
        return newIdea.id;
      }
    } catch (error) {
      console.error('Failed to add idea:', error);
      // 回退到本地存储
      const newIdea: Idea = {
        ...idea,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      dispatch({ type: 'ADD_IDEA', payload: newIdea });
      return newIdea.id;
    }
  }, [state.isSupabaseConnected, dispatch]);

  // 更新创意
  const updateIdea = useCallback(async (id: string, updates: Partial<Idea>) => {
    try {
      if (state.isSupabaseConnected) {
        await ideaService.updateIdea(id, updates);
        const updatedIdea = await ideaService.getIdeaById(id);
        if (updatedIdea) {
          dispatch({ type: 'UPDATE_IDEAS', payload: updatedIdea });
        }
      } else {
        const currentIdea = state.ideas.find(i => i.id === id);
        if (currentIdea) {
          const updatedIdea = { ...currentIdea, ...updates, updatedAt: Date.now() };
          dispatch({ type: 'UPDATE_IDEAS', payload: updatedIdea });
        }
      }
    } catch (error) {
      console.error('Failed to update idea:', error);
      // 回退到本地更新
      const currentIdea = state.ideas.find(i => i.id === id);
      if (currentIdea) {
        const updatedIdea = { ...currentIdea, ...updates, updatedAt: Date.now() };
        dispatch({ type: 'UPDATE_IDEAS', payload: updatedIdea });
      }
    }
  }, [state.isSupabaseConnected, state.ideas, dispatch]);

  // 删除创意
  const deleteIdea = useCallback(async (id: string) => {
    try {
      if (state.isSupabaseConnected) {
        await ideaService.deleteIdea(id);
      }
    } catch (error) {
      console.error('Failed to delete idea from Supabase:', error);
    }
    // 始终更新本地状态
    dispatch({ type: 'DELETE_IDEA', payload: id });
  }, [state.isSupabaseConnected, dispatch]);

  // 添加消息
  const addMessage = useCallback(async (ideaId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    try {
      if (state.isSupabaseConnected) {
        const messageId = await ideaService.addMessage(ideaId, message);
        const fullMessage: Message = {
          ...message,
          id: messageId,
          timestamp: Date.now(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: { ideaId, message: fullMessage } });
        await statsService.incrementConversationCount();
      } else {
        const fullMessage: Message = {
          ...message,
          id: generateId(),
          timestamp: Date.now(),
        };
        dispatch({ type: 'ADD_MESSAGE', payload: { ideaId, message: fullMessage } });
      }
    } catch (error) {
      console.error('Failed to add message:', error);
      // 回退到本地
      const fullMessage: Message = {
        ...message,
        id: generateId(),
        timestamp: Date.now(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: { ideaId, message: fullMessage } });
    }
  }, [state.isSupabaseConnected, dispatch]);

  // 添加搜索结果
  const addSearchResults = useCallback(async (ideaId: string, searchResults: Omit<SearchResult, 'id'>[]) => {
    try {
      if (state.isSupabaseConnected) {
        await ideaService.addSearchResults(ideaId, searchResults);
        await statsService.incrementSearchCount();
        // 刷新 Idea
        const updatedIdea = await ideaService.getIdeaById(ideaId);
        if (updatedIdea) {
          dispatch({ type: 'UPDATE_IDEAS', payload: updatedIdea });
        }
      } else {
        // 本地存储
        const currentIdea = state.ideas.find(i => i.id === ideaId);
        if (currentIdea) {
          const updatedIdea = {
            ...currentIdea,
            searchResults: [
              ...currentIdea.searchResults,
              ...searchResults.map(r => ({ ...r, id: generateId() }))
            ],
            updatedAt: Date.now()
          };
          dispatch({ type: 'UPDATE_IDEAS', payload: updatedIdea });
        }
      }
    } catch (error) {
      console.error('Failed to add search results:', error);
    }
  }, [state.isSupabaseConnected, state.ideas, dispatch]);

  return {
    isConnected: state.isSupabaseConnected,
    isLoading: state.isLoading,
    addIdea,
    updateIdea,
    deleteIdea,
    addMessage,
    addSearchResults,
  };
}
