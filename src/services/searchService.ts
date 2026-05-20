// 搜索服务 - 使用模拟数据演示搜索功能

import type { SearchResult } from '../data/types';
import { searchResults as mockResults } from '../data/mockData';

export interface SearchOptions {
  query: string;
  types?: SearchResult['type'][];
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  usedMockData?: boolean;
}

// 根据关键词过滤或生成模拟数据
function generateResultsForQuery(query: string, limit: number): SearchResult[] {
  const queryLower = query.toLowerCase();

  // 过滤现有模拟数据中匹配的
  const matchedResults = mockResults.filter(r =>
    r.title.toLowerCase().includes(queryLower) ||
    r.summary.toLowerCase().includes(queryLower)
  );

  if (matchedResults.length >= limit) {
    return matchedResults.slice(0, limit);
  }

  // 生成更多基于查询的模拟数据
  const additionalResults: SearchResult[] = [];
  const queryWord = query.slice(0, 10) || '智能产品';

  const templates: Record<SearchResult['type'], { title: string; source: string; summary: string }[]> = {
    paper: [
      { title: `${queryWord}相关学术研究综述`, source: '学术数据库', summary: `本文综述了${queryWord}领域的最新研究进展，探讨了技术创新、市场应用和发展趋势。` },
      { title: `基于${queryWord}的创新方法研究`, source: '科研论文', summary: `研究发现，通过优化${queryWord}可以显著提升产品性能和用户体验。` },
    ],
    patent: [
      { title: `一种${queryWord}智能系统`, source: '国家知识产权局', summary: `本专利公开了一种新型${queryWord}系统，具有高效、智能、节能等特点。` },
      { title: `${queryWord}关键技术专利`, source: '专利数据库', summary: `该专利保护了${queryWord}的核心算法和技术实现方案。` },
    ],
    product: [
      { title: `${queryWord}竞品分析报告`, source: '市场调研', summary: `分析市场上主流${queryWord}产品的功能特点、价格定位和用户反馈。` },
      { title: `2024年${queryWord}行业白皮书`, source: '行业报告', summary: `全面解读${queryWord}行业现状、竞争格局和未来发展趋势。` },
    ],
    report: [
      { title: `${queryWord}市场深度分析`, source: '市场研究机构', summary: `深入分析${queryWord}市场规模、增长率、主要厂商和投资机会。` },
      { title: `${queryWord}用户需求洞察`, source: '用户研究', summary: `通过问卷和访谈，揭示用户对${queryWord}的真实需求和痛点。` },
    ],
  };

  const types: SearchResult['type'][] = ['paper', 'patent', 'product', 'report'];
  for (const type of types) {
    const templatesForType = templates[type];
    for (let i = 0; i < templatesForType.length && additionalResults.length < limit; i++) {
      const template = templatesForType[i];
      additionalResults.push({
        id: `generated-${type}-${i}-${Date.now()}`,
        type,
        title: template.title,
        source: template.source,
        summary: template.summary,
        cited: Math.floor(Math.random() * 100),
        year: 2024,
      });
    }
  }

  return [...matchedResults, ...additionalResults].slice(0, limit);
}

class SearchService {
  async search(options: SearchOptions): Promise<SearchResponse> {
    const { query, types = ['paper', 'patent', 'product', 'report'], limit = 10 } = options;

    let results: SearchResult[] = [];
    let usedMockData = false;
    
    try {
      const tavilyApiKey = import.meta.env.VITE_TAVILY_API_KEY;
      
      if (!tavilyApiKey) {
        console.warn('VITE_TAVILY_API_KEY not configured, falling back to mock data.');
        usedMockData = true;
      } else {
        console.log('Tavily API key found, attempting to fetch real search results...');
        
        const response = await fetch('/tavily-search/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: tavilyApiKey,
            query: query,
            search_depth: 'basic',
            max_results: limit,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Tavily API response received:', data);
          
          if (data.results && Array.isArray(data.results) && data.results.length > 0) {
            results = data.results.map((item: any, index: number) => {
              let source = 'Tavily Search';
              try {
                if (item.url) {
                  const urlObj = new URL(item.url);
                  source = urlObj.hostname.replace('www.', '');
                }
              } catch (e) {}

              return {
                id: `tavily-${index}-${Date.now()}`,
                type: ['paper', 'patent', 'product', 'report'][index % 4] as any,
                title: item.title || '无标题',
                source: source,
                summary: item.content || '无摘要',
                url: item.url,
                cited: Math.floor(Math.random() * 500),
                year: new Date().getFullYear(),
              };
            });
          } else {
            console.warn('Tavily API returned empty results, falling back to mock data.');
            usedMockData = true;
          }
        } else {
          const errorText = await response.text();
          console.error('Tavily API returned error:', response.status, errorText);
          usedMockData = true;
        }
      }
    } catch (e) {
      console.error("Search API failed:", e);
      usedMockData = true;
    }

    if (usedMockData || results.length === 0) {
      results = generateResultsForQuery(query, limit * 2);
    }

    if (types.length > 0 && types.length < 4) {
      results = results.filter(r => types.includes(r.type));
    }

    return {
      results: results.slice(0, limit),
      total: results.length,
      hasMore: results.length >= limit,
      usedMockData: usedMockData,
    };
  }
}

// 导出搜索服务实例
export const searchService = new SearchService();

// 辅助函数：根据关键词提取搜索建议
export function generateSearchQueries(transcript: string, keywords: string[]): string[] {
  const queries: string[] = [];

  // 从原始想法中提取关键概念
  const concepts = transcript
    .replace(/我想做一个?/g, '')
    .replace(/我想开发/g, '')
    .replace(/我想做/g, '')
    .split(/[，。、？!,]/)
    .filter(s => s.length > 2)
    .map(s => s.trim());

  queries.push(...concepts);
  queries.push(...keywords);

  // 添加一些组合查询
  if (concepts.length > 0) {
    queries.push(`${concepts[0]} 竞品分析`);
    queries.push(`${concepts[0]} 市场现状`);
  }

  return [...new Set(queries)].slice(0, 5);
}
