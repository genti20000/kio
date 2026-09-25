export interface ProductCustomizationOption {
  name: string;
  priceDelta: number;
}

export interface ProductCustomizationGroup {
  id: string;
  name: string;
  required?: boolean;
  options: ProductCustomizationOption[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  dietary?: string[];
  stock: number;
  isAvailable: boolean;
  customizationGroups?: ProductCustomizationGroup[];
}

export interface CartItem {
  cartId: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  selectedOptions?: Record<string, string>;
  unitTotal: number;
}

export type OrderType = 'dine_in' | 'takeaway';

export interface SumUpReader {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  model: string;
  batteryLevel?: number;
  identifier?: string;
}

export type CheckoutStatus = 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'CANCELLED';

export interface CheckoutResponse {
  id: string;
  status: CheckoutStatus;
  amount: number;
  currency: string;
  readerId: string;
  readerName?: string;
  description?: string;
  date?: string;
  cardLast4?: string;
  cardType?: string;
  failureReason?: string;
  terminalStep?: 'connecting' | 'awaiting_card' | 'processing' | 'approved' | 'declined';
  orderNumber?: string;
}

export interface KioskOrder {
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  checkoutId: string;
  readerName: string;
  receiptEmail?: string;
}

export interface KioskConfig {
  merchantCode: string;
  hasApiKey: boolean;
  selectedReaderId: string;
  currency: string;
  simulationMode: boolean;
}
