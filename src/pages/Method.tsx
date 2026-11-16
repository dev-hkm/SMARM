import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  Database,
  GitCompare,
  ShieldAlert,
} from "lucide-react";
import type { ReactNode } from "react";
import { METHOD_UPDATED_AT, METHOD_VERSION } from "../data/version";

const Section = ({
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
      <span className="w-10 h-10 md:w-11 md:h-11 bg-yellow-pop border-[3px] border-black flex items-center justify-center flex-shrink-0 shadow-[3px_3px_0_#000]">
        {icon}
      </span>
      {title}
    </h2>
    <div className="space-y-3 text-sm md:text-base font-bold leading-relaxed text-black/80">
      {children}
    </div>
  </section>
);

export default function Method() {
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
          <Link to="/test" className="text-3xl font-black tracking-tighter">
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
          <p className="inline-block bg-orange-pop border-[3px] border-black px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[3px_3px_0_#000] mb-4">
            Minh bạch phương pháp
          </p>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
            Phương pháp
            <br />
            &amp; giới hạn
          </h1>
          <p className="mt-4 text-base md:text-lg font-bold leading-relaxed max-w-2xl">
            Cách Astra tính điểm Holland, cách đọc kết quả, và những gì hệ thống không thể làm thay bạn.
            Trang này công khai để bất kỳ ai cũng có thể kiểm tra lại công thức.
          </p>
        </motion.div>

        <div className="mt-8 md:mt-12 space-y-6 md:space-y-8">
          <Section icon={<Calculator className="w-5 h-5 stroke-[3px]" />} title="1. Bài trắc nghiệm">
            <p>
              Bộ câu hỏi gồm 60 câu, chia đều thành 6 nhóm theo khung RIASEC của Holland: Thực tế (R),
              Nghiên cứu (I), Nghệ thuật (A), Xã hội (S), Quản lý (E) và Nghiệp vụ (C).
            </p>
            <p>
              Mỗi câu trả lời theo thang 1–5, từ “Hoàn toàn không giống tôi” đến “Rất giống tôi”. Bài làm
              thường mất khoảng 8–12 phút và được chia thành 6 chặng, mỗi chặng một nhóm.
            </p>
          </Section>

          <Section icon={<BarChart3 className="w-5 h-5 stroke-[3px]" />} title="2. Công thức tính">
            <div className="bg-[var(--color-background)] border-[3px] border-black p-4 md:p-5 space-y-2">
              <p>
                <span className="font-black">Điểm thô mỗi nhóm</span> = tổng điểm 10 câu, nằm trong khoảng
                10–50.
              </p>
              <p>
                <span className="font-black">Điểm quy đổi 0–100</span> = (điểm thô − 10) ÷ 40 × 100.
              </p>
              <p>
                <span className="font-black">Mã ba chữ</span> = ba nhóm có điểm thô cao nhất, xếp theo thứ tự
                giảm dần.
              </p>
              <p>
                <span className="font-black">Gợi ý ngành</span> = lấy lần lượt 12, 8 và 4 ngành từ ba nhóm dẫn
                đầu, sau đó chuẩn hóa và loại trùng.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border-[3px] border-black px-3 py-2 text-left font-black uppercase">
                      Điểm thô
                    </th>
                    <th className="border-[3px] border-black px-3 py-2 text-left font-black uppercase">
                      Quy đổi
                    </th>
                    <th className="border-[3px] border-black px-3 py-2 text-left font-black uppercase">
                      Ý nghĩa
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border-[3px] border-black px-3 py-2">10</td>
                    <td className="border-[3px] border-black px-3 py-2">0</td>
                    <td className="border-[3px] border-black px-3 py-2">Không có câu nào giống bạn</td>
                  </tr>
                  <tr className="bg-[var(--color-background)]">
                    <td className="border-[3px] border-black px-3 py-2">30</td>
                    <td className="border-[3px] border-black px-3 py-2">50</td>
                    <td className="border-[3px] border-black px-3 py-2">Trung tính, ở giữa thang</td>
                  </tr>
                  <tr>
                    <td className="border-[3px] border-black px-3 py-2">50</td>
                    <td className="border-[3px] border-black px-3 py-2">100</td>
                    <td className="border-[3px] border-black px-3 py-2">Rất phù hợp với nhóm đó</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Điểm và mã ba chữ do công thức cố định tính. Trợ lý AI chỉ giải thích thêm và không được phép
              sửa điểm.
            </p>
          </Section>

          <Section icon={<ShieldAlert className="w-5 h-5 stroke-[3px]" />} title="3. Cách đọc kết quả">
            <p>
              Thang 0–100 dùng để so sánh sáu nhóm trong cùng một lần làm bài, không phải điểm phần trăm so
              với học sinh khác. Một nhóm đạt 70 nghĩa là sở thích của bạn nghiêng về nhóm đó hơn các nhóm
              còn lại, không có nghĩa bạn giỏi hơn 70% người khác.
            </p>
            <p>
              Ba nhóm cao nhất thường đủ để gợi ý hướng đi. Nếu hai nhóm sát điểm nhau, hãy đọc cả hai và
              thử thêm hoạt động thực tế trước khi chọn ngành.
            </p>
          </Section>

          <Section icon={<GitCompare className="w-5 h-5 stroke-[3px]" />} title="4. Giới hạn cần biết">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Đây là bảng <span className="font-black">tự khai</span>. Kết quả phụ thuộc vào cách bạn hiểu
                câu hỏi, tâm trạng lúc làm và trải nghiệm của bản thân.
              </li>
              <li>
                Kết quả <span className="font-black">không phải chẩn đoán tâm lý</span> và không thay thế tư
                vấn của chuyên gia hướng nghiệp.
              </li>
              <li>
                Sở thích có thể thay đổi theo thời gian. Nên làm lại sau 6–12 tháng hoặc khi có trải nghiệm
                mới.
              </li>
              <li>
                Bài trắc nghiệm không dự báo thu nhập, khả năng đỗ đại học hay mức độ thành công trong nghề.
              </li>
              <li>
                Danh sách ngành và trường là gợi ý tham khảo, không phải danh sách đầy đủ và không xếp hạng
                trường.
              </li>
            </ul>
          </Section>

          <Section icon={<BookOpen className="w-5 h-5 stroke-[3px]" />} title="5. So với các công cụ đã có">
            <p>
              Bảng so sánh dưới đây trả lời một câu hỏi duy nhất: <strong>điểm mới của Astra nằm ở đâu</strong>
              . Ký hiệu: <span className="font-black">●</span> có đầy đủ,{" "}
              <span className="font-black">◐</span> có một phần, <span className="font-black">○</span> không
              có.
            </p>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full min-w-[640px] border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="border-[3px] border-black px-2 py-2 text-left font-black uppercase">
                      Tiêu chí
                    </th>
                    <th className="border-[3px] border-black px-2 py-2 text-center font-black uppercase bg-[var(--color-primary)] text-black">
                      Astra
                    </th>
                    <th className="border-[3px] border-black px-2 py-2 text-center font-black uppercase">
                      O*NET Interest Profiler
                    </th>
                    <th className="border-[3px] border-black px-2 py-2 text-center font-black uppercase">
                      Strong Interest Inventory
                    </th>
                    <th className="border-[3px] border-black px-2 py-2 text-center font-black uppercase">
                      16Personalities
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Nền tảng lý thuyết RIASEC (Holland)", "●", "●", "●", "○"],
                    ["Câu hỏi tiếng Việt cho học sinh THPT", "●", "○", "○", "◐"],
                    ["Miễn phí, không cần thẻ thanh toán", "●", "●", "○", "●"],
                    ["Dữ liệu ngành – trường & tuyển sinh Việt Nam", "●", "○", "○", "○"],
                    ["Chạy trên điện thoại, cài như ứng dụng (PWA)", "●", "○", "○", "◐"],
                    ["Lộ trình học tập và gợi ý bước tiếp theo", "●", "○", "◐", "○"],
                  ].map((row, index) => (
                    <tr key={row[0]} className={index % 2 === 1 ? "bg-[var(--color-background)]" : ""}>
                      <td className="border-[3px] border-black px-2 py-2 align-top font-black">{row[0]}</td>
                      {row.slice(1).map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`border-[3px] border-black px-2 py-2 text-center align-middle text-lg font-black ${
                            cellIndex === 0 ? "bg-yellow-pop/40" : ""
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="text-xs md:text-sm space-y-1.5 pt-1">
              <li>
                <strong>Điểm mới:</strong> ghép trắc nghiệm RIASEC với hồ sơ học tập và dữ liệu tuyển sinh
                trong nước, chạy miễn phí trên điện thoại, kết quả do công thức cố định tính thay vì để AI
                tự quyết.
              </li>
              <li>
                <strong>Điểm chưa bằng:</strong> Strong Interest Inventory có bộ chuẩn hóa và tư vấn viên
                được cấp phép; Astra chưa có cả hai, nên chỉ dùng để tự khám phá, không dùng thay thế tư vấn
                chuyên môn.
              </li>
              <li>
                <strong>16Personalities</strong> đo kiểu tính cách, không đo sở thích nghề nghiệp; Astra
                không dùng MBTI và không so sánh trực tiếp kết quả hai bên.
              </li>
            </ul>
            <p className="text-xs text-black/60">
              Astra không liên kết chính thức với O*NET, Stanford / CPP (Strong), 16Personalities hay bất kỳ
              tổ chức nào được nhắc trên.
            </p>
          </Section>

          <Section icon={<Database className="w-5 h-5 stroke-[3px]" />} title="6. Dữ liệu ngành & trường">
            <p>
              Thông tin tuyển sinh được tra cứu từ các nguồn công khai trên web và hiển thị kèm đường dẫn
              nguồn khi có. Điểm chuẩn, học phí, chỉ tiêu và tổ hợp môn thay đổi theo từng năm.
            </p>
            <p>
              Vì vậy hãy luôn mở website chính thức của trường để kiểm tra lại trước khi đăng ký nguyện vọng.
              Phần giải thích do AI tạo có thể sai hoặc thiếu; số liệu quan trọng cần đối chiếu nguồn gốc.
            </p>
          </Section>

          <Section icon={<BookOpen className="w-5 h-5 stroke-[3px]" />} title="7. Nguồn tham khảo">
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Holland, J. L. (1997). <span className="italic">Making Vocational Choices: A Theory of
                Vocational Personalities and Work Environments</span> (3rd ed.). Psychological Assessment
                Resources.
              </li>
              <li>
                O*NET Interest Profiler, U.S. Department of Labor.{" "}
                <a
                  href="https://www.onetcenter.org/IP.html"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[3px] underline-offset-2 hover:bg-yellow-pop"
                >
                  onetcenter.org/IP.html
                </a>
              </li>
              <li>
                Bộ Giáo dục và Đào tạo – Chương trình giáo dục phổ thông 2018, môn Hoạt động trải nghiệm,
                hướng nghiệp ({" "}
                <a
                  href="https://moet.gov.vn"
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-[3px] underline-offset-2 hover:bg-yellow-pop"
                >
                  moet.gov.vn
                </a>
                ).
              </li>
            </ul>
            <p className="text-xs text-black/60">
              Bộ câu hỏi Astra {METHOD_VERSION} · Cập nhật {METHOD_UPDATED_AT} ·{" "}
              <Link to="/minh-chung" className="underline decoration-[2px] underline-offset-2 hover:bg-yellow-pop">
                Xem minh chứng kiểm thử
              </Link>
            </p>
          </Section>
        </div>

        <div className="mt-8 md:mt-12 bg-black text-white border-[4px] border-black p-6 md:p-8 shadow-[6px_6px_0_var(--color-primary)] flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Làm lại bài trắc nghiệm</h2>
            <p className="text-sm font-bold text-white/70 mt-1">
              60 câu, khoảng 8–12 phút. Kết quả được tính lại từ đầu.
            </p>
          </div>
          <Link
            to="/test"
            className="inline-flex items-center justify-center gap-2 bg-[var(--color-primary)] text-black border-[3px] border-white px-5 py-3 font-black uppercase tracking-wide hover:bg-white transition-colors flex-shrink-0"
          >
            Bắt đầu
            <ArrowRight className="w-5 h-5 stroke-[3px]" />
          </Link>
        </div>

        <footer className="py-8 text-center text-xs font-black uppercase tracking-widest text-black/40">
          Astra · Phương pháp công khai {METHOD_VERSION} · {METHOD_UPDATED_AT} ·{" "}
          <Link to="/minh-chung" className="underline decoration-[2px] underline-offset-2 hover:text-black">
            Minh chứng
          </Link>
        </footer>
      </main>
    </div>
  );
}
