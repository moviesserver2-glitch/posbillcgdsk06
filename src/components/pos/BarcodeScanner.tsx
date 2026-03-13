import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Search, ScanBarcode } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

export interface BarcodeScannerHandle {
  focus: () => void;
}

export const BarcodeScanner = forwardRef<BarcodeScannerHandle>((props, ref) => {
  const [barcode, setBarcode] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { products } = useProducts();
  const openQuantityDialog = useCart((state) => state.openQuantityDialog);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    }
  }));

  useEffect(() => {
    const focusInput = () => inputRef.current?.focus();
    focusInput();

    const handleClick = (event: MouseEvent) => {
      if (inputRef.current?.form && !inputRef.current.form.contains(event.target as Node)) {
        setTimeout(() => {
          if (document.querySelector('[role="dialog"][data-state="open"]')) {
            return;
          }
          focusInput();
        }, 0);
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const findProductByBarcode = (code: string) => {
    return products.find((p) => p.barcode === code);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) return;

    const product = findProductByBarcode(barcode.trim());
    if (product) {
      if (product.stock <= 0) {
        toast.error(`${product.name} is out of stock`);
      } else {
        openQuantityDialog(product);
      }
    } else {
      toast.error('Product not found');
    }
    setBarcode('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value.toUpperCase())}
          placeholder="Scan barcode or enter manually..."
          className="pos-input w-full pl-12 pr-12 text-lg"
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-accent transition-colors"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </form>
  );
});