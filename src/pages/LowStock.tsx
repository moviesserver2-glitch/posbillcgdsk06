import { MainLayout } from '@/components/layout/MainLayout';
import { useProducts } from '@/hooks/useProducts';
import { AlertTriangle, Package, Loader2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import { toast } from 'sonner';

export default function LowStockPage() {
  const { isLoading, getLowStockProducts } = useProducts();
  const lowStockProducts = getLowStockProducts();
  const lowStockRef = useRef<HTMLDivElement>(null);

  const exportToCSV = () => {
    const headers = ['Barcode', 'Name', 'Category', 'Stock', 'Threshold'];

    const csvContent = [
      headers.join(','),
      ...lowStockProducts.map((p) =>
        [
          p.barcode,
          `"${p.name.replace(/"/g, '""')}"`,
          p.category,
          p.stock,
          p.lowStockThreshold,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `low_stock_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${lowStockProducts.length} products`);
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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Low Stock Alerts</h1>
              <p className="text-muted-foreground">
                Products that need restocking
              </p>
            </div>
          </div>
          <Button onClick={exportToCSV}>
            <FileDown className="h-4 w-4 mr-2" />
            Export as CSV
          </Button>
        </div>

        <div ref={lowStockRef}>
          {lowStockProducts.length === 0 ? (
            <div className="pos-card p-12 text-center">
              <Package className="h-12 w-12 mx-auto text-success mb-4" />
              <h3 className="text-lg font-medium mb-2">All stocked up!</h3>
              <p className="text-muted-foreground">
                No products are below their threshold
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="pos-card p-4 flex items-center justify-between animate-fade-in"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        product.stock === 0
                          ? 'bg-destructive/10'
                          : 'bg-warning/10'
                      }`}
                    >
                      <Package
                        className={`h-5 w-5 ${
                          product.stock === 0
                            ? 'text-destructive'
                            : 'text-warning'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.barcode} • {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Current Stock
                      </p>
                      <p
                        className={`text-xl font-bold ${
                          product.stock === 0
                            ? 'text-destructive'
                            : 'text-warning'
                        }`}
                      >
                        {product.stock}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Threshold</p>
                      <p className="text-xl font-bold text-muted-foreground">
                        {product.lowStockThreshold}
                      </p>
                    </div>
                    <span
                      className={
                        product.stock === 0
                          ? 'badge-low-stock'
                          : 'badge-warning'
                      }
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
