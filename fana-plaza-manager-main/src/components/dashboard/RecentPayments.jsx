import { CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export function RecentPayments({ payments, tenants, units }) {
  const recentPayments = [...payments]
    .filter(p => p.status === 'paid')
    .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Recent Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent payments
            </p>
          ) : (
            recentPayments.map((payment) => {
              const tenant = tenants.find(t => t.id === payment.tenantId);
              const unit = units.find(u => u.id === payment.unitId);
              
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg bg-accent/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[hsl(var(--status-occupied))]" />
                    <div>
                      <p className="font-medium text-foreground">
                        {tenant?.businessName || tenant?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Unit {unit?.unitNumber} • {payment.month} {payment.year}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      ETB {payment.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(payment.paidDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
