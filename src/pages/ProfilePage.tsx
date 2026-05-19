import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/useApp';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';
import EditProfileModal from '../components/EditProfileModal';
import { Crown, CreditCard, Bell, Shield, HelpCircle,
  LogOut, Sparkles, Zap, Calendar, Mail,
  MessageCircle, Settings, Key, ChevronRight, Edit2 } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const [memberType, setMemberType] = useState(state.profile.memberType);
  const isLoggedIn = state.profile.isLoggedIn;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState(
    state.profile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=vocoseed'
  );

  // 未登录状态重定向到登录页
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth');
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) {
    return null;
  }

  const handleSaveProfile = (data: { nickname: string; avatar: string }) => {
    setUserAvatar(data.avatar);
    dispatch({
      type: 'SET_PROFILE',
      payload: {
        ...state.profile,
        nickname: data.nickname,
        avatar: data.avatar,
      },
    });
  };

  const memberBenefits = {
    free: [
      '每月10次语音输入',
      '每日5次基础检索',
      '导出带水印',
    ],
    pro: [
      '无限次语音输入',
      '无限次高级检索',
      '无水印导出',
      '优先体验新功能',
    ],
    team: [
      '团队共享创意库',
      '团队追问模型定制',
      '管理员后台',
      'API接入支持',
    ],
  };

  const menuItems = [
    { icon: Key, label: 'API 设置', action: () => navigate('/settings'), badge: '推荐' },
    { icon: Crown, label: '升级专业版', action: () => {
      alert('专业版功能开发中，敬请期待！\n\n即将上线：\n• 无限次语音输入\n• 无限次高级检索\n• 无水印导出\n• 优先体验新功能');
    }, badge: '推荐' },
    { icon: CreditCard, label: '订阅管理', action: () => {
      alert('当前为免费版\n\n专业版定价：¥15/月\n年付更优惠');
    }},
    { icon: Settings, label: '通用设置', action: () => navigate('/settings') },
    { icon: Bell, label: '通知设置', action: () => {
      navigate('/settings');
      setTimeout(() => {
        const tab = document.querySelector('[data-tab="notification"]') as HTMLElement;
        if (tab) tab.click();
      }, 100);
    }},
    { icon: Shield, label: '隐私设置', action: () => {
      alert('隐私设置\n\n• 所有数据仅存储在本地浏览器\n• 不会上传至任何服务器\n• API Key 仅用于调用 AI 服务\n• 可随时清除本地数据');
    }},
    { icon: HelpCircle, label: '帮助与反馈', action: () => {
      alert('帮助与反馈\n\n使用指南：\n1. 点击麦克风开始录制创意\n2. AI 教练会引导你深入思考\n3. 检索相关信息完善方案\n4. 生成最终创意报告\n\n联系我们：vocoseed@example.com');
    }},
    { icon: LogOut, label: '退出登录', action: () => {
      if (confirm('确定要退出登录吗？')) {
        dispatch({
          type: 'SET_PROFILE',
          payload: {
            ...state.profile,
            isLoggedIn: false,
            email: '',
            nickname: '',
          },
        });
        navigate('/');
      }
    }, danger: true },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="我的" />

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Profile Header */}
        <div className="px-6 py-8 text-center">
          <div className="relative inline-block">
            <div className="w-20 h-20 rounded-full border-4 border-surface-light bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
              <img
                src={userAvatar}
                alt="头像"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
              <Edit2 size={14} className="text-white" />
            </button>
            {memberType !== 'free' && (
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Crown size={14} className="text-white" />
              </div>
            )}
          </div>
          <h2 className="font-display font-semibold text-xl mt-4">{state.profile.nickname || state.profile.name}</h2>
          {state.profile.email && (
            <p className="text-sm text-slate-400 mt-1 flex items-center justify-center gap-1">
              <Mail size={12} />
              {state.profile.email}
            </p>
          )}
          <p className="text-sm text-slate-400 mt-1">
            {memberType === 'free' && '免费用户'}
            {memberType === 'pro' && '专业版会员'}
            {memberType === 'team' && '团队版用户'}
          </p>
          
          {memberType === 'free' && (
            <button 
              onClick={() => setMemberType('pro')}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-primary to-indigo-600 rounded-full text-sm font-medium hover:opacity-90 transition-opacity touch-scale"
            >
              升级到专业版
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="px-6 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-surface-light rounded-xl p-3 text-center">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Sparkles size={16} className="text-primary" />
              </div>
              <p className="text-lg font-semibold">{state.profile.stats.totalIdeas}</p>
              <p className="text-xs text-slate-500">创意</p>
            </div>
            <div className="bg-surface border border-surface-light rounded-xl p-3 text-center">
              <div className="w-8 h-8 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <MessageCircle size={16} className="text-secondary" />
              </div>
              <p className="text-lg font-semibold">{state.profile.stats.totalConversations}</p>
              <p className="text-xs text-slate-500">对话</p>
            </div>
            <div className="bg-surface border border-surface-light rounded-xl p-3 text-center">
              <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Calendar size={16} className="text-amber-400" />
              </div>
              <p className="text-lg font-semibold">{state.profile.stats.streak}</p>
              <p className="text-xs text-slate-500">连续天数</p>
            </div>
          </div>
        </div>

        {/* Usage */}
        <div className="px-6 mb-6">
          <div className="bg-surface border border-surface-light rounded-2xl p-4">
            <h3 className="font-display font-semibold text-sm mb-4">本月使用情况</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">语音输入</span>
                  <span>{state.profile.usage.recordingsThisMonth} / {state.profile.usage.recordingsLimit}</span>
                </div>
                <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full"
                    style={{ width: `${(state.profile.usage.recordingsThisMonth / state.profile.usage.recordingsLimit) * 100}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">今日检索</span>
                  <span>{state.profile.usage.searchesToday} / {state.profile.usage.searchesLimit}</span>
                </div>
                <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-secondary to-emerald-400 rounded-full"
                    style={{ width: `${(state.profile.usage.searchesToday / state.profile.usage.searchesLimit) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {memberType === 'free' && (
              <button 
                onClick={() => setMemberType('pro')}
                className="w-full mt-4 py-2 bg-gradient-to-r from-primary/10 to-indigo-500/10 border border-primary/30 rounded-xl text-sm text-primary font-medium hover:bg-primary/20 transition-colors"
              >
                升级解锁无限使用
              </button>
            )}
          </div>
        </div>

        {/* Benefits Preview */}
        {memberType === 'free' && (
          <div className="px-6 mb-6">
            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-primary" />
                <h3 className="font-display font-semibold text-sm">专业版特权</h3>
              </div>
              <ul className="space-y-2">
                {memberBenefits.pro.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-primary/20">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">¥15</span>
                  <span className="text-slate-400 text-sm">/月</span>
                  <span className="ml-2 text-xs text-slate-500">年付更优惠</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="px-6">
          <div className="bg-surface border border-surface-light rounded-2xl overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`w-full flex items-center justify-between p-4 hover:bg-surface-light/30 transition-colors ${
                    index !== menuItems.length - 1 ? 'border-b border-surface-light' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} className={item.danger ? 'text-red-400' : 'text-slate-400'} />
                    <span className={item.danger ? 'text-red-400' : ''}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={18} className="text-slate-500" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* App info */}
        <div className="px-6 mt-8 text-center text-xs text-slate-500">
          <p>VocoSeed v1.0.0</p>
          <p className="mt-1">让每个想法都能生根发芽</p>
        </div>
      </main>

      <BottomNav />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        initialNickname={state.profile.nickname || ''}
        initialAvatar={userAvatar}
      />
    </div>
  );
}
