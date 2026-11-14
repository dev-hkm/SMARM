import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  adoptUser,
  ensureSessionUser,
  isLoggedOut,
  loadRemoteData,
  readStoredUser,
  USER_KEY,
} from '../lib/userSession';
import { motion } from 'motion/react';

const EMPTY_VALUES = ['', '[]', '{}', 'null'];

const hasStoredContent = (key: string) => {
  const value = localStorage.getItem(key);
  return Boolean(value && !EMPTY_VALUES.includes(value.trim()));
};

const routeAfterAuth = (navigate: (path: string, options?: { replace?: boolean }) => void) => {
  const hasData = hasStoredContent('smarm_aspirations') || hasStoredContent('smarm_answers');
  navigate(hasData ? '/dashboard' : '/welcome', { replace: true });
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(
    () => Boolean(localStorage.getItem(USER_KEY)) && !isLoggedOut(),
  );
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const submittedRef = React.useRef(false);

  useEffect(() => {
    let active = true;

    const resumeSession = async () => {
      // After an explicit logout, never silently sign the previous account back in.
      if (isLoggedOut()) {
        setChecking(false);
        return;
      }

      const result = await ensureSessionUser();
      if (!active || submittedRef.current) return;

      if (result === 'unauthenticated' || result === 'offline') {
        setChecking(false);
        return;
      }

      const storedUser = readStoredUser();
      setChecking(false);
      if (!storedUser) return;

      if (hasStoredContent('smarm_aspirations') || hasStoredContent('smarm_answers')) {
        routeAfterAuth(navigate);
      } else {
        navigate('/welcome', { replace: true });
      }
    };

    void resumeSession();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanUsername = username.trim();
    const cleanName = name.trim();

    if (!cleanUsername || !password) {
      setError('Vui lòng nhập tên đăng nhập và mật khẩu.');
      return;
    }
    if (!isLogin && cleanName.length < 2) {
      setError('Họ và tên cần có ít nhất 2 ký tự.');
      return;
    }

    submittedRef.current = true;
    setLoading(true);
    setError('');

    try {
      const response = isLogin
        ? await api.login(cleanUsername, password)
        : await api.register(cleanName, cleanUsername, password);

      if (!response || !(response.status === 'success' || response.ok) || !response.user) {
        submittedRef.current = false;
        setError(response?.message || 'Không thể xác thực. Vui lòng thử lại.');
        return;
      }

      // Tải dữ liệu máy chủ trước khi xoá localStorage để lỗi mạng không làm mất dữ liệu cũ.
      const serverData = isLogin ? await loadRemoteData() : null;
      adoptUser(response.user, serverData);

      if (!isLogin) {
        navigate('/welcome', { replace: true });
        return;
      }
      routeAfterAuth(navigate);
    } catch (err) {
      submittedRef.current = false;
      setError(err instanceof Error ? err.message : 'Không kết nối được máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-brutal-paper flex items-center justify-center p-4">
        <div className="brutal-card bg-white p-10 w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-[4px] border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-black font-black uppercase tracking-widest">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-paper flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="brutal-card bg-white p-8 md:p-10 w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-black mb-2 uppercase tracking-tighter" style={{ textShadow: "4px 4px 0 var(--color-yellow-pop)" }}>Smarm</h1>
          <p className="text-xs font-black text-black uppercase tracking-widest mb-6 border-b-[3px] border-black pb-4 inline-block">Nền Tảng Theo Dõi &amp; Định Hướng</p>
          <p className="text-black font-bold uppercase">
            {isLogin ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-pop text-black border-[3px] border-black shadow-[4px_4px_0_#000] font-bold uppercase tracking-tight text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label className="block text-sm font-black text-black uppercase mb-2">Họ và tên</label>
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full px-4 py-3 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 outline-none transition-all text-black font-bold"
                placeholder="Nhập họ và tên"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-black text-black uppercase mb-2">Tên đăng nhập</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full px-4 py-3 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 outline-none transition-all text-black font-bold"
              placeholder="Nhập tên đăng nhập"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-black uppercase mb-2">Mật khẩu</label>
            <input
              type="password"
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-3 bg-white border-[3px] border-black shadow-[4px_4px_0_#000] focus:shadow-none focus:translate-x-1 focus:translate-y-1 outline-none transition-all text-black font-bold"
              placeholder="Nhập mật khẩu"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="brutal-btn w-full py-4 px-4 bg-yellow-pop text-black font-black hover:bg-cyan-pop uppercase tracking-widest disabled:opacity-50 mt-4"
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-black font-black text-sm uppercase underline decoration-4 underline-offset-4 hover:bg-black hover:text-white px-2 py-1 transition-colors"
          >
            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
