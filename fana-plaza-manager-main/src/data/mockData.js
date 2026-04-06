// Building configuration - editable for different buildings
export const buildingConfig = {
  name: 'FANA PLAZA',
  address: 'Addis Ababa, Ethiopia',
  managerName: 'Admin User',
  managerEmail: 'manager@fanaplaza.com',
  managerPhone: '+251-911-000000',
  penaltyPercent: 5, // 5% penalty
  penaltyIntervalDays: 5, // every 5 days
  floors: [
    { floorNumber: 0, type: 'commercial', unitCount: 3 },
    { floorNumber: 1, type: 'commercial', unitCount: 4 },
    { floorNumber: 2, type: 'commercial', unitCount: 6 },
    { floorNumber: 3, type: 'commercial', unitCount: 4, hasManagementOffice: true },
    { floorNumber: 4, type: 'apartment', unitCount: 5, roomTypes: ['studio', 'one-bedroom', 'studio', 'one-bedroom', 'one-bedroom'] },
    { floorNumber: 5, type: 'apartment', unitCount: 5, roomTypes: ['studio', 'one-bedroom', 'studio', 'one-bedroom', 'one-bedroom'] },
    { floorNumber: 6, type: 'apartment', unitCount: 5, roomTypes: ['studio', 'one-bedroom', 'studio', 'one-bedroom', 'one-bedroom'] },
    { floorNumber: 7, type: 'apartment', unitCount: 5, roomTypes: ['studio', 'one-bedroom', 'studio', 'one-bedroom', 'one-bedroom'] },
    { floorNumber: 8, type: 'apartment', unitCount: 5, roomTypes: ['studio', 'one-bedroom', 'studio', 'one-bedroom', 'one-bedroom'] },
    { floorNumber: 9, type: 'apartment', unitCount: 5, roomTypes: ['studio', 'one-bedroom', 'studio', 'one-bedroom', 'one-bedroom'] },
  ]
};

// Generate units based on building config
export const units = [
  // Ground Floor - 3 commercial
  { id: 'g-01', floor: 0, unitNumber: 'G-01', type: 'commercial', rentAmount: 25000, status: 'occupied', tenantId: 't1', isManagementOffice: false },
  { id: 'g-02', floor: 0, unitNumber: 'G-02', type: 'commercial', rentAmount: 22000, status: 'occupied', tenantId: 't2', isManagementOffice: false },
  { id: 'g-03', floor: 0, unitNumber: 'G-03', type: 'commercial', rentAmount: 20000, status: 'vacant', isManagementOffice: false },
  
  // 1st Floor - 4 shops
  { id: '1-01', floor: 1, unitNumber: '1-01', type: 'commercial', rentAmount: 18000, status: 'occupied', tenantId: 't3', isManagementOffice: false },
  { id: '1-02', floor: 1, unitNumber: '1-02', type: 'commercial', rentAmount: 18000, status: 'occupied', tenantId: 't4', isManagementOffice: false },
  { id: '1-03', floor: 1, unitNumber: '1-03', type: 'commercial', rentAmount: 16000, status: 'maintenance', isManagementOffice: false },
  { id: '1-04', floor: 1, unitNumber: '1-04', type: 'commercial', rentAmount: 16000, status: 'vacant', isManagementOffice: false },
  
  // 2nd Floor - 6 shops
  { id: '2-01', floor: 2, unitNumber: '2-01', type: 'commercial', rentAmount: 14000, status: 'occupied', tenantId: 't5', isManagementOffice: false },
  { id: '2-02', floor: 2, unitNumber: '2-02', type: 'commercial', rentAmount: 14000, status: 'occupied', tenantId: 't6', isManagementOffice: false },
  { id: '2-03', floor: 2, unitNumber: '2-03', type: 'commercial', rentAmount: 14000, status: 'occupied', tenantId: 't7', isManagementOffice: false },
  { id: '2-04', floor: 2, unitNumber: '2-04', type: 'commercial', rentAmount: 12000, status: 'vacant', isManagementOffice: false },
  { id: '2-05', floor: 2, unitNumber: '2-05', type: 'commercial', rentAmount: 12000, status: 'vacant', isManagementOffice: false },
  { id: '2-06', floor: 2, unitNumber: '2-06', type: 'commercial', rentAmount: 12000, status: 'occupied', tenantId: 't8', isManagementOffice: false },
  
  // 3rd Floor - 4 shops (1 is management office)
  { id: '3-01', floor: 3, unitNumber: '3-01', type: 'commercial', rentAmount: 0, status: 'occupied', isManagementOffice: true },
  { id: '3-02', floor: 3, unitNumber: '3-02', type: 'commercial', rentAmount: 10000, status: 'occupied', tenantId: 't9', isManagementOffice: false },
  { id: '3-03', floor: 3, unitNumber: '3-03', type: 'commercial', rentAmount: 10000, status: 'vacant', isManagementOffice: false },
  { id: '3-04', floor: 3, unitNumber: '3-04', type: 'commercial', rentAmount: 10000, status: 'occupied', tenantId: 't10', isManagementOffice: false },
  
  // 4th Floor - 5 apartments (01=studio, 02=1br, 03=studio, 04=1br, 05=1br)
  { id: '4-01', floor: 4, unitNumber: '4-01', type: 'apartment', roomType: 'studio', rentAmount: 4000, status: 'occupied', tenantId: 't11', isManagementOffice: false },
  { id: '4-02', floor: 4, unitNumber: '4-02', type: 'apartment', roomType: 'one-bedroom', rentAmount: 5500, status: 'occupied', tenantId: 't12', isManagementOffice: false },
  { id: '4-03', floor: 4, unitNumber: '4-03', type: 'apartment', roomType: 'studio', rentAmount: 4000, status: 'vacant', isManagementOffice: false },
  { id: '4-04', floor: 4, unitNumber: '4-04', type: 'apartment', roomType: 'one-bedroom', rentAmount: 5500, status: 'occupied', tenantId: 't13', isManagementOffice: false },
  { id: '4-05', floor: 4, unitNumber: '4-05', type: 'apartment', roomType: 'one-bedroom', rentAmount: 5500, status: 'maintenance', isManagementOffice: false },
  
  // 5th Floor
  { id: '5-01', floor: 5, unitNumber: '5-01', type: 'apartment', roomType: 'studio', rentAmount: 4200, status: 'occupied', tenantId: 't14', isManagementOffice: false },
  { id: '5-02', floor: 5, unitNumber: '5-02', type: 'apartment', roomType: 'one-bedroom', rentAmount: 5700, status: 'vacant', isManagementOffice: false },
  { id: '5-03', floor: 5, unitNumber: '5-03', type: 'apartment', roomType: 'studio', rentAmount: 4200, status: 'occupied', tenantId: 't15', isManagementOffice: false },
  { id: '5-04', floor: 5, unitNumber: '5-04', type: 'apartment', roomType: 'one-bedroom', rentAmount: 5700, status: 'occupied', tenantId: 't16', isManagementOffice: false },
  { id: '5-05', floor: 5, unitNumber: '5-05', type: 'apartment', roomType: 'one-bedroom', rentAmount: 5700, status: 'vacant', isManagementOffice: false },
  
  // 6th Floor
  { id: '6-01', floor: 6, unitNumber: '6-01', type: 'apartment', roomType: 'studio', rentAmount: 4400, status: 'occupied', tenantId: 't17', isManagementOffice: false },
  { id: '6-02', floor: 6, unitNumber: '6-02', type: 'apartment', roomType: 'one-bedroom', rentAmount: 5900, status: 'occupied', tenantId: 't18', isManagementOffice: false },
  { id: '6-03', floor: 6, unitNumber: '6-03', type: 'apartment', roomType: 'studio', rentAmount: 4400, status: 'vacant', isManagementOffice: false },
  { id: '6-04', floor: 6, unitNumber: '6-04', type: 'apartment', roomType: 'one-bedroom', rentAmount: 5900, status: 'occupied', tenantId: 't19', isManagementOffice: false },
  { id: '6-05', floor: 6, unitNumber: '6-05', type: 'apartment', roomType: 'one-bedroom', rentAmount: 5900, status: 'maintenance', isManagementOffice: false },
  
  // 7th Floor
  { id: '7-01', floor: 7, unitNumber: '7-01', type: 'apartment', roomType: 'studio', rentAmount: 4600, status: 'occupied', tenantId: 't20', isManagementOffice: false },
  { id: '7-02', floor: 7, unitNumber: '7-02', type: 'apartment', roomType: 'one-bedroom', rentAmount: 6100, status: 'vacant', isManagementOffice: false },
  { id: '7-03', floor: 7, unitNumber: '7-03', type: 'apartment', roomType: 'studio', rentAmount: 4600, status: 'occupied', tenantId: 't21', isManagementOffice: false },
  { id: '7-04', floor: 7, unitNumber: '7-04', type: 'apartment', roomType: 'one-bedroom', rentAmount: 6100, status: 'occupied', tenantId: 't22', isManagementOffice: false },
  { id: '7-05', floor: 7, unitNumber: '7-05', type: 'apartment', roomType: 'one-bedroom', rentAmount: 6100, status: 'vacant', isManagementOffice: false },
  
  // 8th Floor
  { id: '8-01', floor: 8, unitNumber: '8-01', type: 'apartment', roomType: 'studio', rentAmount: 4800, status: 'occupied', tenantId: 't23', isManagementOffice: false },
  { id: '8-02', floor: 8, unitNumber: '8-02', type: 'apartment', roomType: 'one-bedroom', rentAmount: 6300, status: 'occupied', tenantId: 't24', isManagementOffice: false },
  { id: '8-03', floor: 8, unitNumber: '8-03', type: 'apartment', roomType: 'studio', rentAmount: 4800, status: 'vacant', isManagementOffice: false },
  { id: '8-04', floor: 8, unitNumber: '8-04', type: 'apartment', roomType: 'one-bedroom', rentAmount: 6300, status: 'occupied', tenantId: 't25', isManagementOffice: false },
  { id: '8-05', floor: 8, unitNumber: '8-05', type: 'apartment', roomType: 'one-bedroom', rentAmount: 6300, status: 'maintenance', isManagementOffice: false },
  
  // 9th Floor
  { id: '9-01', floor: 9, unitNumber: '9-01', type: 'apartment', roomType: 'studio', rentAmount: 5000, status: 'occupied', tenantId: 't26', isManagementOffice: false },
  { id: '9-02', floor: 9, unitNumber: '9-02', type: 'apartment', roomType: 'one-bedroom', rentAmount: 6500, status: 'occupied', tenantId: 't27', isManagementOffice: false },
  { id: '9-03', floor: 9, unitNumber: '9-03', type: 'apartment', roomType: 'studio', rentAmount: 5000, status: 'vacant', isManagementOffice: false },
  { id: '9-04', floor: 9, unitNumber: '9-04', type: 'apartment', roomType: 'one-bedroom', rentAmount: 6500, status: 'occupied', tenantId: 't28', isManagementOffice: false },
  { id: '9-05', floor: 9, unitNumber: '9-05', type: 'apartment', roomType: 'one-bedroom', rentAmount: 6500, status: 'vacant', isManagementOffice: false },
];

export const tenants = [
  // Commercial tenants (long-term, stable)
  { id: 't1', name: 'Abebe Kebede', email: 'contact@abcpharmacy.com', phone: '+251-911-123456', unitId: 'g-01', leaseType: 'long-term', leaseStart: new Date('2022-01-01'), leaseEnd: new Date('2027-12-31'), businessName: 'ABC Pharmacy Ltd.', depositPaid: 50000, idNumber: 'ET-123456789', documents: [], broker: null },
  { id: 't2', name: 'Sara Tesfaye', email: 'info@fashionhub.com', phone: '+251-912-234567', unitId: 'g-02', leaseType: 'long-term', leaseStart: new Date('2023-03-01'), leaseEnd: new Date('2028-02-28'), businessName: 'Fashion Hub PLC', depositPaid: 44000, idNumber: 'ET-234567890', documents: [], broker: { name: 'Dawit Broker', phone: '+251-911-999999', idNumber: 'BRK-001', commissionPercent: 10 } },
  { id: 't3', name: 'Mulugeta Haile', email: 'quickbite@email.com', phone: '+251-913-345678', unitId: '1-01', leaseType: 'long-term', leaseStart: new Date('2023-06-01'), leaseEnd: new Date('2026-05-31'), businessName: 'Quick Bite Restaurant', depositPaid: 36000, idNumber: 'ET-345678901', documents: [] },
  { id: 't4', name: 'Helen Girma', email: 'office@techsol.com', phone: '+251-914-456789', unitId: '1-02', leaseType: 'long-term', leaseStart: new Date('2024-01-01'), leaseEnd: new Date('2027-12-31'), businessName: 'Tech Solutions Inc.', depositPaid: 36000, idNumber: 'ET-456789012', documents: [] },
  { id: 't5', name: 'Yonas Bekele', email: 'yonas@salon.com', phone: '+251-915-567890', unitId: '2-01', leaseType: 'long-term', leaseStart: new Date('2023-01-01'), leaseEnd: new Date('2026-12-31'), businessName: 'Style Hair Salon', depositPaid: 28000, idNumber: 'ET-567890123', documents: [] },
  { id: 't6', name: 'Tigist Alemu', email: 'tigist@coffee.com', phone: '+251-916-678901', unitId: '2-02', leaseType: 'long-term', leaseStart: new Date('2024-03-01'), leaseEnd: new Date('2027-02-28'), businessName: 'Ethiopian Coffee House', depositPaid: 28000, idNumber: 'ET-678901234', documents: [] },
  { id: 't7', name: 'Kassa Tadesse', email: 'kassa@electronics.com', phone: '+251-917-789012', unitId: '2-03', leaseType: 'long-term', leaseStart: new Date('2023-09-01'), leaseEnd: new Date('2026-08-31'), businessName: 'Kassa Electronics', depositPaid: 28000, idNumber: 'ET-789012345', documents: [] },
  { id: 't8', name: 'Meron Assefa', email: 'meron@boutique.com', phone: '+251-918-890123', unitId: '2-06', leaseType: 'long-term', leaseStart: new Date('2024-06-01'), leaseEnd: new Date('2027-05-31'), businessName: 'Meron Boutique', depositPaid: 24000, idNumber: 'ET-890123456', documents: [] },
  { id: 't9', name: 'Daniel Mekonnen', email: 'daniel@travel.com', phone: '+251-919-901234', unitId: '3-02', leaseType: 'long-term', leaseStart: new Date('2024-01-01'), leaseEnd: new Date('2027-12-31'), businessName: 'Ethio Travel Agency', depositPaid: 20000, idNumber: 'ET-901234567', documents: [] },
  { id: 't10', name: 'Rahel Worku', email: 'rahel@fitness.com', phone: '+251-920-012345', unitId: '3-04', leaseType: 'long-term', leaseStart: new Date('2023-07-01'), leaseEnd: new Date('2026-06-30'), businessName: 'FitLife Gym', depositPaid: 20000, idNumber: 'ET-012345678', documents: [] },
  
  // Apartment tenants (mix of short-term and long-term)
  { id: 't11', name: 'Ahmed Hassan', email: 'ahmed.h@email.com', phone: '+251-921-111111', unitId: '4-01', leaseType: 'short-term', leaseStart: new Date('2024-12-20'), leaseEnd: new Date('2025-01-20'), depositPaid: 4000, idNumber: 'ET-111111111', documents: [] },
  { id: 't12', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+251-922-222222', unitId: '4-02', leaseType: 'long-term', leaseStart: new Date('2024-06-01'), leaseEnd: new Date('2025-05-31'), depositPaid: 11000, idNumber: 'US-222222222', documents: [], broker: { name: 'Broker Ali', phone: '+251-933-888888', idNumber: 'BRK-002', commissionPercent: 5 } },
  { id: 't13', name: 'Michael Chen', email: 'michael.c@email.com', phone: '+251-923-333333', unitId: '4-04', leaseType: 'short-term', leaseStart: new Date('2024-12-25'), leaseEnd: new Date('2025-01-10'), depositPaid: 5500, idNumber: 'CN-333333333', documents: [] },
  { id: 't14', name: 'Lisa Williams', email: 'lisa.w@email.com', phone: '+251-924-444444', unitId: '5-01', leaseType: 'long-term', leaseStart: new Date('2024-09-01'), leaseEnd: new Date('2025-08-31'), depositPaid: 8400, idNumber: 'UK-444444444', documents: [] },
  { id: 't15', name: 'David Brown', email: 'david.b@email.com', phone: '+251-925-555555', unitId: '5-03', leaseType: 'short-term', leaseStart: new Date('2024-12-15'), leaseEnd: new Date('2025-01-05'), depositPaid: 4200, idNumber: 'US-555555555', documents: [] },
  { id: 't16', name: 'Emma Taylor', email: 'emma.t@email.com', phone: '+251-926-666666', unitId: '5-04', leaseType: 'long-term', leaseStart: new Date('2024-03-01'), leaseEnd: new Date('2025-02-28'), depositPaid: 11400, idNumber: 'AU-666666666', documents: [] },
  { id: 't17', name: 'Gemechu Tadesse', email: 'gemechu@email.com', phone: '+251-927-777777', unitId: '6-01', leaseType: 'short-term', leaseStart: new Date('2024-12-28'), leaseEnd: new Date('2025-01-15'), depositPaid: 4400, idNumber: 'ET-777777777', documents: [] },
  { id: 't18', name: 'Fatuma Ahmed', email: 'fatuma@email.com', phone: '+251-928-888888', unitId: '6-02', leaseType: 'long-term', leaseStart: new Date('2024-07-01'), leaseEnd: new Date('2025-06-30'), depositPaid: 11800, idNumber: 'ET-888888888', documents: [] },
  { id: 't19', name: 'Solomon Gebru', email: 'solomon@email.com', phone: '+251-929-999999', unitId: '6-04', leaseType: 'long-term', leaseStart: new Date('2024-04-01'), leaseEnd: new Date('2025-03-31'), depositPaid: 11800, idNumber: 'ET-999999999', documents: [] },
  { id: 't20', name: 'Hana Mengistu', email: 'hana@email.com', phone: '+251-930-000000', unitId: '7-01', leaseType: 'short-term', leaseStart: new Date('2024-12-20'), leaseEnd: new Date('2025-01-10'), depositPaid: 4600, idNumber: 'ET-000000001', documents: [] },
  { id: 't21', name: 'Biniam Tesfaye', email: 'biniam@email.com', phone: '+251-931-111111', unitId: '7-03', leaseType: 'long-term', leaseStart: new Date('2024-08-01'), leaseEnd: new Date('2025-07-31'), depositPaid: 9200, idNumber: 'ET-111111112', documents: [] },
  { id: 't22', name: 'Tsion Yohannes', email: 'tsion@email.com', phone: '+251-932-222222', unitId: '7-04', leaseType: 'long-term', leaseStart: new Date('2024-05-01'), leaseEnd: new Date('2025-04-30'), depositPaid: 12200, idNumber: 'ET-222222223', documents: [] },
  { id: 't23', name: 'Ermias Kassahun', email: 'ermias@email.com', phone: '+251-933-333333', unitId: '8-01', leaseType: 'short-term', leaseStart: new Date('2024-12-22'), leaseEnd: new Date('2025-01-08'), depositPaid: 4800, idNumber: 'ET-333333334', documents: [] },
  { id: 't24', name: 'Bethlehem Hailu', email: 'bethlehem@email.com', phone: '+251-934-444444', unitId: '8-02', leaseType: 'long-term', leaseStart: new Date('2024-10-01'), leaseEnd: new Date('2025-09-30'), depositPaid: 12600, idNumber: 'ET-444444445', documents: [] },
  { id: 't25', name: 'Yared Getachew', email: 'yared@email.com', phone: '+251-935-555555', unitId: '8-04', leaseType: 'long-term', leaseStart: new Date('2024-02-01'), leaseEnd: new Date('2025-01-31'), depositPaid: 12600, idNumber: 'ET-555555556', documents: [] },
  { id: 't26', name: 'Meseret Desta', email: 'meseret@email.com', phone: '+251-936-666666', unitId: '9-01', leaseType: 'short-term', leaseStart: new Date('2024-12-26'), leaseEnd: new Date('2025-01-12'), depositPaid: 5000, idNumber: 'ET-666666667', documents: [] },
  { id: 't27', name: 'Tesfaye Lemma', email: 'tesfaye@email.com', phone: '+251-937-777777', unitId: '9-02', leaseType: 'long-term', leaseStart: new Date('2024-11-01'), leaseEnd: new Date('2025-10-31'), depositPaid: 13000, idNumber: 'ET-777777778', documents: [] },
  { id: 't28', name: 'Aster Bekele', email: 'aster@email.com', phone: '+251-938-888888', unitId: '9-04', leaseType: 'long-term', leaseStart: new Date('2024-06-01'), leaseEnd: new Date('2025-05-31'), depositPaid: 13000, idNumber: 'ET-888888889', documents: [] },
];

const today = new Date();
const inThreeDays = new Date(today);
inThreeDays.setDate(today.getDate() + 3);

const fiveDaysAgo = new Date(today);
fiveDaysAgo.setDate(today.getDate() - 5);

const tenDaysAgo = new Date(today);
tenDaysAgo.setDate(today.getDate() - 10);

// Helper function to calculate penalty
export function calculatePenalty(originalAmount, dueDate, penaltyPercent = 5, intervalDays = 5) {
  const today = new Date();
  const due = new Date(dueDate);
  
  if (today <= due) {
    return { penaltyAmount: 0, penaltyPercent: 0, totalAmount: originalAmount };
  }
  
  const daysOverdue = Math.floor((today - due) / (1000 * 60 * 60 * 24));
  const penaltyIntervals = Math.floor(daysOverdue / intervalDays) + 1;
  const totalPenaltyPercent = penaltyIntervals * penaltyPercent;
  const penaltyAmount = (originalAmount * totalPenaltyPercent) / 100;
  
  return {
    penaltyAmount,
    penaltyPercent: totalPenaltyPercent,
    totalAmount: originalAmount + penaltyAmount,
    daysOverdue
  };
}

export const payments = [
  // Commercial payments
  { id: 'p1', tenantId: 't1', unitId: 'g-01', amount: 25000, originalAmount: 25000, penaltyAmount: 0, penaltyPercent: 0, dueDate: inThreeDays, status: 'pending', month: 'January', year: 2025 },
  { id: 'p2', tenantId: 't2', unitId: 'g-02', amount: 22000, originalAmount: 22000, penaltyAmount: 0, penaltyPercent: 0, dueDate: new Date('2025-01-01'), paidDate: new Date('2024-12-28'), status: 'paid', month: 'January', year: 2025 },
  { id: 'p3', tenantId: 't3', unitId: '1-01', amount: 18000, originalAmount: 18000, penaltyAmount: 0, penaltyPercent: 0, dueDate: inThreeDays, status: 'pending', month: 'January', year: 2025 },
  { id: 'p4', tenantId: 't4', unitId: '1-02', amount: 18900, originalAmount: 18000, penaltyAmount: 900, penaltyPercent: 5, dueDate: fiveDaysAgo, status: 'overdue', month: 'January', year: 2025 },
  { id: 'p5', tenantId: 't5', unitId: '2-01', amount: 15400, originalAmount: 14000, penaltyAmount: 1400, penaltyPercent: 10, dueDate: tenDaysAgo, status: 'overdue', month: 'January', year: 2025 },
  
  // Apartment payments
  { id: 'p6', tenantId: 't11', unitId: '4-01', amount: 4000, originalAmount: 4000, penaltyAmount: 0, penaltyPercent: 0, dueDate: new Date('2024-12-20'), paidDate: new Date('2024-12-20'), status: 'paid', month: 'December', year: 2024 },
  { id: 'p7', tenantId: 't12', unitId: '4-02', amount: 5500, originalAmount: 5500, penaltyAmount: 0, penaltyPercent: 0, dueDate: inThreeDays, status: 'pending', month: 'January', year: 2025 },
  { id: 'p8', tenantId: 't13', unitId: '4-04', amount: 5500, originalAmount: 5500, penaltyAmount: 0, penaltyPercent: 0, dueDate: new Date('2024-12-25'), paidDate: new Date('2024-12-25'), status: 'paid', month: 'December', year: 2024 },
  { id: 'p9', tenantId: 't14', unitId: '5-01', amount: 4200, originalAmount: 4200, penaltyAmount: 0, penaltyPercent: 0, dueDate: new Date('2025-01-01'), status: 'pending', month: 'January', year: 2025 },
  { id: 'p10', tenantId: 't15', unitId: '5-03', amount: 4200, originalAmount: 4200, penaltyAmount: 0, penaltyPercent: 0, dueDate: new Date('2024-12-15'), paidDate: new Date('2024-12-15'), status: 'paid', month: 'December', year: 2024 },
  { id: 'p11', tenantId: 't16', unitId: '5-04', amount: 5985, originalAmount: 5700, penaltyAmount: 285, penaltyPercent: 5, dueDate: fiveDaysAgo, status: 'overdue', month: 'January', year: 2025 },
];

export const notifications = [
  { id: 'n1', type: 'rent-due', message: 'ABC Pharmacy Ltd. rent due in 3 days', date: today, isRead: false, tenantId: 't1' },
  { id: 'n2', type: 'rent-due', message: 'Quick Bite Restaurant rent due in 3 days', date: today, isRead: false, tenantId: 't3' },
  { id: 'n3', type: 'rent-due', message: 'Sarah Johnson rent due in 3 days', date: today, isRead: false, tenantId: 't12' },
  { id: 'n4', type: 'overdue', message: 'Tech Solutions Inc. payment is overdue! (5% penalty applied)', date: fiveDaysAgo, isRead: true, tenantId: 't4' },
  { id: 'n5', type: 'overdue', message: 'Style Hair Salon payment is 10 days overdue! (10% penalty applied)', date: tenDaysAgo, isRead: false, tenantId: 't5' },
  { id: 'n6', type: 'lease-expiring', message: 'Ahmed Hassan lease expires in 20 days', date: today, isRead: false, tenantId: 't11' },
  { id: 'n7', type: 'payment-received', message: 'Payment received from Fashion Hub PLC', date: new Date('2024-12-28'), isRead: true, tenantId: 't2' },
  { id: 'n8', type: 'maintenance', message: 'Unit 1-03 under maintenance', date: today, isRead: true },
  { id: 'n9', type: 'overdue', message: 'Emma Taylor payment is overdue! (5% penalty applied)', date: fiveDaysAgo, isRead: false, tenantId: 't16' },
];

// Room type labels
export const roomTypeLabels = {
  'studio': 'Studio',
  'one-bedroom': 'One Bedroom',
  'two-bedroom': 'Two Bedroom',
  'three-bedroom': 'Three Bedroom'
};

// Status colors
export const statusColors = {
  'occupied': 'bg-emerald-500', // Green
  'vacant': 'bg-red-500', // Red  
  'maintenance': 'bg-amber-500' // Yellow
};

export const statusLabels = {
  'occupied': 'Occupied',
  'vacant': 'Vacant',
  'maintenance': 'Maintenance'
};
