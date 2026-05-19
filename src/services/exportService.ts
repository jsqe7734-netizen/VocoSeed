import type { Idea } from '../data/types';

// 生成 Markdown 格式
export function exportToMarkdown(idea: Idea): string {
  const header = `# ${idea.title}\n\n`;
  const meta = `> **创建时间**: ${new Date(idea.createdAt).toLocaleString('zh-CN')}
> **状态**: ${getStatusText(idea.status)}
> **进度**: ${idea.progress}%\n\n---\n\n`;
  
  const transcript = idea.transcript ? `## 原始语音转录\n\n${idea.transcript}\n\n---\n\n` : '';
  
  const messages = idea.messages.length > 0 ? `## 对话记录\n\n${
    idea.messages.map(msg => {
      const role = msg.role === 'user' ? '👤 用户' : '🤖 AI';
      const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN');
      return `### ${role} - ${time}\n\n${msg.content}\n`;
    }).join('\n')
  }\n\n---\n\n` : '';
  
  const searchResults = idea.searchResults.length > 0 ? `## 搜索结果\n\n${
    idea.searchResults.map((result, index) => {
      return `${index + 1}. **[${result.title}](${result.url || '#'})**
   - 类型: ${getResultTypeText(result.type)}
   - 来源: ${result.source || '未知'}
   ${result.year ? `- 年份: ${result.year}` : ''}
   ${result.cited ? `- 引用次数: ${result.cited}` : ''}
   
   ${result.summary || '暂无摘要'}\n`;
    }).join('\n')
  }\n\n---\n\n` : '';
  
  const keywords = idea.keywords.length > 0 ? `## 关键词\n\n${idea.keywords.map(k => `- ${k}`).join('\n')}\n\n` : '';
  
  const footer = `\n---\n\n*由 VocoSeed 生成*\n`;
  
  return header + meta + transcript + messages + searchResults + keywords + footer;
}

// 生成纯文本格式
export function exportToText(idea: Idea): string {
  const lines: string[] = [];
  
  lines.push('='.repeat(50));
  lines.push(idea.title);
  lines.push('='.repeat(50));
  lines.push('');
  lines.push(`创建时间: ${new Date(idea.createdAt).toLocaleString('zh-CN')}`);
  lines.push(`状态: ${getStatusText(idea.status)}`);
  lines.push(`进度: ${idea.progress}%`);
  lines.push('');
  
  if (idea.transcript) {
    lines.push('-'.repeat(50));
    lines.push('原始语音转录');
    lines.push('-'.repeat(50));
    lines.push(idea.transcript);
    lines.push('');
  }
  
  if (idea.messages.length > 0) {
    lines.push('-'.repeat(50));
    lines.push('对话记录');
    lines.push('-'.repeat(50));
    idea.messages.forEach(msg => {
      const role = msg.role === 'user' ? '用户' : 'AI';
      const time = new Date(msg.timestamp).toLocaleTimeString('zh-CN');
      lines.push(`[${role}] ${time}: ${msg.content}`);
      lines.push('');
    });
  }
  
  if (idea.searchResults.length > 0) {
    lines.push('-'.repeat(50));
    lines.push('搜索结果');
    lines.push('-'.repeat(50));
    idea.searchResults.forEach((result, index) => {
      lines.push(`${index + 1}. ${result.title}`);
      lines.push(`   类型: ${getResultTypeText(result.type)}`);
      lines.push(`   来源: ${result.source || '未知'}`);
      if (result.summary) {
        lines.push(`   摘要: ${result.summary}`);
      }
      lines.push('');
    });
  }
  
  if (idea.keywords.length > 0) {
    lines.push('-'.repeat(50));
    lines.push('关键词');
    lines.push('-'.repeat(50));
    lines.push(idea.keywords.join(', '));
    lines.push('');
  }
  
  lines.push('='.repeat(50));
  lines.push('由 VocoSeed 生成');
  
  return lines.join('\n');
}

// 下载文件
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 导出为 Markdown
export function exportIdeaAsMarkdown(idea: Idea) {
  const content = exportToMarkdown(idea);
  const filename = `${sanitizeFilename(idea.title)}_${formatDate(idea.createdAt)}.md`;
  downloadFile(content, filename, 'text/markdown;charset=utf-8');
}

// 导出为纯文本
export function exportIdeaAsText(idea: Idea) {
  const content = exportToText(idea);
  const filename = `${sanitizeFilename(idea.title)}_${formatDate(idea.createdAt)}.txt`;
  downloadFile(content, filename, 'text/plain;charset=utf-8');
}

// 辅助函数
function getStatusText(status: Idea['status']): string {
  const statusMap: Record<Idea['status'], string> = {
    recording: '录制中',
    chatting: '对话中',
    searching: '检索中',
    generating: '生成中',
    completed: '已完成',
  };
  return statusMap[status] || status;
}

function getResultTypeText(type: string): string {
  const typeMap: Record<string, string> = {
    patent: '专利',
    paper: '论文',
    product: '产品',
    report: '报告',
  };
  return typeMap[type] || type;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50);
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
}
