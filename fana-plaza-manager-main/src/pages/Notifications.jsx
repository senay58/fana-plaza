import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Bell, Calendar, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { format, addDays, differenceInDays, isBefore } from 'date-fns';
import { payments, tenants, units, calculatePenalty } from '@/data/mockData';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('all');
  const today = new Date();

  // Generate notifications
  const notifications = [];

  // Rent due in 3 days
  payments
    .filter(p => p.status === 'pending')
    .forEach(payment => {
      const dueDate = new Date(payment.dueDate);
      const daysUntilDue = differenceInDays(dueDate, today);
      
      if (daysUntilDue <= 3 && daysUntilDue >= 0) {
        const tenant = tenants.find(t => t.id === payment.tenantId);
        const unit = units.find(u => u.id === payment.unitId);
        notifications.push({
          id: `due-${payment.id}`,
          type: 'rent-due',
          title: 'Rent Due Soon',
          message: `${tenant?.name}'s rent of $${payment.amount.toLocaleString()} for Unit ${unit?.floor}-${unit?.unitNumber} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}.`,
          date: dueDate,
          priority: daysUntilDue <= 1 ? 'high' : 'medium',
          icon: Clock,
        });
      }
    });

  // Overdue payments
  payments
    .filter(p => p.status === 'overdue')
    .forEach(payment => {
      const tenant = tenants.find(t => t.id === payment.tenantId);
      const unit = units.find(u => u.id === payment.unitId);
      const daysOverdue = differenceInDays(today, new Date(payment.dueDate));
      const penalty = calculatePenalty(payment.dueDate, payment.amount);
      
      notifications.push({
        id: `overdue-${payment.id}`,
        type: 'overdue',
        title: 'Payment Overdue',
        message: `${tenant?.name}'s payment is ${daysOverdue} days overdue. Original: $${payment.amount.toLocaleString()}, Penalty: $${penalty.toLocaleString()}, Total: $${(payment.amount + penalty).toLocaleString()}`,
        date: new Date(payment.dueDate),
        priority: 'high',
        icon: AlertTriangle,
      });
    });

  // Lease expiring soon
  tenants
    .filter(t => t.status === 'active')
    .forEach(tenant => {
      const leaseEnd = new Date(tenant.leaseEnd);
      const daysUntilExpiry = differenceInDays(leaseEnd, today);
      
      if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
        const unit = units.find(u => u.id === tenant.unitId);
        notifications.push({
          id: `lease-${tenant.id}`,
          type: 'lease-expiry',
          title: 'Lease Expiring',
          message: `${tenant.name}'s lease for Unit ${unit?.floor}-${unit?.unitNumber} expires in ${daysUntilExpiry} days (${format(leaseEnd, 'MMM d, yyyy')}).`,
          date: leaseEnd,
          priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
          icon: Calendar,
        });
      }
    });

  // Sort by priority and date
  notifications.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.date) - new Date(b.date);
  });

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-status-vacant text-white';
      case 'medium': return 'bg-status-maintenance text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'overdue': return 'text-status-vacant';
      case 'rent-due': return 'text-status-maintenance';
      case 'lease-expiry': return 'text-primary';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Notifications" 
        subtitle="Stay updated on important events"
        unreadNotifications={notifications.filter(n => n.priority === 'high').length}
      />
      
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-status-vacant/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-vacant/10">
                <AlertTriangle className="h-6 w-6 text-status-vacant" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue Payments</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'overdue').length}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-status-maintenance/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-maintenance/10">
                <Clock className="h-6 w-6 text-status-maintenance" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rent Due Soon</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'rent-due').length}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-primary/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leases Expiring</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => n.type === 'lease-expiry').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              All Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  All ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="overdue">
                  Overdue ({notifications.filter(n => n.type === 'overdue').length})
                </TabsTrigger>
                <TabsTrigger value="rent-due">
                  Due Soon ({notifications.filter(n => n.type === 'rent-due').length})
                </TabsTrigger>
                <TabsTrigger value="lease-expiry">
                  Leases ({notifications.filter(n => n.type === 'lease-expiry').length})
                </TabsTrigger>
              </TabsList>

              <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-status-occupied" />
                    <p>No notifications in this category</p>
                  </div>
                ) : (
                  filteredNotifications.map(notification => {
                    const Icon = notification.icon;
                    return (
                      <div
                        key={notification.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${getTypeColor(notification.type)} bg-current/10`}>
                          <Icon className={`h-5 w-5 ${getTypeColor(notification.type)}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium">{notification.title}</h3>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
