
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { Loader2, QrCode, Plus } from "lucide-react";
import { Html5QrcodeScanner, QrCodeSuccessCallback } from "html5-qrcode";

// A self-contained QR Scanner component
const QrScanner = ({ onScanSuccess }: { onScanSuccess: QrCodeSuccessCallback }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader-container-inner",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render(onScanSuccess, (error) => {
      // console.error("QR code scanning error:", error);
    });

    return () => {
      scanner.clear().catch((error) => {
        console.error("Failed to clear scanner.", error);
      });
    };
  }, [onScanSuccess]);

  return <div id="qr-reader-container-inner" className="w-full" />;
};

export default function AddProductPage() {
  const navigate = useNavigate();
  const { products, addProduct } = useProducts();
  const [formData, setFormData] = useState({
    barcode: "",
    name: "",
    category: "",
    price: "",
    cost: "",
    stock: "",
    lowStockThreshold: "0",
    unit: "pcs",
  });
  const [margin, setMargin] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const nextSerial = useMemo(() => {
    if (!products) return 1;
    const existingSerials = new Set(
      products.map((p) => parseInt(p.barcode, 10)).filter((n) => !isNaN(n) && n > 0)
    );
    if (existingSerials.size === 0) return 1;
    let i = 1;
    while (existingSerials.has(i)) i++;
    return i;
  }, [products]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCost = e.target.value;
    setFormData((prev) => ({ ...prev, cost: newCost }));
    if (margin) {
      const price = parseFloat(newCost) * (1 + parseFloat(margin) / 100);
      setFormData((prev) => ({ ...prev, price: price.toFixed(2) }));
    }
  };

  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMargin = e.target.value;
    setMargin(newMargin);
    if (formData.cost) {
      const price = parseFloat(formData.cost) * (1 + parseFloat(newMargin) / 100);
      setFormData((prev) => ({ ...prev, price: price.toFixed(2) }));
    }
  };

  const handleGenerateSerial = () => {
    setFormData((prev) => ({ ...prev, barcode: String(nextSerial) }));
    toast.info(`Barcode set to serial: ${nextSerial}`);
  };

  const onScanSuccess: QrCodeSuccessCallback = (decodedText, decodedResult) => {
    setFormData((prev) => ({ ...prev, barcode: decodedText }));
    toast.success(`Scanned successfully: ${decodedText}`);
    setIsScannerOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredFields: (keyof typeof formData)[] = ["barcode", "name", "category", "price", "cost", "stock"];
    if (requiredFields.some((field) => !formData[field])) {
      toast.error("Please fill all required fields.");
      return;
    }

    addProduct.mutate(
      { ...formData, price: parseFloat(formData.price), cost: parseFloat(formData.cost), stock: parseInt(formData.stock), lowStockThreshold: parseInt(formData.lowStockThreshold) },
      {
        onSuccess: () => {
          toast.success("Product added successfully!");
          navigate("/products");
        },
        onError: () => toast.error("Failed to add product. Please try again."),
      }
    );
  };

  return (
    <MainLayout>
      <h1 className="text-2xl font-bold mb-6 text-center sm:text-left">Add New Product</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="barcode">Barcode or Serial Number</Label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input id="barcode" value={formData.barcode} onChange={handleInputChange} placeholder="Scan or generate a serial" className="flex-grow" />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsScannerOpen(true)} className="w-full sm:w-auto">
                  <QrCode className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Scan</span>
                </Button>
                <Button type="button" variant="outline" onClick={handleGenerateSerial} className="w-full sm:w-auto flex-grow">
                  <Plus className="h-4 w-4 mr-1" /> Serial: {nextSerial}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2"><Label htmlFor="name">Product Name</Label><Input id="name" value={formData.name} onChange={handleInputChange} placeholder="Enter product name" /></div>
          <div className="space-y-2"><Label htmlFor="category">Category</Label><Input id="category" value={formData.category} onChange={handleInputChange} placeholder="Enter category" /></div>
          <div className="space-y-2"><Label htmlFor="unit">Unit</Label><Input id="unit" value={formData.unit} onChange={handleInputChange} placeholder="e.g., pcs, kg, ltr" /></div>
          <div className="space-y-2"><Label htmlFor="cost">Purchase Cost (₹)</Label><Input id="cost" type="number" step="0.01" value={formData.cost} onChange={handleCostChange} placeholder="Enter purchase cost" /></div>
          <div className="space-y-2"><Label htmlFor="margin">Margin (%)</Label><Input id="margin" type="number" step="0.01" value={margin} onChange={handleMarginChange} placeholder="Enter margin" /></div>
          <div className="space-y-2"><Label htmlFor="price">Selling Price (₹)</Label><Input id="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} placeholder="Enter selling price" /></div>
          <div className="space-y-2"><Label htmlFor="stock">Stock Quantity</Label><Input id="stock" type="number" value={formData.stock} onChange={handleInputChange} placeholder="Enter stock quantity" /></div>
          <div className="space-y-2"><Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label><Input id="lowStockThreshold" type="number" value={formData.lowStockThreshold} onChange={handleInputChange} placeholder="Enter threshold" disabled /></div>
        </div>

        <div className="flex justify-center sm:justify-end mt-8">
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={addProduct.isPending}>
            {addProduct.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Add Product
          </Button>
        </div>
      </form>

      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="w-[90vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
            <DialogDescription>Point your camera at a barcode to scan it.</DialogDescription>
          </DialogHeader>
          <div className="my-4">
            {isScannerOpen && <QrScanner onScanSuccess={onScanSuccess} />}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
