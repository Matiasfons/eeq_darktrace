import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import DeviceView from '@/components/DeviceView';

export default async function DevicePage({ params }: { params: Promise<{ ip: string }> }) {
  const { ip } = await params;
  const decodedIp = decodeURIComponent(ip);

  return (
    <div className="flex h-screen bg-dt-bg overflow-hidden text-dt-text">
      <Sidebar />
      <TopBar />

      <main className="flex-1 ml-10 mt-[48px] relative flex h-[calc(100vh-48px)] min-w-0 overflow-hidden">
        <DeviceView ip={decodedIp} />
      </main>
    </div>
  );
}
