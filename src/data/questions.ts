export type Question = {
  id: string;
  text: string;
  category: 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
};

export const questions: Question[] = [
  // R - Realistic
  { id: 'R1', category: 'R', text: 'Tôi thích tự tay sửa chữa hoặc lắp ráp các thiết bị điện, đồ gia dụng đơn giản.' },
  { id: 'R2', category: 'R', text: 'Tôi cảm thấy thoải mái khi làm việc ngoài trời, kể cả khi trời nóng hoặc bẩn.' },
  { id: 'R3', category: 'R', text: 'Tôi hứng thú với việc sử dụng dụng cụ, máy móc (tua vít, khoan, máy hàn, máy tiện…).' },
  { id: 'R4', category: 'R', text: 'Tôi thích những công việc cần dùng sức hoặc vận động cơ thể nhiều.' },
  { id: 'R5', category: 'R', text: 'Tôi tò mò về cách hoạt động bên trong của máy móc, thiết bị (xe máy, máy tính, điện thoại…).' },
  { id: 'R6', category: 'R', text: 'Tôi thích chăm sóc cây cối, thú nuôi hoặc làm việc liên quan đến nông nghiệp.' },
  { id: 'R7', category: 'R', text: 'Tôi thấy vui khi có thể lắp ráp mô hình, đồ chơi, hay các sản phẩm thủ công theo hướng dẫn.' },
  { id: 'R8', category: 'R', text: 'Tôi thích những công việc có hướng dẫn rõ ràng, thao tác cụ thể, ít phải nói chuyện với nhiều người.' },
  { id: 'R9', category: 'R', text: 'Tôi cảm thấy hài lòng khi hoàn thành một công việc có thể nhìn thấy kết quả vật chất (sản phẩm, công trình…).' },
  { id: 'R10', category: 'R', text: 'Tôi muốn học cách sử dụng các thiết bị kỹ thuật như máy in 3D, máy CNC, robot…' },

  // I - Investigative
  { id: 'I1', category: 'I', text: 'Tôi thích tìm hiểu lý do “tại sao” một hiện tượng lại xảy ra (trong tự nhiên, xã hội, công nghệ…).' },
  { id: 'I2', category: 'I', text: 'Tôi thấy hứng thú với các bài toán, câu đố logic hoặc trò chơi trí tuệ.' },
  { id: 'I3', category: 'I', text: 'Tôi thích đọc hoặc xem các nội dung khoa học (vật lý, hóa học, sinh học, công nghệ…).' },
  { id: 'I4', category: 'I', text: 'Khi gặp vấn đề, tôi có xu hướng phân tích kỹ nguyên nhân trước khi đưa ra quyết định.' },
  { id: 'I5', category: 'I', text: 'Tôi thích làm thí nghiệm, thử nghiệm, kiểm tra giả thuyết thay vì chỉ nghe lý thuyết.' },
  { id: 'I6', category: 'I', text: 'Tôi cảm thấy vui khi tự mình tra cứu tài liệu, số liệu để trả lời một câu hỏi khó.' },
  { id: 'I7', category: 'I', text: 'Tôi thích suy nghĩ một mình, tập trung vào vấn đề chuyên môn hơn là giao tiếp với nhiều người.' },
  { id: 'I8', category: 'I', text: 'Tôi quan tâm đến việc sử dụng dữ liệu, thống kê để rút ra kết luận.' },
  { id: 'I9', category: 'I', text: 'Tôi thích các môn học đòi hỏi suy luận (toán, khoa học, lập trình…).' },
  { id: 'I10', category: 'I', text: 'Tôi hay đặt ra câu hỏi “nếu… thì sao?” và tưởng tượng nhiều khả năng khác nhau của một vấn đề.' },

  // A - Artistic
  { id: 'A1', category: 'A', text: 'Tôi thích vẽ, thiết kế, chụp ảnh hoặc làm các sản phẩm mang tính thẩm mỹ.' },
  { id: 'A2', category: 'A', text: 'Tôi dễ bị thu hút bởi màu sắc, bố cục, âm thanh, ánh sáng đẹp xung quanh mình.' },
  { id: 'A3', category: 'A', text: 'Tôi thích viết truyện, thơ, nhật ký, nội dung sáng tạo hoặc kịch bản.' },
  { id: 'A4', category: 'A', text: 'Tôi thường có nhiều ý tưởng mới và thích thử nghiệm những cách làm khác biệt.' },
  { id: 'A5', category: 'A', text: 'Tôi thích nghe nhạc, chơi nhạc cụ hoặc ca hát, và muốn tham gia sâu hơn vào hoạt động âm nhạc.' },
  { id: 'A6', category: 'A', text: 'Tôi cảm thấy gò bó khi phải làm việc theo quy trình quá cứng nhắc, không được sáng tạo.' },
  { id: 'A7', category: 'A', text: 'Tôi thích tham gia các hoạt động biểu diễn (diễn kịch, nhảy, dẫn chương trình…).' },
  { id: 'A8', category: 'A', text: 'Tôi thích tự trang trí không gian (phòng học, góc làm việc, slide thuyết trình…) cho đẹp và khác biệt.' },
  { id: 'A9', category: 'A', text: 'Tôi hay tưởng tượng ra hình ảnh, câu chuyện hoặc thế giới riêng trong đầu mình.' },
  { id: 'A10', category: 'A', text: 'Tôi thấy hứng thú với các ngành nghề liên quan đến thiết kế, nghệ thuật, sáng tạo nội dung.' },

  // S - Social
  { id: 'S1', category: 'S', text: 'Tôi thích giải thích, hướng dẫn cho người khác hiểu một kiến thức hoặc kỹ năng nào đó.' },
  { id: 'S2', category: 'S', text: 'Tôi cảm thấy vui khi giúp ai đó vượt qua khó khăn (học tập, tâm lý, gia đình…).' },
  { id: 'S3', category: 'S', text: 'Tôi thích làm việc theo nhóm, trao đổi với bạn bè hơn là làm việc một mình.' },
  { id: 'S4', category: 'S', text: 'Tôi dễ nhận ra cảm xúc của người khác và thường quan tâm xem họ cảm thấy thế nào.' },
  { id: 'S5', category: 'S', text: 'Tôi hứng thú với các hoạt động tình nguyện, hoạt động cộng đồng, câu lạc bộ.' },
  { id: 'S6', category: 'S', text: 'Tôi cảm thấy có động lực khi được người khác tin tưởng, chia sẻ và nhờ tôi hỗ trợ.' },
  { id: 'S7', category: 'S', text: 'Tôi thích nói chuyện, lắng nghe và khuyến khích người khác trong các cuộc trò chuyện.' },
  { id: 'S8', category: 'S', text: 'Tôi quan tâm đến các ngành nghề liên quan đến giáo dục, tư vấn, y tế, chăm sóc con người.' },
  { id: 'S9', category: 'S', text: 'Tôi thường cố gắng hòa giải khi trong nhóm xảy ra mâu thuẫn.' },
  { id: 'S10', category: 'S', text: 'Tôi muốn công việc tương lai của mình mang lại lợi ích thiết thực cho nhiều người.' },

  // E - Enterprising
  { id: 'E1', category: 'E', text: 'Tôi thích đứng ra tổ chức, phân công công việc cho nhóm trong các dự án hoặc hoạt động.' },
  { id: 'E2', category: 'E', text: 'Tôi thấy hứng thú với việc thuyết trình, trình bày ý tưởng trước đám đông.' },
  { id: 'E3', category: 'E', text: 'Tôi quan tâm đến kinh doanh, khởi nghiệp hoặc ý tưởng tạo ra giá trị và lợi nhuận.' },
  { id: 'E4', category: 'E', text: 'Tôi tự tin khi đàm phán, thương lượng hoặc thuyết phục người khác.' },
  { id: 'E5', category: 'E', text: 'Tôi thích trở thành “người dẫn dắt” hơn là chỉ làm theo người khác.' },
  { id: 'E6', category: 'E', text: 'Tôi sẵn sàng chấp nhận rủi ro có tính toán để đạt được mục tiêu của mình.' },
  { id: 'E7', category: 'E', text: 'Tôi thích đọc, xem hoặc trao đổi về chủ đề tài chính, marketing, quản lý, lãnh đạo.' },
  { id: 'E8', category: 'E', text: 'Tôi cảm thấy hào hứng khi được chịu trách nhiệm kết quả chung của một nhóm hoặc dự án.' },
  { id: 'E9', category: 'E', text: 'Tôi thích xây dựng mạng lưới quan hệ, kết nối với nhiều kiểu người khác nhau.' },
  { id: 'E10', category: 'E', text: 'Tôi muốn công việc của mình có cơ hội thăng tiến, ảnh hưởng đến quyết định quan trọng.' },

  // C - Conventional
  { id: 'C1', category: 'C', text: 'Tôi thích sắp xếp tài liệu, hồ sơ, thư mục một cách gọn gàng, có hệ thống.' },
  { id: 'C2', category: 'C', text: 'Tôi cảm thấy dễ chịu khi làm việc với bảng biểu, danh sách, dữ liệu có cấu trúc.' },
  { id: 'C3', category: 'C', text: 'Tôi thích làm theo quy trình rõ ràng, biết chính xác từng bước phải làm.' },
  { id: 'C4', category: 'C', text: 'Tôi chú ý đến chi tiết và thường phát hiện lỗi nhỏ trong văn bản, số liệu hoặc bài làm.' },
  { id: 'C5', category: 'C', text: 'Tôi thấy hứng thú với các công việc liên quan đến kế toán, thống kê, quản trị hành chính.' },
  { id: 'C6', category: 'C', text: 'Tôi thích lên kế hoạch, thời gian biểu và bám sát nó trong học tập hoặc công việc.' },
  { id: 'C7', category: 'C', text: 'Tôi cảm thấy yên tâm hơn khi làm việc trong môi trường ổn định, ít thay đổi đột ngột.' },
  { id: 'C8', category: 'C', text: 'Tôi thích nhập liệu, tổng hợp, kiểm tra thông tin để đảm bảo tính chính xác.' },
  { id: 'C9', category: 'C', text: 'Tôi sẵn sàng làm những công việc lặp lại nếu nó giúp mọi thứ vận hành trơn tru.' },
  { id: 'C10', category: 'C', text: 'Tôi muốn công việc của mình có quy tắc, quy định rõ ràng, trách nhiệm cụ thể.' },
];
