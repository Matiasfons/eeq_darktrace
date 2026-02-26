'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin12345') {
      sessionStorage.setItem('dt_auth', 'true');
      router.push('/');
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dt-bg">
      <div className="w-[450px] bg-dt-surface p-12 rounded-lg flex flex-col items-center shadow-2xl shadow-black/50 border border-dt-border">
        <div className="flex items-center gap-3 mb-2">
          {/* Logo mock */}
          <div className="relative flex items-center justify-center w-10 h-10">
            <svg viewBox="0 0 100 100" className="w-full h-full text-dt-orange animate-[spin_10s_linear_infinite]" fill="none" stroke="currentColor" strokeWidth="6">
              <circle cx="50" cy="50" r="40" strokeOpacity="0.3" />
              <path d="M50 10 A40 40 0 0 1 90 50" strokeLinecap="round" />
              <path d="M50 90 A40 40 0 0 1 10 50" className="text-dt-purple" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-dt-orange blur-[2px]" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-[#f0f0f4]">DARKTRACE</h1>
        </div>
        <p className="text-xs text-dt-text-secondary mb-10 tracking-widest opacity-80">Threat Visualizer 7.0</p>
        
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <input
            type="text"
            placeholder="admin"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[#fdf5cc] text-black font-semibold px-4 py-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-dt-purple transition-all"
          />
          <input
            type="password"
            placeholder="••••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#fdf5cc] text-black font-semibold px-4 py-3 rounded text-sm focus:outline-none focus:ring-2 focus:ring-dt-purple transition-all"
          />
          
          {error && (
            <p className="text-red-500 text-xs text-center mt-2">Invalid credentials</p>
          )}

          <button
            type="submit"
            className="w-full mt-6 bg-[#4e5b85] hover:bg-[#5c6b99] text-white font-medium py-3 rounded transition-colors text-sm shadow-[0_0_15px_rgba(78,91,133,0.3)]"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

