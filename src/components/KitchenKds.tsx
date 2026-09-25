import React, { useState, useEffect, useRef } from 'react';
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2,
  VolumeX,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Flame,
  Check,
} from 'lucide-react';
import { KdsTicket, KdsTicketStatus } from '../types/kiosk.ts';
import {
  playKitchenBellSound,
  playNewOrderAlertSound,
  playTapSound,
  isSoundEnabled,
  setSoundEnabled,
} from '../utils/audio.ts';

interface KitchenKdsProps {
  onNavigateStation: (station: 'pos' | 'kitchen' | 'bar') => void;
}

export const KitchenKds: React.FC<KitchenKdsProps> = ({ onNavigateStation }) => {
  const [tickets, setTickets] = useState<KdsTicket[]>([]);
  const [filter, setFilter] = useState<'active' | 'ready' | 'completed'>('active');
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const knownTicketIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  // Live Soho London Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll tickets for kitchen
  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/kds/orders?station=kitchen&status=all');
      if (!res.ok) return;
      const data = await res.json();
      const all: KdsTicket[] = data.tickets || [];

      // Filter to only tickets that have kitchen items
      const kitchenOnly = all.filter((t) => t.items.some((i) => i.station === 'kitchen'));

      // Check for newly arrived tickets (after initial load) to play alert sound
      if (initialLoadDoneRef.current) {
        const newlyArrived = kitchenOnly.filter(
          (t) => !knownTicketIdsRef.current.has(t.id) && t.kitchenStatus === 'pending'
        );
        if (newlyArrived.length > 0) {
          playNewOrderAlertSound();
        }
      }

      kitchenOnly.forEach((t) => knownTicketIdsRef.current.add(t.id));
      initialLoadDoneRef.current = true;
      setTickets(kitchenOnly);
    } catch (err) {
      console.warn('Failed to fetch kitchen tickets:', err);
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
      playKitchenBellSound();
    }

    try {
      const res = await fetch(`/api/kds/orders/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitchenStatus: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ...data.ticket } : t))
        );
      }
    } catch (err) {
      console.error('Error updating kitchen ticket status:', err);
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
        body: JSON.stringify({ station: 'kitchen' }),
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
    (t) => t.kitchenStatus === 'pending' || t.kitchenStatus === 'preparing'
  );
  const readyTickets = tickets.filter((t) => t.kitchenStatus === 'ready');
  const completedTickets = tickets.filter((t) => t.kitchenStatus === 'completed');

  const displayedTickets =
    filter === 'active'
      ? activeTickets
      : filter === 'ready'
      ? readyTickets
      : completedTickets;

  return (
    <div className="min-h-screen bg-[#0A0908] text-stone-100 flex flex-col select-none">
      {/* Top Station Navigation Bar */}
      <header className="px-3 sm:px-6 py-3 bg-[#110E0C] border-b border-[#262019] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#5C1D24] border border-[#7D2833] flex items-center justify-center text-[#E5C378]">
            <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brand font-bold text-base sm:text-xl text-[#F3E7C4] tracking-wide">
                AMICA CUCINA
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#5C1D24] text-[#E5C378] border border-[#7D2833]">
                Kitchen KDS
              </span>
            </div>
            <div className="text-[11px] text-stone-400 font-light flex items-center gap-2">
              <span>Pasta · Pizza · Small Plates · Desserts</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#C89B3C] font-mono">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Station Navigation Quick-Switcher Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#171310] border border-[#2B231B] rounded-2xl p-1">
          <button
            onClick={() => onNavigateStation('pos')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-[#201A15] transition-colors"
          >
            🛎️ POS Main
          </button>

          <button
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#5C1D24] text-[#F3E7C4] shadow-md border border-[#7D2833]"
          >
            🍳 Kitchen KDS
          </button>

          <button
            onClick={() => onNavigateStation('bar')}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-400 hover:text-white hover:bg-[#201A15] transition-colors"
          >
            🍸 Bar KDS
          </button>
        </div>

        {/* Right Station Controls: Sound Bell & Multi-Window */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playKitchenBellSound();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-[#1A1613] border border-[#2E251D] text-[#E5C378] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Test Kitchen Service Bell"
          >
            <span>Ding Bell</span>
          </button>

          <button
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              setSoundEnabled(next);
              if (next) playKitchenBellSound();
            }}
            className="w-9 h-9 rounded-xl bg-[#1A1613] border border-[#2E251D] text-stone-300 hover:text-white flex items-center justify-center transition-colors"
            title={soundOn ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-[#E5C378]" /> : <VolumeX className="w-4 h-4 text-stone-500" />}
          </button>

          <a
            href="/bar"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1A1613] border border-[#2E251D] text-stone-400 hover:text-white text-xs transition-colors"
            title="Open Bar KDS in a separate tab or screen"
          >
            <span>Open Bar Tab</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Filter Tabs & Station Stats Bar */}
      <div className="px-3 sm:px-6 py-2.5 bg-[#0F0D0A] border-b border-[#241F1A] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              playTapSound();
              setFilter('active');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'active'
                ? 'bg-[#C89B3C] text-[#0C0B0A] shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-[#1A1613]'
            }`}
          >
            Active In Prep ({activeTickets.length})
          </button>

          <button
            onClick={() => {
              playTapSound();
              setFilter('ready');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'ready'
                ? 'bg-emerald-500 text-stone-950 font-bold shadow-md'
                : 'text-stone-400 hover:text-white hover:bg-[#1A1613]'
            }`}
          >
            Ready at Pass ({readyTickets.length})
          </button>

          <button
            onClick={() => {
              playTapSound();
              setFilter('completed');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'completed'
                ? 'bg-stone-700 text-white'
                : 'text-stone-400 hover:text-white hover:bg-[#1A1613]'
            }`}
          >
            Completed ({completedTickets.length})
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-stone-400 font-light">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>&lt;5 min: Fresh</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>5–10 min: In Cook</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span>&gt;10 min: Priority</span>
          </div>
        </div>
      </div>

      {/* Main KDS Tickets Grid */}
      <main className="flex-grow p-3 sm:p-5 overflow-y-auto">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-stone-500">
            <span>Loading kitchen tickets...</span>
          </div>
        ) : displayedTickets.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center text-stone-500">
            <CheckCircle2 className="w-12 h-12 text-stone-600 mb-3" />
            <h3 className="text-base font-serif-luxury text-stone-300">
              {filter === 'active'
                ? 'Kitchen Board All Clear'
                : filter === 'ready'
                ? 'No tickets waiting at the pass'
                : 'No completed tickets logged yet'}
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              {filter === 'active'
                ? 'Orders placed via POS tablet will appear here in real-time.'
                : 'Plated orders ready for floor runners will show here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
            {displayedTickets.map((ticket) => {
              const elapsedSeconds = Math.max(0, Math.floor((Date.now() - ticket.createdAt) / 1000));
              const elapsedMins = Math.floor(elapsedSeconds / 60);
              const elapsedSecsRemainder = elapsedSeconds % 60;
              const formattedTimer = `${String(elapsedMins).padStart(2, '0')}:${String(elapsedSecsRemainder).padStart(2, '0')}`;

              // Urgency status
              const isRush = elapsedMins >= 10;
              const isWarning = elapsedMins >= 5 && elapsedMins < 10;

              const foodItems = ticket.items.filter((i) => i.station === 'kitchen');

              return (
                <div
                  key={ticket.id}
                  className={`flex flex-col justify-between rounded-2xl border transition-all shadow-xl bg-[#14110E] ${
                    ticket.kitchenStatus === 'ready'
                      ? 'border-emerald-500/80 shadow-emerald-950/30'
                      : isRush
                      ? 'border-rose-600/80 shadow-rose-950/30 ring-1 ring-rose-500/40'
                      : isWarning
                      ? 'border-amber-500/60'
                      : 'border-[#2D261F]'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3 rounded-t-2xl border-b flex items-start justify-between gap-2 ${
                      ticket.kitchenStatus === 'ready'
                        ? 'bg-emerald-950/50 border-emerald-900/60'
                        : isRush
                        ? 'bg-rose-950/40 border-rose-900/60'
                        : 'bg-[#181410] border-[#2A231C]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#F3E7C4]">
                          {ticket.table}
                        </span>
                        <span className="font-mono text-xs px-2 py-0.5 rounded font-bold bg-black/40 text-[#E5C378]">
                          #{ticket.orderNumber}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1.5">
                        <span className="capitalize">{ticket.orderType === 'dine_in' ? 'Table Service' : 'Express Bar'}</span>
                        <span>·</span>
                        <span>{foodItems.length} {foodItems.length === 1 ? 'dish' : 'dishes'}</span>
                      </div>
                    </div>

                    {/* Timer Badge */}
                    <div
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-xs font-bold tabular-nums ${
                        ticket.kitchenStatus === 'ready'
                          ? 'bg-emerald-500 text-stone-950'
                          : isRush
                          ? 'bg-rose-600 text-white animate-pulse'
                          : isWarning
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-[#201B15] text-[#E5C378] border border-[#332A1F]'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{formattedTimer}</span>
                    </div>
                  </div>

                  {/* Notes / Allergy alert banner */}
                  {ticket.notes && (
                    <div className="px-3 py-1.5 bg-[#5C1D24]/40 border-b border-[#7D2833]/40 text-xs text-[#E5C378] font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{ticket.notes}</span>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-3 space-y-2 flex-grow overflow-y-auto max-h-72">
                    {foodItems.map((item) => {
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
                              : 'bg-[#181512] border-[#2A231C] hover:border-[#3D3328]'
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
                              <span className="text-xs font-bold text-[#E5C378] tabular-nums">
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
                  <div className="p-3 border-t border-[#262019] bg-[#110E0C] rounded-b-2xl flex flex-col gap-2">
                    {ticket.kitchenStatus === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'preparing')}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#221B15] hover:bg-[#2B231B] border border-[#382D22] text-[#E5C378] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[42px] active:scale-95"
                      >
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span>Start Cooking</span>
                      </button>
                    )}

                    {ticket.kitchenStatus === 'preparing' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'ready')}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C378] to-[#C89B3C] text-[#0C0B0A] font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#C89B3C]/20 hover:brightness-105 transition-all min-h-[44px] active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 text-[#0C0B0A]" />
                        <span>🔔 Mark Ready to Serve</span>
                      </button>
                    )}

                    {ticket.kitchenStatus === 'ready' && (
                      <button
                        onClick={() => handleUpdateStatus(ticket.id, 'completed')}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all min-h-[44px] active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>✓ Runner Collected / Done</span>
                      </button>
                    )}

                    {ticket.kitchenStatus === 'completed' && (
                      <button
                        onClick={() => handleRecall(ticket.id)}
                        className="w-full py-2 px-3 rounded-xl bg-[#1A1613] hover:bg-[#221D18] border border-[#2D251D] text-stone-400 hover:text-white text-xs flex items-center justify-center gap-1.5 transition-colors min-h-[36px]"
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
