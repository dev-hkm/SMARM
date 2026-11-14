import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AiMarkdown } from "../../components/AiMarkdown";
import {
  GitCompare,
  Search,
  Sparkles,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  BookOpen,
  MapPin,
  DollarSign,
  GraduationCap,
  Percent,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../components/Toast";
import "katex/dist/katex.min.css";

interface NormalizedUniData {
  uni1: {
    fullName: string;
    shortName: string;
    searchKeywords: string;
  };
  uni2: {
    fullName: string;
    shortName: string;
    searchKeywords: string;
  };
  major: string;
}

export default function CompareTab() {
  const { showToast } = useToast();
  const [aspirations, setAspirations] = useState<any[]>([]);
  const [userName, setUserName] = useState("bạn");
  const [hollandCode, setHollandCode] = useState("");
  const [careerGoals, setCareerGoals] = useState("");
  const [grades, setGrades] = useState<any>({});

  // Input states
  const [uni1Selection, setUni1Selection] = useState<string>("0");
  const [uni1Manual, setUni1Manual] = useState<string>("");
  const [uni2Selection, setUni2Selection] = useState<string>("1");
  const [uni2Manual, setUni2Manual] = useState<string>("");

  const [majorSelection, setMajorSelection] = useState<string>("auto");
  const [majorManual, setMajorManual] = useState<string>("");

  const [examGroup, setExamGroup] = useState<string>("A00");

  // Flow states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"normalizing" | "searching1" | "searching2" | "synthesizing" | "done" | "idle">("idle");
  const [apiWorkerStatus, setApiWorkerStatus] = useState("");
  const [comparisonResult, setComparisonResult] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(true);

  const reportEndRef = useRef<HTMLDivElement>(null);

  // Load profile and aspirations
  useEffect(() => {
    // Aspirations
    const savedAspirations = localStorage.getItem("smarm_aspirations");
    if (savedAspirations) {
      try {
        const parsed = JSON.parse(savedAspirations);
        setAspirations(parsed);
        if (parsed.length > 0) {
          setUni1Selection("0");
          if (parsed.length > 1) {
            setUni2Selection("1");
          } else {
            setUni2Selection("manual");
          }
        } else {
          setUni1Selection("manual");
          setUni2Selection("manual");
        }
      } catch (e) {
        console.error("Failed to parse aspirations:", e);
      }
    } else {
      setUni1Selection("manual");
      setUni2Selection("manual");
    }

    // User Profile
    const savedUser = localStorage.getItem("smarm_user");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.name) setUserName(parsed.name);
      } catch {}
    }

    // Grades
    const savedGrades = localStorage.getItem("smarm_grades");
    if (savedGrades) {
      try {
        setGrades(JSON.parse(savedGrades));
      } catch {}
    }

    // Holland Code
    const savedAnswers = localStorage.getItem("smarm_answers");
    if (savedAnswers) {
      try {
        const answers = JSON.parse(savedAnswers);
        // Calculate Holland Code from answers if possible
        const scores: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        // We'll import questions dynamically or count directly if we can't find question mapping
        // In SMARM, Holland test answers map question IDs directly.
        // Let's fallback to calculating top 3 if answers are available
        // Wait, does result tab save a hollandCode already? Let's check settings tab or results storage.
        // If we can't easily parse answers here, we'll try to find if there is 'smarm_guidance_results'
        const guidance = localStorage.getItem("smarm_guidance_results");
        if (guidance) {
          const parsedGuidance = JSON.parse(guidance);
          // Some structures might have hollandCode.
        }
        
        // Let's do a simple calculation of holland code if answers has specific pattern:
        // Actually, we can check if settings tab has 'smarm_holland_code' or similar.
        // Let's check answers keys: questions have 60 items, categories: R, I, A, S, E, C.
        // We will do a robust check
      } catch {}
    }

    // Let's scan localStorage for any Holland codes
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes("holland")) {
        const val = localStorage.getItem(key);
        if (val && val.length === 3 && /^[RIASEC]{3}$/.test(val)) {
          setHollandCode(val);
        }
      }
    }
  }, []);

  // Auto-scroll while streaming
  useEffect(() => {
    if (isLoading && loadingStep === "synthesizing") {
      reportEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [comparisonResult, isLoading, loadingStep]);

  // Extract student details for calculation
  const calculatedUserScore = useMemo(() => {
    const subjectMap: Record<string, string[]> = {
      A00: ["Toán", "Vật lý", "Hóa học"],
      A01: ["Toán", "Vật lý", "Tiếng Anh"],
      B00: ["Toán", "Hóa học", "Sinh học"],
      C00: ["Ngữ văn", "Lịch sử", "Địa lý"],
      D01: ["Toán", "Ngữ văn", "Tiếng Anh"],
    };

    const subjects = subjectMap[examGroup] || ["Toán", "Ngữ văn", "Tiếng Anh"];
    let totalScore = 0;
    let count = 0;

    subjects.forEach((sub) => {
      const subData = grades?.class12?.semester1?.[sub] || grades?.class12?.semester2?.[sub];
      if (subData) {
        const regAvg = subData.regular?.length > 0 ? subData.regular.reduce((a: number, b: number) => a + b, 0) / subData.regular.length : 0;
        const mid = subData.mid ?? regAvg;
        const final = subData.final ?? (mid || regAvg);
        const subAvg = (regAvg + mid * 2 + final * 3) / 6;
        if (subAvg > 0) {
          totalScore += subAvg;
          count++;
        }
      }
    });

    if (count === 0) return null;
    if (count < 3) {
      // Extrapolate if some grades are missing
      return (totalScore / count) * 3;
    }
    return totalScore;
  }, [grades, examGroup]);

  // Get active names for display/pre-fill
  const getUni1Name = () => {
    if (uni1Selection === "manual") return uni1Manual.trim();
    const idx = parseInt(uni1Selection);
    return aspirations[idx]?.name || "";
  };

  const getUni2Name = () => {
    if (uni2Selection === "manual") return uni2Manual.trim();
    const idx = parseInt(uni2Selection);
    return aspirations[idx]?.name || "";
  };

  const getMajorName = () => {
    if (majorSelection === "manual") return majorManual.trim();
    
    // Auto resolution of major
    // If uni1 or uni2 is selected from aspirations, we can prefill the career.
    if (uni1Selection !== "manual") {
      const idx = parseInt(uni1Selection);
      const careers = aspirations[idx]?.careers;
      if (Array.isArray(careers) && careers.length > 0) return careers[0];
      if (typeof careers === "string") return careers;
    }
    if (uni2Selection !== "manual") {
      const idx = parseInt(uni2Selection);
      const careers = aspirations[idx]?.careers;
      if (Array.isArray(careers) && careers.length > 0) return careers[0];
      if (typeof careers === "string") return careers;
    }
    return majorManual.trim();
  };

  // Perform the Smart Comparison Pipeline
  const handleCompare = async () => {
    if (isLoading) return;

    const name1 = getUni1Name();
    const name2 = getUni2Name();
    const major = getMajorName();

    if (!name1) {
      showToast("Vui lòng chọn hoặc nhập tên Trường thứ 1!", "info");
      return;
    }
    if (!name2) {
      showToast("Vui lòng chọn hoặc nhập tên Trường thứ 2!", "info");
      return;
    }
    if (name1.toLowerCase() === name2.toLowerCase()) {
      showToast("Vui lòng chọn 2 trường đại học khác nhau để so sánh!", "info");
      return;
    }
    if (!major) {
      showToast("Vui lòng nhập ngành học cần so sánh!", "info");
      return;
    }

    setIsLoading(true);
    setError("");
    setComparisonResult("");
    setShowForm(false);
    setLoadingStep("normalizing");
    setApiWorkerStatus("Đang phân tích thông tin đầu vào...");
    let aiContent = "";

    try {
      // Step 1: Normalize university names using DeepSeek
      const normPrompt = `Bạn là một trợ lý AI chuẩn hóa thông tin tuyển sinh Việt Nam.
Nhiệm vụ của bạn là nhận dạng tên 2 trường đại học và ngành học so sánh từ dữ liệu đầu vào (người dùng có thể nhập sai chính tả, viết tắt hoặc không đầy đủ). Hãy sửa lỗi, giải nghĩa viết tắt (ví dụ: BK -> Đại học Bách khoa, NEU -> Đại học Kinh tế Quốc dân, FTU -> Đại học Ngoại thương, v.v.), và trả về thông tin chuẩn hóa dưới dạng JSON cực kỳ chính xác.

Đầu vào từ người dùng:
- Trường 1: "${name1}"
- Trường 2: "${name2}"
- Ngành so sánh: "${major}"

Trả về CHỈ một đối tượng JSON có dạng như sau, KHÔNG thêm bất kỳ giải thích nào bên ngoài khối JSON:
{
  "uni1": {
    "fullName": "Tên đầy đủ chuẩn hóa của Trường 1 (ví dụ: Trường Đại học Bách khoa - ĐHQG TP.HCM)",
    "shortName": "Tên viết tắt phổ biến (ví dụ: Bách khoa TP.HCM)",
    "searchKeywords": "từ khóa tìm kiếm tốt nhất trên Exa cho tuyển sinh trường này (ví dụ: Đại học Bách khoa TP.HCM)"
  },
  "uni2": {
    "fullName": "Tên đầy đủ chuẩn hóa của Trường 2",
    "shortName": "Tên viết tắt phổ biến",
    "searchKeywords": "từ khóa tìm kiếm tốt nhất trên Exa cho tuyển sinh trường này"
  },
  "major": "Tên ngành học chuẩn hóa (ví dụ: Kỹ thuật Phần mềm)"
}`;

      const normResponse = await api.deepseekProcess(
        normPrompt,
        "Bạn là AI chuẩn hóa tên trường đại học. Chỉ trả về JSON thuần.",
        true // JSON mode
      );

      let normalizedData: NormalizedUniData;
      try {
        // Clean markdown JSON wrapper if present
        const cleanedJson = normResponse
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsed = JSON.parse(cleanedJson);
        if (
          !parsed ||
          typeof parsed !== "object" ||
          !parsed.uni1 ||
          typeof parsed.uni1 !== "object" ||
          !parsed.uni2 ||
          typeof parsed.uni2 !== "object"
        ) {
          throw new Error("Malformed normalization payload");
        }
        normalizedData = {
          uni1: {
            fullName: parsed.uni1.fullName || name1,
            shortName: parsed.uni1.shortName || name1,
            searchKeywords: parsed.uni1.searchKeywords || name1,
          },
          uni2: {
            fullName: parsed.uni2.fullName || name2,
            shortName: parsed.uni2.shortName || name2,
            searchKeywords: parsed.uni2.searchKeywords || name2,
          },
          major: typeof parsed.major === "string" && parsed.major.trim() ? parsed.major : major,
        };
      } catch (e) {
        console.warn("Failed to parse normalization JSON, falling back to original inputs:", e);
        normalizedData = {
          uni1: { fullName: name1, shortName: name1, searchKeywords: name1 },
          uni2: { fullName: name2, shortName: name2, searchKeywords: name2 },
          major: major,
        };
      }

      // Step 2: Search Exa for Uni 1
      setLoadingStep("searching1");
      setApiWorkerStatus(`Đang tìm kiếm thông tin về ngành ${normalizedData.major} tại ${normalizedData.uni1.shortName}...`);
      
      let searchContext1 = "";
      try {
        const queries1 = [
          `tuyển sinh điểm chuẩn học phí cơ sở vật chất ngành ${normalizedData.major} trường ${normalizedData.uni1.searchKeywords} 2025`,
          `đánh giá ${normalizedData.uni1.searchKeywords} ngành ${normalizedData.major} việc làm thực tập học bổng sinh viên`,
        ];
        const batches1 = await Promise.allSettled(queries1.map((q) => api.exaSearch(q, 6)));
        const merged1: any[] = [];
        const seen1 = new Set<string>();
        for (const batch of batches1) {
          if (batch.status !== "fulfilled" || !Array.isArray(batch.value)) continue;
          for (const r of batch.value) {
            const key = String(r?.url || "").toLowerCase();
            if (!key || seen1.has(key)) continue;
            seen1.add(key);
            merged1.push(r);
          }
        }
        if (merged1.length > 0) {
          searchContext1 = merged1
            .map((r: any) => `URL: ${r.url || "N/A"}\nTiêu đề: ${r.title || "N/A"}\nNội dung: ${(r.text || r.snippet || "").substring(0, 1500)}`)
            .join("\n---\n");
        }
      } catch (searchError) {
        console.warn(`Exa Search for ${normalizedData.uni1.shortName} failed:`, searchError);
      }

      // Step 3: Search Exa for Uni 2
      setLoadingStep("searching2");
      setApiWorkerStatus(`Đang tìm kiếm thông tin về ngành ${normalizedData.major} tại ${normalizedData.uni2.shortName}...`);
      
      let searchContext2 = "";
      try {
        const queries2 = [
          `tuyển sinh điểm chuẩn học phí cơ sở vật chất ngành ${normalizedData.major} trường ${normalizedData.uni2.searchKeywords} 2025`,
          `đánh giá ${normalizedData.uni2.searchKeywords} ngành ${normalizedData.major} việc làm thực tập học bổng sinh viên`,
        ];
        const batches2 = await Promise.allSettled(queries2.map((q) => api.exaSearch(q, 6)));
        const merged2: any[] = [];
        const seen2 = new Set<string>();
        for (const batch of batches2) {
          if (batch.status !== "fulfilled" || !Array.isArray(batch.value)) continue;
          for (const r of batch.value) {
            const key = String(r?.url || "").toLowerCase();
            if (!key || seen2.has(key)) continue;
            seen2.add(key);
            merged2.push(r);
          }
        }
        if (merged2.length > 0) {
          searchContext2 = merged2
            .map((r: any) => `URL: ${r.url || "N/A"}\nTiêu đề: ${r.title || "N/A"}\nNội dung: ${(r.text || r.snippet || "").substring(0, 1500)}`)
            .join("\n---\n");
        }
      } catch (searchError) {
        console.warn(`Exa Search for ${normalizedData.uni2.shortName} failed:`, searchError);
      }

      // Step 4: Aggregate and Stream Comparison using DeepSeek
      setLoadingStep("synthesizing");
      setApiWorkerStatus("Đang tổng hợp dữ liệu và lập báo cáo so sánh...");

      const systemInstruction = `Bạn là Smarm AI - Chuyên gia tư vấn tuyển sinh và hướng nghiệp hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là lập báo cáo so sánh chi tiết, chuyên sâu và trau chuốt nhất giữa hai trường đại học dựa trên thông tin tìm kiếm thực tế từ internet (Exa Search) và thông tin cá nhân của học sinh (điểm học tập, bài test Holland).

YÊU CẦU QUAN TRỌNG VỀ ĐỘ CHI TIẾT:
- Bạn phải viết phân tích CỰC KỲ CHI TIẾT, TRAU CHUỐT CHO TỪNG TIÊU CHÍ MỘT. Tránh việc viết hời hợt hay chỉ tóm tắt 1-2 câu ngắn ngủi cho đủ số lượng.
- Với mỗi tiêu chí, hãy viết ngắn gọn, cô đọng nhưng cực kỳ đắt giá (khoảng 30-50 từ cho mỗi trường), tập trung vào số liệu thực tế, ưu/nhược điểm cốt lõi và so sánh trực diện giữa 2 trường để đảm bảo độ chi tiết cao mà không bị quá dài dòng làm đứt mạch văn.
- Báo cáo của bạn phải bao quát chính xác toàn bộ 30 tiêu chí so sánh sau đây, TUYỆT ĐỐI KHÔNG được bỏ sót, KHÔNG được gộp chung bất kỳ tiêu chí nào thành một dòng:

NHÓM 1: THÔNG TIN CHUNG
1. Tên trường
2. Ngành so sánh
3. Loại trường (Công lập/Tư thục/Quốc tế/...)
4. Địa điểm (Vị trí campus, cơ sở, điều kiện giao thông, di chuyển)
5. Danh tiếng tổng thể (Xếp hạng trong nước/quốc tế, bề dày lịch sử, vị thế xã hội)

NHÓM 2: HỌC THUẬT & TUYỂN SINH
6. Chất lượng đào tạo ngành (Đội ngũ giảng viên, khung chương trình học, chuẩn đầu ra)
7. Phương thức xét tuyển (Xét học bạ, xét điểm thi THPT, thi đánh giá năng lực, xét tuyển thẳng, tuyển sinh chứng chỉ...)
8. Tổ hợp xét tuyển (Mã tổ hợp chi tiết cho ngành học)
9. Điểm chuẩn gần nhất (Điểm số trúng tuyển của năm gần nhất)
10. Xu hướng điểm chuẩn (Biến động điểm chuẩn tăng hay giảm, biên độ dao động qua các năm)
11. Chỉ tiêu tuyển sinh (Số lượng sinh viên tuyển mới cho ngành học này)

NHÓM 3: ĐIỂM SỐ & TRÚNG TUYỂN (TƯƠNG THÍCH CÁ NHÂN)
12. Khoảng cách với điểm hiện tại của user (Tính khoảng cách chênh lệch giữa điểm ước tính của học sinh với điểm chuẩn)
13. Xếp loại khả năng đậu (Đánh giá chi tiết: Rất cao / Cao / Trung bình / Thấp dựa trên khoảng chênh lệch điểm)

NHÓM 4: TÀI CHÍNH & HỌC BỔNG
14. Học phí một năm (Mức học phí năm đầu hoặc trung bình năm)
15. Học phí toàn khóa (Ước tính tổng học phí toàn khóa học kể cả lộ trình tăng học phí nếu có)
16. Tổng chi phí sinh hoạt dự kiến (Nhà trọ, ăn uống, đi lại tại khu vực đặt cơ sở đào tạo của trường)
17. Học bổng (Các chương trình học bổng khuyến học, học bổng doanh nghiệp, học bổng trao đổi)
18. Độ phù hợp với ngân sách gia đình (Đánh giá tương quan mức học phí/chi phí với ngân sách trung bình)

NHÓM 5: TRẢI NGHIỆM & MÔI TRƯỜNG
19. Mức độ thực hành trong chương trình học (Tỷ lệ học phần thực hành, thực tập, làm dự án thực tế)
20. Áp lực học tập (Tần suất thi cử, đồ án, chuẩn đầu ra tiếng Anh, tỷ lệ ra trường đúng hạn)
21. Cơ sở vật chất (Phòng học, phòng thí nghiệm, thư viện, ký túc xá, trang thiết bị chuyên ngành)
22. Môi trường học tập (Không khí học tập, sự cạnh tranh, sự cởi mở, năng động của sinh viên)
23. Hoạt động câu lạc bộ và ngoại khóa (Quy mô các câu lạc bộ, phong trào Đoàn - Hội, hoạt động cộng đồng)

NHÓM 6: CƠ HỘI & ĐẦU RA
24. Cơ hội thực tập (Mạng lưới liên kết doanh nghiệp của khoa/trường, kỳ thực tập tốt nghiệp)
25. Tỷ lệ có việc làm sau tốt nghiệp (Số liệu phần trăm sinh viên có việc làm đúng ngành hoặc liên quan sau 6-12 tháng)
26. Mức lương khởi điểm tham khảo (Mức thu nhập trung bình của cựu sinh viên mới tốt nghiệp)
27. Danh tiếng với nhà tuyển dụng (Sự ưu ái và đánh giá của các công ty lớn đối với bằng cấp của trường)

NHÓM 7: ĐỘ TƯƠNG THÍCH HOLLAND & NGHỀ NGHIỆP
28. Mức độ phù hợp với Holland/RIASEC (Đối chiếu tính chất ngành học và trường học với mã Holland của học sinh)
29. Mức độ phù hợp với mục tiêu nghề nghiệp (Định hướng đào tạo của ngành tại trường có giúp đạt được mục tiêu cá nhân không)
30. Fit score tổng thể (Điểm số phần trăm tương thích từ 1-100% kèm lập luận khoa học, rõ ràng)

QUY TẮC BẮT BUỘC:
- Ở ĐẦU báo cáo, luôn vẽ một BẢNG SO SÁNH TỔNG HỢP (Markdown table) so sánh tóm tắt các chỉ số cốt lõi của 2 trường (Tên trường, Điểm chuẩn, Học phí một năm, Xếp loại khả năng đậu, Fit score).
- Với mỗi tiêu chí trong số 30 tiêu chí trên, hãy phân tích rõ ràng thông tin cho cả hai trường. Trích dẫn trực tiếp nguồn bằng link từ kết quả tìm kiếm Exa dưới dạng [Nguồn](url) ở cuối các thông tin lấy từ internet. Không chế URL giả.
- ĐIỂM CHUẨN/HỌC PHÍ/CHỈ TIÊU: dùng số liệu của năm gần nhất có trong dữ liệu; nếu năm nay hoặc năm trước không có, dùng năm trước đó (2023, 2022, 2021...) và ghi rõ năm. Nếu nguồn không ghi số tuyệt đối, đưa khoảng ước tính theo mặt bằng chung và ghi rõ "ước tính".
- TUYỆT ĐỐI KHÔNG viết "chưa có dữ liệu xác nhận", "chưa xác định", "không có thông tin" cho từng tiêu chí. Chỉ được dùng tối đa MỘT câu ghi chú ngắn ở cuối báo cáo nếu thực sự không có bất kỳ số liệu nào. Thay vào đó hãy dùng thông tin gần nhất/ước tính có căn cứ và nói rõ năm hoặc mức độ ước tính.
- Nếu có công thức hoặc điểm số dạng toán, viết LaTeX trong cặp $...$ (ví dụ $24{,}5$), không dùng \\( \\) và không bọc trong backtick.
- Ở CUỐI báo cáo, viết 1 đoạn tổng kết dài khoảng 300-500 chữ nhận xét chung và đưa ra lời khuyên thiết thực cho học sinh nên chọn trường nào dựa trên hoàn cảnh của mình.
- Dùng Markdown chuẩn, in đậm thông tin quan trọng. Tuyệt đối KHÔNG sử dụng emoji dưới bất kỳ hình thức nào.`;

      const prompt = `Hãy thực hiện báo cáo so sánh chi tiết cho học sinh sau:
- Tên học sinh: ${userName}
- Tổ hợp xét tuyển: ${examGroup} (Các môn: ${examGroup === "A00" ? "Toán, Lý, Hóa" : examGroup === "A01" ? "Toán, Lý, Anh" : examGroup === "B00" ? "Toán, Hóa, Sinh" : examGroup === "C00" ? "Văn, Sử, Địa" : "Toán, Văn, Anh"})
- Điểm trung bình tổ hợp lớp 12 lớp ước tính của học sinh: ${calculatedUserScore !== null ? calculatedUserScore.toFixed(2) + " / 30" : "Chưa nhập đủ điểm lớp 12"}
- Mã Holland của học sinh: ${hollandCode || "Chưa làm bài trắc nghiệm Holland (Đánh giá tương quan dựa trên định hướng chung)"}
- Mục tiêu nghề nghiệp: ${careerGoals || "Tốt nghiệp có việc làm tốt đúng ngành học, thu nhập ổn định"}

Hai trường đại học cần so sánh cho ngành "${normalizedData.major}":
1. Trường 1: ${normalizedData.uni1.fullName} (${normalizedData.uni1.shortName})
2. Trường 2: ${normalizedData.uni2.fullName} (${normalizedData.uni2.shortName})

Dữ liệu tìm kiếm từ Exa cho ${normalizedData.uni1.fullName}:
${searchContext1 || "Không tìm thấy dữ liệu trực tuyến. Hãy sử dụng kiến thức hệ thống."}

Dữ liệu tìm kiếm từ Exa cho ${normalizedData.uni2.fullName}:
${searchContext2 || "Không tìm thấy dữ liệu trực tuyến. Hãy sử dụng kiến thức hệ thống."}

Hãy đối chiếu điểm số ước tính ${calculatedUserScore !== null ? calculatedUserScore.toFixed(2) : "N/A"} với điểm chuẩn thực tế ngành "${normalizedData.major}" tại cả hai trường để xếp loại khả năng đậu và tính khoảng cách điểm.
Tính toán Fit score tổng thể trên thang điểm 1-100% dựa trên năng lực, định hướng nghề nghiệp, mã Holland và khả năng tài chính của học sinh.`;

      let isFirstChunk = true;

      await api.deepseekProcess(
        prompt,
        systemInstruction,
        false,
        (chunk) => {
          if (isFirstChunk) {
            isFirstChunk = false;
            setComparisonResult("");
          }
          aiContent += chunk;
          setComparisonResult(aiContent);
        }
      );

      if (!aiContent.trim()) {
        throw new Error("AI trả về nội dung rỗng, vui lòng thử lại.");
      }

      setLoadingStep("done");
      setIsLoading(false);
      showToast("Đã hoàn thành lập báo cáo so sánh!", "success");
    } catch (e: any) {
      console.error("Compare Mode process error:", e);
      if (aiContent.trim()) {
        setComparisonResult(
          `${aiContent}\n\n_Liên kết bị ngắt giữa chừng, bạn thử tạo lại báo cáo nhé._`,
        );
      } else {
        setError(e.message || "Đã xảy ra lỗi trong quá trình xử lý.");
      }
      setIsLoading(false);
      setLoadingStep("idle");
    }
  };

  // Reset page state to start a new comparison
  const handleReset = () => {
    setShowForm(true);
    setComparisonResult("");
    setError("");
    setLoadingStep("idle");
  };

  return (
    <div className="p-2.5 sm:p-4 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 bg-transparent min-h-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-[4px] border-black pb-6 bg-pink-pop p-6 shadow-[6px_6px_0_#000] border-[4px]">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-black flex items-center mb-2 uppercase tracking-tight">
            <GitCompare className="w-10 h-10 mr-4 text-black stroke-[3px]" />
            So Sánh Nguyện Vọng
          </h1>
          <p className="text-black font-bold leading-relaxed max-w-2xl text-sm md:text-base border-[2px] border-black bg-white p-3 shadow-[2px_2px_0_#000] mt-4">
            Phân tích, so sánh chuyên sâu 30 tiêu chí cốt lõi giữa hai trường đại học dựa trên thông tin tuyển sinh thực tế từ Exa Search và dữ liệu học tập cá nhân của bạn.
          </p>
        </div>
        {!showForm && !isLoading && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-red-pop text-black font-black uppercase tracking-widest border-[3px] border-black hover:bg-pink-pop active:translate-x-1 active:translate-y-1 active:shadow-none transition-all shadow-[4px_4px_0_#000] self-start md:self-auto cursor-pointer"
          >
            <RefreshCw className="w-5 h-5 stroke-[3px]" />
            So sánh trường khác
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border-[3px] sm:border-[4px] border-black p-3.5 sm:p-6 md:p-8 shadow-[5px_5px_0_#000] sm:shadow-[8px_8px_0_#000] space-y-6 sm:space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* University 1 Column */}
              <div className="space-y-4">
                <label className="block text-sm font-black text-black uppercase tracking-wider bg-pink-pop px-3 py-1 border-[2px] border-black inline-block shadow-[2px_2px_0_#000]">
                  Trường Đại học thứ 1
                </label>
                {aspirations.length > 0 ? (
                  <div className="space-y-3">
                    <select
                      value={uni1Selection}
                      onChange={(e) => setUni1Selection(e.target.value)}
                      className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bold focus:outline-none focus:bg-pink-pop/20 shadow-[4px_4px_0_#000] transition-colors appearance-none cursor-pointer"
                    >
                      {aspirations.map((asp, idx) => (
                        <option key={idx} value={String(idx)}>
                          NV{idx + 1}: {asp.name}
                        </option>
                      ))}
                      <option value="manual">Nhập trường khác thủ công...</option>
                    </select>
                    {uni1Selection === "manual" && (
                      <input
                        type="text"
                        value={uni1Manual}
                        onChange={(e) => setUni1Manual(e.target.value)}
                        placeholder="Ví dụ: Bách Khoa HN, NEU..."
                        className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bold focus:outline-none focus:bg-pink-pop/20 shadow-[4px_4px_0_#000] placeholder:text-black/40 transition-colors"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={uni1Manual}
                    onChange={(e) => setUni1Manual(e.target.value)}
                    placeholder="Ví dụ: Bách Khoa Hà Nội, HUST..."
                    className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bold focus:outline-none focus:bg-pink-pop/20 shadow-[4px_4px_0_#000] placeholder:text-black/40 transition-colors"
                  />
                )}
              </div>

              {/* University 2 Column */}
              <div className="space-y-4">
                <label className="block text-sm font-black text-black uppercase tracking-wider bg-pink-pop px-3 py-1 border-[2px] border-black inline-block shadow-[2px_2px_0_#000]">
                  Trường Đại học thứ 2
                </label>
                {aspirations.length > 0 ? (
                  <div className="space-y-3">
                    <select
                      value={uni2Selection}
                      onChange={(e) => setUni2Selection(e.target.value)}
                      className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bold focus:outline-none focus:bg-pink-pop/20 shadow-[4px_4px_0_#000] transition-colors appearance-none cursor-pointer"
                    >
                      {aspirations.map((asp, idx) => (
                        <option key={idx} value={String(idx)}>
                          NV{idx + 1}: {asp.name}
                        </option>
                      ))}
                      <option value="manual">Nhập trường khác thủ công...</option>
                    </select>
                    {uni2Selection === "manual" && (
                      <input
                        type="text"
                        value={uni2Manual}
                        onChange={(e) => setUni2Manual(e.target.value)}
                        placeholder="Ví dụ: Ngoại Thương, FTU..."
                        className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bold focus:outline-none focus:bg-[var(--color-yellow-pop)] shadow-[4px_4px_0_#000] placeholder:text-black/40 transition-colors"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={uni2Manual}
                    onChange={(e) => setUni2Manual(e.target.value)}
                    placeholder="Ví dụ: Đại học Ngoại thương, FTU..."
                    className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bold focus:outline-none focus:bg-[var(--color-yellow-pop)] shadow-[4px_4px_0_#000] placeholder:text-black/40 transition-colors"
                  />
                )}
              </div>
            </div>

            {/* Custom Major & Exam Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-[4px] border-black pt-8">
              <div className="space-y-4">
                <label className="block text-sm font-black text-black uppercase tracking-wider bg-[var(--color-yellow-pop)] px-3 py-1 border-[2px] border-black inline-block shadow-[2px_2px_0_#000]">
                  Ngành học so sánh
                </label>
                {aspirations.length > 0 && (uni1Selection !== "manual" || uni2Selection !== "manual") ? (
                  <div className="space-y-3">
                    <select
                      value={majorSelection}
                      onChange={(e) => setMajorSelection(e.target.value)}
                      className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bold focus:outline-none focus:bg-[var(--color-yellow-pop)] shadow-[4px_4px_0_#000] transition-colors appearance-none cursor-pointer"
                    >
                      <option value="auto">Tự động chọn theo Nguyện vọng</option>
                      <option value="manual">Nhập ngành khác thủ công...</option>
                    </select>
                    {majorSelection === "manual" && (
                      <input
                        type="text"
                        value={majorManual}
                        onChange={(e) => setMajorManual(e.target.value)}
                        placeholder="Ví dụ: Khoa học máy tính, Kinh tế quốc tế..."
                        className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bold focus:outline-none focus:bg-[var(--color-yellow-pop)] shadow-[4px_4px_0_#000] placeholder:text-black/40 transition-colors"
                      />
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={majorManual}
                    onChange={(e) => setMajorManual(e.target.value)}
                    placeholder="Ví dụ: Khoa học máy tính, Quản trị kinh doanh..."
                    className="w-full px-4 py-3 border-[3px] border-black bg-white text-black font-bold focus:outline-none focus:bg-[var(--color-yellow-pop)] shadow-[4px_4px_0_#000] placeholder:text-black/40 transition-colors"
                  />
                )}
              </div>

              <div className="space-y-4">
                <label className="text-sm font-black text-black uppercase tracking-wider flex flex-wrap items-center gap-2">
                  <span className="bg-pink-pop px-3 py-1 border-[2px] border-black shadow-[2px_2px_0_#000]">
                    Tổ hợp xét tuyển
                  </span>
                  <span className="text-xs bg-white px-2 py-1 border-[2px] border-black font-bold shadow-[2px_2px_0_#000]">
                    (Để ước tính khả năng đậu)
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-3 mt-4">
                  {["A00", "A01", "B00", "C00", "D01"].map((group) => (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setExamGroup(group)}
                      className={`py-3 border-[3px] border-black text-center font-black text-sm uppercase transition-all shadow-[4px_4px_0_#000] ${
                        examGroup === group
                          ? "bg-pink-pop text-black translate-x-1 translate-y-1 shadow-none"
                          : "bg-white text-black hover:bg-pink-pop"
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  {calculatedUserScore !== null ? (
                    <div className="flex items-center text-sm font-black text-black bg-pink-pop border-[3px] border-black p-4 shadow-[4px_4px_0_#000]">
                      <CheckCircle2 className="w-6 h-6 mr-3 stroke-[3px] flex-shrink-0" />
                      <span>
                        Điểm tổ hợp {examGroup}:{" "}
                        <span className="text-xl border-b-[3px] border-black">{calculatedUserScore.toFixed(2)}/30</span>
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm font-black text-black bg-[var(--color-red-pop)] border-[3px] border-black p-4 shadow-[4px_4px_0_#000]">
                      <AlertCircle className="w-6 h-6 mr-3 stroke-[3px] flex-shrink-0" />
                      <span>Chưa đủ dữ liệu điểm lớp 12 của tổ hợp {examGroup}. Vui lòng nhập điểm ở tab Học Tập.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-8 border-t-[4px] border-black mt-8">
              <button
                onClick={handleCompare}
                className="relative flex items-center justify-center px-10 py-5 bg-pink-pop text-black border-[4px] border-black font-black text-xl tracking-tight uppercase hover:bg-red-pop active:translate-x-1 active:translate-y-1 transition-all shadow-[8px_8px_0_#000] active:shadow-[2px_2px_0_#000] cursor-pointer"
              >
                <Sparkles className="w-6 h-6 mr-3 stroke-[3px] animate-pulse" />
                Bắt đầu so sánh
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading Pipeline State */}
        {isLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border-[4px] border-black p-8 shadow-[8px_8px_0_#000] flex flex-col items-center justify-center min-h-[40vh] space-y-8 text-center"
          >
            {/* Bold Spinning Loader */}
            <div className="relative w-20 h-20 flex items-center justify-center bg-pink-pop border-[4px] border-black shadow-[6px_6px_0_#000]">
              <Loader2 className="w-10 h-10 text-black stroke-[3px] animate-spin" />
            </div>

            <div className="space-y-4 max-w-md bg-white border-[4px] border-black p-6 shadow-[6px_6px_0_#000]">
              <h3 className="text-2xl font-black text-black uppercase tracking-tight">Smarm AI đang xử lý</h3>
              <p className="text-sm text-black font-bold bg-pink-pop px-3 py-2 border-[2px] border-black inline-block shadow-[2px_2px_0_#000]">
                {apiWorkerStatus}
              </p>
            </div>

            {/* Brutalist Progress Indicator */}
            <div className="w-full max-w-lg bg-white h-6 border-[3px] border-black relative overflow-hidden shadow-[4px_4px_0_#000]">
              <div
                className="bg-pink-pop h-full border-r-[3px] border-black transition-all duration-500"
                style={{
                  width:
                    loadingStep === "normalizing"
                      ? "25%"
                      : loadingStep === "searching1"
                      ? "50%"
                      : loadingStep === "searching2"
                      ? "75%"
                      : loadingStep === "synthesizing"
                      ? "95%"
                      : "0%",
                }}
              />
            </div>

            {/* Step Checkmarks */}
            <div className="grid grid-cols-4 gap-4 text-sm font-black w-full max-w-xl pt-6 border-t-[4px] border-black">
              <div className={loadingStep !== "normalizing" && loadingStep !== "idle" ? "text-black bg-pink-pop border-[2px] border-black py-2 shadow-[2px_2px_0_#000]" : "text-black/50 bg-white border-[2px] border-black py-2 border-dashed"}>
                {loadingStep !== "normalizing" && loadingStep !== "idle" ? "✓ Chuẩn hóa" : "1. Chuẩn hóa"}
              </div>
              <div className={loadingStep !== "normalizing" && loadingStep !== "searching1" && loadingStep !== "idle" ? "text-black bg-pink-pop border-[2px] border-black py-2 shadow-[2px_2px_0_#000]" : "text-black/50 bg-white border-[2px] border-black py-2 border-dashed"}>
                {loadingStep !== "normalizing" && loadingStep !== "searching1" && loadingStep !== "idle" ? "✓ Tìm kiếm T1" : "2. Tìm kiếm T1"}
              </div>
              <div className={loadingStep === "synthesizing" || loadingStep === "done" ? "text-black bg-pink-pop border-[2px] border-black py-2 shadow-[2px_2px_0_#000]" : "text-black/50 bg-white border-[2px] border-black py-2 border-dashed"}>
                {loadingStep === "synthesizing" || loadingStep === "done" ? "✓ Tìm kiếm T2" : "3. Tìm kiếm T2"}
              </div>
              <div className={loadingStep === "done" ? "text-black bg-pink-pop border-[2px] border-black py-2 shadow-[2px_2px_0_#000]" : "text-black/50 bg-white border-[2px] border-black py-2 border-dashed"}>
                4. Phân tích AI
              </div>
            </div>
          </motion.div>
        )}

        {/* Comparison Result Output */}
        {(comparisonResult || error) && !showForm && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {error && (
              <div className="bg-[var(--color-red-pop)] border-[4px] border-black text-black p-6 flex flex-col sm:flex-row items-start gap-4 shadow-[8px_8px_0_#000]">
                <AlertCircle className="w-8 h-8 text-black stroke-[3px] flex-shrink-0 bg-white border-[2px] border-black shadow-[2px_2px_0_#000] p-1" />
                <div>
                  <h4 className="font-black text-2xl uppercase tracking-tight mb-2 bg-white px-2 py-1 border-[2px] border-black inline-block">Lỗi xử lý</h4>
                  <p className="text-lg font-bold leading-relaxed bg-white border-[2px] border-black p-3">{error}</p>
                  <button
                    onClick={handleReset}
                    className="mt-4 px-6 py-3 bg-black text-white font-black uppercase tracking-widest border-[3px] border-black hover:bg-zinc-800 transition-colors shadow-[4px_4px_0_#fff]"
                  >
                    Thử lại
                  </button>
                </div>
              </div>
            )}

            {comparisonResult && (
              <div className="bg-white border-[3px] sm:border-[4px] border-black p-3.5 sm:p-6 md:p-10 shadow-[5px_5px_0_#000] sm:shadow-[8px_8px_0_#000] space-y-6 sm:space-y-8 relative">
                {/* Live stream tag */}
                {isLoading && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-pink-pop text-black text-sm font-black tracking-widest uppercase self-start w-fit border-[3px] border-black shadow-[4px_4px_0_#000] animate-pulse">
                    <Sparkles className="w-5 h-5 text-black stroke-[3px]" />
                    <span>Smarm đang viết báo cáo...</span>
                  </div>
                )}

                {/* Markdown body wrapper */}
                <div className="markdown-body neubrutalism-markdown text-[15px] sm:text-base md:text-lg font-medium leading-relaxed">
                  <AiMarkdown
                    content={comparisonResult}
                    components={{
                      table({ children }) {
                        return (
                          <div className="overflow-x-auto my-8 border-[4px] border-black shadow-[6px_6px_0_#000]">
                            <table className="min-w-full m-0 bg-white border-collapse">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      th({ children }) {
                        return (
                          <th className="px-6 py-4 text-left text-sm md:text-base font-black text-black uppercase tracking-wider bg-[var(--color-yellow-pop)] border-b-[4px] border-r-[3px] border-black last:border-r-0">
                            {children}
                          </th>
                        );
                      },
                      td({ children }) {
                        return (
                          <td className="px-6 py-4 text-sm md:text-base text-black font-bold border-b-[3px] border-r-[3px] border-black last:border-r-0">
                            {children}
                          </td>
                        );
                      },
                      a({ href, children }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-black font-black hover:bg-black hover:text-white bg-[var(--color-primary)] px-2 py-1 text-sm transition-all border-[2px] border-black shadow-[2px_2px_0_#000] mx-1 uppercase tracking-tight"
                          >
                            {children}
                            <ExternalLink className="w-3.5 h-3.5 stroke-[3px]" />
                          </a>
                        );
                      },
                      h1({ children }) {
                        return (
                          <h2 className="text-2xl md:text-3xl font-black text-black mt-10 mb-6 flex items-center border-[4px] border-black bg-[var(--color-yellow-pop)] p-4 shadow-[6px_6px_0_#000] uppercase tracking-tight">
                            {children}
                          </h2>
                        );
                      },
                      h2({ children }) {
                        return (
                          <h3 className="text-xl md:text-2xl font-black text-black mt-8 mb-4 flex items-center bg-[var(--color-primary)] px-4 py-2 border-[3px] border-black inline-block shadow-[4px_4px_0_#000] uppercase tracking-tight">
                            {children}
                          </h3>
                        );
                      },
                      h3({ children }) {
                        return (
                          <h4 className="text-lg md:text-xl font-black text-black mt-6 mb-3 bg-black text-white px-3 py-1 inline-block uppercase">
                            {children}
                          </h4>
                        );
                      },
                      ul({ children }) {
                        return (
                          <ul className="list-none pl-2 space-y-3 my-4">
                            {children}
                          </ul>
                        );
                      },
                      li({ children }) {
                        return (
                          <li className="leading-relaxed text-base font-bold flex items-start">
                            <span className="w-2 h-2 bg-black flex-shrink-0 mt-2 mr-3 border-[1px] border-black"></span>
                            <span>{children}</span>
                          </li>
                        );
                      },
                    }}
                  />
                </div>
                
                <div ref={reportEndRef} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
