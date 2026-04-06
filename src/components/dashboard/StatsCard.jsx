import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

export function StatsCard({ title, value, subtitle, icon: Icon, variant = 'default' }) {
  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      variant === 'primary' && 'border-primary/20 bg-primary/5',
      variant === 'warning' && 'border-destructive/20 bg-destructive/5'
    )}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={cn(
              'text-2xl font-bold',
              variant === 'primary' && 'text-primary',
              variant === 'warning' && 'text-destructive'
            )}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <Icon className={cn(
              'h-8 w-8',
              variant === 'primary' ? 'text-primary' : 
              variant === 'warning' ? 'text-destructive' : 'text-muted-foreground'
            )} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
