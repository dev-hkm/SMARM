import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-brutal-paper flex items-center justify-center p-4">
        <div className="brutal-card bg-white p-8 md:p-10 w-full max-w-md text-center">
          <h1 className="text-2xl font-black text-black uppercase tracking-tight mb-4">
            Có lỗi xảy ra
          </h1>
          <p className="text-base font-bold text-black/80 mb-6">
            Ứng dụng gặp sự cố khi hiển thị. Dữ liệu đã lưu vẫn an toàn, bạn tải lại trang để tiếp tục nhé.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="brutal-btn font-black uppercase bg-[var(--color-yellow-pop)] border-black px-6 py-3 shadow-[4px_4px_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }
}
