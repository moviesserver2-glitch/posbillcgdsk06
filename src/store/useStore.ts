import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, Sale } from '@/types/product';

interface StoreState {
  products: Product[];
  cart: CartItem[];
  sales: Sale[];
  
  // Product actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  importProducts: (products: Product[]) => void;
  findProductByBarcode: (barcode: string) => Product | undefined;
  
  // Cart actions
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  
  // Sale actions
  completeSale: (paymentMethod: 'cash' | 'card', taxRate?: number) => Sale | null;
  
  // Stats
  getLowStockProducts: () => Product[];
  getTodaysSales: () => Sale[];
  getTodaysStats: () => {
    sales: number;
    profit: number;
    orders: number;
  };
}

// Generate order ID in format DDMMYYYY + unique number
const generateOrderId = (): string => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const unique = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${dd}${mm}${yyyy}${unique}`;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: [],
      cart: [],
      sales: [],

      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product],
        })),

      updateProduct: (id, updates) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        })),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      importProducts: (products) =>
        set((state) => ({
          products: [...state.products, ...products],
        })),

      findProductByBarcode: (barcode) => {
        return get().products.find((p) => p.barcode === barcode);
      },

      addToCart: (product, quantity = 1) =>
        set((state) => {
          const existingItem = state.cart.find(
            (item) => item.product.id === product.id
          );
          if (existingItem) {
            return {
              cart: state.cart.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            cart: [...state.cart, { product, quantity, discount: 0, discountPercent: 0 }],
          };
        }),

      updateCartItemQuantity: (productId, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((item) => item.product.id !== productId)
              : state.cart.map((item) =>
                  item.product.id === productId ? { ...item, quantity } : item
                ),
        })),

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        })),

      clearCart: () => set({ cart: [] }),

      completeSale: (paymentMethod, taxRate = 0) => {
        const state = get();
        if (state.cart.length === 0) return null;

        const subtotal = state.cart.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        const itemDiscounts = state.cart.reduce(
          (sum, item) => sum + (item.discount || 0),
          0
        );
        const tax = (subtotal - itemDiscounts) * taxRate;
        const total = subtotal - itemDiscounts + tax;
        const profit = state.cart.reduce(
          (sum, item) =>
            sum + (item.product.price - item.product.cost) * item.quantity - (item.discount || 0),
          0
        );

        const sale: Sale = {
          id: Date.now().toString(),
          orderId: generateOrderId(),
          items: [...state.cart],
          subtotal,
          discount: itemDiscounts,
          tax,
          total,
          profit: Math.max(0, profit),
          paymentMethod,
          createdAt: new Date(),
        };

        // Update stock
        const updatedProducts = state.products.map((product) => {
          const cartItem = state.cart.find(
            (item) => item.product.id === product.id
          );
          if (cartItem) {
            return {
              ...product,
              stock: Math.max(0, product.stock - cartItem.quantity),
              updatedAt: new Date(),
            };
          }
          return product;
        });

        set({
          sales: [...state.sales, sale],
          products: updatedProducts,
          cart: [],
        });

        return sale;
      },

      getLowStockProducts: () => {
        return get().products.filter((p) => p.stock <= p.lowStockThreshold);
      },

      getTodaysSales: () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return get().sales.filter(
          (sale) => new Date(sale.createdAt) >= today
        );
      },

      getTodaysStats: () => {
        const todaysSales = get().getTodaysSales();
        return {
          sales: todaysSales.reduce((sum, sale) => sum + sale.total, 0),
          profit: todaysSales.reduce((sum, sale) => sum + sale.profit, 0),
          orders: todaysSales.length,
        };
      },
    }),
    {
      name: 'pos-storage',
      version: 2,
    }
  )
);
