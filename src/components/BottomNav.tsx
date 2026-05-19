import { NavLink } from 'react-router-dom';
import { Mic, MessageCircle, Search, History, User, UserPlus } from 'lucide-react';
import { useApp } from '../context/useApp';

export default function BottomNav() {
  const { state } = useApp();
  const isLoggedIn = state.profile.isLoggedIn;

  const navItems = [
    { path: '/', icon: Mic, label: '首页' },
    { path: '/chat', icon: MessageCircle, label: '对话' },
    { path: '/search', icon: Search, label: '检索' },
    { path: '/history', icon: History, label: '历史' },
    { path: isLoggedIn ? '/profile' : '/auth', icon: isLoggedIn ? User : UserPlus, label: isLoggedIn ? '我的' : '账号' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-primary/10">
      <div className="max-w-[430px] mx-auto flex justify-around items-center h-16 relative">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-14 h-full transition-all duration-200 active:scale-90 relative ${
                isActive
                  ? 'text-primary-light'
                  : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`relative transition-all duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-light rounded-full animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 font-medium tracking-wide">{label}</span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full opacity-80" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
