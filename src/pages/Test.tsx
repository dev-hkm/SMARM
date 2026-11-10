import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Minus,
  Circle,
  Plus,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Trophy,
} from 'lucide-react';
import { questions } from '../data/questions';
import { useToast } from '../components/Toast';
import { api } from '../lib/api';
import { useBackgroundMusic } from '../lib/useBackgroundMusic';

const ACCENTS = [
  'var(--color-orange-pop)',
  'var(--color-cyan-pop)',
  'var(--color-pink-pop)',
  'var(--color-green-pop)',
  'var(--color-purple-pop)',
  'var(--color-yellow-pop)',
];

const OPTION_STYLES = [
  { color: 'var(--color-red-pop)', Icon: X },
  { color: 'var(--color-orange-pop)', Icon: Minus },
  { color: 'var(--color-yellow-pop)', Icon: Circle },
  { color: 'var(--color-cyan-pop)', Icon: Plus },
  { color: 'var(--color-green-pop)', Icon: Flame },
];

const getStage = (percent: number) => {
  if (percent < 15) return { label: 'Khởi động thôi!', Icon: Zap };
  if (percent < 40) return { label: 'Đang vào guồng', Icon: Sparkles };
  if (percent < 65) return { label: 'Giữ nhịp này nhé', Icon: Sparkles };
  if (percent < 85) return { label: 'Sắp xong rồi', Icon: Trophy };
  return { label: 'Về đích nào!', Icon: Trophy };
};

export default function Test() {
  const { showToast } = useToast();
  const { muted, playing, toggle: toggleMusic } = useBackgroundMusic();
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
  const answeredCount = Object.keys(answers).length;
  const percent = Math.round((answeredCount / questions.length) * 100);
  const accent = ACCENTS[currentIndex % ACCENTS.length];
  const stage = getStage(percent);
  const StageIcon = stage.Icon;
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
    <div className="relative min-h-screen bg-brutal-paper flex flex-col font-sans overflow-hidden">
      {/* Animated backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute -top-24 -left-24 w-72 h-72 md:w-96 md:h-96 rounded-full border-[4px] border-black/10"
          style={{ backgroundColor: 'var(--color-yellow-pop)', opacity: 0.55 }}
          animate={{ y: [0, 24, 0], x: [0, 14, 0], rotate: [0, 12, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 -right-28 w-64 h-64 md:w-80 md:h-80 rounded-full border-[4px] border-black/10"
          style={{ backgroundColor: 'var(--color-cyan-pop)', opacity: 0.45 }}
          animate={{ y: [0, -30, 0], x: [0, -18, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-[-6rem] left-1/4 w-56 h-56 md:w-72 md:h-72 rounded-full border-[4px] border-black/10"
          style={{ backgroundColor: 'var(--color-pink-pop)', opacity: 0.4 }}
          animate={{ y: [0, -22, 0], x: [0, 20, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-16 left-1/2 w-16 h-16 border-[4px] border-black/10 rotate-12"
          style={{ backgroundColor: 'var(--color-purple-pop)', opacity: 0.35 }}
          animate={{ y: [0, 18, 0], rotate: [12, 30, 12] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(circle at 50% 40%, transparent 20%, #000 80%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 40%, transparent 20%, #000 80%)',
          }}
        />
      </div>

      {/* Header & Progress */}
      <header className="relative z-10 bg-white border-b-[4px] border-black sticky top-0 shadow-[0_4px_0_#000]">
        <div className="max-w-3xl mx-auto px-4 py-3 md:py-4">
          <div className="flex justify-between items-center gap-3 mb-3">
            <h1
              className="text-xl md:text-2xl font-black text-black cursor-pointer select-none uppercase tracking-tighter flex items-center"
              onClick={handleDevClick}
              style={{ textShadow: '2px 2px 0 var(--color-yellow-pop)' }}
            >
              Smarm Test
              <motion.span
                className="ml-2 inline-flex"
                animate={{ rotate: [0, 14, -8, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-5 h-5 stroke-[3px]" />
              </motion.span>
            </h1>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMusic}
                data-music-toggle="true"
                aria-label={muted || !playing ? 'Bật nhạc nền' : 'Tắt nhạc nền'}
                title={muted || !playing ? 'Bật nhạc nền' : 'Tắt nhạc nền'}
                className={`flex items-center gap-2 px-2.5 md:px-3 py-2 border-[3px] border-black shadow-[3px_3px_0_#000] font-black text-[11px] uppercase transition-colors ${
                  playing
                    ? 'bg-[var(--color-green-pop)] text-black'
                    : 'bg-white text-black hover:bg-[var(--color-yellow-pop)]'
                }`}
              >
                {playing ? (
                  <Volume2 className="w-4 h-4 stroke-[3px]" />
                ) : (
                  <VolumeX className="w-4 h-4 stroke-[3px]" />
                )}
                <span className="hidden sm:inline">{playing ? 'Nhạc bật' : 'Bật nhạc'}</span>
                {playing && (
                  <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
                    {[0, 1, 2].map((bar) => (
                      <motion.span
                        key={bar}
                        className="w-[3px] bg-black"
                        animate={{ height: [4, 12, 6, 10, 4] }}
                        transition={{
                          duration: 0.9 + bar * 0.15,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: bar * 0.1,
                        }}
                      />
                    ))}
                  </span>
                )}
              </button>

              <span className="px-2.5 md:px-3 py-2 bg-[var(--color-yellow-pop)] border-[3px] border-black font-black text-black text-xs md:text-sm uppercase shadow-[3px_3px_0_#000] whitespace-nowrap">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-[2px] h-3 mb-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={questions.length}
            aria-valuenow={answeredCount}
          >
            {questions.map((question, index) => {
              const isAnswered = answers[question.id] !== undefined;
              const isCurrent = index === currentIndex;
              return (
                <div
                  key={question.id}
                  className={`flex-1 h-2.5 transition-colors duration-300 ${
                    isAnswered
                      ? 'bg-[var(--color-green-pop)]'
                      : isCurrent
                        ? 'bg-[var(--color-yellow-pop)] border-[1.5px] border-black animate-pulse'
                        : 'bg-black/10'
                  }`}
                />
              );
            })}
          </div>

          <div className="flex justify-between items-center text-[10px] md:text-xs font-black uppercase tracking-wide text-black/70">
            <span>
              Đã trả lời {answeredCount}/{questions.length} câu
            </span>
            <span className="flex items-center gap-1 text-black">
              <StageIcon className="w-3.5 h-3.5 stroke-[3px]" />
              {stage.label}
            </span>
          </div>
        </div>
      </header>

      {/* Question Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 py-6 md:py-10">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -24, scale: 0.97 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="relative bg-white border-[4px] border-black rounded-lg overflow-hidden"
              style={{ boxShadow: `10px 10px 0 ${accent}` }}
            >
              <div
                className="h-3 w-full border-b-[4px] border-black"
                style={{ backgroundColor: accent }}
              />
              <div className="relative p-6 md:p-10">
                <Sparkles
                  className="absolute -right-3 -top-2 w-24 h-24 opacity-[0.07] stroke-[2px] text-black"
                  aria-hidden="true"
                />
                <div className="flex items-center justify-between gap-3 mb-6">
                  <span
                    className="inline-flex items-center px-3 py-1 border-[3px] border-black text-[11px] md:text-xs font-black uppercase tracking-wide shadow-[3px_3px_0_#000]"
                    style={{ backgroundColor: accent }}
                  >
                    Câu {currentIndex + 1}
                  </span>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-wide text-black/50">
                    Chọn mức độ giống bạn nhất
                  </span>
                </div>

                <h2 className="relative text-xl md:text-3xl font-black text-black mb-8 md:mb-10 leading-snug md:leading-relaxed text-center tracking-tight">
                  {currentQuestion.text}
                </h2>

                <div className="space-y-3 md:space-y-4">
                  {options.map((option) => {
                    const isSelected = answers[currentQuestion.id] === option.value;
                    const { color, Icon } = OPTION_STYLES[option.value];
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => handleAnswer(option.value)}
                        aria-pressed={isSelected}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 2 }}
                        className={`group relative w-full p-3 md:p-4 border-[3px] border-black text-left flex items-center gap-3 md:gap-4 font-bold uppercase tracking-tight transition-colors ${
                          isSelected
                            ? 'shadow-none translate-x-1 translate-y-1'
                            : 'shadow-[4px_4px_0_#000] hover:shadow-[6px_6px_0_#000]'
                        }`}
                        style={{ backgroundColor: isSelected ? color : '#FFFFFF' }}
                      >
                        <span
                          className="w-10 h-10 md:w-11 md:h-11 border-[3px] border-black flex items-center justify-center flex-shrink-0 bg-white transition-transform group-hover:rotate-6"
                          style={{ backgroundColor: isSelected ? '#FFFFFF' : color }}
                        >
                          <Icon className="w-5 h-5 md:w-6 md:h-6 stroke-[3px] text-black" />
                        </span>
                        <span className="flex-1 text-sm md:text-lg font-black leading-tight">
                          {option.label}
                        </span>
                        {isSelected ? (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 border-[3px] border-black bg-white flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0_#000]"
                          >
                            <Check className="w-5 h-5 stroke-[4px] text-black" />
                          </motion.span>
                        ) : (
                          <span className="text-xs md:text-sm font-black text-black/30 pr-1">
                            0{option.value + 1}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] md:text-xs font-black uppercase text-black/50">
            <Zap className="w-3.5 h-3.5 stroke-[3px]" />
            Không có đáp án đúng hay sai, chỉ cần chọn theo cảm nhận của bạn
          </div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="relative z-10 bg-white border-t-[4px] border-black p-3 md:p-4 mt-auto">
        <div className="max-w-3xl mx-auto flex justify-between items-center gap-2">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="flex items-center px-4 md:px-6 py-3 font-black text-black uppercase border-[3px] border-transparent hover:border-black hover:bg-[var(--color-background)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 mr-1 md:mr-2 stroke-[3px]" />
            Quay lại
          </button>

          <div className="hidden md:flex items-center gap-2 font-black uppercase text-xs text-black/50">
            <span className="w-2.5 h-2.5 bg-[var(--color-green-pop)] border-2 border-black inline-block" />
            {answeredCount} đã trả lời
            <span className="w-2.5 h-2.5 bg-[var(--color-yellow-pop)] border-2 border-black inline-block ml-2" />
            {questions.length - answeredCount} còn lại
          </div>

          <button
            onClick={handleNext}
            disabled={answers[currentQuestion.id] === undefined}
            className="flex items-center px-5 md:px-8 py-3 font-black text-black bg-[var(--color-blue-pop)] border-[3px] border-black hover:bg-[var(--color-secondary)] hover:text-white uppercase disabled:opacity-50 disabled:pointer-events-none shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-colors"
          >
            {currentIndex === questions.length - 1 ? 'Hoàn thành' : 'Tiếp theo'}
            {currentIndex !== questions.length - 1 && (
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 ml-1 md:ml-2 stroke-[3px]" />
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
