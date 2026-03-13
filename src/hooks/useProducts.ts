import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { toast } from 'sonner';

type NewProduct = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

interface DbProduct {
  id: string;
  barcode: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  low_stock_threshold: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

const mapDbToProduct = (dbProduct: DbProduct): Product => ({
  id: dbProduct.id,
  barcode: dbProduct.barcode,
  name: dbProduct.name,
  category: dbProduct.category,
  price: Number(dbProduct.price),
  cost: Number(dbProduct.cost),
  stock: dbProduct.stock,
  lowStockThreshold: dbProduct.low_stock_threshold,
  unit: dbProduct.unit,
  createdAt: new Date(dbProduct.created_at),
  updatedAt: new Date(dbProduct.updated_at),
});

const mapProductToDb = (product: Partial<Product>) => ({
  ...(product.barcode && { barcode: product.barcode }),
  ...(product.name && { name: product.name }),
  ...(product.category !== undefined && { category: product.category }),
  ...(product.price !== undefined && { price: product.price }),
  ...(product.cost !== undefined && { cost: product.cost }),
  ...(product.stock !== undefined && { stock: product.stock }),
  ...(product.lowStockThreshold !== undefined && { low_stock_threshold: product.lowStockThreshold }),
  ...(product.unit && { unit: product.unit }),
});

export const useProducts = () => {
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as DbProduct[]).map(mapDbToProduct);
    },
  });

  const addProduct = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          barcode: product.barcode,
          name: product.name,
          category: product.category,
          price: product.price,
          cost: product.cost,
          stock: product.stock,
          low_stock_threshold: product.lowStockThreshold,
          unit: product.unit,
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapDbToProduct(data as DbProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add product: ${error.message}`);
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      const { data, error } = await supabase
        .from('products')
        .update(mapProductToDb(updates))
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return mapDbToProduct(data as DbProduct);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });

  const importProducts = useMutation({
    mutationFn: async (newProducts: NewProduct[]) => {
      const productsToInsert = newProducts.map((p) => ({
        barcode: p.barcode,
        name: p.name,
        category: p.category,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        low_stock_threshold: p.lowStockThreshold,
        unit: p.unit,
      }));

      const { data, error } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select();
      
      if (error) throw error;
      return (data as DbProduct[]).map(mapDbToProduct);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Imported ${data.length} products successfully`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to import products: ${error.message}`);
    },
  });

  const findProductByBarcode = async (barcode: string): Promise<Product | null> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode)
      .maybeSingle();
    
    if (error || !data) return null;
    return mapDbToProduct(data as DbProduct);
  };

  const getLowStockProducts = () => {
    return products.filter(p => p.stock <= p.lowStockThreshold);
  };

  return {
    products,
    isLoading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    importProducts,
    findProductByBarcode,
    getLowStockProducts,
  };
};
