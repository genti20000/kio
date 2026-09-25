import React, { useState } from 'react';
import { X, CreditCard, RefreshCw, Layers, Volume2, VolumeX, ShieldCheck, Check, Wifi, AlertTriangle } from 'lucide-react';
import { SumUpReader, KioskConfig, Product } from '../types/kiosk.ts';
import { playTapSound, isSoundEnabled, setSoundEnabled } from '../utils/audio.ts';

interface AdminSettingsModalProps {
  config: KioskConfig;
  readers: SumUpReader[];
  products: Product[];
  onClose: () => void;
  onUpdateConfig: (newConfig: Partial<KioskConfig> & { apiKey?: string }) => Promise<void>;
  onRefreshReaders: () => Promise<void>;
  onAdjustStock: (productId: string, delta: number) => Promise<void>;
  onResetStock: () => Promise<void>;
  isOnline: boolean;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  config,
  readers,
  products,
  onClose,
  onUpdateConfig,
  onRefreshReaders,
  onAdjustStock,
  onResetStock,
  isOnline,
}) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'inventory' | 'sound'>('terminal');
  const [selectedReader, setSelectedReader] = useState(config.selectedReaderId);
  const [simulationMode, setSimulationMode] = useState(config.simulationMode);
  const [merchantCode, setMerchantCode] = useState(config.merchantCode);
  const [apiKey, setApiKey] = useState('');
  const [currency, setCurrency] = useState(config.currency);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [scanError, setScanError] = useState<{ message: string; detail?: string; isScopes?: boolean } | null>(null);
  const [pairingCode, setPairingCode] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [pairingMsg, setPairingMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [manualReaderId, setManualReaderId] = useState('');

  const handleSaveConfig = async () => {
    setIsSaving(true);
    playTapSound();
    try {
      const activeIdToSave = manualReaderId.trim() || selectedReader;
      await onUpdateConfig({
        simulationMode,
        selectedReaderId: activeIdToSave,
        merchantCode,
        currency,
        apiKey: apiKey.trim() || undefined,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setScanError(null);
    playTapSound();
    try {
      const res = await fetch('/api/readers');
      const data = await res.json();
      if (!res.ok || data.error === 'INSUFFICIENT_SCOPES') {
        if (data.error === 'INSUFFICIENT_SCOPES' || res.status === 403) {
          setScanError({
            message: 'Your SumUp API key is missing required permissions: [readers.read, terminals.read].',
            detail: 'When generating the API key at me.sumup.com/developers/api-keys, you must check the "Readers" and "Terminals" permission boxes.',
            isScopes: true,
          });
        } else {
          setScanError({
            message: data.message || data.error || 'Failed to scan readers.',
            detail: data.detail,
          });
        }
      }
      await onRefreshReaders();
    } catch (err: any) {
      setScanError({ message: 'Network error checking readers.', detail: err.message });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePairReader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingCode.trim()) return;
    setIsPairing(true);
    setPairingMsg(null);
    playTapSound();

    try {
      const res = await fetch('/api/readers/pair', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairingCode: pairingCode.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPairingMsg({ success: true, text: `SumUp Solo paired! ID: ${data.reader.id || data.reader.identifier}` });
        setSelectedReader(data.reader.id || data.reader.identifier);
        setPairingCode('');
        await onRefreshReaders();
      } else {
        setPairingMsg({
          success: false,
          text: data.detail || data.error || 'Pairing failed. Ensure Solo is showing the 8-digit code.',
        });
      }
    } catch {
      setPairingMsg({ success: false, text: 'Network error communicating with SumUp.' });
    } finally {
      setIsPairing(false);
    }
  };

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playTapSound();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        {/* Mobile handle indicator */}
        <div className="sm:hidden py-2 flex justify-center cursor-pointer" onClick={onClose}>
          <div className="w-12 h-1 rounded-full bg-stone-700" />
        </div>

        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-stone-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Kiosk Manager & Terminal Hub</h2>
              <p className="text-[11px] sm:text-xs text-stone-400">Configure SumUp Cloud Reader & Real-Time Stock</p>
            </div>
          </div>

          <button
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="w-10 h-10 rounded-xl bg-stone-800 text-stone-300 hover:text-white flex items-center justify-center min-h-[44px] min-w-[44px]"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-stone-800 px-3 sm:px-6 bg-stone-950/60 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => {
              playTapSound();
              setActiveTab('terminal');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors min-h-[44px] ${
              activeTab === 'terminal'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>SumUp Terminal</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              setActiveTab('inventory');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors min-h-[44px] ${
              activeTab === 'inventory'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Live Inventory</span>
          </button>

          <button
            onClick={() => {
              playTapSound();
              setActiveTab('sound');
            }}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors min-h-[44px] ${
              activeTab === 'sound'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Kiosk Audio</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          {activeTab === 'terminal' && (
            <div className="space-y-6">
              {/* Simulation Mode Toggle */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Payment Mode</h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {simulationMode
                      ? 'Currently running with simulated SumUp readers and test cards.'
                      : 'Connecting to live SumUp Cloud merchant API endpoints.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setSimulationMode(!simulationMode);
                  }}
                  className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors ${
                    simulationMode ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      simulationMode ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Paired Readers List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                    Discovered SumUp Readers
                  </label>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 min-h-[36px]"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>Scan Readers</span>
                  </button>
                </div>

                {/* Scope Error Banner */}
                {scanError && (
                  <div className={`p-4 rounded-2xl border text-xs ${
                    scanError.isScopes
                      ? 'bg-rose-950/60 border-rose-800 text-rose-200'
                      : 'bg-amber-950/60 border-amber-800 text-amber-200'
                  }`}>
                    <div className="flex items-start gap-2 font-bold mb-1">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{scanError.message}</span>
                    </div>
                    {scanError.detail && (
                      <p className="text-[11px] opacity-90 pl-6 leading-relaxed mb-2 font-mono">
                        {scanError.detail}
                      </p>
                    )}
                    {scanError.isScopes && (
                      <div className="pl-6 pt-1">
                        <a
                          href="https://me.sumup.com/developers/api-keys"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-900 border border-rose-700 text-white font-semibold hover:bg-rose-800 transition-colors"
                        >
                          <span>Open SumUp Developer Portal to create Key with Readers Scope ↗</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  {readers.length === 0 ? (
                    <div className="p-4 rounded-xl bg-stone-950 border border-stone-800 text-xs text-stone-400 text-center">
                      No readers found yet. Ensure your SumUp Solo is powered on and connected to Wi-Fi, or enter its pairing code below.
                    </div>
                  ) : (
                    readers.map((reader) => {
                      const isSelected = selectedReader === reader.id;
                      return (
                        <div
                          key={reader.id}
                          onClick={() => {
                            playTapSound();
                            setSelectedReader(reader.id);
                          }}
                          className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 text-white'
                              : 'border-stone-800 bg-stone-950 text-stone-300 hover:border-stone-700'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                reader.status === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
                              }`}
                            />
                            <div>
                              <div className="text-sm font-semibold">{reader.name}</div>
                              <div className="text-xs text-stone-400 font-mono">
                                ID: {reader.id} · {reader.model}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-stone-950">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Pair SumUp Solo by Code or Manual ID */}
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-3">
                <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Connect SumUp Solo by Pairing Code</span>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed font-light">
                  If your Solo is displaying an 8-character pairing code on screen (or in Solo Menu → Connections → Cloud), enter it here to link directly:
                </p>

                <form onSubmit={handlePairReader} className="flex gap-2">
                  <input
                    type="text"
                    value={pairingCode}
                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AB12CD34"
                    maxLength={10}
                    className="flex-grow px-3.5 py-2 bg-stone-900 border border-stone-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-amber-500 uppercase tracking-widest min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={isPairing || !pairingCode.trim()}
                    className="px-4 py-2 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition-colors disabled:opacity-50 min-h-[44px]"
                  >
                    {isPairing ? 'Pairing...' : 'Pair Solo'}
                  </button>
                </form>

                {pairingMsg && (
                  <p className={`text-xs ${pairingMsg.success ? 'text-emerald-400 font-semibold' : 'text-rose-400'}`}>
                    {pairingMsg.text}
                  </p>
                )}

                {/* Manual Reader ID fallback */}
                <div className="pt-2 border-t border-stone-800/80">
                  <label className="text-[11px] text-stone-400 block mb-1">
                    Or Enter Solo Reader ID / Serial Number manually:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualReaderId}
                      onChange={(e) => setManualReaderId(e.target.value.trim())}
                      placeholder="e.g. rdr_... or Solo Serial Number"
                      className="flex-grow px-3 py-1.5 bg-stone-900 border border-stone-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500 min-h-[36px]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (manualReaderId.trim()) {
                          setSelectedReader(manualReaderId.trim());
                        }
                      }}
                      className="px-3 py-1.5 bg-stone-800 text-stone-200 rounded-xl text-xs hover:bg-stone-700 min-h-[36px]"
                    >
                      Use ID
                    </button>
                  </div>
                </div>
              </div>

              {/* Merchant Credentials */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                    SumUp Cloud API Credentials
                  </label>
                  <a
                    href="https://me.sumup.com/developers/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-amber-400 hover:text-amber-300 underline"
                  >
                    Get API Key from SumUp ↗
                  </a>
                </div>

                <div className="p-3.5 bg-stone-950/80 border border-stone-800 rounded-2xl text-xs text-stone-300 space-y-2">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    <span>How to connect your physical SumUp Solo:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-stone-400 pl-1 leading-relaxed">
                    <li>Log into your <strong>SumUp Dashboard</strong> (me.sumup.com).</li>
                    <li>Go to <strong>Settings → For Developers → API Keys</strong> and create a secret key.</li>
                    <li>Copy your <strong>Merchant Code</strong> (displayed in your SumUp profile or top-right menu).</li>
                    <li>Ensure your <strong>SumUp Solo</strong> is turned on and connected to Wi-Fi/4G.</li>
                    <li>Paste your credentials below, toggle to <strong>Live Mode</strong>, and tap <strong>Test Connection</strong>.</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Merchant Code</label>
                    <input
                      type="text"
                      value={merchantCode}
                      onChange={(e) => setMerchantCode(e.target.value)}
                      placeholder="e.g. MC123456 or M1234567"
                      className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-400 block mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="USD">USD ($)</option>
                      <option value="CHF">CHF</option>
                      <option value="PLN">PLN</option>
                      <option value="SEK">SEK</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-stone-400 block mb-1">
                    SumUp API Key (Bearer Token)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={config.hasApiKey ? '•••••••••••••••••••••••• (Configured)' : 'Enter SumUp API Key (sup_sk_...)'}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 min-h-[44px]"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Credentials remain private on your backend server and are never exposed in client requests.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                <div>
                  <h4 className="text-sm font-semibold text-white">Stock Level Management</h4>
                  <p className="text-xs text-stone-400">Inventory auto-deducts on successful card transactions.</p>
                </div>
                <button
                  onClick={async () => {
                    playTapSound();
                    await onResetStock();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:text-white text-xs font-medium transition-colors min-h-[36px]"
                >
                  Restock All Items
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {products.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{item.name}</div>
                      <div className="text-xs text-stone-400">{item.category}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-stone-900 rounded-lg p-1 border border-stone-800">
                        <button
                          onClick={() => onAdjustStock(item.id, -1)}
                          className="w-7 h-7 rounded bg-stone-800 text-stone-300 flex items-center justify-center hover:bg-stone-700 text-xs font-bold min-h-[32px] min-w-[32px]"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-white tabular-nums">
                          {item.stock}
                        </span>
                        <button
                          onClick={() => onAdjustStock(item.id, 1)}
                          className="w-7 h-7 rounded bg-stone-800 text-stone-300 flex items-center justify-center hover:bg-stone-700 text-xs font-bold min-h-[32px] min-w-[32px]"
                        >
                          +
                        </button>
                      </div>

                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          item.stock === 0
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800'
                            : item.stock <= 5
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                            : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {item.stock === 0 ? 'Out' : item.stock <= 5 ? 'Low' : 'OK'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sound' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Touchscreen Audio Feedback</h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Synthesized tactile clicks, chimes, and payment completion alerts.
                  </p>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`p-3 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                    soundOn ? 'bg-amber-500 text-stone-950' : 'bg-stone-800 text-stone-400'
                  }`}
                >
                  {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-300">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span>Network & Sync Health</span>
                </div>
                <p className="text-xs text-stone-400">
                  Status: {isOnline ? 'Online · Connected' : 'Offline · Local Caching Active'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
          <div className="text-xs text-stone-400">
            {savedSuccess && (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> Settings saved successfully
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playTapSound();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl border border-stone-800 text-stone-300 font-semibold hover:bg-stone-900 transition-colors text-sm min-h-[44px]"
            >
              Close
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition-colors text-sm min-h-[44px]"
            >
              {isSaving ? 'Saving...' : 'Apply & Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
