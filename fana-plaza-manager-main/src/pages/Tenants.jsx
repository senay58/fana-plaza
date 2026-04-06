import { useState } from 'react';
import { Header } from '../components/layout/Header';
import { TenantCard } from '../components/tenants/TenantCard';
import { TenantDialog } from '../components/tenants/TenantDialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { tenants as initialTenants, units, payments, notifications } from '../data/mockData';
import { Plus, Search, Building2, Home } from 'lucide-react';

const Tenants = () => {
  const [tenantList, setTenantList] = useState(initialTenants);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const getTenantWithUnit = (tenant) => {
    const unit = units.find(u => u.id === tenant.unitId);
    return { ...tenant, unit };
  };

  const commercialTenants = tenantList.filter(t => {
    const unit = units.find(u => u.id === t.unitId);
    return unit?.type === 'commercial';
  }).map(getTenantWithUnit);

  const apartmentTenants = tenantList.filter(t => {
    const unit = units.find(u => u.id === t.unitId);
    return unit?.type === 'apartment';
  }).map(getTenantWithUnit);

  const filterTenants = (tenants) => {
    if (!searchQuery) return tenants;
    const query = searchQuery.toLowerCase();
    return tenants.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.businessName?.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query) ||
      t.unit?.unitNumber.toLowerCase().includes(query)
    );
  };

  const handleAddTenant = () => { setEditingTenant(null); setDialogOpen(true); };
  const handleEditTenant = (tenant) => { setEditingTenant(tenant); setDialogOpen(true); };
  const handleSaveTenant = (tenant) => {
    if (editingTenant) {
      setTenantList(prev => prev.map(t => t.id === tenant.id ? tenant : t));
    } else {
      setTenantList(prev => [...prev, { ...tenant, id: `t${Date.now()}` }]);
    }
    setDialogOpen(false);
  };
  const handleDeleteTenant = (tenantId) => { setTenantList(prev => prev.filter(t => t.id !== tenantId)); };

  return (
    <div className="min-h-screen">
      <Header title="Tenants" subtitle="Manage all tenants in FANA PLAZA" unreadNotifications={unreadNotifications} />
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tenants..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={handleAddTenant} className="gap-2"><Plus className="h-4 w-4" />Add Tenant</Button>
        </div>
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">All ({tenantList.length})</TabsTrigger>
            <TabsTrigger value="commercial"><Building2 className="h-4 w-4 mr-1" />Commercial ({commercialTenants.length})</TabsTrigger>
            <TabsTrigger value="apartment"><Home className="h-4 w-4 mr-1" />Apartments ({apartmentTenants.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filterTenants([...commercialTenants, ...apartmentTenants]).map(tenant => (<TenantCard key={tenant.id} tenant={tenant} unit={tenant.unit} payments={payments.filter(p => p.tenantId === tenant.id)} onEdit={() => handleEditTenant(tenant)} onDelete={() => handleDeleteTenant(tenant.id)} />))}</div></TabsContent>
          <TabsContent value="commercial"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filterTenants(commercialTenants).map(tenant => (<TenantCard key={tenant.id} tenant={tenant} unit={tenant.unit} payments={payments.filter(p => p.tenantId === tenant.id)} onEdit={() => handleEditTenant(tenant)} onDelete={() => handleDeleteTenant(tenant.id)} />))}</div></TabsContent>
          <TabsContent value="apartment"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filterTenants(apartmentTenants).map(tenant => (<TenantCard key={tenant.id} tenant={tenant} unit={tenant.unit} payments={payments.filter(p => p.tenantId === tenant.id)} onEdit={() => handleEditTenant(tenant)} onDelete={() => handleDeleteTenant(tenant.id)} />))}</div></TabsContent>
        </Tabs>
      </div>
      <TenantDialog open={dialogOpen} onOpenChange={setDialogOpen} tenant={editingTenant} units={units} onSave={handleSaveTenant} />
    </div>
  );
};

export default Tenants;
