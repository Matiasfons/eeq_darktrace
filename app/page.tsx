import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';

export default function Home() {
  return (
    <div className="flex h-screen bg-dt-bg overflow-hidden text-dt-text">
      <Sidebar />
      <TopBar />
      
      <main className="flex-1 ml-10 mt-[48px] relative flex flex-col items-center justify-center h-[calc(100vh-48px)] bg-[#0b0c10]">
        {/* Placeholder centered content to mimic empty darktrace dashboard state */}
        <div className="flex flex-col items-center opacity-30 select-none">
          <div className="w-24 h-24 mb-6 relative flex items-center justify-center">
             <svg viewBox="0 0 100 100" className="w-full h-full text-dt-text-secondary" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="50" cy="50" r="40" strokeOpacity="0.3" strokeDasharray="4 4" />
              <circle cx="50" cy="50" r="20" strokeOpacity="0.1" />
            </svg>
          </div>
          <h2 className="text-xl font-mono text-dt-text-secondary tracking-widest uppercase">System Standby</h2>
          <p className="text-xs text-dt-text-secondary mt-2">Use the Global Search to find an IP or Device</p>
        </div>
      </main>
    </div>
  );
}



