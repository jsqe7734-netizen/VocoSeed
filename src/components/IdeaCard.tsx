import { formatTime } from '../utils/helpers';
import { cn } from '../utils/helpers';
import { Sparkles, Clock } from 'lucide-react';
import type { Idea } from '../data/types';

interface IdeaCardProps {
  idea: Idea;
  onClick?: () => void;
  compact?: boolean;
}

export default function IdeaCard({ idea, onClick, compact = false }: IdeaCardProps) {
  const statusLabels: Record<Idea['status'], { label: string; color: string; bg: string }> = {
    recording: { label: '录音中', color: 'text-red-500', bg: 'bg-red-50' },
    chatting: { label: '对话中', color: 'text-amber-600', bg: 'bg-amber-50' },
    searching: { label: '检索中', color: 'text-orange-600', bg: 'bg-orange-50' },
    generating: { label: '生成中', color: 'text-pink-600', bg: 'bg-pink-50' },
    completed: { label: '已完成', color: 'text-rose-600', bg: 'bg-rose-50' },
  };

  const status = statusLabels[idea.status];

  if (compact) {
    return (
      <button
        onClick={onClick}
        onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
        className="flex-shrink-0 w-40 card p-4 text-left active:scale-[0.97] hover:border-primary transition-colors"
      >
        <h4 className="font-medium text-sm text-warm-primary truncate mb-2">{idea.title}</h4>
        <div className="flex items-center gap-1 text-xs text-warm-muted">
          <Clock size={12} />
          <span>{formatTime(idea.updatedAt)}</span>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => e.currentTarget.setPointerCapture(e.pointerId)}
      className="w-full card p-5 text-left active:scale-[0.98] hover:border-primary transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-display font-semibold text-base truncate flex-1 mr-3 text-warm-primary">
          {idea.title}
        </h3>
        <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', status.color, status.bg)}>
          {status.label}
        </span>
      </div>

      <p className="text-sm text-warm-muted line-clamp-2 mb-4 leading-relaxed">
        {idea.transcript}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {idea.keywords.slice(0, 2).map(keyword => (
            <span
              key={keyword}
              className="px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-full text-xs text-amber-600"
            >
              {keyword}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-warm-muted">
          <span className="flex items-center gap-1.5">
            <Sparkles size={12} />
            {idea.messages.length}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={12} />
            {formatTime(idea.updatedAt)}
          </span>
        </div>
      </div>

      {idea.status === 'chatting' && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 progress-warm"
                style={{ width: `${idea.progress}%` }}
              />
            </div>
            <span className="text-xs text-warm-muted font-mono">{idea.progress}%</span>
          </div>
        </div>
      )}
    </button>
  );
}

export function IdeaCardSkeleton() {
  return (
    <div className="card p-5 animate-shimmer">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 w-3/4 bg-amber-100/50 rounded" />
        <div className="h-5 w-16 bg-amber-100/50 rounded-full" />
      </div>
      <div className="h-4 w-full bg-amber-100/50 rounded mb-2" />
      <div className="h-4 w-2/3 bg-amber-100/50 rounded mb-4" />
      <div className="flex justify-between">
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-amber-100/50 rounded-full" />
          <div className="h-5 w-20 bg-amber-100/50 rounded-full" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-12 bg-amber-100/50 rounded" />
          <div className="h-4 w-16 bg-amber-100/50 rounded" />
        </div>
      </div>
    </div>
  );
}
