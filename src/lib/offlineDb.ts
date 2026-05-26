// Fana Plaza: Predictive Offline Hybrid Local Registry
import { STATUS } from "@/data/mockData";

export interface Floor {
  id: string;
  number: number;
  name: string;
  type: "commercial" | "residential";
  created_at: string;
}

export interface Room {
  id: string;
  floor_id: string;
  number: string;
  size: number;
  rent_price: number;
  status: "vacant" | "occupied" | "maintenance";
  is_manager_office: boolean;
  room_type?: "Studio" | "Single Bedroom" | "Double Bedroom" | "Penthouse";
  business_name?: string;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  contact_number?: string;
  email?: string;
  room_id?: string | null;
  id_number?: string;
  business_type?: string;
  emergency_contact?: string;
  lease_start?: string;
  lease_end?: string;
  notes?: string;
  source?: 'direct' | 'airbnb';
  status?: 'active' | 'archived' | 'evicted';
  move_out_date?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  amount: number;
  status: "paid" | "pending";
  due_date: string;
  paid_at?: string | null;
  payment_method?: string;
  staff_responsible?: string;
  created_at: string;
  // Included in selection
  tenants?: {
    name: string;
    contact_number?: string;
  };
}

export interface MaintenanceLog {
  id: string;
  room_id: string;
  description: string;
  severity: "Low" | "Medium" | "High";
  status: "Pending" | "Assigned" | "In Progress" | "Completed";
  log_type?: string;
  assigned_to?: string;
  deadline?: string;
  created_at: string;
  rooms?: {
    number: string;
    business_name?: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
}

export interface SystemSettings {
  id: string;
  username: string;
  passcode: string;
  penalty_rate: number;
  grace_period: number;
  lease_expiry_days: number;
  sms_provider_number?: string;
  sms_provider_url?: string;
  sms_provider_key?: string;
  sms_template_5_days?: string;
  sms_template_3_days?: string;
  sms_template_deadline?: string;
  updated_at: string;
}

// Check if localStorage is available
const isBrowser = typeof window !== "undefined";

function getItem<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  const stored = localStorage.getItem(`fana_${key}`);
  if (stored === null) {
    localStorage.setItem(`fana_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser) return;
  localStorage.setItem(`fana_${key}`, JSON.stringify(value));
}

// 1. Initial Seeds
const initialFloors: Floor[] = [
  { id: "f-0", number: 0, name: "Ground Floor", type: "commercial", created_at: new Date().toISOString() },
  { id: "f-1", number: 1, name: "1st Floor", type: "commercial", created_at: new Date().toISOString() },
  { id: "f-2", number: 2, name: "2nd Floor", type: "commercial", created_at: new Date().toISOString() },
  { id: "f-3", number: 3, name: "3rd Floor", type: "commercial", created_at: new Date().toISOString() },
  { id: "f-4", number: 4, name: "4th Floor", type: "residential", created_at: new Date().toISOString() },
  { id: "f-5", number: 5, name: "5th Floor", type: "residential", created_at: new Date().toISOString() },
];

const initialRooms: Room[] = (() => {
  const list: Room[] = [];
  // Commercial floors
  for (let f = 0; f <= 3; f++) {
    const limit = f === 3 ? 3 : 4;
    for (let r = 1; r <= limit; r++) {
      const roomNum = `${f}${String(r).padStart(2, "0")}`;
      list.push({
        id: `r-${f}-${r}`,
        floor_id: `f-${f}`,
        number: roomNum,
        size: 45,
        rent_price: 18000,
        status: (f === 3 && r === 3) ? "maintenance" : "vacant",
        is_manager_office: (f === 3 && r === 3),
        room_type: "Studio",
        created_at: new Date().toISOString()
      });
    }
  }
  // Residential floors
  for (let f = 4; f <= 5; f++) {
    for (let r = 1; r <= 4; r++) {
      const roomNum = `${f}${String(r).padStart(2, "0")}`;
      list.push({
        id: `r-${f}-${r}`,
        floor_id: `f-${f}`,
        number: roomNum,
        size: 35,
        rent_price: f === 4 ? 8000 : 12000,
        status: "vacant",
        is_manager_office: false,
        room_type: f === 4 ? "Studio" : "Single Bedroom",
        created_at: new Date().toISOString()
      });
    }
  }
  return list;
})();

const initialTenants: Tenant[] = [
  {
    id: "t-1",
    name: "Abraham Alula",
    contact_number: "+251911223344",
    email: "abraham@gmail.com",
    room_id: "r-0-1",
    id_number: "ID-90872",
    business_type: "Electronics Shop",
    emergency_contact: "Aster Alula (+251911998877)",
    lease_start: new Date().toISOString(),
    lease_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Requires quarterly billing statements.",
    source: 'direct',
    status: 'active',
    created_at: new Date().toISOString()
  },
  {
    id: "t-2",
    name: "Elena Rostova",
    contact_number: "+251922334455",
    email: "elena@airbnb.com",
    room_id: "r-4-2",
    id_number: "PASSPORT-AB987",
    business_type: "Tourist / Leisure",
    emergency_contact: "Embassy Support",
    lease_start: new Date().toISOString(),
    lease_end: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Airbnb guest visiting Addis Ababa.",
    source: 'airbnb',
    status: 'active',
    created_at: new Date().toISOString()
  }
];

// Reflect occupied rooms in initialRooms status
initialRooms.forEach(room => {
  const occupier = initialTenants.find(t => t.room_id === room.id && t.status === "active");
  if (occupier) {
    room.status = "occupied";
  }
});

const initialPayments: Payment[] = [
  {
    id: "p-1",
    tenant_id: "t-1",
    amount: 18000,
    status: "paid",
    due_date: new Date().toISOString().split("T")[0],
    paid_at: new Date().toISOString(),
    payment_method: "Bank Transfer",
    staff_responsible: "Senior Manager",
    created_at: new Date().toISOString()
  },
  {
    id: "p-2",
    tenant_id: "t-2",
    amount: 8000,
    status: "pending",
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    paid_at: null,
    created_at: new Date().toISOString()
  }
];

const initialMaintenance: MaintenanceLog[] = [
  {
    id: "m-1",
    room_id: "r-0-2",
    description: "Leaking faucet in restroom",
    severity: "Medium",
    status: "Pending",
    log_type: "plumbing",
    created_at: new Date().toISOString()
  }
];

const initialNotifications: Notification[] = [
  {
    id: "n-1",
    title: "Welcome to Executive Suite",
    message: "Fana Plaza registry hybrid backup operational.",
    type: "success",
    is_read: false,
    created_at: new Date().toISOString()
  }
];

const initialSettings: SystemSettings = {
  id: "settings-default",
  username: "admin@fanaplaza.com",
  passcode: "1234",
  penalty_rate: 5,
  grace_period: 7,
  lease_expiry_days: 1,
  sms_provider_number: "",
  sms_provider_url: "",
  sms_provider_key: "",
  sms_template_5_days: "Dear {name}, you have 5 days left to make your payment. Please ensure timely settlement.",
  sms_template_3_days: "Dear {name}, you have 3 days left to make your payment. Please secure your unit.",
  sms_template_deadline: "Dear {name}, today is the deadline for your payment. Please make payment by today.",
  updated_at: new Date().toISOString()
};

// 2. Export Database Accessors
export const offlineDb = {
  getFloors: () => getItem<Floor[]>("floors", initialFloors),
  saveFloors: (floors: Floor[]) => setItem("floors", floors),
  
  getRooms: () => getItem<Room[]>("rooms", initialRooms),
  saveRooms: (rooms: Room[]) => setItem("rooms", rooms),
  
  getTenants: () => getItem<Tenant[]>("tenants", initialTenants),
  saveTenants: (tenants: Tenant[]) => setItem("tenants", tenants),
  
  getPayments: () => {
    const list = getItem<Payment[]>("payments", initialPayments);
    const tenants = getItem<Tenant[]>("tenants", initialTenants);
    return list.map(pay => ({
      ...pay,
      tenants: (() => {
        const t = tenants.find(ten => ten.id === pay.tenant_id);
        return t ? { name: t.name, contact_number: t.contact_number } : undefined;
      })()
    }));
  },
  savePayments: (payments: Payment[]) => setItem("payments", payments),
  
  getMaintenance: () => {
    const list = getItem<MaintenanceLog[]>("maintenance", initialMaintenance);
    const rooms = getItem<Room[]>("rooms", initialRooms);
    return list.map(log => ({
      ...log,
      rooms: (() => {
        const r = rooms.find(rom => rom.id === log.room_id);
        return r ? { number: r.number, business_name: r.business_name } : undefined;
      })()
    }));
  },
  saveMaintenance: (logs: MaintenanceLog[]) => setItem("maintenance", logs),
  
  getNotifications: () => getItem<Notification[]>("notifications", initialNotifications),
  saveNotifications: (notifications: Notification[]) => setItem("notifications", notifications),
  
  getSettings: () => getItem<SystemSettings>("settings", initialSettings),
  saveSettings: (settings: SystemSettings) => setItem("settings", settings),

  // Reset Methods
  resetProperties: () => {
    setItem("floors", initialFloors);
    setItem("rooms", initialRooms.map(r => ({ ...r, status: "vacant" as const })));
  },
  resetTenants: () => {
    setItem("tenants", initialTenants);
    const rooms = getItem<Room[]>("rooms", initialRooms);
    const updated = rooms.map(r => {
      const occupied = initialTenants.find(t => t.room_id === r.id && t.status === "active");
      return { ...r, status: occupied ? "occupied" as const : "vacant" as const };
    });
    setItem("rooms", updated);
  },
  resetPayments: () => {
    setItem("payments", initialPayments);
  },
  resetMaintenance: () => {
    setItem("maintenance", initialMaintenance);
  },
  resetAll: () => {
    setItem("floors", initialFloors);
    const updatedRooms = initialRooms.map(r => {
      const occupied = initialTenants.find(t => t.room_id === r.id && t.status === "active");
      return { ...r, status: occupied ? "occupied" as const : "vacant" as const };
    });
    setItem("rooms", updatedRooms);
    setItem("tenants", initialTenants);
    setItem("payments", initialPayments);
    setItem("maintenance", initialMaintenance);
    setItem("notifications", initialNotifications);
  }
};
