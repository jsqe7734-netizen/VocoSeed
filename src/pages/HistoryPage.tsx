import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/useApp';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import IdeaCard from '../components/IdeaCard';
import EditIdeaModal from '../components/EditIdeaModal';
import type { Idea } from '../data/types';
import { Search, Clock, Sparkles, Trash2, Edit2 } from 'lucide-react';

type SortBy = 'recent' | 'oldest';
type FilterStatus = Idea['status'] | 'all';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  const filteredIdeas = state.ideas
    .filter(idea => {
      const matchesSearch = !searchQuery || 
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.transcript.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || idea.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return b.updatedAt - a.updatedAt;
      }
      return a.createdAt - b.createdAt;
    });

  const handleIdeaClick = (idea: Idea) => {
    dispatch({ type: 'SET_CURRENT_IDEA', payload: idea });
    navigate('/chat');
  };

  const handleDeleteIdea = (e: React.MouseEvent, ideaId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个创意吗？')) {
      dispatch({ type: 'DELETE_IDEA', payload: ideaId });
    }
  };

  const handleEditIdea = (e: React.MouseEvent, idea: Idea) => {
    e.stopPropagation();
    setEditingIdea(idea);
  };

  const handleSaveIdea = (data: { title: string }) => {
    if (!editingIdea) return;
    dispatch({
      type: 'UPDATE_IDEAS',
      payload: { ...editingIdea, title: data.title },
    });
    setEditingIdea(null);
  };

  const statusGroups: { status: Idea['status']; label: string }[] = [
    { status: 'chatting', label: '进行中' },
    { status: 'completed', label: '已完成' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="创意历史" />

      {/* Search & Filter bar */}
      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索创意..."
            className="w-full pl-11 pr-4 py-3 bg-surface border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-surface border border-surface-light text-slate-400'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilterStatus('chatting')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === 'chatting' 
                  ? 'bg-primary text-white' 
                  : 'bg-surface border border-surface-light text-slate-400'
              }`}
            >
              进行中
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === 'completed' 
                  ? 'bg-primary text-white' 
                  : 'bg-surface border border-surface-light text-slate-400'
              }`}
            >
              已完成
            </button>
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="bg-surface border border-surface-light rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none"
          >
            <option value="recent">最近更新</option>
            <option value="oldest">最早创建</option>
          </select>
        </div>
      </div>

      {/* Stats summary */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Sparkles size={12} />
            {state.ideas.length} 个创意
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {state.ideas.filter(i => i.status === 'completed').length} 已完成
          </span>
        </div>
      </div>

      {/* Ideas list */}
      <main className="flex-1 overflow-y-auto px-4 pb-24">
        {filteredIdeas.length > 0 ? (
          <div className="space-y-4">
            {/* Evolution Tree visualization */}
            <div className="bg-surface border border-surface-light rounded-2xl p-4 mb-4">
              <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-gradient-to-br from-primary to-secondary rounded-full" />
                创意进化树
              </h3>
              <div className="relative">
                {/* Tree visualization */}
                <div className="flex items-center justify-center gap-1 overflow-x-auto py-4">
                  {filteredIdeas.slice(0, 6).map((idea, index) => (
                    <div key={idea.id} className="relative">
                      <button
                        onClick={() => handleIdeaClick(idea)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all hover:scale-110 ${
                          idea.status === 'completed'
                            ? 'bg-gradient-to-br from-secondary to-emerald-400 text-white'
                            : 'bg-gradient-to-br from-primary to-indigo-500 text-white'
                        }`}
                        title={idea.title}
                      >
                        {index + 1}
                      </button>
                      {index < 5 && (
                        <span className="absolute right-[-10px] top-1/2 w-5 h-0.5 bg-surface-light" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ideas grouped by status */}
            {filterStatus === 'all' ? (
              <>
                {statusGroups.map(group => {
                  const ideas = filteredIdeas.filter(i => i.status === group.status);
                  if (ideas.length === 0) return null;
                  
                  return (
                    <div key={group.status}>
                      <h3 className="font-display font-semibold text-sm mb-3 text-slate-400">
                        {group.label} ({ideas.length})
                      </h3>
                      <div className="space-y-3">
                        {ideas.map(idea => (
                          <div key={idea.id} className="relative group">
                            <IdeaCard idea={idea} onClick={() => handleIdeaClick(idea)} />
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => handleEditIdea(e, idea)}
                                className="p-2 rounded-full bg-surface-light/50 hover:bg-blue-500/20 transition-colors"
                              >
                                <Edit2 size={14} className="text-slate-400 hover:text-blue-400" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteIdea(e, idea.id)}
                                className="p-2 rounded-full bg-surface-light/50 hover:bg-red-500/20 transition-colors"
                              >
                                <Trash2 size={14} className="text-slate-400 hover:text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="space-y-3">
                {filteredIdeas.map(idea => (
                  <div key={idea.id} className="relative group">
                    <IdeaCard idea={idea} onClick={() => handleIdeaClick(idea)} />
                    <button
                      onClick={(e) => handleDeleteIdea(e, idea.id)}
                      className="absolute top-4 right-4 p-2 rounded-full bg-surface-light/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                    >
                      <Trash2 size={14} className="text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-light/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-slate-500" />
            </div>
            <h3 className="font-medium text-lg mb-2">暂无创意记录</h3>
            <p className="text-slate-400 text-sm mb-6">
              回到首页，开始录制你的第一个创意
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors touch-scale"
            >
              去录制
            </button>
          </div>
        )}
      </main>

      <BottomNav />

      {editingIdea && (
        <EditIdeaModal
          isOpen={!!editingIdea}
          onClose={() => setEditingIdea(null)}
          onSave={handleSaveIdea}
          initialTitle={editingIdea.title}
        />
      )}
    </div>
  );
}
