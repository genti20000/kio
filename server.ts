import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const SUMUP_API_BASE = 'https://api.sumup.com';

// Server-side State
let configState = {
  apiKey: process.env.SUMUP_API_KEY || '',
  merchantCode: process.env.SUMUP_MERCHANT_CODE || 'MC_DEMO_94821',
  selectedReaderId: process.env.SUMUP_DEFAULT_READER_ID || 'rdr_solo_front_01',
  currency: process.env.SUMUP_CURRENCY || 'GBP',
  simulationMode: process.env.SUMUP_SIMULATION_MODE !== 'false' || !process.env.SUMUP_API_KEY,
};

// Initial Inventory Stock levels for Amica Soho
const inventoryState: Record<string, { stock: number; isAvailable: boolean }> = {
  prod_negroni: { stock: 35, isAvailable: true },
  prod_aperol_spritz: { stock: 45, isAvailable: true },
  prod_americano: { stock: 25, isAvailable: true },
  prod_espresso_martini: { stock: 30, isAvailable: true },
  prod_bellini: { stock: 20, isAvailable: true },
  prod_burrata: { stock: 18, isAvailable: true },
  prod_arancini: { stock: 22, isAvailable: true },
  prod_truffle_arancini: { stock: 16, isAvailable: true },
  prod_focaccia: { stock: 24, isAvailable: true },
  prod_olives: { stock: 30, isAvailable: true },
  prod_cacio_pepe: { stock: 20, isAvailable: true },
  prod_rigatoni_vodka: { stock: 18, isAvailable: true },
  prod_margherita: { stock: 25, isAvailable: true },
  prod_tiramisu: { stock: 14, isAvailable: true },
  prod_affogato: { stock: 20, isAvailable: true },
  prod_prosecco: { stock: 30, isAvailable: true },
  prod_chianti: { stock: 25, isAvailable: true },
  prod_peroni: { stock: 40, isAvailable: true },
  prod_san_pellegrino: { stock: 50, isAvailable: true },
};

// Fallback / Simulation Readers
const mockReaders = [
  {
    id: 'rdr_solo_front_01',
    name: 'SumUp Solo (Counter Kiosk 01)',
    status: 'online' as const,
    model: 'SumUp Solo 4G/WiFi',
    batteryLevel: 94,
    identifier: 'SU-SOLO-882194',
  },
  {
    id: 'rdr_air_barista_02',
    name: 'SumUp Air (Barista Handheld)',
    status: 'online' as const,
    model: 'SumUp Air Bluetooth',
    batteryLevel: 78,
    identifier: 'SU-AIR-410928',
  },
  {
    id: 'rdr_solo_patio_03',
    name: 'SumUp Solo (Patio Kiosk 02)',
    status: 'offline' as const,
    model: 'SumUp Solo',
    batteryLevel: 12,
    identifier: 'SU-SOLO-991204',
  },
];

interface StoredCheckout {
  id: string;
  amount: number;
  currency: string;
  description: string;
  readerId: string;
  readerName: string;
  status: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED';
  createdAt: number;
  orderNumber: string;
  items?: Array<{ id: string; quantity: number }>;
  inventoryDeducted: boolean;
  cardLast4?: string;
  cardType?: string;
  failureReason?: string;
}

const checkoutsStore = new Map<string, StoredCheckout>();

// --- Kitchen & Bar KDS State ---
export type KdsStation = 'kitchen' | 'bar';
export type KdsTicketStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface ServerKdsItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  category: string;
  station: KdsStation;
  selectedOptions?: Record<string, string>;
  notes?: string;
  isCompleted?: boolean;
}

export interface ServerKdsTicket {
  id: string;
  orderNumber: string;
  table: string;
  orderType: 'dine_in' | 'takeaway';
  createdAt: number;
  items: ServerKdsItem[];
  kitchenStatus: KdsTicketStatus;
  barStatus: KdsTicketStatus;
  kitchenReadyAt?: number;
  barReadyAt?: number;
  notes?: string;
  total?: number;
  paid?: boolean;
}

export interface ServerPosNotification {
  id: string;
  ticketId: string;
  orderNumber: string;
  table: string;
  station: KdsStation;
  itemsSummary: string;
  readyAt: number;
  dismissed: boolean;
}

const kdsTicketsStore = new Map<string, ServerKdsTicket>();
const posNotificationsStore = new Map<string, ServerPosNotification>();

function determineStation(category = '', name = '', id = ''): KdsStation {
  const cat = category.toLowerCase();
  const n = name.toLowerCase();
  const i = id.toLowerCase();

  const barCategories = ['cocktails', 'aperitivo', 'wine', 'beer', 'soft drinks'];
  if (barCategories.some((bc) => cat.includes(bc))) {
    return 'bar';
  }

  const kitchenCategories = ['small plates', 'pasta', 'pizza', 'desserts', 'food'];
  if (kitchenCategories.some((kc) => cat.includes(kc))) {
    return 'kitchen';
  }

  const barKeywords = ['negroni', 'spritz', 'americano', 'martini', 'bellini', 'prosecco', 'chianti', 'peroni', 'pellegrino', 'tonic', 'beer', 'wine', 'cocktail', 'drink'];
  if (barKeywords.some((k) => n.includes(k) || i.includes(k))) {
    return 'bar';
  }

  return 'kitchen';
}

// Seed initial realistic tickets so Kitchen & Bar KDS screens are live on first launch
const now = Date.now();
const initialTickets: ServerKdsTicket[] = [
  {
    id: 'ticket_seed_101',
    orderNumber: 'A-412',
    table: 'Table 12',
    orderType: 'dine_in',
    createdAt: now - 3.5 * 60 * 1000, // 3.5 mins ago
    kitchenStatus: 'preparing',
    barStatus: 'preparing',
    notes: 'Table 12 VIP · Guest has light nut allergy',
    total: 48.00,
    paid: true,
    items: [
      {
        id: 'item_101_1',
        productId: 'prod_negroni',
        name: 'Negroni',
        quantity: 1,
        category: 'Cocktails',
        station: 'bar',
        selectedOptions: { 'Gin Selection': 'Tanqueray London Dry', 'Preparation Style': 'Classic on Crystal Rock' },
        isCompleted: false,
      },
      {
        id: 'item_101_2',
        productId: 'prod_aperol_spritz',
        name: 'Aperol Spritz',
        quantity: 1,
        category: 'Cocktails',
        station: 'bar',
        selectedOptions: { 'Soda Preference': 'Extra soda' },
        isCompleted: true,
      },
      {
        id: 'item_101_3',
        productId: 'prod_burrata',
        name: 'Burrata Pugliese',
        quantity: 1,
        category: 'Small Plates',
        station: 'kitchen',
        selectedOptions: { 'Accompaniment': 'Add focaccia' },
        isCompleted: true,
      },
      {
        id: 'item_101_4',
        productId: 'prod_truffle_arancini',
        name: 'Truffle & Porcini Arancini',
        quantity: 2,
        category: 'Small Plates',
        station: 'kitchen',
        isCompleted: false,
      },
    ],
  },
  {
    id: 'ticket_seed_102',
    orderNumber: 'A-389',
    table: 'Bar 02',
    orderType: 'takeaway',
    createdAt: now - 7 * 60 * 1000, // 7 mins ago
    kitchenStatus: 'completed',
    barStatus: 'ready',
    barReadyAt: now - 45 * 1000,
    total: 24.00,
    paid: true,
    items: [
      {
        id: 'item_102_1',
        productId: 'prod_espresso_martini',
        name: 'Espresso Martini',
        quantity: 2,
        category: 'Cocktails',
        station: 'bar',
        selectedOptions: { 'Coffee Roaster': 'Monmouth Espresso' },
        isCompleted: true,
      },
    ],
  },
  {
    id: 'ticket_seed_103',
    orderNumber: 'A-275',
    table: 'Table 04',
    orderType: 'dine_in',
    createdAt: now - 13 * 60 * 1000, // 13 mins ago (Priority / Amber)
    kitchenStatus: 'preparing',
    barStatus: 'completed',
    notes: 'Extra hot parmesan requested',
    total: 39.00,
    paid: true,
    items: [
      {
        id: 'item_103_1',
        productId: 'prod_cacio_pepe',
        name: 'Tonnarelli Cacio e Pepe',
        quantity: 1,
        category: 'Pasta',
        station: 'kitchen',
        selectedOptions: { 'Luxury Additions': 'Extra black truffle' },
        isCompleted: false,
      },
      {
        id: 'item_103_2',
        productId: 'prod_margherita',
        name: 'Margherita Verace Pizza',
        quantity: 1,
        category: 'Pizza',
        station: 'kitchen',
        isCompleted: false,
      },
    ],
  },
];

for (const t of initialTickets) {
  kdsTicketsStore.set(t.id, t);
}

// Initial ready notification for Bar 02 Espresso Martinis
posNotificationsStore.set('notif_seed_bar02', {
  id: 'notif_seed_bar02',
  ticketId: 'ticket_seed_102',
  orderNumber: 'A-389',
  table: 'Bar 02',
  station: 'bar',
  itemsSummary: '2x Espresso Martini',
  readyAt: now - 45 * 1000,
  dismissed: false,
});

// Helper to deduct inventory when a transaction succeeds
function deductInventoryForCheckout(checkout: StoredCheckout) {
  if (checkout.inventoryDeducted || !checkout.items) return;
  for (const item of checkout.items) {
    const current = inventoryState[item.id];
    if (current) {
      current.stock = Math.max(0, current.stock - item.quantity);
      if (current.stock === 0) {
        current.isAvailable = false;
      }
    }
  }
  checkout.inventoryDeducted = true;
}

async function startServer() {
  const app = express();

  app.use(express.json());

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      time: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Kiosk & Gateway Configuration
  app.get('/api/config', (_req: Request, res: Response) => {
    res.json({
      merchantCode: configState.merchantCode,
      currency: configState.currency,
      selectedReaderId: configState.selectedReaderId,
      simulationMode: configState.simulationMode,
      hasLiveApiKey: Boolean(configState.apiKey && configState.apiKey.trim().length > 0),
    });
  });

  app.post('/api/config', (req: Request, res: Response) => {
    const { simulationMode, selectedReaderId, currency, merchantCode, apiKey } = req.body;
    if (typeof simulationMode === 'boolean') {
      configState.simulationMode = simulationMode;
    }
    if (selectedReaderId) {
      configState.selectedReaderId = selectedReaderId;
    }
    if (currency) {
      configState.currency = currency;
    }
    if (merchantCode) {
      configState.merchantCode = merchantCode;
    }
    if (typeof apiKey === 'string') {
      configState.apiKey = apiKey.trim();
      // If an API key is provided and simulationMode wasn't explicitly set, enable live mode
      if (apiKey.trim().length > 0 && typeof simulationMode === 'undefined') {
        configState.simulationMode = false;
      }
    }

    res.json({
      success: true,
      config: {
        merchantCode: configState.merchantCode,
        currency: configState.currency,
        selectedReaderId: configState.selectedReaderId,
        simulationMode: configState.simulationMode,
        hasLiveApiKey: Boolean(configState.apiKey && configState.apiKey.trim().length > 0),
      },
    });
  });

  // 1. Fetch paired readers for the merchant from SumUp: GET /api/readers
  app.get('/api/readers', async (_req: Request, res: Response) => {
    const isLive = !configState.simulationMode && configState.apiKey && configState.merchantCode;

    if (isLive) {
      try {
        const response = await fetch(
          `${SUMUP_API_BASE}/v0.1/merchants/${configState.merchantCode}/readers`,
          {
            headers: {
              Authorization: `Bearer ${configState.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.warn(`SumUp readers fetch returned status ${response.status}: ${errorText}`);

          let isScopeError = false;
          let scopeDetail = '';

          try {
            const errObj = JSON.parse(errorText);
            if (response.status === 403 && (errObj.detail?.includes('scopes') || errObj.detail?.includes('readers.read'))) {
              isScopeError = true;
              scopeDetail = errObj.detail;
            }
          } catch {
            // ignore json parse error
          }

          if (isScopeError) {
            return res.status(403).json({
              error: 'INSUFFICIENT_SCOPES',
              message: 'Your SumUp API Key is missing the required scopes: [readers.read, terminals.read].',
              detail: scopeDetail,
              helpUrl: 'https://me.sumup.com/developers/api-keys',
              readers: [],
              mode: 'error_scopes',
            });
          }

          return res.status(response.status).json({
            error: `SumUp API error (${response.status})`,
            detail: errorText,
            readers: [],
            mode: 'error',
          });
        }

        const data = await response.json();
        // Normalize readers list
        const rawItems = Array.isArray(data) ? data : data.items || [];
        const readers = rawItems.map((item: any) => ({
          id: item.id || item.identifier,
          name: item.name || `SumUp Reader (${item.device?.model || 'Solo'})`,
          status: item.status || 'online',
          model: item.device?.model || 'SumUp Solo',
          batteryLevel: item.battery_level ?? 95,
          identifier: item.device?.identifier || item.id,
        }));

        // If readers list was fetched successfully and has readers, auto-set active reader if currently on mock
        if (readers.length > 0 && configState.selectedReaderId.startsWith('rdr_solo_front')) {
          configState.selectedReaderId = readers[0].id;
        }

        return res.json({
          readers,
          mode: 'live',
        });
      } catch (err: any) {
        console.error('Error contacting SumUp API for readers:', err.message);
        return res.status(502).json({
          error: 'NETWORK_ERROR',
          message: 'Network error contacting SumUp Cloud API.',
          detail: err.message,
          readers: [],
          mode: 'error_network',
        });
      }
    }

    // Default simulation / mock readers
    return res.json({
      readers: mockReaders,
      mode: 'simulation',
    });
  });

  // Pair a new SumUp Solo via pairing code: POST /api/readers/pair
  app.post('/api/readers/pair', async (req: Request, res: Response) => {
    const { pairingCode, name = 'SumUp Solo Kiosk' } = req.body;

    if (!pairingCode || pairingCode.trim().length < 6) {
      return res.status(400).json({ error: 'Valid 8-character pairing code from the SumUp Solo is required.' });
    }

    const isLive = !configState.simulationMode && configState.apiKey && configState.merchantCode;
    if (!isLive) {
      // Simulate pairing
      const newMockReader = {
        id: `rdr_solo_${Date.now()}`,
        name: `${name} (${pairingCode.trim().toUpperCase()})`,
        status: 'online' as const,
        model: 'SumUp Solo 4G/WiFi',
        batteryLevel: 100,
        identifier: pairingCode.trim().toUpperCase(),
      };
      mockReaders.unshift(newMockReader);
      configState.selectedReaderId = newMockReader.id;
      return res.json({ success: true, reader: newMockReader, mode: 'simulation' });
    }

    try {
      const response = await fetch(
        `${SUMUP_API_BASE}/v0.1/merchants/${configState.merchantCode}/readers`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${configState.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pairing_code: pairingCode.trim().toUpperCase(),
            name: name,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: 'PAIRING_FAILED',
          detail: errorText,
        });
      }

      const reader = await response.json();
      configState.selectedReaderId = reader.id || reader.identifier;

      return res.json({
        success: true,
        reader,
        mode: 'live',
      });
    } catch (err: any) {
      return res.status(502).json({ error: 'Network error pairing reader', detail: err.message });
    }
  });

  // 2. Create a terminal checkout request on a specific reader: POST /api/checkout
  app.post('/api/checkout', async (req: Request, res: Response) => {
    try {
      const {
        amount,
        currency = configState.currency,
        description = 'Kiosk Order',
        readerId = configState.selectedReaderId,
        items = [],
        orderNumber = `A-${Math.floor(100 + Math.random() * 900)}`,
      } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid checkout amount is required' });
      }

      // Pre-check stock
      for (const item of items) {
        const inv = inventoryState[item.id];
        if (inv && inv.stock < item.quantity) {
          return res.status(400).json({
            error: `Item "${item.name || item.id}" has only ${inv.stock} remaining in stock.`,
          });
        }
      }

      const isLive = !configState.simulationMode && configState.apiKey && configState.merchantCode;

      if (isLive) {
        // Check if caller requested fallback to simulation if live reader is unreachable or unconfigured
        const fallbackSimulation = Boolean(req.body.fallbackSimulation);

        // Prevent calling SumUp with a simulated mock reader ID
        if (!readerId || readerId.startsWith('rdr_solo_front') || readerId.startsWith('rdr_air_barista') || readerId.startsWith('rdr_solo_patio')) {
          if (fallbackSimulation) {
            console.log('[Kiosk] No live reader configured, falling back to simulation mode for this order.');
            // Proceed to simulation block below
          } else {
            return res.status(400).json({
              error: 'NO_LIVE_READER',
              title: 'No Active Reader Selected',
              message: 'No physical SumUp Solo reader has been connected yet. Please go to Settings (⚙️) to pair your Solo, or switch to Simulation Mode to test.',
              suggestSimulation: true,
            });
          }
        } else {
          try {
            // SumUp Reader Checkout API
            const payload = {
              total_amount: {
                value: Math.round(amount * 100), // Minor currency units (cents)
                currency: currency,
              },
              description: `${description} (${orderNumber})`,
            };

            const response = await fetch(
              `${SUMUP_API_BASE}/v0.1/merchants/${configState.merchantCode}/readers/${readerId}/checkouts`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${configState.apiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              }
            );

            if (!response.ok) {
              const errBody = await response.text();
              let parsedErr: any = null;
              try { parsedErr = JSON.parse(errBody); } catch {}

              console.warn(`[SumUp Cloud API] Terminal checkout notice (${response.status}):`, parsedErr?.detail || errBody);

              if (fallbackSimulation) {
                console.log('[Kiosk] Live checkout failed, falling back to simulated checkout.');
                // Fall through to simulation mode block
              } else if (response.status === 404) {
                return res.status(404).json({
                  error: 'SUMUP_READER_NOT_FOUND',
                  title: 'SumUp Solo Not Found (404)',
                  message: `Reader ID "${readerId}" was not found under merchant "${configState.merchantCode}".`,
                  detail: 'If you typed your Solo\'s serial number, you must pair it first via the 8-character pairing code in Solo Menu → Connections → Cloud. Or you can run in Simulation Mode to test immediately.',
                  readerId,
                  status: 404,
                  suggestSimulation: true,
                });
              } else if (response.status === 403) {
                return res.status(403).json({
                  error: 'INSUFFICIENT_SCOPES',
                  title: 'Missing API Permissions (403)',
                  message: 'Your SumUp API Key lacks the required [readers.read, terminals.read] scopes.',
                  detail: 'Please generate an API Key with the "Readers" and "Terminals" permissions selected at me.sumup.com/developers/api-keys.',
                  status: 403,
                  suggestSimulation: true,
                });
              } else {
                return res.status(response.status).json({
                  error: 'SUMUP_CHECKOUT_FAILED',
                  title: 'SumUp Terminal Communication Error',
                  message: parsedErr?.detail || parsedErr?.title || `SumUp error: ${errBody}`,
                  status: response.status,
                  suggestSimulation: true,
                });
              }
            } else {
              const sumupCheckout = await response.json();
              const checkoutId = sumupCheckout.id || `chk_sumup_${Date.now()}`;

              const stored: StoredCheckout = {
                id: checkoutId,
                amount,
                currency,
                description,
                readerId,
                readerName: 'SumUp Solo',
                status: 'PENDING',
                createdAt: Date.now(),
                orderNumber,
                items,
                inventoryDeducted: false,
              };
              checkoutsStore.set(checkoutId, stored);

              return res.json({
                id: checkoutId,
                status: 'PENDING',
                amount,
                currency,
                readerId,
                readerName: 'SumUp Solo',
                orderNumber,
                terminalStep: 'awaiting_card',
              });
            }
          } catch (err: any) {
            console.warn('[SumUp Cloud API] Network error calling checkout:', err.message);
            if (fallbackSimulation) {
              console.log('[Kiosk] Network error on live checkout, falling back to simulated checkout.');
            } else {
              return res.status(502).json({
                error: 'NETWORK_ERROR',
                title: 'Network Communication Error',
                message: 'Failed to contact SumUp Cloud API. Check your internet connection.',
                detail: err.message,
                suggestSimulation: true,
              });
            }
          }
        }
      }

      // Simulation Mode Checkout
      const activeReader =
        mockReaders.find((r) => r.id === readerId) || {
          id: readerId,
          name: 'SumUp Solo (Counter Kiosk 01)',
        };

      const checkoutId = `chk_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const stored: StoredCheckout = {
        id: checkoutId,
        amount,
        currency,
        description,
        readerId,
        readerName: activeReader.name,
        status: 'PENDING',
        createdAt: Date.now(),
        orderNumber,
        items,
        inventoryDeducted: false,
      };
      checkoutsStore.set(checkoutId, stored);

      return res.json({
        id: checkoutId,
        status: 'PENDING',
        amount,
        currency,
        readerId,
        readerName: activeReader.name,
        orderNumber,
        terminalStep: 'awaiting_card',
      });
    } catch (err: any) {
      console.error('Checkout error:', err);
      return res.status(500).json({ error: 'Internal checkout error' });
    }
  });

  // 3. Check checkout status: GET /api/checkout/:id
  app.get('/api/checkout/:id', async (req: Request, res: Response) => {
    const checkoutId = req.params.id;
    const stored = checkoutsStore.get(checkoutId);

    const isLive = !configState.simulationMode && configState.apiKey && configState.merchantCode;

    if (isLive) {
      try {
        const response = await fetch(
          `${SUMUP_API_BASE}/v0.1/merchants/${configState.merchantCode}/checkouts/${checkoutId}`,
          {
            headers: {
              Authorization: `Bearer ${configState.apiKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.ok) {
          const sumupData = await response.json();
          let currentStatus: 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED' = 'PENDING';
          const rawStatus = (sumupData.status || '').toUpperCase();

          if (rawStatus === 'PAID' || rawStatus === 'SUCCESSFUL') {
            currentStatus = 'SUCCESSFUL';
          } else if (rawStatus === 'FAILED') {
            currentStatus = 'FAILED';
          } else if (rawStatus === 'CANCELLED') {
            currentStatus = 'CANCELLED';
          }

          if (stored) {
            stored.status = currentStatus;
            if (sumupData.card) {
              stored.cardLast4 = sumupData.card.last_4_digits || '4242';
              stored.cardType = sumupData.card.type || 'VISA';
            }
            if (currentStatus === 'SUCCESSFUL') {
              deductInventoryForCheckout(stored);
            }
          }

          return res.json({
            id: checkoutId,
            status: currentStatus,
            amount: sumupData.amount || stored?.amount || 0,
            currency: sumupData.currency || stored?.currency || 'EUR',
            readerId: stored?.readerId || '',
            readerName: stored?.readerName || 'SumUp Solo',
            cardLast4: sumupData.card?.last_4_digits || '8832',
            cardType: sumupData.card?.type || 'Contactless',
          });
        }
      } catch (err) {
        console.error('Error polling live SumUp checkout:', err);
      }
    }

    // In Simulation Mode
    if (!stored) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    const elapsed = Date.now() - stored.createdAt;

    // Progression of terminal steps during simulation:
    // 0 - 1.5s: Connecting to terminal
    // 1.5s - 4.5s: Awaiting card tap / insert
    // 4.5s - 6.5s: Authorizing card
    // > 6.5s: Automatically marks SUCCESSFUL (simulating contactless tap)
    let terminalStep: 'connecting' | 'awaiting_card' | 'processing' | 'approved' | 'declined' = 'awaiting_card';

    if (stored.status === 'PENDING') {
      if (elapsed < 1500) {
        terminalStep = 'connecting';
      } else if (elapsed < 4500) {
        terminalStep = 'awaiting_card';
      } else if (elapsed < 6500) {
        terminalStep = 'processing';
      } else {
        // Auto-approve after 6.5s
        stored.status = 'SUCCESSFUL';
        stored.cardLast4 = '4242';
        stored.cardType = 'Visa Contactless';
        terminalStep = 'approved';
        deductInventoryForCheckout(stored);
      }
    } else if (stored.status === 'SUCCESSFUL') {
      terminalStep = 'approved';
      deductInventoryForCheckout(stored);
    } else {
      terminalStep = 'declined';
    }

    return res.json({
      id: stored.id,
      status: stored.status,
      amount: stored.amount,
      currency: stored.currency,
      readerId: stored.readerId,
      readerName: stored.readerName,
      orderNumber: stored.orderNumber,
      terminalStep,
      cardLast4: stored.cardLast4 || '4242',
      cardType: stored.cardType || 'Visa Contactless',
      failureReason: stored.failureReason,
    });
  });

  // Cancel an active checkout: POST /api/checkout/:id/cancel
  app.post('/api/checkout/:id/cancel', async (req: Request, res: Response) => {
    const checkoutId = req.params.id;
    const stored = checkoutsStore.get(checkoutId);

    if (stored) {
      stored.status = 'CANCELLED';
    }

    const isLive = !configState.simulationMode && configState.apiKey && configState.merchantCode;
    if (isLive && stored?.readerId) {
      try {
        await fetch(
          `${SUMUP_API_BASE}/v0.1/merchants/${configState.merchantCode}/readers/${stored.readerId}/checkouts`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${configState.apiKey}`,
            },
          }
        );
      } catch (e) {
        // Ignore live cancel errors
      }
    }

    res.json({ success: true, status: 'CANCELLED' });
  });

  // Simulation Trigger: Force simulate a card tap immediately
  app.post('/api/checkout/:id/simulate-tap', (req: Request, res: Response) => {
    const checkoutId = req.params.id;
    const { action = 'approve' } = req.body;
    const stored = checkoutsStore.get(checkoutId);

    if (!stored) {
      return res.status(404).json({ error: 'Checkout not found' });
    }

    if (action === 'approve') {
      stored.status = 'SUCCESSFUL';
      stored.cardLast4 = '5100';
      stored.cardType = 'Mastercard Contactless';
      deductInventoryForCheckout(stored);
    } else if (action === 'decline') {
      stored.status = 'FAILED';
      stored.failureReason = 'Card Declined: Insufficient Funds';
    } else if (action === 'cancel') {
      stored.status = 'CANCELLED';
    }

    res.json({
      success: true,
      status: stored.status,
      cardLast4: stored.cardLast4,
      cardType: stored.cardType,
      failureReason: stored.failureReason,
    });
  });

  // Real-time Inventory Endpoints
  app.get('/api/inventory', (_req: Request, res: Response) => {
    res.json({
      inventory: inventoryState,
      timestamp: Date.now(),
    });
  });

  app.post('/api/inventory/adjust', (req: Request, res: Response) => {
    const { productId, delta, newStock, isAvailable } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    if (!inventoryState[productId]) {
      inventoryState[productId] = { stock: 10, isAvailable: true };
    }

    if (typeof newStock === 'number') {
      inventoryState[productId].stock = Math.max(0, newStock);
    } else if (typeof delta === 'number') {
      inventoryState[productId].stock = Math.max(0, inventoryState[productId].stock + delta);
    }

    if (typeof isAvailable === 'boolean') {
      inventoryState[productId].isAvailable = isAvailable;
    } else if (inventoryState[productId].stock === 0) {
      inventoryState[productId].isAvailable = false;
    }

    res.json({
      success: true,
      productId,
      state: inventoryState[productId],
    });
  });

  app.post('/api/inventory/reset', (_req: Request, res: Response) => {
    // Reset to defaults
    const defaults: Record<string, number> = {
      prod_negroni: 35,
      prod_aperol_spritz: 45,
      prod_americano: 25,
      prod_espresso_martini: 30,
      prod_bellini: 20,
      prod_burrata: 18,
      prod_arancini: 22,
      prod_truffle_arancini: 16,
      prod_focaccia: 24,
      prod_olives: 30,
      prod_cacio_pepe: 20,
      prod_rigatoni_vodka: 18,
      prod_margherita: 25,
      prod_tiramisu: 14,
      prod_affogato: 20,
      prod_prosecco: 30,
      prod_chianti: 25,
      prod_peroni: 40,
      prod_san_pellegrino: 50,
    };

    for (const [id, count] of Object.entries(defaults)) {
      inventoryState[id] = { stock: count, isAvailable: true };
    }

    res.json({
      success: true,
      inventory: inventoryState,
    });
  });

  // Send digital receipt: POST /api/receipt
  app.post('/api/receipt', (req: Request, res: Response) => {
    const { email, orderNumber, items, total } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address is required' });
    }

    console.log(`[RECEIPT] Digital receipt sent for Order #${orderNumber} to ${email} (Total: ${total})`);

    res.json({
      success: true,
      message: `Digital receipt sent to ${email}`,
      orderNumber,
      timestamp: new Date().toISOString(),
    });
  });

  // --- KDS (Kitchen & Bar Display Systems) Endpoints ---

  // 1. Get KDS tickets: GET /api/kds/orders
  app.get('/api/kds/orders', (req: Request, res: Response) => {
    const station = req.query.station as string | undefined; // 'kitchen' | 'bar'
    const statusFilter = (req.query.status as string) || 'active'; // 'active' | 'completed' | 'all'

    const allTickets = Array.from(kdsTicketsStore.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );

    let filtered = allTickets;

    if (station === 'kitchen') {
      filtered = filtered.filter((t) => t.items.some((i) => i.station === 'kitchen'));
      if (statusFilter === 'active') {
        filtered = filtered.filter((t) => t.kitchenStatus !== 'completed' && t.kitchenStatus !== 'cancelled');
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter((t) => t.kitchenStatus === 'completed');
      }
    } else if (station === 'bar') {
      filtered = filtered.filter((t) => t.items.some((i) => i.station === 'bar'));
      if (statusFilter === 'active') {
        filtered = filtered.filter((t) => t.barStatus !== 'completed' && t.barStatus !== 'cancelled');
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter((t) => t.barStatus === 'completed');
      }
    } else if (statusFilter === 'active') {
      filtered = filtered.filter(
        (t) => (t.kitchenStatus !== 'completed' && t.kitchenStatus !== 'cancelled') ||
               (t.barStatus !== 'completed' && t.barStatus !== 'cancelled')
      );
    }

    res.json({
      success: true,
      station: station || 'all',
      count: filtered.length,
      tickets: filtered,
    });
  });

  // 2. Create new KDS ticket: POST /api/kds/orders
  app.post('/api/kds/orders', (req: Request, res: Response) => {
    const {
      orderNumber = `A-${Math.floor(100 + Math.random() * 900)}`,
      table = 'Table 12',
      orderType = 'dine_in',
      items = [],
      notes = '',
      total = 0,
      paid = false,
    } = req.body;

    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Normalize and tag items with station
    const kdsItems: ServerKdsItem[] = items.map((raw: any, idx: number) => {
      const station = raw.station || determineStation(raw.category, raw.name, raw.productId || raw.id);
      return {
        id: raw.id || `${ticketId}_${idx}`,
        productId: raw.productId || raw.id || `prod_${idx}`,
        name: raw.name || 'Item',
        quantity: raw.quantity || 1,
        category: raw.category || (station === 'bar' ? 'Cocktails' : 'Small Plates'),
        station,
        selectedOptions: raw.selectedOptions,
        notes: raw.notes,
        isCompleted: false,
      };
    });

    const hasBarItems = kdsItems.some((i) => i.station === 'bar');
    const hasKitchenItems = kdsItems.some((i) => i.station === 'kitchen');

    const newTicket: ServerKdsTicket = {
      id: ticketId,
      orderNumber,
      table,
      orderType,
      createdAt: Date.now(),
      items: kdsItems,
      barStatus: hasBarItems ? 'pending' : 'completed',
      kitchenStatus: hasKitchenItems ? 'pending' : 'completed',
      notes,
      total,
      paid,
    };

    kdsTicketsStore.set(ticketId, newTicket);

    res.json({
      success: true,
      ticket: newTicket,
    });
  });

  // 3. Update KDS ticket status: PATCH /api/kds/orders/:id
  app.patch('/api/kds/orders/:id', (req: Request, res: Response) => {
    const ticketId = req.params.id;
    const ticket = kdsTicketsStore.get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'KDS ticket not found' });
    }

    const {
      kitchenStatus,
      barStatus,
      itemId,
      itemCompleted,
      notes,
    } = req.body;

    // Toggle individual item completion if requested
    if (itemId) {
      const item = ticket.items.find((i) => i.id === itemId);
      if (item) {
        item.isCompleted = typeof itemCompleted === 'boolean' ? itemCompleted : !item.isCompleted;
      }
    }

    if (notes !== undefined) {
      ticket.notes = notes;
    }

    // Update Kitchen Status & notify POS if marked ready
    if (kitchenStatus && kitchenStatus !== ticket.kitchenStatus) {
      const prevStatus = ticket.kitchenStatus;
      ticket.kitchenStatus = kitchenStatus;

      if (kitchenStatus === 'ready' && prevStatus !== 'ready') {
        ticket.kitchenReadyAt = Date.now();
        const foodItems = ticket.items.filter((i) => i.station === 'kitchen');
        const summary = foodItems.map((i) => `${i.quantity}x ${i.name}`).join(', ');

        const notifId = `notif_kit_${ticket.id}_${Date.now()}`;
        posNotificationsStore.set(notifId, {
          id: notifId,
          ticketId: ticket.id,
          orderNumber: ticket.orderNumber,
          table: ticket.table,
          station: 'kitchen',
          itemsSummary: summary || 'Kitchen Order',
          readyAt: Date.now(),
          dismissed: false,
        });
      }
    }

    // Update Bar Status & notify POS if marked ready
    if (barStatus && barStatus !== ticket.barStatus) {
      const prevStatus = ticket.barStatus;
      ticket.barStatus = barStatus;

      if (barStatus === 'ready' && prevStatus !== 'ready') {
        ticket.barReadyAt = Date.now();
        const drinkItems = ticket.items.filter((i) => i.station === 'bar');
        const summary = drinkItems.map((i) => `${i.quantity}x ${i.name}`).join(', ');

        const notifId = `notif_bar_${ticket.id}_${Date.now()}`;
        posNotificationsStore.set(notifId, {
          id: notifId,
          ticketId: ticket.id,
          orderNumber: ticket.orderNumber,
          table: ticket.table,
          station: 'bar',
          itemsSummary: summary || 'Bar Order',
          readyAt: Date.now(),
          dismissed: false,
        });
      }
    }

    res.json({
      success: true,
      ticket,
    });
  });

  // 4. Recall a completed ticket: POST /api/kds/orders/:id/recall
  app.post('/api/kds/orders/:id/recall', (req: Request, res: Response) => {
    const ticketId = req.params.id;
    const { station } = req.body; // 'kitchen' | 'bar'
    const ticket = kdsTicketsStore.get(ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (station === 'kitchen') {
      ticket.kitchenStatus = 'ready';
    } else if (station === 'bar') {
      ticket.barStatus = 'ready';
    }

    res.json({ success: true, ticket });
  });

  // 5. Get active POS Notifications: GET /api/kds/notifications
  app.get('/api/kds/notifications', (_req: Request, res: Response) => {
    const active = Array.from(posNotificationsStore.values())
      .filter((n) => !n.dismissed)
      .sort((a, b) => b.readyAt - a.readyAt);

    res.json({
      success: true,
      notifications: active,
    });
  });

  // 6. Dismiss / Collect POS Notification: POST /api/kds/notifications/:id/dismiss
  app.post('/api/kds/notifications/:id/dismiss', (req: Request, res: Response) => {
    const notifId = req.params.id;
    const notif = posNotificationsStore.get(notifId);

    if (notif) {
      notif.dismissed = true;
    }

    res.json({ success: true, notifId });
  });

  // 7. Clear all POS Notifications: POST /api/kds/notifications/clear-all
  app.post('/api/kds/notifications/clear-all', (_req: Request, res: Response) => {
    for (const notif of posNotificationsStore.values()) {
      notif.dismissed = true;
    }
    res.json({ success: true });
  });


  // --- Vite / Static Handling ---
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Aura Kiosk Server running at http://0.0.0.0:${PORT}`);
    console.log(`> SumUp Gateway Mode: ${configState.simulationMode ? 'SIMULATION' : 'LIVE SUMUP'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
