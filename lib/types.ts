// ========================================================================================
// TriBloom Farms: Core Types & Interfaces
// ========================================================================================

export type UserRole = 'admin' | 'partner' | 'supervisor' | 'accounts' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  name?: string;
  role: UserRole;
  partnerId?: string;
  partnerName?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface FarmSettings {
  id: string;
  farmName: string;
  currency: string;
  fyStartMonth: number;
  stemsPerBunch: number;
  invoicePrefix: string;
  challanPrefix: string;
  timezone: string;
  isMonthLocked: boolean;
  lockedUntilDate?: string;
}

export interface Partner {
  id: string;
  name: string;
  familyGroup: string;
  phone: string;
  email: string;
  committedAmount: number; // Partner share in Amount (INR) only
  isActive: boolean;
  notes?: string;
}

export interface Block {
  id: string;
  name: string;
  areaAcres: number;
  notes?: string;
  isActive: boolean;
}

export interface PolyhouseVarietyMapping {
  varietyId: string;
  varietyName: string;
  color?: string;
  plantCount?: number;
}

export interface Polyhouse {
  id: string;
  blockId: string;
  blockName?: string;
  name: string;
  areaSqm: number;
  varietyId?: string; // backwards compatibility
  varietyName?: string; // backwards compatibility
  varieties?: PolyhouseVarietyMapping[]; // multiple flower varieties support
  plantCount?: number;
  plantingDate?: string;
  status: 'active' | 'resting' | 'replanting' | 'maintenance';
  notes?: string;
  isActive: boolean;
}

export interface FarmEntity {
  id: string;
  name: string;
  code: string;
  type?: 'source' | 'processing' | 'both';
  location?: string;
  role?: string;
  phone?: string;
  isDefault?: boolean;
  isActive: boolean;
  notes?: string;
}

export interface AuctionCentre {
  id: string;
  name: string;
  city: string;
  code?: string;
  state?: string;
  phone?: string;
  commissionPercent?: number;
  isActive: boolean;
  notes?: string;
}

export interface StemLengthCategory {
  id: string;
  name: string;
  minCm?: number;
  maxCm?: number;
  minLengthCm?: number;
  maxLengthCm?: number;
  sortOrder?: number;
  isActive: boolean;
  description?: string;
}

export interface BunchSizeConfig {
  id: string;
  stemsPerBunch: number;
  label?: string;
  name?: string;
  isActive: boolean;
}

export interface RoseVariety {
  id: string;
  name: string;
  color: string;
  hexCode: string;
  stemLengthNote?: string;
  isActive: boolean;
}

export interface PolyhouseVariety {
  id: string;
  polyhouseId: string;
  varietyId: string;
  plantCount: number;
  plantingDate?: string;
  isActive: boolean;
}

export interface Grade {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  parentCategoryId?: string;
  icon: string;
  color: string;
  isInventoryLinked: boolean;
  isActive: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  category?: string;
  address?: string;
  isActive: boolean;
}

export interface Buyer {
  id: string;
  name: string;
  type: 'market' | 'exporter' | 'florist' | 'agent' | 'retailer' | 'aggregator';
  phone: string;
  email?: string;
  city: string;
  creditDays: number;
  openingBalance: number;
  isAggregator?: boolean;
  isActive: boolean;
  notes?: string;
}

export interface Vehicle {
  id: string;
  number: string;
  driverName: string;
  driverPhone: string;
  ownerType: 'own' | 'hired';
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'fertilizer' | 'pesticide' | 'packaging' | 'consumable' | 'other';
  unit: 'kg' | 'L' | 'pcs' | 'box' | 'roll' | 'bag';
  reorderLevel: number;
  currentStock: number;
  isActive: boolean;
}

// Transaction Types
export interface Expense {
  id: string;
  date: string;
  categoryId: string;
  categoryName?: string;
  subcategory?: string;
  description: string;
  amount: number;
  paidByType: 'partner' | 'farm_cash' | 'bank';
  paidByPartnerId?: string;
  paidByPartnerName?: string;
  vendorId?: string;
  vendorName?: string;
  polyhouseId?: string;
  polyhouseName?: string;
  paymentMode: 'cash' | 'bank' | 'UPI' | 'card' | 'cheque';
  billPhotoUrl?: string;
  reimbursable: boolean;
  countsAsContribution: boolean;
  reimbursementStatus: 'none' | 'pending' | 'partial' | 'settled';
  notes?: string;
  isVoid: boolean;
  voidReason?: string;
  createdAt: string;
}

export interface Contribution {
  id: string;
  partnerId: string;
  partnerName?: string;
  date: string;
  amount: number;
  mode: 'cash' | 'bank' | 'UPI' | 'cheque' | 'other';
  reference?: string;
  purpose: string;
  receiptPhotoUrl?: string;
  notes?: string;
  isVoid: boolean;
  voidReason?: string;
  createdAt: string;
}

export interface Commitment {
  id: string;
  partnerId: string;
  partnerName?: string;
  totalCommitted: number;
  installmentNo: number;
  dueDate?: string;
  amountDue: number;
  notes?: string;
  isVoid: boolean;
  voidReason?: string;
  createdAt: string;
}

export interface Reimbursement {
  id: string;
  partnerId: string;
  partnerName?: string;
  date: string;
  amount: number;
  mode: 'cash' | 'bank' | 'UPI' | 'cheque';
  reference?: string;
  notes?: string;
  isVoid: boolean;
  voidReason?: string;
  createdAt: string;
}

export interface HarvestLine {
  id: string;
  varietyId: string;
  varietyName?: string;
  varietyColor?: string;
  varietyHex?: string;
  gradeId: string;
  gradeName?: string;
  stemsGood: number;
  stemsWastage: number;
  wastageReason?: 'disease' | 'damage' | 'short stem' | 'overripe' | 'bent stem' | 'thrips' | 'other';
}

export interface HarvestEntry {
  id: string;
  date: string;
  polyhouseId: string;
  polyhouseName?: string;
  pickedBy: string;
  lines: HarvestLine[];
  totalGoodStems: number;
  totalWastageStems: number;
  notes?: string;
  isLocked: boolean;
  isVoid: boolean;
  voidReason?: string;
  createdAt: string;
}

export interface ColdRoomStockItem {
  varietyId: string;
  varietyName: string;
  varietyHex: string;
  gradeId: string;
  gradeName: string;
  currentStems: number;
  bunchesCount: number;
}

export interface DispatchLine {
  id: string;
  varietyId: string;
  varietyName?: string;
  gradeId: string;
  gradeName?: string;
  stems: number;
  bunches: number;
}

export interface Dispatch {
  id: string;
  challanNo: string;
  date: string;
  time: string;
  vehicleId?: string;
  vehicleNumber?: string;
  driverName: string;
  buyerId: string;
  buyerName?: string;
  destination: string;
  boxesCount: number;
  transportCost: number;
  status: 'loaded' | 'in_transit' | 'delivered' | 'cancelled';
  deliveredAt?: string;
  isAggregatorDispatch?: boolean;
  aggregatorName?: string;
  stemsReceivedAtAggregator?: number;
  aggregatorNotes?: string;
  lines: DispatchLine[];
  totalStems: number;
  notes?: string;
  isVoid: boolean;
  voidReason?: string;
  createdAt: string;
}

export interface SaleLine {
  id: string;
  varietyId: string;
  varietyName?: string;
  gradeId: string;
  gradeName?: string;
  stems: number;
  ratePerStem: number;
  rejectedStems: number;
  amount: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  date: string;
  buyerId: string;
  buyerName?: string;
  dispatchId?: string;
  rateStatus: 'provisional' | 'final';
  subtotal: number;
  deductions: number;
  total: number;
  lines: SaleLine[];
  notes?: string;
  isVoid: boolean;
  voidReason?: string;
  createdAt: string;
}

export interface PaymentReceived {
  id: string;
  buyerId: string;
  buyerName?: string;
  date: string;
  amount: number;
  mode: 'cash' | 'bank' | 'UPI' | 'cheque' | 'neft';
  reference?: string;
  notes?: string;
  isVoid: boolean;
  voidReason?: string;
  createdAt: string;
}

export interface PartnerLedgerSummary {
  partnerId: string;
  partnerName: string;
  familyGroup: string;
  committedAmount: number; // Partner Share in INR
  sharePercent: number;    // Calculated percentage based on total committed
  phone: string;
  email: string;
  contributedAmount: number;
  outstandingCommitment: number;
  expCountedAsContribution: number;
  reimbursableExpensesPaid: number;
  reimbursementsReceived: number;
  reimbursementDue: number;
  netCapitalInFarm: number;
}

// ========================================================================================
// End-to-End Flower Journey Traceability Types (Harvest -> Dispatch 1 -> Grading -> Packing -> Dispatch 2 -> Auction)
// ========================================================================================

// 1. Harvest Stage (Bucket measurement + optional stem conversion)
export interface HarvestBatchLine {
  id: string;
  varietyId: string;
  varietyName: string;
  varietyColor?: string;
  flowerColor?: string;
  varietyHex?: string;
  bucketsHarvested: number;
  stemsPerBucket?: number; // optional conversion if stems counted
  estimatedStems?: number; // bucketsHarvested * stemsPerBucket
  totalStemsHarvested?: number;
  bucketsDispatched?: number; // tracked for Dispatch 1
  remarks?: string;
}

export interface HarvestBatch {
  id: string;
  batchRef: string; // e.g., "HV-20261017-001"
  date?: string;
  harvestDate?: string;
  time?: string;
  harvestTime?: string;
  farmId?: string;
  polyhouseId: string;
  polyhouseName: string;
  pickedBy?: string;
  harvestedBy?: string;
  lines: HarvestBatchLine[];
  totalBuckets: number;
  totalEstimatedStems: number;
  status: 'harvested' | 'partially_dispatched' | 'fully_dispatched' | 'available_for_dispatch' | string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
  isVoid: boolean;
  voidReason?: string;
}

// 2. Dispatch 1: TriBloom Farm to Processing Farm
export interface Dispatch1Line {
  id: string;
  harvestBatchId?: string;
  harvestBatchRef: string;
  harvestLineId?: string;
  polyhouseId: string;
  polyhouseName: string;
  varietyId: string;
  varietyName: string;
  varietyColor?: string;
  flowerColor?: string;
  bucketsSent?: number;
  stemsSent?: number;
  bucketsDispatched?: number;
  stemsDispatched?: number;
  bucketsReceived?: number;
  stemsReceived?: number;
  discrepancyBuckets?: number; // Sent - Received
  discrepancyStems?: number;
  discrepancyReason?: string;
  stemsGraded?: number; // tracked in grading stage
  remarks?: string;
}

export interface Dispatch1 {
  id: string;
  dispatchRef: string; // e.g., "DSP1-20261017-001"
  date?: string;
  dispatchDate?: string;
  time: string;
  dispatchTime?: string;
  sourceFarmId: string;
  sourceFarmName: string;
  destFarmId?: string;
  destinationFarmId?: string;
  destFarmName?: string;
  destinationFarmName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  driverContact?: string;
  dispatchedBy?: string;
  transportCost?: number;
  lines: Dispatch1Line[];
  totalBucketsSent: number;
  totalBucketsDispatched?: number;
  totalStemsSent?: number;
  totalStemsDispatched?: number;
  totalBucketsReceived?: number;
  totalStemsReceived?: number;
  status: 'draft' | 'in_transit' | 'received' | 'partially_graded' | 'fully_graded' | 'discrepancy_flagged' | string;
  receivedAt?: string;
  receivedBy?: string;
  receiptRemarks?: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
  isVoid: boolean;
  voidReason?: string;
}

// 3. Processing & Grading at Receiving Farm (Stem-Length Segregation)
export interface GradingStemCategoryLine {
  id: string;
  stemLengthCategoryId: string;
  stemLengthCategoryName: string;
  stemsGraded: number;
  stemsCount?: number;
  stemsPacked: number; // tracked for packing stage
  stemsAvailable: number; // stemsGraded - stemsPacked
}

export interface ProcessingGrading {
  id: string;
  gradingRef: string; // e.g., "GRD-20261017-001"
  processingFarmId: string;
  processingFarmName: string;
  dispatch1Id: string;
  dispatch1Ref: string;
  dispatch1LineId: string;
  harvestBatchId: string;
  harvestBatchRef: string;
  polyhouseId: string;
  polyhouseName: string;
  varietyId: string;
  varietyName: string;
  varietyColor?: string;
  flowerColor?: string;
  date: string;
  gradedDate?: string;
  gradedBy?: string;
  status?: "graded" | "partially_packed" | "fully_packed" | string;
  incomingStemsReceived: number;
  totalIncomingStems?: number;
  lines: GradingStemCategoryLine[];
  totalGradedStems: number;
  rejectedDamagedStems: number;
  rejectedStems?: number;
  rejectionReason?: string;
  unexplainedDifference: number; // incomingStemsReceived - totalGradedStems - rejectedDamagedStems
  unexplainedVariance?: number;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
  isVoid: boolean;
  voidReason?: string;
}

// 4. Packing Management
export interface PackingBatch {
  id: string;
  packingRef: string; // e.g., "PCK-20261017-001"
  processingFarmId?: string;
  processingFarmName?: string;
  gradingId?: string;
  gradingRef?: string;
  stemCategoryId?: string;
  stemLengthCategoryId?: string;
  stemLengthCategoryName: string;
  dispatch1Ref?: string;
  harvestBatchId?: string;
  harvestBatchRef?: string;
  polyhouseId?: string;
  polyhouseName?: string;
  varietyId: string;
  varietyName: string;
  varietyColor?: string;
  flowerColor?: string;
  stemsPerBunch: number;
  bunchesCount: number;
  totalStemsPacked: number; // stemsPerBunch * bunchesCount
  cartonsCount?: number;
  bunchesDispatched: number; // tracked for Dispatch 2
  bunchesAvailable: number; // bunchesCount - bunchesDispatched
  availableBunches?: number; // alias
  damagedDuringPacking?: number;
  date?: string;
  packingDate?: string;
  packedBy?: string;
  status?: string;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
  isVoid: boolean;
  voidReason?: string;
}

// 5. Dispatch 2: Processing Farm to Auction Centre
export interface Dispatch2Line {
  id: string;
  packingBatchId: string;
  packingBatchRef: string;
  gradingRef?: string;
  harvestBatchRef: string;
  dispatch1Ref: string;
  polyhouseName: string;
  varietyId: string;
  varietyName: string;
  varietyColor?: string;
  flowerColor?: string;
  stemLengthCategoryId?: string;
  stemLengthCategoryName: string;
  stemsPerBunch: number;
  bunchesSent: number;
  bunchesDispatched?: number;
  totalStemsSent: number;
  totalStemsDispatched?: number;
  cartonsDispatched?: number;
  bunchesSold: number; // updated from realization
  bunchesUnsold: number; // updated from realization
  remarks?: string;
}

export interface Dispatch2 {
  id: string;
  dispatchRef: string; // e.g., "DSP2-20261017-001"
  dispatch2Ref?: string;
  date: string;
  dispatchDate?: string;
  time: string;
  dispatchTime?: string;
  sourceFarmId: string;
  sourceFarmName: string;
  destAuctionCentreId: string;
  destAuctionCentreName: string;
  auctionCentreId?: string;
  auctionCentreName?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  dispatchedBy?: string;
  cartonsCount?: number;
  totalCartonsDispatched?: number;
  transportCost?: number;
  realizationRecorded?: boolean;
  lines: Dispatch2Line[];
  totalBunchesSent: number;
  totalBunchesDispatched?: number;
  totalStemsSent: number;
  totalStemsDispatched?: number;
  status: 'draft' | 'dispatched' | 'received' | 'closed';
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
  isVoid: boolean;
  voidReason?: string;
}

// 6. Auction Sales and Actual Price Realization
export interface AuctionRealizationLine {
  id: string;
  dispatch2LineId: string;
  packingBatchRef: string;
  harvestBatchRef: string;
  polyhouseName: string;
  varietyId: string;
  varietyName: string;
  varietyColor?: string;
  flowerColor?: string;
  stemLengthCategoryId?: string;
  stemLengthCategoryName: string;
  stemsPerBunch: number;
  bunchesSent: number;
  bunchesSold: number;
  bunchesUnsold: number;
  pricePerUnit: number;
  priceUnit: 'bunch' | 'stem' | 'per_bunch' | 'per_stem';
  grossSaleValue: number; // calculated: bunch -> bunchesSold * pricePerUnit; stem -> bunchesSold * stemsPerBunch * pricePerUnit
  grossRealization?: number;
  commissionAmount: number;
  otherCharges: number;
  netRealization: number; // gross - commission - charges
  lotNumber?: string;
  remarks?: string;
}

export interface AuctionRealization {
  id: string;
  realizationRef: string; // e.g., "AUC-20261017-001"
  dispatch2Id: string;
  dispatch2Ref: string;
  auctionCentreId: string;
  auctionCentreName: string;
  auctionDate: string;
  date?: string;
  auctionLotRef?: string;
  settlementRef?: string;
  paymentStatus?: 'pending' | 'partially_settled' | 'settled' | string;
  recordedBy?: string;
  lines: AuctionRealizationLine[];
  totalBunchesSent: number;
  totalBunchesSold: number;
  totalBunchesUnsold: number;
  totalGrossValue: number;
  totalGrossRealization?: number;
  totalCommission: number;
  auctionCommission?: number;
  totalOtherCharges: number;
  otherCharges?: number;
  totalNetRealization: number;
  netRealization?: number;
  remarks?: string;
  createdAt: string;
  updatedAt?: string;
  isVoid: boolean;
  voidReason?: string;
}

// 7. Audit Trail / Operational Accountability
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  module: 'polyhouse' | 'variety' | 'farm' | 'harvest' | 'dispatch1' | 'receiving' | 'grading' | 'packing' | 'dispatch2' | 'auction' | 'settings';
  action: 'create' | 'update' | 'void' | 'override' | 'status_change' | 'confirm_receipt' | string;
  recordId: string;
  recordRef: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

