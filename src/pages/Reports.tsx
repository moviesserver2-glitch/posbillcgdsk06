import { MainLayout } from '@/components/layout/MainLayout';
import { useProducts } from '@/hooks/useProducts';
import { useSales } from '@/hooks/useSales';
import { StatCard } from '@/components/dashboard/StatCard';
import { TrendingUp, ShoppingBag, Package, Loader2, IndianRupee, Calendar as CalendarIcon } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, differenceInDays } from 'date-fns';
import { formatINR } from '@/lib/currency';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { DateRange } from 'react-day-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COLORS = ['hsl(168, 76%, 42%)', 'hsl(168, 76%, 52%)', 'hsl(168, 76%, 62%)', 'hsl(168, 76%, 72%)', 'hsl(168, 76%, 82%)'];

export default function ReportsPage() {
  const { products, isLoading: productsLoading } = useProducts();
  const { sales, isLoading: salesLoading } = useSales();
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  if (productsLoading || salesLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const filteredSales = sales.filter((s) => {
    const saleDate = new Date(s.createdAt);
    if (date?.from) {
      const endDate = date.to || date.from;
      return saleDate >= startOfDay(date.from) && saleDate <= endOfDay(endDate);
    }
    return true;
  });

  const numberOfDays = date?.from
    ? differenceInDays(date.to || date.from, date.from) + 1
    : 0;

  // Calculate daily sales for the selected date range
  const dailySales = Array.from({ length: numberOfDays }, (_, i) => {
    const day = date?.from ? new Date(date.from) : new Date();
    day.setDate(day.getDate() + i);
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);
    const daySales = filteredSales.filter((s) => {
      const saleDate = new Date(s.createdAt);
      return saleDate >= dayStart && saleDate <= dayEnd;
    });

    return {
      date: format(day, 'dd/MM'),
      sales: daySales.reduce((sum, s) => sum + s.total, 0),
      profit: daySales.reduce((sum, s) => sum + s.profit, 0),
      orders: daySales.length,
    };
  });

  // Calculate category sales
  const categorySales = products.reduce(
    (acc, product) => {
      const productSales = filteredSales.flatMap((s) =>
        s.items.filter((item) => item.product.id === product.id)
      );
      const totalQty = productSales.reduce((sum, item) => sum + item.quantity, 0);

      if (!acc[product.category]) {
        acc[product.category] = 0;
      }
      acc[product.category] += totalQty;
      return acc;
    },
    {} as Record<string, number>
  );

  const categoryData = Object.entries(categorySales)
    .map(([name, value]) => ({ name, value }))
    .filter((item) => item.value > 0);

  // Top selling products
  const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const existing = productSalesMap.get(item.product.id);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.product.price * item.quantity;
      } else {
        productSalesMap.set(item.product.id, {
          name: item.product.name,
          quantity: item.quantity,
          revenue: item.product.price * item.quantity,
        });
      }
    });
  });

  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Overall stats
  const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);
  const avgOrderValue = filteredSales.length > 0 ? totalSales / filteredSales.length : 0;

  const handleDatePreset = (preset: string) => {
    const now = new Date();
    switch (preset) {
      case 'this-month':
        setDate({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'this-year':
        setDate({ from: startOfYear(now), to: endOfYear(now) });
        break;
      default:
        break;
    }
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              Insights into your business performance
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={'outline'}
                className={cn(
                  'w-[300px] justify-start text-left font-normal',
                  !date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd, yyyy')} - {format(date.to, 'LLL dd, yyyy')}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, yyyy')
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex" align="end">
            <div className="flex flex-col space-y-2 p-4 border-r">
                <Select onValueChange={(value) => handleDatePreset(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a preset" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Sales"
            value={formatINR(totalSales)}
            icon={IndianRupee}
          />
          <StatCard
            title="Total Profit"
            value={formatINR(totalProfit)}
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="Total Orders"
            value={filteredSales.length}
            icon={ShoppingBag}
          />
          <StatCard
            title="Avg Order Value"
            value={formatINR(avgOrderValue)}
            icon={Package}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="pos-card p-6">
            <h3 className="text-lg font-semibold mb-4">Sales & Profit</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="sales" fill="hsl(168, 76%, 42%)" name="Sales" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="hsl(142, 76%, 36%)" name="Profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pos-card p-6">
            <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
            <div className="h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name }) => name}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  No sales data yet
                </div>
              )}
            </div>
          </div>

          <div className="pos-card p-6">
            <h3 className="text-lg font-semibold mb-4">Order Trends</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(168, 76%, 42%)"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(168, 76%, 42%)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pos-card p-6">
            <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.quantity} units sold
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">
                      {formatINR(product.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No sales data yet
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
