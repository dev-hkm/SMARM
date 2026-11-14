import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertCircle,
  ChevronRight,
  AlarmClock,
  Pencil
} from 'lucide-react';
import { api } from '../../lib/api';
import { normalizeGrades, readArray, readJson, writeJson } from '../../lib/localData';

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

type ScheduleItem = {
  id: string;
  subject: string;
  time: string;
  day: string; // 2, 3, 4, 5, 6, 7, CN
};

export default function PlannerTab() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ subject: '', time: '', day: '2' });

  // Admission Probability State
  const [probability, setProbability] = useState<number | null>(null);
  const [targetUni, setTargetUni] = useState<string>('');

  // Countdown State
  const [countdownTitle, setCountdownTitle] = useState(() => {
    return localStorage.getItem('smarm_countdown_title') || 'Kỳ thi THPT Quốc Gia 2026';
  });
  const [countdownTarget, setCountdownTarget] = useState(() => {
    return localStorage.getItem('smarm_countdown_target') || '2026-06-11T07:30:00';
  });
  const [isEditingCountdown, setIsEditingCountdown] = useState(false);
  const [editTitle, setEditTitle] = useState(countdownTitle);
  const [editTarget, setEditTarget] = useState(countdownTarget);

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    // 1. Load Todos
    setTodos(readArray<Todo>('smarm_todos').filter((todo) => todo && typeof todo.id === 'string'));

    // 2. Load Schedule
    setSchedule(
      readArray<ScheduleItem>('smarm_schedule').filter(
        (item) => item && typeof item.id === 'string',
      ),
    );

    // 3. Calculate Admission Probability
    calculateProbability();
  }, []);

  // Timezone-robust parser for Vietnam Time (GMT+7)
  const parseVietnamDate = (dateStr: string): number => {
    const regex = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/;
    const match = dateStr.match(regex);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1; // 0-indexed
      const day = parseInt(match[3], 10);
      const hours = match[4] ? parseInt(match[4], 10) : 0;
      const minutes = match[5] ? parseInt(match[5], 10) : 0;
      const seconds = match[6] ? parseInt(match[6], 10) : 0;
      
      const utcTime = Date.UTC(year, month, day, hours, minutes, seconds);
      // Vietnam is UTC+7, so subtract 7 hours in milliseconds to find UTC equivalent
      return utcTime - (7 * 60 * 60 * 1000);
    }
    return new Date(dateStr).getTime();
  };

  // Live Countdown (re-runs when countdownTarget changes)
  useEffect(() => {
    const updateCountdown = () => {
      const examDate = parseVietnamDate(countdownTarget);
      const now = new Date().getTime();
      const diff = examDate - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [countdownTarget]);

  const calculateProbability = () => {
    const aspirations = readArray<Record<string, unknown>>('smarm_aspirations');
    const grades = normalizeGrades(readJson<unknown>('smarm_grades', {}));
    const targetAspiration = aspirations[0];
    const targetName = typeof targetAspiration?.name === 'string' ? targetAspiration.name : '';

    if (!targetName) {
      setProbability(null);
      return;
    }

    setTargetUni(targetName);

    // Simple probability logic (can be more complex)
    // We calculate current estimated THPT score from subjects
    let currentScore = 0;
    const targetSubjects = targetAspiration.targetSubjects || [];
    const subjectsToUse = Array.isArray(targetSubjects) 
      ? targetSubjects 
      : (typeof targetSubjects === 'string' ? targetSubjects.split(/[,/]/).map((s:any) => s.trim()) : []);

    if (subjectsToUse.length === 0) {
      setProbability(null);
      return;
    }

    let validSubjectsCount = 0;
    subjectsToUse.forEach((sub: string) => {
      // Look in class 12 semester 1 (or 2 if exists)
      const data = grades.class12.semester1[sub] || grades.class12.semester2[sub];
      if (data) {
        // Mock average calculation if real one isn't exported
        const regAvg = data.regular.length > 0 ? data.regular.reduce((a:number,b:number)=>a+b,0)/data.regular.length : 0;
        const mid = data.mid ?? regAvg;
        const final = data.final ?? (mid || regAvg);
        const subAvg = (regAvg + mid * 2 + final * 3) / 6;
        if (subAvg > 0) {
          currentScore += subAvg;
          validSubjectsCount++;
        }
      }
    });

    if (validSubjectsCount < subjectsToUse.length) {
      // Not enough data for all subjects, use available + average
      const avgOfAvail = validSubjectsCount > 0 ? currentScore / validSubjectsCount : 7;
      currentScore += avgOfAvail * (subjectsToUse.length - validSubjectsCount);
    }

    const parsedTarget = Number(targetAspiration.targetScore);
    const targetScore = Number.isFinite(parsedTarget) && parsedTarget > 0 ? parsedTarget : 24;
    
    // Probability calculation: 
    // If currentScore >= targetScore + 1: High (90%+)
    // If currentScore == targetScore: Medium (50%+)
    // If currentScore < targetScore - 2: Low (<30%)
    const diff = currentScore - targetScore;
    let prob = 50 + (diff * 15); // Each point diff is 15% change
    prob = Math.max(5, Math.min(98, prob));
    setProbability(Math.round(prob));
  };

  const saveTodos = (newTodos: Todo[]) => {
    setTodos(newTodos);
    localStorage.setItem('smarm_todos', JSON.stringify(newTodos));
    api.syncUserData().catch((e) => console.error("Sync error:", e));
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const entry: Todo = { id: Date.now().toString(), text: newTodo.trim(), completed: false };
    saveTodos([entry, ...todos]);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    saveTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTodo = (id: string) => {
    saveTodos(todos.filter(t => t.id !== id));
  };

  const saveSchedule = (newItems: ScheduleItem[]) => {
    setSchedule(newItems);
    localStorage.setItem('smarm_schedule', JSON.stringify(newItems));
    api.syncUserData().catch((e) => console.error("Sync error:", e));
  };

  const addScheduleItem = () => {
    if (!newSchedule.subject || !newSchedule.time) return;
    const item: ScheduleItem = { 
      id: Date.now().toString(), 
      ...newSchedule 
    };
    saveSchedule([...schedule, item]);
    setNewSchedule({ subject: '', time: '', day: '2' });
    setIsAddingSchedule(false);
  };

  const removeScheduleItem = (id: string) => {
    saveSchedule(schedule.filter(s => s.id !== id));
  };

  const days = ['2', '3', '4', '5', '6', '7', 'CN'];

  return (
    <div className="p-2.5 sm:p-4 md:p-8 pb-28 sm:pb-32 max-w-7xl mx-auto space-y-8 sm:space-y-12">
      {/* 1. Countdown Hero */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-purple-pop border-[4px] border-black overflow-hidden shadow-[8px_8px_0_#000] p-8 md:p-12 text-black"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-20 rounded-full -mr-48 -mt-48 border-[4px] border-black pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5 mb-6 bg-white px-4 py-2 border-[3px] border-black shadow-[4px_4px_0_#000] w-fit mx-auto md:mx-0 relative group">
              <AlarmClock className="w-5 h-5 text-black stroke-[3px]" />
              <span className="text-[12px] font-black uppercase tracking-widest text-black">{countdownTitle}</span>
              <button
                onClick={() => {
                  setEditTitle(countdownTitle);
                  setEditTarget(countdownTarget);
                  setIsEditingCountdown(true);
                }}
                className="p-1 hover:bg-black/10 border border-transparent hover:border-black rounded transition-all cursor-pointer flex items-center justify-center"
                title="Tùy chỉnh đếm ngược"
              >
                <Pencil className="w-3.5 h-3.5 stroke-[3px] text-black" />
              </button>
            </div>
            <div className="flex flex-col md:flex-row items-baseline justify-center md:justify-start gap-8 mb-8">
              {/* Days - The Hero */}
              <div className="flex flex-col items-center md:items-start group">
                <div className="flex items-baseline gap-3">
                  <span 
                    className="text-8xl md:text-9xl font-black text-white tracking-tighter"
                    style={{ textShadow: "6px 6px 0 #000", WebkitTextStroke: "3px black", paintOrder: "stroke fill" }}
                  >
                    {timeLeft.days}
                  </span>
                  <span className="text-2xl md:text-3xl font-black text-black uppercase tracking-tighter">Ngày</span>
                </div>
              </div>

              {/* H/M/S - The Sub-elements */}
              <div className="flex items-center gap-6 bg-pink-pop px-8 py-6 border-[4px] border-black shadow-[8px_8px_0_#000]">
                <div className="text-center">
                  <div className="text-4xl font-black text-black leading-none mb-2">{String(timeLeft.hours).padStart(2, '0')}</div>
                  <div className="text-[10px] font-black text-black uppercase tracking-widest">Giờ</div>
                </div>
                <div className="w-[4px] h-12 bg-black"></div>
                <div className="text-center">
                  <div className="text-4xl font-black text-black leading-none mb-2">{String(timeLeft.minutes).padStart(2, '0')}</div>
                  <div className="text-[10px] font-black text-black uppercase tracking-widest">Phút</div>
                </div>
                <div className="w-[4px] h-12 bg-black"></div>
                <div className="text-center">
                  <div className="text-5xl font-black text-black leading-none mb-2 tabular-nums">{String(timeLeft.seconds).padStart(2, '0')}</div>
                  <div className="text-[10px] font-black text-black uppercase tracking-widest">Giây</div>
                </div>
              </div>
            </div>
            <p className="text-black font-bold text-lg bg-white inline-block px-4 py-2 border-[3px] border-black mt-2 shadow-[4px_4px_0_#000]">Thời gian không đợi ai, hãy tập trung tối đa cho mục tiêu của bạn.</p>
          </div>
          
          <div className="hidden md:block">
            <Calendar className="w-40 h-40 text-black opacity-20 rotate-12 stroke-[2px]" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* 2. Schedule Section */}
        <div className="lg:col-span-12">
          <div className="flex items-center justify-between mb-8 pb-4 border-b-[4px] border-black">
            <h2 className="text-3xl font-black text-black flex items-center uppercase tracking-tight">
              <div className="w-14 h-14 bg-pink-pop border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000]">
                <Calendar className="w-8 h-8 text-black stroke-[3px]" />
              </div>
              Lịch học trong tuần
            </h2>
            <button 
              onClick={() => setIsAddingSchedule(true)}
              className="p-3 bg-purple-pop text-black border-[3px] border-black shadow-[4px_4px_0_#000] hover:bg-pink-pop active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
            >
              <Plus className="w-8 h-8 stroke-[3px]" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
            {days.map(day => (
              <div key={day} className="brutal-card bg-white p-5 min-h-[160px] flex flex-col">
                <div className="text-sm font-black text-black uppercase tracking-widest mb-6 border-b-[4px] border-black pb-3 bg-purple-pop px-2 border-t-[3px] border-l-[3px] border-r-[3px] -mx-5 -mt-5 text-center">
                  Thứ {day === 'CN' ? 'CN' : day}
                </div>
                <div className="flex-1 space-y-4">
                  {schedule.filter(s => s.day === day).map(item => (
                    <div key={item.id} className="group relative bg-[var(--color-background)] p-4 border-[3px] border-black shadow-[4px_4px_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                      <div className="text-sm font-black text-black leading-tight uppercase">{item.subject}</div>
                      <div className="flex items-center text-xs text-black font-bold mt-3">
                        <Clock className="w-4 h-4 mr-2 stroke-[3px]" />
                        {item.time}
                      </div>
                      <button 
                        onClick={() => removeScheduleItem(item.id)}
                        className="absolute -top-3 -right-3 p-2 bg-[var(--color-red-pop)] border-[3px] border-black shadow-[2px_2px_0_#000] text-black opacity-0 group-hover:opacity-100 transition-opacity active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                      >
                        <Trash2 className="w-4 h-4 stroke-[3px]" />
                      </button>
                    </div>
                  ))}
                  {schedule.filter(s => s.day === day).length === 0 && (
                    <div className="h-full flex items-center justify-center font-bold italic text-black/40 text-sm">Trống</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. To-do List Section */}
        <div className="lg:col-span-7">
          <div className="brutal-card bg-white flex flex-col h-full overflow-hidden">
            <div className="p-6 md:p-8 border-b-[4px] border-black flex flex-col sm:flex-row items-start sm:items-center justify-between bg-purple-pop gap-4">
              <h2 className="text-2xl md:text-3xl font-black text-black flex items-center uppercase tracking-tight">
                <CheckCircle2 className="w-8 h-8 mr-4 stroke-[3px]" />
                Việc cần làm
              </h2>
              <div className="bg-white px-4 py-2 border-[3px] border-black text-sm font-black text-black uppercase shadow-[4px_4px_0_#000]">
                {todos.filter(t => t.completed).length}/{todos.length} Xong
              </div>
            </div>
            
            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <input 
                  type="text" 
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Thêm bài tập, nhiệm vụ học tập..."
                  className="flex-1 bg-white border-[4px] border-black px-6 py-4 text-base font-bold focus:outline-none focus:bg-[var(--color-background)] shadow-[inset_0_4px_0_rgba(0,0,0,0.1)]"
                />
                <button 
                  onClick={addTodo}
                  className="px-8 py-4 bg-pink-pop text-black border-[4px] border-black hover:bg-black hover:text-white transition-all shadow-[6px_6px_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none flex items-center justify-center w-full sm:w-auto"
                >
                  <Plus className="w-6 h-6 stroke-[3px]" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
                <AnimatePresence>
                  {todos.map(todo => (
                    <motion.div
                      key={todo.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className={`group flex items-center p-4 md:p-5 transition-all border-[4px] border-black shadow-[4px_4px_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none mb-4 ${
                        todo.completed ? 'bg-[var(--color-background)] opacity-70' : 'bg-white'
                      }`}
                    >
                      <button 
                        onClick={() => toggleTodo(todo.id)}
                        className={`mr-5 transition-colors w-10 h-10 flex flex-shrink-0 items-center justify-center border-[3px] border-black ${todo.completed ? 'bg-black text-white' : 'bg-white text-black'}`}
                      >
                        {todo.completed && <CheckCircle2 className="w-6 h-6 stroke-[3px]" />}
                      </button>
                      <span className={`flex-1 text-base md:text-lg font-bold ${todo.completed ? 'line-through text-black/60' : 'text-black'}`}>
                        {todo.text}
                      </span>
                      <button 
                        onClick={() => removeTodo(todo.id)}
                        className="opacity-0 group-hover:opacity-100 p-3 ml-2 bg-[var(--color-red-pop)] text-black border-[3px] border-black shadow-[2px_2px_0_#000] transition-opacity active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5 stroke-[3px]" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {todos.length === 0 && (
                  <div className="text-center py-20 font-black uppercase tracking-widest text-black/40 text-lg">Chưa có nhiệm vụ nào</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. Tips & Stats Section */}
        <div className="lg:col-span-5 space-y-8">
          <div className="brutal-card bg-pink-pop p-6 md:p-8 space-y-8 h-full">
            <div className="flex items-center text-black mb-6">
              <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000]">
                <TrendingUp className="w-7 h-7 stroke-[3px]" />
              </div>
              <span className="font-black uppercase text-2xl tracking-tight">Phân tích tiến độ</span>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 border-[4px] border-black shadow-[6px_6px_0_#000]">
                <div className="text-base font-black text-black uppercase mb-4 tracking-wider">Mức độ tập trung dự kiến</div>
                <div className="w-full bg-[var(--color-background)] h-8 border-[3px] border-black shadow-[inset_0_4px_0_rgba(0,0,0,0.1)] relative">
                  <div className="bg-purple-pop h-full w-[75%] border-r-[3px] border-black"></div>
                </div>
                <div className="flex justify-between mt-4">
                  <span className="text-base font-black text-black uppercase">Tốt (75%)</span>
                  <span className="text-sm font-bold text-black/60 uppercase">Mục tiêu: 90%</span>
                </div>
              </div>

              <div className="bg-purple-pop p-6 border-[4px] border-black shadow-[6px_6px_0_#000] flex flex-col md:flex-row items-start gap-5">
                <div className="p-4 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] flex-shrink-0">
                  <AlertCircle className="w-8 h-8 stroke-[3px] text-black" />
                </div>
                <div>
                  <div className="text-xl font-black text-black mb-3 uppercase">Nhắc nhở học tập</div>
                  <p className="text-base text-black font-bold leading-relaxed">
                    Bạn có một vài mục tiêu quan trọng cần hoàn thành trong hôm nay. Đừng quên dành thời gian cho môn Tiếng Anh nhé!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Schedule Modal */}
      <AnimatePresence>
        {isAddingSchedule && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="brutal-card bg-white p-8 md:p-10 max-w-lg w-full"
            >
              <h3 className="text-3xl font-black text-black mb-8 uppercase tracking-tight flex items-center">
                <div className="w-10 h-10 bg-purple-pop border-[3px] border-black flex items-center justify-center mr-4">
                  <Plus className="w-6 h-6 stroke-[3px]" />
                </div>
                Thêm lịch học
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-black text-black uppercase mb-3 block border-l-[4px] border-pink-pop pl-2">Tên môn học/Hoạt động</label>
                  <input 
                    type="text" 
                    value={newSchedule.subject}
                    onChange={(e) => setNewSchedule({...newSchedule, subject: e.target.value})}
                    placeholder="VD: Toán nâng cao"
                    className="w-full bg-[var(--color-background)] border-[4px] border-black px-6 py-4 text-base font-bold focus:outline-none shadow-[inset_0_4px_0_rgba(0,0,0,0.1)] focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-black text-black uppercase mb-3 block border-l-[4px] border-purple-pop pl-2">Thời gian</label>
                    <input 
                      type="time" 
                      value={newSchedule.time}
                      onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                      className="w-full bg-[var(--color-background)] border-[4px] border-black px-6 py-4 text-base font-bold focus:outline-none shadow-[inset_0_4px_0_rgba(0,0,0,0.1)] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-black text-black uppercase mb-3 block border-l-[4px] border-[var(--color-red-pop)] pl-2">Thứ</label>
                    <select 
                      value={newSchedule.day}
                      onChange={(e) => setNewSchedule({...newSchedule, day: e.target.value})}
                      className="w-full bg-[var(--color-background)] border-[4px] border-black px-6 py-4 text-base font-bold focus:outline-none shadow-[inset_0_4px_0_rgba(0,0,0,0.1)] focus:bg-white appearance-none"
                    >
                      {days.map(d => (
                        <option key={d} value={d}>Thứ {d === 'CN' ? 'CN' : d}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                <button 
                  onClick={() => setIsAddingSchedule(false)}
                  className="flex-1 py-4 bg-white text-black font-black uppercase border-[4px] border-black hover:bg-black hover:text-white transition-all text-lg shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  Hủy
                </button>
                <button 
                  onClick={addScheduleItem}
                  className="flex-1 py-4 bg-purple-pop text-black font-black uppercase border-[4px] border-black hover:bg-pink-pop transition-all text-lg shadow-[6px_6px_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none"
                >
                  Thêm vào lịch
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Countdown Modal */}
      <AnimatePresence>
        {isEditingCountdown && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0_#000] max-w-md w-full"
            >
              <h3 className="font-black text-2xl text-black uppercase tracking-tight mb-4">
                Tùy chỉnh đếm ngược
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-black text-black uppercase mb-1.5">Tiêu đề sự kiện</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Ví dụ: Kỳ thi THPT Quốc Gia 2026"
                    className="w-full bg-white border-[3px] border-black p-2.5 font-bold text-black focus:outline-none shadow-[2px_2px_0_#000] focus:shadow-[4px_4px_0_#000] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-black uppercase mb-1.5">Thời gian mục tiêu</label>
                  <input
                    type="datetime-local"
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="w-full bg-white border-[3px] border-black p-2.5 font-bold text-black focus:outline-none shadow-[2px_2px_0_#000] focus:shadow-[4px_4px_0_#000] transition-all"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsEditingCountdown(false)}
                  className="flex-1 bg-white hover:bg-black/5 text-black py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-tight transition-all active:translate-x-1 active:translate-y-1 shadow-[3px_3px_0_#000] active:shadow-none cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    if (!editTitle.trim()) {
                      alert('Tiêu đề không được để trống!');
                      return;
                    }
                    if (!editTarget) {
                      alert('Thời gian mục tiêu không được để trống!');
                      return;
                    }
                    setCountdownTitle(editTitle.trim());
                    setCountdownTarget(editTarget);
                    localStorage.setItem('smarm_countdown_title', editTitle.trim());
                    localStorage.setItem('smarm_countdown_target', editTarget);
                    setIsEditingCountdown(false);
                    // Sync to server
                    api.syncUserData().catch((e) => console.error("Sync error:", e));
                  }}
                  className="flex-1 bg-purple-pop hover:bg-white text-black py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-tight transition-all active:translate-x-1 active:translate-y-1 shadow-[3px_3px_0_#000] active:shadow-none cursor-pointer"
                >
                  Lưu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
