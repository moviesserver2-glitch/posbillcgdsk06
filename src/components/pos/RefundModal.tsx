import { useState } from 'react';
import { useSales } from '@/hooks/useSales';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Receipt, X } from 'lucide-react';
import { format } from 'date-fns';
import { formatINR } from '@/lib/currency';

interface RefundModalProps {
  open: boolean;
  onClose: () => void;
}

export function RefundModal({ open, onClose }: RefundModalProps) {
  const { findSaleByOrderId, sales } = useSales();
  const [searchOrderId, setSearchOrderId] = useState('');
  const [foundSale, setFoundSale] = useState<ReturnType<typeof findSaleByOrderId>>(undefined);
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!searchOrderId.trim()) return;
    const sale = findSaleByOrderId(searchOrderId.trim());
    setFoundSale(sale);
    setSearched(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClose = () => {
    setSearchOrderId('');
    setFoundSale(undefined);
    setSearched(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Refund Order
            </span>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter Order ID (e.g., 250120260001)"
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {/* Search results */}
          {searched && (
            <div className="border rounded-lg p-4">
              {foundSale ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">Order #{foundSale.orderId}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(foundSale.createdAt), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                    <span className="font-bold text-lg">{formatINR(foundSale.total)}</span>
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Items:</p>
                    {foundSale.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}× {item.product.name}
                          {item.discount > 0 && (
                            <span className="text-destructive text-xs ml-1">
                              (-{formatINR(item.discount)})
                            </span>
                          )}
                        </span>
                        <span>{formatINR(item.product.price * item.quantity - item.discount)}</span>
                      </div>
                    ))}
                  </div>

                  {foundSale.discount > 0 && (
                    <div className="flex justify-between text-sm text-destructive border-t pt-2">
                      <span>Total Discount</span>
                      <span>-{formatINR(foundSale.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total Paid</span>
                    <span>{formatINR(foundSale.total)}</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Payment Method: {foundSale.paymentMethod.toUpperCase()}
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      To process a refund, please return the items and refund {formatINR(foundSale.total)} to the customer.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No order found with ID: {searchOrderId}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Order ID format: DDMMYYYY + 4 digits (e.g., 250120260001)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recent orders */}
          {!searched && sales.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Recent Orders:</p>
              <div className="max-h-48 overflow-auto space-y-2">
                {sales.slice(0, 5).map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => {
                      setSearchOrderId(sale.orderId);
                      setFoundSale(sale);
                      setSearched(true);
                    }}
                    className="w-full text-left p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">#{sale.orderId}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(sale.createdAt), 'dd MMM yyyy, HH:mm')}
                        </p>
                      </div>
                      <span className="font-semibold">{formatINR(sale.total)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
