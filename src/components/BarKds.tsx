import React, { useState, useEffect, useRef } from 'react';
import {
  Wine,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  GlassWater,
  Check,
} from 'lucide-react';
import { KdsTicket, KdsTicketStatus } from '../types/kiosk.ts';
import {
  playBarOrderReadySound,
  playNewOrderAlertSound,
  playTapSound,
  isSoundEnabled,
  setSoundEnabled,
} from '../utils/audio.ts';

interface BarKdsProps {
  onNavigateStation: (station: 'pos' | 'kitchen' | 'bar') => void;
}

export const BarKds: React.FC<BarKdsProps> = ({ onNavigateStation }) => {
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [filter, setFilter] = useState<'active' | 'ready' | 'completed'>('active');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const knownTicketIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll tickets for bar station
  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/kds/orders?station=bar&status=all');
      if (!res.ok) return;
      const data = await res.json();
      const all: KdsTicket[] = data.tickets || [];

      // Filter to only tickets that have bar items
      const barOnly = all.filter((t) => t.items.some((i) => i.station === 'bar'));

      // Check for newly arrived tickets (after initial load) to play chime
      if (initialLoadDoneRef.current) {
        const newlyArrived = barOnly.filter(
          (t) => !knownTicketIdsRef.current.has(t.id) && t.barStatus === 'pending'
        );
        if (newlyArrived.length > 0) {
          playNewOrderAlertSound();
        }
      }

      barOnly.forEach((t) => knownTicketIdsRef.current.add(t.id));
      initialLoadDoneRef.current = true;
      setTickets(barOnly);
    } catch (err) {
      console.warn('Failed to fetch bar tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (ticketId: string, newStatus: KdsTicketStatus) => {
    playTapSound();
    if (newStatus === 'ready') {
      playBarOrderReadySound();
    }

    try {
      const res = await fetch(`/api/kds/orders/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barStatus: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ...data.ticket } : t))
        );
      }
    } catch (err) {
      console.error('Error updating bar ticket status:', err);
    }
  };

  const handleToggleItem = async (ticketId: string, itemId: string) => {
    playTapSound();
    try {
      const res = await fetch(`/api/kds/orders/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ...data.ticket } : t))
        );
      }
    } catch {
      // Ignore
    }
  };

  const handleRecall = async (ticketId: string) => {
    playTapSound();
    try {
      const res = await fetch(`/api/kds/orders/${ticketId}/recall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station: 'bar' }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ...data.ticket } : t))
        );
      }
    } catch {
      // Ignore
    }
  };

  // Filtered lists
  const activeTickets = tickets.filter(
    (t) => t.barStatus === 'pending' || t.barStatus === 'preparing'
  );
  const readyTickets = tickets.filter((t) => t.barStatus === 'ready');
  const completedTickets = tickets.filter((t) => t.barStatus === 'completed');

  const displayedTickets =
    filter === 'active'
      ? activeTickets
      : filter === 'ready'
      ? readyTickets
      : completedTickets;

  return (
    <div className="min-h-screen bg-[#090B0E] text-stone-100 flex flex-col select-none">
      {/* Top Station Navigation Bar */}
      <header className="px-3 sm:px-6 py-3 bg-[#0E1217] border-b border-[#1C2530] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#162738] border border-[#27405A] flex items-center justify-center text-sky-300">
            <Wine className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brand font-bold text-base sm:text-xl text-[#F3E7C4] tracking-wide">
                AMICA BAR
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#182C3D] text-sky-300 border border-[#2A4864]">
                Cocktails & Drinks KDS
              </span>
            </div>
            <div className="text-[11px] text-stone-400 font-light flex items-center gap-2">
              <span>Cocktails · Aperitivo · Wine · Beer · Coffee</span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-300 font-mono">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Station Navigation Quick-Switcher Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#121820] border border-[#202C3A] rounded-2xl p-1">
          <button
            onClick={() => onNavigateStation('pos')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-[#1A2430] transition-colors"
          >
            🛎️ POS Main
          </button>

          <button
            onClick={() => onNavigateStation('kitchen')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-[#1A2430] transition-colors"
          >
            🍳 Kitchen KDS
          </button>

          <button
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1C364F] text-sky-200 shadow-md border border-[#2B5277]"
          >
            🍸 Bar KDS
          </button>
        </div>

        {/* Right Station Controls: Sound Bell & Multi-Window */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playBarOrderReadySound();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[#141C24] border border-[#223040] text-sky-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Test Glass Chime"
          >
            <span>Chime Glass</span>
          </button>

          <button
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
              if (next) playBarOrderReadySound();
            }}
            className="w-9 h-9 rounded-xl bg-[#141C24] border border-[#223040] text-stone-300 hover:text-white flex items-center justify-center transition-colors"
            title={soundOn ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-sky-300" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          <a
            href="/kitchen"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#141C24] border border-[#223040] text-stone-400 hover:text-white text-xs transition-colors"
            title="Open Kitchen KDS in a separate tab or screen"
          >
            <span>Open Kitchen Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Filter Tabs & Bar Stats Bar */}
      <div className="px-3 sm:px-6 py-2.5 bg-[#0C0F14] border-b border-[#1A222C] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              playTapSound();
              setFilter('active');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'active'
                ? 'bg-sky-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-[#141C24]'
            }`}
          >
            Active Drink Queue ({activeTickets.length})
          </button>

          <button
            onClick={() => {
              playTapSound();
              setFilter('ready');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'ready'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-[#141C24]'
            }`}
          >
            Ready on Bar ({readyTickets.length})
          </button>

          <button
            onClick={() => {
              playTapSound();
              setFilter('completed');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-stone-700 text-white'
                : 'text-stone-400 hover:text-white hover:bg-[#141C24]'
            }`}
          >
            Served / History ({completedTickets.length})
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-stone-400 font-light">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>&lt;3 min: Fresh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>3–6 min: Shaking</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>&gt;6 min: Rush</span>
          </div>
        </div>
      </div>

      {/* Main Bar KDS Tickets Grid */}
      <main className="flex-grow p-3 sm:p-5 overflow-y-auto">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-stone-500">
            <span>Loading bar tickets...</span>
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500">
            <CheckCircle2 className="w-12 h-12 text-stone-600 mb-3" />
            <h3 className="text-base font-serif-luxury text-stone-300">
              {filter === 'active'
                ? 'Bar Queue All Clear'
                : filter === 'ready'
                ? 'No cocktails waiting on the bar counter'
                : 'No served tickets logged yet'}
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              {filter === 'active'
                ? 'Drink orders placed via table kiosks or POS will appear here instantly.'
                : 'Cocktails and wines ready for runners will show here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
            {displayedTickets.map((ticket) => {
              const elapsedSeconds = Math.max(0, Math.floor((Date.now() - ticket.createdAt) / 1000));
              const elapsedMins = Math.floor(elapsedSeconds / 60);
              const elapsedSecsRemainder = elapsedSeconds % 60;
              const formattedTimer = `${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecsRemainder).padStart(2, '0')}`;

              // Bar timers are faster: >6 mins is rush
              const isRush = elapsedMins >= 6;
              const isWarning = elapsedMins >= 3 && elapsedMins < 6;

              const drinkItems = ticket.items.filter((i) => i.station === 'bar');

              return (
                <div
                  key={ticket.id}
                  className={`flex flex-col justify-between rounded-2xl border transition-all shadow-xl bg-[#10151C] ${
                    ticket.barStatus === 'ready'
                      ? 'border-emerald-500/80 shadow-emerald-950/30'
                      : isRush
                      ? 'border-rose-600/80 shadow-rose-950/30 ring-1 ring-rose-500/40'
                      : isWarning
                      ? 'border-amber-500/60'
                      : 'border-[#1E2938]'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3 rounded-t-2xl border-b flex items-start justify-between gap-2 ${
                      ticket.barStatus === 'ready'
                        ? 'bg-emerald-950/50 border-emerald-900/60'
                        : isRush
                        ? 'bg-rose-950/40 border-rose-900/60'
                        : 'bg-[#141C26] border-[#223042]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#F3E7C4]">
                          {ticket.table}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-black/40 text-sky-300">
                          #{ticket.orderNumber}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1.5">
                        <span className="capitalize">{ticket.orderType === 'dine_in' ? 'Table Service' : 'Express Bar'}</span>
                        <span>·</span>
                        <span>{drinkItems.length} {drinkItems.length === 1 ? 'drink' : 'drinks'}</span>
                      </div>
                    </div>

                    {/* Timer Badge */}
                    <div
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-xs font-bold tabular-nums ${
                        ticket.barStatus === 'ready'
                          ? 'bg-emerald-500 text-stone-950'
                          : isRush
                          ? 'bg-rose-600 text-white animate-pulse'
                          : isWarning
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-[#182330] text-sky-200 border border-[#253950]'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{formattedTimer}</span>
                    </div>
                  </div>

                  {/* Notes banner */}
                  {ticket.notes && (
                    <div className="px-3 py-1.5 bg-[#5C1D24]/40 border-b border-[#7D2833]/40 text-xs text-[#E5C378] font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{ticket.notes}</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-3 space-y-2 flex-grow overflow-y-auto max-h-72">
                    {drinkItems.map((item) => {
                      const optionsText = item.selectedOptions
                        ? Object.values(item.selectedOptions).join(', ')
                        : '';

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleItem(ticket.id, item.id)}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                            item.isCompleted
                              ? 'bg-black/30 border-stone-800 opacity-50'
                              : 'bg-[#141C25] border-[#223042] hover:border-[#314660]'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              item.isCompleted
                                ? 'bg-emerald-600 border-emerald-500 text-white'
                                : 'border-stone-700 bg-black/40'
                            }`}
                          >
                            {item.isCompleted && <Check className="w-3.5 h-3.5" />}
                          </div>

                          <div className="flex-grow min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xs font-bold text-sky-300 tabular-nums">
                                {item.quantity}×
                              </span>
                              <span
                                className={`text-xs font-semibold leading-snug ${
                                  item.isCompleted
                                    ? 'line-through text-stone-500'
                                    : 'text-[#F3E7C4]'
                                }`}
                              >
                                {item.name}
                              </span>
                            </div>

                            {optionsText && (
                              <div className="text-[10px] text-stone-400 mt-0.5 font-light">
                                {optionsText}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Footer Action Buttons */}
                  <div className="p-3 border-t border-[#1C2634] bg-[#0E131A] rounded-b-2xl flex flex-col gap-2">
                    {ticket.barStatus === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'preparing')}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#182636] hover:bg-[#203348] border border-[#27405A] text-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[42px] active:scale-95"
                      >
                        <GlassWater className="w-4 h-4 text-sky-400" />
                        <span>Start Mixing / Pouring</span>
                      </button>
                    )}

                    {ticket.barStatus === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'ready')}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20 hover:brightness-105 transition-all min-h-[44px] active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 text-stone-950" />
                        <span>🍸 Ready at Bar (Notify Floor)</span>
                      </button>
                    )}

                    {ticket.barStatus === 'ready' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'completed')}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all min-h-[44px] active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Runner Collected / Served</span>
                      </button>
                    )}

                    {ticket.barStatus === 'completed' && (
                      <button
                        onClick={() => handleRecall(ticket.id)}
                        className="w-full py-2 px-3 rounded-xl bg-[#141C24] hover:bg-[#1A2530] border border-[#223040] text-stone-400 hover:text-white text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[36px]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Recall Ticket</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
