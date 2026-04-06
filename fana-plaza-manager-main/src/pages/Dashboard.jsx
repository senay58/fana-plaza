import { Header } from '../components/layout/Header';
import { StatsCard } from '../components/dashboard/StatsCard';
import { RentAlerts } from '../components/dashboard/RentAlerts';
import { RecentPayments } from '../components/dashboard/RecentPayments';
import { BuildingOverview } from '../components/dashboard/BuildingOverview';
import { units, tenants, payments, notifications } from '../data/mockData';
import { Building2, Users, Wallet, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const totalUnits = units.filter(u => !u.isManagementOffice).length;
  const occupancyRate = Math.round((occupiedUnits / totalUnits) * 100);
  const totalTenants = tenants.length;
  const commercialTenants = tenants.filter(t => {
    const unit = units.find(u => u.id === t.unitId);
    return unit?.type === 'commercial';
  }).length;
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const overduePayments = payments.filter(p => p.status === 'overdue');
  const overdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle="Welcome back! Here's your property overview." unreadNotifications={unreadNotifications} />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Occupancy Rate" value={`${occupancyRate}%`} subtitle={`${occupiedUnits} of ${totalUnits} units`} icon={Building2} variant="primary" />
          <StatsCard title="Total Tenants" value={totalTenants} subtitle={`${commercialTenants} commercial, ${totalTenants - commercialTenants} residential`} icon={Users} variant="default" />
          <StatsCard title="Pending Rent" value={`ETB ${pendingAmount.toLocaleString()}`} subtitle={`${pendingPayments.length} payments pending`} icon={Wallet} variant="default" />
          <StatsCard title="Overdue" value={`ETB ${overdueAmount.toLocaleString()}`} subtitle={`${overduePayments.length} payment${overduePayments.length !== 1 ? 's' : ''} overdue`} icon={AlertCircle} variant="warning" />
        </div>
        <BuildingOverview units={units} />
        <div className="grid gap-6 lg:grid-cols-2">
          <RentAlerts payments={payments} tenants={tenants} units={units} />
          <RecentPayments payments={payments} tenants={tenants} units={units} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
