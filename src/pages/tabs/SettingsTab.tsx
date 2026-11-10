import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, RotateCcw, Award, Settings as SettingsIcon, Heart, GraduationCap, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { readJson } from '../../lib/localData';

export default function SettingsTab() {
  const [user, setUser] = useState<any>(null);
  const [hollandCode, setHollandCode] = useState<string>('');
  const [attitudeMode, setAttitudeMode] = useState<'friend' | 'teacher' | 'parent'>('friend');
  const [showConfirmRetake, setShowConfirmRetake] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = readJson<{ name?: string; username?: string } | null>('smarm_user', null);
    const answersData = localStorage.getItem('smarm_answers');
    const savedMode = localStorage.getItem('smarm_attitude_mode') as 'friend' | 'teacher' | 'parent' | null;
    
    if (userData && typeof userData === 'object') setUser(userData);
    if (savedMode === 'friend' || savedMode === 'teacher' || savedMode === 'parent') {
      setAttitudeMode(savedMode);
    }
    
    if (answersData) {
      setHollandCode('Đã hoàn thành');
    }
  }, []);

  const syncAllData = async () => {
    try {
      await api.syncUserData();
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  const clearUserData = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('smarm_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  const handleLogout = async () => {
    await syncAllData();
    await api.logout().catch((error) => console.error('Logout error:', error));
    clearUserData();
    navigate('/auth', { replace: true });
  };

  const handleRetakeTest = async () => {
    localStorage.removeItem('smarm_answers');
    localStorage.removeItem('smarm_aspirations');
    localStorage.removeItem('smarm_grades');
    localStorage.removeItem('smarm_target_subjects');
    localStorage.removeItem('smarm_target_method');
    localStorage.removeItem('smarm_dgnl_score');
    localStorage.removeItem('smarm_ai_analysis');
    localStorage.removeItem('smarm_chat_sessions');
    await syncAllData();
    navigate('/test');
  };

  const changeMode = (mode: 'friend' | 'teacher' | 'parent') => {
    setAttitudeMode(mode);
    localStorage.setItem('smarm_attitude_mode', mode);
    syncAllData();
  };

  if (!user) return null;

  return (
    <div className="p-6 md:p-10 pb-24 md:pb-32 max-w-7xl mx-auto">
      <div className="flex items-center mb-10 pb-4 border-b-[4px] border-black">
        <div className="w-12 h-12 bg-[var(--color-yellow-pop)] border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000]">
          <SettingsIcon className="w-6 h-6 text-black stroke-[3px]" />
        </div>
        <h1 className="text-4xl font-black text-black uppercase tracking-tight">Cài đặt</h1>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="brutal-card bg-white p-6 md:p-8 flex items-center">
          <div className="w-20 h-20 bg-[var(--color-primary)] border-[3px] border-black flex items-center justify-center text-black mr-6 shadow-[4px_4px_0_#000]">
            <User className="w-10 h-10 stroke-[3px]" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-black uppercase tracking-tight">{user.name}</h2>
            <p className="text-lg font-bold text-black/70 bg-[var(--color-yellow-pop)] px-2 mt-1 border-[2px] border-black inline-block">{user.username}</p>
          </div>
        </div>

        {/* AI Personality Mode */}
        <div className="brutal-card bg-white p-6 md:p-8">
          <h3 className="text-2xl font-black text-black mb-4 uppercase tracking-tight flex items-center">
            <span className="bg-black w-3 h-3 mr-3 inline-block"></span>
            Chế độ AI Chat
          </h3>
          <p className="text-base font-bold text-black/80 mb-6 border-l-[4px] border-[var(--color-primary)] pl-3">Chọn cách AI giao tiếp và hỗ trợ bạn trong quá trình học tập.</p>
          
          <div className="grid sm:grid-cols-3 gap-6">
            <button
              onClick={() => changeMode('friend')}
              className={`p-6 border-[3px] border-black text-left transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-[var(--color-background)] ${
                attitudeMode === 'friend' ? 'bg-[var(--color-yellow-pop)] shadow-[4px_4px_0_#000]' : 'bg-white shadow-[4px_4px_0_#000]'
              }`}
            >
              <div className={`w-10 h-10 border-[3px] border-black flex items-center justify-center mb-4 ${attitudeMode === 'friend' ? 'bg-black text-white' : 'bg-white text-black'}`}>
                <Heart className="w-5 h-5 stroke-[3px]" />
              </div>
              <h4 className="font-black text-xl text-black mb-2 uppercase">Người bạn</h4>
              <p className="text-sm font-bold text-black/80">Thân thiện, động viên, dùng ngôn ngữ gen Z.</p>
            </button>
            
            <button
              onClick={() => changeMode('teacher')}
              className={`p-6 border-[3px] border-black text-left transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-[var(--color-background)] ${
                attitudeMode === 'teacher' ? 'bg-[var(--color-blue-pop)] shadow-[4px_4px_0_#000]' : 'bg-white shadow-[4px_4px_0_#000]'
              }`}
            >
              <div className={`w-10 h-10 border-[3px] border-black flex items-center justify-center mb-4 ${attitudeMode === 'teacher' ? 'bg-black text-white' : 'bg-white text-black'}`}>
                <GraduationCap className="w-5 h-5 stroke-[3px]" />
              </div>
              <h4 className="font-black text-xl text-black mb-2 uppercase">Giáo viên</h4>
              <p className="text-sm font-bold text-black/80">Nghiêm túc, định hướng rõ ràng, chuyên môn cao.</p>
            </button>
            
            <button
              onClick={() => changeMode('parent')}
              className={`p-6 border-[3px] border-black text-left transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-[var(--color-background)] ${
                attitudeMode === 'parent' ? 'bg-[var(--color-red-pop)] shadow-[4px_4px_0_#000]' : 'bg-white shadow-[4px_4px_0_#000]'
              }`}
            >
              <div className={`w-10 h-10 border-[3px] border-black flex items-center justify-center mb-4 ${attitudeMode === 'parent' ? 'bg-black text-white' : 'bg-white text-black'}`}>
                <Users className="w-5 h-5 stroke-[3px]" />
              </div>
              <h4 className="font-black text-xl text-black mb-2 uppercase">Phụ huynh</h4>
              <p className="text-sm font-bold text-black/80">Nghiêm khắc, hay so sánh "con nhà người ta", kỳ vọng cao.</p>
            </button>
          </div>
        </div>

        {/* Test Results */}
        <div className="brutal-card bg-[var(--color-blue-pop)] p-6 md:p-8">
          {!showConfirmRetake ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-white border-[3px] border-black flex items-center justify-center text-black mr-4 shadow-[4px_4px_0_#000]">
                  <Award className="w-6 h-6 stroke-[3px]" />
                </div>
                <div>
                  <h3 className="font-black text-2xl text-black uppercase tracking-tight">Bài test Holland</h3>
                  <p className="text-base font-bold text-black bg-white px-2 mt-1 border-[2px] border-black inline-block">Trạng thái: {hollandCode}</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmRetake(true)}
                className="brutal-btn flex items-center px-6 py-3 font-black text-black bg-white uppercase shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none w-full sm:w-auto justify-center"
              >
                <RotateCcw className="w-5 h-5 mr-2 stroke-[3px]" />
                Làm lại
              </button>
            </div>
          ) : (
            <div className="text-center py-4 bg-white border-[4px] border-black p-6 shadow-[8px_8px_0_#000]">
              <p className="text-black text-lg font-black mb-6 uppercase tracking-tight">Bạn có chắc chắn muốn làm lại bài test? Kết quả cũ sẽ bị xóa hoàn toàn.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => setShowConfirmRetake(false)}
                  className="px-8 py-4 font-black text-black bg-[var(--color-yellow-pop)] uppercase border-[3px] border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleRetakeTest}
                  className="px-8 py-4 font-black text-white bg-[var(--color-red-pop)] uppercase border-[3px] border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Xác nhận làm lại
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center p-6 mt-4 font-black text-white bg-black hover:bg-gray-800 uppercase transition-all shadow-[8px_8px_0_var(--color-red-pop)] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none text-xl border-[4px] border-transparent hover:border-black"
        >
          <LogOut className="w-6 h-6 mr-3 stroke-[3px]" />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
