import { useState, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ImportExportPage() {
  const { products, isLoading, importProducts } = useProducts();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportToCSV = () => {
    const headers = [
      'barcode',
      'name',
      'category',
      'price',
      'cost',
      'stock',
      'lowStockThreshold',
      'unit',
    ];

    const csvContent = [
      headers.join(','),
      ...products.map((p) =>
        [
          p.barcode,
          `"${p.name.replace(/"/g, '""')}"`,
          p.category,
          p.price,
          p.cost,
          p.stock,
          p.lowStockThreshold,
          p.unit,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${products.length} products`);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((line) => line.trim());
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

        const requiredHeaders = ['barcode', 'name', 'category', 'price', 'cost', 'stock'];
        const hasRequired = requiredHeaders.every((h) => headers.includes(h));

        if (!hasRequired) {
          toast.error('CSV missing required columns: ' + requiredHeaders.join(', '));
          setImporting(false);
          return;
        }

        let success = 0;
        let failed = 0;
        const newProducts: Array<{
          barcode: string;
          name: string;
          category: string;
          price: number;
          cost: number;
          stock: number;
          lowStockThreshold: number;
          unit: string;
        }> = [];

        for (let i = 1; i < lines.length; i++) {
          try {
            const values = parseCSVLine(lines[i]);
            const product = {
              barcode: values[headers.indexOf('barcode')] || '',
              name: values[headers.indexOf('name')]?.replace(/"/g, '') || '',
              category: values[headers.indexOf('category')] || 'Uncategorized',
              price: parseFloat(values[headers.indexOf('price')]) || 0,
              cost: parseFloat(values[headers.indexOf('cost')]) || 0,
              stock: parseInt(values[headers.indexOf('stock')]) || 0,
              lowStockThreshold: parseInt(
                values[headers.indexOf('lowstockthreshold')] || '10'
              ),
              unit: values[headers.indexOf('unit')] || 'pcs',
            };

            if (product.barcode && product.name) {
              newProducts.push(product);
              success++;
            } else {
              failed++;
            }
          } catch {
            failed++;
          }
        }

        if (newProducts.length > 0) {
          await importProducts.mutateAsync(newProducts);
        }

        setImportResult({ success, failed });
      } catch (error) {
        toast.error('Failed to parse CSV file');
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const downloadTemplate = () => {
    const template = `barcode,name,category,price,cost,stock,lowStockThreshold,unit
1234567890123,Sample Product,Category,9.99,5.00,100,10,pcs`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_template.csv';
    a.click();
    URL.revokeObjectURL(url);
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
        <div>
          <h1 className="text-2xl font-bold">Import / Export</h1>
          <p className="text-muted-foreground">
            Manage your product catalog with CSV files
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="pos-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Import Products</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a CSV file to add products
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop or click to select a CSV file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button asChild disabled={importing}>
                  <span>
                    {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {importing ? 'Importing...' : 'Select File'}
                  </span>
                </Button>
              </label>
            </div>

            {importResult && (
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="font-medium">Import Complete</p>
                  <p className="text-sm text-muted-foreground">
                    {importResult.success} imported, {importResult.failed} failed
                  </p>
                </div>
              </div>
            )}

            <Button variant="outline" className="w-full gap-2" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>

          <div className="pos-card p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-success/10">
                <Download className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Export Products</h3>
                <p className="text-sm text-muted-foreground">
                  Download your product catalog as CSV
                </p>
              </div>
            </div>

            <div className="bg-secondary rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Products</span>
                <span className="font-semibold">{products.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">File Format</span>
                <span className="font-semibold">CSV</span>
              </div>
            </div>

            <Button className="w-full gap-2" onClick={exportToCSV}>
              <Download className="h-4 w-4" />
              Export All Products
            </Button>
          </div>
        </div>

        <div className="pos-card p-6">
          <h3 className="text-lg font-semibold mb-4">CSV Format Guide</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="text-left p-3 font-medium">Column</th>
                  <th className="text-left p-3 font-medium">Required</th>
                  <th className="text-left p-3 font-medium">Description</th>
                  <th className="text-left p-3 font-medium">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="p-3 font-mono">barcode</td>
                  <td className="p-3"><CheckCircle className="h-4 w-4 text-success" /></td>
                  <td className="p-3 text-muted-foreground">Product barcode</td>
                  <td className="p-3 font-mono">1234567890123</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3 font-mono">name</td>
                  <td className="p-3"><CheckCircle className="h-4 w-4 text-success" /></td>
                  <td className="p-3 text-muted-foreground">Product name</td>
                  <td className="p-3 font-mono">Coca Cola 500ml</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3 font-mono">category</td>
                  <td className="p-3"><CheckCircle className="h-4 w-4 text-success" /></td>
                  <td className="p-3 text-muted-foreground">Product category</td>
                  <td className="p-3 font-mono">Beverages</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3 font-mono">price</td>
                  <td className="p-3"><CheckCircle className="h-4 w-4 text-success" /></td>
                  <td className="p-3 text-muted-foreground">Selling price</td>
                  <td className="p-3 font-mono">2.50</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3 font-mono">cost</td>
                  <td className="p-3"><CheckCircle className="h-4 w-4 text-success" /></td>
                  <td className="p-3 text-muted-foreground">Cost price</td>
                  <td className="p-3 font-mono">1.50</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3 font-mono">stock</td>
                  <td className="p-3"><CheckCircle className="h-4 w-4 text-success" /></td>
                  <td className="p-3 text-muted-foreground">Current stock</td>
                  <td className="p-3 font-mono">100</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3 font-mono">lowStockThreshold</td>
                  <td className="p-3"><AlertCircle className="h-4 w-4 text-muted-foreground" /></td>
                  <td className="p-3 text-muted-foreground">Alert threshold (default: 10)</td>
                  <td className="p-3 font-mono">10</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-3 font-mono">unit</td>
                  <td className="p-3"><AlertCircle className="h-4 w-4 text-muted-foreground" /></td>
                  <td className="p-3 text-muted-foreground">Unit of measure (default: pcs)</td>
                  <td className="p-3 font-mono">pcs</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
