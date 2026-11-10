import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Loader2,
  Sparkles,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { AiMarkdown } from "../../components/AiMarkdown";
import { api } from "../../lib/api";
import { readArray } from "../../lib/localData";

// cleanText from Result.tsx
const cleanText = (text: string) => {
  return text
    .replace(/```markdown\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
};

export default function SocialReviewTab() {
  const [aspirations, setAspirations] = useState<any[]>([]);
  const [selectedUni, setSelectedUni] = useState<any>(null);
  const [reviews, setReviews] = useState<
    Record<string, { loading: boolean; data?: string; error?: string }>
  >({});
  const [apiWorkerStatus, setApiWorkerStatus] = useState("");

  // Handle AI API progress events
  useEffect(() => {
    const handleApiProgress = (e: any) => {
      if (e.detail) {
        setApiWorkerStatus(e.detail);
      }
    };
    window.addEventListener("api_action_progress", handleApiProgress);
    return () =>
      window.removeEventListener("api_action_progress", handleApiProgress);
  }, []);

  useEffect(() => {
    const parsed = readArray<{ name?: string }>("smarm_aspirations");
    setAspirations(parsed);
    if (parsed.length > 0 && parsed[0] && typeof parsed[0] === "object") {
      setSelectedUni(parsed[0]);
    }
  }, []);

  const fetchReview = async (uniTitle: string) => {
    setReviews((prev) => ({
      ...prev,
      [uniTitle]: { loading: true, error: undefined },
    }));
    setApiWorkerStatus("Đang kết nối hệ thống tìm kiếm...");
    try {
      let searchContext = "";
      try {
        const queries = [
          `review đánh giá chất lượng trường ${uniTitle} từ sinh viên confessions diễn đàn`,
          `${uniTitle} học phí cơ sở vật chất việc làm sinh viên đánh giá 2024 2025`,
        ];
        setApiWorkerStatus("Đang tìm kiếm thông tin trên các diễn đàn và mạng xã hội...");
        const batches = await Promise.allSettled(queries.map((q) => api.exaSearch(q, 5)));
        const merged: any[] = [];
        const seen = new Set<string>();
        for (const batch of batches) {
          if (batch.status !== "fulfilled" || !Array.isArray(batch.value)) continue;
          for (const r of batch.value) {
            const key = String(r?.url || "").toLowerCase();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            merged.push(r);
          }
        }

        if (merged.length > 0) {
          searchContext = merged
            .map(
              (r: any) =>
                `Nguồn: ${r.url || "N/A"}\nNội dung: ${(r.text || r.snippet || "").substring(0, 1000)}`,
            )
            .join("\n---\n");
        }
      } catch (searchError) {
        console.warn("Exa Search failed, falling back to AI knowledge:", searchError);
      }

      let prompt = "";
      let systemInstruction = "";

      if (searchContext) {
        setApiWorkerStatus("Đang phân tích dữ liệu tìm kiếm thời gian thực...");
        prompt = `Bạn là một nhà phân tích phương tiện truyền thông xã hội tại Việt Nam. Dựa trên các kết quả tìm kiếm sau từ diễn đàn, mạng xã hội và Google, hãy tổng hợp "Góc nhìn Chân thật" về trường "${uniTitle}".

        YÊU CẦU:
        - Viết một báo cáo TRUNG LẬP, KHÁCH QUAN, phản ánh đúng ý kiến thực tế của sinh viên, cựu sinh viên và cộng đồng mạng.
        - Chia rõ các mục:
          1. 👍 ĐIỂM CỘNG (Ưu điểm thực tế, cơ hội việc làm, phong trào, giảng viên...)
          2. 👎 ĐIỂM TRỪ (Nhược điểm, phàn nàn phổ biến về học phí, thủ tục hành chính, cơ sở vật chất...)
          3. 🏫 Môi trường học tập & Đời sống sinh viên
          4. 💬 Lời khuyên cho tân sinh viên
        - Bắt đầu luôn bằng nội dung báo cáo (tiêu đề ##), KHÔNG chào hỏi, KHÔNG có câu mào đầu, KHÔNG lặp lại yêu cầu.
        - Dùng Markdown đẹp, in đậm thông tin quan trọng. Sử dụng emoji phù hợp để trực quan sinh động.
        - Sát với nguồn thông tin tìm được.
        - Không viết "chưa có dữ liệu xác nhận" hay "chưa xác định" lặp lại trong từng mục; nếu nguồn ít, hãy tổng hợp từ trải nghiệm chung của sinh viên và chỉ dùng tối đa MỘT câu ghi chú ngắn.

        DỮ LIỆU TÌM ĐƯỢC:
        ${searchContext}`;
        systemInstruction = "Chỉ tổng hợp góc nhìn mạng xã hội trực tiếp, dùng Markdown.";
      } else {
        setApiWorkerStatus("Đang tổng hợp nhận xét từ cơ sở dữ liệu tri thức của Smarm AI...");
        prompt = `Bạn là một chuyên gia hướng nghiệp và phân tích truyền thông giáo dục tại Việt Nam. Hãy tổng hợp "Góc nhìn Chân thật" và khách quan về trường "${uniTitle}" dựa trên những phản hồi, đánh giá và review phổ biến từ các thế hệ sinh viên trên các diễn đàn (như Facebook Groups, Confessions, Reddit).

        YÊU CẦU:
        - Viết một báo cáo TRUNG LẬP, KHÁCH QUAN, phản ánh đúng thực tế ý kiến của sinh viên và cựu sinh viên.
        - Chia rõ các mục:
          1. 👍 ĐIỂM CỘNG (Các điểm mạnh nổi bật của trường như danh tiếng, ngành mũi nhọn, cơ hội nghề nghiệp, giảng viên, hoạt động ngoại khóa...)
          2. 👎 ĐIỂM TRỪ (Các phàn nàn thường gặp như học phí, áp lực thi cử, cơ sở vật chất, thủ tục hành chính...)
          3. 🏫 Môi trường học tập & Đời sống sinh viên
          4. 💬 Lời khuyên cho tân sinh viên
        - Bắt đầu luôn bằng nội dung báo cáo (tiêu đề ##), KHÔNG chào hỏi, KHÔNG có câu mào đầu, KHÔNG lặp lại yêu cầu.
        - Trình bày bằng Markdown đẹp, dễ đọc, in đậm các ý chính. Sử dụng emoji phù hợp để trực quan sinh động.
        - Không viết "chưa có dữ liệu xác nhận" hay "chưa xác định" lặp lại trong từng mục; chỉ dùng tối đa MỘT câu ghi chú ngắn nếu thật sự cần.`;
        systemInstruction = "Bạn là chuyên gia tư vấn hướng nghiệp và phân tích truyền thông xã hội. Trả về kết quả dạng Markdown trực tiếp.";
      }

      let aiContent = "";
      let isFirstChunk = true;

      const summaryRaw = await api.deepseekProcess(
        prompt,
        systemInstruction,
        false,
        (chunk) => {
          if (isFirstChunk) {
            isFirstChunk = false;
            setReviews((prev) => ({
              ...prev,
              [uniTitle]: { loading: false, data: "" },
            }));
          }
          aiContent += chunk;
          const cleanChunk = cleanText(aiContent);
          setReviews((prev) => ({
            ...prev,
            [uniTitle]: { loading: false, data: cleanChunk },
          }));
        },
      );

      const summary = cleanText(summaryRaw);
      if (!summary) {
        throw new Error("AI chưa trả về đánh giá, bạn thử lại nhé.");
      }
      setReviews((prev) => ({
        ...prev,
        [uniTitle]: { loading: false, data: summary },
      }));
    } catch (e: any) {
      console.error("Error fetching university reviews:", e);
      setReviews((prev) => ({
        ...prev,
        [uniTitle]: {
          loading: false,
          error: e.message || "Lỗi khi tải đánh giá.",
        },
      }));
    }
  };

  if (aspirations.length === 0) {
    return (
      <div className="p-6 md:p-8 pb-24 md:pb-32 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-blue-pop border-[4px] border-black flex items-center justify-center mb-8 shadow-[6px_6px_0_#000]">
          <MessageSquare className="w-12 h-12 text-black stroke-[3px]" />
        </div>
        <h2 className="text-3xl font-black text-black mb-6 uppercase tracking-tight">
          Chưa có trường mục tiêu
        </h2>
        <p className="text-black font-bold max-w-md text-lg bg-white p-6 border-[3px] border-black shadow-[4px_4px_0_#000]">
          Bạn cần hoàn thành bài trắc nghiệm Holland và chọn trường đại học mục
          tiêu để xem Góc nhìn trên mạng xã hội.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 md:pb-32 max-w-7xl mx-auto space-y-8">
      <div className="mb-10 pb-4 border-b-[4px] border-black">
        <h1 className="text-4xl font-black text-black flex items-center mb-4 uppercase tracking-tight">
          <div className="w-12 h-12 bg-blue-pop border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000]">
            <MessageSquare className="w-6 h-6 text-black stroke-[3px]" />
          </div>
          Góc Nhìn Khách Quan
        </h1>
        <p className="text-lg font-bold text-black/80 leading-relaxed max-w-2xl border-l-[4px] border-blue-pop pl-3">
          Khám phá những đánh giá, bình luận chân thật nhất từ cộng đồng sinh
          viên, các diễn đàn và mạng xã hội về các trường đại học mục tiêu của
          bạn.
        </p>
      </div>

      <div className="flex overflow-x-auto pb-6 gap-4 hide-scrollbar">
        {aspirations.map((uni, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedUni(uni)}
            className={`whitespace-nowrap px-6 py-3 font-black uppercase transition-transform active:translate-x-1 active:translate-y-1 active:shadow-none border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center ${
              selectedUni?.name === uni.name
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-blue-pop/15"
            }`}
          >
            {uni.name}
          </button>
        ))}
      </div>

      {selectedUni && (
        <motion.div
          key={selectedUni.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="brutal-card bg-white p-6 md:p-10"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b-[4px] border-black gap-6">
            <div>
              <h2 className="font-black text-3xl text-black uppercase tracking-tight">
                {selectedUni.name}
              </h2>
              {selectedUni.url && (
                <a
                  href={selectedUni.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-black font-bold hover:text-[var(--color-blue-pop)] text-sm flex items-center mt-4 w-max transition-colors underline decoration-2 underline-offset-4"
                >
                  <ExternalLink className="w-4 h-4 mr-2 stroke-[3px]" /> Visit Website
                </a>
              )}
            </div>
            {!reviews[selectedUni.name]?.data &&
              !reviews[selectedUni.name]?.loading && (
                <button
                  onClick={() => fetchReview(selectedUni.name)}
                  className="brutal-btn px-6 py-4 bg-blue-pop font-black text-black uppercase flex items-center shadow-[6px_6px_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none whitespace-nowrap"
                >
                  <Sparkles className="w-6 h-6 mr-3 stroke-[3px]" />
                  Khám phá đánh giá
                </button>
              )}
            {reviews[selectedUni.name]?.data &&
              !reviews[selectedUni.name]?.loading && (
                <button
                  onClick={() => fetchReview(selectedUni.name)}
                  className="px-6 py-3 font-black text-black bg-blue-pop uppercase border-[3px] border-black flex items-center shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <RefreshCw className="w-5 h-5 mr-2 stroke-[3px]" />
                  Tải lại
                </button>
              )}
          </div>

          <div className="min-h-[300px]">
            {reviews[selectedUni.name]?.loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-black">
                <div className="w-16 h-16 bg-blue-pop border-[3px] border-black flex items-center justify-center mb-6 shadow-[4px_4px_0_#000] animate-bounce">
                  <Loader2 className="w-8 h-8 animate-spin stroke-[3px]" />
                </div>
                <p className="text-lg font-black uppercase tracking-tight bg-white border-[3px] border-black px-4 py-2">
                  {apiWorkerStatus || "Đang tổng hợp dữ liệu..."}
                </p>
              </div>
            ) : reviews[selectedUni.name]?.error ? (
              <div className="bg-[var(--color-red-pop)] p-10 border-[4px] border-black shadow-[8px_8px_0_#000] flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white border-[3px] border-black flex items-center justify-center mb-6 shadow-[4px_4px_0_#000]">
                  <AlertCircle className="w-8 h-8 text-black stroke-[3px]" />
                </div>
                <h3 className="text-black text-2xl font-black mb-4 uppercase">Đã xảy ra lỗi</h3>
                <p className="text-black font-bold mb-8 text-lg">
                  {reviews[selectedUni.name]?.error}
                </p>
                <button
                  onClick={() => fetchReview(selectedUni.name)}
                  className="px-8 py-4 bg-white font-black text-black border-[3px] border-black uppercase shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none text-lg"
                >
                  Thử lại
                </button>
              </div>
            ) : reviews[selectedUni.name]?.data ? (
              <div className="mt-animation text-black font-medium markdown-body max-w-none">
                <AiMarkdown content={reviews[selectedUni.name]?.data || ""} />
              </div>
            ) : (
              <div className="bg-[var(--color-background)] border-[3px] border-black p-10 flex flex-col items-center text-center shadow-[inset_0_4px_0_rgba(0,0,0,0.1)]">
                <div className="bg-white w-20 h-20 border-[4px] border-black flex items-center justify-center mb-6 shadow-[4px_4px_0_#000]">
                  <MessageSquare className="w-10 h-10 text-black stroke-[3px]" />
                </div>
                <h3 className="font-black text-black text-2xl mb-4 uppercase">
                  Chưa có dữ liệu
                </h3>
                <p className="text-black font-bold max-w-md text-lg">
                  Hãy nhấn nút "Khám phá đánh giá" để AI tìm kiếm và tổng hợp
                  các nhận xét khách quan nhất về trường này.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
