import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellRing,
  UtensilsCrossed,
  Wine,
  CheckCircle2,
  X,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { PosNotification } from '../types/kiosk.ts';
import { playKitchenBellSound, playBarOrderReadySound, playTapSound } from '../utils/audio.ts';

interface PosNotificationCenterProps {
  onNavigateToKds?: (station: 'kitchen' | 'bar') => void;
}

export const PosNotificationCenter: React.FC<PosNotificationCenterProps> = ({
  onNavigateToKds,
}) => {
  const [notifications, setNotifications] = useState<PosNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [floatingToast, setFloatingToast] = useState<PosNotification | null>(null);
  const knownNotifIdsRef = useRef<Set<string>>(new Set());
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Poll server for active ready notifications every 2.5s
  useEffect(() => {
    let isMounted = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/kds/notifications');
        if (!res.ok) return;
        const data = await res.json();
        const active: PosNotification[] = data.notifications || [];

        if (!isMounted) return;

        // Detect newly arrived ready notifications to play audio & show banner
        const newOnes = active.filter((n) => !knownNotifIdsRef.current.has(n.id));

        if (newOnes.length > 0) {
          // Play specific station sound for the latest notification
          const latest = newOnes[0];
          if (latest.station === 'kitchen') {
            playKitchenBellSound();
          } else {
            playBarOrderReadySound();
          }

          // Show high-priority floating toast on POS Main
          setFloatingToast(latest);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => {
            setFloatingToast(null);
          }, 8000);

          // Record in known set
          newOnes.forEach((n) => knownNotifIdsRef.current.add(n.id));
        }

        // Update notifications list
        setNotifications(active);
      } catch (err) {
        console.warn('Failed to poll POS notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleDismiss = async (notifId: string) => {
    playTapSound();
    try {
      await fetch(`/api/kds/notifications/${notifId}/dismiss`, { method: 'POST' });
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));
      if (floatingToast?.id === notifId) {
        setFloatingToast(null);
      }
    } catch {
      // Ignore
    }
  };

  const handleClearAll = async () => {
    playTapSound();
    try {
      await fetch('/api/kds/notifications/clear-all', { method: 'POST' });
      setNotifications([]);
      setFloatingToast(null);
      setIsOpen(false);
    } catch {
      // Ignore
    }
  };

  const activeCount = notifications.length;

  return (
    <>
      {/* Floating Popup Banner for Instant Floor Staff Notification */}
      {floatingToast && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm sm:max-w-md w-full animate-slide-up select-none">
          <div className="bg-[#171410] border-2 border-[#C89B3C] rounded-2xl p-3.5 sm:p-4 shadow-2xl shadow-black/80 flex items-start gap-3 backdrop-blur-md">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                floatingToast.station === 'kitchen'
                  ? 'bg-[#5C1D24] border-[#7D2833] text-[#E5C378]'
                  : 'bg-[#1A2634] border-[#2A3F55] text-sky-300'
              }`}
            >
              {floatingToast.station === 'kitchen' ? (
                <UtensilsCrossed className="w-5 h-5" />
              ) : (
                <Wine className="w-5 h-5" />
              )}
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-[#F3E7C4]">
                    {floatingToast.table} Ready
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#C89B3C] text-[#0C0B0A]">
                    {floatingToast.orderNumber}
                  </span>
                </div>
                <button
                  onClick={() => setFloatingToast(null)}
                  className="text-stone-400 hover:text-white p-1"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-stone-200 mt-1 font-medium truncate">
                {floatingToast.itemsSummary}
              </div>

              <div className="text-[10px] text-[#C89B3C] mt-0.5 flex items-center gap-1 font-light">
                <span>{floatingToast.station === 'kitchen' ? '🍽️ Plated & hot at Kitchen pass' : '🍸 Shaken & ready at Bar counter'}</span>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => handleDismiss(floatingToast.id)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#E5C378] text-[#0C0B0A] text-xs font-bold hover:brightness-105 active:scale-95 transition-all flex items-center gap-1 min-h-[36px]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Runner Collected</span>
                </button>

                {onNavigateToKds && (
                  <button
                    onClick={() => {
                      playTapSound();
                      onNavigateToKds(floatingToast.station);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-[#201C17] text-stone-300 hover:text-white border border-[#332A20] text-xs transition-colors flex items-center gap-1 min-h-[36px]"
                  >
                    <span>View in {floatingToast.station === 'kitchen' ? 'Kitchen' : 'Bar'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Ready Trigger Pill / Button on POS Main when items are ready */}
      {activeCount > 0 && !isOpen && (
        <button
          onClick={() => {
            playTapSound();
            setIsOpen(true);
          }}
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 bg-[#5C1D24] border-2 border-[#C89B3C] hover:border-[#E5C378] text-[#F3E7C4] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 transition-all hover:scale-105 active:scale-95 animate-pulse min-h-[48px]"
        >
          <div className="relative">
            <BellRing className="w-5 h-5 text-[#E5C378]" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#E5C378] text-[#0C0B0A] text-[10px] font-extrabold flex items-center justify-center">
              {activeCount}
            </span>
          </div>
          <div className="text-left">
            <div className="text-xs font-bold tracking-wide">
              {activeCount} {activeCount === 1 ? 'Order' : 'Orders'} Ready to Serve
            </div>
            <div className="text-[10px] text-[#E5C378] font-light">
              Tap for runner dispatch
            </div>
          </div>
        </button>
      )}

      {/* Slide-over Drawer with all Ready Orders */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm select-none animate-fade-in">
          <div
            className="flex-grow"
            onClick={() => setIsOpen(false)}
            aria-label="Close runner dispatch drawer"
          />

          <div className="relative w-full max-w-md bg-[#120F0D] border-l border-[#2B231B] h-full flex flex-col shadow-2xl p-4 sm:p-5 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#241F1A]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#5C1D24] border border-[#7D2833] flex items-center justify-center text-[#E5C378]">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-brand font-bold text-base text-[#F3E7C4]">
                    Ready for Runner
                  </h3>
                  <div className="text-[11px] text-[#C89B3C]">
                    Orders plated & awaiting delivery to tables
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-xl bg-[#1A1613] text-stone-400 hover:text-white flex items-center justify-center border border-[#2B231B]"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Ready Orders */}
            <div className="flex-grow py-4 space-y-3 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center text-stone-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mb-2" />
                  <p className="text-sm font-semibold text-stone-400">All orders dispatched</p>
                  <p className="text-xs text-stone-600 font-light mt-0.5">
                    No items currently waiting at kitchen pass or bar counter.
                  </p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - notif.readyAt) / 1000));
                  const minutes = Math.floor(elapsedSeconds / 60);
                  const seconds = elapsedSeconds % 60;
                  const timeFormatted = `${minutes}m ${seconds}s ago`;

                  return (
                    <div
                      key={notif.id}
                      className="p-3.5 rounded-2xl bg-[#181410] border border-[#2C241D] hover:border-[#C89B3C]/50 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              notif.station === 'kitchen'
                                ? 'bg-[#5C1D24] text-[#E5C378]'
                                : 'bg-[#182C3D] text-sky-300'
                            }`}
                          >
                            {notif.station === 'kitchen' ? '🍽️ Kitchen' : '🍸 Bar'}
                          </span>
                          <span className="font-bold text-sm text-[#F3E7C4]">
                            {notif.table}
                          </span>
                          <span className="text-xs font-mono text-stone-400">
                            #{notif.orderNumber}
                          </span>
                        </div>

                        <span className="text-[10px] text-stone-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-500" />
                          {timeFormatted}
                        </span>
                      </div>

                      <div className="text-xs text-stone-200 font-medium pl-1">
                        {notif.itemsSummary}
                      </div>

                      <div className="pt-2 border-t border-[#231D17] flex items-center justify-between">
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Ready at pass
                        </span>

                        <button
                          onClick={() => handleDismiss(notif.id)}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#E5C378] text-[#0C0B0A] text-xs font-bold hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Served</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Drawer Footer Actions */}
            {notifications.length > 0 && (
              <div className="pt-3 border-t border-[#241F1A] flex items-center justify-between">
                <button
                  onClick={handleClearAll}
                  className="text-xs text-stone-500 hover:text-stone-300 py-2 px-1"
                >
                  Dismiss all
                </button>

                <div className="flex gap-2">
                  {onNavigateToKds && (
                    <>
                      <button
                        onClick={() => {
                          playTapSound();
                          setIsOpen(false);
                          onNavigateToKds('kitchen');
                        }}
                        className="px-3 py-2 rounded-xl bg-[#1A1613] border border-[#2B231B] text-stone-300 hover:text-white text-xs font-medium"
                      >
                        Kitchen KDS
                      </button>
                      <button
                        onClick={() => {
                          playTapSound();
                          setIsOpen(false);
                          onNavigateToKds('bar');
                        }}
                        className="px-3 py-2 rounded-xl bg-[#1A1613] border border-[#2B231B] text-stone-300 hover:text-white text-xs font-medium"
                      >
                        Bar KDS
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
