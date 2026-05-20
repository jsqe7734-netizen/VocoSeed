import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/useApp';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import SearchResultCard, { FilterTabs, SearchResultSkeleton } from '../components/SearchResultCard';
import type { SearchResult } from '../data/types';
import { searchService, generateSearchQueries } from '../services/searchService';
import { Search, RefreshCw, Check, AlertCircle, Loader2, Wand2 } from 'lucide-react';

export default function SearchPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<SearchResult['type'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [usedMockData, setUsedMockData] = useState(false);
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [smartSearchProgress, setSmartSearchProgress] = useState(0);

  const currentIdea = state.currentIdea;

  // 搜索功能
  const performSearch = async () => {
    if (!currentIdea) return;

    setIsSearching(true);
    setIsLoading(true);
    setSearchError(null);
    setUsedMockData(false);

    try {
      const queries = generateSearchQueries(
        currentIdea.transcript,
        currentIdea.keywords
      );

      const mainQuery = queries[0] || currentIdea.transcript.slice(0, 50);
      setSearchQuery(mainQuery);

      const response = await searchService.search({
        query: mainQuery,
        types: ['paper', 'patent', 'product', 'report'],
        limit: 10,
      });

      if (response.results.length > 0) {
        setSearchResults(response.results);
        setUsedMockData(response.usedMockData || false);
      } else {
        setSearchResults([]);
        setUsedMockData(true);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('搜索失败，请重试');
      setSearchResults([]);
      setUsedMockData(true);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (currentIdea?.id) {
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdea?.id]);

  // 过滤结果
  const filteredResults = searchResults.filter(result => {
    const matchesFilter = filter === 'all' || result.type === filter;
    const matchesSearch = !searchQuery || 
      result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedResults(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const handleAddToSolution = () => {
    if (currentIdea) {
      const selectedItems = searchResults.filter(r => selectedResults.includes(r.id));
      dispatch({
        type: 'UPDATE_IDEAS',
        payload: {
          ...currentIdea,
          searchResults: [...currentIdea.searchResults, ...selectedItems],
          status: 'completed',
        },
      });
      navigate('/chat');
    } else {
      alert('请先选择一个创意');
      navigate('/');
    }
  };

  const handleRefresh = async () => {
    if (!currentIdea) {
      alert('请先选择一个创意');
      navigate('/');
      return;
    }
    await performSearch();
  };

  const handleGenerateMore = () => {
    if (!currentIdea) {
      alert('请先选择一个创意');
      navigate('/');
      return;
    }
    navigate('/generate');
  };

  // 智能持续搜索功能
  const handleSmartSearch = async () => {
    if (!currentIdea || isSmartSearching) return;

    setIsSmartSearching(true);
    setSmartSearchProgress(0);

    // 生成多个搜索查询
    const queries = generateSearchQueries(
      currentIdea.transcript,
      currentIdea.keywords
    );

    // 搜索 4 个不同类型的关键词
    const searchTypes: SearchResult['type'][] = ['paper', 'patent', 'product', 'report'];
    const newResults: SearchResult[] = [];

    for (let i = 0; i < Math.min(queries.length, 4); i++) {
      if (!isSmartSearching) break; // 可以被停止

      setSmartSearchProgress(((i + 1) / 4) * 100);

      try {
        const response = await searchService.search({
          query: queries[i],
          types: [searchTypes[i]],
          limit: 3,
        });

        if (response.results.length > 0) {
          newResults.push(...response.results);
        }
      } catch (error) {
        console.error(`Search ${i} failed:`, error);
      }

      // 每次搜索间隔一下
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setSearchResults(prev => [...prev, ...newResults]);
    setIsSmartSearching(false);
    setSmartSearchProgress(0);

    if (newResults.length === 0) {
      setUsedMockData(true);
    }
  };

  const stopSmartSearch = () => {
    setIsSmartSearching(false);
    setSmartSearchProgress(0);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        title="相关信息检索"
        showBack
        rightAction={
          currentIdea && (
            <button
              onClick={handleRefresh}
              disabled={isSearching}
              className="p-2 -mr-2 rounded-full hover:bg-surface-light transition-colors disabled:opacity-50"
            >
              {isSearching ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <RefreshCw size={20} />
              )}
            </button>
          )
        }
      />

      {/* No idea selected state */}
      {!currentIdea ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 bg-surface-light/30 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="text-slate-500" />
          </div>
          <h3 className="font-medium text-lg mb-2">请先选择一个创意</h3>
          <p className="text-slate-400 text-sm mb-6">
            在首页或历史记录中选择一个创意来检索相关信息
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors touch-scale"
          >
            前往首页
          </button>
        </div>
      ) : (
        <>
      {/* Search bar */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索关键词..."
            className="w-full pl-11 pr-4 py-3 bg-surface border border-surface-light rounded-xl text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder-slate-500"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-3">
        <FilterTabs activeFilter={filter} onFilterChange={setFilter} />
      </div>

      {/* Smart Search Button & Progress */}
      {currentIdea && !isLoading && (
        <div className="px-4 pb-3">
          {!isSmartSearching ? (
            <button
              onClick={handleSmartSearch}
              className="w-full py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Wand2 size={16} />
              智能扩展搜索
            </button>
          ) : (
            <div className="py-3 bg-gradient-to-r from-primary to-indigo-600 text-white rounded-xl">
              <div className="px-4 mb-2 flex items-center justify-between">
                <span className="text-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  智能搜索中...
                </span>
                <button
                  onClick={stopSmartSearch}
                  className="text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 transition-colors"
                >
                  停止
                </button>
              </div>
              <div className="h-1 bg-white/20">
                <div
                  className="h-full bg-white rounded-r-full transition-all duration-300"
                  style={{ width: `${smartSearchProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Status */}
      {(isLoading || isSearching) && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            <span>正在检索相关信息...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {searchError && (
        <div className="mx-4 mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle size={16} />
            {searchError}
          </div>
        </div>
      )}

      {/* Using mock data notice */}
      {usedMockData && !isLoading && (
        <div className="mx-4 mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertCircle size={16} />
            <span>免费搜索有限，使用示例数据演示。配置 API 可获得更精确的搜索结果。</span>
          </div>
        </div>
      )}

      {/* Results */}
      <main className="flex-1 overflow-y-auto px-4 pb-32">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <SearchResultSkeleton key={i} />
            ))}
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="space-y-3">
            {filteredResults.map(result => (
              <SearchResultCard
                key={result.id}
                result={result}
                selected={selectedResults.includes(result.id)}
                onSelect={() => toggleSelect(result.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-light/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={28} className="text-slate-500" />
            </div>
            <h3 className="font-medium text-lg mb-2">没有找到相关结果</h3>
            <p className="text-slate-400 text-sm mb-6">
              试试调整筛选条件或搜索关键词
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRefresh}
                className="px-4 py-2 border border-surface-light rounded-full text-sm hover:bg-surface-light transition-colors"
              >
                重新搜索
              </button>
              <button
                onClick={handleGenerateMore}
                className="px-4 py-2 bg-primary rounded-full text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Wand2 size={14} />
                AI 生成
              </button>
            </div>
          </div>
        )}
      </main>
        </>
      )}

      {/* Selected count & Action */}
      {selectedResults.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-[480px] mx-auto animate-slide-up">
          <div className="bg-surface border border-primary/50 rounded-2xl p-4 shadow-lg shadow-primary/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check size={14} className="text-white" />
                </div>
                <span className="text-sm">已选择 {selectedResults.length} 项</span>
              </div>
              <button
                onClick={() => setSelectedResults([])}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                清除
              </button>
            </div>
            <button
              onClick={handleAddToSolution}
              className="w-full py-3 bg-gradient-to-r from-primary to-indigo-600 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity touch-scale"
            >
              引用到方案中
            </button>
          </div>
        </div>
      )}

      {/* Usage info */}
      {currentIdea && (
        <div className="fixed bottom-20 left-4 right-4 max-w-[480px] mx-auto pointer-events-none">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <span>今日检索剩余 {state.profile.usage.searchesLimit - state.profile.usage.searchesToday} 次</span>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => navigate('/settings')}
              className="text-primary hover:text-primary/80"
            >
              升级专业版获取无限检索
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
