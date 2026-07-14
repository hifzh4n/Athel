import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackgroundPixelStars } from "@/components/ui/background-pixel-stars";
import Shuffle from "@/components/ui/Shuffle";
import TypingEffect from "@/components/ui/typing-effect";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-black text-foreground flex flex-col items-center justify-center bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAIElEQVR42mIUEhJiwAbevXuHVZyJgUQwqmEUDB0AEGAADd8DEPTX6ksAAAAASUVORK5CYII=')] bg-[size:10px]">
      <BackgroundPixelStars />
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-6 text-center max-w-4xl mx-auto gap-6 md:gap-8 w-full">
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-balance text-white drop-shadow-lg flex flex-wrap items-center justify-center gap-x-2 md:gap-x-4">
          <Shuffle
            text="Premium AI Trading Signals for"
            tag="span"
            duration={0.5}
          />
          <Shuffle
            text="XAUUSD"
            tag="span"
            className="text-primary glow"
            duration={0.5}
          />
        </h1>

        <div className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl text-balance drop-shadow-md min-h-[4rem] flex items-center justify-center px-2">
          <TypingEffect 
            texts={["High-confluence setups powered by multi-timeframe technical analysis and AI summaries."]} 
            typingSpeed={50}
            className="text-base sm:text-lg md:text-xl font-normal"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-8 w-full sm:w-auto px-4">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full font-bold shadow-[0_0_20px_var(--primary)] hover:shadow-[0_0_30px_var(--primary)] transition-all">
              Enter Dashboard
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-full font-bold bg-black/50 border-white/20 hover:bg-white/10">
            Learn More
          </Button>
        </div>
      </main>
    </div>
  );
}
