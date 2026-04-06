import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { payments, tenants, units, calculatePenalty, buildingConfig } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export default function Payments() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  const filteredPayments = payments.filter(payment => {
    if (statusFilter === 'all') return true;
    return payment.status === statusFilter;
  });

  const getTenantName = (tenantId) => {
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant?.name || 'Unknown';
  };

  const getUnitNumber = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    return unit ? `${unit.floor}-${unit.unitNumber}` : 'Unknown';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-status-occupied text-white">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-status-maintenance text-black">Pending</Badge>;
      case 'overdue':
        return <Badge className="bg-status-vacant text-white">Overdue</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleMarkAsPaid = (paymentId) => {
    toast({
      title: "Payment Recorded",
      description: "Payment has been marked as paid.",
    });
  };

  const paidPayments = payments.filter(p => p.status === 'paid');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const overduePayments = payments.filter(p => p.status === 'overdue');
  
  const totalCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalOverdue = overduePayments.reduce((sum, p) => {
    const penalty = calculatePenalty(p.dueDate, p.amount);
    return sum + p.amount + penalty;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Payments" subtitle="Track and manage rent payments" />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-occupied/10">
                <CheckCircle className="h-6 w-6 text-status-occupied" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-2xl font-bold">${totalCollected.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-maintenance/10">
                <Clock className="h-6 w-6 text-status-maintenance" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">${totalPending.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-vacant/10">
                <AlertTriangle className="h-6 w-6 text-status-vacant" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue (+ Penalties)</p>
                <p className="text-2xl font-bold">${totalOverdue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expected</p>
                <p className="text-2xl font-bold">
                  ${(totalCollected + totalPending + totalOverdue).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Penalty Info */}
        <Card className="border-status-maintenance/50 bg-status-maintenance/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-status-maintenance mt-0.5" />
              <div>
                <p className="font-medium">Late Payment Penalty Policy</p>
                <p className="text-sm text-muted-foreground">
                  Overdue payments incur a {buildingConfig.penaltyPercent}% penalty every {buildingConfig.penaltyIntervalDays} days 
                  starting from the first day after the due date.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter */}
        <Card>
          <CardContent className="p-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Penalty</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map(payment => {
                  const penalty = payment.status === 'overdue' 
                    ? calculatePenalty(payment.dueDate, payment.amount)
                    : 0;
                  const daysOverdue = payment.status === 'overdue'
                    ? differenceInDays(new Date(), new Date(payment.dueDate))
                    : 0;
                  
                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {getTenantName(payment.tenantId)}
                      </TableCell>
                      <TableCell>{getUnitNumber(payment.unitId)}</TableCell>
                      <TableCell>{format(new Date(payment.dueDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell>${payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        {penalty > 0 ? (
                          <span className="text-status-vacant font-medium">
                            +${penalty.toLocaleString()}
                            <span className="text-xs ml-1">({daysOverdue}d)</span>
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${(payment.amount + penalty).toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        {payment.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(payment.id)}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
