// Type definitions as JSDoc comments for JavaScript

/**
 * @typedef {'apartment' | 'commercial'} UnitType
 */

/**
 * @typedef {'studio' | 'one-bedroom' | 'two-bedroom' | 'three-bedroom'} RoomType
 */

/**
 * @typedef {'occupied' | 'vacant' | 'maintenance'} UnitStatus
 */

/**
 * @typedef {'paid' | 'pending' | 'overdue'} PaymentStatus
 */

/**
 * @typedef {'short-term' | 'long-term'} LeaseType
 */

/**
 * @typedef {Object} Document
 * @property {string} id
 * @property {string} name
 * @property {string} type - 'id-card' | 'license' | 'agreement' | 'broker-id' | 'other'
 * @property {string} url
 * @property {Date} uploadedAt
 */

/**
 * @typedef {Object} BrokerInfo
 * @property {string} name
 * @property {string} phone
 * @property {string} idNumber
 * @property {number} commissionPercent
 * @property {string} [idDocumentUrl]
 */

/**
 * @typedef {Object} Unit
 * @property {string} id
 * @property {number} floor
 * @property {string} unitNumber
 * @property {UnitType} type
 * @property {RoomType} [roomType] - For apartments only
 * @property {number} rentAmount
 * @property {UnitStatus} status
 * @property {string} [tenantId]
 * @property {boolean} isManagementOffice
 */

/**
 * @typedef {Object} Tenant
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} unitId
 * @property {LeaseType} leaseType
 * @property {Date} leaseStart
 * @property {Date} leaseEnd
 * @property {string} [businessName] - For commercial tenants
 * @property {number} depositPaid
 * @property {string} [notes]
 * @property {string} [idNumber]
 * @property {Document[]} documents
 * @property {BrokerInfo} [broker]
 */

/**
 * @typedef {Object} Payment
 * @property {string} id
 * @property {string} tenantId
 * @property {string} unitId
 * @property {number} amount
 * @property {number} originalAmount
 * @property {number} penaltyAmount
 * @property {number} penaltyPercent
 * @property {Date} dueDate
 * @property {Date} [paidDate]
 * @property {PaymentStatus} status
 * @property {string} month
 * @property {number} year
 */

/**
 * @typedef {Object} Notification
 * @property {string} id
 * @property {'rent-due' | 'lease-expiring' | 'payment-received' | 'maintenance' | 'overdue'} type
 * @property {string} message
 * @property {Date} date
 * @property {boolean} isRead
 * @property {string} [tenantId]
 */

/**
 * @typedef {Object} FloorConfig
 * @property {number} floorNumber
 * @property {'commercial' | 'apartment'} type
 * @property {number} unitCount
 * @property {RoomType[]} [roomTypes] - For apartment floors
 */

/**
 * @typedef {Object} BuildingConfig
 * @property {string} name
 * @property {string} address
 * @property {string} managerName
 * @property {string} managerEmail
 * @property {string} managerPhone
 * @property {FloorConfig[]} floors
 * @property {number} penaltyPercent
 * @property {number} penaltyIntervalDays
 */

// Export empty object for module compatibility
export {};
