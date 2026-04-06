import { AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { format, differenceInDays } from 'date-fns';

export function RentAlerts({ payments, tenants, units }) {
  const today = new Date();
  
  // Get payments that are due in 3 days or less, or overdue
  const urgentPayments = payments
    .filter(p => p.status !== 'paid')
    .map(p => {
      const tenant = tenants.find(t => t.id === p.tenantId);
      const unit = units.find(u => u.id === p.unitId);
      const daysUntilDue = differenceInDays(new Date(p.dueDate), today);
      return { ...p, tenant, unit, daysUntilDue };
    })
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const getAlertType = (daysUntilDue) => {
    if (daysUntilDue < 0) return { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Overdue' };
    if (daysUntilDue <= 3) return { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Due Soon' };
    return { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Upcoming' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Rent Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {urgentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No urgent payments at this time
            </p>
          ) : (
            urgentPayments.slice(0, 5).map((payment) => {
              const alert = getAlertType(payment.daysUntilDue);
              const Icon = alert.icon;
              
              return (
                <div
                  key={payment.id}
                  className={`flex items-center justify-between rounded-lg ${alert.bg} p-3`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${alert.color}`} />
                    <div>
                      <p className="font-medium text-foreground">
                        {payment.tenant?.businessName || payment.tenant?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Unit {payment.unit?.unitNumber} • ETB {payment.amount.toLocaleString()}
                        {payment.penaltyAmount > 0 && (
                          <span className="text-destructive ml-1">
                            (+{payment.penaltyPercent}% penalty)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge variant={payment.daysUntilDue < 0 ? 'destructive' : 'secondary'}>
                    {payment.daysUntilDue < 0 
                      ? `${Math.abs(payment.daysUntilDue)} days overdue`
                      : payment.daysUntilDue === 0 
                        ? 'Due today'
                        : `${payment.daysUntilDue} days`
                    }
                  </Badge>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
