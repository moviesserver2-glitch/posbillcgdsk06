import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCart } from '@/hooks/useCart';
import { useSales } from '@/hooks/useSales';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { Sale } from '@/types/product';
import { formatINR } from '@/lib/currency';
import { Percent, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const cart = useCart((state) => state.cart);
  const totalDiscount = useCart((state) => state.totalDiscount);
  const updateCartItemDiscount = useCart((state) => state.updateCartItemDiscount);
  const setTotalDiscount = useCart((state) => state.setTotalDiscount);
  const clearCart = useCart((state) => state.clearCart);
  const { completeSale } = useSales();
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountInputs, setDiscountInputs] = useState<Record<string, { amount: string; percent: string }>>({});
  const [orderDiscountInput, setOrderDiscountInput] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const finalizeButtonRef = useRef<HTMLButtonElement>(null);
  const cashRadioRef = useRef<HTMLButtonElement>(null);
  const onlineRadioRef = useRef<HTMLButtonElement>(null);
  const amountReceivedInputRef = useRef<HTMLInputElement>(null);

  const subtotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const itemDiscountsTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.discount, 0),
    [cart]
  );

  const grandTotal = useMemo(() =>
    subtotal - itemDiscountsTotal - totalDiscount,
    [subtotal, itemDiscountsTotal, totalDiscount]
  );

  const balance = useMemo(() => {
    const received = parseFloat(amountReceived);
    if (isNaN(received) || received <= 0) return 0;
    return received - grandTotal;
  }, [amountReceived, grandTotal]);

  const handleDiscountChange = (productId: string, type: 'amount' | 'percent', value: string) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    const itemTotal = item.product.price * item.quantity;

    if (type === 'amount') {
      const amount = parseFloat(value) || 0;
      const clampedAmount = Math.min(Math.max(0, amount), itemTotal);
      const percent = itemTotal > 0 ? (clampedAmount / itemTotal) * 100 : 0;

      setDiscountInputs({
        ...discountInputs,
        [productId]: { amount: value, percent: percent.toFixed(1) },
      });
      updateCartItemDiscount(productId, clampedAmount, percent);
    } else {
      const percent = parseFloat(value) || 0;
      const clampedPercent = Math.min(Math.max(0, percent), 100);
      const amount = (itemTotal * clampedPercent) / 100;

      setDiscountInputs({
        ...discountInputs,
        [productId]: { amount: amount.toFixed(2), percent: value },
      });
      updateCartItemDiscount(productId, amount, clampedPercent);
    }
  };

  const handleOrderDiscountChange = (value: string) => {
    setOrderDiscountInput(value);
    const amount = parseFloat(value) || 0;
    const maxDiscount = subtotal - itemDiscountsTotal;
    setTotalDiscount(Math.min(Math.max(0, amount), maxDiscount));
  };

  const handleFinalizeSale = useCallback(async () => {
    if (cart.length === 0 || completeSale.isPending || grandTotal <= 0) return;

    try {
      const sale = await completeSale.mutateAsync({
        items: cart,
        paymentMethod: paymentMethod,
        taxRate: 0,
        totalDiscount,
      });
      setLastSale(sale);
      setShowReceipt(true);
      clearCart();
      setDiscountInputs({});
      setOrderDiscountInput('');
    } catch (error) {
      // Error is handled in the mutation
      toast.error('Failed to finalize sale.');
    }
  }, [cart, completeSale, clearCart, totalDiscount, paymentMethod, grandTotal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        amountReceivedInputRef.current?.focus();
        setAmountReceived((prev) => prev + e.key);
      }

      switch (e.key) {
        case '+':
          e.preventDefault();
          finalizeButtonRef.current?.click();
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          setPaymentMethod('cash');
          cashRadioRef.current?.focus();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          setPaymentMethod('online');
          onlineRadioRef.current?.focus();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFinalizeSale]);

  const handleReceiptClose = () => {
    setShowReceipt(false);
    navigate('/pos');
  };

  return (
    <MainLayout>
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b border-border bg-card">
          <h1 className="text-2xl font-bold">Checkout</h1>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {cart.map((item) => {
              const itemTotal = item.product.price * item.quantity;
              const inputs = discountInputs[item.product.id] || { amount: '', percent: '' };

              return (
                <div key={item.product.id} className="p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatINR(item.product.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">₹</span>
                        <Input
                          type="number"
                          value={inputs.amount}
                          onChange={(e) => handleDiscountChange(item.product.id, 'amount', e.target.value)}
                          className="h-8 w-24 text-sm"
                          min="0"
                          max={itemTotal}
                          placeholder="Amount"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={inputs.percent}
                          onChange={(e) => handleDiscountChange(item.product.id, 'percent', e.target.value)}
                          className="h-8 w-20 text-sm"
                          min="0"
                          max="100"
                          placeholder="Percent"
                        />
                        <Percent className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="w-28 text-right">
                      {item.discount > 0 && (
                        <p className="text-xs text-destructive">-{formatINR(item.discount)}</p>
                      )}
                      <span className="text-sm font-semibold">
                        {formatINR(itemTotal - item.discount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="w-96 border-l border-border bg-card/50 p-4 flex flex-col">
            <div className="flex-1 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {itemDiscountsTotal > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Item Discounts</span>
                  <span>-{formatINR(itemDiscountsTotal)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Order Discount</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs">₹</span>
                  <Input
                    type="number"
                    value={orderDiscountInput}
                    onChange={(e) => handleOrderDiscountChange(e.target.value)}
                    placeholder="0"
                    className="h-8 w-20 text-sm"
                    min="0"
                  />
                </div>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Order Discount Applied</span>
                  <span>-{formatINR(totalDiscount)}</span>
                </div>
              )}
              <div className="pt-4">
                <h4 className="text-sm font-medium mb-2">Payment Method</h4>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cash" id="cash" ref={cashRadioRef} />
                    <Label htmlFor="cash">Cash</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="online" id="online" ref={onlineRadioRef} />
                    <Label htmlFor="online">PhonePe</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">{formatINR(grandTotal)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Amount Received</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs">₹</span>
                  <Input
                    ref={amountReceivedInputRef}
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0.00"
                    className="h-8 w-24 text-sm text-right"
                    min="0"
                  />
                </div>
              </div>
              <div className="text-center mt-2 pt-2 border-t">
                <Label className="text-muted-foreground font-normal">Balance</Label>
                <div className="text-3xl font-bold">{formatINR(balance)}</div>
              </div>
            </div>
            <Button
              ref={finalizeButtonRef}
              size="lg"
              className="w-full h-14 gap-2 pos-button-primary text-lg mt-4"
              onClick={handleFinalizeSale}
              disabled={completeSale.isPending || grandTotal <= 0}
            >
              <ShoppingCart className="h-5 w-5" />
              Finalize Sale
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Press + to finalize sale
            </p>
          </div>
        </div>
      </div>
      <ReceiptModal sale={lastSale} open={showReceipt} onClose={handleReceiptClose} />
    </MainLayout>
  );
}
