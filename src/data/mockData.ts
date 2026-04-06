// Status colors: green=occupied, yellow=maintenance, red=vacant
export const STATUS = {
  occupied: "occupied",
  maintenance: "maintenance",
  vacant: "vacant",
} as const;

export const buildingConfig = {
  name: "FANA PLAZA",
  penaltyPercent: 5,
  penaltyIntervalDays: 5,
  floors: [
    { floor: 0, type: "commercial", unitCount: 3 },
    { floor: 1, type: "commercial", unitCount: 4 },
    { floor: 2, type: "commercial", unitCount: 6 },
    { floor: 3, type: "commercial", unitCount: 4, hasManagementOffice: true },
    { floor: 4, type: "apartment", unitCount: 5, roomTypes: ["studio","one-bedroom","studio","one-bedroom","one-bedroom"] },
    { floor: 5, type: "apartment", unitCount: 5, roomTypes: ["studio","one-bedroom","studio","one-bedroom","one-bedroom"] },
    { floor: 6, type: "apartment", unitCount: 5, roomTypes: ["studio","one-bedroom","studio","one-bedroom","one-bedroom"] },
    { floor: 7, type: "apartment", unitCount: 5, roomTypes: ["studio","one-bedroom","studio","one-bedroom","one-bedroom"] },
    { floor: 8, type: "apartment", unitCount: 5, roomTypes: ["studio","one-bedroom","studio","one-bedroom","one-bedroom"] },
    { floor: 9, type: "apartment", unitCount: 5, roomTypes: ["studio","one-bedroom","studio","one-bedroom","one-bedroom"] },
  ],
};

export const units = (() => {
  const arr: any[] = [];
  for (const f of buildingConfig.floors) {
    for (let i = 1; i <= f.unitCount; i++) {
      const unitNumber = String(i).padStart(2, "0");
      const isManagementOffice = f.floor === 3 && i === f.unitCount; // last unit on 3rd floor is office
      const type = f.type;
      const roomType = f.type === "apartment" ? f.roomTypes?.[i - 1] : undefined;
      arr.push({
        id: `u-${f.floor}-${unitNumber}`,
        floor: f.floor,
        unitNumber,
        type,
        status: isManagementOffice ? STATUS.maintenance : STATUS.vacant,
        isManagementOffice,
        roomType,
        rentAmount: isManagementOffice ? 0 : type === "commercial" ? 25000 : roomType === "studio" ? 8000 : 12000,
      });
    }
  }
  return arr;
})();

export const tenants = [
  // Sample tenants — you’ll replace with real data or database
  { id: "t1", name: "Abebe Kebede", email: "abebe@example.com", phone: "+251-911-000000", unitId: units.find(u => u.type==="apartment" && u.status===STATUS.vacant)?.id || units[0].id, documents: [], broker: { name: "Broker One", idNumber: "BRK-123", percent: 5 } },
];

export const payments = [
  // Sample payments
  { id: "p1", tenantId: tenants[0].id, unitId: tenants[0].unitId, amount: 8000, dueDate: new Date().toISOString(), status: "pending" },
];

export const notifications = [
  { id: "n1", title: "Rent due in 3 days", isRead: false },
];

export function calculatePenalty(dueDate: string | Date, amount: number) {
  const now = new Date();
  const due = new Date(dueDate);
  if (now <= due) return 0;
  const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  const intervals = Math.floor(diffDays / buildingConfig.penaltyIntervalDays);
  const penalty = (buildingConfig.penaltyPercent / 100) * amount * intervals;
  return Math.max(0, Math.floor(penalty));
}
