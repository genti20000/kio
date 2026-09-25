/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_PRODUCTS, CATEGORIES } from './data/initialCatalog.ts';
import { Product, CartItem, OrderType, SumUpReader, CheckoutResponse, KioskOrder, KioskConfig } from './types/kiosk.ts';
import { AttractScreen } from './components/AttractScreen.tsx';
import { TopBar } from './components/TopBar.tsx';
import { LeftSidebar } from './components/LeftSidebar.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ItemCustomizeModal } from './components/ItemCustomizeModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { TerminalPaymentModal } from './components/TerminalPaymentModal.tsx';
import { PaymentSuccessModal } from './components/PaymentSuccessModal.tsx';
import { InactivityWarningModal } from './components/InactivityWarningModal.tsx';
import { AdminSettingsModal } from './components/AdminSettingsModal.tsx';
import { CheckoutDiagnosticModal, CheckoutErrorInfo } from './components/CheckoutDiagnosticModal.tsx';
import { MobileCategoryBar } from './components/MobileCategoryBar.tsx';
import { MobileCartBar } from './components/MobileCartBar.tsx';
import { KitchenKds } from './components/KitchenKds.tsx';
import { BarKds } from './components/BarKds.tsx';
import { PosNotificationCenter } from './components/PosNotificationCenter.tsx';
import { playAddToCartSound, playTapSound, playCheckoutPromptSound } from './utils/audio.ts';
import { WifiOff, AlertTriangle, ChevronRight } from 'lucide-react';

function getInitialStation(): 'pos' | 'kitchen' | 'bar' {
  if (typeof window === 'undefined') return 'pos';
  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const stationParam = search.get('station') || search.get('kds') || search.get('view');

  if (path.includes('/kitchen') || stationParam === 'kitchen') {
    return 'kitchen';
  }
  if (path.includes('/bar') || stationParam === 'bar') {
    return 'bar';
  }
  return 'pos';
}

export default function App() {
  // Station Routing State (/pos, /kitchen, /bar)
  const [activeStation, setActiveStation] = useState<'pos' | 'kitchen' | 'bar'>(getInitialStation);

  const navigateStation = (station: 'pos' | 'kitchen' | 'bar') => {
    playTapSound();
    setActiveStation(station);
    const targetPath = station === 'pos' ? '/' : `/${station}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ station }, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveStation(getInitialStation());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation & Flow State
  const [orderStep, setOrderStep] = useState<'attract' | 'menu' | 'terminal_payment' | 'payment_success'>('attract');
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [activeTable, setActiveTable] = useState<string>('Table 12');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Product Catalog & Inventory
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('amica_kiosk_products_v3');
      if (cached) {
        const parsed: Product[] = JSON.parse(cached);
        // Merge to guarantee fresh images for all items
        return INITIAL_PRODUCTS.map((init) => {
          const match = parsed.find((p) => p.id === init.id);
          return match ? { ...init, stock: match.stock, isAvailable: match.isAvailable } : init;
        });
      }
      return INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  // Shopping Cart pre-populated with items matching the Amica Soho showcase if empty
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const cached = localStorage.getItem('amica_kiosk_cart_v3');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    // Initial sample matching the user's tablet photo with individual photos
    const negroni = INITIAL_PRODUCTS.find((p) => p.id === 'prod_negroni');
    const aperol = INITIAL_PRODUCTS.find((p) => p.id === 'prod_aperol_spritz');
    const burrata = INITIAL_PRODUCTS.find((p) => p.id === 'prod_burrata');
    const truffleArancini = INITIAL_PRODUCTS.find((p) => p.id === 'prod_truffle_arancini');
    const cacioPepe = INITIAL_PRODUCTS.find((p) => p.id === 'prod_cacio_pepe');

    const sampleItems: CartItem[] = [];
    if (negroni) {
      sampleItems.push({
        cartId: 'cart_negroni_1',
        productId: negroni.id,
        name: negroni.name,
        price: negroni.price,
        quantity: 1,
        image: negroni.image,
        unitTotal: 12.00,
      });
    }
    if (aperol) {
      sampleItems.push({
        cartId: 'cart_aperol_2',
        productId: aperol.id,
        name: aperol.name,
        price: aperol.price,
        quantity: 1,
        image: aperol.image,
        selectedOptions: { 'Soda Preference': 'Extra soda' },
        unitTotal: 11.00,
      });
    }
    if (burrata) {
      sampleItems.push({
        cartId: 'cart_burrata_3',
        productId: burrata.id,
        name: burrata.name,
        price: burrata.price,
        quantity: 1,
        image: burrata.image,
        selectedOptions: { 'Accompaniment': 'Add focaccia' },
        unitTotal: 14.00,
      });
    }
    if (truffleArancini) {
      sampleItems.push({
        cartId: 'cart_arancini_4',
        productId: truffleArancini.id,
        name: truffleArancini.name,
        price: truffleArancini.price,
        quantity: 2,
        image: truffleArancini.image,
        unitTotal: 11.00,
      });
    }
    if (cacioPepe) {
      sampleItems.push({
        cartId: 'cart_cacio_5',
        productId: cacioPepe.id,
        name: cacioPepe.name,
        price: cacioPepe.price,
        quantity: 1,
        image: cacioPepe.image,
        selectedOptions: { 'Luxury Additions': 'Extra black truffle' },
        unitTotal: 16.00,
      });
    }
    return sampleItems;
  });

  // Modal States
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [activeCheckout, setActiveCheckout] = useState<CheckoutResponse | null>(null);
  const [completedOrder, setCompletedOrder] = useState<KioskOrder | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<CheckoutErrorInfo | null>(null);

  // Kiosk & Gateway Configuration
  const [config, setConfig] = useState<KioskConfig>({
    merchantCode: 'MVY36GP1',
    hasApiKey: false,
    selectedReaderId: '200101705351',
    currency: 'GBP',
    simulationMode: true,
  });

  const [readers, setReaders] = useState<SumUpReader[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Inactivity Timer State (60s total, warning at 45s)
  const [inactivitySeconds, setInactivitySeconds] = useState(0);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('amica_kiosk_cart_v3', JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart]);

  // Save products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('amica_kiosk_products_v3', JSON.stringify(products));
    } catch {
      // Ignore
    }
  }, [products]);

  // Reset inactivity timer on any user touch/click/keypress
  const resetInactivity = useCallback(() => {
    setInactivitySeconds(0);
    setShowInactivityWarning(false);
  }, []);

  useEffect(() => {
    const handleActivity = () => resetInactivity();

    window.addEventListener('pointerdown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('pointerdown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [resetInactivity]);

  // Inactivity Interval Monitor
  useEffect(() => {
    if (orderStep !== 'menu') {
      setShowInactivityWarning(false);
      return;
    }

    inactivityTimerRef.current = setInterval(() => {
      setInactivitySeconds((prev) => {
        const next = prev + 1;
        if (next >= 60) {
          // Reset to attract screen
          setCart([]);
          setOrderStep('attract');
          setShowInactivityWarning(false);
          return 0;
        } else if (next >= 45) {
          setShowInactivityWarning(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
    };
  }, [orderStep]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Inventory from Backend API
  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        const invMap = data.inventory || {};

        setProducts((prev) =>
          prev.map((item) => {
            const current = invMap[item.id];
            if (current) {
              return {
                ...item,
                stock: current.stock,
                isAvailable: current.isAvailable && current.stock > 0,
              };
            }
            return item;
          })
        );
      }
    } catch {
      // Use local state if offline
    }
  }, []);

  // Fetch Config and Readers
  const fetchConfigAndReaders = useCallback(async () => {
    try {
      const [cfgRes, rdrRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/readers'),
      ]);

      if (cfgRes.ok) {
        const cfgData = await cfgRes.json();
        setConfig(cfgData);
      }

      if (rdrRes.ok) {
        const rdrData = await rdrRes.json();
        setReaders(rdrData.readers || []);
      }
    } catch (e) {
      console.warn('Config fetch warning:', e);
    }
  }, []);

  useEffect(() => {
    fetchConfigAndReaders();
    fetchInventory();
  }, [fetchConfigAndReaders, fetchInventory]);

  // Category counts computation
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { 'All Items': products.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All Items') {
        counts[cat] = products.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, [products]);

  // Filtered products list
  const filteredProducts = React.useMemo(() => {
    let list = products;
    if (selectedCategory !== 'All Items') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, selectedCategory, searchQuery]);

  // Sections groupings when "All Items" is active and no search query
  const sections = React.useMemo(() => {
    if (selectedCategory !== 'All Items' || searchQuery.trim().length > 0) {
      return null;
    }
    return [
      { name: 'COCKTAILS', category: 'Cocktails', items: products.filter((p) => p.category === 'Cocktails') },
      { name: 'SMALL PLATES', category: 'Small Plates', items: products.filter((p) => p.category === 'Small Plates') },
      { name: 'PASTA', category: 'Pasta', items: products.filter((p) => p.category === 'Pasta') },
      { name: 'PIZZA', category: 'Pizza', items: products.filter((p) => p.category === 'Pizza') },
      { name: 'DESSERTS', category: 'Desserts', items: products.filter((p) => p.category === 'Desserts') },
    ];
  }, [products, selectedCategory, searchQuery]);

  // Active Reader
  const activeReader = React.useMemo(() => {
    return readers.find((r) => r.id === config.selectedReaderId) || readers[0] || null;
  }, [readers, config.selectedReaderId]);

  // Start Order from Attract Screen
  const handleStartOrder = (type: OrderType) => {
    setOrderType(type);
    setOrderStep('menu');
    resetInactivity();
  };

  // Add Item to Cart
  const handleAddToCart = (item: CartItem) => {
    resetInactivity();
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.productId === item.productId &&
          JSON.stringify(i.selectedOptions || {}) === JSON.stringify(item.selectedOptions || {})
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += item.quantity;
        return updated;
      } else {
        return [...prev, item];
      }
    });
  };

  // Select Product (opens customizer or directly adds)
  const handleSelectProduct = (product: Product) => {
    if (product.stock <= 0) return;
    if (product.customizationGroups && product.customizationGroups.length > 0) {
      setCustomizingProduct(product);
    } else {
      playAddToCartSound();
      const cartId = `${product.id}_${Date.now()}`;
      handleAddToCart({
        cartId,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        image: product.image,
        unitTotal: product.price,
      });
    }
  };

  // Cart quantity controls
  const handleUpdateQuantity = (cartId: string, delta: number) => {
    resetInactivity();
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartId === cartId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (cartId: string) => {
    resetInactivity();
    setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  };

  const handleClearCart = () => {
    resetInactivity();
    setCart([]);
  };

  // Checkout Execution: Calls backend Endpoint 2 (POST /api/checkout)
  const handlePayNow = async (forceSimulation = false) => {
    if (cart.length === 0) return;
    resetInactivity();
    playCheckoutPromptSound();

    const subtotal = cart.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
    const total = subtotal * 1.125; // 12.5% London service charge
    const orderNumber = `T12-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(total.toFixed(2)),
          currency: config.currency,
          description: `Amica Soho ${activeTable} Order #${orderNumber}`,
          readerId: config.selectedReaderId,
          items: cart.map((i) => ({ id: i.productId, quantity: i.quantity, name: i.name })),
          orderNumber,
          orderType,
          fallbackSimulation: forceSimulation,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setCheckoutError({
          title: errorData.title || 'Terminal Payment Notice',
          message: errorData.message || errorData.error || 'Failed to initiate SumUp checkout.',
          detail: errorData.detail,
          suggestSimulation: Boolean(
            errorData.suggestSimulation ||
            errorData.error === 'SUMUP_READER_NOT_FOUND' ||
            errorData.error === 'NO_LIVE_READER' ||
            errorData.error === 'INSUFFICIENT_SCOPES' ||
            res.status === 404
          ),
        });
        return;
      }

      const checkoutData: CheckoutResponse = await res.json();
      setActiveCheckout(checkoutData);
      setOrderStep('terminal_payment');
    } catch (err: any) {
      console.error('Checkout error:', err);
      setCheckoutError({
        title: 'Communication Error',
        message: 'Network error communicating with the payment terminal.',
        detail: err.message,
        suggestSimulation: true,
      });
    }
  };

  const handleSwitchToSimulationAndPay = async () => {
    setCheckoutError(null);
    try {
      await handleUpdateConfig({ simulationMode: true });
      handlePayNow(true);
    } catch {
      handlePayNow(true);
    }
  };

  // Payment Success Handler
  const handlePaymentSuccess = (updatedCheckout: CheckoutResponse) => {
    const subtotal = cart.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
    const tax = subtotal * 0.125;
    const total = subtotal + tax;

    const orderRecord: KioskOrder = {
      orderId: `ord_${Date.now()}`,
      orderNumber: updatedCheckout.id.includes('chk_')
        ? `T12-${Math.floor(100 + Math.random() * 900)}`
        : 'T12-408',
      orderType,
      items: [...cart],
      subtotal,
      tax,
      total,
      createdAt: new Date().toISOString(),
      checkoutId: updatedCheckout.id,
      readerName: updatedCheckout.readerName || activeReader?.name || 'SumUp Solo',
    };

    setCompletedOrder(orderRecord);
    setCart([]);
    setActiveCheckout(null);
    setOrderStep('payment_success');

    // Refresh inventory to reflect deductions
    fetchInventory();
  };

  // Payment Failure Handler
  const handlePaymentFailure = (reason: string) => {
    setActiveCheckout(null);
    setOrderStep('menu');
    setToastMessage(`Payment Failed: ${reason}`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Payment Cancel Handler
  const handlePaymentCancel = () => {
    setActiveCheckout(null);
    setOrderStep('menu');
  };

  // Finish Order (from Success Screen)
  const handleFinishOrder = () => {
    setCompletedOrder(null);
    setCart([]);
    setOrderStep('attract');
    resetInactivity();
  };

  // Toggle Fullscreen mode
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Update Config
  const handleUpdateConfig = async (newConfig: Partial<KioskConfig> & { apiKey?: string }) => {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        await fetchConfigAndReaders();
      }
    } catch (e) {
      console.error('Config update failed:', e);
    }
  };

  // Adjust stock via Admin
  const handleAdjustStock = async (productId: string, delta: number) => {
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, delta }),
      });
      if (res.ok) {
        await fetchInventory();
      }
    } catch {
      // Ignore
    }
  };

  // Reset stock
  const handleResetStock = async () => {
    try {
      const res = await fetch('/api/inventory/reset', { method: 'POST' });
      if (res.ok) {
        await fetchInventory();
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="w-full h-screen bg-[#0C0B0A] text-stone-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Offline Banner if disconnected */}
      {!isOnline && (
        <div className="bg-[#C89B3C] text-stone-950 px-4 py-2 text-xs font-bold flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode Active · Table orders and inventory cached locally</span>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-rose-950/90 border border-rose-700 text-white text-sm font-semibold flex items-center gap-2 shadow-2xl backdrop-blur-md animate-bounce">
          <AlertTriangle className="w-4 h-4 text-rose-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen 1: Attract / Welcome Screen */}
      {orderStep === 'attract' && (
        <AttractScreen onStartOrder={handleStartOrder} />
      )}

      {/* Screen 2: Main Tablet / Kiosk Ordering Interface (matching Amica Soho Mockup) */}
      {orderStep === 'menu' && (
        <div className="flex flex-col h-full overflow-hidden">
          <TopBar
            activeTable={activeTable}
            onChangeTable={setActiveTable}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeReader={activeReader}
            onOpenSettings={() => setShowSettings(true)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
            isOnline={isOnline}
            cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
            onOpenCart={() => setIsMobileCartOpen(true)}
          />

          {/* Mobile Horizontal Category Bar (on screens below lg) */}
          <MobileCategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              if (searchQuery) setSearchQuery('');
            }}
            categoryCounts={categoryCounts}
          />

          <div className="flex-grow flex flex-row overflow-hidden relative">
            {/* Left Category Sidebar (docked on lg+) */}
            <LeftSidebar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryCounts={categoryCounts}
            />

            {/* Center Main Catalog Panel */}
            <main
              className={`flex-1 flex flex-col overflow-y-auto p-3 sm:p-4 md:p-6 bg-[#0E0C0A] overscroll-contain ${
                cart.length > 0 ? 'pb-24 lg:pb-6' : 'pb-8 lg:pb-6'
              }`}
            >
              {sections ? (
                // Sections Grid Layout matching the tablet design
                <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto w-full">
                  {sections.map((section) => (
                    <div key={section.name} className="space-y-2.5 sm:space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="font-brand text-xs font-bold tracking-widest text-[#E5C378] uppercase">
                          {section.name}
                        </h2>
                        <button
                          onClick={() => {
                            playTapSound();
                            setSelectedCategory(section.category);
                          }}
                          className="text-[11px] text-stone-400 hover:text-[#E5C378] flex items-center gap-1 font-light min-h-[32px] p-1"
                        >
                          <span>See all</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                        {section.items.slice(0, 5).map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            currency={config.currency}
                            onSelect={handleSelectProduct}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Filtered view by category or search
                <div className="max-w-5xl mx-auto w-full space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#241F1A]">
                    <h2 className="font-brand text-xs sm:text-sm font-bold tracking-widest text-[#E5C378] uppercase">
                      {selectedCategory}
                      {searchQuery ? ` · Matching "${searchQuery}"` : ''}
                    </h2>
                    <button
                      onClick={() => {
                        playTapSound();
                        setSelectedCategory('All Items');
                        setSearchQuery('');
                      }}
                      className="text-xs text-stone-400 hover:text-white min-h-[32px] px-2 flex items-center"
                    >
                      View All
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        currency={config.currency}
                        onSelect={handleSelectProduct}
                      />
                    ))}
                  </div>
                </div>
              )}
            </main>

            {/* Right Order Panel / Cart Drawer */}
            <CartDrawer
              items={cart}
              currency={config.currency}
              activeTable={activeTable}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onPayNow={() => {
                setIsMobileCartOpen(false);
                handlePayNow(false);
              }}
              onEditItem={(item) => {
                const prod = products.find((p) => p.id === item.productId);
                if (prod) setCustomizingProduct(prod);
              }}
              isOpenOnMobile={isMobileCartOpen}
              onCloseMobile={() => setIsMobileCartOpen(false)}
            />
          </div>

          {/* Sticky Mobile Cart Bar at bottom when cart has items */}
          <MobileCartBar
            items={cart}
            currency={config.currency}
            activeTable={activeTable}
            onOpenCart={() => setIsMobileCartOpen(true)}
            onQuickPay={() => {
              setIsMobileCartOpen(false);
              handlePayNow(false);
            }}
          />
        </div>
      )}

      {/* Screen 3: Terminal Payment Modal */}
      {orderStep === 'terminal_payment' && activeCheckout && (
        <TerminalPaymentModal
          checkout={activeCheckout}
          currency={config.currency}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
          onCancel={handlePaymentCancel}
          isSimulationMode={config.simulationMode}
        />
      )}

      {/* Screen 4: Payment Success Screen */}
      {orderStep === 'payment_success' && completedOrder && (
        <PaymentSuccessModal
          order={completedOrder}
          currency={config.currency}
          onDone={handleFinishOrder}
        />
      )}

      {/* Item Customization Modal */}
      {customizingProduct && (
        <ItemCustomizeModal
          product={customizingProduct}
          currency={config.currency}
          onClose={() => setCustomizingProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Inactivity Warning Prompt */}
      {showInactivityWarning && (
        <InactivityWarningModal
          remainingSeconds={60 - inactivitySeconds}
          onContinue={resetInactivity}
          onReset={() => {
            setCart([]);
            setOrderStep('attract');
            setShowInactivityWarning(false);
          }}
        />
      )}

      {/* Admin & Reader Settings Modal */}
      {showSettings && (
        <AdminSettingsModal
          config={config}
          readers={readers}
          products={products}
          onClose={() => setShowSettings(false)}
          onUpdateConfig={handleUpdateConfig}
          onRefreshReaders={fetchConfigAndReaders}
          onAdjustStock={handleAdjustStock}
          onResetStock={handleResetStock}
          isOnline={isOnline}
        />
      )}

      {/* Checkout Diagnostic Error Modal */}
      {checkoutError && (
        <CheckoutDiagnosticModal
          error={checkoutError}
          onClose={() => setCheckoutError(null)}
          onOpenSettings={() => {
            setCheckoutError(null);
            setShowSettings(true);
          }}
          onSwitchToSimulationAndPay={handleSwitchToSimulationAndPay}
        />
      )}
    </div>
  );
}
