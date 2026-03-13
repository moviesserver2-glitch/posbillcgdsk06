import { useState, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/types/product';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { formatINR } from '@/lib/currency';

export function ProductGrid() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { products, isLoading } = useProducts();
  const openQuantityDialog = useCart((state) => state.openQuantityDialog);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(cats).filter(Boolean)];
  }, [products]);

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    openQuantityDialog(product);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p>No products available</p>
          <p className="text-sm">Add products in the Products page</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product)}
              disabled={product.stock <= 0}
              className={cn(
                'pos-card p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] animate-fade-in',
                product.stock <= 0 && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    {product.category}
                  </span>
                  {product.stock <= product.lowStockThreshold && (
                    <span className="badge-low-stock">Low</span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground line-clamp-2">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-lg font-bold text-primary">
                    {formatINR(product.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Stock: {product.stock}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
