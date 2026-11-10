import { useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AiMarkdown } from "../../components/AiMarkdown";
import { questions } from "../../data/questions";
import { careerGroups, traitDescriptions } from "../../data/careers";
import {
  Briefcase,
  Award,
  Sparkles,
  Search,
  Check,
  ChevronRight,
  GraduationCap,
  Building2,
  ExternalLink,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { api } from "../../lib/api";
import { writeJson } from "../../lib/localData";
import { useToast } from "../../components/Toast";
import {
  buildUniversitySearchRequest,
  chooseUniversityDisplaySet,
  extractUniversityCandidatesFromSearch,
  mergeUniversityCandidates,
} from "../../lib/universitySearch";
import UniversityPhotoGrid from "../../components/UniversityPhotoGrid";

const CAREER_MAJOR_MAP: Record<string, string[]> = {
  "Kỹ sư cơ khí": ["kỹ thuật cơ khí", "cơ khí chế tạo máy"],
  "Kỹ sư điện - điện tử": ["kỹ thuật điện", "điện tử viễn thông", "kỹ thuật điện tử"],
  "Kỹ sư xây dựng": ["kỹ thuật xây dựng", "xây dựng cầu đường", "xây dựng dân dụng"],
  "Kỹ thuật viên ô tô": ["kỹ thuật cơ khí động lực", "công nghệ kỹ thuật ô tô"],
  "Nông nghiệp công nghệ cao": ["khoa học nông nghiệp", "nông nghiệp", "công nghệ thực phẩm"],
  "Logistics và quản lý chuỗi cung ứng": ["logistics và quản lý chuỗi cung ứng", "quản trị logistics", "thương mại"],
  "Vận hành máy móc": ["kỹ thuật cơ khí", "công nghệ kỹ thuật cơ khí", "chế tạo máy", "cơ điện tử"],
  "Kỹ sư tự động hóa": ["kỹ thuật điều khiển và tự động hóa", "tự động hóa"],
  "Kiến trúc sư cảnh quan": ["kiến trúc cảnh quan", "quy hoạch vùng và đô thị"],
  "Sửa chữa thiết bị y tế": ["kỹ thuật y sinh", "kỹ thuật trang thiết bị y tế"],
  "Kỹ thuật viên hàng không": ["kỹ thuật hàng không", "quản lý bay", "khoa học hàng không"],
  "Chuyên viên an toàn lao động": ["kỹ thuật an toàn và công nghiệp môi trường", "an toàn lao động"],
  "Kỹ sư môi trường": ["kỹ thuật môi trường", "khoa học môi trường", "quản lý tài nguyên môi trường"],
  "Quản lý trang trại": ["khoa học cây trồng", "chăn nuôi thú y", "quản lý đất đai"],
  "Thiết kế công nghiệp": ["thiết kế công nghiệp", "thiết kế sản phẩm"],
  "Kỹ thuật viên viễn thông": ["kỹ thuật viễn thông", "mạng máy tính và truyền thông dữ liệu"],
  "Kỹ sư vật liệu": ["khoa học vật liệu", "công nghệ vật liệu"],
  "Thợ kim hoàn": ["thiết kế trang sức", "mỹ thuật công nghiệp"],
  "Kỹ thuật viên in ấn": ["công nghệ in", "công nghệ kỹ thuật in"],
  "Kỹ sư dầu khí": ["kỹ thuật dầu khí", "địa chất dầu khí"],

  "Nhà khoa học dữ liệu": ["khoa học dữ liệu", "khoa học máy tính", "trí tuệ nhân tạo"],
  "Bác sĩ y khoa": ["y khoa", "y đa khoa", "y học", "răng hàm mặt"],
  "Dược sĩ nghiên cứu": ["dược học", "dược sĩ"],
  "Kỹ sư phần mềm": ["kỹ thuật phần mềm", "công nghệ thông tin", "khoa học máy tính"],
  "Chuyên viên phân tích tài chính": ["tài chính ngân hàng", "tài chính", "phân tích tài chính"],
  "Nhà nghiên cứu sinh học": ["công nghệ sinh học", "sinh học"],
  "Chuyên gia an ninh mạng": ["an toàn thông tin", "mạng máy tính và truyền thông dữ liệu"],
  "Giảng viên đại học": ["sư phạm", "giáo dục học"],
  "Nhà tâm lý học lâm sàng": ["tâm lý học", "tâm lý lâm sàng"],
  "Chuyên viên phân tích thị trường": ["quản trị kinh doanh", "marketing"],
  "Kỹ sư trí tuệ nhân tạo": ["trí tuệ nhân tạo", "khoa học máy tính", "công nghệ thông tin"],
  "Nhà thiên văn học": ["vật lý học", "thiên văn và khoa học không gian"],
  "Kỹ sư hóa học": ["kỹ thuật hóa học", "hóa học"],
  "Nhà nghiên cứu vật lý": ["vật lý học", "vật lý kỹ thuật"],
  "Chuyên gia thống kê": ["toán ứng dụng", "thống kê", "toán học"],
  "Nhà nghiên cứu lịch sử": ["lịch sử", "khảo cổ học"],
  "Chuyên viên phân tích hệ thống": ["hệ thống thông tin quản lý", "công nghệ thông tin"],
  "Nhà khoa học môi trường": ["khoa học môi trường", "quản lý tài nguyên môi trường"],
  "Chuyên gia dịch tễ học": ["y tế công cộng", "dịch tễ học"],
  "Nhà nghiên cứu kinh tế": ["kinh tế học", "kinh tế chính trị"],

  "Thiết kế đồ họa": ["thiết kế đồ họa", "mỹ thuật đa phương tiện", "mỹ thuật ứng dụng", "thiết kế truyền thông"],
  "Thiết kế UI/UX": ["thiết kế đồ họa", "truyền thông đa phương tiện"],
  "Đạo diễn nghệ thuật": ["sân khấu điện ảnh", "nghệ thuật điện ảnh"],
  "Nhà văn / Nhà báo": ["báo chí", "truyền thông đa phương tiện", "ngôn ngữ văn học"],
  "Kiến trúc sư": ["kiến trúc", "kiến trúc đô thị"],
  "Nhiếp ảnh gia": ["nhiếp ảnh", "truyền thông đa phương tiện", "nghệ thuật nhiếp ảnh", "quay phim"],
  "Nhà thiết kế thời trang": ["thiết kế thời trang", "thiết kế mỹ thuật"],
  "Biên kịch": ["biên kịch điện ảnh truyền hình", "sân khấu điện ảnh"],
  "Diễn viên": ["nghệ thuật sân khấu", "diễn xuất", "sân khấu điện ảnh", "diễn viên kịch", "diễn viên điện ảnh"],
  "Nhạc sĩ / Ca sĩ": ["âm nhạc", "thanh nhạc", "lý luận sáng tác âm nhạc"],
  "Thiết kế nội thất": ["thiết kế nội thất", "kiến trúc nội thất"],
  "Họa sĩ minh họa": ["hội họa", "mỹ thuật", "mỹ thuật đa phương tiện"],
  "Chuyên viên trang điểm": ["hóa trang sân khấu điện ảnh", "thiết kế thời trang", "mỹ thuật"],
  "Nhà sản xuất âm nhạc": ["sản xuất âm nhạc", "công nghệ âm nhạc", "âm nhạc"],
  "Thiết kế trò chơi": ["thiết kế đồ họa", "công nghệ thông tin", "truyền thông đa phương tiện"],
  "Chuyên viên truyền thông": ["truyền thông đa phương tiện", "quan hệ công chúng", "báo chí"],
  "Nhà thiết kế trang sức": ["thiết kế trang sức", "mỹ thuật công nghiệp"],
  "Giám đốc sáng tạo": ["truyền thông đa phương tiện", "thiết kế đồ họa", "marketing"],
  "Biên tập viên video": ["truyền thông đa phương tiện", "nghệ thuật điện ảnh"],
  "Nhà thiết kế công nghiệp": ["thiết kế công nghiệp", "thiết kế sản phẩm"],

  "Giáo viên / Giảng viên": ["sư phạm", "giáo dục học", "sư phạm tiểu học", "sư phạm mầm non"],
  "Chuyên viên tư vấn tâm lý": ["tâm lý học", "tâm lý giáo dục", "tham vấn tâm lý"],
  "Bác sĩ đa khoa": ["y khoa", "y đa khoa"],
  "Điều dưỡng / Y tá": ["điều dưỡng", "điều dưỡng đa khoa"],
  "Nhân viên công tác xã hội": ["công tác xã hội", "xã hội học"],
  "Chuyên viên nhân sự": ["quản trị nhân lực", "quản trị kinh doanh"],
  "Huấn luyện viên cá nhân": ["khoa học thể thao", "huấn luyện thể thao", "y học thể thao"],
  "Chuyên viên chăm sóc khách hàng": ["quản trị kinh doanh", "marketing", "quản trị dịch vụ du lịch và lữ hành"],
  "Hướng dẫn viên du lịch": ["quản trị dịch vụ du lịch và lữ hành", "du lịch"],
  "Chuyên viên vật lý trị liệu": ["vật lý trị liệu và phục hồi chức năng", "y học cổ truyền"],
  "Cố vấn học tập": ["tâm lý học", "giáo dục học", "quản lý giáo dục"],
  "Chuyên viên quan hệ công chúng": ["quan hệ công chúng", "truyền thông đa phương tiện", "báo chí"],
  "Nhà hoạt động xã hội": ["công tác xã hội", "xã hội học", "luật"],
  "Chuyên gia dinh dưỡng": ["dinh dưỡng và khoa học thực phẩm", "công nghệ thực phẩm", "y tế công cộng"],
  "Quản lý khách sạn": ["quản trị nhà hàng khách sạn", "quản trị dịch vụ du lịch và lữ hành"],
  "Chuyên viên tổ chức sự kiện": ["truyền thông đa phương tiện", "quản trị kinh doanh"],
  "Chuyên viên đào tạo": ["quản trị nhân lực", "giáo dục học"],
  "Cảnh sát cộng đồng": ["luật", "trinh sát", "an ninh trật tự xã hội"],
  "Chuyên viên trị liệu ngôn ngữ": ["ngôn ngữ học", "tâm lý học"],
  "Tư vấn viên nghề nghiệp": ["tâm lý học", "quản trị nhân lực", "giáo dục học"],

  "Giám đốc điều hành (CEO)": ["quản trị kinh doanh", "quản trị doanh nghiệp"],
  "Giám đốc marketing (CMO)": ["marketing", "quản trị kinh doanh", "truyền thông marketing"],
  "Doanh nhân / Khởi nghiệp": ["quản trị kinh doanh", "kinh doanh quốc tế", "khởi nghiệp và đổi mới sáng tạo"],
  "Quản lý dự án": ["quản trị kinh doanh", "quản lý dự án xây dựng"],
  "Chuyên viên bán hàng (Sales)": ["quản trị kinh doanh", "marketing", "kinh doanh quốc tế"],
  "Chuyên viên quan hệ công chúng (PR)": ["quan hệ công chúng", "truyền thông đa phương tiện"],
  "Luật sư": ["luật", "luật kinh tế", "luật quốc tế"],
  "Quản lý bất động sản": ["quản lý đất đai", "kinh doanh bất động sản", "quản trị kinh doanh"],
  "Chuyên gia tư vấn chiến lược": ["quản trị kinh doanh", "kinh tế", "quản trị doanh nghiệp"],
  "Giám đốc nhân sự": ["quản trị nhân lực", "quản trị kinh doanh"],
  "Quản lý chuỗi cửa hàng": ["quản trị kinh doanh", "quản trị doanh nghiệp"],
  "Chuyên viên môi giới chứng khoán": ["tài chính ngân hàng", "tài chính", "bảo hiểm"],
  "Giám đốc kinh doanh": ["quản trị kinh doanh", "kinh doanh quốc tế"],
  "Nhà tổ chức sự kiện": ["truyền thông đa phương tiện", "quản trị kinh doanh"],
  "Chuyên viên đàm phán": ["luật", "ngoại giao", "luật quốc tế"],
  "Giám đốc tài chính (CFO)": ["tài chính ngân hàng", "kế toán", "kiểm toán"],
  "Quản lý nhà hàng": ["quản trị nhà hàng khách sạn", "quản trị dịch vụ du lịch và lữ hành"],
  "Chuyên viên thu mua": ["quản trị kinh doanh", "logistics và quản lý chuỗi cung ứng"],
  "Đại diện thương mại": ["kinh doanh quốc tế", "thương mại quốc tế"],
  "Chính trị gia": ["luật", "hành chính công", "chính trị học"],

  "Kế toán viên": ["kế toán", "kế toán kiểm toán"],
  "Kiểm toán viên": ["kiểm toán", "kế toán kiểm toán"],
  "Chuyên viên phân tích dữ liệu": ["khoa học dữ liệu", "thống kê", "hệ thống thông tin quản lý"],
  "Thư ký / Trợ lý giám đốc": ["quản trị văn phòng", "hành chính công"],
  "Nhân viên hành chính nhân sự": ["quản trị nhân lực", "hành chính công"],
  "Chuyên viên thuế": ["kế toán", "thuế", "tài chính công"],
  "Nhân viên ngân hàng": ["tài chính ngân hàng", "ngân hàng"],
  "Quản trị cơ sở dữ liệu": ["hệ thống thông tin", "công nghệ thông tin", "mạng máy tính và truyền thông dữ liệu"],
  "Chuyên viên kiểm soát chất lượng": ["quản lý chất lượng", "công nghệ thực phẩm"],
  "Nhân viên lưu trữ hồ sơ": ["lưu trữ học", "hành chính công"],
  "Chuyên viên thanh toán quốc tế": ["tài chính ngân hàng", "kinh doanh quốc tế"],
  "Nhân viên thống kê": ["thống kê", "toán ứng dụng"],
  "Chuyên viên thẩm định giá": ["tài chính", "thẩm định giá", "quản lý đất đai"],
  "Nhân viên nhập liệu": ["hành chính công", "quản trị văn phòng"],
  "Chuyên viên quản lý rủi ro": ["tài chính ngân hàng", "quản trị kinh doanh"],
  "Nhân viên bảo hiểm": ["bảo hiểm", "tài chính ngân hàng"],
  "Chuyên viên lập kế hoạch": ["quản trị kinh doanh", "kế toán"],
  "Nhân viên điều phối kho": ["logistics và quản lý chuỗi cung ứng", "quản trị kinh doanh"],
  "Thư ký": ["thông tin thư viện", "quản lý thông tin"],
  "Nhân viên tuân thủ pháp chế": ["luật", "luật kinh tế", "hành chính công"],
};

const mapCareerToMajors = (careers: string[]): string[] => {
  const majors = new Set<string>();
  for (const career of careers) {
    const mapped = CAREER_MAJOR_MAP[career];
    if (mapped) {
      for (const m of mapped) majors.add(m);
    } else {
      majors.add(career);
    }
  }
  const arr = Array.from(majors);
  const vnFirst = arr.filter((m) => !/^[a-zA-Z\s\-]+$/.test(m));
  const enOnly = arr.filter((m) => /^[a-zA-Z\s\-]+$/.test(m));
  return [...vnFirst, ...enOnly];
};

const buildExaQueries = (majors: string[]): string[] => {
  const queries: string[] = [];
  const top = majors.slice(0, 4);

  for (const major of top) {
    queries.push(`trường đại học Việt Nam đào tạo ${major}`);
    queries.push(`đại học đào tạo ngành ${major} ở Việt Nam`);
    queries.push(`tuyển sinh ngành ${major} trường đại học`);
  }

  for (const major of top.slice(0, 2)) {
    queries.push(`các trường đào tạo ${major}`);
    queries.push(`ngành ${major} học trường nào`);
  }

  for (const major of top) {
    if (/^[a-zA-Z\s\-]+$/.test(major)) {
      queries.push(`${major} university Vietnam`);
      break;
    }
  }

  return queries;
};

const getDomainRank = (url: string): number => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.endsWith(".edu.vn")) return 0;
    if (hostname.includes("tuyensinh")) return 1;
    if (hostname.includes("moet") || hostname.includes("gov.vn")) return 1;
    if (hostname.includes("diemthi") || hostname.includes("tuyensinh247")) return 2;
    const knownUni = [
      "vnu.edu.vn", "hust.edu.vn", "vnuhcm.edu.vn", "uit.edu.vn",
      "hcmus.edu.vn", "ueh.edu.vn", "ftu.edu.vn", "neu.edu.vn",
      "tlu.edu.vn", "huce.edu.vn", "ptit.edu.vn", "actvn.edu.vn",
      "ump.edu.vn", "hmu.edu.vn", "ydktphcm.edu.vn", "agu.edu.vn",
      "ctu.edu.vn", "dut.udn.vn", "hueuni.edu.vn", "ntu.edu.vn",
    ];
    if (knownUni.some((d) => hostname.includes(d))) return 0;
    return 3;
  } catch {
    return 4;
  }
};

const mergeDeduplicateRankResults = (allResults: any[][]): any[] => {
  const seen = new Set<string>();
  const merged: any[] = [];

  for (const batch of allResults) {
    for (const item of batch) {
      const url = (item.url || "").toLowerCase().trim();
      const title = (item.title || "").toLowerCase().trim();
      const key = url || title;
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(item);
      }
    }
  }

  merged.sort((a, b) => {
    const rankA = getDomainRank(a.url || "");
    const rankB = getDomainRank(b.url || "");
    if (rankA !== rankB) return rankA - rankB;
    const textA = (a.text || a.snippet || "").length;
    const textB = (b.text || b.snippet || "").length;
    return textB - textA;
  });

  return merged;
};

const cleanText = (text: string) => {
  if (!text) return "";

  let cleaned = text.replace(
    /^(Tuyá»‡t vá»i! |DÆ°á»›i Ä‘Ã¢y lÃ  |Cháº¯c cháº¯n rá»“i! |VÃ¢ng, |ÄÃ¢y lÃ  |Ok, |ÄÆ°á»£c rá»“i, ).*?:/im,
    "",
  );
  cleaned = cleaned.replace(
    /^(Dưới đây là bản báo cáo|Sau đây là báo cáo|Báo cáo tuyển sinh|Dưới đây là thông tin).*?:/im,
    "",
  );

  return cleaned
    .replace(/\n{3,}/g, "\n\n")
    .replace(/&nbsp;/g, " ")
    .trim();
};

const extractJson = (text: string) => {
  if (!text || text.trim() === "") {
    throw new Error("Phản hồi từ AI trống");
  }

  let clean = text.trim();
  if (clean.startsWith("```")) {
    const firstNewline = clean.indexOf("\n");
    if (firstNewline !== -1) {
      clean = clean.substring(firstNewline).trim();
    } else {
      clean = clean.replace(/^```(json)?/i, "").trim();
    }
  }
  if (clean.endsWith("```")) {
    clean = clean.substring(0, clean.length - 3).trim();
  }

  try {
    return JSON.parse(clean);
  } catch {
    try {
      const startIdx = clean.indexOf("[");
      const endIdx = clean.lastIndexOf("]");
      const startObjIdx = clean.indexOf("{");
      const endObjIdx = clean.lastIndexOf("}");

      const arrayLen =
        startIdx !== -1 && endIdx !== -1 ? endIdx - startIdx : -1;
      const objLen =
        startObjIdx !== -1 && endObjIdx !== -1 ? endObjIdx - startObjIdx : -1;

      if (arrayLen > -1 && arrayLen > objLen) {
        return JSON.parse(clean.substring(startIdx, endIdx + 1));
      } else if (objLen > -1) {
        return JSON.parse(clean.substring(startObjIdx, endObjIdx + 1));
      }
    } catch {
      throw new Error(
        "Không thể trích xuất JSON từ phản hồi AI",
      );
    }

    throw new Error("Không thể trích xuất JSON từ phản hồi AI");
  }
};

const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
};

const GUIDANCE_STORAGE_KEY = "smarm_guidance_results";
const GUIDANCE_RESULTS_VERSION = 3;

const saveGuidanceResults = (data: {
  selectedCareers: string[];
  universities: any[];
  selectedUnis: any[];
  uniDetails: any[];
  userConstraint: string;
  uniSelectionMessage: string;
}) => {
  try {
    localStorage.setItem(
      GUIDANCE_STORAGE_KEY,
      JSON.stringify({ version: GUIDANCE_RESULTS_VERSION, ...data }),
    );
  } catch { /* ignore quota errors */ }
};

const loadGuidanceResults = () => {
  try {
    const raw = localStorage.getItem(GUIDANCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Results saved by older versions can contain broken school names/URLs.
    if (parsed?.version !== GUIDANCE_RESULTS_VERSION) {
      localStorage.removeItem(GUIDANCE_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const clearGuidanceResults = () => {
  localStorage.removeItem(GUIDANCE_STORAGE_KEY);
};

interface GuidanceTabProps {
  onComplete?: () => void;
}

const GUIDANCE_CAREERS_KEY = "smarm_guidance_careers";
const CAREER_RESULT_LIMIT = 24;
// Rank of the Holland group decides how many careers it contributes.
const CAREER_RESULT_WEIGHTS = [12, 8, 4];

const pickRecommendedCareers = (top3: Array<{ category: string }>) => {
  const buckets = top3.map((item, index) =>
    (careerGroups[item.category] || []).slice(0, CAREER_RESULT_WEIGHTS[index] ?? 0),
  );
  const picked: string[] = [];
  const seen = new Set<string>();
  const push = (career?: string) => {
    if (!career || seen.has(career) || picked.length >= CAREER_RESULT_LIMIT) return;
    seen.add(career);
    picked.push(career);
  };
  const longest = Math.max(0, ...buckets.map((bucket) => bucket.length));
  for (let round = 0; round < longest; round += 1) {
    for (const bucket of buckets) push(bucket[round]);
  }
  // Careers repeated across groups can leave the list short; top up by rank.
  for (const item of top3) {
    for (const career of careerGroups[item.category] || []) push(career);
  }
  return picked;
};

const buildFallbackDetail = (uni: any) => {
  const majors = Array.isArray(uni?.matchedMajors)
    ? uni.matchedMajors.slice(0, 3).join(", ")
    : "";
  const summary = [
    `## ${uni?.title || "Trường đại học"}`,
    typeof uni?.description === "string" && uni.description.trim()
      ? uni.description.trim()
      : "Trường đại học tại Việt Nam.",
    majors ? `**Ngành liên quan:** ${majors}` : "",
    "> Chưa truy xuất được nguồn tuyển sinh trực tuyến cho trường này. Hãy mở website chính thức của trường để kiểm tra điểm chuẩn và học phí mới nhất.",
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    uni,
    summary,
    targetScore: 0,
    method: "THPT",
    targetSubjects: [] as string[],
  };
};

const HIGHLIGHT_MAX_LENGTH = 170;
const formatHighlight = (text: string): string => {
  const clean = String(text)
    .replace(/\s+/g, " ")
    .replace(/^[.\u2026\s]+|[.\u2026\s]+$/g, "")
    .trim();
  if (clean.length <= HIGHLIGHT_MAX_LENGTH) return clean;
  const cut = clean.slice(0, HIGHLIGHT_MAX_LENGTH);
  const stop = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("; "),
    cut.lastIndexOf(" - "),
  );
  const body = stop > 100 ? cut.slice(0, stop) : cut;
  return `${body.trim().replace(/[.,;:\-\u2013\u2014]$/, "")}...`;
};

export default function GuidanceTab({ onComplete }: GuidanceTabProps) {
  const { showToast } = useToast();

  const [step, setStep] = useState<
    | "holland"
    | "searching_unis"
    | "select_unis"
    | "searching_details"
    | "show_details"
  >("holland");

  const [userConstraint, setUserConstraint] = useState<string>("");
  const [uniSelectionMessage, setUniSelectionMessage] = useState<string>("");

  const handleSetStep = (
    newStep:
      | "holland"
      | "searching_unis"
      | "select_unis"
      | "searching_details"
      | "show_details",
  ) => {
    setStep(newStep);
  };

  const [selectedCareers, setSelectedCareers] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(GUIDANCE_CAREERS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed)
        ? parsed.filter((career): career is string => typeof career === "string").slice(0, 5)
        : [];
    } catch {
      return [];
    }
  });
  const [universities, setUniversities] = useState<any[]>([]);
  const [selectedUnis, setSelectedUnis] = useState<any[]>([]);
  const [uniDetails, setUniDetails] = useState<any[]>([]);
  const [targetProgress, setTargetProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [streamingReports, setStreamingReports] = useState<Record<string, string>>({});
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  const [answers, setAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (displayProgress < targetProgress) {
      const diff = targetProgress - displayProgress;
      const stepSize = diff > 20 ? 2 : 1;
      const timeout = setTimeout(() => {
        setDisplayProgress((prev) => Math.min(prev + stepSize, targetProgress));
      }, 16);
      return () => clearTimeout(timeout);
    } else if (displayProgress > targetProgress) {
      setDisplayProgress(targetProgress);
    }
  }, [displayProgress, targetProgress]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const answersData = localStorage.getItem("smarm_answers");
    if (answersData) {
      try {
        setAnswers(JSON.parse(answersData));
      } catch { /* ignore */ }
    }

    const saved = loadGuidanceResults();
    if (saved && saved.uniDetails && saved.uniDetails.length > 0) {
      setSelectedCareers(saved.selectedCareers || []);
      setUniversities(saved.universities || []);
      setSelectedUnis(saved.selectedUnis || []);
      setUniDetails(saved.uniDetails || []);
      setUserConstraint(saved.userConstraint || "");
      setUniSelectionMessage(saved.uniSelectionMessage || "");
      setStep("show_details");
    } else if (saved && saved.universities && saved.universities.length > 0) {
      setSelectedCareers(saved.selectedCareers || []);
      setUniversities(saved.universities || []);
      setSelectedUnis(saved.selectedUnis || []);
      setUserConstraint(saved.userConstraint || "");
      setUniSelectionMessage(saved.uniSelectionMessage || "");
      setStep("select_unis");
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(GUIDANCE_CAREERS_KEY, JSON.stringify(selectedCareers));
    } catch { /* ignore quota errors */ }
  }, [selectedCareers]);

  const results = useMemo(() => {
    if (Object.keys(answers).length === 0) return null;

    const scores: Record<string, number> = {
      R: 0, I: 0, A: 0, S: 0, E: 0, C: 0,
    };

    questions.forEach((q) => {
      if (answers[q.id] !== undefined) {
        scores[q.category] += answers[q.id];
      }
    });

    const sortedScores = Object.entries(scores)
      .map(([category, score]) => ({ category, score }))
      .sort((a, b) => b.score - a.score);

    const top3 = sortedScores.slice(0, 3);
    const hollandCode = top3.map((item) => item.category).join("");

    const recommendedCareers = pickRecommendedCareers(top3);

    return { scores: sortedScores, top3, hollandCode, recommendedCareers };
  }, [answers]);

  if (!results) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-24 h-24 bg-orange-pop border-[4px] border-black flex items-center justify-center mb-8 shadow-[6px_6px_0_#000]">
          <Sparkles className="w-12 h-12 text-black stroke-[3px]" />
        </div>
        <h2 className="text-3xl font-black text-black mb-6 uppercase tracking-tight bg-white px-6 py-2 border-[4px] border-black shadow-[4px_4px_0_#000] inline-block">
          Chưa có kết quả trắc nghiệm
        </h2>
        <p className="text-black font-bold text-lg max-w-lg bg-red-pop p-6 border-[4px] border-black shadow-[4px_4px_0_#000] mx-auto">
          Bạn cần hoàn thành bài trắc nghiệm Holland trước khi sử dụng tính năng tư vấn hướng nghiệp.
        </p>
      </div>
    );
  }

  const categoryNames: Record<string, string> = {
    R: "Realistic (Kỹ thuật, Thực tế)",
    I: "Investigative (Nghiên cứu)",
    A: "Artistic (Nghệ thuật)",
    S: "Social (Xã hội)",
    E: "Enterprising (Quản lý, Kinh doanh)",
    C: "Conventional (Nghiệp vụ, Dữ liệu)",
  };

  const toggleCareer = (career: string) => {
    if (selectedCareers.includes(career)) {
      setSelectedCareers((prev) => prev.filter((c) => c !== career));
    } else {
      if (selectedCareers.length < 5) {
        setSelectedCareers((prev) => [...prev, career]);
      } else {
        showToast("Bạn chỉ được chọn tối đa 5 ngành nghề!", "info");
      }
    }
  };

  const toggleUni = (uni: any) => {
    const isSelected = selectedUnis.some((u) => u.url === uni.url);
    if (isSelected) {
      setSelectedUnis((prev) => prev.filter((u) => u.url !== uni.url));
    } else {
      if (selectedUnis.length < 5) {
        setSelectedUnis((prev) => [...prev, uni]);
      } else {
        showToast("Bạn chỉ được chọn tối đa 5 trường đại học!", "info");
      }
    }
  };

  const searchUniversities = async () => {
    if (selectedCareers.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 ngành nghề!", "info");
      return;
    }

    const myId = ++requestIdRef.current;
    handleSetStep("searching_unis");
    setTargetProgress(3);
    setLoadingStatus("Đang chuẩn bị tìm kiếm...");

    try {
      const mappedMajors = mapCareerToMajors(selectedCareers);
      const searchGroups: Array<{ label: string; majors: string[] }> = [];
      const bucketCount = Math.min(3, selectedCareers.length);
      for (let index = 0; index < bucketCount; index += 1) {
        searchGroups.push({ label: "", majors: [] });
      }
      selectedCareers.forEach((career, index) => {
        const bucket = searchGroups[index % bucketCount];
        bucket.label = bucket.label ? `${bucket.label} / ${career}` : career;
        for (const major of CAREER_MAJOR_MAP[career] || [career]) {
          if (!bucket.majors.includes(major) && bucket.majors.length < 6) bucket.majors.push(major);
        }
      });

      const allCandidates: any[] = [];
      const groupErrors: string[] = [];
      let cursor = 0;
      let completed = 0;
      const workerCount = Math.min(3, searchGroups.length);

      const worker = async () => {
        while (cursor < searchGroups.length) {
          const currentIndex = cursor;
          cursor += 1;
          const group = searchGroups[currentIndex];

          try {
            setLoadingStatus(
              `Đang tìm trường cho nhóm nghề: ${group.label}... (${currentIndex + 1}/${searchGroups.length})`,
            );

            const request = buildUniversitySearchRequest(group.label, group.majors, userConstraint);
            const searchData = await withTimeout(
              api.exaSearchAdvanced(request.query, request.numResults, request.options),
              150000,
              `exa-group-${currentIndex}`,
            );
            const candidates = extractUniversityCandidatesFromSearch(
              searchData,
              group.label,
              userConstraint,
            );
            if (candidates.length > 0) allCandidates.push(...candidates);
          } catch (groupErr) {
            groupErrors.push(groupErr instanceof Error ? groupErr.message : "Lỗi không xác định.");
          } finally {
            completed += 1;
            const pct = 5 + Math.floor((completed / searchGroups.length) * 45);
            setTargetProgress(pct);
          }
        }
      };

      await Promise.all(Array.from({ length: workerCount }, () => worker()));

      let mergedCandidates = mergeUniversityCandidates(allCandidates);

      // Lưới an toàn: deep search hiếm khi nhưng vẫn có thể trả về toàn trang
      // trung gian. Thử lại một lượt auto search ngắn gọn trước khi báo lỗi.
      if (mergedCandidates.length === 0) {
        setLoadingStatus("Chưa thấy kết quả phù hợp, đang thử lại với truy vấn đơn giản hơn...");
        const retryBatches = await Promise.allSettled(
          selectedCareers.slice(0, 3).map((career) =>
            withTimeout(
              api.exaSearchAdvanced(
                `các trường đại học đào tạo ngành ${career} tại Việt Nam`,
                10,
                { type: "auto", includeDomains: ["edu.vn", "ac.vn"] },
              ),
              60000,
              "exa-retry",
            ).then((data) => extractUniversityCandidatesFromSearch(data, career, userConstraint)),
          ),
        );
        const retryCandidates = retryBatches.flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        );
        mergedCandidates = mergeUniversityCandidates([...allCandidates, ...retryCandidates]);
        setTargetProgress(66);
      }

      const display = chooseUniversityDisplaySet(
        mergedCandidates,
        userConstraint.trim().length > 0,
      );

      if (mergedCandidates.length > 0) setTargetProgress(58);

      if (mergedCandidates.length === 0) {
        const allGroupsFailed = groupErrors.length === searchGroups.length;
        showToast(
          allGroupsFailed
            ? `Không tìm được trường nào vì dịch vụ đang lỗi: ${groupErrors[0]}`
            : "Không tìm thấy trường đại học nào phù hợp với các ngành đã chọn. Vui lòng thử chọn ngành khác!",
          "error",
        );
        handleSetStep("holland");
        return;
      }

      const preparedUnis = display.universities.map((uni) => ({
        ...uni,
        highlights: uni.highlights.filter((highlight) => Boolean(highlight.trim())).slice(0, 2),
      }));

      if (requestIdRef.current !== myId) return;
      setUniversities(preparedUnis);
      setTargetProgress(74);
      setLoadingStatus("Đang phân tích độ khớp với tiêu chí của bạn...");

      const blockerNotes = mergedCandidates
        .filter((uni) => uni.constraintReason)
        .slice(0, 4)
        .map((uni) => `- ${uni.title}: ${uni.constraintReason}`)
        .join("\n");

      const fallbackMessage =
        display.mode === "confirmed"
          ? `Hệ thống AI đã tìm được ${display.displayedCount} trường khá khớp với các ngành bạn chọn${userConstraint.trim() ? " và có bằng chứng đủ mạnh với tiêu chí riêng" : ""}. Hãy chọn tối đa 5 trường bạn muốn theo đuổi.`
          : display.mode === "unconfirmed"
            ? "Hiện chưa xác nhận được trường nào đáp ứng đầy đủ tiêu chí riêng của bạn. Danh sách dưới đây là các trường đúng ngành nhưng chưa đủ bằng chứng để khẳng định tiêu chí riêng."
            : "Hiện không có trường nào được xác nhận là vừa đào tạo đúng nhóm ngành bạn chọn vừa đáp ứng trọn vẹn tiêu chí riêng. Danh sách dưới đây là các trường gần nhất nhưng đang vướng ở phần tiêu chí.";

      let finalMessage = fallbackMessage;
      try {
        const messagePrompt = `Viết 3-5 câu nhận xét cho người dùng bằng tiếng Việt, xưng "bạn", gọi "hệ thống AI".

Dữ liệu:
- Ngành người dùng chọn: ${selectedCareers.join(", ")}
- Nhóm ngành quy đổi: ${mappedMajors.join(", ")}
- Tiêu chí riêng: ${userConstraint.trim() || "Không có"}
- Số trường hiển thị: ${display.displayedCount}
- Số trường xác nhận đáp ứng: ${display.confirmedCount}
- Số trường chưa đủ bằng chứng cho tiêu chí riêng: ${display.unknownCount}
- Số trường bị vướng tiêu chí riêng: ${display.conflictCount}
- Chế độ hiển thị: ${display.mode}
- Ghi chú vướng mắc:
${blockerNotes || "- Không có"}

Yêu cầu:
1. Nói rõ vì sao kết quả ít hay nhiều, nhất là khi tiêu chí riêng làm hẹp phạm vi.
2. Không được nói quá rằng một trường đáp ứng tiêu chí nếu dữ liệu không xác nhận.
3. Nếu display.mode = unconfirmed hoặc conflict_only, phải nói rõ danh sách bên dưới chỉ là gợi ý gần nhất hoặc chưa đủ bằng chứng.
4. Câu cuối cùng hướng dẫn người dùng chọn tối đa 5 trường nếu danh sách có thể dùng để so sánh tiếp.
5. Không markdown, không gạch đầu dòng.`;

        let messageContent = "";
        await withTimeout(
          api.deepseekProcess(
            messagePrompt,
            "Bạn là hệ thống AI tư vấn hướng nghiệp. Hãy trung thực và không được đoán bừa.",
            false,
            (chunk) => {
              if (requestIdRef.current !== myId) return;
              messageContent += chunk;
              setUniSelectionMessage(messageContent);
            },
          ),
          150000,
          "ai-message",
        );
        finalMessage = cleanText(messageContent).trim() || fallbackMessage;
      } catch (msgErr) {
        console.error("[SEARCH] Message gen failed:", msgErr);
      }

      setUniSelectionMessage(finalMessage);

      saveGuidanceResults({
        selectedCareers,
        universities: preparedUnis,
        selectedUnis: [],
        uniDetails: [],
        userConstraint,
        uniSelectionMessage: finalMessage,
      });

      setTargetProgress(100);
      handleSetStep("select_unis");
    } catch (error) {
      console.error("[SEARCH] Fatal:", error);
      const msg = error?.message || "Lỗi không xác định";
      showToast(`Lỗi tìm kiếm: ${msg}`, "error");
      handleSetStep("holland");
    }
  };
  const searchUniDetails = async () => {
    if (selectedUnis.length === 0) {
      showToast("Vui lòng chọn ít nhất 1 trường đại học!", "info");
      return;
    }

    const myId = ++requestIdRef.current;
    handleSetStep("searching_details");
    setStreamingReports({});
    setTargetProgress(5);
    setLoadingStatus("Đang chuẩn bị tìm kiếm thông tin tuyển sinh...");
    const creepTimer = setInterval(() => {
      if (requestIdRef.current !== myId) return;
      setTargetProgress((prev) => (prev < 20 ? prev + 1 : prev));
    }, 3000);

    try {
      let completedCount = 0;
      const totalCount = selectedUnis.length;

      const processUni = async (uni: any, index: number) => {
        try {
        const detailMajors = mapCareerToMajors(selectedCareers).slice(0, 3).join(", ");
        const queries = [
          `tuyển sinh ${uni.title} điểm chuẩn học phí phương thức xét tuyển tổ hợp môn ngành ${detailMajors} 2025`,
          `${uni.title} điểm chuẩn ngành ${detailMajors} 2024 2023 học phí học bổng chỉ tiêu`,
        ];
        setLoadingStatus(`Đang tìm kiếm thông tin: ${uni.title}...`);
        const searchBatches = await Promise.allSettled(
          queries.map((q) => withTimeout(api.exaSearch(q, 8), 90000, "exa-detail")),
        );
        const searchResults: any[] = [];
        const seenUrls = new Set<string>();
        for (const batch of searchBatches) {
          if (batch.status !== "fulfilled" || !Array.isArray(batch.value)) continue;
          for (const result of batch.value) {
            const key = String(result?.url || "").toLowerCase();
            if (!key || seenUrls.has(key)) continue;
            seenUrls.add(key);
            searchResults.push(result);
          }
        }

        if (searchResults.length === 0) {
          try {
            const retry = await withTimeout(
              api.exaSearch(`tuyển sinh ${uni.title} điểm chuẩn học phí ngành ${detailMajors}`, 8),
              90000,
              "exa-detail-retry",
            );
            if (Array.isArray(retry)) searchResults.push(...retry);
          } catch (retryError) {
            console.warn(`[DETAIL] Retry search failed for ${uni.title}:`, retryError);
          }
        }

        if (searchResults.length > 0) {
          const searchContext = searchResults
            .map(
              (r: any) =>
                `Nguồn: ${r.url || "N/A"}\nNội dung: ${(r.text || r.snippet || "").substring(0, 1500)}`,
            )
            .join("\n---\n");

          const constraintText = userConstraint.trim()
            ? `\n          - ĐẶC BIỆT LƯU Ý: Sinh viên có yêu cầu riêng: "${userConstraint}". Hãy đảm bảo báo cáo làm rõ trường có đáp ứng được các yêu cầu này không (ví dụ khu vực, học phí...).`
            : "";

          const prompt = `Bạn là chuyên gia tư vấn hướng nghiệp. Hãy viết một bản báo cáo tuyển sinh CỰC KỲ CHI TIẾT và ĐẦY ĐỦ cho trường "${uni.title}" về các ngành: ${selectedCareers.join(", ")}.

          YÊU CẦU VỀ NỘI DUNG (BẮT BUỘC ĐẦY ĐỦ):
          - ĐIỂM CHUẨN: nêu điểm chuẩn của NĂM GẦN NHẤT CÓ SỐ LIỆU. Nếu không có năm nay/năm trước, hãy dùng năm trước đó (2023, 2022, 2021...) và ghi rõ năm đó. Nếu có nhiều năm, nêu xu hướng tăng/giảm.
          - PHƯƠNG THỨC XÉT TUYỂN: liệt kê đầy đủ các phương thức trường đang áp dụng (Học bạ, THPT, ĐGNL, xét tuyển thẳng, chứng chỉ...).
          - TỔ HỢP MÔN: nêu mã tổ hợp cụ thể (A00, A01, D01...).
          - HỌC PHÍ: nêu mức học phí một năm và toàn khóa. Nếu nguồn không ghi số tuyệt đối, hãy nêu khoảng ước tính theo mặt bằng chung của trường và ghi rõ "ước tính".
          - CHỈ TIÊU, HỌC BỔNG, CƠ HỘI VIỆC LÀM nếu nguồn có.${constraintText}

          QUY TẮC VIẾT (RẤT QUAN TRỌNG):
          - Ưu tiên số liệu thực tế từ DỮ LIỆU NGUỒN bên dưới. Được phép bổ sung kiến thức chung về trường/ngành, nhưng số liệu cụ thể phải gắn với năm và nguồn tương ứng.
          - Nếu tên ngành ở trên không có chính xác trong danh mục tuyển sinh của trường, hãy chọn NGÀNH GẦN NHẤT cùng nhóm (ví dụ "Kiến trúc sư cảnh quan" → "Kiến trúc"/"Thiết kế đô thị") và ghi rõ tên ngành thực tế đang lấy số liệu. TUYỆT ĐỐI KHÔNG viết "trường không có chương trình này", "không thể gán điểm chuẩn", "không thể xác định".
          - TUYỆT ĐỐI KHÔNG viết "chưa có dữ liệu xác nhận", "chưa xác định", "không có thông tin", "không thể" cho từng mục. Chỉ được dùng tối đa MỘT câu ghi chú ngắn ở cuối báo cáo nếu thực sự không có bất kỳ số liệu nào cho toàn bộ trường.
          - Thay vì nói thiếu dữ liệu, hãy cung cấp thông tin gần nhất hoặc ước tính có căn cứ và ghi rõ năm/mức độ ước tính.
          - Nếu dữ liệu mâu thuẫn giữa các nguồn, chọn số liệu của nguồn chính thức của trường hoặc năm mới nhất.

          YÊU CẦU TRÌNH BÀY (QUAN TRỌNG):
          - TUYỆT ĐỐI KHÔNG thêm các câu chào hỏi, không lặp lại yêu cầu. Bắt đầu ngay vào nội dung báo cáo bằng tiêu đề H2 (##).
          - Sử dụng Markdown chuẩn, in đậm thông tin quan trọng.
          - KHÔNG DÙNG ĐỊNH DẠNG BẢNG (TABLE). Tất cả thông tin phải được trình bày dưới định dạng danh sách (list) hoặc text bình thường để tránh lỗi giao diện.
          - Nếu có công thức hoặc điểm số dạng toán, viết LaTeX trong cặp $...$ (ví dụ $9{,}17$), không dùng \\( \\) và không bọc trong backtick.
          - Trình bày mạch lạc, dễ đọc.

          DỮ LIỆU NGUỒN:
          ${searchContext}`;

          let reportContent = "";
          const summaryRaw = await withTimeout(
            api.deepseekProcess(
              prompt,
              "Bạn là chuyên gia tư vấn tuyển sinh. Hãy viết báo cáo Markdown chuyên nghiệp. TUYỆT ĐỐI KHÔNG CÓ CÂU MÀO ĐẦU, VÀO THẲNG NỘI DUNG.",
              false,
              (chunk) => {
                if (requestIdRef.current !== myId) return;
                reportContent += chunk;
                setStreamingReports((prev) => ({
                  ...prev,
                  [uni.title]: reportContent,
                }));
                const reportLen = reportContent.length;
                const basePct = 20 + Math.floor((completedCount / totalCount) * 60);
                const reportPct = Math.min(Math.floor(reportLen / 400), 10);
                setTargetProgress((prev) => Math.max(prev, Math.min(basePct + reportPct, 85)));
              },
            ),
            240000,
            "ai-report",
          );
          const summary = cleanText(summaryRaw);

          const extractPrompt = `Dựa trên báo cáo và dữ liệu nguồn sau, hãy trích xuất:
          1. Điểm chuẩn cao nhất của các ngành quan tâm: lấy số liệu của NĂM GẦN NHẤT có trong dữ liệu (2025, 2024, 2023 hoặc sớm hơn). Chỉ trả 0 khi thực sự không có bất kỳ mốc điểm chuẩn nào.
          2. Phương thức xét tuyển chính (chọn 1 trong: "THPT", "Học bạ", "ĐGNL").
          3. Tổ hợp môn chính (Ví dụ: "A00, A01").
          4. Năm của mốc điểm chuẩn vừa lấy (số nguyên, 0 nếu không rõ).

          Trả về JSON: {"targetScore": number, "method": string, "subjects": string, "scoreYear": number}
          Không thêm giải thích ngoài JSON.

          Báo cáo:
          ${summary}

          DỮ LIỆU NGUỒN (trích):
          ${(searchContext || "").slice(0, 6000)}`;

          const structuredDataRaw = await withTimeout(
            api.deepseekProcess(extractPrompt, "Chỉ trả về JSON hợp lệ.", true),
            150000,
            "ai-extract",
          );
          let structuredData: { targetScore: number; method: string; subjects: string | string[] } = {
            targetScore: 0,
            method: "THPT",
            subjects: "",
          };
          try {
            const parsed = extractJson(structuredDataRaw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              const rawScore = (parsed as Record<string, unknown>).targetScore;
              const numericScore =
                typeof rawScore === "number"
                  ? rawScore
                  : typeof rawScore === "string"
                    ? Number(rawScore.replace(",", ".").replace(/[^\d.]/g, ""))
                    : NaN;
              structuredData = {
                targetScore:
                  Number.isFinite(numericScore) && numericScore > 0 && numericScore <= 100
                    ? Number(numericScore.toFixed(2))
                    : 0,
                method: typeof parsed.method === "string" ? parsed.method : "THPT",
                subjects:
                  typeof parsed.subjects === "string" || Array.isArray(parsed.subjects)
                    ? parsed.subjects
                    : "",
              };
            }
          } catch (e) {
            console.error("Failed to parse structured data for", uni.title, e);
          }

          const subjectsArr =
            typeof structuredData.subjects === "string"
              ? structuredData.subjects
                  .split(/[,/]/)
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              : Array.isArray(structuredData.subjects)
                ? structuredData.subjects
                : [];

          return {
            uni,
            summary: summary || "Đang cập nhật thông tin chi tiết.",
            targetScore: structuredData.targetScore,
            method: structuredData.method,
            targetSubjects: subjectsArr,
          };
        }
        return buildFallbackDetail(uni);
        } catch (error) {
          console.error(`Lỗi khi xử lý trường ${uni.title}:`, error);
          return buildFallbackDetail(uni);
        }
      };

      const wrappedProcess = async (uni: any, index: number) => {
        try {
          return await processUni(uni, index);
        } catch (err) {
          console.error(`[DETAIL] Unexpected error for ${uni.title}:`, err);
          return null;
        } finally {
          completedCount++;
          const pct = 20 + Math.floor((completedCount / totalCount) * 70);
          setTargetProgress((prev) => Math.max(prev, pct));
          if (completedCount < totalCount) {
            setLoadingStatus(`Đã hoàn tất ${completedCount}/${totalCount} trường. Đang tiếp tục...`);
          } else {
            setLoadingStatus("Đang hoàn thiện kết quả...");
          }
        }
      };

      const settledResults = await Promise.allSettled(
        selectedUnis.map((uni, idx) => wrappedProcess(uni, idx)),
      );
      const details = settledResults
        .filter((r) => r.status === "fulfilled" && r.value !== null)
        .map((r) => (r as PromiseFulfilledResult<any>).value);

      if (details.length === 0) {
        showToast("Không thể lấy thông tin chi tiết. Vui lòng thử lại!", "error");
        handleSetStep("select_unis");
        return;
      }

      if (details.length < selectedUnis.length) {
        showToast(`Chỉ lấy được thông tin ${details.length}/${selectedUnis.length} trường.`, "info");
      }

      if (requestIdRef.current !== myId) return;
      setTargetProgress(96);
      setLoadingStatus("Sắp xong rồi...");
      setUniDetails(details);
      setTargetProgress(100);

      saveGuidanceResults({
        selectedCareers,
        universities,
        selectedUnis,
        uniDetails: details,
        userConstraint,
        uniSelectionMessage,
      });

      handleSetStep("show_details");
    } catch (error: any) {
      console.error("Detail search error:", error);
      const msg = error?.message || "Không xác định";
      showToast(`Lỗi tìm kiếm thông tin: ${msg}`, "error");
      handleSetStep("select_unis");
    } finally {
      clearInterval(creepTimer);
    }
  };

  const finishGuidance = () => {
    const aspirations = uniDetails.map((d) => ({
      name: d.uni.title || d.uni.url,
      url: d.uni.url,
      careers: selectedCareers,
      targetScore: d.targetScore,
      method: d.method,
      targetSubjects: d.targetSubjects,
    }));
    writeJson("smarm_aspirations", aspirations);

    if (!localStorage.getItem("smarm_attitude_mode")) {
      localStorage.setItem("smarm_attitude_mode", "friend");
    }

    api.syncUserData().catch((e) => {
      console.error("Failed to sync data to server:", e);
    });

    clearGuidanceResults();
    showToast("Đã lưu kết quả tư vấn! Chuyển sang trang học tập.", "success");

    if (onComplete) {
      onComplete();
    }
  };

  const handleReset = () => {
    clearGuidanceResults();
    localStorage.removeItem("smarm_aspirations");
    localStorage.removeItem(GUIDANCE_CAREERS_KEY);
    setSelectedCareers([]);
    setUniversities([]);
    setSelectedUnis([]);
    setUniDetails([]);
    setUserConstraint("");
    setUniSelectionMessage("");
    setStep("holland");
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto pb-32">
      <AnimatePresence mode="wait">
        {step === "holland" && (
          <motion.div
            key="holland"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="brutal-card bg-[var(--color-background)] mb-12"
          >
            <div className="bg-orange-pop p-6 md:p-16 text-center border-b-[4px] border-black relative overflow-hidden flex flex-col items-center">
              <div className="w-20 h-20 bg-white border-[4px] border-black flex items-center justify-center mb-6 shadow-[6px_6px_0_#000]">
                <Sparkles className="w-10 h-10 text-black stroke-[3px]" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-black mb-4 uppercase tracking-tight">
                Kết quả Holland của bạn
              </h1>
              <p className="text-black font-black text-xl uppercase tracking-widest bg-white px-4 py-1 border-[3px] border-black shadow-[4px_4px_0_#000] inline-block mb-8">
                Mã đặc trưng nghề nghiệp
              </p>

              <div className="inline-block bg-red-pop px-10 py-6 border-[4px] border-black shadow-[8px_8px_0_#000] relative z-10">
                <span className="text-6xl md:text-8xl font-black text-black tracking-[0.2em] uppercase">
                  {results.hollandCode}
                </span>
              </div>
            </div>

            <div className="p-6 md:p-10">
              <h2 className="text-3xl font-black text-black mb-8 flex items-center uppercase tracking-tight">
                <div className="w-12 h-12 bg-red-pop border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000]">
                  <Award className="w-6 h-6 text-black stroke-[3px]" />
                </div>
                Đặc điểm nổi trội
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {results.top3.map((item, index) => (
                  <div
                    key={item.category}
                    className={`bg-white p-6 border-[4px] border-black shadow-[6px_6px_0_#000] relative`}
                  >
                    <div className="absolute -top-4 -right-4 w-10 h-10 bg-orange-pop border-[3px] border-black flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#000] z-10">
                      {index + 1}
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <div className={`w-14 h-14 border-[3px] border-black flex items-center justify-center text-2xl font-black text-black shadow-[4px_4px_0_#000] ${
                        index === 0 ? "bg-orange-pop" : index === 1 ? "bg-red-pop" : "bg-yellow-pop"
                      }`}>
                        {item.category}
                      </div>
                      <span className="text-sm font-black text-black bg-white px-3 py-1 border-[3px] border-black shadow-[2px_2px_0_#000]">
                        {item.score}/40 điểm
                      </span>
                    </div>
                    <h3 className="font-black text-xl text-black mb-4 pb-2 border-b-[3px] border-black uppercase tracking-tight leading-tight">
                      {categoryNames[item.category]}
                    </h3>
                    <p className="text-black font-bold text-sm leading-relaxed">
                      {traitDescriptions[item.category]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-10 border-t-[4px] border-black">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <h2 className="text-3xl font-black text-black flex items-center uppercase tracking-tight">
                    <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000]">
                      <Briefcase className="w-6 h-6 text-black stroke-[3px]" />
                    </div>
                    Nhóm ngành gợi ý
                  </h2>
                  <div className="text-lg font-black text-black bg-orange-pop px-4 py-2 border-[3px] border-black shadow-[4px_4px_0_#000] uppercase inline-block">
                    Đã chọn: {selectedCareers.length}/5
                  </div>
                </div>
                <p className="text-black font-bold text-base mb-8 bg-white p-5 border-[4px] border-black shadow-[6px_6px_0_#000] leading-relaxed">
                  Dựa trên mã Holland{" "}
                  <span className="bg-orange-pop px-2 py-1 border-[2px] border-black uppercase mx-1">
                    {results.hollandCode}
                  </span>
                  , dưới đây là các ngành nghề bạn có thể phát huy tốt nhất
                  thế mạnh của mình. <span className="bg-black text-white px-2 py-1 uppercase mx-1">Hãy chọn tối đa 5 ngành</span>{" "}
                  mà bạn quan tâm nhất.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
                  {results.recommendedCareers.map((career, index) => {
                    const isSelected = selectedCareers.includes(career);
                    return (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => toggleCareer(career)}
                        className={`p-4 border-[3px] border-black text-center transition-all flex items-center justify-center relative shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none min-h-[80px] ${
                          isSelected
                            ? "bg-black text-white"
                            : "bg-white text-black hover:bg-orange-pop"
                        }`}
                      >
                        <span className="font-black text-sm uppercase">{career}</span>
                        {isSelected && (
                          <div className="absolute -top-3 -right-3 bg-red-pop text-black border-[3px] border-black w-8 h-8 flex items-center justify-center shadow-[2px_2px_0_#000]">
                            <Check className="w-5 h-5 stroke-[4px]" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="mb-10 p-6 bg-white border-[4px] border-black shadow-[6px_6px_0_#000]">
                  <label
                    htmlFor="userConstraint"
                    className="block text-lg font-black text-black mb-4 uppercase tracking-tight border-l-[4px] border-orange-pop pl-3"
                  >
                    Tiêu chí riêng (Tùy chọn)
                  </label>
                  <textarea
                    id="userConstraint"
                    value={userConstraint}
                    onChange={(e) => setUserConstraint(e.target.value)}
                    placeholder="VD: Chỉ tìm trường ở khu vực TPHCM, học phí dưới 30 triệu/năm..."
                    className="w-full text-black font-bold text-base px-5 py-4 border-[4px] border-black focus:outline-none bg-[var(--color-background)] focus:bg-white resize-none transition-colors shadow-[inset_0_4px_0_rgba(0,0,0,0.1)] placeholder:text-black/40"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={searchUniversities}
                    disabled={selectedCareers.length === 0}
                    className="flex items-center justify-center px-10 py-5 font-black text-black text-xl uppercase bg-red-pop border-[4px] border-black shadow-[8px_8px_0_#000] active:translate-x-[8px] active:translate-y-[8px] active:shadow-none hover:bg-orange-pop transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[8px_8px_0_#000] w-full md:w-auto"
                  >
                    <Search className="w-6 h-6 mr-3 stroke-[3px]" />
                    Tìm trường ngay!
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {(step === "searching_unis" || step === "searching_details") && (
          <motion.div
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white border-[4px] border-black shadow-[8px_8px_0_#000] p-16 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative mb-8">
                <Loader2 className="w-20 h-20 text-black animate-spin" />
              </div>

              <h2 className="text-3xl font-black text-black mb-6 uppercase tracking-tight">
                {step === "searching_unis"
                  ? "Đang tìm trường..."
                  : "Đang tổng hợp dữ liệu..."}
              </h2>

              <div className="w-full max-w-md bg-white border-[4px] border-black h-8 mb-4 relative overflow-hidden shadow-[inset_0_2px_0_rgba(0,0,0,0.1)]">
                <div
                  className="h-full bg-orange-pop border-r-[4px] border-black"
                  style={{
                    width: `${displayProgress}%`,
                    transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              </div>
              <div className="text-black font-black mb-8 text-2xl tabular-nums bg-red-pop px-4 py-1 border-[3px] border-black inline-block shadow-[4px_4px_0_#000]">
                {displayProgress}%
              </div>

              <p className="text-black font-bold max-w-md mx-auto uppercase bg-white px-4 py-2 border-[3px] border-black shadow-[4px_4px_0_#000]">
                {loadingStatus || "Đang xử lý..."}
              </p>
            </div>

            <AnimatePresence>
              {step === "searching_details" && Object.keys(streamingReports).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 space-y-6"
                >
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 bg-orange-pop px-6 py-3 border-[4px] border-black shadow-[4px_4px_0_#000]">
                      <div className="w-4 h-4 bg-black animate-pulse" />
                      <span className="text-sm font-black text-black uppercase tracking-widest">
                        Báo cáo đang được tạo realtime
                      </span>
                    </div>
                  </div>
                  {Object.entries(streamingReports).map(([title, content]) => (
                    <motion.div
                      key={title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border-[4px] border-black shadow-[6px_6px_0_#000] p-8 text-left"
                    >
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b-[4px] border-black">
                        <div className="w-4 h-4 bg-red-pop border-[2px] border-black animate-pulse flex-shrink-0" />
                        <h3 className="font-black text-2xl text-black uppercase tracking-tight">{title}</h3>
                      </div>
                        <div className="markdown-body neubrutalism-markdown text-black font-bold text-base max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                          <AiMarkdown content={content} />
                        </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {step === "select_unis" && (
          <motion.div
            key="select_unis"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="brutal-card bg-[var(--color-background)] mb-12"
          >
            <div className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h2 className="text-3xl font-black text-black flex items-center uppercase tracking-tight">
                  <div className="w-12 h-12 bg-red-pop border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000]">
                    <Building2 className="w-6 h-6 text-black stroke-[3px]" />
                  </div>
                  Các trường phù hợp
                </h2>
                <div className="text-lg font-black text-black bg-orange-pop px-4 py-2 border-[3px] border-black shadow-[4px_4px_0_#000] uppercase inline-block">
                  Đã chọn: {selectedUnis.length}/5
                </div>
              </div>
              <p className="text-black font-bold text-base mb-10 bg-white p-5 border-[4px] border-black shadow-[6px_6px_0_#000] leading-relaxed whitespace-pre-line">
                {uniSelectionMessage ||
                  (universities.length < 5
                    ? `Dựa trên các tiêu chí và yêu cầu của bạn, hệ thống AI chỉ tìm được ${universities.length} trường phù hợp nhất. ` +
                      (universities.length > 1
                        ? "Hãy chọn các trường bạn muốn."
                        : "Hãy chọn trường này.")
                    : `Dựa trên các ngành nghề bạn đã chọn, hệ thống AI tìm được các trường đại học sau. Hãy chọn tối đa 5 trường.`)}
              </p>

              <div className="space-y-6 mb-12">
                {universities.map((uni, index) => {
                  const isSelected = selectedUnis.some(
                    (u) => u.url === uni.url,
                  );
                  const description =
                    typeof uni.description === "string" && uni.description.trim()
                      ? uni.description.trim()
                      : uni.matchedMajors?.length > 0
                        ? `Trường đại học có đào tạo ${uni.matchedMajors.slice(0, 2).join(", ")}.`
                        : "Trường đại học tại Việt Nam; thông tin chi tiết sẽ được tổng hợp ở bước tiếp theo.";
                  return (
                    <div
                      key={index}
                      onClick={() => toggleUni(uni)}
                      className={`p-6 border-[4px] border-black cursor-pointer transition-all flex items-start shadow-[6px_6px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none ${
                        isSelected
                          ? "bg-orange-pop"
                          : "bg-white hover:bg-orange-pop/10"
                      }`}
                    >
                      <div
                        className={`mt-1 w-8 h-8 border-[3px] border-black flex items-center justify-center mr-5 flex-shrink-0 bg-white shadow-[2px_2px_0_#000]`}
                      >
                        {isSelected && <Check className="w-6 h-6 stroke-[4px] text-black" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-lg md:text-xl text-black mb-2 uppercase tracking-tight">
                          {uni.title || "Trang web trường đại học"}
                        </h3>
                        <p className="text-sm font-bold text-black/80 leading-relaxed mb-3">
                          {description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {uni.matchedMajors?.length > 0 && (
                            <span className="text-[11px] font-black uppercase bg-yellow-200 px-2 py-1 border-[2px] border-black shadow-[2px_2px_0_#000]">
                              Ngành liên quan: {uni.matchedMajors.slice(0, 2).join(", ")}
                            </span>
                          )}
                          {uni.constraintStatus === "meets" && (
                            <span className="text-[11px] font-black uppercase bg-green-pop px-2 py-1 border-[2px] border-black shadow-[2px_2px_0_#000]">
                              Đã khớp tiêu chí riêng
                            </span>
                          )}
                          {uni.constraintStatus === "unknown" && (
                            <span className="text-[11px] font-black uppercase bg-cyan-pop px-2 py-1 border-[2px] border-black shadow-[2px_2px_0_#000]">
                              Chưa đủ bằng chứng cho tiêu chí riêng
                            </span>
                          )}
                          {uni.constraintStatus === "conflicts" && (
                            <span className="text-[11px] font-black uppercase bg-red-pop px-2 py-1 border-[2px] border-black shadow-[2px_2px_0_#000]">
                              Vướng tiêu chí riêng
                            </span>
                          )}
                        </div>
                        <a
                          href={uni.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-sm font-bold text-black/80 hover:text-black flex items-center mb-3 bg-white px-3 py-1 border-[2px] border-black inline-flex shadow-[2px_2px_0_#000]"
                        >
                          {uni.url} <ExternalLink className="w-4 h-4 ml-2 stroke-[3px]" />
                        </a>
                        {uni.highlights && uni.highlights.length > 0 && (
                          <p
                            className="text-sm font-bold text-black/90 border-l-[4px] border-black pl-4 bg-white/50 py-2 overflow-hidden"
                            style={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                            }}
                          >
                            "...{formatHighlight(uni.highlights[0])}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col md:flex-row justify-between gap-4">
                <button
                  onClick={() => handleSetStep("holland")}
                  className="brutal-btn bg-white"
                >
                  Quay lại
                </button>
                <button
                  onClick={searchUniDetails}
                  disabled={selectedUnis.length === 0}
                  className="flex items-center justify-center px-8 py-4 font-black text-black text-xl uppercase bg-red-pop border-[4px] border-black shadow-[6px_6px_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none hover:bg-orange-pop transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-x-0 disabled:active:translate-y-0 disabled:active:shadow-[6px_6px_0_#000]"
                >
                  Xem tuyển sinh
                  <ChevronRight className="w-6 h-6 ml-3 stroke-[4px]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "show_details" && (
          <motion.div
            key="show_details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="brutal-card bg-[var(--color-background)] mb-12"
          >
            <div className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h2 className="text-3xl font-black text-black flex items-center uppercase tracking-tight">
                  <div className="w-12 h-12 bg-white border-[3px] border-black flex items-center justify-center mr-4 shadow-[4px_4px_0_#000]">
                    <GraduationCap className="w-6 h-6 text-black stroke-[3px]" />
                  </div>
                  Thông tin tuyển sinh
                </h2>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 font-black text-black uppercase bg-white border-[3px] border-black shadow-[4px_4px_0_#000] hover:bg-orange-pop transition-colors active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  <RotateCcw className="w-5 h-5 stroke-[3px]" />
                  Làm lại từ đầu
                </button>
              </div>
              <p className="text-black font-bold text-base mb-10 bg-orange-pop p-5 border-[4px] border-black shadow-[6px_6px_0_#000] uppercase tracking-wide">
                Dưới đây là thông tin tổng hợp về điểm chuẩn, phương thức xét tuyển và học phí của các trường bạn đã chọn.
              </p>

              <div className="space-y-10 mb-12">
                {uniDetails.map((detail, index) => (
                  <div
                    key={index}
                    className="bg-white p-8 border-[4px] border-black shadow-[8px_8px_0_#000]"
                  >
                    <div className="flex items-start gap-4 mb-6 pb-4 border-b-[4px] border-black">
                      <div className="w-12 h-12 bg-red-pop border-[3px] border-black flex items-center justify-center font-black text-xl shadow-[4px_4px_0_#000] flex-shrink-0">
                        {index + 1}
                      </div>
                      <h3 className="font-black text-2xl text-black uppercase tracking-tight mt-1">
                        {detail.uni.title || detail.uni.url}
                      </h3>
                    </div>

                    <UniversityPhotoGrid
                      url={detail.uni.url}
                      title={detail.uni.title || detail.uni.url}
                    />

                    <div className="space-y-4">
                      {detail.summary ? (
                        <div className="bg-[var(--color-background)] p-8 border-[4px] border-black shadow-[inset_0_4px_0_rgba(0,0,0,0.1)]">
                          <div className="text-base text-black font-bold markdown-body neubrutalism-markdown max-w-none">
                            <AiMarkdown content={cleanText(detail.summary)} />
                          </div>
                          <div className="mt-8 pt-6 border-t-[4px] border-black">
                            <a
                              href={detail.uni.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-black text-black bg-white px-4 py-2 border-[3px] border-black inline-flex items-center shadow-[4px_4px_0_#000] hover:bg-orange-pop active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                            >
                              Nguồn: {detail.uni.url}{" "}
                              <ExternalLink className="w-4 h-4 ml-2 stroke-[3px]" />
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-black font-black uppercase bg-[var(--color-background)] border-[4px] border-black border-dashed">
                          Không có thông tin chi tiết.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col lg:flex-row justify-between items-center bg-red-pop p-8 border-[4px] border-black shadow-[8px_8px_0_#000] gap-6">
                <button
                  onClick={() => handleSetStep("select_unis")}
                  className="brutal-btn bg-white w-full lg:w-auto"
                >
                  Quay lại
                </button>
                <div className="flex-1 text-center lg:text-left lg:ml-6">
                  <h4 className="font-black text-3xl text-black mb-2 uppercase tracking-tight">Đã sẵn sàng?</h4>
                  <p className="text-lg font-bold text-black uppercase bg-white inline-block px-3 py-1 border-[2px] border-black">
                    Bắt đầu theo dõi điểm số và lên kế hoạch học tập ngay hôm nay.
                  </p>
                </div>
                <button
                  onClick={finishGuidance}
                  className="flex items-center justify-center px-10 py-5 font-black text-black text-xl uppercase bg-orange-pop border-[4px] border-black shadow-[6px_6px_0_#000] active:translate-x-[6px] active:translate-y-[6px] active:shadow-none hover:bg-white transition-all whitespace-nowrap w-full lg:w-auto"
                >
                  Bắt đầu hành trình
                  <ArrowRight className="w-6 h-6 ml-3 stroke-[4px]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




