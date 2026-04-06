import { Mail, Phone, Calendar, MoreVertical, Building2, Home, Edit, Trash2, FileText, User } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { format, differenceInDays } from 'date-fns';
import { cn } from '../../lib/utils';
import { roomTypeLabels } from '../../data/mockData';

export function TenantCard({ tenant, unit, payments, onEdit, onDelete }) {
  const isCommercial = unit?.type === 'commercial';
  const daysUntilLeaseEnd = differenceInDays(new Date(tenant.leaseEnd), new Date());
  const latestPayment = payments.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))[0];

  const getLeaseStatus = () => {
    if (daysUntilLeaseEnd < 0) return { label: 'Expired', variant: 'destructive' };
    if (daysUntilLeaseEnd <= 30) return { label: 'Expiring Soon', variant: 'secondary' };
    return { label: tenant.leaseType === 'short-term' ? 'Short-term' : 'Active', variant: 'outline' };
  };
  const leaseStatus = getLeaseStatus();

  return (
    <Card className="group transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg text-lg font-bold', isCommercial ? 'bg-primary/10 text-primary' : 'bg-accent text-accent-foreground')}>
            {isCommercial ? <Building2 className="h-6 w-6" /> : <Home className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="font-semibold text-foreground leading-tight">{tenant.businessName || tenant.name}</h3>
            {tenant.businessName && <p className="text-sm text-muted-foreground">{tenant.name}</p>}
            <div className="flex gap-1 mt-1">
              <Badge variant="outline" className="text-xs">Unit {unit?.unitNumber}</Badge>
              {unit?.roomType && <Badge variant="secondary" className="text-xs">{roomTypeLabels[unit.roomType]}</Badge>}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}><Edit className="mr-2 h-4 w-4" />Edit Tenant</DropdownMenuItem>
            <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />View Documents</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Remove Tenant</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" /><span className="truncate">{tenant.email}</span></div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" /><span>{tenant.phone}</span></div>
          {tenant.idNumber && <div className="flex items-center gap-2 text-sm text-muted-foreground"><User className="h-4 w-4" /><span>ID: {tenant.idNumber}</span></div>}
        </div>
        {tenant.broker && (
          <div className="rounded-lg bg-amber-500/10 p-2 text-xs">
            <p className="font-medium text-amber-700">Broker: {tenant.broker.name} ({tenant.broker.commissionPercent}%)</p>
          </div>
        )}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><div><p className="text-muted-foreground text-xs">Lease Period</p><p className="font-medium text-foreground">{format(new Date(tenant.leaseStart), 'MMM d, yyyy')} - {format(new Date(tenant.leaseEnd), 'MMM d, yyyy')}</p></div></div>
          <Badge variant={leaseStatus.variant}>{leaseStatus.label}</Badge>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div><p className="text-xs text-muted-foreground">Monthly Rent</p><p className="text-lg font-bold text-foreground">ETB {unit?.rentAmount?.toLocaleString()}</p></div>
          {latestPayment && <Badge variant={latestPayment.status === 'paid' ? 'outline' : latestPayment.status === 'overdue' ? 'destructive' : 'secondary'} className={cn(latestPayment.status === 'paid' && 'bg-accent/50 text-accent-foreground')}>{latestPayment.status === 'paid' ? 'Paid' : latestPayment.status === 'overdue' ? `Overdue (+${latestPayment.penaltyPercent}%)` : 'Pending'}</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}
