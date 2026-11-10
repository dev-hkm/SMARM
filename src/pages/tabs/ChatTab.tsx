import { useState, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  ArrowUp,
  History,
  Plus,
  Trash2,
  Menu,
  X,
  MessageCircle,
  ArrowLeft,
  GraduationCap,
  Copy,
  Check,
  Download,
  Pencil,
  Search
} from "lucide-react";
import { useToast } from "../../components/Toast";
import { AiMarkdown } from "../../components/AiMarkdown";
import "katex/dist/katex.min.css";
import { api } from "../../lib/api";
import { readArray, readJson, writeJson } from "../../lib/localData";

function ThinkingIndicator() {
  return (
    <div className="flex flex-col gap-2 py-2">
      <div className="flex items-center gap-2 text-black text-sm font-black tracking-widest uppercase bg-cyan-pop px-3 py-1 border-[2px] border-black inline-flex w-max shadow-[2px_2px_0_#000]">
        <Sparkles className="w-4 h-4 text-black stroke-[3px] animate-pulse" />
        <span>Đang suy nghĩ...</span>
      </div>
    </div>
  );
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightCode(codeText: string, lang: string = "") {
  const tokenRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|(["'`](?:\\.|[^\\])*?["'`])|(\b\d+(?:\.\d+)?\b)|(\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|import|export|default|class|extends|new|this|typeof|instanceof|async|await|try|catch|finally|throw|interface|type|public|private|protected|readonly|void|int|float|double|char|bool|boolean|string|number|false|true|null|undefined|import|from|as|keyof|as|any|unknown|never|static|get|set|constructor|super|package|struct|enum)\b)/g;

  return codeText
    .split(tokenRegex)
    .map((part, index) => {
      if (!part) return "";
      
      const type = index % 5;
      if (type === 1) {
        return `<span class="text-black/50 italic font-medium">${escapeHtml(part)}</span>`;
      } else if (type === 2) {
        return `<span class="text-[var(--color-blue-pop)] font-bold">${escapeHtml(part)}</span>`;
      } else if (type === 3) {
        return `<span class="text-[var(--color-red-pop)] font-bold">${escapeHtml(part)}</span>`;
      } else if (type === 4) {
        return `<span class="text-[var(--color-primary)] font-black">${escapeHtml(part)}</span>`;
      } else {
        return escapeHtml(part);
      }
    })
    .join("");
}

function CodeBlock({ language, value }: { language: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${getFileExtension(language)}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (lang: string) => {
    const mapping: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      javascriptreact: "jsx",
      typescriptreact: "tsx",
      python: "py",
      html: "html",
      css: "css",
      json: "json",
      markdown: "md",
      cpp: "cpp",
      c: "c",
      java: "java",
      go: "go",
      rust: "rs",
    };
    return mapping[lang.toLowerCase()] || lang || "txt";
  };

  return (
    <div className="relative my-6 bg-white border-[4px] border-black shadow-[6px_6px_0_#000] font-mono text-sm leading-relaxed max-w-full">
      <div className="flex items-center justify-between px-5 py-3 bg-cyan-pop border-b-[4px] border-black text-black">
        <span className="uppercase font-black tracking-widest text-xs">{language || "code"}</span>
        <div className="flex items-center gap-4">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 font-black hover:bg-white px-2 py-1 border-[2px] border-transparent hover:border-black transition-colors"
            title="Sao chép code"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3px]" />
                <span>Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 stroke-[3px]" />
                <span>Sao chép</span>
              </>
            )}
          </button>
          <button
            onClick={downloadCode}
            className="flex items-center gap-1.5 font-black hover:bg-white px-2 py-1 border-[2px] border-transparent hover:border-black transition-colors"
            title="Tải tệp tin code"
          >
            <Download className="w-4 h-4 stroke-[3px]" />
            <span>Tải xuống</span>
          </button>
        </div>
      </div>
      <div className="p-5 overflow-x-auto custom-scrollbar bg-white/40">
        <pre className="m-0 text-black font-bold">
          <code
            dangerouslySetInnerHTML={{
              __html: highlightCode(value, language),
            }}
          />
        </pre>
      </div>
    </div>
  );
}

const MemoizedMarkdown = memo(
  ({ content }: { content: string }) => {
    return (
      <AiMarkdown
        content={content}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match;
            if (isInline) {
              return (
                <code className="bg-cyan-pop px-2 py-0.5 border-[2px] border-black text-sm font-black text-black" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock
                language={match[1]}
                value={String(children).replace(/\n$/, "")}
              />
            );
          },
        }}
      />
    );
  },
  (prev, next) => prev.content === next.content
);

type ChatTabProps = {
  onBack?: () => void;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
};

const ChatInput = memo(({
  onSend,
  isLoading
}: {
  onSend: (text: string) => void;
  isLoading: boolean;
}) => {
  const [localInput, setLocalInput] = useState("");

  const handleSend = () => {
    if (!localInput.trim() || isLoading) return;
    onSend(localInput.trim());
    setLocalInput("");
  };

  return (
    <div className="relative flex items-end bg-white border-[4px] border-black shadow-[6px_6px_0_#000] p-2 pl-6 pr-2 focus-within:shadow-[8px_8px_0_#000] transition-all duration-300">
      <textarea
        value={localInput}
        onChange={(e) => {
          setLocalInput(e.target.value);
          e.target.style.height = 'auto';
          e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
            e.currentTarget.style.height = 'auto';
          }
        }}
        placeholder="Hỏi Smarm AI..."
        className="flex-1 bg-transparent py-3 text-black placeholder:text-black/40 focus:outline-none text-base md:text-lg font-bold resize-none min-h-[48px] max-h-[120px] custom-scrollbar"
        disabled={isLoading}
        rows={1}
      />
      <div className="pl-4 flex-shrink-0 mb-1">
        <button
          onClick={handleSend}
          disabled={!localInput.trim() || isLoading}
          className="w-12 h-12 bg-cyan-pop border-[3px] border-black text-black flex items-center justify-center hover:bg-purple-pop active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:active:translate-x-0 disabled:active:translate-y-0 transition-all shadow-[2px_2px_0_#000] disabled:shadow-[2px_2px_0_#000] flex-shrink-0 cursor-pointer"
        >
          <Send className="w-6 h-6 stroke-[3px] ml-1" />
        </button>
      </div>
    </div>
  );
});

export default function ChatTab({ onBack }: ChatTabProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("smarm_current_session_id");
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1024;
    }
    return false;
  });
  const [apiWorkerStatus, setApiWorkerStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = readArray<ChatSession>("smarm_chat_sessions").filter(
      (session) => session && typeof session.id === "string" && Array.isArray(session.messages),
    );
    if (loadedSessions.length > 0) {
      setSessions(loadedSessions);
    }

    const savedActiveId = localStorage.getItem("smarm_current_session_id");
    
    if (loadedSessions.length > 0) {
      if (savedActiveId && loadedSessions.some((s) => s.id === savedActiveId)) {
        setCurrentSessionId(savedActiveId);
      } else {
        setCurrentSessionId(loadedSessions[0].id);
        localStorage.setItem("smarm_current_session_id", loadedSessions[0].id);
      }
    } else {
      createNewSession();
    }
  }, []);

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



  // Sync to server only after a stream settles, debounced so tokens do not spam writes.
  useEffect(() => {
    if (isLoading || sessions.length === 0) return;
    const timer = setTimeout(() => {
      api.syncUserData().catch((e) => console.error("Chat sync error:", e));
    }, 1500);
    return () => clearTimeout(timer);
  }, [sessions, isLoading]);

  // Debounced local persistence; keeps storage writes off the token hot path.
  useEffect(() => {
    if (sessions.length === 0) return;
    const timer = setTimeout(() => writeJson("smarm_chat_sessions", sessions), 600);
    return () => clearTimeout(timer);
  }, [sessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "nearest" });
  }, [sessions, currentSessionId]);

  const currentSession = sessions.find((s) => s.id === currentSessionId);

  const createNewSession = () => {
    const userData = readJson<{ name?: string }>("smarm_user", {});
    const attitudeMode =
      localStorage.getItem("smarm_attitude_mode") || "friend";

    let greeting = "";
    if (attitudeMode === "friend") {
      greeting = `Hế lô ${userData.name || "cậu"}! 👋 Hôm nay học hành sao rồi, có gì stress kể mình nghe nè!`;
    } else if (attitudeMode === "teacher") {
      greeting = `Chào em ${userData.name || ""}. Tình hình học tập dạo này thế nào? Có bài nào khó cần thầy/cô hỗ trợ không?`;
    } else if (attitudeMode === "parent") {
      greeting = `Đi học về chưa? Bài tập làm xong chưa mà đã ngồi bấm điện thoại đấy? Lại đây xem tình hình học hành dạo này thế nào nào!`;
    } else {
      greeting = `Chào ${userData.name || "bạn"}, tôi có thể giúp gì cho bạn hôm nay?`;
    }

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "Cuộc trò chuyện mới",
      messages: [{ id: "initial", role: "assistant", content: greeting }],
      createdAt: Date.now(),
    };

    setSessions((prev) => {
      const next = [newSession, ...prev].slice(0, 40);
      writeJson("smarm_chat_sessions", next);
      return next;
    });
    setCurrentSessionId(newSession.id);
    localStorage.setItem("smarm_current_session_id", newSession.id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const userData = readJson<{ name?: string }>("smarm_user", {});
        const attitudeMode = localStorage.getItem("smarm_attitude_mode") || "friend";
        let greeting = "";
        if (attitudeMode === "friend") {
          greeting = `Hế lô ${userData.name || "cậu"}! 👋 Hôm nay học hành sao rồi, có gì stress kể mình nghe nè!`;
        } else if (attitudeMode === "teacher") {
          greeting = `Chào em ${userData.name || ""}. Tình hình học tập dạo này thế nào? Có bài nào khó cần thầy/cô hỗ trợ không?`;
        } else if (attitudeMode === "parent") {
          greeting = `Đi học về chưa? Bài tập làm xong chưa mà đã ngồi bấm điện thoại đấy? Lại đây xem tình hình học hành dạo này thế nào nào!`;
        } else {
          greeting = `Chào ${userData.name || "bạn"}, tôi có thể giúp gì cho bạn hôm nay?`;
        }
        const newSession: ChatSession = {
          id: Date.now().toString(),
          title: "Cuộc trò chuyện mới",
          messages: [{ id: "initial", role: "assistant", content: greeting }],
          createdAt: Date.now(),
        };
        setCurrentSessionId(newSession.id);
        localStorage.setItem("smarm_current_session_id", newSession.id);
        const next = [newSession];
        writeJson("smarm_chat_sessions", next);
        return next;
      }
      
      if (currentSessionId === id && filtered.length > 0) {
        setCurrentSessionId(filtered[0].id);
        localStorage.setItem("smarm_current_session_id", filtered[0].id);
      }
      writeJson("smarm_chat_sessions", filtered);
      return filtered;
    });
  };

  const clearAllSessions = () => {
    const userData = readJson<{ name?: string }>("smarm_user", {});
    const attitudeMode = localStorage.getItem("smarm_attitude_mode") || "friend";
    let greeting = "";
    if (attitudeMode === "friend") {
      greeting = `Hế lô ${userData.name || "cậu"}! 👋 Hôm nay học hành sao rồi, có gì stress kể mình nghe nè!`;
    } else if (attitudeMode === "teacher") {
      greeting = `Chào em ${userData.name || ""}. Tình hình học tập dạo này thế nào? Có bài nào khó cần thầy/cô hỗ trợ không?`;
    } else if (attitudeMode === "parent") {
      greeting = `Đi học về chưa? Bài tập làm xong chưa mà đã ngồi bấm điện thoại đấy? Lại đây xem tình hình học hành dạo này thế nào nào!`;
    } else {
      greeting = `Chào ${userData.name || "bạn"}, tôi có thể giúp gì cho bạn hôm nay?`;
    }

    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "Cuộc trò chuyện mới",
      messages: [{ id: "initial", role: "assistant", content: greeting }],
      createdAt: Date.now(),
    };

    setSessions([newSession]);
    writeJson("smarm_chat_sessions", [newSession]);
    setCurrentSessionId(newSession.id);
    localStorage.setItem("smarm_current_session_id", newSession.id);
    showToast("Đã xóa toàn bộ lịch sử chat!", "success");
  };

  const startRenameSession = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingSessionId(id);
    setRenameTitle(currentTitle);
  };

  const saveRenameSession = (id: string) => {
    if (!renameTitle.trim()) {
      showToast("Tên cuộc trò chuyện không được để trống!", "error");
      return;
    }
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === id ? { ...s, title: renameTitle.trim() } : s));
      writeJson("smarm_chat_sessions", next);
      return next;
    });
    setRenamingSessionId(null);
    setRenameTitle("");
    showToast("Đã đổi tên cuộc trò chuyện!", "success");
  };

  const cancelRenameSession = () => {
    setRenamingSessionId(null);
    setRenameTitle("");
  };

  const sendMessage = async (userMsg: string) => {
    if (!userMsg || isLoading || !currentSessionId) return;

    const updatedMessages: Message[] = [
      ...(currentSession?.messages || []),
      { id: Date.now().toString(), role: "user", content: userMsg },
    ];

    // Update session with user message
    setSessions((prev) => {
      const next = prev.map((s) =>
        s.id === currentSessionId
          ? {
              ...s,
              messages: updatedMessages,
              title:
                s.messages.length === 1
                  ? userMsg.substring(0, 30) +
                    (userMsg.length > 30 ? "..." : "")
                  : s.title,
            }
          : s,
      );
      writeJson("smarm_chat_sessions", next);
      return next;
    });

    setIsLoading(true);
    setApiWorkerStatus("");

    let assistantMsgId = "";
    let aiContent = "";

    try {
      const userData = readJson<{ name?: string }>("smarm_user", {});
      const aspirations = readArray<any>("smarm_aspirations");
      const grades = readJson<Record<string, unknown>>("smarm_grades", {});
      const subjects = readArray<string>("smarm_subjects");
      const attitudeMode =
        localStorage.getItem("smarm_attitude_mode") || "friend";

      const aspirationsText = aspirations
        .map((a: any) => {
          let subjects = "Chưa rõ";
          if (Array.isArray(a.targetSubjects)) {
            subjects = a.targetSubjects.join(", ");
          } else if (typeof a.targetSubjects === "string") {
            subjects = a.targetSubjects;
          }
          return `${a.name} (Điểm chuẩn: ${a.targetScore}, Khối: ${subjects})`;
        })
        .join("; ");

      let systemInstruction = `Bạn là Smarm, một trợ lý AI hướng nghiệp và học tập thông minh. Tên người dùng là ${userData.name || "bạn"}.

Dữ liệu học tập hiện tại của người dùng:
- Các môn học: ${subjects.join(", ")}
- Điểm số chi tiết: ${JSON.stringify(grades)}
- Nguyện vọng đại học: ${aspirationsText}

PHONG CÁCH PHẢN HỒI (Rất quan trọng):
`;

      if (attitudeMode === "friend") {
        systemInstruction += `Hãy đóng vai một người bạn đồng trang lứa (Gen Z). Xưng hô "mình" - "bạn/cậu". Ngôn ngữ thân thiện, hay dùng emoji, thấu hiểu và động viên. Trình bày rõ ràng, dùng bullet points nếu cần.`;
      } else if (attitudeMode === "teacher") {
        systemInstruction += `Hãy đóng vai một giáo viên chủ nhiệm tận tâm nhưng nghiêm khắc. Xưng hô "thầy/cô" - "em". Đưa ra lời khuyên chuyên môn, định hướng rõ ràng. Trình bày như một bản báo cáo sư phạm, chia đề mục rõ ràng.`;
      } else if (attitudeMode === "parent") {
        systemInstruction += `Hãy đóng vai một phụ huynh châu Á điển hình, cực kỳ nghiêm khắc và có kỳ vọng rất cao. Xưng hô "bố/mẹ" - "con". Tuyệt đối KHÔNG chửi thề hoặc dùng từ ngữ thô tục. Thay vào đó, hãy dùng sự so sánh (ví dụ: "con nhà người ta"), cằn nhằn về việc lười biếng, nhấn mạnh tầm quan trọng của tương lai và sự hy sinh của cha mẹ. Phản hồi mang tính chất "thương cho roi cho vọt", gắt gỏng nhưng vẫn thể hiện sự quan tâm sâu sắc đến tương lai của con. Trình bày có cấu trúc rõ ràng.`;
      }

      systemInstruction += `\n\nYÊU CẦU TRÌNH BÀY:
1. SỬ DỤNG MÃ LATEX CHO TOÁN, LÝ, HÓA:
   - Công thức hiển thị trên 1 dòng riêng biệt (block): Dùng \`$$ công thức $$\`. (Ví dụ: $$ x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} $$). Tuyệt đối KHÔNG dùng \`\\[...\\]\`.
   - Công thức nằm trong dòng chữ (inline): Dùng \`$ công thức $\`. (Ví dụ: $E=mc^2$). Tuyệt đối KHÔNG dùng \`\\(...\\)\`.
2. Sử dụng Markdown chuẩn để chia đề mục (H2, H3), in đậm các thông tin quan trọng.
3. Phản hồi phải dựa trên dữ liệu điểm số và nguyện vọng của người dùng để đưa ra lời khuyên thực tế.
4. KHÔNG sử dụng các ký tự rác như * hoặc # một cách bừa bãi.`;

      const apiMessages = [
        { role: "system", content: systemInstruction },
        ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      // Add a placeholder message for the assistant stream
      assistantMsgId = (Date.now() + 1).toString();
      const initialAssistantMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
      };

      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...updatedMessages, initialAssistantMsg] }
            : s,
        );
        writeJson("smarm_chat_sessions", next);
        return next;
      });

      const response = await api.deepseekChat(
        apiMessages,
        undefined,
        (chunk) => {
          aiContent += chunk;
          setSessions((prev) =>
            prev.map((s) =>
              s.id === currentSessionId
                ? {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMsgId
                        ? { ...m, content: aiContent }
                        : m,
                    ),
                  }
                : s,
            ),
          );
        },
      );

      if (!aiContent.trim()) {
        throw new Error("AI trả về nội dung rỗng");
      }

      if (!response || !response.choices || !response.choices[0]) {
        throw new Error("Invalid response from AI");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const partial = aiContent;
      const errorMsgText = partial.trim()
        ? `${partial}\n\n_Liên kết bị ngắt giữa chừng, bạn thử gửi lại nhé._`
        : "Hệ thống đang gặp chút trục trặc, đợi tí nhé!";
      setSessions((prev) => {
        const next: ChatSession[] = prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: s.messages.some((m) => m.id === assistantMsgId)
                  ? s.messages.map((m) =>
                      m.id === assistantMsgId
                        ? ({ ...m, content: errorMsgText } as Message)
                        : m,
                    )
                  : [
                      ...s.messages,
                      {
                        id: Date.now().toString(),
                        role: "assistant" as const,
                        content: errorMsgText,
                      },
                    ],
              }
            : s,
        );
        writeJson("smarm_chat_sessions", next);
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-transparent overflow-hidden relative">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-black/60 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative bg-transparent">
        {/* Floating Header */}
        <div className="w-full p-3 md:p-4 pb-0 flex-shrink-0 flex justify-center z-30">
          <header className="w-full max-w-6xl bg-white border-[3px] border-black p-2 md:p-3 flex items-center justify-between shadow-[4px_4px_0_#000] pointer-events-auto">
            {/* Left: Navigation Controls */}
            <div className="flex items-center">
              <button
                onClick={() => onBack ? onBack() : window.history.back()}
                className="p-2 text-black bg-red-pop hover:bg-white border-[2.5px] border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 font-black text-xs uppercase"
                title="Quay lại Dashboard"
              >
                <ArrowLeft className="w-4 h-4 stroke-[3px]" />
                <span className="hidden sm:inline">Thoát</span>
              </button>
            </div>

            {/* Center: Bot Info */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-black border-[2px] border-black flex items-center justify-center text-white shadow-[2px_2px_0_#000] flex-shrink-0">
                <Bot className="w-4.5 h-4.5 md:w-5 md:h-5 stroke-[2.5px]" />
              </div>
              <div className="text-left">
                <h1 className="text-sm md:text-lg font-black text-black tracking-tight uppercase leading-none">
                  Smarm AI
                </h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-pop rounded-full border border-black animate-pulse"></span>
                  <span className="text-[8px] md:text-[9px] font-black uppercase text-black/50">Trực tuyến</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action & Sidebar Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={createNewSession}
                className="p-2 text-black bg-cyan-pop hover:bg-white border-[2.5px] border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 font-black text-xs uppercase"
                title="Tạo cuộc trò chuyện mới"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span className="hidden sm:inline">Chat mới</span>
              </button>

              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-black bg-white hover:bg-cyan-pop border-[2.5px] border-black shadow-[3px_3px_0_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center gap-1.5 font-black text-xs uppercase"
                title="Lịch sử trò chuyện"
              >
                <History className="w-5 h-5 stroke-[3px]" />
                <span className="hidden sm:inline">Lịch sử</span>
              </button>
            </div>
          </header>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden relative">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-12 pt-6 pb-36 space-y-10 custom-scrollbar">
            {currentSession?.messages.length === 1 && (
              <div className="flex flex-col items-center justify-center py-12">
                 <div className="w-24 h-24 bg-cyan-pop border-[4px] border-black flex items-center justify-center mb-8 shadow-[6px_6px_0_#000]">
                    <Bot className="w-12 h-12 text-black stroke-[3px]" />
                 </div>
                 <p className="text-black text-lg font-bold text-center max-w-md bg-white p-6 border-[4px] border-black shadow-[6px_6px_0_#000]">
                   Mình đã sẵn sàng! Bạn có thể hỏi mình về bài tập Toán, Lý, Hóa hoặc cần lời khuyên về nguyện vọng đại học nhé.
                 </p>
              </div>
            )}
            {currentSession?.messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex w-full"
              >
                <div className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[90%] md:max-w-[80%] gap-4 md:gap-6 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div
                      className={`w-10 h-10 md:w-12 md:h-12 border-[3px] border-black flex items-center justify-center flex-shrink-0 shadow-[4px_4px_0_#000] ${
                        msg.role === "user"
                          ? "bg-cyan-pop text-black"
                          : "bg-white text-black"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <User className="w-6 h-6 md:w-7 md:h-7 stroke-[3px]" />
                      ) : (
                        <Bot className="w-6 h-6 md:w-7 md:h-7 stroke-[3px]" />
                      )}
                    </div>
                    <div className={`flex flex-col min-w-0 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className="text-xs font-black text-black uppercase tracking-widest mb-2 px-2 bg-white border-[2px] border-black inline-block shadow-[2px_2px_0_#000]">
                        {msg.role === "user" ? "Bạn" : "Smarm AI"}
                      </div>
                      {msg.role === "user" ? (
                        <div className="px-6 py-4 bg-white border-[4px] border-black text-black shadow-[6px_6px_0_#000]">
                          <div className="text-base font-bold leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 text-black w-full">
                          {msg.content === "" ? (
                            <ThinkingIndicator />
                          ) : (
                            <div className="markdown-body neubrutalism-markdown text-base font-medium">
                              <MemoizedMarkdown content={msg.content} />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input Area */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-transparent pointer-events-none z-20 flex justify-center w-full">
            <div className="w-full max-w-4xl pointer-events-auto">
              <ChatInput onSend={sendMessage} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : 320,
          width: isSidebarOpen ? 320 : 0,
          opacity: isSidebarOpen ? 1 : 0,
        }}
        className={`absolute right-0 lg:relative h-full bg-white ${isSidebarOpen ? 'border-l-[4px]' : 'border-l-0'} border-black z-50 flex flex-col overflow-hidden transition-all duration-300`}
      >
        <div className="p-6 flex items-center justify-between border-b-[4px] border-black bg-cyan-pop">
          <h2 className="font-black text-2xl text-black flex items-center uppercase tracking-tight">
            <History className="w-6 h-6 mr-3 stroke-[3px]" />
            Lịch sử chat
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 text-black hover:bg-white border-[3px] border-transparent hover:border-black transition-all bg-white shadow-[2px_2px_0_#000] cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[4px]" />
          </button>
        </div>

        {/* Action Buttons Header */}
        <div className="p-4 border-b-[4px] border-black bg-white flex gap-3">
          <button
            onClick={createNewSession}
            className="flex-1 flex items-center justify-center gap-2 bg-cyan-pop text-black py-3 px-4 border-[3px] border-black font-black text-base uppercase tracking-tight hover:bg-purple-pop active:translate-x-1 active:translate-y-1 shadow-[4px_4px_0_#000] active:shadow-none transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3px]" />
            Chat mới
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={sessions.length === 0}
            className="p-3 text-black bg-red-pop border-[3px] border-black shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:active:translate-y-0 disabled:shadow-[4px_4px_0_#000] cursor-pointer"
            title="Xóa tất cả lịch sử"
          >
            <Trash2 className="w-5 h-5 stroke-[3px]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3 border-b-[4px] border-black bg-yellow-pop flex items-center">
          <div className="relative w-full flex items-center bg-white border-[3px] border-black shadow-[2px_2px_0_#000] focus-within:shadow-[4px_4px_0_#000] transition-all">
            <Search className="w-4 h-4 ml-2.5 text-black stroke-[3px] flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm cuộc trò chuyện..."
              className="w-full bg-transparent py-2 px-2.5 text-black placeholder:text-black/45 font-bold focus:outline-none text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 mr-2 text-black hover:bg-black/10 transition-colors border border-transparent hover:border-black rounded-sm flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white">
          {(() => {
            const filteredSessions = sessions.filter((session) =>
              session.title.toLowerCase().includes(searchQuery.toLowerCase())
            );

            if (filteredSessions.length === 0) {
              return (
                <div className="text-center py-8 px-4 border-[3px] border-black border-dashed bg-white shadow-[2px_2px_0_#000]">
                  <p className="text-black/60 font-bold text-sm">
                    {searchQuery ? "Không tìm thấy cuộc trò chuyện nào!" : "Không có lịch sử trò chuyện"}
                  </p>
                </div>
              );
            }

            return filteredSessions.map((session) => {
              const isActive = currentSessionId === session.id;
              const isRenaming = renamingSessionId === session.id;

              if (isRenaming) {
                return (
                  <div
                    key={session.id}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-left p-3.5 border-[3px] border-black bg-white shadow-[4px_4px_0_#000] flex items-center gap-3"
                  >
                    <Pencil className="w-5 h-5 flex-shrink-0 stroke-[3px] text-purple-pop" />
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          saveRenameSession(session.id);
                        } else if (e.key === "Escape") {
                          cancelRenameSession();
                        }
                      }}
                      onBlur={() => saveRenameSession(session.id)}
                      autoFocus
                      className="flex-1 bg-white border-[2px] border-black px-2 py-1 font-bold text-sm text-black focus:outline-none focus:bg-cyan-pop/10"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                );
              }

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    setCurrentSessionId(session.id);
                    localStorage.setItem("smarm_current_session_id", session.id);
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`w-full text-left p-3.5 border-[3px] border-black transition-all group relative flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? "bg-purple-pop/15 shadow-[4px_4px_0_#000] translate-x-[-2px] translate-y-[-2px]"
                      : "bg-white hover:bg-cyan-pop/15 hover:shadow-[4px_4px_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                  }`}
                >
                  <MessageCircle
                    className={`w-5 h-5 flex-shrink-0 stroke-[3px] ${
                      isActive ? "text-purple-pop fill-purple-pop/20" : "text-black"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-base font-black truncate text-black uppercase tracking-tight`}
                    >
                      {session.title}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-black/60 font-bold">
                      <span>
                        {new Date(session.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                      <span className="bg-black/5 px-1.5 py-0.5 border border-black/10 rounded-sm">
                        {session.messages.length - 1} tin nhắn
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={(e) => startRenameSession(session.id, session.title, e)}
                      className="p-1.5 text-black bg-yellow-pop hover:bg-white border-[2px] border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      title="Đổi tên"
                    >
                      <Pencil className="w-3.5 h-3.5 stroke-[3px]" />
                    </button>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="p-1.5 text-black bg-red-pop hover:bg-white border-[2px] border-black shadow-[2px_2px_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      title="Xóa cuộc trò chuyện"
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[3px]" />
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </motion.aside>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white border-[4px] border-black p-6 shadow-[8px_8px_0_#000] max-w-sm w-full">
            <h3 className="font-black text-xl text-black uppercase tracking-tight mb-2">
              Xóa lịch sử?
            </h3>
            <p className="text-black font-bold text-sm mb-6">
              Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 bg-white hover:bg-black/5 text-black py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-tight transition-all active:translate-x-1 active:translate-y-1 shadow-[3px_3px_0_#000] active:shadow-none cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  clearAllSessions();
                  setShowClearConfirm(false);
                }}
                className="flex-1 bg-red-pop hover:bg-red-600 text-black py-2.5 border-[3px] border-black font-black text-sm uppercase tracking-tight transition-all active:translate-x-1 active:translate-y-1 shadow-[3px_3px_0_#000] active:shadow-none cursor-pointer"
              >
                Xóa hết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
