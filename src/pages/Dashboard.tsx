import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, MessageSquare, Settings, Calendar, Globe, Compass, GitCompare } from 'lucide-react';
import { api } from '../lib/api';
import LearningTab from './tabs/LearningTab';
import PlannerTab from './tabs/PlannerTab';
import ChatTab from './tabs/ChatTab';
import SettingsTab from './tabs/SettingsTab';
import SocialReviewTab from './tabs/SocialReviewTab';
import GuidanceTab from './tabs/GuidanceTab';
import CompareTab from './tabs/CompareTab';

export default function Dashboard() {
  const navigate = useNavigate();
  const [hasUser] = useState(() => Boolean(localStorage.getItem('smarm_user')));

  useEffect(() => {
    if (!hasUser) {
      navigate('/auth', { replace: true });
      return;
    }
    let active = true;
    // Cookie có thể hết hạn dù localStorage còn dữ liệu cũ.
    void api.session()
      .then((session) => {
        if (!active || session?.user) return;
        if (session?.httpStatus === 401) {
          localStorage.removeItem('smarm_user');
          navigate('/auth', { replace: true });
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [hasUser, navigate]);

  const getDefaultTab = (): string => {
    const answers = localStorage.getItem('smarm_answers');
    const aspirations = localStorage.getItem('smarm_aspirations');
    const guidanceResults = localStorage.getItem('smarm_guidance_results');
    const hasAnswers = answers && answers !== 'null' && answers.trim() !== '{}' && answers.trim() !== '[]';
    const hasAspirations = aspirations && aspirations !== 'null' && aspirations.trim() !== '[]' && aspirations.trim() !== '{}';
    const hasGuidanceResults = guidanceResults && guidanceResults !== 'null';
    if (hasAnswers && !hasAspirations) return 'guidance';
    if (hasGuidanceResults) return 'guidance';
    return 'learning';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab);

  useEffect(() => {
    const defaultTab = getDefaultTab();
    window.history.replaceState({ tab: defaultTab }, '', '');

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTab(event.state.tab);
      } else {
        setActiveTab(getDefaultTab());
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tabId: string) => {
    if (activeTab !== tabId) {
      window.history.pushState({ tab: tabId }, '', '');
      setActiveTab(tabId);
    }
  };

  const handleGuidanceComplete = () => {
    handleTabChange('learning');
  };

  const getTabColor = (tabId: string) => {
    const mapping: Record<string, string> = {
      guidance: "bg-orange-pop",
      learning: "bg-green-pop",
      planner: "bg-purple-pop",
      social: "bg-blue-pop",
      compare: "bg-pink-pop",
      chat: "bg-cyan-pop",
      settings: "bg-yellow-pop",
    };
    return mapping[tabId] || "bg-yellow-pop";
  };

  const tabs = [
    { id: 'guidance', label: 'Tư vấn', icon: Compass },
    { id: 'learning', label: 'Học tập', icon: BookOpen },
    { id: 'planner', label: 'Lộ trình', icon: Calendar },
    { id: 'social', label: 'Góc nhìn', icon: Globe },
    { id: 'compare', label: 'So sánh', icon: GitCompare },
    { id: 'chat', label: 'Smarm AI', icon: MessageSquare },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  if (!hasUser) return null;

  return (
    <div className="h-screen bg-brutal-paper flex flex-col font-sans overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Keep ChatTab mounted at all times to prevent data loss or stream interruption when switching tabs */}
        <div
          className="h-full"
          style={{ display: activeTab === 'chat' ? 'block' : 'none' }}
        >
          <ChatTab onBack={() => handleTabChange('learning')} />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'guidance' && (
            <motion.div
              key="guidance"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto pb-24"
            >
              <GuidanceTab onComplete={handleGuidanceComplete} />
            </motion.div>
          )}
          {activeTab === 'learning' && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto pb-24"
            >
              <LearningTab />
            </motion.div>
          )}
          {activeTab === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto pb-24"
            >
              <PlannerTab />
            </motion.div>
          )}
          {activeTab === 'social' && (
            <motion.div
              key="social"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto pb-24"
            >
              <SocialReviewTab />
            </motion.div>
          )}
          {activeTab === 'compare' && (
            <motion.div
              key="compare"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto pb-24"
            >
              <CompareTab />
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto pb-24"
            >
              <SettingsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Brutalist Bottom Navigation */}
      <AnimatePresence>
        {activeTab !== 'chat' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:bottom-6 md:flex md:justify-center md:px-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full md:w-auto bg-white border-t-[4px] md:border-[4px] border-black md:shadow-[6px_6px_0_#000] grid grid-cols-7 md:flex md:items-center md:gap-2 px-1 pb-[env(safe-area-inset-bottom)] md:p-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    aria-label={tab.label}
                    aria-current={isActive ? 'page' : undefined}
                    title={tab.label}
                    className={`relative flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-0.5 py-2 md:px-6 md:py-4 transition-all duration-200 border-[3px] border-transparent uppercase min-w-0 ${
                      isActive
                        ? 'text-black font-black'
                        : 'text-black/70 font-bold hover:bg-black hover:text-white hover:border-black'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBrutal"
                        className={`absolute inset-0 border-[3px] border-black md:shadow-[4px_4px_0_#000] ${getTabColor(tab.id)}`}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        style={{ zIndex: 0 }}
                      />
                    )}
                    <span className="relative z-10 flex flex-col md:flex-row items-center gap-0.5 md:gap-2 min-w-0">
                      <Icon className="w-5 h-5 flex-shrink-0 stroke-[3px]" />
                      <span className="text-[9px] md:text-sm leading-none tracking-tight md:tracking-wide truncate max-w-full">
                        {tab.label}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
