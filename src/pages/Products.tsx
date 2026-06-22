import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Plus, Trash2, Search, Loader2, ScanBarcode, X } from 'lucide-react';
import { formatINR } from '@/lib/currency';
import { Link } from 'react-router-dom';
import { Html5QrcodeScanner, QrCodeSuccessCallback } from 'html5-qrcode';

type EditableProductField = keyof Omit<Product, 'id' | 'unit' | 'lowStockThreshold'>;

const ProductQrScanner = ({ onScanSuccess }: { onScanSuccess: QrCodeSuccessCallback }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'product-qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(onScanSuccess, () => {
      // ignore scan errors
    });

    return () => {
      scanner.clear().catch(() => {
        // ignore cleanup errors
      });
    };
  }, [onScanSuccess]);

  return <div id="product-qr-reader" className="w-full" />;
};

export default function ProductsPage() {
  const { products, isLoading, updateProduct, deleteProduct } = useProducts();

  const [search, setSearch] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [editingCell, setEditingCell] = useState<{ productId: string; field: EditableProductField } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleQrScanSuccess: QrCodeSuccessCallback = (decodedText) => {
    const trimmedCode = decodedText.trim();
    const product = products.find((p) => p.barcode === trimmedCode);
    if (product) {
      setScannedProduct(product);
      setSearch(trimmedCode);
    } else {
      setScannedProduct(null);
    }
    setIsScannerOpen(false);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.includes(search) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleCellClick = (productId: string, field: EditableProductField, value: string | number) => {
    setEditingCell({ productId, field });
    setEditValue(String(value));
  };

  const handleUpdate = (productId: string, field: EditableProductField) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const numericFields: EditableProductField[] = ['price', 'cost', 'stock'];
    let finalValue: string | number = editValue;

    if (numericFields.includes(field)) {
        finalValue = parseFloat(editValue);
        if (isNaN(finalValue)) {
            setEditingCell(null);
            return;
        }
    }

    if (product[field] !== finalValue) {
        updateProduct.mutate({ id: productId, updates: { [field]: finalValue } });
    }
    
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, productId: string, field: EditableProductField) => {
    if (e.key === 'Enter') {
      handleUpdate(productId, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct.mutate(id);
    }
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
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-muted-foreground">
              Manage your product inventory
            </p>
          </div>
          <Link to="/add-product">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="pl-10"
            />
          </div>

          <Button type="button" variant="secondary" className="gap-2"
            onClick={() => setIsScannerOpen(true)}>
            <ScanBarcode className="h-4 w-4" />
            Scan QR
          </Button>
        </div>

        {scannedProduct && (
          <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-primary">Scanned product</p>
                <p className="text-lg font-semibold">{scannedProduct.name}</p>
                <p className="text-muted-foreground">Barcode: {scannedProduct.barcode}</p>
                <p className="text-muted-foreground">Category: {scannedProduct.category}</p>
              </div>
              <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => setScannedProduct(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        <div className="pos-card overflow-hidden">
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full table-auto">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">Barcode</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Price</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Cost</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Stock</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                    <td className="p-4 font-mono text-sm" onClick={() => handleCellClick(product.id, 'barcode', product.barcode)}>
                      {editingCell?.productId === product.id && editingCell?.field === 'barcode' ? (
                        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleUpdate(product.id, 'barcode')} onKeyDown={(e) => handleKeyDown(e, product.id, 'barcode')} autoFocus />
                      ) : ( product.barcode )}
                    </td>
                    <td className="p-4 font-medium" onClick={() => handleCellClick(product.id, 'name', product.name)}>
                      {editingCell?.productId === product.id && editingCell?.field === 'name' ? (
                        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleUpdate(product.id, 'name')} onKeyDown={(e) => handleKeyDown(e, product.id, 'name')} autoFocus />
                      ) : ( product.name )}
                    </td>
                    <td className="p-4 text-muted-foreground" onClick={() => handleCellClick(product.id, 'category', product.category)}>
                       {editingCell?.productId === product.id && editingCell?.field === 'category' ? (
                        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleUpdate(product.id, 'category')} onKeyDown={(e) => handleKeyDown(e, product.id, 'category')} autoFocus />
                      ) : ( product.category )}
                    </td>
                    <td className="p-4 text-right" onClick={() => handleCellClick(product.id, 'price', product.price)}>
                      {editingCell?.productId === product.id && editingCell?.field === 'price' ? (
                        <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleUpdate(product.id, 'price')} onKeyDown={(e) => handleKeyDown(e, product.id, 'price')} autoFocus />
                      ) : ( formatINR(product.price) )}
                    </td>
                    <td className="p-4 text-right text-muted-foreground" onClick={() => handleCellClick(product.id, 'cost', product.cost)}>
                       {editingCell?.productId === product.id && editingCell?.field === 'cost' ? (
                        <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleUpdate(product.id, 'cost')} onKeyDown={(e) => handleKeyDown(e, product.id, 'cost')} autoFocus />
                      ) : ( formatINR(product.cost) )}
                    </td>
                    <td className="p-4 text-right" onClick={() => handleCellClick(product.id, 'stock', product.stock)}>
                      {editingCell?.productId === product.id && editingCell?.field === 'stock' ? (
                        <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={() => handleUpdate(product.id, 'stock')} onKeyDown={(e) => handleKeyDown(e, product.id, 'stock')} autoFocus />
                      ) : (
                          <span className={product.stock <= product.lowStockThreshold ? 'badge-low-stock' : ''}>
                              {product.stock}
                          </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="text-destructive hover:text-destructive" disabled={deleteProduct.isPending}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-4 p-4 md:hidden">
            {filteredProducts.map((product) => (
              <div key={product.id} className="pos-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {product.category}
                      </span>
                      {product.stock <= product.lowStockThreshold && (
                        <span className="badge-low-stock">Low</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-base">{product.name}</h3>
                    <p className="text-sm text-muted-foreground break-words">Barcode: {product.barcode}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                    className="text-destructive hover:text-destructive"
                    disabled={deleteProduct.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <button
                    type="button"
                    onClick={() => handleCellClick(product.id, 'price', product.price)}
                    className="text-left rounded-lg border border-border p-3 text-muted-foreground hover:border-primary"
                  >
                    <div className="font-medium text-foreground">Price</div>
                    {editingCell?.productId === product.id && editingCell?.field === 'price' ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleUpdate(product.id, 'price')}
                        onKeyDown={(e) => handleKeyDown(e, product.id, 'price')}
                        autoFocus
                      />
                    ) : (
                      <div>{formatINR(product.price)}</div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCellClick(product.id, 'cost', product.cost)}
                    className="text-left rounded-lg border border-border p-3 text-muted-foreground hover:border-primary"
                  >
                    <div className="font-medium text-foreground">Cost</div>
                    {editingCell?.productId === product.id && editingCell?.field === 'cost' ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleUpdate(product.id, 'cost')}
                        onKeyDown={(e) => handleKeyDown(e, product.id, 'cost')}
                        autoFocus
                      />
                    ) : (
                      <div>{formatINR(product.cost)}</div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCellClick(product.id, 'stock', product.stock)}
                    className="text-left rounded-lg border border-border p-3 text-muted-foreground hover:border-primary"
                  >
                    <div className="font-medium text-foreground">Stock</div>
                    {editingCell?.productId === product.id && editingCell?.field === 'stock' ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleUpdate(product.id, 'stock')}
                        onKeyDown={(e) => handleKeyDown(e, product.id, 'stock')}
                        autoFocus
                      />
                    ) : (
                      <div>{product.stock}</div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCellClick(product.id, 'category', product.category)}
                    className="text-left rounded-lg border border-border p-3 text-muted-foreground hover:border-primary"
                  >
                    <div className="font-medium text-foreground">Category</div>
                    {editingCell?.productId === product.id && editingCell?.field === 'category' ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleUpdate(product.id, 'category')}
                        onKeyDown={(e) => handleKeyDown(e, product.id, 'category')}
                        autoFocus
                      />
                    ) : (
                      <div>{product.category}</div>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No products found</div>
          )}
        </div>

        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
          <DialogContent className="w-[90vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Scan product QR</DialogTitle>
              <DialogDescription>Allow camera access and point the camera at a product QR/barcode.</DialogDescription>
            </DialogHeader>
            <div className="my-4">
              {isScannerOpen && <ProductQrScanner onScanSuccess={handleQrScanSuccess} />}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
