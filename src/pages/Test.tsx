import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { questions } from '../data/questions';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';

export default function Test() {
  const { showToast } = useToast();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [devClickCount, setDevClickCount] = useState(0);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => () => {
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('smarm_user');
    if (!userData) {
      navigate('/auth');
      return;
    }
    
    const aspirations = localStorage.getItem('smarm_aspirations');
    const answers = localStorage.getItem('smarm_answers');
    
    const hasAspirations = aspirations && aspirations !== 'null' && aspirations.trim() !== '[]' && aspirations.trim() !== '{}';
    const hasAnswers = answers && answers !== 'null' && answers.trim() !== '[]' && answers.trim() !== '{}';
    
    if (hasAspirations) {
      navigate('/dashboard');
      return;
    }

    if (hasAnswers) {
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    let active = true;
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
  }, [navigate]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const handleAnswer = (score: number) => {
    // Clicks on the card sliding out belong to the previous question; ignore them.
    if (!currentQuestion || currentQuestion.id !== questions[currentIndexRef.current]?.id) return;
    const answeredIndex = currentIndex;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: score }));
    if (answeredIndex >= questions.length - 1) return;
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    nextTimerRef.current = setTimeout(() => {
      nextTimerRef.current = null;
      // A click on the outgoing question during its transition must not skip or overflow.
      setCurrentIndex(prev =>
        prev === answeredIndex ? Math.min(answeredIndex + 1, questions.length - 1) : prev,
      );
    }, 300);
  };

  const handleNext = () => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1));
    } else {
      finishTest();
    }
  };

  const handleBack = () => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
    if (currentIndex > 0) {
      setCurrentIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const finishTest = async () => {
    // Ensure all questions are answered
    if (Object.keys(answers).length < questions.length) {
      showToast('Vui lòng trả lời tất cả các câu hỏi trước khi hoàn thành!', 'info');
      return;
    }
    localStorage.setItem('smarm_answers', JSON.stringify(answers));
    try {
      await api.syncUserData();
    } catch (e) {
      console.error("Failed to sync test answers:", e);
    }
    navigate('/dashboard');
  };

  // Hidden dev feature
  const handleDevClick = () => {
    const newCount = devClickCount + 1;
    setDevClickCount(newCount);
    if (newCount >= 8) {
      const autoAnswers: Record<string, number> = {};
      questions.forEach(q => {
        // Random score between 0 and 4
        autoAnswers[q.id] = Math.floor(Math.random() * 5);
      });
      setAnswers(autoAnswers);
      setCurrentIndex(questions.length - 1);
      setDevClickCount(0);
      showToast('Đã tự động điền 60 câu hỏi! (Dev Mode)', 'success');
    }
  };

  const options = [
    { value: 0, label: 'Hoàn toàn không giống tôi' },
    { value: 1, label: 'Ít giống tôi' },
    { value: 2, label: 'Bình thường / Phân vân' },
    { value: 3, label: 'Khá giống tôi' },
    { value: 4, label: 'Rất giống tôi' },
  ];

  return (
    <div className="min-h-screen bg-brutal-paper flex flex-col font-sans">
      {/* Header & Progress */}
      <header className="bg-white border-b-[4px] border-black sticky top-0 z-10 shadow-[0_4px_0_#000]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 
              className="text-2xl font-black text-black cursor-pointer select-none uppercase tracking-tighter"
              onClick={handleDevClick}
              style={{ textShadow: "2px 2px 0 var(--color-yellow-pop)" }}
            >
              Smarm Test
            </h1>
            <span className="px-3 py-1 bg-[var(--color-yellow-pop)] border-2 border-black font-black text-black text-sm uppercase shadow-[2px_2px_0_#000]">
              Câu {currentIndex + 1} / {questions.length}
            </span>
          </div>
          <div className="w-full bg-white border-[3px] border-black h-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] relative">
            <motion.div 
              className="bg-[var(--color-secondary)] h-full border-r-[3px] border-black"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      {/* Question Area */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="brutal-card bg-white p-8 md:p-10"
            >
              <h2 className="text-2xl md:text-3xl font-black text-black mb-10 leading-relaxed text-center uppercase tracking-tight">
                {currentQuestion.text}
              </h2>

              <div className="space-y-4">
                {options.map((option) => {
                  const isSelected = answers[currentQuestion.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full p-4 border-[3px] border-black shadow-[4px_4px_0_#000] text-left flex items-center justify-between font-bold uppercase tracking-tight transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none hover:bg-[var(--color-background)] ${
                        isSelected 
                          ? 'bg-[var(--color-yellow-pop)]' 
                          : 'bg-white'
                      }`}
                    >
                      <span className="text-lg">{option.label}</span>
                      {isSelected && <Check className="w-6 h-6 stroke-[3px] text-black" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t-[4px] border-black p-4 mt-auto">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="flex items-center px-6 py-3 font-black text-black uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-6 h-6 mr-2 stroke-[3px]" />
            Quay lại
          </button>
          
          <button
            onClick={handleNext}
            disabled={answers[currentQuestion.id] === undefined}
            className="brutal-btn flex items-center px-8 py-3 font-black text-white bg-[var(--color-blue-pop)] border-black text-black hover:bg-[var(--color-secondary)] hover:text-white uppercase disabled:opacity-50 disabled:pointer-events-none shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            {currentIndex === questions.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
            {currentIndex !== questions.length - 1 && <ChevronRight className="w-6 h-6 ml-2 stroke-[3px]" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
