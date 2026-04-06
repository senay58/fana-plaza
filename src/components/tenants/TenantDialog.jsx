import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { format } from 'date-fns';
import { roomTypeLabels } from '../../data/mockData';

export function TenantDialog({ open, onOpenChange, tenant, units, onSave }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', unitId: '', leaseType: 'long-term', leaseStart: new Date(), leaseEnd: new Date(), businessName: '', depositPaid: 0, notes: '', idNumber: '', documents: [], broker: null });
  const [brokerEnabled, setBrokerEnabled] = useState(false);

  const availableUnits = units.filter(u => (u.status === 'vacant' || u.id === tenant?.unitId) && !u.isManagementOffice);
  const selectedUnit = units.find(u => u.id === formData.unitId);
  const isCommercial = selectedUnit?.type === 'commercial';

  useEffect(() => {
    if (tenant) {
      setFormData({ ...tenant, leaseStart: new Date(tenant.leaseStart), leaseEnd: new Date(tenant.leaseEnd) });
      setBrokerEnabled(!!tenant.broker);
    } else {
      setFormData({ name: '', email: '', phone: '', unitId: '', leaseType: 'long-term', leaseStart: new Date(), leaseEnd: new Date(), businessName: '', depositPaid: 0, notes: '', idNumber: '', documents: [], broker: null });
      setBrokerEnabled(false);
    }
  }, [tenant, open]);

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{tenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3"><TabsTrigger value="basic">Basic Info</TabsTrigger><TabsTrigger value="documents">Documents</TabsTrigger><TabsTrigger value="broker">Broker</TabsTrigger></TabsList>
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2"><Label>Unit *</Label><Select value={formData.unitId} onValueChange={(value) => setFormData({ ...formData, unitId: value })}><SelectTrigger><SelectValue placeholder="Select a unit" /></SelectTrigger><SelectContent>{availableUnits.map(unit => (<SelectItem key={unit.id} value={unit.id}>{unit.unitNumber} - {unit.type === 'commercial' ? 'Commercial' : roomTypeLabels[unit.roomType] || 'Apartment'} (ETB {unit.rentAmount.toLocaleString()}/mo)</SelectItem>))}</SelectContent></Select></div>
              {isCommercial && <div className="space-y-2"><Label>Business Name</Label><Input value={formData.businessName || ''} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} placeholder="e.g., ABC Pharmacy Ltd." /></div>}
              <div className="space-y-2"><Label>{isCommercial ? 'Contact Person *' : 'Tenant Name *'}</Label><Input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Email *</Label><Input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required /></div><div className="space-y-2"><Label>Phone *</Label><Input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required /></div></div>
              <div className="space-y-2"><Label>ID Number</Label><Input value={formData.idNumber || ''} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} placeholder="National ID or Passport" /></div>
              <div className="space-y-2"><Label>Lease Type</Label><Select value={formData.leaseType} onValueChange={(value) => setFormData({ ...formData, leaseType: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="short-term">Short-term (days/weeks)</SelectItem><SelectItem value="long-term">Long-term (months/years)</SelectItem></SelectContent></Select></div>
              <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Lease Start *</Label><Input type="date" value={formData.leaseStart ? format(formData.leaseStart, 'yyyy-MM-dd') : ''} onChange={(e) => setFormData({ ...formData, leaseStart: new Date(e.target.value) })} required /></div><div className="space-y-2"><Label>Lease End *</Label><Input type="date" value={formData.leaseEnd ? format(formData.leaseEnd, 'yyyy-MM-dd') : ''} onChange={(e) => setFormData({ ...formData, leaseEnd: new Date(e.target.value) })} required /></div></div>
              <div className="space-y-2"><Label>Security Deposit (ETB)</Label><Input type="number" value={formData.depositPaid || ''} onChange={(e) => setFormData({ ...formData, depositPaid: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} /></div>
            </TabsContent>
            <TabsContent value="documents" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">Upload tenant documents (ID card, license, lease agreement). File upload requires backend integration.</p>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center"><p className="text-muted-foreground">Drag & drop files here or click to upload</p><Button type="button" variant="outline" className="mt-4">Select Files</Button></div>
            </TabsContent>
            <TabsContent value="broker" className="space-y-4 mt-4">
              <div className="flex items-center gap-2"><input type="checkbox" checked={brokerEnabled} onChange={(e) => setBrokerEnabled(e.target.checked)} className="rounded" /><Label>Tenant used a broker</Label></div>
              {brokerEnabled && (<div className="space-y-4 p-4 border rounded-lg"><div className="space-y-2"><Label>Broker Name</Label><Input value={formData.broker?.name || ''} onChange={(e) => setFormData({ ...formData, broker: { ...formData.broker, name: e.target.value } })} /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Broker Phone</Label><Input value={formData.broker?.phone || ''} onChange={(e) => setFormData({ ...formData, broker: { ...formData.broker, phone: e.target.value } })} /></div><div className="space-y-2"><Label>Commission %</Label><Input type="number" value={formData.broker?.commissionPercent || ''} onChange={(e) => setFormData({ ...formData, broker: { ...formData.broker, commissionPercent: Number(e.target.value) } })} /></div></div><div className="space-y-2"><Label>Broker ID Number</Label><Input value={formData.broker?.idNumber || ''} onChange={(e) => setFormData({ ...formData, broker: { ...formData.broker, idNumber: e.target.value } })} /></div></div>)}
            </TabsContent>
          </Tabs>
          <div className="flex gap-3 pt-6"><Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" className="flex-1">{tenant ? 'Save Changes' : 'Add Tenant'}</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
