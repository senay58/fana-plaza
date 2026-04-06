import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, Bell, Shield, Palette, Plus, Trash2, Home, Store } from 'lucide-react';
import { buildingConfig } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { toast } = useToast();
  const [config, setConfig] = useState(buildingConfig);
  const [notifications, setNotifications] = useState({
    rentDue3Days: true,
    overduePayments: true,
    leaseExpiry: true,
    emailNotifications: false,
  });

  const handleSaveBuilding = () => {
    toast({
      title: "Settings Saved",
      description: "Building configuration has been updated.",
    });
  };

  const handleAddFloor = () => {
    const newFloor = {
      floor: config.floors.length,
      type: 'apartment',
      unitCount: 5,
      roomTypes: ['studio', 'one-bedroom', 'studio', 'one-bedroom', 'one-bedroom'],
    };
    setConfig({
      ...config,
      floors: [...config.floors, newFloor],
    });
  };

  const handleRemoveFloor = (floorIndex) => {
    setConfig({
      ...config,
      floors: config.floors.filter((_, i) => i !== floorIndex),
    });
  };

  const handleFloorChange = (floorIndex, field, value) => {
    const updatedFloors = [...config.floors];
    updatedFloors[floorIndex] = {
      ...updatedFloors[floorIndex],
      [field]: value,
    };
    
    // If unit count changes, update roomTypes array
    if (field === 'unitCount') {
      const count = parseInt(value) || 1;
      const currentRoomTypes = updatedFloors[floorIndex].roomTypes || [];
      if (count > currentRoomTypes.length) {
        updatedFloors[floorIndex].roomTypes = [
          ...currentRoomTypes,
          ...Array(count - currentRoomTypes.length).fill('studio'),
        ];
      } else {
        updatedFloors[floorIndex].roomTypes = currentRoomTypes.slice(0, count);
      }
    }
    
    setConfig({ ...config, floors: updatedFloors });
  };

  const handleRoomTypeChange = (floorIndex, roomIndex, value) => {
    const updatedFloors = [...config.floors];
    const roomTypes = [...(updatedFloors[floorIndex].roomTypes || [])];
    roomTypes[roomIndex] = value;
    updatedFloors[floorIndex].roomTypes = roomTypes;
    setConfig({ ...config, floors: updatedFloors });
  };

  const roomTypeOptions = [
    { value: 'studio', label: 'Studio' },
    { value: 'one-bedroom', label: 'One Bedroom' },
    { value: 'two-bedroom', label: 'Two Bedroom' },
    { value: 'three-bedroom', label: 'Three Bedroom' },
    { value: 'penthouse', label: 'Penthouse' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header title="Settings" subtitle="Configure your building management system" />
      
      <div className="p-6">
        <Tabs defaultValue="building" className="space-y-6">
          <TabsList>
            <TabsTrigger value="building" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Building
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="penalties" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Penalties
            </TabsTrigger>
          </TabsList>

          {/* Building Configuration */}
          <TabsContent value="building" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Building Information</CardTitle>
                <CardDescription>
                  Configure your building details for white-label deployment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buildingName">Building Name</Label>
                    <Input
                      id="buildingName"
                      value={config.buildingName}
                      onChange={(e) => setConfig({ ...config, buildingName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={config.address || ''}
                      onChange={(e) => setConfig({ ...config, address: e.target.value })}
                      placeholder="Enter building address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Floor Configuration</CardTitle>
                    <CardDescription>
                      Define floors, unit counts, and room types
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddFloor} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Floor
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.floors.map((floor, floorIndex) => (
                  <div key={floorIndex} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {floor.type === 'commercial' ? (
                          <Store className="h-5 w-5 text-primary" />
                        ) : (
                          <Home className="h-5 w-5 text-accent-foreground" />
                        )}
                        <h3 className="font-medium">
                          {floor.floor === 0 ? 'Ground Floor' : `Floor ${floor.floor}`}
                        </h3>
                        <Badge variant="outline">
                          {floor.type === 'commercial' ? 'Commercial' : 'Residential'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFloor(floorIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Floor Type</Label>
                        <Select
                          value={floor.type}
                          onValueChange={(value) => handleFloorChange(floorIndex, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="apartment">Residential</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Number of Units</Label>
                        <Input
                          type="number"
                          min="1"
                          max="20"
                          value={floor.unitCount}
                          onChange={(e) => handleFloorChange(floorIndex, 'unitCount', e.target.value)}
                        />
                      </div>

                      {floor.hasManagementOffice !== undefined && (
                        <div className="space-y-2">
                          <Label>Management Office</Label>
                          <div className="flex items-center space-x-2 h-10">
                            <Switch
                              checked={floor.hasManagementOffice}
                              onCheckedChange={(checked) => 
                                handleFloorChange(floorIndex, 'hasManagementOffice', checked)
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {floor.hasManagementOffice ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Room Types for Apartments */}
                    {floor.type === 'apartment' && floor.roomTypes && (
                      <div className="space-y-2">
                        <Label>Room Types</Label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {floor.roomTypes.map((roomType, roomIndex) => (
                            <div key={roomIndex} className="space-y-1">
                              <span className="text-xs text-muted-foreground">
                                Unit {String(roomIndex + 1).padStart(2, '0')}
                              </span>
                              <Select
                                value={roomType}
                                onValueChange={(value) => 
                                  handleRoomTypeChange(floorIndex, roomIndex, value)
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {roomTypeOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <Button onClick={handleSaveBuilding} className="w-full">
                  Save Building Configuration
                </Button>
              </CardContent>
            </Card>

            {/* Status Legend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Status Color Legend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-status-occupied" />
                    <span>Occupied</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-status-vacant" />
                    <span>Vacant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-status-maintenance" />
                    <span>Maintenance</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Configure when and how you receive alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Rent Due in 3 Days</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when rent is due within 3 days
                    </p>
                  </div>
                  <Switch
                    checked={notifications.rentDue3Days}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, rentDue3Days: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Overdue Payments</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about overdue payments with penalties
                    </p>
                  </div>
                  <Switch
                    checked={notifications.overduePayments}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, overduePayments: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lease Expiry Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified 30 days before lease expiration
                    </p>
                  </div>
                  <Switch
                    checked={notifications.leaseExpiry}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, leaseExpiry: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email (requires backend setup)
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotifications({ ...notifications, emailNotifications: checked })
                    }
                  />
                </div>

                <Button 
                  onClick={() => toast({ 
                    title: "Preferences Saved",
                    description: "Notification settings have been updated."
                  })}
                >
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Penalty Settings */}
          <TabsContent value="penalties">
            <Card>
              <CardHeader>
                <CardTitle>Late Payment Penalties</CardTitle>
                <CardDescription>
                  Configure penalty rules for overdue payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="penaltyPercent">Penalty Percentage (%)</Label>
                    <Input
                      id="penaltyPercent"
                      type="number"
                      min="0"
                      max="100"
                      value={config.penaltyPercent}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        penaltyPercent: parseInt(e.target.value) || 0 
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Percentage of rent charged as penalty
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="penaltyInterval">Penalty Interval (Days)</Label>
                    <Input
                      id="penaltyInterval"
                      type="number"
                      min="1"
                      max="30"
                      value={config.penaltyIntervalDays}
                      onChange={(e) => setConfig({ 
                        ...config, 
                        penaltyIntervalDays: parseInt(e.target.value) || 1 
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Penalty applied every X days
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Current Policy:</strong> {config.penaltyPercent}% penalty applied every {config.penaltyIntervalDays} days starting from the first day after the due date.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Example: For a $1,000 rent payment 10 days overdue, the penalty would be ${((config.penaltyPercent / 100) * 1000 * Math.floor(10 / config.penaltyIntervalDays)).toFixed(2)}
                  </p>
                </div>

                <Button 
                  onClick={() => toast({ 
                    title: "Penalty Settings Saved",
                    description: "Late payment penalty rules have been updated."
                  })}
                >
                  Save Penalty Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
