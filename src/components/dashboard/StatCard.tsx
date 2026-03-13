import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
}: StatCardProps) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="stat-label">{title}</span>
        <div className={cn('p-2 rounded-lg', variantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="stat-value">{value}</span>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium mb-0.5',
              trend.isPositive ? 'text-success' : 'text-destructive'
            )}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
}
