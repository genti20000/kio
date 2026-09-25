/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_PRODUCTS, CATEGORIES } from './data/initialCatalog.ts';
import { Product, CartItem, OrderType, SumUpReader, CheckoutResponse, KioskOrder, KioskConfig } from './types/kiosk.ts';
import { AttractScreen } from './components/AttractScreen.tsx';
import { LeftSidebar } from './components/LeftSidebar.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ItemCustomizeModal } from './components/ItemCustomizeModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { TerminalPaymentModal } from './components/TerminalPaymentModal.tsx';
import { PaymentSuccessModal } from './components/PaymentSuccessModal.tsx';
import { InactivityWarningModal } from './components/InactivityWarningModal.tsx';
import { AdminSettingsModal } from './components/AdminSettingsModal.tsx';
import { CheckoutDiagnosticModal, CheckoutErrorInfo } from './components/CheckoutDiagnosticModal.tsx';
import { playAddToCartSound, playTapSound, playCheckoutPromptSound } from './utils/audio.ts';
import {
  Coffee,
  ShoppingBag,
  Search,
  ChevronDown,
  WifiOff,
  AlertTriangle,
  SlidersHorizontal,
  CreditCard,
  X,
} from 'lucide-react';

export default function App() {
  // Navigation & Flow State
  const [orderStep, setOrderStep] = useState<'attract' | 'menu' | 'terminal_payment' | 'payment_success'>('attract');
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [activeTable, setActiveTable] = useState<string>('Table 12');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showTableSelect, setShowTableSelect] = useState<boolean>(false);
  const [showMobileSearch, setShowMobileSearch] = useState<boolean>(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);

  // Product Catalog & Inventory
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const cached = localStorage.getItem('amica_kiosk_products_v4');
      if (cached) {
        const parsed: Product[] = JSON.parse(cached);
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

  // Shopping Cart pre-populated with coffee atelier sample if empty
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const cached = localStorage.getItem('amica_kiosk_cart_v4');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    const flatWhite = INITIAL_PRODUCTS.find((p) => p.id === 'prod_flat_white');
    const croissant = INITIAL_PRODUCTS.find((p) => p.id === 'prod_croissant_pastries');
    const sample: CartItem[] = [];
    if (flatWhite) {
      sample.push({
        cartId: 'cart_fw_1',
        productId: flatWhite.id,
        name: 'Silky Flat White',
        price: 4.80,
        quantity: 1,
        image: flatWhite.image,
        selectedOptions: { 'Milk Preference': 'Oat Milk (Barista Edition)' },
        unitTotal: 5.30,
      });
    }
    if (croissant) {
      sample.push({
        cartId: 'cart_croissant_2',
        productId: croissant.id,
        name: 'Warm Butter Pastries',
        price: 5.50,
        quantity: 1,
        image: croissant.image,
        unitTotal: 5.50,
      });
    }
    return sample;
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

  // Inactivity Timer State (75s total, warning at 60s)
  const [inactivitySeconds, setInactivitySeconds] = useState(0);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Save cart & products to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('amica_kiosk_cart_v4', JSON.stringify(cart));
    } catch {
      // Ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('amica_kiosk_products_v4', JSON.stringify(products));
    } catch {
      // Ignore
    }
  }, [products]);

  // Reset inactivity timer
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

  useEffect(() => {
    if (orderStep !== 'menu') {
      setShowInactivityWarning(false);
      return;
    }

    inactivityTimerRef.current = setInterval(() => {
      setInactivitySeconds((prev) => {
        const next = prev + 1;
        if (next >= 75) {
          setCart([]);
          setOrderStep('attract');
          setShowInactivityWarning(false);
          return 0;
        } else if (next >= 60) {
          setShowInactivityWarning(true);
        }
        return next;
      });
    }, 1000);

    return () => {
      if (inactivityTimerRef.current) clearInterval(inactivityTimerRef.current);
    };
  }, [orderStep]);

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

  // Category counts
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { 'All Items': products.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'All Items') {
        counts[cat] = products.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, [products]);

  // Filtered products
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

  const activeReader = React.useMemo(() => {
    return readers.find((r) => r.id === config.selectedReaderId) || readers[0] || null;
  }, [readers, config.selectedReaderId]);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
  const cartTotal = cartSubtotal * 1.125;

  const handleStartOrder = (type: OrderType) => {
    setOrderType(type);
    setOrderStep('menu');
    resetInactivity();
  };

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

  const handlePayNow = async (forceSimulation = false) => {
    if (cart.length === 0) return;
    resetInactivity();
    playCheckoutPromptSound();

    const subtotal = cart.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
    const total = subtotal * 1.125;
    const orderNumber = `${activeTable.replace(/\s+/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(total.toFixed(2)),
          currency: config.currency,
          description: `AMICA Roastery & Bar ${activeTable}`,
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
          suggestSimulation: true,
        });
        return;
      }

      const checkoutData: CheckoutResponse = await res.json();
      setActiveCheckout(checkoutData);
      setIsMobileCartOpen(false);
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

  const handlePaymentSuccess = (updatedCheckout: CheckoutResponse) => {
    const subtotal = cart.reduce((sum, item) => sum + item.unitTotal * item.quantity, 0);
    const tax = subtotal * 0.125;
    const total = subtotal + tax;

    const orderRecord: KioskOrder = {
      orderId: `ord_${Date.now()}`,
      orderNumber: updatedCheckout.id.includes('chk_')
        ? `${activeTable.replace(/\s+/g, '')}-${Math.floor(100 + Math.random() * 900)}`
        : 'T12-901',
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
    fetchInventory();
  };

  const handlePaymentFailure = (reason: string) => {
    setActiveCheckout(null);
    setOrderStep('menu');
    setToastMessage(`Payment Failed: ${reason}`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handlePaymentCancel = () => {
    setActiveCheckout(null);
    setOrderStep('menu');
  };

  const handleFinishOrder = () => {
    setCompletedOrder(null);
    setCart([]);
    setOrderStep('attract');
    resetInactivity();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

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

  const tableList = ['Table 12', 'Table 01', 'Booth 04', 'Counter 02', 'Lounge 08'];
  const formattedCurrency = config.currency === 'GBP' ? '£' : config.currency === 'EUR' ? '€' : '$';

  return (
    <div className="w-full h-screen bg-roastery-pattern text-[#f4ece1] flex flex-col overflow-hidden font-body select-none">
      {/* Offline Alert */}
      {!isOnline && (
        <div className="bg-[#c88a58] text-[#120d09] px-4 py-2 font-mono-meta text-xs font-bold flex items-center justify-center gap-2 tracking-widest uppercase flex-shrink-0 z-50">
          <WifiOff className="w-4 h-4" />
          <span>Offline Terminal Cache Active</span>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-[#1c1410] border border-rose-500/50 text-rose-300 font-mono-meta text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen 1: Attract / Welcome Screen */}
      {orderStep === 'attract' && (
        <AttractScreen onStartOrder={handleStartOrder} />
      )}

      {/* Screen 2: Responsive Ordering Interface (Mobile & Tablet & Desktop Optimized) */}
      {orderStep === 'menu' && (
        <div className="flex h-full w-full overflow-hidden">
          {/* Desktop Left Icon Nav */}
          <LeftSidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            onOpenSettings={() => setShowSettings(true)}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Top Navigation Bar (Mobile & Desktop Responsive) */}
            <header className="px-4 sm:px-6 py-3.5 bg-[#14100e]/95 border-b border-[#c88a58]/20 flex items-center justify-between gap-3 z-30 flex-shrink-0 backdrop-blur-md">
              {/* Brand Lockup */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#241a14] border border-[#c88a58]/40 flex items-center justify-center text-[#dda15e] font-bold text-sm shadow-md">
                  ☕
                </div>
                <div>
                  <h1 className="font-coffee text-base sm:text-lg font-bold text-[#f4ece1] leading-none tracking-wide">
                    AMICA
                  </h1>
                  <span className="font-mono-meta text-[9px] text-[#dda15e] tracking-widest uppercase">
                    Roastery & Bar
                  </span>
                </div>
              </div>

              {/* Table Selector & Search Controls */}
              <div className="flex items-center gap-2">
                {/* Table Picker */}
                <div className="relative">
                  <button
                    onClick={() => setShowTableSelect(!showTableSelect)}
                    className="h-9 px-3 rounded-full bg-[#1e1714] border border-[#c88a58]/30 font-mono-meta text-xs text-[#f4ece1] flex items-center gap-1.5 hover:border-[#dda15e] transition-colors"
                  >
                    <span>{activeTable}</span>
                    <ChevronDown className="w-3 h-3 text-[#dda15e]" />
                  </button>

                  {showTableSelect && (
                    <div className="absolute right-0 mt-2 w-36 bg-[#1a1411] border border-[#c88a58]/50 rounded-2xl p-1.5 z-50 shadow-2xl">
                      <div className="px-3 py-1 font-mono-meta text-[9px] text-[#dda15e] uppercase tracking-wider">
                        Select Table
                      </div>
                      {tableList.map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            playTapSound();
                            setActiveTable(t);
                            setShowTableSelect(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono-meta transition-colors ${
                            activeTable === t
                              ? 'bg-[#c88a58] text-[#120d09] font-bold'
                              : 'text-[#f4ece1]/70 hover:bg-[#261c16]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Toggle / Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu..."
                    className="hidden sm:block pl-8 pr-3 py-1.5 bg-[#1a1512] border border-[#c88a58]/25 rounded-full text-xs font-body text-[#f4ece1] placeholder-[#b8aaa0]/50 focus:outline-none focus:border-[#dda15e] w-40 md:w-52 transition-all"
                  />
                  <Search className="hidden sm:block w-3.5 h-3.5 text-[#dda15e] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />

                  {/* Mobile Search Button */}
                  <button
                    onClick={() => setShowMobileSearch(!showMobileSearch)}
                    className="sm:hidden w-9 h-9 rounded-full bg-[#1e1714] border border-[#c88a58]/30 flex items-center justify-center text-[#dda15e]"
                    title="Search"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>

                {/* Mobile Cart Trigger Button */}
                <button
                  onClick={() => {
                    playTapSound();
                    setIsMobileCartOpen(true);
                  }}
                  className="lg:hidden relative h-9 px-3.5 rounded-full pill-caramel flex items-center gap-1.5 font-coffee text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#120d09]" />
                  <span>{totalCartCount}</span>
                </button>
              </div>
            </header>

            {/* Mobile Expanded Search Bar */}
            {showMobileSearch && (
              <div className="sm:hidden px-4 py-2.5 bg-[#17120f] border-b border-[#c88a58]/20 flex items-center gap-2">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search coffee, drinks, treats..."
                    autoFocus
                    className="w-full pl-8 pr-3 py-2 bg-[#201915] border border-[#c88a58]/30 rounded-full text-xs font-body text-[#f4ece1] placeholder-[#b8aaa0]/50 focus:outline-none focus:border-[#dda15e]"
                  />
                  <Search className="w-3.5 h-3.5 text-[#dda15e] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowMobileSearch(false);
                  }}
                  className="text-xs text-[#b8aaa0] px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Horizontal Scrollable Categories Bar (Warm Pill Style from image) */}
            <div className="px-4 sm:px-6 py-3 bg-[#110e0c]/90 border-b border-[#c88a58]/15 flex items-center gap-2 overflow-x-auto no-scrollbar flex-shrink-0 z-20">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      playTapSound();
                      setSelectedCategory(cat);
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-coffee font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer min-h-[38px] ${
                      isActive
                        ? 'pill-caramel shadow-md scale-102'
                        : 'bg-[#1c1714] border border-[#c88a58]/20 text-[#b8aaa0] hover:text-[#f4ece1] hover:border-[#dda15e]/50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Main Products Scrollable Grid */}
            <main className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 md:p-8 pb-28 lg:pb-8">
              {/* Category Title Header */}
              <div className="mb-6 flex items-baseline justify-between border-b border-[#c88a58]/15 pb-3">
                <div>
                  <span className="font-mono-meta text-[10px] text-[#dda15e] tracking-widest uppercase">
                    Atelier Cupping Selection
                  </span>
                  <h2 className="font-coffee text-2xl sm:text-3xl font-bold text-[#f4ece1] mt-0.5">
                    {selectedCategory}
                    {searchQuery ? ` · Matching "${searchQuery}"` : ''}
                  </h2>
                </div>
                <span className="font-mono-meta text-xs text-[#b8aaa0]">
                  {filteredProducts.length} items
                </span>
              </div>

              {/* Product Cards Grid (Fully Responsive on Mobile & Desktop) */}
              {filteredProducts.length === 0 ? (
                <div className="py-20 text-center text-[#b8aaa0] space-y-3">
                  <Coffee className="w-10 h-10 text-[#dda15e]/60 mx-auto" />
                  <p className="font-coffee text-lg text-[#f4ece1]">No items found</p>
                  <p className="font-body text-xs text-[#b8aaa0]/70 max-w-sm mx-auto">
                    Try searching for another brew or select All Items to view the complete roastery collection.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('All Items');
                      setSearchQuery('');
                    }}
                    className="mt-2 px-5 py-2 rounded-full pill-espresso text-xs font-mono-meta"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      currency={config.currency}
                      onSelect={handleSelectProduct}
                    />
                  ))}
                </div>
              )}
            </main>

            {/* Mobile Sticky Bottom Floating Order Bar */}
            {cart.length > 0 && (
              <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-[#0e0c0a] via-[#0e0c0a]/95 to-transparent z-40 animate-slide-up">
                <div className="max-w-md mx-auto flex items-center justify-between p-3 rounded-full bg-[#1e1714] border border-[#c88a58]/50 shadow-2xl backdrop-blur-lg">
                  <button
                    onClick={() => {
                      playTapSound();
                      setIsMobileCartOpen(true);
                    }}
                    className="flex items-center gap-3 pl-3 text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#2e211a] border border-[#c88a58] flex items-center justify-center text-[#dda15e] font-bold text-xs">
                      {totalCartCount}
                    </div>
                    <div>
                      <div className="font-coffee text-xs font-bold text-[#f4ece1]">
                        {activeTable}
                      </div>
                      <div className="font-mono-meta text-xs text-[#dda15e] font-bold">
                        {formattedCurrency}{cartTotal.toFixed(2)}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      playTapSound();
                      handlePayNow(false);
                    }}
                    className="py-2.5 px-6 rounded-full pill-caramel font-coffee text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4 text-[#120d09]" />
                    <span>Pay Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cart Drawer (Desktop persistent sidebar, Mobile sliding bottom sheet) */}
          <CartDrawer
            items={cart}
            currency={config.currency}
            activeTable={activeTable}
            activeReaderName={activeReader?.name}
            isOpenMobile={isMobileCartOpen}
            onCloseMobile={() => setIsMobileCartOpen(false)}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onPayNow={() => handlePayNow(false)}
            onEditItem={(item) => {
              const prod = products.find((p) => p.id === item.productId);
              if (prod) setCustomizingProduct(prod);
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
          remainingSeconds={75 - inactivitySeconds}
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
