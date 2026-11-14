import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  BookOpen,
  Sparkles,
  Search,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Quote,
  TrendingUp,
  X,
} from "lucide-react";

import { ensureSessionUser, USER_KEY } from "../lib/userSession";

const FadeInWhenVisible = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [showSecret, setShowSecret] = useState(false);
  const [activePolicyModal, setActivePolicyModal] = useState<'terms' | 'privacy' | null>(null);

  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    if (newCount >= 3) {
      setShowSecret(true);
      setClickCount(0);
      setTimeout(() => setShowSecret(false), 5000);
    } else {
      setClickCount(newCount);
    }
  };

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!localStorage.getItem(USER_KEY)) return;
      const result = await ensureSessionUser();
      if (!active) return;
      if (result === "switched") {
        window.location.reload();
        return;
      }
      if (result !== "ok") return;
      const aspirations = localStorage.getItem("smarm_aspirations");
      const hasAspirations = Boolean(
        aspirations &&
        !["", "[]", "{}", "null"].includes(aspirations.trim()),
      );
      if (hasAspirations) navigate("/dashboard");
    };
    void check();
    return () => {
      active = false;
    };
  }, [navigate]);

  const facts = [
    {
      title: "Tỉ lệ sinh viên chọn sai ngành học",
      content:
        "Có khoảng 60% sinh viên tại Việt Nam chọn sai ngành học, dẫn đến việc thiếu động lực và khó khăn trong phát triển nghề nghiệp.",
      source:
        "Trung tâm Dự báo nhu cầu nhân lực và Thông tin thị trường lao động TP.HCM (FALMI)",
    },
    {
      title: "Tỉ lệ sinh viên thiếu hiểu biết về ngành đã chọn",
      content:
        "Khoảng 75% sinh viên thực sự thiếu hiểu biết đầy đủ về ngành nghề mà mình đã lựa chọn theo học.",
      source:
        "Trung tâm Dự báo nhu cầu nhân lực và Thông tin thị trường lao động TP.HCM (FALMI)",
    },
    {
      title: "Tỉ lệ làm việc trái ngành sau tốt nghiệp",
      content:
        "Khoảng 37% cử nhân ra trường phải làm việc trái với chuyên ngành đào tạo của mình.",
      source: "Tổng cục Thống kê (2024)",
    },
    {
      title: "Tỉ lệ sinh viên muốn thi lại hoặc bỏ học năm nhất",
      content:
        "Có khoảng 20% - 30% sinh viên năm thứ nhất muốn thi lại hoặc có ý định bỏ học để chuyển sang ngành khác.",
      source: "Bộ Giáo dục và Đào tạo",
    },
    {
      title: "Tỉ lệ thất nghiệp ở nhóm thanh niên (15-24 tuổi)",
      content:
        "Tỉ lệ này dao động ở mức 7,93% - 8%, cao gấp nhiều lần so với tỉ lệ thất nghiệp trung bình chung của cả nước.",
      source: "Tổng cục Thống kê (2025)",
    },
    {
      title: "Tỉ lệ tìm được việc làm đúng chuyên môn",
      content:
        "Chỉ khoảng 50% sinh viên tốt nghiệp tìm được công việc đúng với chuyên môn đào tạo trong vòng 6 tháng đầu.",
      source: "World Journal of Advanced Research and Reviews (2024)",
    },
    {
      title: "Tỉ lệ phụ huynh bất đồng với con cái về chọn nghề",
      content:
        "Có đến 70% phụ huynh tham gia các buổi tư vấn tuyển sinh cho biết họ có ý kiến bất đồng với con mình trong việc lựa chọn ngành nghề.",
      source: "ThS Nguyễn Hải Trường An (Đại học Kinh tế - Luật TP.HCM)",
    },
    {
      title: 'Hậu quả tâm lý của việc "chọn hộ" đại học',
      content:
        'Việc bị cha mẹ áp đặt ngành học gây ra "áp lực vô hình", khiến nhiều sinh viên rơi vào trạng thái chống đối ngầm, học đối phó hoặc bỏ học giữa chừng vì chán nản.',
      source: "Chuyên gia tâm lý, TS Đặng Hoàng Ngân",
    },
  ];

  const guideSteps = [
    {
      icon: <CheckCircle2 className="w-10 h-10 stroke-[3px]" />,
      title: "Bắt đầu & Đăng ký",
      content:
        "Tạo tài khoản Smarm để cá nhân hóa lộ trình. Chúng tôi cần biết tên và khối thi mục tiêu của bạn.",
      color: "bg-[var(--color-blue-pop)]"
    },
    {
      icon: <BookOpen className="w-10 h-10 stroke-[3px]" />,
      title: "Làm bài Test Holland",
      content:
        'Thực hiện bài trắc nghiệm 60 câu hỏi khoa học để tìm ra "Mã Holland" - chìa khóa mở cánh cửa nghề nghiệp.',
      color: "bg-[var(--color-yellow-pop)]"
    },
    {
      icon: <Search className="w-10 h-10 stroke-[3px]" />,
      title: "Khám phá Đại học",
      content:
        "Tìm kiếm hàng trăm trường đại học tại Việt Nam. Xem tóm tắt, điểm chuẩn và tổ hợp môn xét tuyển.",
      color: "bg-[var(--color-red-pop)]"
    },
    {
      icon: <LayoutDashboard className="w-10 h-10 stroke-[3px]" />,
      title: "Quản lý Dashboard",
      content:
        "Lưu các trường mục tiêu vào danh sách nguyện vọng. Theo dõi điểm số và tiến độ học tập cá nhân.",
      color: "bg-[var(--color-primary)]"
    },
    {
      icon: <MessageSquare className="w-10 h-10 stroke-[3px]" />,
      title: "Chat với Smarm AI",
      content:
        "Trò chuyện với trợ lý AI thông minh để nhận lời khuyên sâu sát về điểm số và định hướng tương lai.",
      color: "bg-[var(--color-blue-pop)]"
    },
    {
      icon: <Sparkles className="w-10 h-10 stroke-[3px]" />,
      title: "Lộ trình cá nhân",
      content:
        "Smarm AI sẽ phân tích dữ liệu của bạn để đưa ra các gợi ý học tập và chọn trường tối ưu nhất.",
      color: "bg-[var(--color-yellow-pop)]"
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-brutal-paper text-black font-sans selection:bg-black selection:text-white">
      {/* Premium Hero Section */}
      <section className="relative min-h-[105vh] flex flex-col items-center justify-start pt-24 lg:pt-28 px-4 overflow-hidden border-b-brutal">

        <div className="relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center text-center mt-2">
          {/* Top Widgets directly above the heading */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-wrap justify-center items-center gap-4 mb-8 w-full px-4"
          >
            {/* RIASEC Pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white brutal-card hover:bg-[var(--color-yellow-pop)] cursor-default">
              <div className="flex gap-1">
                <span className="w-6 h-6 flex items-center justify-center bg-black text-white text-[12px] font-black border border-black shadow-[2px_2px_0_#000]">
                  I
                </span>
                <span className="w-6 h-6 flex items-center justify-center bg-black text-white text-[12px] font-black border border-black shadow-[2px_2px_0_#000]">
                  R
                </span>
                <span className="w-6 h-6 flex items-center justify-center bg-black text-white text-[12px] font-black border border-black shadow-[2px_2px_0_#000]">
                  C
                </span>
              </div>
              <div className="w-[3px] h-4 bg-black mx-1"></div>
              <span className="text-sm font-black tracking-tight uppercase">
                85% Phù hợp
              </span>
            </div>

            {/* Learning Progress / AI Insight Pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white brutal-card hover:bg-[var(--color-blue-pop)] cursor-default hidden sm:flex">
              <div className="w-6 h-6 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 stroke-[3px]" />
              </div>
              <span className="text-sm font-black tracking-tight uppercase">
                Theo dõi tiến độ realtime
              </span>
            </div>

            {/* AI Insight Pill */}
            <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] brutal-card cursor-default">
              <Sparkles className="w-5 h-5 stroke-[3px]" />
              <span className="text-sm font-black tracking-tight uppercase">
                AI phân tích 5+ môn
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onClick={handleTitleClick}
            className="cursor-pointer select-none mb-6 relative group"
          >
            <AnimatePresence mode="wait">
              {!showSecret ? (
                <motion.h1
                  key="smarm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-[5.5rem] sm:text-[8.5rem] md:text-[12rem] font-black tracking-tighter leading-[0.85] [-webkit-text-stroke:3px_black] md:[-webkit-text-stroke:5px_black]"
                  style={{ textShadow: "8px 8px 0 #000", paintOrder: "stroke fill" }}
                >
                  <span className="text-[var(--color-yellow-pop)]">S</span>
                  <span className="text-[var(--color-blue-pop)]">m</span>
                  <span className="text-[var(--color-red-pop)]">a</span>
                  <span className="text-[var(--color-purple-pop)]">r</span>
                  <span className="text-[var(--color-green-pop)]">m</span>
                  <span className="text-[var(--color-orange-pop)]">.</span>
                </motion.h1>
              ) : (
                <motion.div
                  key="smart-aim"
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-5xl md:text-[7rem] font-black tracking-tighter text-black leading-none flex flex-wrap items-center justify-center gap-3 sm:gap-4 py-4"
                >
                  <span className="bg-[var(--color-blue-pop)] px-6 sm:px-8 py-2 border-brutal shadow-[6px_6px_0_#000]">
                    Smart
                  </span>
                  <span>+</span>
                  <span className="bg-[var(--color-primary)] px-6 sm:px-8 py-2 border-brutal shadow-[6px_6px_0_#000]">
                    Aim
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-xl md:text-2xl text-black mb-12 font-bold max-w-2xl leading-relaxed lg:leading-loose px-4 uppercase tracking-tight"
          >
            Hệ thống đánh giá năng lực và{" "}
            <span className="bg-[var(--color-yellow-pop)] border-b-[3px] border-black pb-1">định hướng sự nghiệp</span>{" "}
            cá nhân hóa dựa trên dữ liệu học tập thực tế.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col items-center gap-6"
          >
            <Link
              to="/auth"
              className="brutal-btn flex items-center justify-center px-10 py-5 text-lg font-black text-black bg-[var(--color-primary)] hover:bg-[var(--color-blue-pop)] uppercase tracking-widest"
            >
              Bắt đầu hành trình
              <ArrowRight className="ml-3 w-6 h-6 stroke-[3px]" />
            </Link>

            <div className="flex items-center gap-3 bg-white px-6 py-2.5 brutal-card border-brutal-thin">
              <div className="flex items-center justify-center w-6 h-6 bg-[var(--color-yellow-pop)] border-2 border-black">
                <CheckCircle2 className="w-4 h-4 stroke-[3px]" />
              </div>
              <div className="text-sm font-black uppercase tracking-tight">
                Hơn <span className="text-[var(--color-secondary)]">150</span> học sinh đã tham gia
              </div>
            </div>
          </motion.div>
        </div>

        {/* Dashboard Mockup - Brutalist Layout */}
        <motion.div
          initial={{ opacity: 0, y: 150 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-5xl mx-auto mt-20 z-20 flex-1 flex flex-col justify-end px-4"
        >
          <div className="w-full min-h-[350px] md:min-h-[450px] relative border-[4px] border-black border-b-0 bg-[#E0E0E0] shadow-[16px_-16px_0_#000] p-4 pb-0 rounded-t-lg">
            {/* App Window */}
            <div className="w-full h-full bg-white border-[4px] border-black border-b-0 overflow-hidden flex relative rounded-t-lg">
              {/* Sidebar */}
              <div className="w-20 md:w-64 bg-[var(--color-primary)] border-r-[4px] border-black hidden sm:flex flex-col p-4 pt-6">
                <div className="w-full h-10 bg-black mb-10 flex-shrink-0"></div>
                <div className="space-y-4">
                  <div className="h-12 w-full bg-white border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center px-4">
                    <div className="w-6 h-6 bg-black mr-3"></div>
                    <div className="flex-1 h-4 bg-black hidden md:block"></div>
                  </div>
                  <div className="h-12 w-full bg-transparent border-[3px] border-black flex items-center px-4">
                    <div className="w-6 h-6 border-2 border-black mr-3"></div>
                    <div className="w-24 h-4 border-2 border-black hidden md:block"></div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 md:p-10 flex flex-col gap-6 relative overflow-hidden bg-white">
                {/* Header */}
                <div className="flex justify-between items-center bg-[var(--color-blue-pop)] border-[3px] border-black p-4 shadow-[4px_4px_0_#000]">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white border-[3px] border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#000]">
                      SM
                    </div>
                    <div>
                      <div className="w-32 h-6 bg-black mb-2"></div>
                      <div className="w-48 h-3 bg-black/40"></div>
                    </div>
                  </div>
                </div>

                {/* Cards */}
                <div className="grid grid-cols-2 gap-6 mt-2">
                  <div className="bg-[var(--color-yellow-pop)] border-[3px] border-black p-5 shadow-[4px_4px_0_#000]">
                    <div className="w-12 h-12 bg-white border-[3px] border-black mb-4 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 stroke-[3px]" />
                    </div>
                    <div className="w-3/4 h-5 bg-black mb-3"></div>
                    <div className="w-full h-2 bg-black/50"></div>
                  </div>
                  <div className="bg-[var(--color-red-pop)] border-[3px] border-black p-5 shadow-[4px_4px_0_#000] flex flex-col justify-end min-h-[140px]">
                    <div className="w-12 h-12 bg-white border-[3px] border-black mb-4 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 stroke-[3px]" />
                    </div>
                    <div className="w-3/4 h-6 bg-white border-2 border-black mb-3"></div>
                    <div className="w-1/2 h-2 bg-black"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Vì sao Smarm ra đời */}
      <section className="py-24 md:py-32 bg-[var(--color-primary)] relative overflow-hidden border-b-[3px] border-black">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <FadeInWhenVisible>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-6xl font-black text-black mb-6 uppercase tracking-tighter" style={{ textShadow: "4px 4px 0 #fff" }}>
                Vì sao Smarm ra đời?
              </h2>
            </div>
            <div className="bg-white brutal-card p-10 md:p-16">
              <p className="text-lg md:text-2xl text-black leading-relaxed font-bold uppercase tracking-tight">
                Trong bối cảnh xã hội ngày càng phát triển và đa dạng hóa ngành
                nghề, việc lựa chọn một con đường sự nghiệp phù hợp trở nên khó
                khăn hơn bao giờ hết. Rất nhiều học sinh,
                sinh viên đang phải đối mặt với sự hoang mang, áp lực từ gia
                đình, hoặc thiếu hiểu biết thực tế.
                <br />
                <br />
                <span className="bg-[var(--color-yellow-pop)] px-2 border border-black shadow-[2px_2px_0_#000] text-black font-black">Smarm</span> ra
                đời với sứ mệnh trở thành người bạn đồng hành đáng tin cậy, cung
                cấp công cụ đánh giá khoa học dựa trên lý thuyết Holland
                (RIASEC), giúp các bạn trẻ thấu hiểu bản thân, khám phá thế mạnh
                và tìm ra những nhóm ngành nghề thực sự phù hợp.
              </p>
            </div>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* Hướng dẫn sử dụng - Zig-zag Layout */}
      <section className="py-24 md:py-32 bg-[var(--color-background)] relative border-b-[3px] border-black">
        <div className="max-w-6xl mx-auto px-4">
          <FadeInWhenVisible>
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-black text-black mb-6 uppercase tracking-tighter" style={{ textShadow: "4px 4px 0 var(--color-primary)" }}>
                Lộ trình 6 bước
              </h2>
            </div>
          </FadeInWhenVisible>

          <div className="flex flex-col gap-16 md:gap-24">
            {guideSteps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <FadeInWhenVisible key={index} delay={0.1}>
                  <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-16`}>
                    <div className="w-full md:w-1/2 flex justify-center">
                      <div className={`w-48 h-48 md:w-64 md:h-64 border-[4px] border-black flex items-center justify-center shadow-[8px_8px_0_#000] ${step.color} transform hover:-rotate-3 transition-transform duration-300`}>
                         <div className="scale-[2] md:scale-[3]">{step.icon}</div>
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 flex flex-col items-start">
                      <div className="text-6xl font-black text-transparent [-webkit-text-stroke:2px_black] mb-4">
                        0{index + 1}
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black mb-6 text-black uppercase tracking-tighter">
                        {step.title}
                      </h3>
                      <p className="text-xl font-bold text-black/80 leading-relaxed">
                        {step.content}
                      </p>
                    </div>
                  </div>
                </FadeInWhenVisible>
              )
            })}
          </div>
        </div>
      </section>

      {/* Có thể bạn chưa biết - Redesigned to List */}
      <section className="py-24 md:py-32 bg-[var(--color-blue-pop)] border-b-[3px] border-black">
        <div className="max-w-5xl mx-auto px-4">
          <FadeInWhenVisible>
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-black text-black mb-6 uppercase tracking-tighter" style={{ textShadow: "4px 4px 0 #fff" }}>
                Có thể bạn chưa biết
              </h2>
            </div>
          </FadeInWhenVisible>

          <div className="space-y-12">
            {facts.map((fact, index) => (
              <FadeInWhenVisible key={index} delay={0.1}>
                <div className="brutal-card bg-white p-8 md:p-12 flex flex-col md:flex-row gap-8 items-start hover:bg-[var(--color-yellow-pop)] transition-colors">
                  <div className="w-20 h-20 bg-black text-white flex items-center justify-center flex-shrink-0 border-[3px] border-black shadow-[4px_4px_0_#fff]">
                    <Quote className="w-10 h-10" />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <h3 className="text-2xl md:text-3xl font-black text-black leading-tight uppercase tracking-tight">
                        {fact.title}
                      </h3>
                      <div className="px-4 py-1.5 bg-white border-[3px] border-black shadow-[2px_2px_0_#000]">
                        <span className="text-sm font-black text-black uppercase tracking-widest">
                          Sự thật #{index + 1}
                        </span>
                      </div>
                    </div>

                    <p className="text-xl text-black font-bold mb-8">
                      {fact.content}
                    </p>

                    <div className="flex items-center gap-3 text-black">
                      <div className="w-8 h-[3px] bg-black"></div>
                      <p className="text-sm font-black uppercase tracking-widest bg-[var(--color-primary)] px-2 border-2 border-black">
                        Nguồn: {fact.source}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeInWhenVisible>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 bg-[var(--color-primary)] relative border-b-[3px] border-black overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <FadeInWhenVisible>
            <h2 className="text-4xl md:text-7xl font-black text-black mb-12 uppercase tracking-tighter" style={{ textShadow: "4px 4px 0 #fff" }}>
              Sẵn sàng khám phá bản thân?
            </h2>
            <Link
              to="/auth"
              className="brutal-btn inline-flex items-center justify-center px-12 py-6 text-2xl font-black text-white bg-black hover:bg-[var(--color-secondary)] uppercase tracking-widest shadow-[8px_8px_0_#fff]"
            >
              Bắt đầu ngay
              <ArrowRight className="ml-4 w-8 h-8 stroke-[3px]" />
            </Link>
          </FadeInWhenVisible>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-12 border-t-[4px] border-black">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-4xl font-black tracking-tighter" style={{ textShadow: "2px 2px 0 var(--color-primary)" }}>
            Smarm.
          </div>
          <p className="font-bold text-sm uppercase tracking-widest text-center">
            © 2026 Smarm • Nền Tảng Theo Dõi & Định Hướng Tương Lai
          </p>
          <div className="flex gap-6">
            <span
              onClick={() => setActivePolicyModal('terms')}
              className="text-sm font-black uppercase hover:text-[var(--color-primary)] cursor-pointer transition-colors border-b-2 border-transparent hover:border-[var(--color-primary)]"
            >
              Điều khoản
            </span>
            <span
              onClick={() => setActivePolicyModal('privacy')}
              className="text-sm font-black uppercase hover:text-[var(--color-primary)] cursor-pointer transition-colors border-b-2 border-transparent hover:border-[var(--color-primary)]"
            >
              Bảo mật
            </span>
          </div>
        </div>
      </footer>

      {/* Policy Modal */}
      <AnimatePresence>
        {activePolicyModal && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0_#000] max-w-2xl w-full max-h-[85vh] flex flex-col relative"
            >
              <button
                onClick={() => setActivePolicyModal(null)}
                className="absolute top-4 right-4 p-2 text-black hover:bg-black/5 border-[3px] border-transparent hover:border-black transition-all bg-white shadow-[2px_2px_0_#000] cursor-pointer z-10"
              >
                <X className="w-5 h-5 stroke-[4px]" />
              </button>

              <h3 className="font-black text-3xl text-black uppercase tracking-tight mb-6 pr-12 pb-3 border-b-[4px] border-black flex items-center gap-3">
                <span className="w-3.5 h-3.5 bg-[var(--color-primary)] inline-block border-[2px] border-black shadow-[1px_1px_0_#000]"></span>
                {activePolicyModal === 'terms' ? 'Điều khoản dịch vụ' : 'Chính sách bảo mật'}
              </h3>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar text-black font-bold text-sm md:text-base space-y-6 leading-relaxed">
                {activePolicyModal === 'terms' ? (
                  <>
                    <p className="border-l-[4px] border-[var(--color-primary)] pl-3 text-black/70">
                      Chào mừng bạn đến với Smarm. Khi bạn đăng ký tài khoản và sử dụng các tính năng trên hệ thống của chúng tôi, bạn mặc định đồng ý tuân thủ các điều khoản dịch vụ dưới đây.
                    </p>
                    <div>
                      <h4 className="font-black text-lg text-black uppercase mb-1">1. Mục đích của dịch vụ</h4>
                      <p className="text-black/85">
                        Smarm cung cấp nền tảng số hỗ trợ học sinh trung học phổ thông định hướng nghề nghiệp thông qua bài kiểm tra trắc nghiệm Holland, lưu trữ điểm số, dự đoán xác suất trúng tuyển đại học và tương tác hỗ trợ học tập với AI Chatbot (Smarm AI). Mọi kết quả phân tích và lời khuyên của hệ thống đều mang tính chất tham khảo, không thay thế cho thông tin tuyển sinh chính thức từ Bộ Giáo dục và Đào tạo hay các trường Đại học.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-black uppercase mb-1">2. Trách nhiệm tài khoản</h4>
                      <p className="text-black/85">
                        Bạn có trách nhiệm tự bảo mật thông tin đăng nhập và mật khẩu của mình. Bạn cam kết thông tin cung cấp trên hệ thống là trung thực và chịu hoàn toàn trách nhiệm đối với mọi hoạt động diễn ra dưới tài khoản của mình.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-black uppercase mb-1">3. Quyền sở hữu trí tuệ</h4>
                      <p className="text-black/85">
                        Toàn bộ tài nguyên, giao diện thiết kế, cơ sở dữ liệu, biểu tượng, logo và các thuật toán tính toán/phân tích thuộc quyền sở hữu trí tuệ độc quyền của Smarm. Bạn không được phép sao chép, thương mại hóa hoặc can thiệp trái phép vào hệ thống.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-black uppercase mb-1">4. Giới hạn trách nhiệm pháp lý</h4>
                      <p className="text-black/85">
                        Chúng tôi nỗ lực tối đa để cung cấp thuật toán chính xác và dữ liệu cập nhật. Tuy nhiên, Smarm không chịu bất kỳ trách nhiệm pháp lý nào đối với các quyết định học tập, lựa chọn nguyện vọng thi cử hoặc kết quả tuyển sinh cuối cùng của người dùng.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="border-l-[4px] border-[var(--color-primary)] pl-3 text-black/70">
                      Sự riêng tư của bạn là ưu tiên hàng đầu của chúng tôi. Chính sách này quy định rõ cách chúng tôi thu thập, lưu trữ và bảo vệ dữ liệu cá nhân của bạn.
                    </p>
                    <div>
                      <h4 className="font-black text-lg text-black uppercase mb-1">1. Dữ liệu thu thập</h4>
                      <p className="text-black/85">
                        Chúng tôi chỉ thu thập các dữ liệu cần thiết phục vụ cho việc tính toán định hướng, bao gồm: Họ tên, tên đăng nhập, điểm số học tập từng môn học, nguyện vọng trường học mục tiêu, kết quả trắc nghiệm tính cách Holland và các đoạn hội thoại trao đổi với trợ lý ảo Smarm AI.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-black uppercase mb-1">2. Mục đích sử dụng</h4>
                      <p className="text-black/85">
                        Dữ liệu của bạn được sử dụng duy nhất nhằm mục đích cá nhân hóa: hiển thị biểu đồ học tập, ước lượng xác suất đỗ ngành học và cung cấp phản hồi thông minh/đúng ngữ cảnh của Smarm AI. Chúng tôi cam kết tuyệt đối không bán, chia sẻ hoặc cung cấp thông tin của bạn cho bất kỳ bên thứ ba nào vì mục đích quảng cáo hoặc mục đích thương mại khác.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-black uppercase mb-1">3. Bảo mật và Lưu trữ</h4>
                      <p className="text-black/85">
                        Dữ liệu của bạn được lưu trữ an toàn trong Local Storage của trình duyệt và đồng bộ hóa bảo mật về máy chủ thông qua các kết nối được mã hóa. Bạn có toàn quyền xóa vĩnh viễn toàn bộ dữ liệu này bằng nút xóa dữ liệu trong trang Cài đặt.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-black text-lg text-black uppercase mb-1">4. Thay đổi chính sách</h4>
                      <p className="text-black/85">
                        Chúng tôi có quyền cập nhật chính sách bảo mật này để phù hợp với sự thay đổi của các tính năng mới trên ứng dụng. Mọi cập nhật sẽ được hiển thị công khai trên trang chủ.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 pt-4 border-t-[3px] border-black flex justify-end">
                <button
                  onClick={() => setActivePolicyModal(null)}
                  className="px-6 py-2 bg-black hover:bg-gray-800 text-white font-black uppercase border-[3px] border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all cursor-pointer text-sm"
                >
                  Tôi đã hiểu
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
