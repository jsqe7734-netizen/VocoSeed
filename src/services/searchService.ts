// 搜索服务

import type { SearchResult } from '../data/types';
import { searchResults as mockResults } from '../data/mockData';

export interface SearchOptions {
  query: string;
  types?: SearchResult['type'][];
  limit?: number;
  offset?: number;
  allowMockData?: boolean; // 是否允许使用模拟数据兜底，默认为true
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  hasMore: boolean;
  usedMockData?: boolean;
}

// 繁简体转换 - 使用 Unicode 正则范围检测和转换
function convertToSimplified(text: string): string {
  if (!text) return text;
  
  // 定义常用繁体字到简体字的映射
  const charMap: Record<string, string> = {
    '獲': '获', '權': '权', '與': '与', '為': '为', '國': '国', '學': '学',
    '進': '进', '發': '发', '業': '业', '經': '经', '營': '营', '動': '动',
    '態': '态', '種': '种', '類': '类', '統': '统', '計': '计', '劃': '划',
    '認': '认', '識': '识', '確': '确', '應': '应', '適': '适', '屬': '属',
    '能': '能', '功': '功', '成': '成', '作': '作', '用': '用', '使': '使',
    '得': '得', '取': '取', '到': '到', '達': '达', '展': '展', '示': '示',
    '表': '表', '傳': '传', '系': '系', '列': '列', '舉': '举', '辦': '办',
    '理': '理', '解': '解', '決': '决', '定': '定', '比': '比', '較': '较',
    '別': '别', '區': '区', '域': '域', '領': '领', '導': '导', '指': '指',
    '揮': '挥', '範': '范', '圍': '围', '周': '周', '期': '期', '望': '望',
    '希': '希', '臘': '腊', '份': '份', '額': '额', '金': '金', '融': '融',
    '合': '合', '該': '该', '當': '当', '前': '前', '面': '面', '對': '对',
    '待': '待', '等': '等', '於': '于', '關': '关', '係': '系', '釋': '释',
    '放': '放', '棄': '弃', '拋': '抛', '卻': '却', '目': '目', '標': '标',
    '誌': '志', '雜': '杂', '複': '复', '重': '重', '要': '要', '需': '需',
    '求': '求', '請': '请', '邀': '邀', '約': '约', '實': '实', '際': '际',
    '家': '家', '庭': '庭', '院': '院', '醫': '医', '生': '生', '活': '活',
    '過': '过', '去': '去', '掉': '掉', '落': '落', '情': '情', '況': '况',
    '狀': '状', '何': '何', '如': '如', '果': '果', '結': '结', '者': '者',
    '讀': '读', '閱': '阅', '歷': '历', '史': '史', '詩': '诗', '歌': '歌',
    '唱': '唱', '曲': '曲', '折': '折', '扣': '扣', '除': '除', '排': '排',
    '起': '起', '來': '来', '力': '力', '量': '量', '數': '数', '習': '习',
    '慣': '惯', '質': '质', '據': '据', '根': '根', '本': '本', '衡': '衡',
    '平': '平', '安': '安', '全': '全', '部': '部', '分': '分', '析': '析',
    '策': '策', '略': '略', '戰': '战', '爭': '争', '競': '竞', '賽': '赛',
    '規': '规', '則': '则', '原': '原', '因': '因', '此': '此', '時': '时',
    '間': '间', '空': '空', '氣': '气', '體': '体', '積': '积', '累': '累',
    '算': '算', '法': '法', '方': '方', '行': '行', '服': '服', '裝': '装',
    '備': '备', '準': '准', '心': '心', '觀': '观', '察': '察', '覺': '觉',
    '感': '感', '緒': '绪', '頭': '头', '腦': '脑', '電': '电', '子': '子',
    '女': '女', '從': '从', '新': '新', '亂': '乱', '混': '混', '工': '工',
    '程': '程', '序': '序', '順': '顺', '利': '利', '益': '益', '處': '处',
    '論': '论', '討': '讨', '探': '探', '索': '索', '搜': '搜', '集': '集',
    '件': '件', '條': '条', '款': '款', '項': '项', '案': '案', '例': '例',
    '協': '协', '調': '调', '務': '务', '醒': '醒', '長': '长', '努': '努',
  };

  let result = text;
  for (const [char, simplified] of Object.entries(charMap)) {
    result = result.replace(new RegExp(char, 'g'), simplified);
  }
  return result;
}

// 内容安全过滤函数
function filterPositiveContent(results: SearchResult[]): SearchResult[] {
  return results.filter(result => {
    const allText = (result.title + ' ' + result.summary + ' ' + result.source).toLowerCase();
    const hasMaliciousPattern = 
      allText.includes('anti-china') ||
      allText.includes('anti-chinese') ||
      allText.includes('dictatorship') ||
      allText.includes('反动') ||
      allText.includes('抹黑') ||
      allText.includes('造谣') ||
      allText.includes('诽谤') ||
      allText.includes('攻击') ||
      allText.includes('色情') ||
      allText.includes('暴力') ||
      allText.includes('恐怖') ||
      allText.includes('血腥') ||
      allText.includes('fuck') ||
      allText.includes('shit') ||
      allText.includes('bitch') ||
      allText.includes('damn') ||
      allText.includes('asshole');
    return !hasMaliciousPattern;
  });
}

// 生成模拟数据
function generateResultsForQuery(query: string, limit: number): SearchResult[] {
  const queryLower = query.toLowerCase();
  const matchedResults = mockResults.filter(r =>
    r.title.toLowerCase().includes(queryLower) ||
    r.summary.toLowerCase().includes(queryLower)
  );
  if (matchedResults.length >= limit) {
    return matchedResults.slice(0, limit);
  }
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
  private async searchWithGitHub(query: string, limit: number): Promise<SearchResult[]> {
    try {
      console.log('Trying GitHub search...');
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://api.github.com/search/repositories?q=${encodedQuery}&per_page=${limit}`,
        { method: 'GET', headers: { 'Accept': 'application/vnd.github.v3+json' } }
      );
      if (response.ok) {
        const data = await response.json();
        console.log('GitHub API response received:', data);
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          return data.items.slice(0, limit).map((item: any, index: number) => ({
            id: `github-${index}-${Date.now()}`,
            type: 'product',
            title: item.name || '无标题',
            source: 'github.com',
            summary: item.description || '无描述',
            url: item.html_url,
            cited: item.stargazers_count || Math.floor(Math.random() * 100),
            year: item.created_at ? new Date(item.created_at).getFullYear() : new Date().getFullYear(),
          }));
        }
      }
    } catch (e) {
      console.error('GitHub search failed:', e);
    }
    return [];
  }

  private async searchWithNews(query: string, limit: number): Promise<SearchResult[]> {
    const newsApiKey = import.meta.env.VITE_NEWS_API_KEY;
    if (!newsApiKey) return [];
    try {
      console.log('Trying NewsAPI search...');
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodedQuery}&pageSize=${limit}&apiKey=${newsApiKey}`,
        { method: 'GET', headers: { 'Accept': 'application/json' } }
      );
      if (response.ok) {
        const data = await response.json();
        console.log('NewsAPI response received:', data);
        if (data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
          return data.articles.slice(0, limit).map((item: any, index: number) => ({
            id: `news-${index}-${Date.now()}`,
            type: 'report',
            title: item.title || '无标题',
            source: item.source?.name || 'NewsAPI',
            summary: item.description || '无摘要',
            url: item.url,
            cited: Math.floor(Math.random() * 50),
            year: new Date().getFullYear(),
          }));
        }
      }
    } catch (e) {
      console.error('NewsAPI search failed:', e);
    }
    return [];
  }

  private async searchWithTavily(query: string, limit: number): Promise<SearchResult[]> {
    const tavilyApiKey = import.meta.env.VITE_TAVILY_API_KEY;
    if (!tavilyApiKey) return [];
    try {
      console.log('Trying Tavily search...');
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: tavilyApiKey, query, search_depth: 'basic', max_results: limit }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Tavily API response received:', data);
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          return data.results.map((item: any, index: number) => {
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
              source,
              summary: item.content || '无摘要',
              url: item.url,
              cited: Math.floor(Math.random() * 500),
              year: new Date().getFullYear(),
            };
          });
        }
      } else {
        const errorText = await response.text();
        console.error('Tavily API returned error:', response.status, errorText);
      }
    } catch (e) {
      console.error('Tavily search failed:', e);
    }
    return [];
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    const { query, types = ['paper', 'patent', 'product', 'report'], limit = 10, allowMockData = true } = options;
    let results: SearchResult[] = [];
    let usedMockData = false;
    let source: string = 'mock';
    
    try {
      const tavilyResults = await this.searchWithTavily(query, Math.ceil(limit * 0.6));
      if (tavilyResults.length > 0) {
        results = [...results, ...tavilyResults];
        source = 'tavily';
      }
      if (results.length < limit) {
        const githubResults = await this.searchWithGitHub(query, limit - results.length);
        if (githubResults.length > 0) {
          results = [...results, ...githubResults];
          source = source === 'mock' ? 'github' : `${source}+github`;
        }
      }
      if (results.length < limit) {
        const newsResults = await this.searchWithNews(query, limit - results.length);
        if (newsResults.length > 0) {
          results = [...results, ...newsResults];
          source = source === 'mock' ? 'newsapi' : `${source}+newsapi`;
        }
      }
      if (results.length === 0) {
        console.warn('All search APIs failed');
      }
    } catch (e) {
      console.error('Search failed:', e);
    }

    // 只有在允许模拟数据且真实搜索没有结果时，才使用模拟数据
    if (allowMockData && results.length === 0) {
      console.log('Using mock data since no real results found');
      results = generateResultsForQuery(query, limit * 2);
      usedMockData = true;
    }

    if (types.length > 0 && types.length < 4) {
      results = results.filter(r => types.includes(r.type));
    }

    const beforeFilterCount = results.length;
    results = filterPositiveContent(results);
    if (beforeFilterCount > results.length) {
      console.log(`Filtered out ${beforeFilterCount - results.length} negative results`);
    }

    const convertedResults = results.map(result => ({
      ...result,
      title: convertToSimplified(result.title),
      summary: convertToSimplified(result.summary),
    }));

    console.log(`Search completed: ${convertedResults.length} results from ${source}`);
    
    return {
      results: convertedResults.slice(0, limit),
      total: convertedResults.length,
      hasMore: convertedResults.length >= limit,
      usedMockData,
    };
  }
}

export const searchService = new SearchService();

export function generateSearchQueries(transcript: string, keywords: string[]): string[] {
  const queries: string[] = [];
  const concepts = transcript
    .replace(/我想做一个?/g, '')
    .replace(/我想开发/g, '')
    .replace(/我想做/g, '')
    .split(/[，。、？!,]/)
    .filter(s => s.length > 2)
    .map(s => s.trim());
  queries.push(...concepts);
  queries.push(...keywords);
  if (concepts.length > 0) {
    queries.push(`${concepts[0]} 竞品分析`);
    queries.push(`${concepts[0]} 市场现状`);
  }
  return [...new Set(queries)].slice(0, 5);
}
