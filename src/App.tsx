/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Welcome from './pages/Welcome';
import Test from './pages/Test';
import Dashboard from './pages/Dashboard';
import Method from './pages/Method';
import Evidence from './pages/Evidence';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/test" element={<Test />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/phuong-phap" element={<Method />} />
            <Route path="/minh-chung" element={<Evidence />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
