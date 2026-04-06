import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export function BuildingOverview({ units }) {
  // Group units by floor
  const floors = [...new Set(units.map(u => u.floor))].sort((a, b) => b - a);

  const getFloorLabel = (floor) => {
    if (floor === 0) return 'Ground';
    return `Floor ${floor}`;
  };

  const getFloorType = (floor) => {
    return floor <= 3 ? 'commercial' : 'apartment';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied': return 'bg-[hsl(var(--status-occupied))]';
      case 'vacant': return 'bg-[hsl(var(--status-vacant))]';
      case 'maintenance': return 'bg-[hsl(var(--status-maintenance))]';
      default: return 'bg-muted';
    }
  };

  const getStatusTextColor = (status) => {
    return 'text-white';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Building Overview</CardTitle>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Commercial (G-3)
          </Badge>
          <Badge variant="outline" className="bg-accent text-accent-foreground border-accent-foreground/20">
            Apartments (4-9)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {floors.map((floor) => {
            const floorUnits = units.filter(u => u.floor === floor);
            const type = getFloorType(floor);
            
            return (
              <div
                key={floor}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-3',
                  type === 'commercial' 
                    ? 'border-primary/20 bg-primary/5' 
                    : 'border-accent-foreground/20 bg-accent/50'
                )}
              >
                <div className="w-20 text-sm font-medium text-foreground">
                  {getFloorLabel(floor)}
                </div>
                <div className="flex flex-1 gap-2 flex-wrap">
                  {floorUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className={cn(
                        'rounded-md px-3 py-2 text-center text-xs font-medium transition-colors min-w-[60px]',
                        unit.isManagementOffice 
                          ? 'bg-secondary text-secondary-foreground'
                          : getStatusColor(unit.status),
                        getStatusTextColor(unit.status)
                      )}
                    >
                      {unit.unitNumber}
                      <span className="block text-[10px] opacity-90">
                        {unit.isManagementOffice ? 'Office' : 
                          unit.status === 'occupied' ? 'Occupied' : 
                          unit.status === 'vacant' ? 'Vacant' : 'Maint.'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
