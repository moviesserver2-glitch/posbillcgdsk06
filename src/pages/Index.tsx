import { MainLayout } from '@/components/layout/MainLayout';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Package,
  Loader2,
  IndianRupee,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatINR } from '@/lib/currency';

const Index = () => {
  const { products, isLoading: productsLoading, getLowStockProducts } = useProducts();
  const { sales, isLoading: salesLoading, getTodaysStats } = useSales();

  const todayStats = getTodaysStats();
  const lowStockProducts = getLowStockProducts();

  // Recent sales (last 5)
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (productsLoading || salesLoading) {
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
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's your business overview.
            </p>
          </div>
          <Link to="/pos">
            <Button className="gap-2 pos-button-primary">
              <ShoppingCart className="h-4 w-4" />
              Open POS
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Sales"
            value={formatINR(todayStats.sales)}
            icon={IndianRupee}
          />
          <StatCard
            title="Today's Profit"
            value={formatINR(todayStats.profit)}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Total Products"
            value={products.length}
            icon={Package}
          />
          <StatCard
            title="Low Stock Items"
            value={lowStockProducts.length}
            icon={AlertTriangle}
            variant={lowStockProducts.length > 0 ? 'danger' : 'default'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="pos-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Recent Sales</h3>
              <Link
                to="/sales"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No sales yet today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {sale.items.length} items
                      </p>
                      <p className="text-sm text-muted-foreground">
                        #{sale.id.slice(-6)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatINR(sale.total)}</p>
                      <p className="text-sm text-success">
                        +{formatINR(sale.profit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pos-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Low Stock Alerts</h3>
              <Link
                to="/low-stock"
                className="text-sm text-primary hover:underline"
              >
                View all
              </Link>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>All products are well stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={
                          product.stock === 0
                            ? 'badge-low-stock'
                            : 'badge-warning'
                        }
                      >
                        {product.stock} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/pos" className="pos-card p-4 hover:scale-[1.02] transition-transform">
            <ShoppingCart className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-semibold">Point of Sale</h4>
            <p className="text-sm text-muted-foreground">Start selling</p>
          </Link>
          <Link to="/products" className="pos-card p-4 hover:scale-[1.02] transition-transform">
            <Package className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-semibold">Products</h4>
            <p className="text-sm text-muted-foreground">Manage inventory</p>
          </Link>
          <Link to="/reports" className="pos-card p-4 hover:scale-[1.02] transition-transform">
            <TrendingUp className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-semibold">Reports</h4>
            <p className="text-sm text-muted-foreground">View analytics</p>
          </Link>
          <Link to="/import-export" className="pos-card p-4 hover:scale-[1.02] transition-transform">
            <Package className="h-8 w-8 text-primary mb-2" />
            <h4 className="font-semibold">Import/Export</h4>
            <p className="text-sm text-muted-foreground">CSV operations</p>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
