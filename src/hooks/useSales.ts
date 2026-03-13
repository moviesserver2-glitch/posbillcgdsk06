import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CartItem, Sale } from '@/types/product';
import { toast } from 'sonner';

interface DbSale {
  id: string;
  order_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  profit: number;
  payment_method: string;
  created_at: string;
}

interface DbSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  product_cost: number;
  quantity: number;
  discount: number;
  discount_percent: number;
  created_at: string;
}

interface CompleteSaleParams {
  items: CartItem[];
  paymentMethod: 'cash' | 'card';
  taxRate?: number;
  totalDiscount?: number;
}

export const useSales = () => {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (salesError) throw salesError;
      
      // Fetch sale items for each sale
      const salesWithItems: Sale[] = await Promise.all(
        (salesData as DbSale[]).map(async (sale) => {
          const { data: itemsData } = await supabase
            .from('sale_items')
            .select('*')
            .eq('sale_id', sale.id);
          
          const items: CartItem[] = (itemsData as DbSaleItem[] || []).map((item) => ({
            product: {
              id: item.product_id,
              barcode: '',
              name: item.product_name,
              category: '',
              price: Number(item.product_price),
              cost: Number(item.product_cost),
              stock: 0,
              lowStockThreshold: 0,
              unit: 'pcs',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            quantity: item.quantity,
            discount: Number(item.discount || 0),
            discountPercent: Number(item.discount_percent || 0),
          }));
          
          return {
            id: sale.id,
            orderId: sale.order_id || sale.id.slice(-8).toUpperCase(),
            items,
            subtotal: Number(sale.subtotal),
            discount: Number(sale.discount || 0),
            tax: Number(sale.tax),
            total: Number(sale.total),
            profit: Number(sale.profit),
            paymentMethod: sale.payment_method as 'cash' | 'card',
            createdAt: new Date(sale.created_at),
          };
        })
      );
      
      return salesWithItems;
    },
  });

  const completeSale = useMutation({
    mutationFn: async ({ items, paymentMethod, taxRate = 0, totalDiscount = 0 }: CompleteSaleParams) => {
      if (items.length === 0) throw new Error('Cart is empty');

      // Calculate subtotal before item discounts
      const subtotalBeforeDiscounts = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );

      // Calculate item-level discounts
      const itemDiscountsTotal = items.reduce(
        (sum, item) => sum + item.discount,
        0
      );

      // Total discount = item discounts + order-level discount
      const totalDiscountAmount = itemDiscountsTotal + totalDiscount;

      const subtotal = subtotalBeforeDiscounts - itemDiscountsTotal;
      const tax = subtotal * taxRate;
      const total = subtotal - totalDiscount + tax;

      // Calculate profit (accounting for discounts)
      const profit = items.reduce(
        (sum, item) => {
          const itemRevenue = (item.product.price * item.quantity) - item.discount;
          const itemCost = item.product.cost * item.quantity;
          return sum + (itemRevenue - itemCost);
        },
        0
      ) - totalDiscount;

      // Create the sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          subtotal: subtotalBeforeDiscounts,
          discount: totalDiscountAmount,
          tax,
          total,
          profit: Math.max(0, profit),
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = items.map((item) => ({
        sale_id: saleData.id,
        product_id: item.product.id,
        product_name: item.product.name,
        product_price: item.product.price,
        product_cost: item.product.cost,
        quantity: item.quantity,
        discount: item.discount,
        discount_percent: item.discountPercent,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of items) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock: item.product.stock - item.quantity })
          .eq('id', item.product.id);

        if (stockError) {
          console.error('Failed to update stock for product:', item.product.id, stockError);
        }
      }

      const sale: Sale = {
        id: saleData.id,
        orderId: saleData.order_id || saleData.id.slice(-8).toUpperCase(),
        items: [...items],
        subtotal: subtotalBeforeDiscounts,
        discount: totalDiscountAmount,
        tax,
        total,
        profit: Math.max(0, profit),
        paymentMethod,
        createdAt: new Date(saleData.created_at),
      };

      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to complete sale: ${error.message}`);
    },
  });

  // Find sale by order ID for refunds
  const findSaleByOrderId = (orderId: string): Sale | undefined => {
    return sales.find(
      (sale) => sale.orderId === orderId || sale.orderId.includes(orderId)
    );
  };

  const getTodaysSales = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return sales.filter((sale) => new Date(sale.createdAt) >= today);
  };

  const getTodaysStats = () => {
    const todaysSales = getTodaysSales();
    return {
      sales: todaysSales.reduce((sum, sale) => sum + sale.total, 0),
      profit: todaysSales.reduce((sum, sale) => sum + sale.profit, 0),
      orders: todaysSales.length,
    };
  };

  return {
    sales,
    isLoading,
    completeSale,
    findSaleByOrderId,
    getTodaysSales,
    getTodaysStats,
  };
};
