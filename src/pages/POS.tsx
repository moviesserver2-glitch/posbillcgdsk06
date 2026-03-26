import { useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { BarcodeScanner, BarcodeScannerHandle } from '@/components/pos/BarcodeScanner';
import { Cart } from '@/components/pos/Cart';
import { QuantityDialog } from '@/components/pos/QuantityDialog';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

export default function POSPage() {
  const barcodeScannerRef = useRef<BarcodeScannerHandle>(null);
  const {
    isQuantityDialogOpen,
    productToAdd,
    addToCart,
    closeQuantityDialog,
  } = useCart();

  const handleConfirmQuantity = (quantity: number, amount: number) => {
    if (productToAdd) {
      if (quantity > productToAdd.stock) {
        toast.error(
          `Only ${productToAdd.stock} ${productToAdd.name} available in stock`
        );
        return;
      }
      addToCart(productToAdd, quantity, amount);
      toast.success(`Added ${productToAdd.name} to cart`);
      closeQuantityDialog();
      barcodeScannerRef.current?.focus();
    }
  };

  const handleDialogClose = () => {
    closeQuantityDialog();
    barcodeScannerRef.current?.focus();
  };

  return (
    <MainLayout noPadding>
      <div className="h-screen flex flex-col">
        <div className="p-4 border-b border-border bg-card">
          <BarcodeScanner ref={barcodeScannerRef} />
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-full flex flex-col">
            <Cart />
          </div>
        </div>
      </div>
      <QuantityDialog
        isOpen={isQuantityDialogOpen}
        onClose={handleDialogClose}
        onConfirm={handleConfirmQuantity}
        productName={productToAdd?.name || ''}
        productPrice={productToAdd?.price || 0}
      />
    </MainLayout>
  );
}
