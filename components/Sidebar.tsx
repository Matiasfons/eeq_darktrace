'use client';

import { 
  ChevronRight, 
  Filter, 
  UserCog, 
  ZoomIn, 
  BarChart4, 
  Eye,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Sidebar() {
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem('dt_auth');
    router.push('/login');
  };

  return (
    <aside className="w-10 h-screen flex flex-col items-center bg-dt-surface border-r border-dt-border py-2 shrink-0 fixed left-0 top-0 z-40 transition-all">
      <button className="w-full flex justify-center py-2 mb-2 hover:bg-dt-surface-light text-dt-text-secondary hover:text-dt-text transition-colors">
        <ChevronRight size={16} />
      </button>
      
      <nav className="flex flex-col w-full gap-1 flex-1">
        <NavItem href="/" icon={<Filter size={16} />} />
        <NavItem href="/" icon={<UserCog size={16} />} active className="text-[#d89345]" />
        <NavItem href="/" icon={<ZoomIn size={16} />} />
        <NavItem href="/" icon={<BarChart4 size={16} />} />
        <NavItem href="/" icon={<Eye size={16} />} />
      </nav>

      <div className="w-full mt-auto">
        <button 
          onClick={handleLogout}
          className="w-full flex justify-center py-3 border-l-2 border-transparent text-dt-text-secondary hover:text-red-400 hover:bg-dt-surface-light transition-all group"
          title="Sign Out"
        >
          <LogOut size={16} className="opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, active, className = "" }: { href: string; icon: React.ReactNode; active?: boolean; className?: string }) {
  return (
    <Link 
      href={href}
      className={`w-full flex justify-center py-2.5 border-l-2 transition-all group ${
        active 
        ? 'border-dt-purple bg-dt-surface-light text-dt-text' 
        : 'border-transparent text-dt-text-secondary hover:text-dt-text hover:bg-dt-surface-light'
      } ${className}`}
    >
      <div className={active ? '' : 'opacity-70 group-hover:opacity-100 transition-opacity'}>
        {icon}
      </div>
    </Link>
  );
}


