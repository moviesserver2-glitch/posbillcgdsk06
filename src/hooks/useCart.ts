import { create } from 'zustand';
import { Product, CartItem } from '@/types/product';

interface CartState {
  cart: CartItem[];
  totalDiscount: number;
  isQuantityDialogOpen: boolean;
  productToAdd: Product | null;
  addToCart: (product: Product, quantity?: number) => void;
  openQuantityDialog: (product: Product) => void;
  closeQuantityDialog: () => void;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  updateCartItemDiscount: (productId: string, discount: number, discountPercent: number) => void;
  setTotalDiscount: (discount: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
}

const useCartStore = create<CartState>((set) => ({
  cart: [],
  totalDiscount: 0,
  isQuantityDialogOpen: false,
  productToAdd: null,

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

  openQuantityDialog: (product) =>
    set({ isQuantityDialogOpen: true, productToAdd: product }),

  closeQuantityDialog: () =>
    set({ isQuantityDialogOpen: false, productToAdd: null }),

  updateCartItemQuantity: (productId, quantity) =>
    set((state) => ({
      cart:
        quantity <= 0
          ? state.cart.filter((item) => item.product.id !== productId)
          : state.cart.map((item) =>
              item.product.id === productId ? { ...item, quantity } : item
            ),
    })),

  updateCartItemDiscount: (productId, discount, discountPercent) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.product.id === productId
          ? { ...item, discount, discountPercent }
          : item
      ),
    })),

  setTotalDiscount: (discount) =>
    set({ totalDiscount: discount }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    })),

  clearCart: () => set({ cart: [], totalDiscount: 0 }),
}));

export const useCart = useCartStore;

export const useCartActions = () => {
    const openQuantityDialog = useCartStore((state) => state.openQuantityDialog);

    const addToCart = (product: Product) => {
        openQuantityDialog(product);
    }

    return { addToCart };
}