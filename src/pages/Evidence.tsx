import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Database,
  FileText,
  GitBranch,
  Monitor,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  METHOD_UPDATED_AT,
  METHOD_VERSION,
  OPERATING_SNAPSHOT_AT,
  QUESTION_SET_SIZE,
} from "../data/version";
import type { ReactNode } from "react";

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0_#000]">
    <div className="text-3xl md:text-4xl font-black tracking-tighter leading-none">{value}</div>
    <div className="mt-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-black/50">
      {label}
    </div>
  </div>
);

const Card = ({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) => (
  <section className="bg-white border-[4px] border-black shadow-[6px_6px_0_#000] p-5 md:p-8">
    <h2 className="flex items-center gap-3 text-xl md:text-2xl font-black uppercase tracking-tight mb-4">
      <span className="w-10 h-10 md:w-11 md:h-11 bg-cyan-pop border-[3px] border-black flex items-center justify-center flex-shrink-0 shadow-[3px_3px_0_#000]">
        {icon}
      </span>
      {title}
    </h2>
    <div className="space-y-3 text-sm md:text-base font-bold leading-relaxed text-black/80">
      {children}
    </div>
  </section>
);

export default function Evidence() {
  return (
    <div className="min-h-screen bg-brutal-paper font-sans text-black">
      <header className="border-b-[4px] border-black bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-black uppercase tracking-wide text-sm hover:text-[var(--color-primary)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 stroke-[3px]" />
            Về trang chủ
          </Link>
          <Link to="/phuong-phap" className="text-3xl font-black tracking-tighter">
            Astra<span className="text-[var(--color-primary)]">.</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <p className="inline-block bg-cyan-pop border-[3px] border-black px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0_#000] mb-4">
            Hồ sơ công khai
          </p>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
            Minh chứng
            <br />
            &amp; nhật ký
          </h1>
          <p className="mt-4 text-base md:text-lg font-bold leading-relaxed max-w-2xl">
            Số liệu vận hành, kết quả kiểm thử, nguồn dữ liệu và lịch sử phiên bản của Astra.
            Trang này là đích của mã QR trên poster.
          </p>
        </motion.div>

        <div className="mt-6 flex flex-wrap gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest">
          <span className="bg-yellow-pop border-[2px] border-black px-2 py-1">
            Phương pháp {METHOD_VERSION} · {METHOD_UPDATED_AT}
          </span>
          <span className="bg-white border-[2px] border-black px-2 py-1">
            {QUESTION_SET_SIZE} câu hỏi
          </span>
          <span className="bg-white border-[2px] border-black px-2 py-1">
            Số liệu vận hành chốt {OPERATING_SNAPSHOT_AT}
          </span>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Stat value="91/91" label="Kịch bản kiểm thử đạt" />
          <Stat value="21/21" label="Kiểm thử cô lập dữ liệu" />
          <Stat value="193" label="Tài khoản đã tạo" />
          <Stat value="125" label="Lượt hoàn thành bài (65%)" />
        </div>

        <div className="mt-6 md:mt-8 space-y-6 md:space-y-8">
          <Card icon={<Monitor className="w-5 h-5 stroke-[3px]" />} title="1. Nhật ký kiểm thử">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border-[3px] border-black px-3 py-2 text-left font-black uppercase">
                      Vòng
                    </th>
                    <th className="border-[3px] border-black px-3 py-2 text-left font-black uppercase">
                      Số kịch bản
                    </th>
                    <th className="border-[3px] border-black px-3 py-2 text-left font-black uppercase">
                      Kết quả
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-[3px] border-black px-3 py-2">Máy tính</td>
                    <td className="border-[3px] border-black px-3 py-2">44</td>
                    <td className="border-[3px] border-black px-3 py-2">44/44 đạt</td>
                  </tr>
                  <tr className="bg-[var(--color-background)]">
                    <td className="border-[3px] border-black px-3 py-2">Điện thoại</td>
                    <td className="border-[3px] border-black px-3 py-2">47</td>
                    <td className="border-[3px] border-black px-3 py-2">47/47 đạt</td>
                  </tr>
                  <tr>
                    <td className="border-[3px] border-black px-3 py-2">Cô lập tài khoản</td>
                    <td className="border-[3px] border-black px-3 py-2">21</td>
                    <td className="border-[3px] border-black px-3 py-2">21/21 đạt</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-black/60">
              Kiểm thử do hai học sinh thực hiện trên trình duyệt thật, kịch bản viết trước. Kết quả
              chi tiết:
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
              <a
                className="border-[2px] border-black px-2 py-1 bg-white hover:bg-yellow-pop"
                href="/minh-chung/ket-qua-kiem-thu/may-tinh-44.json"
                target="_blank"
                rel="noreferrer"
              >
                Máy tính (JSON)
              </a>
              <a
                className="border-[2px] border-black px-2 py-1 bg-white hover:bg-yellow-pop"
                href="/minh-chung/ket-qua-kiem-thu/dien-thoai-47.json"
                target="_blank"
                rel="noreferrer"
              >
                Điện thoại (JSON)
              </a>
              <a
                className="border-[2px] border-black px-2 py-1 bg-white hover:bg-yellow-pop"
                href="/minh-chung/ket-qua-kiem-thu/co-lap-du-lieu-21.json"
                target="_blank"
                rel="noreferrer"
              >
                Cô lập dữ liệu (JSON)
              </a>
            </div>
          </Card>

          <Card icon={<Database className="w-5 h-5 stroke-[3px]" />} title="2. Số liệu vận hành">
            <p>
              Số liệu chốt ngày {OPERATING_SNAPSHOT_AT}, lấy từ cơ sở dữ liệu của sản phẩm và nhật ký
              kiểm thử. Đây là thống kê mô tả, không dùng để suy luận nhân quả.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Stat value="193" label="Tài khoản" />
              <Stat value="125" label="Hoàn thành bài (65%)" />
              <Stat value="59" label="Đặt mục tiêu ngành, trường (31%)" />
              <Stat value="60" label="Câu hỏi Holland" />
            </div>
            <p className="text-xs text-black/60">
              Tỉ lệ phần trăm tính trên số tài khoản đã tạo. Số liệu được trích xuất một lần, không
              cộng dồn theo thời gian thực.
            </p>
          </Card>

          <Card icon={<ShieldCheck className="w-5 h-5 stroke-[3px]" />} title="3. Nguồn dữ liệu">
            <p>
              Thông tin ngành, trường và tuyển sinh được tra cứu từ các nguồn công khai trên web, ưu
              tiên cổng thông tin chính thức của trường. Kết quả hiển thị kèm đường dẫn nguồn khi có.
            </p>
            <p>
              Điểm chuẩn, học phí và chỉ tiêu thay đổi theo từng năm. Astra không cam kết dữ liệu luôn
              mới nhất; người dùng cần đối chiếu lại trước khi đăng ký nguyện vọng.
            </p>
            <p className="text-xs text-black/60">
              Bộ câu hỏi và công thức tính là dữ liệu tĩnh trong mã nguồn, phiên bản {METHOD_VERSION} (
              {METHOD_UPDATED_AT}).
            </p>
          </Card>

          <Card icon={<Users className="w-5 h-5 stroke-[3px]" />} title="4. Khảo sát người dùng">
            <p>
              Phiếu phản hồi 5 câu đang mở trong ứng dụng sau khi học sinh xem kết quả. Câu trả lời
              được lưu theo tài khoản để tổng hợp, không dùng cho mục đích quảng cáo.
            </p>
            <p>
              Số liệu khảo sát và kết quả đo thời gian sẽ được công bố khi đủ mẫu tối thiểu 10–20
              người. Astra không công bố số liệu chưa thu thập.
            </p>
            <p className="text-xs text-black/60">
              Đây là khảo sát hồi cứu (hỏi lại trạng thái trước khi dùng), không phải thử nghiệm có
              nhóm đối chứng.
            </p>
          </Card>

          <Card icon={<FileText className="w-5 h-5 stroke-[3px]" />} title="5. Tệp minh chứng">
            <div className="flex flex-wrap gap-2 text-xs font-black uppercase">
              <a
                className="border-[2px] border-black px-2 py-1 bg-white hover:bg-yellow-pop"
                href="/minh-chung/nhat-ky-kiem-thu.txt"
                target="_blank"
                rel="noreferrer"
              >
                Nhật ký kiểm thử
              </a>
              <a
                className="border-[2px] border-black px-2 py-1 bg-white hover:bg-yellow-pop"
                href="/minh-chung/so-lieu-van-hanh.txt"
                target="_blank"
                rel="noreferrer"
              >
                Số liệu vận hành
              </a>
              <a
                className="border-[2px] border-black px-2 py-1 bg-white hover:bg-yellow-pop"
                href="/minh-chung/phan-cong-nhom.txt"
                target="_blank"
                rel="noreferrer"
              >
                Phân công nhóm
              </a>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <img
                src="/minh-chung/anh-kiem-thu/test-question-full.png"
                alt="Ảnh kiểm thử câu hỏi"
                className="w-full border-[3px] border-black bg-white shadow-[3px_3px_0_#000]"
                loading="lazy"
              />
              <img
                src="/minh-chung/anh-kiem-thu/holland-result.png"
                alt="Ảnh kiểm thử kết quả Holland"
                className="w-full border-[3px] border-black bg-white shadow-[3px_3px_0_#000]"
                loading="lazy"
              />
              <img
                src="/minh-chung/anh-kiem-thu/planner.png"
                alt="Ảnh kiểm thử lộ trình học tập"
                className="w-full border-[3px] border-black bg-white shadow-[3px_3px_0_#000]"
                loading="lazy"
              />
            </div>
            <p className="text-xs text-black/60">
              Ảnh chụp trực tiếp từ sản phẩm trong các vòng kiểm thử, không dàn dựng.
            </p>
          </Card>

          <Card icon={<GitBranch className="w-5 h-5 stroke-[3px]" />} title="6. Mã nguồn & phiên bản">
            <p>
              Lịch sử thay đổi của sản phẩm được lưu trên GitHub, gồm các mốc: đổi tên ASTRA, chuyển
              thang điểm Holland sang 1–5 và thêm trang phương pháp.
            </p>
            <a
              href="https://github.com/dev-hkm/SMARM/commits/main"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide border-b-[3px] border-black hover:bg-black hover:text-white transition-colors px-1 py-0.5"
            >
              Xem lịch sử commit
              <ArrowRight className="w-4 h-4 stroke-[3px]" />
            </a>
            <p className="text-xs text-black/60">
              Mã nguồn không chứa khóa bí mật; khóa được cấu hình trong biến môi trường của Cloudflare.
            </p>
          </Card>
        </div>

        <div className="mt-8 md:mt-12 bg-black text-white border-[4px] border-black p-6 md:p-8 shadow-[6px_6px_0_var(--color-primary)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Xem phương pháp tính
            </h2>
            <p className="text-sm font-bold text-white/70 mt-1">
              Công thức, giới hạn và so sánh với các công cụ khác.
            </p>
          </div>
          <Link
            to="/phuong-phap"
            className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] text-black border-[3px] border-white px-5 py-3 font-black uppercase tracking-wide hover:bg-white transition-colors flex-shrink-0"
          >
            Phương pháp
            <ArrowRight className="w-5 h-5 stroke-[3px]" />
          </Link>
        </div>

        <footer className="py-8 text-center text-xs font-black uppercase tracking-widest text-black/40">
          Astra · Minh chứng công khai · 2026
        </footer>
      </main>
    </div>
  );
}
