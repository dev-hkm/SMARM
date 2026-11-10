export type ConstraintStatus = "not_applicable" | "meets" | "unknown" | "conflicts";

export type UniversityCandidate = {
  title: string;
  url: string;
  highlights: string[];
  matchedMajors: string[];
  constraintStatus: ConstraintStatus;
  constraintReason: string;
  /** Where the record came from — structured output beats scraped page titles. */
  source?: "structured" | "result";
};

type SearchResultLike = {
  title?: unknown;
  url?: unknown;
  text?: unknown;
  snippet?: unknown;
  summary?: unknown;
  highlights?: unknown;
};

export type UniversitySearchData = {
  results?: SearchResultLike[];
  output?: { content?: unknown } | null;
  provider?: string;
  searchType?: string;
};

type StructuredUniversity = {
  title?: unknown;
  url?: unknown;
  evidence?: unknown;
  constraintStatus?: unknown;
  constraintReason?: unknown;
};

type DirectoryEntry = {
  name: string;
  domains: string[];
  aliases?: string[];
};

// Official name ↔ domain directory. This is the authority for naming: when a
// search result points at a known school domain we always use its official name,
// even if the scraped page title belongs to a news article.
const UNIVERSITY_DIRECTORY: DirectoryEntry[] = [
  { name: "Đại học Bách khoa Hà Nội", domains: ["hust.edu.vn"], aliases: ["bach khoa ha noi", "hust"] },
  { name: "Trường Đại học Bách khoa TP.HCM", domains: ["hcmut.edu.vn", "hcmut.edu.vn"], aliases: ["bach khoa tphcm", "bach khoa tp hcm", "hcmut"] },
  { name: "Trường Đại học Bách khoa - Đại học Đà Nẵng", domains: ["dut.udn.vn"], aliases: ["bach khoa da nang", "bach khoa - dai hoc da nang"] },
  { name: "Trường Đại học Công nghệ - ĐHQGHN", domains: ["uet.vnu.edu.vn"], aliases: ["dai hoc cong nghe - dhqghn", "dai hoc cong nghe dhqghn"] },
  { name: "Trường Đại học Công nghệ Thông tin - ĐHQG-HCM", domains: ["uit.edu.vn"], aliases: ["cong nghe thong tin - dhqg-hcm", "uit"] },
  { name: "Trường Đại học Khoa học Tự nhiên - ĐHQG-HCM", domains: ["hcmus.edu.vn"], aliases: ["khoa hoc tu nhien - dhqg-hcm"] },
  { name: "Trường Đại học Quốc tế - ĐHQG-HCM", domains: ["hcmiu.edu.vn"], aliases: ["dai hoc quoc te - dhqg-hcm"] },
  { name: "Trường Đại học Kinh tế - Luật - ĐHQG-HCM", domains: ["uel.edu.vn"], aliases: ["kinh te - luat - dhqg-hcm"] },
  { name: "Trường Đại học Khoa học Xã hội và Nhân văn - ĐHQGHN", domains: ["ussh.vnu.edu.vn"], aliases: ["khoa hoc xa hoi va nhan van - dhqghn"] },
  { name: "Trường Đại học Y Dược - Đại học Quốc gia Hà Nội", domains: ["ump.vnu.edu.vn"], aliases: ["y duoc - dai hoc quoc gia ha noi"] },
  { name: "Đại học Quốc gia Hà Nội", domains: ["vnu.edu.vn"] },
  { name: "Đại học Quốc gia TP.HCM", domains: ["vnuhcm.edu.vn"] },
  { name: "Trường Đại học Kinh tế Quốc dân", domains: ["neu.edu.vn"], aliases: ["kinh te quoc dan", "neu"] },
  { name: "Trường Đại học Ngoại thương", domains: ["ftu.edu.vn"], aliases: ["ngoai thuong", "ftu"] },
  { name: "Học viện Ngân hàng", domains: ["ba.edu.vn"], aliases: ["hoc vien ngan hang"] },
  { name: "Học viện Tài chính", domains: ["aof.edu.vn"], aliases: ["hoc vien tai chinh"] },
  { name: "Học viện Ngoại giao", domains: ["dav.edu.vn"], aliases: ["hoc vien ngoai giao"] },
  { name: "Học viện Báo chí và Tuyên truyền", domains: ["ajc.edu.vn"], aliases: ["bao chi va tuyen truyen"] },
  { name: "Học viện Nông nghiệp Việt Nam", domains: ["vnua.edu.vn", "hvn.edu.vn"], aliases: ["hoc vien nong nghiep viet nam"] },
  { name: "Học viện Kỹ thuật Quân sự", domains: ["mta.edu.vn"], aliases: ["ky thuat quan su"] },
  { name: "Học viện Công nghệ Bưu chính Viễn thông", domains: ["ptit.edu.vn"], aliases: ["buu chinh vien thong", "ptit"] },
  { name: "Học viện Kỹ thuật Mật mã", domains: ["actvn.edu.vn"], aliases: ["ky thuat mat ma"] },
  { name: "Trường Đại học Công nghệ TP.HCM", domains: ["hutech.edu.vn"], aliases: ["cong nghe tphcm", "cong nghe tp hcm", "hutech"] },
  { name: "Trường Đại học Sư phạm Kỹ thuật TP.HCM", domains: ["hcmute.edu.vn"], aliases: ["su pham ky thuat tphcm", "su pham ky thuat tp hcm", "hcmute"] },
  { name: "Trường Đại học Sư phạm Kỹ thuật Hưng Yên", domains: ["utehy.edu.vn"], aliases: ["su pham ky thuat hung yen"] },
  { name: "Trường Đại học Sư phạm Kỹ thuật Vĩnh Long", domains: ["vlute.edu.vn"], aliases: ["su pham ky thuat vinh long"] },
  { name: "Trường Đại học Sư phạm Hà Nội", domains: ["hnue.edu.vn"], aliases: ["su pham ha noi"] },
  { name: "Trường Đại học Sư phạm TP.HCM", domains: ["hcmue.edu.vn"], aliases: ["su pham tphcm", "su pham tp hcm"] },
  { name: "Trường Đại học Sư phạm Hà Nội 2", domains: ["hpu2.edu.vn"], aliases: ["su pham ha noi 2"] },
  { name: "Trường Đại học Giáo dục - ĐHQGHN", domains: ["education.vnu.edu.vn"], aliases: ["dai hoc giao duc - dhqghn"] },
  { name: "Trường Đại học Xây dựng Hà Nội", domains: ["huce.edu.vn"], aliases: ["xay dung ha noi", "huce"] },
  { name: "Trường Đại học Kiến trúc Hà Nội", domains: ["hau.edu.vn"], aliases: ["kien truc ha noi"] },
  { name: "Trường Đại học Kiến trúc TP.HCM", domains: ["uah.edu.vn"], aliases: ["kien truc tphcm", "kien truc tp hcm"] },
  { name: "Trường Đại học Kiến trúc Đà Nẵng", domains: ["dau.edu.vn"], aliases: ["kien truc da nang"] },
  { name: "Trường Đại học Giao thông Vận tải", domains: ["utc.edu.vn"], aliases: ["giao thong van tai", "giao thong vận tải"] },
  { name: "Trường Đại học Giao thông Vận tải TP.HCM", domains: ["ut.edu.vn"], aliases: ["giao thong van tai tphcm", "giao thong van tai tp hcm"] },
  { name: "Trường Đại học Thủy lợi", domains: ["tlu.edu.vn"], aliases: ["thuy loi"] },
  { name: "Trường Đại học Hàng hải Việt Nam", domains: ["vimaru.edu.vn"], aliases: ["hang hai viet nam", "vimaru"] },
  { name: "Trường Đại học Mỏ - Địa chất", domains: ["humg.edu.vn"], aliases: ["mo - dia chat", "mo dia chat"] },
  { name: "Trường Đại học Điện lực", domains: ["epu.edu.vn"], aliases: ["dai hoc dien luc"] },
  { name: "Trường Đại học Công nghiệp Hà Nội", domains: ["haui.edu.vn"], aliases: ["cong nghiep ha noi"] },
  { name: "Trường Đại học Công nghiệp TP.HCM", domains: ["iuh.edu.vn"], aliases: ["cong nghiep tphcm", "cong nghiep tp hcm"] },
  { name: "Trường Đại học Công nghiệp Quảng Ninh", domains: ["qui.edu.vn"], aliases: ["cong nghiep quang ninh"] },
  { name: "Trường Đại học Công nghiệp Việt - Hung", domains: ["viu.edu.vn"], aliases: ["cong nghiep viet - hung"] },
  { name: "Trường Đại học Kinh tế - Kỹ thuật Công nghiệp", domains: ["uneti.edu.vn"], aliases: ["kinh te - ky thuat cong nghiep"] },
  { name: "Trường Đại học Kỹ thuật Công nghiệp Thái Nguyên", domains: ["tnut.edu.vn"], aliases: ["ky thuat cong nghiep thai nguyen", "tnut"] },
  { name: "Trường Đại học Công nghiệp Thực phẩm TP.HCM", domains: ["hufi.edu.vn"], aliases: ["cong nghiep thuc pham tphcm"] },
  { name: "Trường Đại học Kỹ thuật Y tế Hải Dương", domains: ["hmtu.edu.vn"], aliases: ["ky thuat y te hai duong"] },
  { name: "Trường Đại học Y tế Công cộng", domains: ["huph.edu.vn"], aliases: ["y te cong cong"] },
  { name: "Trường Đại học Y Hà Nội", domains: ["hmu.edu.vn"], aliases: ["y ha noi"] },
  { name: "Trường Đại học Y Dược TP.HCM", domains: ["ump.edu.vn"], aliases: ["y duoc tphcm", "y duoc tp hcm"] },
  { name: "Trường Đại học Y khoa Phạm Ngọc Thạch", domains: ["pnt.edu.vn"], aliases: ["y khoa pham ngoc thach"] },
  { name: "Trường Đại học Y Dược Cần Thơ", domains: ["ctump.edu.vn"], aliases: ["y duoc can tho"] },
  { name: "Trường Đại học Y Dược Hải Phòng", domains: ["hpmu.edu.vn"], aliases: ["y duoc hai phong"] },
  { name: "Trường Đại học Y Dược Thái Bình", domains: ["tbump.edu.vn"], aliases: ["y duoc thai binh"] },
  { name: "Trường Đại học Y Dược Thái Nguyên", domains: ["tump.edu.vn"], aliases: ["y duoc thai nguyen"] },
  { name: "Trường Đại học Kinh tế TP.HCM", domains: ["ueh.edu.vn"], aliases: ["kinh te tphcm", "kinh te tp hcm", "ueh"] },
  { name: "Trường Đại học Tài chính - Marketing", domains: ["ufm.edu.vn"], aliases: ["tai chinh - marketing"] },
  { name: "Trường Đại học Ngân hàng TP.HCM", domains: ["hub.edu.vn"], aliases: ["ngan hang tphcm"] },
  { name: "Trường Đại học Luật Hà Nội", domains: ["hlu.edu.vn"], aliases: ["luat ha noi"] },
  { name: "Trường Đại học Luật TP.HCM", domains: ["hcmulaw.edu.vn"], aliases: ["luat tphcm", "luat tp hcm"] },
  { name: "Trường Đại học Kinh tế - Tài chính TP.HCM", domains: ["uef.edu.vn"], aliases: ["kinh te - tai chinh tphcm"] },
  { name: "Trường Đại học Tôn Đức Thắng", domains: ["tdtu.edu.vn"], aliases: ["ton duc thang"] },
  { name: "Trường Đại học Văn Lang", domains: ["vlu.edu.vn", "vanlanguni.edu.vn"], aliases: ["van lang"] },
  { name: "Trường Đại học Hoa Sen", domains: ["hoasen.edu.vn"], aliases: ["hoa sen"] },
  { name: "Trường Đại học Ngoại ngữ - Tin học TP.HCM", domains: ["huflit.edu.vn"], aliases: ["ngoai ngu - tin hoc tphcm"] },
  { name: "Trường Đại học Mở TP.HCM", domains: ["ou.edu.vn"], aliases: ["mo tphcm", "mo tp hcm"] },
  { name: "Trường Đại học Mở Hà Nội", domains: ["hou.edu.vn"], aliases: ["mo ha noi"] },
  { name: "Trường Đại học Hà Nội", domains: ["hanu.edu.vn"], aliases: ["dai hoc ha noi"] },
  { name: "Trường Đại học Sài Gòn", domains: ["sgu.edu.vn"], aliases: ["sai gon"] },
  { name: "Trường Đại học Nguyễn Tất Thành", domains: ["ntt.edu.vn"], aliases: ["nguyen tat thanh"] },
  { name: "Trường Đại học Đại Nam", domains: ["dainam.edu.vn"], aliases: ["dai nam"] },
  { name: "Trường Đại học Thành Đô", domains: ["thanhdo.edu.vn"], aliases: ["thanh do"] },
  { name: "Trường Đại học Hòa Bình", domains: ["daihochoabinh.edu.vn"], aliases: ["hoa binh"] },
  { name: "Trường Đại học Thăng Long", domains: ["thanglong.edu.vn"], aliases: ["thang long"] },
  { name: "Trường Đại học Phenikaa", domains: ["phenikaa-uni.edu.vn"], aliases: ["phenikaa"] },
  { name: "Trường Đại học VinUni", domains: ["vinuni.edu.vn"], aliases: ["vinuni"] },
  { name: "Trường Đại học FPT", domains: ["fpt.edu.vn", "daihoc.fpt.edu.vn"], aliases: ["dai hoc fpt"] },
  { name: "Trường Đại học CMC", domains: ["cmcu.edu.vn"], aliases: ["cmc"] },
  { name: "Trường Đại học Anh Quốc Việt Nam", domains: ["buv.edu.vn"], aliases: ["anh quoc viet nam", "buv"] },
  { name: "Đại học RMIT Việt Nam", domains: ["rmit.edu.vn"], aliases: ["rmit"] },
  { name: "Trường Đại học Greenwich Việt Nam", domains: ["greenwich.edu.vn"], aliases: ["greenwich"] },
  { name: "Trường Đại học Duy Tân", domains: ["duytan.edu.vn"], aliases: ["duy tan"] },
  { name: "Trường Đại học Đà Lạt", domains: ["dlu.edu.vn"], aliases: ["da lat"] },
  { name: "Trường Đại học Nha Trang", domains: ["ntu.edu.vn"], aliases: ["nha trang"] },
  { name: "Trường Đại học Đồng Nai", domains: ["dnuni.edu.vn"], aliases: ["dong nai"] },
  { name: "Trường Đại học Cần Thơ", domains: ["ctu.edu.vn"], aliases: ["can tho"] },
  { name: "Trường Đại học An Giang", domains: ["agu.edu.vn"], aliases: ["an giang"] },
  { name: "Trường Đại học Trà Vinh", domains: ["tvu.edu.vn"], aliases: ["tra vinh"] },
  { name: "Trường Đại học Đồng Tháp", domains: ["dthu.edu.vn"], aliases: ["dong thap"] },
  { name: "Trường Đại học Tiền Giang", domains: ["tgu.edu.vn"], aliases: ["tien giang"] },
  { name: "Trường Đại học Sóc Trăng", domains: ["stu.edu.vn"], aliases: ["soc trang"] },
  { name: "Trường Đại học Bạc Liêu", domains: ["blu.edu.vn"], aliases: ["bac lieu"] },
  { name: "Trường Đại học Kiên Giang", domains: ["kgu.edu.vn"], aliases: ["kien giang"] },
  { name: "Trường Đại học Vinh", domains: ["vinhuni.edu.vn"], aliases: ["dai hoc vinh"] },
  { name: "Trường Đại học Quy Nhơn", domains: ["qnu.edu.vn"], aliases: ["quy nhon"] },
  { name: "Trường Đại học Khoa học - Đại học Huế", domains: ["hueuni.edu.vn", "husc.edu.vn"], aliases: ["khoa hoc - dai hoc hue"] },
  { name: "Trường Đại học Sư phạm - Đại học Huế", domains: ["dhsphue.edu.vn"], aliases: ["su pham - dai hoc hue"] },
  { name: "Trường Đại học Kinh tế - Đại học Huế", domains: ["hce.edu.vn"], aliases: ["kinh te - dai hoc hue"] },
  { name: "Trường Đại học Nông Lâm - Đại học Huế", domains: ["huaf.edu.vn"], aliases: ["nong lam - dai hoc hue"] },
  { name: "Trường Đại học Nông Lâm TP.HCM", domains: ["hcmuaf.edu.vn"], aliases: ["nong lam tphcm"] },
  { name: "Trường Đại học Lâm nghiệp", domains: ["vnuf.edu.vn"], aliases: ["lam nghiep"] },
  { name: "Trường Đại học Nông Lâm - Đại học Thái Nguyên", domains: ["tuaf.edu.vn"], aliases: ["nong lam - dai hoc thai nguyen"] },
  { name: "Trường Đại học Khoa học - Đại học Thái Nguyên", domains: ["tnus.edu.vn"], aliases: ["khoa hoc - dai hoc thai nguyen"] },
  { name: "Trường Đại học Kinh tế và Quản trị Kinh doanh - Đại học Thái Nguyên", domains: ["tueba.edu.vn"], aliases: ["kinh te va quan tri kinh doanh"] },
  { name: "Trường Đại học Hồng Đức", domains: ["hdu.edu.vn"], aliases: ["hong duc"] },
  { name: "Trường Đại học Văn hóa Hà Nội", domains: ["huc.edu.vn"], aliases: ["van hoa ha noi"] },
  { name: "Trường Đại học Sân khấu - Điện ảnh Hà Nội", domains: ["skda.edu.vn"], aliases: ["san khau - dien anh ha noi"] },
  { name: "Trường Đại học Sân khấu - Điện ảnh TP.HCM", domains: ["skdaphcm.edu.vn"], aliases: ["san khau - dien anh tphcm"] },
  { name: "Trường Đại học Mỹ thuật Công nghiệp", domains: ["design.edu.vn"], aliases: ["my thuat cong nghiep"] },
  { name: "Trường Đại học Mỹ thuật TP.HCM", domains: ["hcmufa.edu.vn"], aliases: ["my thuat tphcm"] },
  { name: "Trường Đại học Sư phạm Nghệ thuật Trung ương", domains: ["spnttw.edu.vn"] },
  { name: "Trường Đại học Hùng Vương", domains: ["hvu.edu.vn"], aliases: ["hung vuong"] },
  { name: "Trường Đại học Lạc Hồng", domains: ["lhu.edu.vn"], aliases: ["lac hong"] },
  { name: "Trường Đại học Văn Hiến", domains: ["vhu.edu.vn"], aliases: ["van hien"] },
  { name: "Trường Đại học Gia Định", domains: ["giadinh.edu.vn"], aliases: ["gia dinh"] },
  { name: "Trường Đại học Bà Rịa - Vũng Tàu", domains: ["bvu.edu.vn"], aliases: ["ba ria - vung tau"] },
  { name: "Trường Đại học Phan Thiết", domains: ["ptu.edu.vn"], aliases: ["phan thiet"] },
  { name: "Trường Đại học Thủ Dầu Một", domains: ["tdmu.edu.vn"], aliases: ["thu dau mot"] },
  { name: "Trường Đại học Quốc tế Miền Đông", domains: ["mie.edu.vn"], aliases: ["quoc te mien dong"] },
  { name: "Trường Đại học Việt Đức", domains: ["vgu.edu.vn"], aliases: ["viet duc", "vgu"] },
  { name: "Trường Đại học Sao Đỏ", domains: ["saodo.edu.vn"], aliases: ["sao do"] },
  { name: "Trường Đại học Hải Phòng", domains: ["dhhp.edu.vn"], aliases: ["dai hoc hai phong"] },
  { name: "Trường Đại học Hạ Long", domains: ["uhm.edu.vn"], aliases: ["ha long"] },
  { name: "Trường Đại học Đông Á", domains: ["donga.edu.vn"], aliases: ["dai hoc dong a"] },
  { name: "Trường Đại học Công nghệ Đông Á", domains: ["eaut.edu.vn"], aliases: ["dai hoc cong nghe dong a"] },
  { name: "Trường Đại học Tân Tạo", domains: ["ttu.edu.vn"], aliases: ["tan tao"] },
  { name: "Trường Đại học Võ Trường Toản", domains: ["vttu.edu.vn"], aliases: ["vo truong toan"] },
  { name: "Trường Đại học Nam Cần Thơ", domains: ["nctu.edu.vn"], aliases: ["nam can tho"] },
  { name: "Trường Đại học Phan Châu Trinh", domains: ["pctu.edu.vn"], aliases: ["phan chau trinh"] },
  { name: "Trường Đại học Kỹ thuật Lê Quý Đôn", domains: ["lqdtu.edu.vn"], aliases: ["ky thuat le quy don"] },
  { name: "Trường Đại học Công nghệ Giao thông Vận tải", domains: ["utt.edu.vn"], aliases: ["cong nghe giao thong van tai"] },
];

export const DOMAIN_TO_UNIVERSITY: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const entry of UNIVERSITY_DIRECTORY) {
    for (const domain of entry.domains) map[domain] = entry.name;
  }
  return map;
})();

const NAME_LOOKUP = UNIVERSITY_DIRECTORY.flatMap((entry) =>
  [entry.name, ...(entry.aliases || [])].map((label) => {
    const key = normalizeTitle(label);
    return {
      entry,
      key,
      // Short acronyms ("NEU", "HUST") only match uppercase text, so Vietnamese
      // words like "nêu" cannot be mistaken for a school name.
      short: key.length <= 5,
    };
  }),
).sort((left, right) => right.key.length - left.key.length);

const BLOCKED_HOST_MARKERS = [
  "facebook.",
  "youtube.",
  "tiktok.",
  "wikipedia.",
  "zalo.",
  "google.",
  "tuyensinh247.",
  "reviewedu.",
  "toplist.",
  "careerbuilder.",
  "diemthi.",
  "baomoi.",
  "vnexpress.",
  "dantri.",
  "thanhnien.",
  "tuoitre.",
  "laodong.",
  "giaoducthoidai.",
  "kenh14.",
  "ybox.",
  "huongnghiep.",
  "edu2review.",
  "hotrochonnganh.",
  "onca.",
  "gddt.",
  "vietnamnet.",
  "znews.",
  "cafef.",
  "24h.com",
];

// Higher-education portals that live on .edu.vn but are not a school.
const BLOCKED_HOSTS = new Set([
  "gf.edu.vn",
  "huongnghiep.gf.edu.vn",
  "gddt.edu.vn",
  "moet.gov.vn",
  "onca.edu.vn",
  "saithanh.edu.vn",
]);

const GENERIC_PAGE_TITLES = [
  "trang chu",
  "tuyen sinh",
  "gioi thieu",
  "lien he",
  "tin tuc",
  "dao tao",
  "thong bao",
  "cac khoa",
  "co cau to chuc",
  "lich thi",
  "dang nhap",
  "nganh dao tao",
  "chuong trinh dao tao",
  "thong tin chung",
];

function toSearchableText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

function originOf(url: string): string {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/^(tuyensinh|xts|vieclam|admissions|pdaotao|daotao|sv|sinhvien|ctsv|phong|portal)\./, "");
    return `https://${hostname}/`;
  } catch {
    return "";
  }
}

function asText(value: unknown, maxLength = 4000): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function asStringArray(value: unknown, limit = 4): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeTitle(title: string) {
  return toSearchableText(title)
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const clean = value.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }
  return output;
}

function findByHost(hostname: string): DirectoryEntry | undefined {
  if (!hostname) return undefined;
  let best: DirectoryEntry | undefined;
  let bestLength = 0;
  for (const entry of UNIVERSITY_DIRECTORY) {
    for (const domain of entry.domains) {
      if ((hostname === domain || hostname.endsWith(`.${domain}`)) && domain.length > bestLength) {
        best = entry;
        bestLength = domain.length;
      }
    }
  }
  return best;
}

function findByTitle(title: string): DirectoryEntry | undefined {
  const haystack = normalizeTitle(title);
  if (!haystack) return undefined;
  const padded = ` ${haystack} `;
  const upper = title.toUpperCase();
  for (const item of NAME_LOOKUP) {
    if (!item.key) continue;
    if (item.short && !upper.includes(item.key.toUpperCase())) continue;
    if (padded.includes(` ${item.key} `)) return item.entry;
  }
  return undefined;
}

function isBlockedHost(hostname: string) {
  if (BLOCKED_HOSTS.has(hostname)) return true;
  if (BLOCKED_HOST_MARKERS.some((marker) => hostname.includes(marker))) return true;
  // Course/LMS portals are not university homepages.
  if (/^(lms|elearning|sao|sdh|daotao)\./.test(hostname)) return true;
  return false;
}

function isEducationHost(hostname: string) {
  return (
    hostname.endsWith(".edu.vn") ||
    hostname.endsWith(".ac.vn") ||
    hostname.includes("university") ||
    hostname.includes("college") ||
    hostname.includes("school")
  );
}

function isArticleLikeTitle(title: string) {
  const normalized = toSearchableText(title);
  return [
    "danh sach",
    "cac truong",
    "top ",
    "xep hang",
    "huong dan",
    "cam nang",
    "review",
    "tong hop",
    "nen hoc",
    "hoc truong nao",
    "nganh nao",
    "thong tin tuyen sinh",
    "chi tiet tuyen sinh",
    "muc hoc phi",
    "bao cao",
    "de an",
    "thong bao",
    "phuong an",
    "tuyen sinh nam",
    "diem chuan",
    "hoc phi",
    "chuong trinh",
    "nganh ",
    "he viet",
  ].some((marker) => normalized.includes(marker));
}

function isGenericPageTitle(title: string) {
  const normalized = normalizeTitle(title);
  if (!normalized || normalized.length < 4) return true;
  return GENERIC_PAGE_TITLES.some((marker) => {
    const normalizedMarker = normalizeTitle(marker);
    return normalized === normalizedMarker || normalized.startsWith(`${normalizedMarker} `);
  });
}

function looksLikeSchoolTitle(title: string) {
  const normalized = toSearchableText(title);
  if (normalized.length < 8) return false;
  return [
    "dai hoc",
    "hoc vien",
    "cao dang",
    "university",
    "college",
    "academy",
    "truong",
  ].some((keyword) => normalized.includes(keyword));
}

// Names that exist in many provinces; only the directory may resolve them.
const AMBIGUOUS_NAMES = [
  "dai hoc kinh te",
  "dai hoc su pham",
  "dai hoc ky thuat",
  "dai hoc cong nghe",
  "dai hoc nong lam",
  "dai hoc luat",
  "dai hoc y",
  "dai hoc y duoc",
  "dai hoc kien truc",
  "dai hoc xay dung",
  "dai hoc giao thong van tai",
  "dai hoc van hoa",
  "dai hoc my thuat",
  "dai hoc san khau dien anh",
  "dai hoc cong nghiep",
  "dai hoc hang hai",
  "dai hoc cong nghe thong tin",
  "dai hoc khoa hoc tu nhien",
  "dai hoc khoa hoc xa hoi va nhan van",
  "dai hoc su pham ky thuat",
  "dai hoc bach khoa",
  "dai hoc quoc te",
  "dai hoc mo",
  "dai hoc ngoai ngu",
];

function isAmbiguousSchoolName(name: string) {
  const normalized = normalizeTitle(name).replace(/^truong /, "");
  return AMBIGUOUS_NAMES.includes(normalized);
}

// Umbrella systems do not admit students directly; member universities do.
const SYSTEM_NAMES = new Set([
  "dai hoc quoc gia ha noi",
  "dai hoc quoc gia tphcm",
  "dai hoc quoc gia tp hcm",
  "dai hoc da nang",
  "dai hoc hue",
  "dai hoc thai nguyen",
]);

function cleanSchoolName(name: string) {
  return name
    .replace(/\s*[|\-–—:]\s*(trang chủ|tuyển sinh|thông tin|giới thiệu).*$/iu, "")
    .replace(/\s*[|\-–—]\s*[^|\-–—]{0,40}$/u, (tail) =>
      /\b(hust|hcmut|hcmute|uit|ueh|ftu|neu|ptit|vnu|hutech|vimaru|tnut|dut|uet)\b/i.test(tail)
        ? tail
        : "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(trimmed)) return `https://${trimmed.replace(/^\/+/, "")}`;
  return "";
}

/**
 * Chooses the official university identity for one search hit.
 *
 * Exa's structured output can pair the right school name with a third-party
 * source URL (or the reverse), so the domain directory always wins. When the
 * host is unknown we only keep a title that actually looks like a school name.
 */
function resolveUniversityIdentity(
  rawTitle: string,
  rawUrl: string,
): { name: string; url: string } | null {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;
  const hostname = hostnameOf(url);
  if (!hostname) return null;

  // A school's own portal (lms./sdh./sao.) still belongs to that school.
  const hostEntry = findByHost(hostname);
  if (hostEntry) {
    return { name: hostEntry.name, url: `https://${hostEntry.domains[0]}/` };
  }

  // The model sometimes pairs a correct school name with an aggregator URL.
  // A directory match on the title is stronger evidence than the host is bad.
  const titleEntry = findByTitle(rawTitle);
  if (titleEntry) {
    return { name: titleEntry.name, url: `https://${titleEntry.domains[0]}/` };
  }

  if (isBlockedHost(hostname)) return null;
  if (isArticleLikeTitle(rawTitle)) return null;
  if (isGenericPageTitle(rawTitle)) return null;

  if (!isEducationHost(hostname)) return null;
  if (!looksLikeSchoolTitle(rawTitle)) return null;

  const name = cleanSchoolName(rawTitle);
  if (!name || isArticleLikeTitle(name) || isGenericPageTitle(name)) return null;
  if (isAmbiguousSchoolName(name)) return null;

  return { name, url: originOf(url) };
}

function resolveUniversity(rawTitle: string, rawUrl: string) {
  const resolved = resolveUniversityIdentity(rawTitle, rawUrl);
  if (!resolved) return null;
  if (SYSTEM_NAMES.has(normalizeTitle(resolved.name).replace(/^truong /, ""))) return null;
  return resolved;
}

export function isAcceptableUniversityCandidate(title: string, url: string) {
  return resolveUniversity(title, url) !== null;
}

export function extractUniversityName(title: string, url: string): string {
  return resolveUniversity(title, url)?.name || "";
}

function normalizeConstraintStatus(status: unknown, hasConstraint: boolean): ConstraintStatus {
  if (!hasConstraint) return "not_applicable";
  const value = asText(status, 40).toLowerCase();
  if (!value) return "unknown";
  if (["meets", "match", "matched", "yes", "true", "phu hop", "phù hợp"].includes(value)) return "meets";
  if (["conflicts", "conflict", "no", "false", "khong phu hop", "không phù hợp"].includes(value)) {
    return "conflicts";
  }
  return "unknown";
}

function pickConstraintStatus(current: ConstraintStatus, next: ConstraintStatus): ConstraintStatus {
  const rank: Record<ConstraintStatus, number> = {
    conflicts: 4,
    meets: 3,
    unknown: 2,
    not_applicable: 1,
  };
  return rank[next] > rank[current] ? next : current;
}

function cleanEvidence(text: string, title: string): string {
  const clean = text
    .replace(/\s+/g, " ")
    .replace(/^(xem thêm|đọc tiếp|chia sẻ)\s*[:.]?\s*/iu, "")
    .replace(/^[\s|:;,.\-–—]+/u, "")
    .trim();
  if (!clean) return "";
  if (clean.length < 25) return "";
  // Fragments of scraped tables read as garbage in the UI.
  if (/^\d{4,}/.test(clean) && (clean.match(/\|/g) || []).length >= 2) return "";
  const normalized = normalizeTitle(clean);
  const normalizedTitle = normalizeTitle(title);
  if (normalized === normalizedTitle) return "";
  if (GENERIC_PAGE_TITLES.some((marker) => normalized === normalizeTitle(marker))) return "";
  return clean.slice(0, 260);
}

// Search models sometimes attach evidence that opens with a different school's
// name (e.g. a PTIT paragraph filed under Xây dựng Hà Nội). Such quotes are
// worse than no quote at all.
function evidenceBelongsToUniversity(evidence: string, universityName: string) {
  const target = findByTitle(universityName);
  const labels = target ? [target.name, ...(target.aliases || [])] : [universityName];
  const normalizedEvidence = ` ${normalizeTitle(evidence)} `;
  if (labels.some((label) => normalizedEvidence.includes(` ${normalizeTitle(label)} `))) {
    return true;
  }
  const leading = normalizedEvidence.trimStart();
  const upperLeading = evidence.toUpperCase();
  for (const item of NAME_LOOKUP) {
    if (!item.key) continue;
    if (item.short && !upperLeading.startsWith(item.key.toUpperCase())) continue;
    if (!leading.startsWith(`${item.key} `)) continue;
    return item.entry === target;
  }
  return true;
}

function readStructuredUniversities(data: UniversitySearchData): StructuredUniversity[] {
  let content: unknown = data?.output?.content;
  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      return [];
    }
  }
  if (!content || typeof content !== "object") return [];
  if (Array.isArray(content)) return content as StructuredUniversity[];
  const universities = (content as { universities?: unknown }).universities;
  return Array.isArray(universities) ? (universities as StructuredUniversity[]) : [];
}

function buildCandidatesFromStructured(
  data: UniversitySearchData,
  topicLabel: string,
  userConstraint: string,
): UniversityCandidate[] {
  const hasConstraint = userConstraint.trim().length > 0;
  return readStructuredUniversities(data)
    .map((item): UniversityCandidate | null => {
      const resolved = resolveUniversity(asText(item.title, 300), asText(item.url, 1000));
      if (!resolved) return null;
      let evidence = cleanEvidence(asText(item.evidence, 600), resolved.name);
      if (evidence && !evidenceBelongsToUniversity(evidence, resolved.name)) evidence = "";
      return {
        title: resolved.name,
        url: resolved.url,
        highlights: evidence ? [evidence] : [],
        matchedMajors: [topicLabel],
        constraintStatus: normalizeConstraintStatus(item.constraintStatus, hasConstraint),
        constraintReason: hasConstraint ? asText(item.constraintReason, 300) : "",
        source: "structured",
      };
    })
    .filter((candidate): candidate is UniversityCandidate => candidate !== null);
}

function buildCandidatesFromResults(
  data: UniversitySearchData,
  topicLabel: string,
  hasConstraint: boolean,
): UniversityCandidate[] {
  const rawResults = Array.isArray(data?.results) ? data.results : [];
  return rawResults
    .map((result): UniversityCandidate | null => {
      const resolved = resolveUniversity(asText(result.title, 300), asText(result.url, 1000));
      if (!resolved) return null;
      const evidence = uniqueStrings(
        [...asStringArray(result.highlights, 3), asText(result.summary, 400)]
          .map((item) => cleanEvidence(item, resolved.name))
          .filter((item) => item.length > 0 && evidenceBelongsToUniversity(item, resolved.name)),
      ).slice(0, 2);
      return {
        title: resolved.name,
        url: resolved.url,
        highlights: evidence,
        matchedMajors: [topicLabel],
        constraintStatus: hasConstraint ? "unknown" : "not_applicable",
        constraintReason: hasConstraint
          ? "Chưa đủ bằng chứng từ nguồn tìm kiếm để xác nhận tiêu chí riêng."
          : "",
        source: "result",
      };
    })
    .filter((candidate): candidate is UniversityCandidate => candidate !== null);
}

function candidateKey(candidate: UniversityCandidate): string {
  const entry = findByTitle(candidate.title) || findByHost(hostnameOf(candidate.url));
  if (entry) return `school:${normalizeTitle(entry.name)}`;
  return `host:${hostnameOf(candidate.url)}`;
}

export function extractUniversityCandidatesFromSearch(
  data: UniversitySearchData,
  topicLabel: string,
  userConstraint: string,
): UniversityCandidate[] {
  const hasConstraint = userConstraint.trim().length > 0;
  const structured = buildCandidatesFromStructured(data, topicLabel, userConstraint);
  const fromResults = buildCandidatesFromResults(data, topicLabel, hasConstraint);
  return mergeUniversityCandidates([...structured, ...fromResults]);
}

export function mergeUniversityCandidates(candidates: UniversityCandidate[]) {
  const merged = new Map<string, UniversityCandidate>();

  for (const candidate of candidates) {
    const key = candidateKey(candidate);
    if (!key) continue;

    const current = merged.get(key);
    if (!current) {
      merged.set(key, {
        ...candidate,
        highlights: uniqueStrings(candidate.highlights).slice(0, 3),
        matchedMajors: uniqueStrings(candidate.matchedMajors),
      });
      continue;
    }

    // Structured records carry the official identity; scraped page titles must
    // never replace them just because they are longer.
    const candidateIsAuthoritative =
      candidate.source === "structured" && current.source !== "structured";
    const title = candidateIsAuthoritative ? candidate.title : current.title;

    merged.set(key, {
      ...current,
      title,
      url: current.url,
      highlights: uniqueStrings([...current.highlights, ...candidate.highlights]).slice(0, 3),
      matchedMajors: uniqueStrings([...current.matchedMajors, ...candidate.matchedMajors]),
      constraintStatus: pickConstraintStatus(current.constraintStatus, candidate.constraintStatus),
      constraintReason:
        current.constraintReason.length >= candidate.constraintReason.length
          ? current.constraintReason
          : candidate.constraintReason,
      source: current.source === "structured" ? "structured" : candidate.source,
    });
  }

  return Array.from(merged.values()).sort((left, right) => {
    if (right.matchedMajors.length !== left.matchedMajors.length) {
      return right.matchedMajors.length - left.matchedMajors.length;
    }
    const rank: Record<ConstraintStatus, number> = {
      meets: 4,
      not_applicable: 3,
      unknown: 2,
      conflicts: 1,
    };
    if (rank[right.constraintStatus] !== rank[left.constraintStatus]) {
      return rank[right.constraintStatus] - rank[left.constraintStatus];
    }
    return left.title.localeCompare(right.title, "vi");
  });
}

export function buildUniversitySearchRequest(
  topicLabel: string,
  majors: string[] | string,
  userConstraint: string,
) {
  const hasConstraint = userConstraint.trim().length > 0;
  const majorAliases = uniqueStrings(Array.isArray(majors) ? majors : [majors]);
  const primaryMajor = majorAliases[0] || topicLabel;
  const constraint = userConstraint.trim();

  const variationQueries = uniqueStrings([
    `trường đại học đào tạo ngành ${primaryMajor} tại Việt Nam`,
    `tuyển sinh đại học ngành ${primaryMajor} điểm chuẩn học phí`,
    `chương trình đào tạo ${primaryMajor} bậc đại học chính quy`,
    `${primaryMajor} site:edu.vn`,
    ...majorAliases.slice(1).flatMap((alias) => [
      `trường đại học đào tạo ngành ${alias} tại Việt Nam`,
      `tuyển sinh ngành ${alias} đại học`,
    ]),
  ]).slice(0, 6);

  const query = `Các trường đại học tại Việt Nam đào tạo ngành ${majorAliases.join(" hoặc ")}${
    constraint ? `, đáp ứng yêu cầu: ${constraint}` : ""
  }`;

  return {
    query,
    numResults: 20,
    options: {
      type: "deep",
      includeDomains: ["edu.vn", "ac.vn"],
      excludeDomains: [
        "tuyensinh247.com",
        "reviewedu.net",
        "toplist.vn",
        "careerbuilder.vn",
        "diemthi.tuyensinh247.com",
        "facebook.com",
        "youtube.com",
        "goldenkey.vn",
        "huongnghiep.gf.edu.vn",
        "gf.edu.vn",
        "gddt.edu.vn",
        "onca.edu.vn",
      ],
      additionalQueries: variationQueries,
      systemPrompt: [
        "Bạn đang tổng hợp danh sách trường đại học chính thức tại Việt Nam.",
        `Chỉ lấy trường có bằng chứng rõ ràng là có đào tạo bậc đại học cho ÍT NHẤT MỘT ngành trong nhóm: ${majorAliases.join(", ")}.`,
        "Mỗi trường chỉ cần đào tạo một trong các ngành trên; TUYỆT ĐỐI không yêu cầu một trường phải đào tạo tất cả các ngành.",
        `Gắn nhãn kết quả chung là "${topicLabel}".`,
        "Với mỗi trường, title phải là tên chính thức của trường (ví dụ: Trường Đại học Bách khoa Hà Nội), không được là tiêu đề bài báo hay tên trang web trung gian.",
        "url phải là tên miền chính thức của chính trường đó (ví dụ: https://hust.edu.vn), không trỏ sang trang tổng hợp, trang hướng nghiệp, PDF, LMS hay bài tin tức.",
        "Ưu tiên trang chủ trường, trang tuyển sinh chính thức và cổng thông tin đào tạo của trường.",
        "Loại bỏ bài tổng hợp, toplist, review, hướng dẫn và trang trung gian không phải của trường.",
        constraint
          ? `Đánh giá tiêu chí riêng "${constraint}". Chỉ gắn constraintStatus="meets" khi nguồn xác nhận rõ ràng; "conflicts" khi nguồn cho thấy không đáp ứng; còn lại "unknown".`
          : 'Người dùng không nhập tiêu chí riêng, gắn constraintStatus="not_applicable".',
        "Nếu không xác nhận được, bỏ trường đó thay vì đoán.",
      ].join(" "),
      outputSchema: {
        type: "object",
        properties: {
          universities: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Tên chính thức đầy đủ của trường đại học" },
                url: { type: "string", description: "URL trang chủ chính thức của trường" },
                evidence: { type: "string", description: "Bằng chứng trường có đào tạo ngành này" },
                constraintStatus: { type: "string" },
                constraintReason: { type: "string" },
              },
              required: ["title", "url", "evidence", "constraintStatus", "constraintReason"],
            },
          },
        },
        required: ["universities"],
      },
      contents: {
        text: { maxCharacters: 4000, verbosity: "standard" },
        highlights: {
          query: `Bằng chứng trường đào tạo bậc đại học ngành ${majorAliases.join(", ")}${
            constraint ? ` và đáp ứng tiêu chí ${constraint}` : ""
          }`,
          maxCharacters: 1500,
        },
        summary: {
          query: `Tóm tắt thông tin tuyển sinh ngành ${topicLabel} tại trường này`,
        },
        subpages: 1,
        subpageTarget: ["tuyển sinh", "ngành đào tạo", "admissions"],
      },
    },
  };
}

export function chooseUniversityDisplaySet(
  candidates: UniversityCandidate[],
  hasConstraint: boolean,
) {
  if (!hasConstraint) {
    const universities = candidates.slice(0, 24);
    return {
      mode: "confirmed" as const,
      universities,
      displayedCount: universities.length,
      confirmedCount: universities.length,
      unknownCount: 0,
      conflictCount: 0,
    };
  }

  const confirmed = candidates.filter((candidate) => candidate.constraintStatus === "meets");
  const unknown = candidates.filter((candidate) => candidate.constraintStatus === "unknown");
  const conflicts = candidates.filter((candidate) => candidate.constraintStatus === "conflicts");

  if (confirmed.length) {
    const universities = [...confirmed, ...unknown].slice(0, 15);
    return {
      mode: "confirmed" as const,
      universities,
      displayedCount: universities.length,
      confirmedCount: confirmed.length,
      unknownCount: unknown.length,
      conflictCount: conflicts.length,
    };
  }

  if (unknown.length) {
    const universities = unknown.slice(0, 15);
    return {
      mode: "unconfirmed" as const,
      universities,
      displayedCount: universities.length,
      confirmedCount: 0,
      unknownCount: unknown.length,
      conflictCount: conflicts.length,
    };
  }

  const universities = conflicts.slice(0, 15);
  return {
    mode: "conflict_only" as const,
    universities,
    displayedCount: universities.length,
    confirmedCount: 0,
    unknownCount: 0,
    conflictCount: conflicts.length,
  };
}

export function summarizeCoverage(
  selectedCareers: string[],
  mappedMajors: string[],
  universities: UniversityCandidate[],
) {
  const lines: string[] = [];
  for (const career of selectedCareers) {
    const normalizedCareer = toSearchableText(career);
    const count = universities.filter(
      (university) =>
        university.matchedMajors.some((major) => toSearchableText(major).includes(normalizedCareer)) ||
        university.highlights.some((highlight) => toSearchableText(highlight).includes(normalizedCareer)),
    ).length;
    lines.push(`- ${career}: ${count} trường liên quan`);
  }
  if (!lines.length) {
    lines.push(`- Tổng số nhóm ngành đã quy đổi: ${mappedMajors.length}`);
  }
  return lines.join("\n");
}
