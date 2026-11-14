import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Calculator,
  Target,
  BookOpen,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Info,
  Sparkles,
  Loader2,
  RefreshCw,
  Bot,
  Award,
  Settings,
} from "lucide-react";
import { AiMarkdown } from "../../components/AiMarkdown";
import { api } from "../../lib/api";
import { normalizeGrades, readArray, readJson, readText, writeJson } from "../../lib/localData";
import QuoteWidget from "../../components/QuoteWidget";

type GradeData = {
  regular: number[];
  mid: number | null;
  final: number | null;
};

type SemesterData = Record<string, GradeData>;
type ClassData = { semester1: SemesterData; semester2: SemesterData };
type AllGrades = { class10: ClassData; class11: ClassData; class12: ClassData };

const ADMISSION_METHODS = [
  {
    id: "THPT",
    name: "Điểm thi THPT (3 môn)",
    description: "Tổng điểm 3 môn theo tổ hợp (A00, A01, D01...)",
  },
  {
    id: "Học bạ",
    name: "Xét học bạ (GPA)",
    description: "Điểm trung bình các môn qua các học kì",
  },
  {
    id: "ĐGNL",
    name: "Đánh giá năng lực",
    description: "Điểm kì thi ĐGNL (VNU-HCM: 1200đ, VNU-HN: 150đ)",
  },
];

export default function LearningTab() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<string[]>([]);
  const [grades, setGrades] = useState<AllGrades | null>(null);
  const [activeClass, setActiveClass] = useState<
    "class10" | "class11" | "class12"
  >("class10");
  const [activeSemester, setActiveSemester] = useState<
    "semester1" | "semester2"
  >("semester1");
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [aspirations, setAspirations] = useState<any[]>([]);

  const [targetMethod, setTargetMethod] = useState<string>("THPT");
  const [targetSubjects, setTargetSubjects] = useState<string[]>([]);
  const [dgnlScore, setDgnlScore] = useState<number | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAspirationIndex, setSelectedAspirationIndex] = useState(0);
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

  const updateCurrentAspiration = (updates: any) => {
    if (aspirations.length > 0) {
      const newAspirations = [...aspirations];
      newAspirations[selectedAspirationIndex] = {
        ...newAspirations[selectedAspirationIndex],
        ...updates,
      };
      setAspirations(newAspirations);
      localStorage.setItem("smarm_aspirations", JSON.stringify(newAspirations));
    }
  };

  useEffect(() => {
    const savedSubjects = readArray<string>("smarm_subjects").filter(
      (subject) => typeof subject === "string" && subject.trim() !== "",
    );
    const initialSubjects = savedSubjects.length > 0
      ? savedSubjects
      : ["Toán", "Ngữ văn", "Tiếng Anh"];
    setSubjects(initialSubjects);

    const storedGrades = readJson<unknown>("smarm_grades", null);
    if (storedGrades) {
      setGrades(normalizeGrades(storedGrades) as AllGrades);
    } else {
      const initialGrades: any = {
        class10: { semester1: {}, semester2: {} },
        class11: { semester1: {}, semester2: {} },
        class12: { semester1: {}, semester2: {} },
      };
      ["class10", "class11", "class12"].forEach((cls) => {
        ["semester1", "semester2"].forEach((sem) => {
          initialSubjects.forEach((sub: string) => {
            initialGrades[cls][sem][sub] = {
              regular: [],
              mid: null,
              final: null,
            };
          });
        });
      });
      setGrades(initialGrades);
    }

    const parsedAspirations = readArray<any>("smarm_aspirations");
    if (parsedAspirations.length > 0) {
      setAspirations(parsedAspirations);
      const firstAsp = parsedAspirations[0];
      if (firstAsp && typeof firstAsp === "object") {
        setTargetMethod(firstAsp.method || "THPT");
        if (firstAsp.targetSubjects) {
          let subs = firstAsp.targetSubjects;
          if (typeof subs === "string") {
            subs = subs
              .split(/[,/]/)
              .map((s: string) => s.trim())
              .filter(Boolean);
          }
          if (Array.isArray(subs)) {
            setTargetSubjects(subs);
          } else {
            setTargetSubjects([]);
          }
        }
      }
    }

    const savedMethod = localStorage.getItem("smarm_target_method");
    if (savedMethod) setTargetMethod(savedMethod);

    const savedTargetSubjects = localStorage.getItem("smarm_target_subjects");
    if (savedTargetSubjects) {
      try {
        const parsed = JSON.parse(savedTargetSubjects);
        setTargetSubjects(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setTargetSubjects([]);
      }
    }

    const savedDgnl = localStorage.getItem("smarm_dgnl_score");
    if (savedDgnl) setDgnlScore(parseFloat(savedDgnl));

    const savedAnalysis = readText("smarm_ai_analysis");
    if (savedAnalysis) setAiAnalysis(savedAnalysis);
  }, []);

  const syncAllData = async () => {
    try {
      await api.syncUserData();
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  const saveGrades = (newGrades: AllGrades) => {
    setGrades(newGrades);
    localStorage.setItem("smarm_grades", JSON.stringify(newGrades));
    syncAllData();
  };

  const addSubject = (name: string) => {
    if (!name || subjects.includes(name)) return;
    const newSubjects = [...subjects, name];
    setSubjects(newSubjects);
    localStorage.setItem("smarm_subjects", JSON.stringify(newSubjects));

    if (grades) {
      const newGrades = { ...grades };
      ["class10", "class11", "class12"].forEach((cls) => {
        ["semester1", "semester2"].forEach((sem) => {
          if (
            !newGrades[cls as keyof AllGrades][
              sem as "semester1" | "semester2"
            ][name]
          ) {
            newGrades[cls as keyof AllGrades][sem as "semester1" | "semester2"][
              name
            ] = { regular: [], mid: null, final: null };
          }
        });
      });
      saveGrades(newGrades);
    }
  };

  const confirmDeleteSubject = (name: string) => {
    setSubjects((prev) => {
      const filtered = prev.filter((s) => s !== name);
      localStorage.setItem("smarm_subjects", JSON.stringify(filtered));
      return filtered;
    });

    if (grades) {
      const newGrades = JSON.parse(JSON.stringify(grades));
      (["class10", "class11", "class12"] as const).forEach((cls) => {
        if (newGrades[cls].semester1) delete newGrades[cls].semester1[name];
        if (newGrades[cls].semester2) delete newGrades[cls].semester2[name];
      });
      saveGrades(newGrades);
    }

    if (expandedSubject === name) {
      setExpandedSubject(null);
    }
    setSubjectToDelete(null);
  };

  const updateGrade = (
    subject: string,
    type: "mid" | "final",
    value: string,
  ) => {
    const numValue = value === "" ? null : parseFloat(value);
    if (numValue !== null && (numValue < 0 || numValue > 10)) return;

    if (grades) {
      const newGrades = { ...grades };
      newGrades[activeClass] = {
        ...newGrades[activeClass],
        [activeSemester]: {
          ...newGrades[activeClass][activeSemester],
          [subject]: {
            ...newGrades[activeClass][activeSemester][subject],
            [type]: numValue,
          },
        },
      };
      saveGrades(newGrades);
    }
  };

  const addRegularGrade = (subject: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 10) return;

    if (grades) {
      const newGrades = { ...grades };
      const currentSub = newGrades[activeClass][activeSemester][subject];
      newGrades[activeClass] = {
        ...newGrades[activeClass],
        [activeSemester]: {
          ...newGrades[activeClass][activeSemester],
          [subject]: {
            ...currentSub,
            regular: [...currentSub.regular, numValue],
          },
        },
      };
      saveGrades(newGrades);
    }
  };

  const removeRegularGrade = (subject: string, index: number) => {
    if (grades) {
      const newGrades = { ...grades };
      const currentSub = newGrades[activeClass][activeSemester][subject];
      const newRegular = [...currentSub.regular];
      newRegular.splice(index, 1);

      newGrades[activeClass] = {
        ...newGrades[activeClass],
        [activeSemester]: {
          ...newGrades[activeClass][activeSemester],
          [subject]: {
            ...currentSub,
            regular: newRegular,
          },
        },
      };
      saveGrades(newGrades);
    }
  };

  const calculateSubjectAverage = (data: GradeData) => {
    if (!data) return null;
    let totalScore = 0;
    let totalWeight = 0;

    // Theo PDF: ĐTB môn HK = (Tổng TX + 2*GK + 3*CK) / (số điểm TX + 5)
    if (data.regular.length > 0) {
      const regularSum = data.regular.reduce((a, b) => a + b, 0);
      totalScore += regularSum;
      totalWeight += data.regular.length;
    }

    if (data.mid !== null) {
      totalScore += data.mid * 2;
      totalWeight += 2;
    } else {
      totalWeight += 2; // Vẫn tính mẫu số là 5 (2+3) ngay cả khi chưa có điểm?
      // Thường thì nếu chưa có điểm thì không tính weight đó.
      // Tuy nhiên PDF ghi "số điểm thường xuyên + 5" nên ta mặc định GK và CK chiếm 5 đơn vị trọng số.
    }

    if (data.final !== null) {
      totalScore += data.final * 3;
      totalWeight += 3;
    } else {
      totalWeight += 3;
    }

    if (
      totalWeight === 0 ||
      (data.regular.length === 0 && data.mid === null && data.final === null)
    )
      return null;

    // Nếu mẫu số là (n + 5) thì ta dùng n + 5
    const finalWeight = data.regular.length + 5;
    return (totalScore / finalWeight).toFixed(2);
  };

  const calculateSemesterAverage = (semesterData: SemesterData) => {
    let total = 0;
    let count = 0;
    Object.values(semesterData).forEach((data) => {
      const avg = calculateSubjectAverage(data);
      if (avg !== null) {
        total += parseFloat(avg);
        count++;
      }
    });
    if (count === 0) return null;
    return (total / count).toFixed(2);
  };

  const calculateYearlyAverage = (classData: ClassData) => {
    const sem1 = calculateSemesterAverage(classData.semester1);
    const sem2 = calculateSemesterAverage(classData.semester2);

    // Theo PDF: ĐTB môn cả năm = (HK1 + 2*HK2) / 3
    if (sem1 !== null && sem2 !== null) {
      return ((parseFloat(sem1) + parseFloat(sem2) * 2) / 3).toFixed(2);
    } else if (sem2 !== null) {
      return sem2; // Fallback nếu chỉ có HK2
    } else if (sem1 !== null) {
      return sem1; // Fallback nếu chỉ có HK1
    }
    return null;
  };

  const calculateThreeYearAverage = () => {
    if (!grades) return null;
    const y10 = calculateYearlyAverage(grades.class10);
    const y11 = calculateYearlyAverage(grades.class11);
    const y12 = calculateYearlyAverage(grades.class12);

    // Theo PDF: ĐTB 3 năm = (Lớp 10*1 + Lớp 11*2 + Lớp 12*3) / 6
    let total = 0;
    let weight = 0;
    if (y10) {
      total += parseFloat(y10) * 1;
      weight += 1;
    }
    if (y11) {
      total += parseFloat(y11) * 2;
      weight += 2;
    }
    if (y12) {
      total += parseFloat(y12) * 3;
      weight += 3;
    }

    if (weight === 0) return null;
    return (total / weight).toFixed(2);
  };

  // AI should analyze the newest grades the student has entered, not whichever
  // semester happens to be open in the gradebook view.
  const latestGradeSnapshot = () => {
    if (!grades) return null;
    const order: Array<{
      cls: "class10" | "class11" | "class12";
      sem: "semester1" | "semester2";
      label: string;
    }> = [
      { cls: "class12", sem: "semester2", label: "Lớp 12 - HK2" },
      { cls: "class12", sem: "semester1", label: "Lớp 12 - HK1" },
      { cls: "class11", sem: "semester2", label: "Lớp 11 - HK2" },
      { cls: "class11", sem: "semester1", label: "Lớp 11 - HK1" },
      { cls: "class10", sem: "semester2", label: "Lớp 10 - HK2" },
      { cls: "class10", sem: "semester1", label: "Lớp 10 - HK1" },
    ];
    for (const item of order) {
      const data = grades[item.cls][item.sem];
      const avg = calculateSemesterAverage(data);
      if (avg !== null) return { ...item, data, avg };
    }
    return null;
  };

  const generateAIAnalysis = async () => {
    setIsAnalyzing(true);
    setApiWorkerStatus("");
    setAiAnalysis("");
    try {
      const userData = readJson<{ name?: string }>("smarm_user", {});
      const attitudeMode =
        localStorage.getItem("smarm_attitude_mode") || "friend";
      const latest = latestGradeSnapshot();
      const analysisData = latest?.data || currentSemesterData;
      const analysisAvg = latest?.avg || semesterAvg;
      const analysisYearly = latest && grades ? calculateYearlyAverage(grades[latest.cls]) : yearlyAvg;
      const analysisPeriod = latest?.label || "Học kỳ đang xem";
      const currentAdmissionScore = calculateCurrentAdmissionScore(analysisData);
      const threeYearAvg = calculateThreeYearAverage();
      const primaryAspiration = aspirations[selectedAspirationIndex];
      const targetScore = primaryAspiration?.targetScore || 0;

      let prompt = `Chào bạn, tôi là Smarm AI. Hãy phân tích tình hình học tập của người dùng ${userData.name || ""} dựa trên dữ liệu sau:
- Kỳ học mới nhất có dữ liệu: ${analysisPeriod}
- Điểm trung bình học kỳ: ${analysisAvg || "Chưa có"}
- Điểm trung bình cả năm (ước tính): ${analysisYearly || "Chưa có"}
- Điểm trung bình 3 năm (ước tính): ${threeYearAvg || "Chưa có"}
- Phương thức xét tuyển mục tiêu: ${primaryAspiration?.method || targetMethod}
- Điểm xét tuyển hiện tại (ước tính): ${currentAdmissionScore}
- Trường mục tiêu: ${primaryAspiration?.name || "Chưa chọn"}
- Điểm chuẩn mục tiêu: ${targetScore}
- Chi tiết điểm các môn: ${JSON.stringify(analysisData)}

PHONG CÁCH PHẢN HỒI (Rất quan trọng):
`;

      if (attitudeMode === "friend") {
        prompt += `Hãy đóng vai một người bạn Gen Z. Xưng hô "mình" - "bạn". Ngôn ngữ hài hước, dùng emoji, động viên kiểu "cố lên bro", "chill đi".`;
      } else if (attitudeMode === "teacher") {
        prompt += `Hãy đóng vai một giáo viên chủ nhiệm. Xưng hô "thầy/cô" - "em". Nghiêm túc, đưa ra lời khuyên học thuật, nhắc nhở các môn điểm thấp.`;
      } else if (attitudeMode === "parent") {
        prompt += `Hãy đóng vai một phụ huynh châu Á điển hình. Xưng hô "bố/mẹ" - "con". Tuyệt đối KHÔNG chửi thề. Hãy dùng sự so sánh với "con nhà người ta", cằn nhằn về tương lai, nhấn mạnh sự hy sinh của cha mẹ. Nếu điểm thấp thì nhắc nhở gắt gao, nếu điểm cao thì khen ngợi nhẹ nhàng và nhắc không được chủ quan.`;
      }

      prompt += `\n\nYÊU CẦU:
1. Phân tích xem với điểm số hiện tại thì khả năng đỗ vào trường mục tiêu là bao nhiêu %.
2. Nhắc nhở cụ thể các môn có điểm "thường xuyên" hoặc "giữa kì" thấp.
3. Dự đoán xem cột điểm tiếp theo cần đạt bao nhiêu để đủ điểm vào trường.
4. KHÔNG dùng ký tự rác, trình bày Markdown rõ ràng, chia đề mục.
5. Sử dụng LaTeX cho TẤT CẢ các công thức toán học, lý hóa (ví dụ $...$ hoặc $$...$$).
6. Định dạng các bước giải quyết hoặc phân tích quan trọng bằng cấu trúc HTML: <div class='ai-step'><span class='ai-title'>TIÊU ĐỀ BƯỚC</span>Nội dung...</div>
7. TUYỆT ĐỐI KHÔNG viết "chưa có dữ liệu", "chưa xác định", "không có thông tin", "chưa thể ước tính". Dữ liệu điểm ở trên là dữ liệu thật của học sinh: hãy tính toán cụ thể từ đó, còn điểm chuẩn/khoảng an toàn thì ước tính có căn cứ và ghi rõ "ước tính". Chỉ được dùng tối đa MỘT câu ghi chú ngắn nếu học sinh thực sự chưa nhập bất kỳ điểm nào.`;

      let aiContent = "";

      const response = await api.deepseekChat(
        [
          { role: "system", content: "Bạn là trợ lý học tập Smarm AI." },
          { role: "user", content: prompt },
        ],
        undefined,
        (chunk) => {
          aiContent += chunk;
          setAiAnalysis(aiContent);
        },
      );

      const content =
        response?.choices?.[0]?.message?.content?.trim() || aiContent.trim();
      if (!content) {
        throw new Error("AI trả về nội dung rỗng");
      }
      setAiAnalysis(content);
      writeJson("smarm_ai_analysis", content);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setAiAnalysis(
        "Có lỗi khi gọi AI rồi, chắc nó đang đi ngủ. Thử lại sau nhé!",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!grades) return null;

  const currentSemesterData = grades[activeClass][activeSemester];
  const semesterAvg = calculateSemesterAverage(currentSemesterData);
  const yearlyAvg = calculateYearlyAverage(grades[activeClass]);

  const calculateSubjectYearlyAverage = (
    classData: ClassData,
    subject: string,
  ) => {
    const s1 = classData.semester1[subject];
    const s2 = classData.semester2[subject];
    const avg1 = s1 ? calculateSubjectAverage(s1) : null;
    const avg2 = s2 ? calculateSubjectAverage(s2) : null;

    if (avg1 && avg2)
      return ((parseFloat(avg1) + parseFloat(avg2) * 2) / 3).toFixed(2);
    return avg2 || avg1;
  };

  const calculateSubjectThreeYearAverage = (subject: string) => {
    if (!grades) return null;
    const v10 = calculateSubjectYearlyAverage(grades.class10, subject);
    const v11 = calculateSubjectYearlyAverage(grades.class11, subject);
    const v12 = calculateSubjectYearlyAverage(grades.class12, subject);

    let total = 0;
    let weight = 0;
    if (v10) {
      total += parseFloat(v10) * 1;
      weight += 1;
    }
    if (v11) {
      total += parseFloat(v11) * 2;
      weight += 2;
    }
    if (v12) {
      total += parseFloat(v12) * 3;
      weight += 3;
    }

    if (weight === 0) return null;
    return (total / weight).toFixed(2);
  };

  const calculateCurrentAdmissionScore = (dataOverride?: SemesterData) => {
    const currentAsp = aspirations[selectedAspirationIndex];
    const method = currentAsp?.method || targetMethod;
    const dataSource = dataOverride || currentSemesterData;
    const subjectsForCalc =
      targetSubjects.length > 0
        ? targetSubjects
        : Object.keys(dataSource).filter((sub) => calculateSubjectAverage(dataSource[sub]) !== null).slice(0, 3);

    if (method === "THPT") {
      // Điểm thi THPT: Ước tính dựa trên điểm học kỳ hiện tại
      if (subjectsForCalc.length === 0) return "0.00";
      let sum = 0;
      subjectsForCalc.forEach((sub) => {
        const data = dataSource[sub];
        if (data) {
          const avg = calculateSubjectAverage(data);
          if (avg) sum += parseFloat(avg);
        }
      });
      return sum.toFixed(2);
    } else if (method === "Học bạ") {
      // Xét học bạ: Tổng điểm trung bình 3 năm của 3 môn tổ hợp
      if (subjectsForCalc.length === 0) return "0.00";
      let sum = 0;
      subjectsForCalc.forEach((sub) => {
        const avg = calculateSubjectThreeYearAverage(sub);
        if (avg) sum += parseFloat(avg);
      });
      return sum.toFixed(2);
    } else if (method === "ĐGNL") {
      if (!dgnlScore) return "0.00";
      const maxScore = dgnlScore > 150 ? 1200 : 150;
      return ((dgnlScore * 30) / maxScore).toFixed(2);
    }
    return "0.00";
  };

  const currentAdmissionScore = calculateCurrentAdmissionScore();
  const primaryAspiration = aspirations[selectedAspirationIndex];
  const targetScore = primaryAspiration?.targetScore || 0;
  const threeYearAvg = calculateThreeYearAverage();

  return (
    <div className="p-2.5 sm:p-4 md:p-8 pb-28 sm:pb-32 max-w-7xl mx-auto">
      {/* Header Sticky Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 sm:mb-12 gap-4 sm:gap-6 bg-green-pop p-4 sm:p-6 md:p-8 border-[3px] sm:border-[4px] border-black shadow-[5px_5px_0_#000] sm:shadow-[8px_8px_0_#000]">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-white border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0_#000]">
            <BookOpen className="w-8 h-8 text-black stroke-[3px]" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight uppercase">
              Học tập & Mục tiêu
            </h1>
            <p className="text-black font-bold text-sm uppercase tracking-wider bg-white inline-block px-3 py-1 border-[2px] border-black mt-2 shadow-[2px_2px_0_#000]">
              Lộ trình chinh phục đại học
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {yearlyAvg && (
            <div className="bg-white px-6 py-3 border-[3px] border-black shadow-[4px_4px_0_#000] flex items-center">
              <div className="text-right mr-4">
                <div className="text-xs text-black font-black uppercase tracking-widest">
                  TBM Cả Năm
                </div>
                <div className="text-2xl font-black text-black leading-none mt-1">
                  {yearlyAvg}
                </div>
              </div>
              <div className="w-12 h-12 border-[3px] border-black bg-green-pop flex items-center justify-center text-black">
                <Award className="w-6 h-6 stroke-[3px]" />
              </div>
            </div>
          )}
          {threeYearAvg && (
            <div className="hidden sm:flex bg-white px-6 py-3 border-[3px] border-black shadow-[4px_4px_0_#000] items-center">
              <div className="text-right mr-4">
                <div className="text-xs text-black font-black uppercase tracking-widest">
                  TBM 3 Năm
                </div>
                <div className="text-2xl font-black text-black leading-none mt-1">
                  {threeYearAvg}
                </div>
              </div>
              <div className="w-12 h-12 border-[3px] border-black bg-cyan-pop flex items-center justify-center text-black">
                <Calculator className="w-6 h-6 stroke-[3px]" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8 md:gap-10">
          {/* Quote Widget - Now at the top of left col */}
          <QuoteWidget />

          {/* Sibling Goal & Config Cards */}
          {/* Card 1: The Goal Display */}
          <div className="brutal-card bg-white p-6 md:p-8 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <h2 className="text-2xl font-black text-black flex items-center uppercase tracking-tight">
                  <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000] flex-shrink-0">
                    <Target className="w-6 h-6 stroke-[3px] text-black" />
                  </div>
                  Mục tiêu NV{selectedAspirationIndex + 1}
                </h2>
                {aspirations.length > 1 && (
                  <div className="flex bg-white border-[3px] border-black p-1 shadow-[4px_4px_0_#000] gap-2 overflow-x-auto max-w-[200px] no-scrollbar">
                    {aspirations.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedAspirationIndex(idx)}
                        className={`min-w-[40px] h-10 border-[2px] border-black text-sm font-black transition-all cursor-pointer ${
                          selectedAspirationIndex === idx
                            ? "bg-black text-white"
                            : "bg-white text-black hover:bg-green-pop"
                        }`}
                      >
                        #{idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {primaryAspiration ? (
                <div className="space-y-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-black text-black leading-tight tracking-tight mb-4 uppercase">
                      {primaryAspiration.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="bg-white border-[3px] border-black px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0_#000]">
                        {(Array.isArray(primaryAspiration.careers)
                          ? primaryAspiration.careers[0]
                          : primaryAspiration.careers) || "Chưa chọn ngành"}
                      </span>
                      <span className="bg-green-pop border-[3px] border-black px-4 py-2 text-sm font-black uppercase shadow-[4px_4px_0_#000]">
                        {targetMethod}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white p-6 border-[3px] border-black shadow-[4px_4px_0_#000]">
                      <p className="text-black text-xs font-black uppercase tracking-widest mb-2 border-b-[2px] border-black pb-2">
                        Điểm chuẩn
                      </p>
                      <p className="text-4xl font-black text-black">{targetScore}</p>
                    </div>
                    <div className="bg-green-pop p-6 border-[3px] border-black shadow-[4px_4px_0_#000]">
                      <p className="text-black text-xs font-black uppercase tracking-widest mb-2 border-b-[2px] border-black pb-2">
                        Hiện tại
                      </p>
                      <p className="text-4xl font-black text-black">
                        {currentAdmissionScore}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-black text-black uppercase flex items-center bg-white px-3 py-1 border-[3px] border-black shadow-[2px_2px_0_#000]">
                        <Sparkles className="w-4 h-4 mr-2" /> Độ khả thi
                      </span>
                      <span className="text-xl font-black text-black bg-green-pop px-3 py-1 border-[3px] border-black shadow-[2px_2px_0_#000]">
                        {Math.round(
                          Math.min(
                            100,
                            (parseFloat(currentAdmissionScore as string) /
                              targetScore) *
                              100,
                          ),
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-8 bg-white border-[3px] border-black shadow-[inset_0_4px_0_rgba(0,0,0,0.1)] relative w-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(100, (parseFloat(currentAdmissionScore as string) / targetScore) * 100)}%`,
                        }}
                        className="h-full bg-cyan-pop border-r-[3px] border-black absolute left-0 top-0"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] flex-1 flex flex-col justify-center items-center">
                  <p className="text-black mb-6 text-xl font-black uppercase">
                    Chưa có nguyện vọng
                  </p>
                  <button
                    onClick={() => navigate("/welcome")}
                    className="px-8 py-4 font-black text-black bg-green-pop uppercase border-[3px] border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none inline-block hover:bg-emerald-600 transition-colors cursor-pointer"
                  >
                    Tìm trường ngay
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Quick Configuration */}
            <div className="brutal-card bg-white p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-black text-black flex items-center uppercase tracking-tight mb-8">
                  <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000] flex-shrink-0">
                    <Settings className="w-6 h-6 stroke-[3px] text-black" />
                  </div>
                  Điều chỉnh nhanh
                </h2>
                
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-black text-black uppercase pl-2 border-l-[4px] border-cyan-pop">
                      Phương thức tuyển sinh
                    </label>
                    <select
                      value={targetMethod}
                      onChange={(e) => {
                        const method = e.target.value;
                        setTargetMethod(method);
                        localStorage.setItem("smarm_target_method", method);
                        updateCurrentAspiration({ method });
                      }}
                      className="w-full bg-white border-[3px] border-black px-4 py-3 text-base font-black text-black focus:outline-none shadow-[4px_4px_0_#000] cursor-pointer hover:bg-green-pop/10 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      {ADMISSION_METHODS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(targetMethod === "THPT" || targetMethod === "Học bạ") && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-black uppercase pl-2 border-l-[4px] border-red-pop">
                        Tổ hợp môn xét tuyển
                      </label>
                      <div className="flex flex-wrap gap-2.5 p-1">
                        {subjects.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => {
                              const isIncluded = targetSubjects.includes(sub);
                              let newTargets = isIncluded
                                ? targetSubjects.filter((s) => s !== sub)
                                : [...targetSubjects, sub];
                              if (newTargets.length > 3)
                                newTargets = newTargets.slice(1);
                              setTargetSubjects(newTargets);
                              localStorage.setItem(
                                "smarm_target_subjects",
                                JSON.stringify(newTargets),
                              );
                              updateCurrentAspiration({
                                targetSubjects: newTargets,
                              });
                            }}
                            className={`px-3 py-1.5 border-[2.5px] border-black text-xs font-black uppercase transition-all shadow-[2px_2px_0_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none cursor-pointer ${
                              targetSubjects.includes(sub)
                                ? "bg-black text-white"
                                : "bg-white text-black hover:bg-green-pop"
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {targetMethod === "ĐGNL" && (
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black text-black uppercase pl-2 border-l-[4px] border-green-pop">
                        Điểm ĐGNL mục tiêu
                      </label>
                      <input
                        type="number"
                        value={dgnlScore || ""}
                        onChange={(e) => {
                          const val =
                            e.target.value === ""
                              ? null
                              : parseFloat(e.target.value);
                          setDgnlScore(val);
                          localStorage.setItem(
                            "smarm_dgnl_score",
                            e.target.value,
                          );
                        }}
                        className="w-full bg-white border-[3px] border-black px-4 py-3 text-base font-black text-black focus:outline-none shadow-[4px_4px_0_#000] focus:bg-green-pop/10 transition-colors"
                        placeholder="Nhập điểm..."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

          {/* Grades Content Area */}
          <div className="space-y-8 pt-8 border-t-[4px] border-black">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b-[4px] border-black">
              <h2 className="text-3xl font-black text-black flex items-center uppercase tracking-tight">
                <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000]">
                  <Calculator className="w-6 h-6 text-black stroke-[3px]" />
                </div>
                Kết quả học tập
              </h2>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full py-2">
                {(["class10", "class11", "class12"] as const).map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setActiveClass(cls)}
                    className={`flex-shrink-0 px-4 py-2 border-[2.5px] border-black text-xs font-black uppercase transition-all shadow-[2px_2px_0_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none cursor-pointer ${
                      activeClass === cls
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-green-pop"
                    }`}
                  >
                    Lớp {cls.replace("class", "")}
                  </button>
                ))}
                <div className="w-[3px] h-6 bg-black mx-1.5 flex-shrink-0"></div>
                {(["semester1", "semester2"] as const).map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setActiveSemester(sem)}
                    className={`flex-shrink-0 px-4 py-2 border-[2.5px] border-black text-xs font-black uppercase transition-all shadow-[2px_2px_0_#000] active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none cursor-pointer ${
                      activeSemester === sem
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-cyan-pop"
                    }`}
                  >
                    HK {sem.replace("semester", "")}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {subjects.map((subject, index) => {
                const data = currentSemesterData[subject];
                if (!data) return null;
                const avg = calculateSubjectAverage(data);
                const isExpanded = expandedSubject === subject;

                return (
                  <motion.div
                    layout
                    key={subject}
                    className={`bg-white brutal-card flex flex-col transition-all duration-300 overflow-hidden ${
                      isExpanded ? "border-b-[8px]" : ""
                    }`}
                  >
                    <div
                      className={`p-6 flex items-center justify-between cursor-pointer border-b-[4px] border-black ${
                        isExpanded ? "bg-green-pop" : "hover:bg-green-pop/10"
                      }`}
                      onClick={() =>
                        setExpandedSubject(isExpanded ? null : subject)
                      }
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-12 h-12 border-[3px] border-black flex items-center justify-center font-black mr-4 shadow-[4px_4px_0_#000] transition-all text-xl uppercase ${
                            isExpanded
                              ? "bg-white text-black"
                              : "bg-green-pop text-black"
                          }`}
                        >
                          {subject.charAt(0)}
                        </div>
                        <span className="font-black text-xl text-black uppercase tracking-tight">{subject}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        {avg && !isExpanded && (
                          <div className="bg-white px-3 py-1 border-[3px] border-black text-sm font-black text-black shadow-[2px_2px_0_#000]">
                            TBM: {avg}
                          </div>
                        )}
                        <ChevronDown
                          className={`w-6 h-6 stroke-[3px] text-black transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>

                    <div className="p-5 flex-1 bg-[var(--color-background)]">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white border-[3px] border-black p-3 text-center shadow-[4px_4px_0_#000]">
                          <span className="text-[10px] font-black text-black uppercase block mb-2 tracking-wider">
                            TX
                          </span>
                          <div className="font-black text-black text-lg truncate">
                            {data.regular.length > 0
                              ? data.regular[data.regular.length - 1]
                              : "--"}
                            {data.regular.length > 1 &&
                              ` (+${data.regular.length - 1})`}
                          </div>
                        </div>
                        <div className="bg-white border-[3px] border-black p-3 text-center shadow-[4px_4px_0_#000]">
                          <span className="text-[10px] font-black text-black uppercase block mb-2 tracking-wider">
                            Giữa kỳ
                          </span>
                          <div className="font-black text-black text-lg">
                            {data.mid !== null ? data.mid : "--"}
                          </div>
                        </div>
                        <div className="bg-[var(--color-yellow-pop)] border-[3px] border-black p-3 text-center shadow-[4px_4px_0_#000]">
                          <span className="text-[10px] font-black text-black uppercase block mb-2 tracking-wider">
                            Cuối kỳ
                          </span>
                          <div className="font-black text-black text-lg">
                            {data.final !== null ? data.final : "--"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-white p-6 space-y-6 border-t-[4px] border-black"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <label className="text-sm font-black text-black uppercase tracking-wider border-l-[4px] border-[var(--color-primary)] pl-2">
                                Điểm thường xuyên
                              </label>
                              <div className="flex items-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.1"
                                  placeholder="Nhập..."
                                  className="w-24 bg-[var(--color-background)] border-[3px] border-black px-3 py-2 text-sm font-black focus:outline-none shadow-[inset_0_2px_0_rgba(0,0,0,0.1)] focus:bg-white"
                                  id={`quick-reg-${subject}`}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      addRegularGrade(
                                        subject,
                                        e.currentTarget.value,
                                      );
                                      e.currentTarget.value = "";
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3">
                              {data.regular.map((score, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white px-3 py-2 border-[3px] border-black text-sm font-black text-black flex items-center group shadow-[4px_4px_0_#000]"
                                >
                                  {score}
                                  <button
                                    onClick={() =>
                                      removeRegularGrade(subject, idx)
                                    }
                                    className="ml-3 w-6 h-6 flex items-center justify-center bg-[var(--color-red-pop)] border-[2px] border-black shadow-[2px_2px_0_#000] opacity-0 group-hover:opacity-100 transition-opacity active:translate-x-1 active:translate-y-1 active:shadow-none"
                                  >
                                    <Trash2 className="w-3 h-3 stroke-[3px]" />
                                  </button>
                                </div>
                              ))}
                              {data.regular.length === 0 && (
                                <span className="text-sm font-black uppercase text-black/40 bg-[var(--color-background)] px-3 py-2 border-[3px] border-black">
                                  Chưa có điểm
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="text-sm font-black text-black uppercase block mb-3 border-l-[4px] border-cyan-pop pl-2">
                                Giữa kỳ
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={data.mid === null ? "" : data.mid}
                                onChange={(e) =>
                                  updateGrade(subject, "mid", e.target.value)
                                }
                                className="w-full bg-[var(--color-background)] border-[3px] border-black px-4 py-3 text-lg font-black text-black focus:outline-none shadow-[inset_0_4px_0_rgba(0,0,0,0.1)] focus:bg-white"
                                placeholder="..."
                              />
                            </div>
                            <div>
                              <label className="text-sm font-black text-black uppercase block mb-3 border-l-[4px] border-green-pop pl-2">
                                Cuối kỳ
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                step="0.1"
                                value={data.final === null ? "" : data.final}
                                onChange={(e) =>
                                  updateGrade(subject, "final", e.target.value)
                                }
                                className="w-full bg-[var(--color-background)] border-[3px] border-black px-4 py-3 text-lg font-black text-black focus:outline-none shadow-[inset_0_4px_0_rgba(0,0,0,0.1)] focus:bg-white"
                                placeholder="..."
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubjectToDelete(subject);
                            }}
                            className="w-full py-4 mt-4 flex items-center justify-center text-white bg-[var(--color-red-pop)] text-base font-black uppercase border-[4px] border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-red-600"
                          >
                            <Trash2 className="w-5 h-5 mr-3 stroke-[3px]" /> Xóa môn học
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              {/* Add New Subject Card */}
              <div className="bg-white brutal-card p-6 flex flex-col items-center justify-center min-h-[160px] border-dashed">
                <div className="w-full max-w-[250px] flex flex-col space-y-4">
                  <input
                    type="text"
                    placeholder="Tên môn học..."
                    className="w-full bg-[var(--color-background)] border-[4px] border-black px-4 py-3 text-base font-black text-black focus:outline-none shadow-[inset_0_2px_0_rgba(0,0,0,0.1)] focus:bg-white text-center uppercase placeholder:normal-case"
                    id="new-subject-input-main"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addSubject(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(
                        "new-subject-input-main",
                      ) as HTMLInputElement;
                      if (input?.value) {
                        addSubject(input.value);
                        input.value = "";
                      }
                    }}
                    className="w-full bg-green-pop text-black py-4 border-[4px] border-black font-black text-sm uppercase shadow-[6px_6px_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none transition-all flex items-center justify-center hover:bg-emerald-600"
                  >
                    <Plus className="w-6 h-6 mr-2 stroke-[3px]" /> Thêm môn
                  </button>
                </div>
              </div>
            </div>
          </div>
        {/* Left column end (removed) */}

        {/* Smarm AI Analysis Section */}
            <div className="brutal-card bg-green-pop p-6 md:p-8">
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                  <h2 className="text-2xl lg:text-3xl font-black text-black flex items-center uppercase tracking-tight">
                    <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000] flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-black stroke-[3px]" />
                    </div>
                    Smarm AI
                  </h2>
                  <button
                    onClick={generateAIAnalysis}
                    disabled={isAnalyzing}
                    className="p-3 bg-[var(--color-yellow-pop)] text-black border-[3px] border-black shadow-[4px_4px_0_#000] hover:bg-black hover:text-white transition-all disabled:opacity-50 active:translate-x-1 active:translate-y-1 active:shadow-none flex-shrink-0"
                    title="Cập nhật phân tích"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-6 h-6 animate-spin stroke-[3px]" />
                    ) : (
                      <RefreshCw className="w-6 h-6 stroke-[3px]" />
                    )}
                  </button>
                </div>

                <div className="min-h-[300px] max-h-[600px] overflow-y-auto bg-white border-[4px] border-black p-6 shadow-[inset_0_4px_0_rgba(0,0,0,0.1)]">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center py-16 text-black text-center">
                      <div className="w-16 h-16 bg-green-pop border-[4px] border-black flex items-center justify-center mb-6 shadow-[4px_4px_0_#000] animate-bounce">
                        <Loader2 className="w-8 h-8 animate-spin stroke-[3px]" />
                      </div>
                      <p className="text-lg font-black uppercase tracking-tight bg-white border-[3px] border-black px-4 py-2 shadow-[2px_2px_0_#000]">
                        {apiWorkerStatus || "Đang phân tích..."}
                      </p>
                    </div>
                  ) : aiAnalysis ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="markdown-body text-black font-medium"
                    >
                      <AiMarkdown content={aiAnalysis} />
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-black text-center">
                      <div className="w-20 h-20 bg-[var(--color-background)] border-[4px] border-black flex items-center justify-center mb-6 shadow-[4px_4px_0_#000]">
                        <Bot className="w-10 h-10 stroke-[3px]" />
                      </div>
                      <p className="text-base font-black uppercase bg-green-pop border-[4px] border-black px-6 py-4 shadow-[4px_4px_0_#000]">
                        Nhấn nút cập nhật để nhận phân tích học tập từ AI
                      </p>
                    </div>
                  )}
                </div>

                {aiAnalysis && (
                  <div className="mt-6 text-center">
                    <span className="text-xs font-black text-black uppercase bg-white border-[3px] border-black px-4 py-2 shadow-[2px_2px_0_#000]">
                      Dữ liệu được cập nhật từ hồ sơ của bạn
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Info / Legend */}
            <div className="brutal-card bg-white p-6 md:p-8">
              <h4 className="text-xl font-black text-black uppercase mb-6 flex items-center">
                <Info className="w-6 h-6 mr-3 stroke-[3px]" /> Mẹo học tập
              </h4>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 border-[3px] border-black bg-green-pop flex items-center justify-center text-sm font-black text-black mr-4 shadow-[2px_2px_0_#000] flex-shrink-0 mt-1">
                    1
                  </div>
                  <p className="text-base text-black font-bold leading-relaxed">
                    Bạn có thể thay đổi "Phong thái AI" trong tab Cài đặt để
                    nhận lời khuyên kiểu Bạn bè hoặc Giáo viên.
                  </p>
                </div>
                <div className="flex items-start">
                  <div className="w-8 h-8 border-[3px] border-black bg-cyan-pop flex items-center justify-center text-sm font-black text-black mr-4 shadow-[2px_2px_0_#000] flex-shrink-0 mt-1">
                    2
                  </div>
                  <p className="text-base text-black font-bold leading-relaxed">
                    Bấm vào từng môn học để chỉnh sửa điểm chi tiết.
                  </p>
                </div>
              </div>
            </div>
          {/* Right column elements end (removed wrappers) */}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {subjectToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="brutal-card bg-[var(--color-background)] p-8 md:p-10 max-w-md w-full"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-[var(--color-red-pop)] border-[4px] border-black text-black flex items-center justify-center mb-6 shadow-[6px_6px_0_#000]">
                  <Trash2 className="w-10 h-10 stroke-[3px]" />
                </div>
                <h3 className="text-3xl font-black text-black mb-4 uppercase">
                  Xóa môn {subjectToDelete}?
                </h3>
                <p className="text-base text-black font-bold mb-10 bg-white p-6 border-[4px] border-black shadow-[4px_4px_0_#000]">
                  Bạn có chắc chắn muốn xóa môn này không? Toàn bộ dữ liệu điểm
                  số của môn này ở tất cả các lớp sẽ bị xóa vĩnh viễn và không
                  thể khôi phục.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full">
                  <button
                    onClick={() => setSubjectToDelete(null)}
                    className="flex-1 px-6 py-4 bg-white hover:bg-green-pop text-black font-black uppercase border-[4px] border-black transition-colors shadow-[6px_6px_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none text-lg"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={() => confirmDeleteSubject(subjectToDelete)}
                    className="flex-1 px-6 py-4 bg-[var(--color-red-pop)] hover:bg-red-600 text-white font-black uppercase border-[4px] border-black transition-colors shadow-[6px_6px_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none text-lg"
                  >
                    Xóa ngay
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
