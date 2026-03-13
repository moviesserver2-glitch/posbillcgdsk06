import { MainLayout } from '@/components/layout/MainLayout';
import { useSales } from '@/hooks/useSales';
import { format } from 'date-fns';
import { Receipt, Eye, Loader2, FileDown } from 'lucide-react';
import { useState, useRef } from 'react';
import { Sale } from '@/types/product';
import { ReceiptModal } from '@/components/pos/ReceiptModal';
import { formatINR } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SalesPage() {
  const { sales, isLoading } = useSales();
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const salesRef = useRef<HTMLDivElement>(null);

  const sortedSales = [...sales].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const exportToCSV = () => {
    const headers = [
      'Order ID',
      'Date & Time',
      'Items',
      'Payment Method',
      'Subtotal',
      'Discount',
      'Total',
      'Profit',
    ];

    const csvContent = [
      headers.join(','),
      ...sortedSales.map((sale) =>
        [
          sale.orderId,
          format(new Date(sale.createdAt), 'MMM dd, yyyy HH:mm'),
          sale.items.reduce((sum, item) => sum + item.quantity, 0),
          sale.paymentMethod,
          sale.subtotal,
          sale.discount,
          sale.total,
          sale.profit,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${sortedSales.length} sales`);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sales History</h1>
            <p className="text-muted-foreground">
              View all completed transactions
            </p>
          </div>
          <Button onClick={exportToCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Export as CSV
          </Button>
        </div>

        <div ref={salesRef}>
          {sortedSales.length === 0 ? (
            <div className="pos-card p-12 text-center">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No sales yet</h3>
              <p className="text-muted-foreground">
                Complete your first sale to see it here
              </p>
            </div>
          ) : (
            <div className="pos-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Order ID
                      </th>
                      <th className="text-left p-4 font-medium text-muted-foreground">
                        Date & Time
                      </th>
                      <th className="text-center p-4 font-medium text-muted-foreground">
                        Items
                      </th>
                      <th className="text-center p-4 font-medium text-muted-foreground">
                        Payment
                      </th>
                      <th className="text-right p-4 font-medium text-muted-foreground">
                        Subtotal
                      </th>
                      <th className="text-right p-4 font-medium text-muted-foreground">
                        Discount
                      </th>
                      <th className="text-right p-4 font-medium text-muted-foreground">
                        Total
                      </th>
                      <th className="text-right p-4 font-medium text-muted-foreground">
                        Profit
                      </th>
                      <th className="text-right p-4 font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-t border-border hover:bg-secondary/50 transition-colors"
                      >
                        <td className="p-4 font-mono text-sm font-semibold">
                          {sale.orderId}
                        </td>
                        <td className="p-4">
                          {format(
                            new Date(sale.createdAt),
                            'MMM dd, yyyy HH:mm'
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {sale.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={
                              sale.paymentMethod === 'card'
                                ? 'badge-success'
                                : 'badge-warning'
                            }
                          >
                            {sale.paymentMethod.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {formatINR(sale.subtotal)}
                        </td>
                        <td className="p-4 text-right text-destructive">
                          {sale.discount > 0
                            ? `-${formatINR(sale.discount)}`
                            : '-'}
                        </td>
                        <td className="p-4 text-right font-semibold">
                          {formatINR(sale.total)}
                        </td>
                        <td className="p-4 text-right text-success font-medium">
                          +{formatINR(sale.profit)}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-2 rounded-md hover:bg-accent transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <ReceiptModal
          sale={selectedSale}
          open={!!selectedSale}
          onClose={() => setSelectedSale(null)}
        />
      </div>
    </MainLayout>
  );
}
