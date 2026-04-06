import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, DollarSign, Home, Store } from 'lucide-react';
import { units, tenants, buildingConfig } from '@/data/mockData';

export default function Units() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');

  const filteredUnits = units.filter(unit => {
    const matchesStatus = statusFilter === 'all' || unit.status === statusFilter;
    const matchesFloor = floorFilter === 'all' || unit.floor === parseInt(floorFilter);
    return matchesStatus && matchesFloor;
  });

  const floors = [...new Set(units.map(u => u.floor))].sort((a, b) => a - b);

  const getFloorLabel = (floor) => {
    if (floor === 0) return 'Ground Floor';
    return `Floor ${floor}`;
  };

  const getTenantForUnit = (unitId) => {
    return tenants.find(t => t.unitId === unitId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-status-occupied text-white';
      case 'vacant': return 'bg-status-vacant text-white';
      case 'maintenance': return 'bg-status-maintenance text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const commercialUnits = units.filter(u => u.type === 'commercial');
  const apartmentUnits = units.filter(u => u.type === 'apartment');
  const occupiedUnits = units.filter(u => u.status === 'occupied');
  const totalRevenue = occupiedUnits.reduce((sum, u) => sum + u.rentAmount, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Units" subtitle="Manage all units in FANA PLAZA" />
      
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold">{units.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-status-occupied/10">
                <Store className="h-6 w-6 text-status-occupied" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commercial</p>
                <p className="text-2xl font-bold">{commercialUnits.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Home className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Apartments</p>
                <p className="text-2xl font-bold">{apartmentUnits.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  {floors.map(floor => (
                    <SelectItem key={floor} value={floor.toString()}>
                      {getFloorLabel(floor)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Units by Floor */}
        {floors.map(floor => {
          const floorUnits = filteredUnits.filter(u => u.floor === floor);
          if (floorUnits.length === 0) return null;
          
          const floorConfig = buildingConfig.floors.find(f => f.floor === floor);
          const isCommercial = floorConfig?.type === 'commercial';
          
          return (
            <Card key={floor}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isCommercial ? <Store className="h-5 w-5" /> : <Home className="h-5 w-5" />}
                  {getFloorLabel(floor)}
                  <Badge variant="outline" className="ml-2">
                    {floorUnits.length} units
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {floorUnits.map(unit => {
                    const tenant = getTenantForUnit(unit.id);
                    return (
                      <div
                        key={unit.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">Unit {unit.unitNumber}</h3>
                            {unit.roomType && (
                              <p className="text-sm text-muted-foreground capitalize">
                                {unit.roomType.replace('-', ' ')}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusColor(unit.status)}>
                            {unit.isManagementOffice ? 'Office' : unit.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Rent:</span>
                            <span className="font-medium">
                              {unit.isManagementOffice ? 'N/A' : `$${unit.rentAmount.toLocaleString()}/mo`}
                            </span>
                          </div>
                          
                          {tenant && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Tenant:</span>
                              <span className="font-medium">{tenant.name}</span>
                            </div>
                          )}
                          
                          {unit.status === 'vacant' && !unit.isManagementOffice && (
                            <Button size="sm" className="w-full mt-2">
                              Add Tenant
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
