import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] bg-background relative overflow-hidden w-full">
      {/* Ambient Background Glows */}
      <div className="glow-bg w-[600px] h-[600px] top-[-100px] left-[-100px]" />
      <div className="glow-bg w-[800px] h-[800px] bottom-[-200px] right-[-200px] opacity-10" />
      
      <Sidebar className="hidden lg:flex glass-panel z-10" />
      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        <Header />
        <main className="flex-1 min-h-0 p-4 lg:p-6 overflow-y-auto overflow-x-hidden overscroll-y-contain no-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
