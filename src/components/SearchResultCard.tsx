import { cn } from '../utils/helpers';
import type { SearchResult } from '../data/types';
import { FileText, BookOpen, ShoppingBag, BarChart3, Check } from 'lucide-react';

interface SearchResultCardProps {
  result: SearchResult;
  selected?: boolean;
  onSelect?: () => void;
}

const typeConfig: Record<SearchResult['type'], { 
  icon: typeof FileText;
  color: string;
  bgColor: string;
  label: string;
}> = {
  patent: {
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    label: '专利'
  },
  paper: {
    icon: BookOpen,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    label: '论文'
  },
  product: {
    icon: ShoppingBag,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    label: '产品'
  },
  report: {
    icon: BarChart3,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    label: '报告'
  },
};

export default function SearchResultCard({ result, selected, onSelect }: SearchResultCardProps) {
  const config = typeConfig[result.type];
  const Icon = config.icon;

  return (
    <div
      onClick={onSelect}
      className={cn(
        'w-full text-left p-4 rounded-xl border transition-all touch-scale relative cursor-pointer group',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-surface-light bg-surface hover:border-surface-light/80'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2 rounded-lg', config.bgColor)}>
          <Icon size={18} className={config.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', config.bgColor, config.color)}>
              {config.label}
            </span>
            {result.year && (
              <span className="text-xs text-slate-500">{result.year}</span>
            )}
            {result.cited && (
              <span className="text-xs text-slate-500">被引 {result.cited}</span>
            )}
          </div>

          {result.url ? (
            <a 
              href={result.url} 
              target="_blank" 
              rel="noreferrer" 
              onClick={(e) => e.stopPropagation()} 
              className="font-medium text-sm mb-1 line-clamp-1 hover:text-primary hover:underline"
            >
              {result.title}
            </a>
          ) : (
            <h4 className="font-medium text-sm mb-1 line-clamp-1">{result.title}</h4>
          )}
          <p className="text-xs text-slate-500 mb-2">{result.source}</p>
          <p className="text-sm text-slate-400 line-clamp-2">{result.summary}</p>
        </div>

        <div 
          className="flex flex-col items-center gap-2 cursor-pointer h-full justify-center px-2"
          onClick={onSelect}
        >
          {selected ? (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border border-surface-light flex items-center justify-center">
              <Check size={14} className="text-transparent" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchResultSkeleton() {
  return (
    <div className="bg-surface border border-surface-light rounded-xl p-4 animate-shimmer">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-light" />
        <div className="flex-1">
          <div className="h-4 w-20 bg-surface-light rounded mb-2" />
          <div className="h-5 w-3/4 bg-surface-light rounded mb-2" />
          <div className="h-4 w-1/2 bg-surface-light rounded mb-2" />
          <div className="h-4 w-full bg-surface-light rounded" />
        </div>
      </div>
    </div>
  );
}

interface FilterTabsProps {
  activeFilter: SearchResult['type'] | 'all';
  onFilterChange: (filter: SearchResult['type'] | 'all') => void;
}

export function FilterTabs({ activeFilter, onFilterChange }: FilterTabsProps) {
  const filters: { value: SearchResult['type'] | 'all'; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'patent', label: '专利' },
    { value: 'paper', label: '论文' },
    { value: 'product', label: '产品' },
    { value: 'report', label: '报告' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map(filter => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all touch-scale',
            activeFilter === filter.value
              ? 'bg-primary text-white'
              : 'bg-surface border border-surface-light text-slate-400 hover:text-slate-200'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
