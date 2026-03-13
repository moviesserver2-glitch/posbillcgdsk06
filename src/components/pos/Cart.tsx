import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptModal } from './ReceiptModal';
import { RefundModal } from './RefundModal';
import { Sale } from '@/types/product';
import { formatINR } from '@/lib/currency';

export function Cart() {
  const navigate = useNavigate();
  const cart = useCart((state) => state.cart);
  const updateCartItemQuantity = useCart((state) => state.updateCartItemQuantity);
  const removeFromCart = useCart((state) => state.removeFromCart);
  const clearCart = useCart((state) => state.clearCart);
  const [showRefund, setShowRefund] = useState(false);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleCheckout = useCallback(() => {
    if (cart.length === 0) return;
    navigate('/checkout');
  }, [cart.length, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }

        if (e.key === '+' || e.key === 'Enter' || (e.ctrlKey && e.key === 's')) {
            if (cart.length > 0) {
                e.preventDefault();
                handleCheckout();
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, [cart.length, handleCheckout]);


  if (cart.length === 0) {
    return (
      <div className="pos-card h-full flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Current Order</h2>
          <Button variant="outline" size="sm" onClick={() => setShowRefund(true)}>
            Refund
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground text-center">
            Scan barcode or select products to add to cart
          </p>
        </div>
        <RefundModal open={showRefund} onClose={() => setShowRefund(false)} />
      </div>
    );
  }

  return (
    <>
      <div className="pos-card h-full flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Current Order ({cart.length} items)
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRefund(true)}>
              Refund
            </Button>
            <Button variant="ghost" size="sm" onClick={clearCart}>
              Clear
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.map((item) => {
            const itemTotal = item.product.price * item.quantity;
            
            return (
              <div
                key={item.product.id}
                className="p-3 bg-secondary/50 rounded-lg animate-slide-in space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm flex-1">
                    {item.product.name}
                  </h4>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {formatINR(itemTotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {formatINR(item.product.price)} × {item.quantity}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateCartItemQuantity(item.product.id, item.quantity - 1)
                      }
                      className="h-7 w-7 flex items-center justify-center rounded-md bg-background hover:bg-accent transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateCartItemQuantity(item.product.id, item.quantity + 1)
                      }
                      disabled={item.quantity >= item.product.stock}
                      className="h-7 w-7 flex items-center justify-center rounded-md bg-background hover:bg-accent transition-colors disabled:opacity-50"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="h-7 w-7 flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 transition-colors ml-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-border space-y-3">
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{formatINR(subtotal)}</span>
          </div>

          <Button
            size="lg"
            className="w-full h-14 gap-2 pos-button-primary text-lg"
            onClick={handleCheckout}
          >
            <ShoppingCart className="h-5 w-5" />
            Check Out
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Press Enter, + or Ctrl+S to checkout
          </p>
        </div>
      </div>
      <RefundModal
        open={showRefund}
        onClose={() => setShowRefund(false)}
      />
    </>
  );
}
