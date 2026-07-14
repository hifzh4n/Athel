import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Ticker } from "@/components/layout/ticker";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="glow-bg w-[600px] h-[600px] top-[-100px] left-[-100px]" />
      <div className="glow-bg w-[800px] h-[800px] bottom-[-200px] right-[-200px] opacity-10" />
      
      <Sidebar className="hidden md:flex glass-panel z-10" />
      <div className="flex flex-col flex-1 min-w-0 pb-16 md:pb-0 relative z-10">
        <Header />
        <Ticker />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto overflow-x-hidden overscroll-y-contain no-scrollbar">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
