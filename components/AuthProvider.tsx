'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Use sessionStorage so it resets every time the user opens a new tab/session
    const isAuth = sessionStorage.getItem('dt_auth') === 'true';
    
    const isPublicRoute = pathname === '/login' || pathname.startsWith('/admin/');
    if (!isAuth && !isPublicRoute) {
      router.push('/login');
    } else if (isAuth && pathname === '/login') {
      router.push('/');
    }
  }, [pathname, router]);

  // Prevent flash of content while checking auth
  if (!mounted) {
    return <div className="min-h-screen bg-dt-bg" />;
  }

  // If not authenticated and not on login page, render nothing while redirecting
  const isAuth = typeof window !== 'undefined' ? sessionStorage.getItem('dt_auth') === 'true' : false;
  if (!isAuth && pathname !== '/login' && !pathname.startsWith('/admin/')) {
      return <div className="min-h-screen bg-dt-bg" />;
  }

  return <>{children}</>;
}
