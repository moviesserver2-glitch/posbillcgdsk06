export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // Discount amount
  discountPercent: number; // Discount percentage
}

export interface Sale {
  id: string;
  orderId: string; // Format: DDMMYYYY + unique number
  items: CartItem[];
  subtotal: number;
  discount: number; // Total discount
  tax: number;
  total: number;
  profit: number;
  paymentMethod: 'cash' | 'card';
  createdAt: Date;
}

export interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  totalProducts: number;
  lowStockCount: number;
  averageOrderValue: number;
  topSellingProducts: { name: string; quantity: number }[];
}
