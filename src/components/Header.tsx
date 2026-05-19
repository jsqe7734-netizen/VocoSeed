import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  transparent?: boolean;
}

export default function Header({
  title,
  showBack = false,
  rightAction,
  transparent = false
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className={`sticky top-0 z-40 ${transparent ? '' : 'glass border-b border-border-light'}`}>
      <div className="max-w-[480px] mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2 min-w-[60px]">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-amber-50 transition-colors touch-scale active:scale-95"
            >
              <ArrowLeft size={22} className="text-warm-secondary" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        <h1 className="font-display font-semibold text-base text-warm-primary truncate">
          {title}
        </h1>

        <div className="flex items-center gap-1 min-w-[60px] justify-end">
          {rightAction || <div className="w-10" />}
        </div>
      </div>
    </header>
  );
}
