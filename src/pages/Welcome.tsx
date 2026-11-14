import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { ensureSessionUser, readStoredUser, USER_KEY } from '../lib/userSession';

export default function Welcome() {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const init = async () => {
      if (!localStorage.getItem(USER_KEY)) {
        navigate('/auth', { replace: true });
        return;
      }

      const result = await ensureSessionUser();
      if (!active) return;

      if (result === 'unauthenticated') {
        navigate('/auth', { replace: true });
        return;
      }
      if (result === 'switched') {
        window.location.reload();
        return;
      }

      const storedUser = readStoredUser();
      if (!storedUser) {
        navigate('/auth', { replace: true });
        return;
      }

      const aspirations = localStorage.getItem('smarm_aspirations');
      const answers = localStorage.getItem('smarm_answers');
      const hasAspirations = aspirations && aspirations !== 'null' && aspirations.trim() !== '[]' && aspirations.trim() !== '{}';
      const hasAnswers = answers && answers !== 'null' && answers.trim() !== '[]' && answers.trim() !== '{}';

      if (hasAspirations || hasAnswers) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setUser(storedUser);
    };

    void init();

    return () => {
      active = false;
    };
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-brutal-paper flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="brutal-card bg-white p-10 md:p-12 w-full max-w-lg text-center"
      >
        <div className="w-24 h-24 bg-yellow-pop border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center justify-center mx-auto mb-8 transform -rotate-3 hover:rotate-3 transition-transform">
          <Sparkles className="w-12 h-12 stroke-[3px] text-black" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-black text-black mb-6 uppercase tracking-tighter" style={{ textShadow: "3px 3px 0 var(--color-yellow-pop)" }}>
          Chào mừng, {user.name}!
        </h1>
        
        <p className="text-lg text-black font-bold mb-10 leading-relaxed">
          Chào mừng bạn đến với Smarm AI. Bạn đã sẵn sàng để khám phá bản thân và tìm ra con đường sự nghiệp phù hợp nhất với mình chưa?
        </p>

        <button
          onClick={() => navigate('/test')}
          className="brutal-btn inline-flex items-center justify-center w-full px-8 py-5 text-xl font-black text-white bg-black hover:bg-red-pop hover:text-black uppercase tracking-widest shadow-[6px_6px_0_var(--color-yellow-pop)] active:shadow-none active:translate-x-[6px] active:translate-y-[6px]"
        >
          Bắt đầu làm bài Test
          <ArrowRight className="ml-3 w-6 h-6 stroke-[3px]" />
        </button>
      </motion.div>
    </div>
  );
}
