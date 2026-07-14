import { create } from "zustand";
import { Signal } from "../types";
import { ref, onValue } from "firebase/database";
import { realtimeDb } from "../lib/firebase";

interface SignalState {
  signals: Signal[];
  activeSignals: Signal[];
  historySignals: Signal[];
  audioUnlocked: boolean;
  livePrices: Record<string, { price: number; direction: 'up' | 'down' }>;
  unlockAudio: () => void;
  setSignals: (signals: Signal[]) => void;
  listenToCurrentSignal: () => void;
  listenToLivePrice: () => void;
}

let lastActiveId = '';
let audioCtx: AudioContext | null = null;
let isListeningToPrice = false;

// Unlock audio context via user gesture (required on mobile)
function unlockAudioContext() {
  if (typeof window === 'undefined') return;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playChime() {
  try {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.6);
  } catch (e) {
    console.log('Audio playback failed:', e);
  }
}

export const useSignalStore = create<SignalState>((set) => ({
  signals: [],
  activeSignals: [],
  historySignals: [],
  audioUnlocked: false,
  livePrices: {},
  unlockAudio: () => {
    unlockAudioContext();
    set({ audioUnlocked: true });
  },
  setSignals: (signals) => set({ signals }),
  listenToLivePrice: () => {
    if (isListeningToPrice) return;
    isListeningToPrice = true;
    const livePriceRef = ref(realtimeDb, 'live_prices');
    onValue(livePriceRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        set((state) => {
          const newPrices = { ...state.livePrices };
          for (const key in data) {
            const symData = data[key];
            if (symData && symData.price) {
              const oldPrice = newPrices[key]?.price;
              let newDirection: 'up' | 'down' = newPrices[key]?.direction || 'up';
              if (oldPrice !== undefined) {
                if (symData.price > oldPrice) newDirection = 'up';
                else if (symData.price < oldPrice) newDirection = 'down';
              }
              newPrices[key] = { price: symData.price, direction: newDirection };
            }
          }
          return { livePrices: newPrices };
        });
      }
    });
  },
  listenToCurrentSignal: () => {
    const signalsRef = ref(realtimeDb, 'signals');
    onValue(signalsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const signalsArray: Signal[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Sort by createdAt or updatedAt descending
        signalsArray.sort((a, b) => {
          const aTime = new Date(a.createdAt || a.updatedAt).getTime();
          const bTime = new Date(b.createdAt || b.updatedAt).getTime();
          return bTime - aTime;
        });

        const active = signalsArray.filter(s => s.status === 'ACTIVE' || s.status.includes('DEVELOPING'));
        const history = signalsArray.filter(s => s.status.includes('COMPLETED'));

        if (active.length > 0 && active[0].id) {
          const currentLatestId = active[0].id;
          if (lastActiveId !== '' && lastActiveId !== currentLatestId) {
            playChime();
          }
          lastActiveId = currentLatestId;
        }

        set({
          signals: signalsArray,
          activeSignals: active,
          historySignals: history
        });
      }
    });
  }
}));

