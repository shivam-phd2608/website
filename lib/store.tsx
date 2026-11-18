"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  isCloudMode,
  apiLogin,
  apiLogout,
  apiMe,
  apiChangePassword,
  apiSetPassword,
  hasSavedSession,
  onSessionExpired,
  loadAllRecords,
  pushChanges,
  subscribeToChanges,
  onSyncStatus,
  resetKnown,
  SyncStatus,
  RemoteChange,
} from "./cloud";
import {
  FarmSettings,
  Partner,
  Block,
  Polyhouse,
  RoseVariety,
  Grade,
  ExpenseCategory,
  Buyer,
  Vehicle,
  InventoryItem,
  Expense,
  Contribution,
  Commitment,
  Reimbursement,
  HarvestEntry,
  Dispatch,
  Sale,
  PaymentReceived,
  UserRole,
  UserProfile,
  PartnerLedgerSummary,
  ColdRoomStockItem,
  FarmEntity,
  AuctionCentre,
  StemLengthCategory,
  BunchSizeConfig,
  HarvestBatch,
  Dispatch1,
  ProcessingGrading,
  PackingBatch,
  Dispatch2,
  AuctionRealization,
  AuditLogEntry,
} from "./types";
import {
  INITIAL_SETTINGS,
  INITIAL_USERS,
  INITIAL_PARTNERS,
  INITIAL_BLOCKS,
  INITIAL_POLYHOUSES,
  INITIAL_VARIETIES,
  INITIAL_GRADES,
  INITIAL_CATEGORIES,
  INITIAL_BUYERS,
  INITIAL_VEHICLES,
  INITIAL_INVENTORY,
  INITIAL_COMMITMENTS,
  INITIAL_CONTRIBUTIONS,
  INITIAL_EXPENSES,
  INITIAL_REIMBURSEMENTS,
  INITIAL_HARVESTS,
  INITIAL_DISPATCHES,
  INITIAL_SALES,
  INITIAL_PAYMENTS,
  SAMPLE_PRACTICE_EXPENSES,
  SAMPLE_PRACTICE_HARVESTS,
  SAMPLE_PRACTICE_DISPATCHES,
  INITIAL_FARMS,
  INITIAL_AUCTION_CENTRES,
  INITIAL_STEM_LENGTH_CATEGORIES,
  INITIAL_BUNCH_SIZES,
  INITIAL_HARVEST_BATCHES,
  INITIAL_DISPATCH1_RECORDS,
  INITIAL_GRADINGS,
  INITIAL_PACKING_BATCHES,
  INITIAL_DISPATCH2_RECORDS,
  INITIAL_AUCTION_REALIZATIONS,
  INITIAL_AUDIT_LOGS,
} from "./mock-data";
import { todayISO, currentFYLabel } from "./formatters";

export type FilterPeriod = "today" | "this_week" | "this_month" | "all" | "custom";

interface FarmContextType {
  // Cloud / sync state
  isCloud: boolean;
  authReady: boolean;
  syncStatus: SyncStatus;
  syncMessage: string;
  passwordRecovery: boolean;
  changePassword: (current: string, next: string) => Promise<{ success: boolean; error?: string }>;
  resetUserPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  authError: string;
  downloadBackup: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  setNewPassword: (password: string) => Promise<{ success: boolean; error?: string }>;

  // Roles & Auth State
  currentUser: UserProfile | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentPartnerId: string;
  setCurrentPartnerId: (id: string) => void;

  // Filter Period & Financial Year
  selectedFY: string;
  setSelectedFY: (fy: string) => void;
  filterPeriod: FilterPeriod;
  setFilterPeriod: (period: FilterPeriod) => void;
  customDateRange: { start: string; end: string };
  setCustomDateRange: (range: { start: string; end: string }) => void;

  // Operational Filters for Traceability & Dashboard
  selectedPolyhouseFilter: string;
  setSelectedPolyhouseFilter: (id: string) => void;
  selectedVarietyFilter: string;
  setSelectedVarietyFilter: (id: string) => void;
  selectedFarmFilter: string;
  setSelectedFarmFilter: (id: string) => void;
  selectedAuctionFilter: string;
  setSelectedAuctionFilter: (id: string) => void;

  // User Management
  users: UserProfile[];
  addUser: (user: Omit<UserProfile, "id" | "createdAt">) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, user: Partial<UserProfile>) => void;
  deleteUser: (id: string) => void;

  // Master Data & Customizations (Partners, Varieties, Polyhouses, Farms, Auction Centres, Stem Lengths)
  settings: FarmSettings;
  updateSettings: (newSettings: Partial<FarmSettings>) => void;

  partners: Partner[];
  addPartner: (partner: Omit<Partner, "id">) => void;
  updatePartner: (id: string, partner: Partial<Partner>) => void;
  deletePartner: (id: string) => void;

  varieties: RoseVariety[];
  addVariety: (variety: Omit<RoseVariety, "id">) => void;
  updateVariety: (id: string, variety: Partial<RoseVariety>) => void;
  deleteVariety: (id: string) => void;

  polyhouses: Polyhouse[];
  addPolyhouse: (polyhouse: Omit<Polyhouse, "id">) => void;
  updatePolyhouse: (id: string, polyhouse: Partial<Polyhouse>) => void;
  deletePolyhouse: (id: string) => void;
  assignVarietyToPolyhouse: (polyhouseId: string, varietyId: string, plantCount?: number) => void;
  removeVarietyFromPolyhouse: (polyhouseId: string, varietyId: string) => void;

  farms: FarmEntity[];
  addFarm: (farm: Omit<FarmEntity, "id">) => void;
  updateFarm: (id: string, farm: Partial<FarmEntity>) => void;
  deleteFarm: (id: string) => void;

  auctionCentres: AuctionCentre[];
  addAuctionCentre: (auc: Omit<AuctionCentre, "id">) => void;
  updateAuctionCentre: (id: string, auc: Partial<AuctionCentre>) => void;
  deleteAuctionCentre: (id: string) => void;

  stemLengthCategories: StemLengthCategory[];
  addStemLengthCategory: (sl: Omit<StemLengthCategory, "id">) => void;
  updateStemLengthCategory: (id: string, sl: Partial<StemLengthCategory>) => void;
  deleteStemLengthCategory: (id: string) => void;

  bunchSizes: BunchSizeConfig[];
  addBunchSize: (bs: Omit<BunchSizeConfig, "id">) => void;
  updateBunchSize: (id: string, bs: Partial<BunchSizeConfig>) => void;
  deleteBunchSize: (id: string) => void;

  blocks: Block[];
  grades: Grade[];
  categories: ExpenseCategory[];
  buyers: Buyer[];
  addBuyer: (buyer: Omit<Buyer, "id">) => Buyer;
  updateBuyer: (id: string, buyer: Partial<Buyer>) => void;
  deleteBuyer: (id: string) => void;
  vehicles: Vehicle[];
  inventory: InventoryItem[];

  // Flower Traceability Workflows (7-Stage Journey)
  // Stage 1: Harvest Management
  harvestBatches: HarvestBatch[];
  addHarvestBatch: (batch: Omit<HarvestBatch, "id" | "createdAt" | "isVoid">) => HarvestBatch;
  updateHarvestBatch: (id: string, batch: Partial<HarvestBatch>) => void;
  voidHarvestBatch: (id: string, reason: string) => void;

  // Stage 2: Dispatch 1 (Farm to Processing Farm)
  dispatch1Records: Dispatch1[];
  addDispatch1: (dispatch: Omit<Dispatch1, "id" | "createdAt" | "isVoid">) => Dispatch1;
  updateDispatch1: (id: string, dispatch: Partial<Dispatch1>) => void;
  confirmDispatch1Receipt: (
    id: string,
    lineReceipts: { lineId: string; bucketsReceived: number; stemsReceived?: number; discrepancyReason?: string }[],
    receivedBy: string,
    receiptRemarks?: string
  ) => void;
  voidDispatch1: (id: string, reason: string) => void;

  // Stage 3 & 4: Grading & Stem-Length Segregation at Processing Farm
  gradings: ProcessingGrading[];
  addGrading: (grading: Omit<ProcessingGrading, "id" | "createdAt" | "isVoid">) => ProcessingGrading;
  updateGrading: (id: string, grading: Partial<ProcessingGrading>) => void;
  voidGrading: (id: string, reason: string) => void;

  // Stage 5: Packing Management
  packingBatches: PackingBatch[];
  addPackingBatch: (packing: Omit<PackingBatch, "id" | "createdAt" | "isVoid">) => PackingBatch;
  updatePackingBatch: (id: string, packing: Partial<PackingBatch>) => void;
  voidPackingBatch: (id: string, reason: string) => void;

  // Stage 6: Dispatch 2 (Processing Farm to Auction Centre)
  dispatch2Records: Dispatch2[];
  addDispatch2: (dispatch: Omit<Dispatch2, "id" | "createdAt" | "isVoid">) => Dispatch2;
  updateDispatch2Status: (id: string, status: Dispatch2["status"]) => void;
  voidDispatch2: (id: string, reason: string) => void;

  // Stage 7: Auction Sales and Price Realization
  auctionRealizations: AuctionRealization[];
  addAuctionRealization: (realization: Omit<AuctionRealization, "id" | "createdAt" | "isVoid">) => AuctionRealization;
  updateAuctionRealization: (id: string, realization: Partial<AuctionRealization>) => void;
  voidAuctionRealization: (id: string, reason: string) => void;

  // Audit Logs
  auditLogs: AuditLogEntry[];
  logAudit: (entry: {
    module: AuditLogEntry["module"];
    action: AuditLogEntry["action"];
    recordId: string;
    recordRef: string;
    details: string;
    previousValue?: string;
    newValue?: string;
  }) => void;

  // Traceability Helper: Full Batch Lineage
  getBatchTraceability: (searchRef: string) => {
    harvest?: HarvestBatch;
    dispatch1List: Dispatch1[];
    gradingsList: ProcessingGrading[];
    packingList: PackingBatch[];
    dispatch2List: Dispatch2[];
    realizationsList: AuctionRealization[];
  };

  // Legacy Transactions
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id" | "createdAt" | "isVoid">) => void;
  voidExpense: (id: string, reason: string) => void;

  contributions: Contribution[];
  addContribution: (contribution: Omit<Contribution, "id" | "createdAt" | "isVoid">) => void;

  commitments: Commitment[];
  addCommitment: (commitment: Omit<Commitment, "id" | "createdAt" | "isVoid">) => void;

  reimbursements: Reimbursement[];
  addReimbursement: (reimbursement: Omit<Reimbursement, "id" | "createdAt" | "isVoid">) => void;

  harvests: HarvestEntry[];
  addHarvest: (harvest: Omit<HarvestEntry, "id" | "createdAt" | "isVoid">) => void;

  dispatches: Dispatch[];
  addDispatch: (dispatch: Omit<Dispatch, "id" | "createdAt" | "isVoid">) => void;
  updateDispatchStatus: (id: string, status: Dispatch["status"], stemsReceived?: number, notes?: string) => void;

  sales: Sale[];
  addSale: (sale: Omit<Sale, "id" | "createdAt" | "isVoid">) => void;

  payments: PaymentReceived[];
  addPayment: (payment: Omit<PaymentReceived, "id" | "createdAt" | "isVoid">) => void;
  deletePayment: (id: string) => void;

  // Computed Properties & Ledgers
  partnerLedgers: PartnerLedgerSummary[];
  coldRoomStock: ColdRoomStockItem[];
  filteredExpenses: Expense[];
  filteredHarvests: HarvestEntry[];
  filteredDispatches: Dispatch[];
  filteredSales: Sale[];
  filteredPayments: PaymentReceived[];

  // Filtered End-to-End Flower Journey Datasets
  matchesPeriod: (dateStr?: string | null) => boolean;
  filteredHarvestBatches: HarvestBatch[];
  filteredDispatch1Records: Dispatch1[];
  filteredGradings: ProcessingGrading[];
  filteredPackingBatches: PackingBatch[];
  filteredDispatch2Records: Dispatch2[];
  filteredAuctionRealizations: AuctionRealization[];
  
  // Dashboard Aggregate KPIs (Financial & General)
  kpis: {
    stemsHarvested: number;
    coldRoomStems: number;
    coldRoomBunches: number;
    salesAmount: number;
    paymentsAmount: number;
    totalReceivables: number;
    expensesAmount: number;
    netProfit: number;
    capitalContributed: number;
    capitalCommitted: number;
    capitalProgressPercent: number;
  };

  // Traceability 15 Key Metrics (Section 10 of Requirements)
  traceabilityKPIs: {
    totalBucketsHarvested: number;
    totalEstimatedStems: number;
    harvestByPolyhouse: { id: string; name: string; buckets: number; stems: number; varieties: string[] }[];
    harvestByVariety: { id: string; name: string; color: string; hex: string; buckets: number; stems: number }[];
    qtyDispatched1Buckets: number;
    qtyDispatched1Stems: number;
    totalBucketsDispatched1: number;
    qtyReceivedAtFarmBuckets: number;
    qtyReceivedAtFarmStems: number;
    totalBucketsReceivedProcessing: number;
    transitDiscrepancyBuckets: number;
    stemLengthGradedInventory: { categoryId: string; categoryName: string; gradedStems: number; packedStems: number; availableStems: number }[];
    totalGradedStems: number;
    totalRejectedStems: number;
    totalBunchesPacked: number;
    totalStemsPacked: number;
    packedInventoryAwaitingDispatch: number;
    packedBunchesAwaitingDispatch: number;
    packedStemsAwaitingDispatch: number;
    qtyDispatchedToAuctionBunches: number;
    qtyDispatchedToAuctionStems: number;
    totalBunchesDispatchedAuction: number;
    qtySoldBunches: number;
    qtyUnsoldBunches: number;
    totalBunchesSold: number;
    totalBunchesUnsold: number;
    soldPercent: number;
    grossAuctionRealization: number;
    totalGrossRealization: number;
    netRealization: number;
    totalNetRealization: number;
    totalCommission: number;
    totalOtherCharges: number;
    avgRealizationByVariety: { varietyName: string; avgRatePerBunch: number; avgRatePerStem: number; gross: number; bunchesSold: number }[];
    reconciliationStages: { stage: string; quantity: string; detail: string; status: "ok" | "loss" }[];
    rejectedAndLossQuantities: { transitDamaged: number; gradingRejections: number; auctionUnsold: number; totalLossStems: number };
  };

  // Quick Action Modal states
  isQuickExpenseOpen: boolean;
  setIsQuickExpenseOpen: (open: boolean) => void;
  isQuickHarvestOpen: boolean;
  setIsQuickHarvestOpen: (open: boolean) => void;
  isQuickContributionOpen: boolean;
  setIsQuickContributionOpen: (open: boolean) => void;

  // Clean Slate & Demo Data Toggles
  clearAllTransactionsToZero: () => void;
  loadSamplePracticeData: () => void;
  resetAllToDefault: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

const STORAGE_KEY = "farm_platform_traceability_v5";
const LEGACY_STORAGE_KEY = "farm_traceability_backup";

export function FarmProvider({ children }: { children: React.ReactNode }) {
  // State initialization
  const [users, setUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>("admin");
  const [currentPartnerId, setCurrentPartnerId] = useState<string>("p-01");
  const [selectedFY, setSelectedFY] = useState<string>(currentFYLabel());
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>("this_month");
  const [customDateRange, setCustomDateRange] = useState(() => {
    const t = todayISO();
    return { start: t.slice(0, 8) + "01", end: t };
  });

  const [settings, setSettings] = useState<FarmSettings>(INITIAL_SETTINGS);
  const [partners, setPartners] = useState<Partner[]>(INITIAL_PARTNERS);
  const [blocks, setBlocks] = useState<Block[]>(INITIAL_BLOCKS);
  const [polyhouses, setPolyhouses] = useState<Polyhouse[]>(INITIAL_POLYHOUSES);
  const [varieties, setVarieties] = useState<RoseVariety[]>(INITIAL_VARIETIES);
  const [grades, setGrades] = useState<Grade[]>(INITIAL_GRADES);
  const [categories, setCategories] = useState<ExpenseCategory[]>(INITIAL_CATEGORIES);
  const [buyers, setBuyers] = useState<Buyer[]>(INITIAL_BUYERS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);

  // Operational Filters
  const [selectedPolyhouseFilter, setSelectedPolyhouseFilter] = useState("all");
  const [selectedVarietyFilter, setSelectedVarietyFilter] = useState("all");
  const [selectedFarmFilter, setSelectedFarmFilter] = useState("all");
  const [selectedAuctionFilter, setSelectedAuctionFilter] = useState("all");

  // Configurable Master Data
  const [farms, setFarms] = useState<FarmEntity[]>(INITIAL_FARMS);
  const [auctionCentres, setAuctionCentres] = useState<AuctionCentre[]>(INITIAL_AUCTION_CENTRES);
  const [stemLengthCategories, setStemLengthCategories] = useState<StemLengthCategory[]>(INITIAL_STEM_LENGTH_CATEGORIES);
  const [bunchSizes, setBunchSizes] = useState<BunchSizeConfig[]>(INITIAL_BUNCH_SIZES);

  // Flower Traceability Workflows (7-Stage Journey)
  const [harvestBatches, setHarvestBatches] = useState<HarvestBatch[]>(INITIAL_HARVEST_BATCHES);
  const [dispatch1Records, setDispatch1Records] = useState<Dispatch1[]>(INITIAL_DISPATCH1_RECORDS);
  const [gradings, setGradings] = useState<ProcessingGrading[]>(INITIAL_GRADINGS);
  const [packingBatches, setPackingBatches] = useState<PackingBatch[]>(INITIAL_PACKING_BATCHES);
  const [dispatch2Records, setDispatch2Records] = useState<Dispatch2[]>(INITIAL_DISPATCH2_RECORDS);
  const [auctionRealizations, setAuctionRealizations] = useState<AuctionRealization[]>(INITIAL_AUCTION_REALIZATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Clean zero baseline for all transactional data
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [contributions, setContributions] = useState<Contribution[]>(INITIAL_CONTRIBUTIONS);
  const [commitments, setCommitments] = useState<Commitment[]>(INITIAL_COMMITMENTS);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>(INITIAL_REIMBURSEMENTS);
  const [harvests, setHarvests] = useState<HarvestEntry[]>(INITIAL_HARVESTS);
  const [dispatches, setDispatches] = useState<Dispatch[]>(INITIAL_DISPATCHES);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [payments, setPayments] = useState<PaymentReceived[]>(INITIAL_PAYMENTS);

  // Quick modals
  const [isQuickExpenseOpen, setIsQuickExpenseOpen] = useState(false);
  const [isQuickHarvestOpen, setIsQuickHarvestOpen] = useState(false);
  const [isQuickContributionOpen, setIsQuickContributionOpen] = useState(false);

  // Apply a saved snapshot (from this browser or from the cloud) to the app state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyParsed = (parsed: any) => {

    if (parsed.expenses !== undefined) setExpenses(parsed.expenses);
    if (parsed.contributions !== undefined) setContributions(parsed.contributions);
    if (parsed.commitments !== undefined) setCommitments(parsed.commitments);
    if (parsed.reimbursements !== undefined) setReimbursements(parsed.reimbursements);
    if (parsed.harvests !== undefined) setHarvests(parsed.harvests);
    if (parsed.dispatches !== undefined) setDispatches(parsed.dispatches);
    if (parsed.sales !== undefined) setSales(parsed.sales);
    if (parsed.payments !== undefined) setPayments(parsed.payments);
    if (parsed.settings) setSettings({ ...INITIAL_SETTINGS, ...parsed.settings });
    if (parsed.partners) setPartners(parsed.partners);
    if (parsed.varieties) setVarieties(parsed.varieties);
    if (parsed.polyhouses) setPolyhouses(parsed.polyhouses);
    if (parsed.farms) setFarms(parsed.farms);
    if (parsed.auctionCentres) setAuctionCentres(parsed.auctionCentres);
    if (parsed.stemLengthCategories) setStemLengthCategories(parsed.stemLengthCategories);
    if (parsed.bunchSizes) setBunchSizes(parsed.bunchSizes);
    if (parsed.harvestBatches) {
      const sanitizedHV = (parsed.harvestBatches as HarvestBatch[]).map((h) => ({
        ...h,
        status: h.status || "harvested",
        harvestDate: h.harvestDate || (h as any).date || "",
      }));
      setHarvestBatches(sanitizedHV);
    }
    if (parsed.dispatch1Records) {
      const sanitizedD1 = (parsed.dispatch1Records as Dispatch1[]).map((d) => ({
        ...d,
        status: d.status || "in_transit",
        dispatchDate: d.dispatchDate || (d as any).date || "",
        sourceFarmName: d.sourceFarmName || "TriBloom Farm",
      }));
      setDispatch1Records(sanitizedD1);
    }
    if (parsed.gradings) {
      const sanitizedGradings = (parsed.gradings as ProcessingGrading[]).map((g) => ({
        ...g,
        status: g.status || "graded",
        gradedDate: g.gradedDate || g.date || new Date().toISOString().split("T")[0],
        unexplainedVariance: g.unexplainedVariance ?? g.unexplainedDifference ?? 0,
        unexplainedDifference: g.unexplainedDifference ?? g.unexplainedVariance ?? 0,
        totalIncomingStems: g.totalIncomingStems ?? g.incomingStemsReceived ?? 0,
        incomingStemsReceived: g.incomingStemsReceived ?? g.totalIncomingStems ?? 0,
        rejectedStems: g.rejectedStems ?? g.rejectedDamagedStems ?? 0,
        rejectedDamagedStems: g.rejectedDamagedStems ?? g.rejectedStems ?? 0,
        flowerColor: g.flowerColor || g.varietyColor || "",
        varietyColor: g.varietyColor || g.flowerColor || "",
        lines: (g.lines || []).map((l) => ({
          ...l,
          stemsCount: l.stemsCount ?? l.stemsGraded ?? 0,
          stemsGraded: l.stemsGraded ?? l.stemsCount ?? 0,
          stemsAvailable: l.stemsAvailable !== undefined ? l.stemsAvailable : (l.stemsGraded ?? l.stemsCount ?? 0),
        })),
      }));
      setGradings(sanitizedGradings);
    }
    if (parsed.packingBatches) setPackingBatches(parsed.packingBatches);
    if (parsed.dispatch2Records) setDispatch2Records(parsed.dispatch2Records);
    if (parsed.auctionRealizations) {
      const sanitizedAuction = (parsed.auctionRealizations as AuctionRealization[]).map((ar) => ({
        ...ar,
        paymentStatus: ar.paymentStatus || "settled",
        totalGrossRealization: ar.totalGrossRealization ?? ar.totalGrossValue ?? 0,
        totalGrossValue: ar.totalGrossValue ?? ar.totalGrossRealization ?? 0,
        auctionCommission: ar.auctionCommission ?? ar.totalCommission ?? 0,
        totalCommission: ar.totalCommission ?? ar.auctionCommission ?? 0,
        otherCharges: ar.otherCharges ?? ar.totalOtherCharges ?? 0,
        totalOtherCharges: ar.totalOtherCharges ?? ar.otherCharges ?? 0,
        netRealization: ar.netRealization ?? ar.totalNetRealization ?? 0,
        totalNetRealization: ar.totalNetRealization ?? ar.netRealization ?? 0,
        lines: (ar.lines || []).map((l) => ({
          ...l,
          grossRealization: l.grossRealization ?? l.grossSaleValue ?? 0,
          grossSaleValue: l.grossSaleValue ?? l.grossRealization ?? 0,
        })),
      }));
      setAuctionRealizations(sanitizedAuction);
    }
    if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
    if (parsed.users && parsed.users.length > 0) {
      setUsers(parsed.users as UserProfile[]);
    } else if (!isCloudMode) {
      setUsers(INITIAL_USERS);
    }
    if (parsed.buyers) setBuyers(parsed.buyers);
  };

  // ----------------------------------------------------------------------------------
  // Cloud mode (Supabase): sign-in session, load all records, live updates
  // ----------------------------------------------------------------------------------
  const [authReady, setAuthReady] = useState(!isCloudMode);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState("");
  const passwordRecovery = false;
  const loadedForUser = useRef<string | null>(null);
  const liveUnsub = useRef<(() => void) | null>(null);
  const startLive = () => {
    liveUnsub.current?.();
    liveUnsub.current = subscribeToChanges(applyRemoteChange);
  };

  useEffect(() => onSyncStatus((st, msg) => { setSyncStatus(st); setSyncMessage(msg || ""); }), []);

  // Setters used to apply changes that arrive from other devices
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const remoteSetters: Record<string, React.Dispatch<React.SetStateAction<any[]>>> = {
    users: setUsers, partners: setPartners, varieties: setVarieties, polyhouses: setPolyhouses,
    buyers: setBuyers, farms: setFarms, auctionCentres: setAuctionCentres,
    stemLengthCategories: setStemLengthCategories, bunchSizes: setBunchSizes,
    harvestBatches: setHarvestBatches, dispatch1Records: setDispatch1Records, gradings: setGradings,
    packingBatches: setPackingBatches, dispatch2Records: setDispatch2Records,
    auctionRealizations: setAuctionRealizations, auditLogs: setAuditLogs, expenses: setExpenses,
    contributions: setContributions, commitments: setCommitments, reimbursements: setReimbursements,
    harvests: setHarvests, dispatches: setDispatches, sales: setSales, payments: setPayments,
  };
  const remoteSettersRef = useRef(remoteSetters);
  remoteSettersRef.current = remoteSetters;

  const applyRemoteChange = useCallback((c: RemoteChange) => {
    if (c.collection === "settings") {
      if (c.data) setSettings({ ...INITIAL_SETTINGS, ...(c.data as Partial<FarmSettings>) });
      return;
    }
    const setter = remoteSettersRef.current[c.collection];
    if (!setter) return;
    setter((prev) => {
      const idx = prev.findIndex((x) => String(x.id) === c.id);
      if (c.data === null) return idx === -1 ? prev : prev.filter((_, i) => i !== idx);
      if (idx === -1) return c.collection === "auditLogs" ? [c.data, ...prev] : [...prev, c.data];
      const next = prev.slice();
      next[idx] = c.data;
      return next;
    });
  }, []);

  // Start every collection empty in cloud mode; the database is the only source of truth
  const clearForCloud = () => {
    setUsers([]); setPartners([]); setHarvestBatches([]); setDispatch1Records([]); setGradings([]);
    setPackingBatches([]); setDispatch2Records([]); setAuctionRealizations([]); setAuditLogs([]);
    setExpenses([]); setContributions([]); setCommitments([]); setReimbursements([]);
    setHarvests([]); setDispatches([]); setSales([]); setPayments([]);
  };

  // Load everything for a signed-in person and work out who they are in the farm
  const loadCloudForEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      clearForCloud();
      const parsed = await loadAllRecords();
      const cloudUsers = ((parsed.users as UserProfile[]) || []);
      const me = cloudUsers.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
      if (!me) {
        return { success: false, error: "Your login works, but you have not been added to the TriBloom team yet. Ask the admin to add your email under Settings → Team." };
      }
      if (!me.isActive) {
        return { success: false, error: "This account has been switched off. Please contact the admin." };
      }
      applyParsed(parsed);

      // First sign-in on an empty farm: set up the master data (polyhouses, varieties...)
      const seed: Record<string, unknown> = {};
      if (!parsed.settings) seed.settings = INITIAL_SETTINGS;
      if (!parsed.varieties) { seed.varieties = INITIAL_VARIETIES; }
      if (!parsed.polyhouses) { seed.polyhouses = INITIAL_POLYHOUSES; }
      if (!parsed.farms) { seed.farms = INITIAL_FARMS; }
      if (!parsed.auctionCentres) { seed.auctionCentres = INITIAL_AUCTION_CENTRES; }
      if (!parsed.stemLengthCategories) { seed.stemLengthCategories = INITIAL_STEM_LENGTH_CATEGORIES; }
      if (!parsed.bunchSizes) { seed.bunchSizes = INITIAL_BUNCH_SIZES; }
      if (!parsed.buyers) { seed.buyers = INITIAL_BUYERS; }
      if (Object.keys(seed).length && me.role === "admin") {
        applyParsed(seed);
        await pushChanges(seed);
      }

      setCurrentUser(me);
      setCurrentRole(me.role);
      if (me.partnerId) setCurrentPartnerId(me.partnerId);
      loadedForUser.current = email.toLowerCase();
      return { success: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message || e);
      return { success: false, error: "Could not load farm data: " + msg };
    }
  };

  const [cloudLoginError, setCloudLoginError] = useState("");

  useEffect(() => {
    if (!isCloudMode) return;
    let cancelled = false;

    // When the server says the session ended (switched off, password reset...), sign out here too
    onSessionExpired(() => {
      loadedForUser.current = null;
      liveUnsub.current?.();
      liveUnsub.current = null;
      resetKnown();
      setCurrentUser(null);
      setCloudLoginError("You have been signed out. Please sign in again.");
    });

    // Stay signed in across visits: the session token is kept in this browser
    if (!hasSavedSession()) {
      setAuthReady(true);
    } else {
      apiMe()
        .then(async (me) => {
          const email = String(me.email || "");
          if (cancelled || loadedForUser.current === email.toLowerCase()) return;
          const res = await loadCloudForEmail(email);
          if (cancelled) return;
          if (!res.success) {
            setCloudLoginError(res.error || "Sign-in failed.");
            await apiLogout();
          } else {
            setCloudLoginError("");
            startLive();
          }
        })
        .catch(() => {
          // expired or offline: show the sign-in screen
        })
        .finally(() => {
          if (!cancelled) setAuthReady(true);
        });
    }

    const goOffline = () => setSyncStatus("offline");
    const goOnline = () => setSyncStatus("idle");
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      cancelled = true;
      liveUnsub.current?.();
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Demo mode: load from this browser only
  useEffect(() => {
    if (isCloudMode) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("farm_platform_traceability_v4") || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) applyParsed(JSON.parse(saved));
    } catch {
      // ignore broken local data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to LocalStorage helper
  const saveState = (updatedData: Record<string, unknown>) => {
    if (isCloudMode) {
      void pushChanges(updatedData);
      return;
    }
    try {
      const current = {
        expenses,
        contributions,
        commitments,
        reimbursements,
        harvests,
        dispatches,
        sales,
        payments,
        settings,
        partners,
        varieties,
        polyhouses,
        users,
        buyers,
        farms,
        auctionCentres,
        stemLengthCategories,
        bunchSizes,
        harvestBatches,
        dispatch1Records,
        gradings,
        packingBatches,
        dispatch2Records,
        auctionRealizations,
        auditLogs,
        ...updatedData,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  };

  // Helper date checker for filter periods & Financial Year
  const matchesPeriod = useCallback((dateStr?: string | null) => {
    if (!dateStr) return false;
    const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.trim();
    const parts = cleanDate.split("-");
    if (parts.length < 3) return false;
    const itemYear = parseInt(parts[0], 10);
    const itemMonth = parseInt(parts[1], 10); // 1-indexed (1-12)
    const itemDay = parseInt(parts[2], 10);

    // Financial Year match (e.g. FY 2026-27 is 2026-04-01 to 2027-03-31)
    if (selectedFY && selectedFY !== "ALL" && selectedFY !== "all") {
      const match = selectedFY.match(/\d{4}/);
      if (match) {
        const startYear = parseInt(match[0], 10);
        const itemYMD = `${itemYear}-${String(itemMonth).padStart(2, "0")}-${String(itemDay).padStart(2, "0")}`;
        const fyStartYMD = `${startYear}-04-01`;
        const fyEndYMD = `${startYear + 1}-03-31`;
        if (itemYMD < fyStartYMD || itemYMD > fyEndYMD) {
          return false;
        }
      }
    }

    if (filterPeriod === "all") return true;

    // "Today" is the real current date on this device
    const now = new Date();
    const refYear = now.getFullYear();
    const refMonth = now.getMonth() + 1;
    const refDay = now.getDate();

    const todayStr = `${refYear}-${String(refMonth).padStart(2, "0")}-${String(refDay).padStart(2, "0")}`;

    if (filterPeriod === "today") {
      const itemStr = `${itemYear}-${String(itemMonth).padStart(2, "0")}-${String(itemDay).padStart(2, "0")}`;
      return itemStr === todayStr;
    }

    if (filterPeriod === "this_week") {
      const refDate = new Date(refYear, refMonth - 1, refDay, 12, 0, 0);
      const dayOfWeek = refDate.getDay();
      const diffToMonday = refDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(refDate);
      monday.setDate(diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      const itemDate = new Date(itemYear, itemMonth - 1, itemDay, 12, 0, 0);
      return itemDate >= monday && itemDate <= sunday;
    }

    if (filterPeriod === "this_month") {
      return itemYear === refYear && itemMonth === refMonth;
    }

    if (filterPeriod === "custom") {
      if (!customDateRange.start || !customDateRange.end) return true;
      const itemStr = `${itemYear}-${String(itemMonth).padStart(2, "0")}-${String(itemDay).padStart(2, "0")}`;
      const startStr = customDateRange.start.slice(0, 10);
      const endStr = customDateRange.end.slice(0, 10);
      return itemStr >= startStr && itemStr <= endStr;
    }

    return true;
  }, [filterPeriod, selectedFY, customDateRange]);

  // Filtered transactions
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => !e.isVoid && matchesPeriod(e.date));
  }, [expenses, matchesPeriod]);

  const filteredHarvests = useMemo(() => {
    return harvests.filter((h) => !h.isVoid && matchesPeriod(h.date));
  }, [harvests, matchesPeriod]);

  const filteredDispatches = useMemo(() => {
    return dispatches.filter((d) => !d.isVoid && matchesPeriod(d.date));
  }, [dispatches, matchesPeriod]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => !s.isVoid && matchesPeriod(s.date));
  }, [sales, matchesPeriod]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => !p.isVoid && matchesPeriod(p.date));
  }, [payments, matchesPeriod]);

  // Filtered End-to-End Flower Journey Datasets for Strict Timeline Compliance
  const filteredHarvestBatches = useMemo(() => {
    return harvestBatches.filter((h) => !h.isVoid && matchesPeriod(h.harvestDate || h.date));
  }, [harvestBatches, matchesPeriod]);

  const filteredDispatch1Records = useMemo(() => {
    return dispatch1Records.filter((d) => !d.isVoid && matchesPeriod(d.dispatchDate || d.date));
  }, [dispatch1Records, matchesPeriod]);

  const filteredGradings = useMemo(() => {
    return gradings.filter((g) => !g.isVoid && matchesPeriod(g.gradedDate || g.date));
  }, [gradings, matchesPeriod]);

  const filteredPackingBatches = useMemo(() => {
    return packingBatches.filter((p) => !p.isVoid && matchesPeriod(p.date));
  }, [packingBatches, matchesPeriod]);

  const filteredDispatch2Records = useMemo(() => {
    return dispatch2Records.filter((d) => !d.isVoid && matchesPeriod(d.dispatchDate || d.date));
  }, [dispatch2Records, matchesPeriod]);

  const filteredAuctionRealizations = useMemo(() => {
    return auctionRealizations.filter((a) => !a.isVoid && matchesPeriod(a.auctionDate || a.date));
  }, [auctionRealizations, matchesPeriod]);

  // Compute Partner Ledgers
  const partnerLedgers = useMemo<PartnerLedgerSummary[]>(() => {
    const totalCommittedAll = partners.reduce((sum, p) => sum + (p.committedAmount || 0), 0);

    return partners.map((partner) => {
      const committedAmount = partner.committedAmount || 0;
      const sharePercent = totalCommittedAll > 0 ? Math.round((committedAmount / totalCommittedAll) * 1000) / 10 : 0;

      const contributedAmount = contributions
        .filter((c) => !c.isVoid && c.partnerId === partner.id)
        .reduce((sum, c) => sum + c.amount, 0);

      const partnerExpenses = expenses.filter(
        (e) => !e.isVoid && e.paidByType === "partner" && e.paidByPartnerId === partner.id
      );

      const expCountedAsContribution = partnerExpenses
        .filter((e) => e.countsAsContribution)
        .reduce((sum, e) => sum + e.amount, 0);

      const reimbursableExpensesPaid = partnerExpenses
        .filter((e) => e.reimbursable)
        .reduce((sum, e) => sum + e.amount, 0);

      const reimbursementsReceived = reimbursements
        .filter((r) => !r.isVoid && r.partnerId === partner.id)
        .reduce((sum, r) => sum + r.amount, 0);

      const reimbursementDue = Math.max(0, reimbursableExpensesPaid - reimbursementsReceived);
      const outstandingCommitment = Math.max(0, committedAmount - contributedAmount);

      const netCapitalInFarm =
        contributedAmount + expCountedAsContribution + (reimbursableExpensesPaid - reimbursementsReceived);

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        familyGroup: partner.familyGroup,
        committedAmount,
        sharePercent,
        phone: partner.phone,
        email: partner.email,
        contributedAmount,
        outstandingCommitment,
        expCountedAsContribution,
        reimbursableExpensesPaid,
        reimbursementsReceived,
        reimbursementDue,
        netCapitalInFarm,
      };
    });
  }, [partners, contributions, expenses, reimbursements]);

  // Compute Cold Room Stock
  const coldRoomStock = useMemo<ColdRoomStockItem[]>(() => {
    const stockMap: Record<string, ColdRoomStockItem> = {};

    varieties.forEach((v) => {
      grades.forEach((g) => {
        const key = `${v.id}_${g.id}`;
        stockMap[key] = {
          varietyId: v.id,
          varietyName: v.name,
          varietyHex: v.hexCode,
          gradeId: g.id,
          gradeName: g.name,
          currentStems: 0,
          bunchesCount: 0,
        };
      });
    });

    harvests
      .filter((h) => !h.isVoid)
      .forEach((h) => {
        h.lines.forEach((line) => {
          const key = `${line.varietyId}_${line.gradeId}`;
          if (stockMap[key]) {
            stockMap[key].currentStems += line.stemsGood;
          }
        });
      });

    dispatches
      .filter((d) => !d.isVoid)
      .forEach((d) => {
        d.lines.forEach((line) => {
          const key = `${line.varietyId}_${line.gradeId}`;
          if (stockMap[key]) {
            stockMap[key].currentStems -= line.stems;
          }
        });
      });

    Object.values(stockMap).forEach((item) => {
      item.bunchesCount = Math.max(0, Math.round((item.currentStems / settings.stemsPerBunch) * 10) / 10);
    });

    return Object.values(stockMap).filter((item) => item.currentStems > 0);
  }, [varieties, grades, harvests, dispatches, settings.stemsPerBunch]);

  // Compute KPIs
  const kpis = useMemo(() => {
    const stemsHarvested = filteredHarvests.reduce((sum, h) => sum + h.totalGoodStems, 0);
    
    const totalColdStems = coldRoomStock.reduce((sum, item) => sum + Math.max(0, item.currentStems), 0);
    const totalColdBunches = Math.round((totalColdStems / settings.stemsPerBunch) * 10) / 10;

    const salesAmount = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const paymentsAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

    const totalInvoicedAllTime = sales.filter((s) => !s.isVoid).reduce((sum, s) => sum + s.total, 0);
    const totalPaidAllTime = payments.filter((p) => !p.isVoid).reduce((sum, p) => sum + p.amount, 0);
    const totalOpeningBalances = buyers.reduce((sum, b) => sum + b.openingBalance, 0);
    const totalReceivables = totalOpeningBalances + totalInvoicedAllTime - totalPaidAllTime;

    const expensesAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = salesAmount - expensesAmount;

    const capitalContributed = contributions
      .filter((c) => !c.isVoid)
      .reduce((sum, c) => sum + c.amount, 0);

    const capitalCommitted = partners.reduce((sum, p) => sum + (p.committedAmount || 0), 0);

    const capitalProgressPercent =
      capitalCommitted > 0 ? Math.min(100, Math.round((capitalContributed / capitalCommitted) * 100)) : 0;

    return {
      stemsHarvested,
      coldRoomStems: totalColdStems,
      coldRoomBunches: totalColdBunches,
      salesAmount,
      paymentsAmount,
      totalReceivables,
      expensesAmount,
      netProfit,
      capitalContributed,
      capitalCommitted,
      capitalProgressPercent,
    };
  }, [filteredHarvests, coldRoomStock, filteredSales, filteredPayments, sales, payments, buyers, filteredExpenses, contributions, commitments, settings.stemsPerBunch]);

  // 15 Dashboard Key Metrics for Complete Flower Journey (Section 10 of Requirements)
  const traceabilityKPIs = useMemo(() => {
    // 1. Total buckets harvested
    const activeHarvests = filteredHarvestBatches.filter((h) => {
      if (h.isVoid) return false;
      if (selectedPolyhouseFilter !== "all" && h.polyhouseId !== selectedPolyhouseFilter) return false;
      if (selectedVarietyFilter !== "all" && !h.lines.some((l) => l.varietyId === selectedVarietyFilter)) return false;
      return true;
    });

    const totalBucketsHarvested = activeHarvests.reduce((sum, h) => sum + h.totalBuckets, 0);

    // 2. Harvest quantity by polyhouse
    const harvestByPolyhouse = polyhouses.map((ph) => {
      const phHarvests = activeHarvests.filter((h) => h.polyhouseId === ph.id);
      const buckets = phHarvests.reduce((sum, h) => sum + h.totalBuckets, 0);
      const stems = phHarvests.reduce((sum, h) => sum + (h.totalEstimatedStems || 0), 0);
      const varietyNames = ph.varieties?.map((v) => v.varietyName) || [ph.varietyName || "Roses"];
      return {
        id: ph.id,
        name: ph.name,
        buckets,
        stems,
        varieties: varietyNames,
      };
    });

    // 3. Harvest quantity by variety
    const harvestByVariety = varieties.map((v) => {
      let buckets = 0;
      let stems = 0;
      activeHarvests.forEach((h) => {
        h.lines.forEach((l) => {
          if (l.varietyId === v.id) {
            buckets += l.bucketsHarvested;
            stems += l.estimatedStems || l.bucketsHarvested * 50;
          }
        });
      });
      return {
        id: v.id,
        name: v.name,
        color: v.color,
        hex: v.hexCode,
        buckets,
        stems,
      };
    });

    // 4. Quantity dispatched under Dispatch 1
    const activeDsp1 = filteredDispatch1Records.filter((d) => {
      if (d.isVoid) return false;
      if (selectedFarmFilter !== "all" && d.sourceFarmId !== selectedFarmFilter && d.destFarmId !== selectedFarmFilter) return false;
      return true;
    });
    const qtyDispatched1Buckets = activeDsp1.reduce((sum, d) => sum + d.totalBucketsSent, 0);
    const qtyDispatched1Stems = activeDsp1.reduce((sum, d) => sum + (d.totalStemsSent || d.totalBucketsSent * 50), 0);

    // 5. Quantity received at processing farms
    const qtyReceivedAtFarmBuckets = activeDsp1.reduce((sum, d) => sum + (d.totalBucketsReceived || 0), 0);
    const qtyReceivedAtFarmStems = activeDsp1.reduce((sum, d) => sum + (d.totalStemsReceived || (d.totalBucketsReceived || 0) * 50), 0);
    const transitDiscrepancyBuckets = Math.max(0, qtyDispatched1Buckets - qtyReceivedAtFarmBuckets);

    // 6. Stem-length-wise graded inventory
    const activeGrd = filteredGradings.filter((g) => {
      if (g.isVoid) return false;
      if (selectedVarietyFilter !== "all" && g.varietyId !== selectedVarietyFilter) return false;
      if (selectedPolyhouseFilter !== "all" && g.polyhouseId !== selectedPolyhouseFilter) return false;
      return true;
    });

    const stemLengthGradedInventory = stemLengthCategories.map((cat) => {
      let gradedStems = 0;
      let packedStems = 0;
      activeGrd.forEach((g) => {
        g.lines.forEach((l) => {
          if (l.stemLengthCategoryId === cat.id) {
            gradedStems += l.stemsGraded;
            packedStems += l.stemsPacked;
          }
        });
      });
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        gradedStems,
        packedStems,
        availableStems: Math.max(0, gradedStems - packedStems),
      };
    });

    // 7. Total bunches packed
    const activePck = filteredPackingBatches.filter((p) => {
      if (p.isVoid) return false;
      if (selectedVarietyFilter !== "all" && p.varietyId !== selectedVarietyFilter) return false;
      if (selectedPolyhouseFilter !== "all" && p.polyhouseId !== selectedPolyhouseFilter) return false;
      return true;
    });
    const totalBunchesPacked = activePck.reduce((sum, p) => sum + p.bunchesCount, 0);
    const totalStemsPacked = activePck.reduce((sum, p) => sum + p.totalStemsPacked, 0);

    // 8. Packed inventory awaiting dispatch
    const packedInventoryAwaitingDispatch = activePck.reduce((sum, p) => sum + p.bunchesAvailable, 0);
    const packedStemsAwaitingDispatch = activePck.reduce((sum, p) => sum + (p.bunchesAvailable * p.stemsPerBunch), 0);

    // 9. Quantity dispatched to auction
    const activeDsp2 = filteredDispatch2Records.filter((d) => {
      if (d.isVoid) return false;
      if (selectedAuctionFilter !== "all" && d.destAuctionCentreId !== selectedAuctionFilter) return false;
      return true;
    });
    const qtyDispatchedToAuctionBunches = activeDsp2.reduce((sum, d) => sum + d.totalBunchesSent, 0);
    const qtyDispatchedToAuctionStems = activeDsp2.reduce((sum, d) => sum + d.totalStemsSent, 0);

    // 10. Quantity sold and unsold
    const activeRlz = filteredAuctionRealizations.filter((a) => {
      if (a.isVoid) return false;
      if (selectedAuctionFilter !== "all" && a.auctionCentreId !== selectedAuctionFilter) return false;
      return true;
    });
    const qtySoldBunches = activeRlz.reduce((sum, a) => sum + a.totalBunchesSold, 0);
    const qtyUnsoldBunches = activeRlz.reduce((sum, a) => sum + a.totalBunchesUnsold, 0);
    const totalSentForRealization = qtySoldBunches + qtyUnsoldBunches;
    const soldPercent = totalSentForRealization > 0 ? Math.round((qtySoldBunches / totalSentForRealization) * 100) : 0;

    // 11. Gross auction realization
    const grossAuctionRealization = activeRlz.reduce((sum, a) => sum + a.totalGrossValue, 0);

    // 12. Net realization after recorded charges
    const netRealization = activeRlz.reduce((sum, a) => sum + a.totalNetRealization, 0);
    const totalCommission = activeRlz.reduce((sum, a) => sum + a.totalCommission, 0);
    const totalOtherCharges = activeRlz.reduce((sum, a) => sum + a.totalOtherCharges, 0);

    // 13. Average realization by variety, colour, stem length, and bunch size
    const varietyRealizationMap: Record<string, { varietyName: string; gross: number; bunchesSold: number; stemsSold: number }> = {};
    activeRlz.forEach((a) => {
      a.lines.forEach((l) => {
        if (!varietyRealizationMap[l.varietyName]) {
          varietyRealizationMap[l.varietyName] = { varietyName: l.varietyName, gross: 0, bunchesSold: 0, stemsSold: 0 };
        }
        varietyRealizationMap[l.varietyName].gross += l.grossSaleValue;
        varietyRealizationMap[l.varietyName].bunchesSold += l.bunchesSold;
        varietyRealizationMap[l.varietyName].stemsSold += (l.bunchesSold * l.stemsPerBunch);
      });
    });

    const avgRealizationByVariety = Object.values(varietyRealizationMap).map((item) => ({
      varietyName: item.varietyName,
      gross: item.gross,
      bunchesSold: item.bunchesSold,
      avgRatePerBunch: item.bunchesSold > 0 ? Math.round(item.gross / item.bunchesSold) : 0,
      avgRatePerStem: item.stemsSold > 0 ? Math.round((item.gross / item.stemsSold) * 10) / 10 : 0,
    }));

    // 14. Harvest-to-sale quantity reconciliation flow
    const reconciliationStages: { stage: string; quantity: string; detail: string; status: "ok" | "loss" }[] = [
      {
        stage: "1. Harvested",
        quantity: `${totalBucketsHarvested} buckets`,
        detail: `~${activeHarvests.reduce((s, h) => s + (h.totalEstimatedStems || 0), 0).toLocaleString()} estimated stems`,
        status: "ok",
      },
      {
        stage: "2. Dispatch 1 Sent",
        quantity: `${qtyDispatched1Buckets} buckets`,
        detail: `~${qtyDispatched1Stems.toLocaleString()} stems to processing hub`,
        status: "ok",
      },
      {
        stage: "3. Received at Processing Farm",
        quantity: `${qtyReceivedAtFarmBuckets} buckets`,
        detail: `${transitDiscrepancyBuckets > 0 ? `${transitDiscrepancyBuckets} buckets transit loss` : "100% verified arrival"}`,
        status: transitDiscrepancyBuckets > 0 ? "loss" : "ok",
      },
      {
        stage: "4. Stem Graded",
        quantity: `${activeGrd.reduce((s, g) => s + g.totalGradedStems, 0).toLocaleString()} stems`,
        detail: `${activeGrd.reduce((s, g) => s + g.rejectedDamagedStems, 0)} rejects segregated`,
        status: "ok",
      },
      {
        stage: "5. Bunches Packed",
        quantity: `${totalBunchesPacked} bunches`,
        detail: `${totalStemsPacked.toLocaleString()} stems prepared`,
        status: "ok",
      },
      {
        stage: "6. Dispatch 2 to Auction",
        quantity: `${qtyDispatchedToAuctionBunches} bunches`,
        detail: `${qtyDispatchedToAuctionStems.toLocaleString()} stems sent`,
        status: "ok",
      },
      {
        stage: "7. Auction Sold",
        quantity: `${qtySoldBunches} bunches sold`,
        detail: `${qtyUnsoldBunches > 0 ? `${qtyUnsoldBunches} unsold/returned` : "100% clearance"}`,
        status: qtyUnsoldBunches > 0 ? "loss" : "ok",
      },
    ];

    // 15. Rejected, damaged, or unaccounted-for quantities
    const gradingRejections = activeGrd.reduce((sum, g) => sum + g.rejectedDamagedStems, 0);
    const transitDamaged = transitDiscrepancyBuckets * 50;
    const auctionUnsold = qtyUnsoldBunches * 20;
    const totalLossStems = gradingRejections + transitDamaged + auctionUnsold;

    const totalGradedStems = activeGrd.reduce((s, g) => s + g.totalGradedStems, 0);
    const totalEstimatedStems = activeHarvests.reduce((s, h) => s + (h.totalEstimatedStems || 0), 0);

    return {
      totalBucketsHarvested,
      totalEstimatedStems,
      harvestByPolyhouse,
      harvestByVariety,
      qtyDispatched1Buckets,
      qtyDispatched1Stems,
      totalBucketsDispatched1: qtyDispatched1Buckets,
      qtyReceivedAtFarmBuckets,
      qtyReceivedAtFarmStems,
      totalBucketsReceivedProcessing: qtyReceivedAtFarmBuckets,
      transitDiscrepancyBuckets,
      stemLengthGradedInventory,
      totalGradedStems,
      totalRejectedStems: gradingRejections,
      totalBunchesPacked,
      totalStemsPacked,
      packedInventoryAwaitingDispatch,
      packedBunchesAwaitingDispatch: packedInventoryAwaitingDispatch,
      packedStemsAwaitingDispatch,
      qtyDispatchedToAuctionBunches,
      qtyDispatchedToAuctionStems,
      totalBunchesDispatchedAuction: qtyDispatchedToAuctionBunches,
      qtySoldBunches,
      qtyUnsoldBunches,
      totalBunchesSold: qtySoldBunches,
      totalBunchesUnsold: qtyUnsoldBunches,
      soldPercent,
      grossAuctionRealization,
      totalGrossRealization: grossAuctionRealization,
      netRealization,
      totalNetRealization: netRealization,
      totalCommission,
      totalOtherCharges,
      avgRealizationByVariety,
      reconciliationStages,
      rejectedAndLossQuantities: {
        transitDamaged,
        gradingRejections,
        auctionUnsold,
        totalLossStems,
      },
    };
  }, [
    filteredHarvestBatches,
    filteredDispatch1Records,
    filteredGradings,
    filteredPackingBatches,
    filteredDispatch2Records,
    filteredAuctionRealizations,
    polyhouses,
    varieties,
    stemLengthCategories,
    selectedPolyhouseFilter,
    selectedVarietyFilter,
    selectedFarmFilter,
    selectedAuctionFilter,
  ]);

  // Batch Traceability Full Lineage Graph Helper
  const getBatchTraceability = (searchRef: string) => {
    const clean = (searchRef || "").trim().toLowerCase();
    if (!clean) {
      return {
        harvest: harvestBatches[0],
        dispatch1List: dispatch1Records,
        gradingsList: gradings,
        packingList: packingBatches,
        dispatch2List: dispatch2Records,
        realizationsList: auctionRealizations,
      };
    }

    const harvest = harvestBatches.find(
      (h) => h.batchRef.toLowerCase().includes(clean) || h.id.toLowerCase() === clean
    );
    const harvestRef = harvest?.batchRef.toLowerCase() || clean;

    const dispatch1List = dispatch1Records.filter(
      (d) =>
        d.dispatchRef.toLowerCase().includes(clean) ||
        d.lines.some(
          (l) => l.harvestBatchRef.toLowerCase().includes(harvestRef) || l.harvestBatchRef.toLowerCase().includes(clean)
        )
    );

    const gradingsList = gradings.filter(
      (g) =>
        g.gradingRef.toLowerCase().includes(clean) ||
        g.harvestBatchRef.toLowerCase().includes(harvestRef) ||
        g.dispatch1Ref.toLowerCase().includes(clean)
    );

    const packingList = packingBatches.filter(
      (p) =>
        p.packingRef.toLowerCase().includes(clean) ||
        (p.harvestBatchRef || "").toLowerCase().includes(harvestRef) ||
        (p.dispatch1Ref || "").toLowerCase().includes(clean) ||
        (p.gradingRef || "").toLowerCase().includes(clean)
    );

    const dispatch2List = dispatch2Records.filter(
      (d) =>
        d.dispatchRef.toLowerCase().includes(clean) ||
        d.lines.some(
          (l) =>
            l.harvestBatchRef.toLowerCase().includes(harvestRef) ||
            packingList.some((p) => p.packingRef === l.packingBatchRef)
        )
    );

    const realizationsList = auctionRealizations.filter(
      (a) =>
        a.realizationRef.toLowerCase().includes(clean) ||
        dispatch2List.some((d) => d.dispatchRef === a.dispatch2Ref) ||
        a.lines.some((l) => l.harvestBatchRef.toLowerCase().includes(harvestRef))
    );

    return {
      harvest: harvest || harvestBatches[0],
      dispatch1List,
      gradingsList,
      packingList,
      dispatch2List,
      realizationsList,
    };
  };

  // User Management
  const addUser = async (newUser: Omit<UserProfile, "id" | "createdAt">): Promise<{ success: boolean; error?: string }> => {
    const email = newUser.email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === email)) {
      return { success: false, error: "A team member with this email already exists." };
    }
    if (isCloudMode) {
      if (!newUser.password || newUser.password.length < 8) {
        return { success: false, error: "Set a first password of at least 8 characters." };
      }
      // Create their login (the password is stored only as a secure hash in the Google Sheet)
      try {
        await apiSetPassword(email, newUser.password);
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : "Could not create the login." };
      }
    }
    const item: UserProfile = {
      ...newUser,
      email,
      password: isCloudMode ? undefined : newUser.password,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...users, item];
    setUsers(updated);
    saveState({ users: updated });
    return { success: true };
  };

  const updateUser = (id: string, partial: Partial<UserProfile>) => {
    // Immutable rule: Email and password once set cannot be changed
    const updated = users.map((u) => {
      if (u.id === id) {
        // Strip out email and password from partial updates to enforce immutability
        const { email: _e, password: _p, ...allowedUpdates } = partial;
        return { ...u, ...allowedUpdates };
      }
      return u;
    });
    setUsers(updated);
    saveState({ users: updated });
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;

    // Safety rule 1: Cannot delete the only remaining admin in the system
    const adminCount = users.filter((u) => u.role === "admin").length;
    if (target.role === "admin" && adminCount <= 1) {
      alert("Action Denied: You cannot delete the primary/only remaining Administrator account.");
      return;
    }

    let updated = users.filter((u) => u.id !== id);
    if (updated.length === 0) {
      updated = [INITIAL_USERS[0]];
    }

    setUsers(updated);

    // If the currently active user is deleted, log out cleanly
    if (currentUser?.id === id) {
      setCurrentUser(null);
      saveState({ users: updated, currentUserId: null });
    } else {
      saveState({ users: updated });
    }
  };

  // Sign-in: TriBloom Google backend in cloud mode, local demo accounts otherwise
  const login = async (email: string, password: string) => {
    const cleanInput = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (isCloudMode) {
      let me: Record<string, unknown>;
      try {
        me = await apiLogin(cleanInput, cleanPassword);
      } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : "Sign-in failed." };
      }
      const res = await loadCloudForEmail(String(me.email || cleanInput));
      if (!res.success) {
        await apiLogout();
        return res;
      }
      setCloudLoginError("");
      startLive();
      return { success: true };
    }

    const localUser = users.find(
      (u) =>
        (u.email.toLowerCase() === cleanInput || u.email.toLowerCase().split("@")[0] === cleanInput) &&
        (u.password === cleanPassword || (!u.password && cleanPassword === "Password@123"))
    );

    if (localUser) {
      if (!localUser.isActive) {
        return { success: false, error: "This user account is currently inactive. Please contact administrator." };
      }
      setCurrentUser(localUser);
      setCurrentRole(localUser.role);
      if (localUser.partnerId) {
        setCurrentPartnerId(localUser.partnerId);
      }
      return { success: true };
    }

    return { success: false, error: "Invalid username/email or password." };
  };

  const logout = () => {
    if (isCloudMode) {
      loadedForUser.current = null;
      liveUnsub.current?.();
      liveUnsub.current = null;
      void apiLogout();
    }
    setCurrentUser(null);
    setCurrentRole("viewer");
    setCurrentPartnerId("");
  };

  // No email service: an admin resets forgotten passwords from Settings & team
  const requestPasswordReset = async () => ({
    success: false,
    error: "Ask your TriBloom admin to set a new password for you (Settings & team → Team → Edit).",
  });

  const setNewPassword = async () => ({ success: false, error: "Use Change password in the menu at the top right." });

  const changePassword = async (current: string, next: string) => {
    if (!isCloudMode) return { success: false, error: "Not available in demo mode." };
    try {
      await apiChangePassword(current, next);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Could not change the password." };
    }
  };

  const resetUserPassword = async (email: string, password: string) => {
    if (!isCloudMode) return { success: false, error: "Not available in demo mode." };
    try {
      await apiSetPassword(email, password);
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Could not reset the password." };
    }
  };

  // Partner Customization
  const addPartner = (newPartner: Omit<Partner, "id">) => {
    const item: Partner = { ...newPartner, id: `p-${Date.now()}` };
    const updated = [...partners, item];
    setPartners(updated);
    saveState({ partners: updated });
  };

  const updatePartner = (id: string, partial: Partial<Partner>) => {
    const updated = partners.map((p) => (p.id === id ? { ...p, ...partial } : p));
    setPartners(updated);
    saveState({ partners: updated });
  };

  const deletePartner = (id: string) => {
    const updated = partners.filter((p) => p.id !== id);
    setPartners(updated);
    saveState({ partners: updated });
  };

  // Variety Customization
  const addVariety = (newVariety: Omit<RoseVariety, "id">) => {
    const item: RoseVariety = { ...newVariety, id: `var-${Date.now()}` };
    const updated = [...varieties, item];
    setVarieties(updated);
    saveState({ varieties: updated });
  };

  const updateVariety = (id: string, partial: Partial<RoseVariety>) => {
    const updated = varieties.map((v) => (v.id === id ? { ...v, ...partial } : v));
    setVarieties(updated);
    saveState({ varieties: updated });
  };

  const deleteVariety = (id: string) => {
    const updated = varieties.filter((v) => v.id !== id);
    setVarieties(updated);
    saveState({ varieties: updated });
  };


  // Audit Logging
  const logAudit = (entry: {
    module: AuditLogEntry["module"];
    action: AuditLogEntry["action"];
    recordId: string;
    recordRef: string;
    details: string;
    previousValue?: string;
    newValue?: string;
  }) => {
    const logItem: AuditLogEntry = {
      ...entry,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || "usr-01",
      userName: currentUser?.fullName || "Shiva Kumar (Lead Admin)",
      userRole: currentRole || "admin",
    };
    const updated = [logItem, ...auditLogs];
    setAuditLogs(updated);
    saveState({ auditLogs: updated });
  };

  // Polyhouse Customization & Multi-Variety Management
  const addPolyhouse = (newPoly: Omit<Polyhouse, "id">) => {
    const item: Polyhouse = {
      ...newPoly,
      id: `ph-${Date.now()}`,
      varieties: newPoly.varieties || (newPoly.varietyId ? [{
        varietyId: newPoly.varietyId,
        varietyName: newPoly.varietyName || "Roses",
      }] : []),
    };
    const updated = [...polyhouses, item];
    setPolyhouses(updated);
    saveState({ polyhouses: updated });
    logAudit({
      module: "polyhouse",
      action: "create",
      recordId: item.id,
      recordRef: item.name,
      details: `Created new polyhouse ${item.name} with area ${item.areaSqm} sqm`,
    });
  };

  const updatePolyhouse = (id: string, partial: Partial<Polyhouse>) => {
    const prev = polyhouses.find((p) => p.id === id);
    const updated = polyhouses.map((ph) => {
      if (ph.id === id) {
        return {
          ...ph,
          ...partial,
          varieties: partial.varieties !== undefined ? partial.varieties : ph.varieties,
        };
      }
      return ph;
    });
    setPolyhouses(updated);
    saveState({ polyhouses: updated });
    logAudit({
      module: "polyhouse",
      action: "update",
      recordId: id,
      recordRef: partial.name || prev?.name || id,
      details: `Updated polyhouse configuration`,
      previousValue: prev?.name,
      newValue: partial.name || prev?.name,
    });
  };

  const deletePolyhouse = (id: string) => {
    const prev = polyhouses.find((p) => p.id === id);
    const updated = polyhouses.filter((ph) => ph.id !== id);
    setPolyhouses(updated);
    saveState({ polyhouses: updated });
    logAudit({
      module: "polyhouse",
      action: "void",
      recordId: id,
      recordRef: prev?.name || id,
      details: `Deleted polyhouse ${prev?.name}`,
    });
  };

  const assignVarietyToPolyhouse = (polyhouseId: string, varietyId: string, plantCount?: number) => {
    const targetVar = varieties.find((v) => v.id === varietyId);
    if (!targetVar) return;

    const updated = polyhouses.map((ph) => {
      if (ph.id === polyhouseId) {
        const existing = ph.varieties || [];
        if (existing.some((v) => v.varietyId === varietyId)) return ph;
        const newMapping = {
          varietyId,
          varietyName: targetVar.name,
          color: targetVar.color,
          plantCount: plantCount || 6000,
        };
        const updatedVars = [...existing, newMapping];
        return {
          ...ph,
          varieties: updatedVars,
          varietyName: updatedVars.map((v) => v.varietyName).join(", "),
        };
      }
      return ph;
    });
    setPolyhouses(updated);
    saveState({ polyhouses: updated });
    logAudit({
      module: "polyhouse",
      action: "update",
      recordId: polyhouseId,
      recordRef: polyhouses.find((p) => p.id === polyhouseId)?.name || polyhouseId,
      details: `Assigned variety ${targetVar.name} (${targetVar.color}) to polyhouse`,
    });
  };

  const removeVarietyFromPolyhouse = (polyhouseId: string, varietyId: string) => {
    const targetVar = varieties.find((v) => v.id === varietyId);
    const updated = polyhouses.map((ph) => {
      if (ph.id === polyhouseId) {
        const existing = ph.varieties || [];
        const updatedVars = existing.filter((v) => v.varietyId !== varietyId);
        return {
          ...ph,
          varieties: updatedVars,
          varietyName: updatedVars.map((v) => v.varietyName).join(", "),
        };
      }
      return ph;
    });
    setPolyhouses(updated);
    saveState({ polyhouses: updated });
    logAudit({
      module: "polyhouse",
      action: "update",
      recordId: polyhouseId,
      recordRef: polyhouses.find((p) => p.id === polyhouseId)?.name || polyhouseId,
      details: `Removed variety ${targetVar?.name || varietyId} from polyhouse`,
    });
  };

  // Master Data: Farms
  const addFarm = (newFarm: Omit<FarmEntity, "id">) => {
    const item: FarmEntity = { ...newFarm, id: `farm-${Date.now()}` };
    const updated = [...farms, item];
    setFarms(updated);
    saveState({ farms: updated });
    logAudit({ module: "farm", action: "create", recordId: item.id, recordRef: item.name, details: `Added farm entity ${item.name}` });
  };
  const updateFarm = (id: string, partial: Partial<FarmEntity>) => {
    const updated = farms.map((f) => (f.id === id ? { ...f, ...partial } : f));
    setFarms(updated);
    saveState({ farms: updated });
    logAudit({ module: "farm", action: "update", recordId: id, recordRef: partial.name || id, details: `Updated farm details` });
  };
  const deleteFarm = (id: string) => {
    const updated = farms.filter((f) => f.id !== id);
    setFarms(updated);
    saveState({ farms: updated });
  };

  // Master Data: Auction Centres
  const addAuctionCentre = (newAuc: Omit<AuctionCentre, "id">) => {
    const item: AuctionCentre = { ...newAuc, id: `auc-${Date.now()}` };
    const updated = [...auctionCentres, item];
    setAuctionCentres(updated);
    saveState({ auctionCentres: updated });
    logAudit({ module: "settings", action: "create", recordId: item.id, recordRef: item.name, details: `Added auction centre ${item.name}` });
  };
  const updateAuctionCentre = (id: string, partial: Partial<AuctionCentre>) => {
    const updated = auctionCentres.map((a) => (a.id === id ? { ...a, ...partial } : a));
    setAuctionCentres(updated);
    saveState({ auctionCentres: updated });
  };
  const deleteAuctionCentre = (id: string) => {
    const updated = auctionCentres.filter((a) => a.id !== id);
    setAuctionCentres(updated);
    saveState({ auctionCentres: updated });
  };

  // Master Data: Stem Length Categories
  const addStemLengthCategory = (newSl: Omit<StemLengthCategory, "id">) => {
    const item: StemLengthCategory = { ...newSl, id: `sl-${Date.now()}` };
    const updated = [...stemLengthCategories, item];
    setStemLengthCategories(updated);
    saveState({ stemLengthCategories: updated });
  };
  const updateStemLengthCategory = (id: string, partial: Partial<StemLengthCategory>) => {
    const updated = stemLengthCategories.map((s) => (s.id === id ? { ...s, ...partial } : s));
    setStemLengthCategories(updated);
    saveState({ stemLengthCategories: updated });
  };
  const deleteStemLengthCategory = (id: string) => {
    const updated = stemLengthCategories.filter((s) => s.id !== id);
    setStemLengthCategories(updated);
    saveState({ stemLengthCategories: updated });
  };

  // Master Data: Bunch Sizes
  const addBunchSize = (newBs: Omit<BunchSizeConfig, "id">) => {
    const item: BunchSizeConfig = { ...newBs, id: `bs-${Date.now()}` };
    const updated = [...bunchSizes, item];
    setBunchSizes(updated);
    saveState({ bunchSizes: updated });
  };
  const updateBunchSize = (id: string, partial: Partial<BunchSizeConfig>) => {
    const updated = bunchSizes.map((b) => (b.id === id ? { ...b, ...partial } : b));
    setBunchSizes(updated);
    saveState({ bunchSizes: updated });
  };
  const deleteBunchSize = (id: string) => {
    const updated = bunchSizes.filter((b) => b.id !== id);
    setBunchSizes(updated);
    saveState({ bunchSizes: updated });
  };

  // ========================================================================================
  // Flower Traceability Actions
  // ========================================================================================

  // Stage 1: Harvest Management
  const addHarvestBatch = (batch: Omit<HarvestBatch, "id" | "createdAt" | "isVoid">) => {
    const totalBuckets = batch.lines.reduce((sum, l) => sum + (Number(l.bucketsHarvested) || 0), 0);
    const totalEstimatedStems = batch.lines.reduce(
      (sum, l) => sum + ((Number(l.bucketsHarvested) || 0) * (Number(l.stemsPerBucket) || 50)),
      0
    );

    const dateVal = batch.harvestDate || batch.date || new Date().toISOString().split("T")[0];
    const dateStr = dateVal.replace(/-/g, "");
    const count = harvestBatches.length + 1;
    const batchRef = batch.batchRef || `HV-${dateStr}-${String(count).padStart(3, "0")}`;

    const newBatch: HarvestBatch = {
      ...batch,
      id: `hv-${Date.now()}`,
      batchRef,
      date: dateVal,
      harvestDate: dateVal,
      totalBuckets,
      totalEstimatedStems,
      status: "harvested",
      createdAt: new Date().toISOString(),
      isVoid: false,
    };

    const updated = [newBatch, ...harvestBatches];
    setHarvestBatches(updated);
    saveState({ harvestBatches: updated });

    logAudit({
      module: "harvest",
      action: "create",
      recordId: newBatch.id,
      recordRef: newBatch.batchRef,
      details: `Harvested ${totalBuckets} buckets (~${totalEstimatedStems} stems) from ${batch.polyhouseName}`,
    });

    return newBatch;
  };

  const updateHarvestBatch = (id: string, partial: Partial<HarvestBatch>) => {
    const target = harvestBatches.find((h) => h.id === id);
    const updated = harvestBatches.map((h) => {
      if (h.id === id) {
        const mergedLines = partial.lines || h.lines;
        const totalBuckets = mergedLines.reduce((sum, l) => sum + (Number(l.bucketsHarvested) || 0), 0);
        const totalEstimatedStems = mergedLines.reduce(
          (sum, l) => sum + ((Number(l.bucketsHarvested) || 0) * (Number(l.stemsPerBucket) || 50)),
          0
        );
        return {
          ...h,
          ...partial,
          totalBuckets,
          totalEstimatedStems,
          updatedAt: new Date().toISOString(),
        };
      }
      return h;
    });
    setHarvestBatches(updated);
    saveState({ harvestBatches: updated });
    logAudit({
      module: "harvest",
      action: "update",
      recordId: id,
      recordRef: target?.batchRef || id,
      details: `Updated harvest batch details`,
    });
  };

  const voidHarvestBatch = (id: string, reason: string) => {
    const target = harvestBatches.find((h) => h.id === id);
    const updated = harvestBatches.map((h) =>
      h.id === id ? { ...h, isVoid: true, voidReason: reason, updatedAt: new Date().toISOString() } : h
    );
    setHarvestBatches(updated);
    saveState({ harvestBatches: updated });
    logAudit({
      module: "harvest",
      action: "void",
      recordId: id,
      recordRef: target?.batchRef || id,
      details: `Voided harvest batch: ${reason}`,
    });
  };

  // Stage 2: Dispatch 1 (TriBloom Farm to Processing Farm)
  const addDispatch1 = (dispatch: Omit<Dispatch1, "id" | "createdAt" | "isVoid">) => {
    const totalBucketsSent = dispatch.lines.reduce((sum, l) => sum + (Number(l.bucketsSent) || 0), 0);
    const totalStemsSent = dispatch.lines.reduce(
      (sum, l) => sum + (Number(l.stemsSent) || (Number(l.bucketsSent) || 0) * 50),
      0
    );

    const dateVal = dispatch.dispatchDate || dispatch.date || new Date().toISOString().split("T")[0];
    const dateStr = dateVal.replace(/-/g, "");
    const count = dispatch1Records.length + 1;
    const dispatchRef = dispatch.dispatchRef || `DSP1-${dateStr}-${String(count).padStart(3, "0")}`;

    const newDispatch: Dispatch1 = {
      ...dispatch,
      id: `dsp1-${Date.now()}`,
      dispatchRef,
      date: dateVal,
      dispatchDate: dateVal,
      totalBucketsSent,
      totalStemsSent,
      totalBucketsReceived: 0,
      totalStemsReceived: 0,
      status: "in_transit",
      createdAt: new Date().toISOString(),
      isVoid: false,
    };

    // Update harvest batches dispatched quantities
    const updatedHarvests = harvestBatches.map((h) => {
      const matchLines = dispatch.lines.filter((l) => l.harvestBatchId === h.id);
      if (matchLines.length > 0) {
        const newLines = h.lines.map((hl) => {
          const dl = matchLines.find((l) => l.harvestLineId === hl.id);
          if (dl) {
            const updatedDispatched = (hl.bucketsDispatched || 0) + (dl.bucketsSent ?? dl.bucketsDispatched ?? 0);
            return { ...hl, bucketsDispatched: updatedDispatched };
          }
          return hl;
        });
        const allDispatched = newLines.every((hl) => (hl.bucketsDispatched || 0) >= hl.bucketsHarvested);
        return {
          ...h,
          lines: newLines,
          status: allDispatched ? ("fully_dispatched" as const) : ("partially_dispatched" as const),
        };
      }
      return h;
    });

    const updatedDsp1 = [newDispatch, ...dispatch1Records];
    setHarvestBatches(updatedHarvests);
    setDispatch1Records(updatedDsp1);
    saveState({ harvestBatches: updatedHarvests, dispatch1Records: updatedDsp1 });

    logAudit({
      module: "dispatch1",
      action: "create",
      recordId: newDispatch.id,
      recordRef: newDispatch.dispatchRef,
      details: `Dispatched ${totalBucketsSent} buckets from ${dispatch.sourceFarmName} to ${dispatch.destFarmName}`,
    });

    return newDispatch;
  };

  const updateDispatch1 = (id: string, partial: Partial<Dispatch1>) => {
    const target = dispatch1Records.find((d) => d.id === id);
    const updated = dispatch1Records.map((d) => (d.id === id ? { ...d, ...partial, updatedAt: new Date().toISOString() } : d));
    setDispatch1Records(updated);
    saveState({ dispatch1Records: updated });
    logAudit({
      module: "dispatch1",
      action: "update",
      recordId: id,
      recordRef: target?.dispatchRef || id,
      details: `Updated Dispatch 1 consignment`,
    });
  };

  const confirmDispatch1Receipt = (
    id: string,
    lineReceipts: { lineId: string; bucketsReceived: number; stemsReceived?: number; discrepancyReason?: string }[],
    receivedBy: string,
    receiptRemarks?: string
  ) => {
    const target = dispatch1Records.find((d) => d.id === id);
    if (!target) return;

    let totalBucketsReceived = 0;
    let totalStemsReceived = 0;

    const updatedLines = target.lines.map((l) => {
      const match = lineReceipts.find((r) => r.lineId === l.id);
      if (match) {
        const bucketsRec = Number(match.bucketsReceived) || 0;
        const stemsRec = Number(match.stemsReceived) || bucketsRec * 50;
        const discrepancyBuckets = (l.bucketsSent ?? l.bucketsDispatched ?? 0) - bucketsRec;
        const discrepancyStems = (l.stemsSent ?? (l.bucketsSent ?? l.bucketsDispatched ?? 0) * 50) - stemsRec;
        totalBucketsReceived += bucketsRec;
        totalStemsReceived += stemsRec;

        return {
          ...l,
          bucketsReceived: bucketsRec,
          stemsReceived: stemsRec,
          discrepancyBuckets,
          discrepancyStems,
          discrepancyReason: match.discrepancyReason || l.discrepancyReason,
        };
      }
      totalBucketsReceived += l.bucketsReceived ?? l.bucketsSent ?? l.bucketsDispatched ?? 0;
      totalStemsReceived += l.stemsReceived ?? l.stemsSent ?? ((l.bucketsSent ?? l.bucketsDispatched ?? 0) * 50);
      return l;
    });

    const updatedDsp1 = dispatch1Records.map((d) =>
      d.id === id
        ? {
            ...d,
            lines: updatedLines,
            totalBucketsReceived,
            totalStemsReceived,
            status: "received" as const,
            receivedAt: new Date().toISOString(),
            receivedBy,
            receiptRemarks: receiptRemarks || d.receiptRemarks,
            updatedAt: new Date().toISOString(),
          }
        : d
    );

    setDispatch1Records(updatedDsp1);
    saveState({ dispatch1Records: updatedDsp1 });

    logAudit({
      module: "receiving",
      action: "status_change",
      recordId: id,
      recordRef: target.dispatchRef,
      details: `Confirmed delivery at ${target.destFarmName}: Received ${totalBucketsReceived} buckets (${totalBucketsReceived < target.totalBucketsSent ? `${target.totalBucketsSent - totalBucketsReceived} buckets transit discrepancy` : "100% intact"})`,
      previousValue: "in_transit",
      newValue: "received",
    });
  };

  const voidDispatch1 = (id: string, reason: string) => {
    const target = dispatch1Records.find((d) => d.id === id);
    const updated = dispatch1Records.map((d) =>
      d.id === id ? { ...d, isVoid: true, voidReason: reason, updatedAt: new Date().toISOString() } : d
    );
    setDispatch1Records(updated);
    saveState({ dispatch1Records: updated });
    logAudit({
      module: "dispatch1",
      action: "void",
      recordId: id,
      recordRef: target?.dispatchRef || id,
      details: `Voided Dispatch 1: ${reason}`,
    });
  };

  // Stage 3 & 4: Grading and Stem-Length Segregation at Processing Farm
  const addGrading = (grading: Omit<ProcessingGrading, "id" | "createdAt" | "isVoid">) => {
    const totalGradedStems = grading.lines.reduce((sum, l) => sum + (Number(l.stemsGraded) || 0), 0);
    const rejectedDamagedStems = Number(grading.rejectedDamagedStems) || 0;
    const incomingStemsReceived = Number(grading.incomingStemsReceived) || totalGradedStems + rejectedDamagedStems;
    const unexplainedDifference = incomingStemsReceived - (totalGradedStems + rejectedDamagedStems);

    const dateStr = grading.date.replace(/-/g, "");
    const count = gradings.length + 1;
    const gradingRef = grading.gradingRef || `GRD-${dateStr}-${String(count).padStart(3, "0")}`;

    const newGrading: ProcessingGrading = {
      ...grading,
      id: `grd-${Date.now()}`,
      gradingRef,
      incomingStemsReceived,
      totalIncomingStems: incomingStemsReceived,
      totalGradedStems,
      rejectedDamagedStems,
      rejectedStems: rejectedDamagedStems,
      unexplainedDifference,
      unexplainedVariance: unexplainedDifference,
      status: grading.status || "graded",
      gradedDate: grading.gradedDate || grading.date,
      flowerColor: grading.flowerColor || grading.varietyColor || "",
      lines: grading.lines.map((l, idx) => ({
        ...l,
        id: l.id || `gsl-${Date.now()}-${idx}`,
        stemsPacked: l.stemsPacked || 0,
        stemsAvailable: l.stemsAvailable !== undefined ? l.stemsAvailable : (l.stemsGraded || l.stemsCount || 0),
        stemsGraded: l.stemsGraded || l.stemsCount || 0,
        stemsCount: l.stemsCount || l.stemsGraded || 0,
      })),
      createdAt: new Date().toISOString(),
      isVoid: false,
    };

    // Update dispatch1 line graded count
    const updatedDsp1 = dispatch1Records.map((d) => {
      if (d.id === grading.dispatch1Id) {
        const lines = d.lines.map((l) =>
          l.id === grading.dispatch1LineId ? { ...l, stemsGraded: (l.stemsGraded || 0) + totalGradedStems + rejectedDamagedStems } : l
        );
        const allGraded = lines.every((l) => (l.stemsGraded || 0) >= (l.stemsReceived || l.stemsSent || 0));
        return {
          ...d,
          lines,
          status: allGraded ? ("fully_graded" as const) : ("partially_graded" as const),
        };
      }
      return d;
    });

    const updatedGradings = [newGrading, ...gradings];
    setGradings(updatedGradings);
    setDispatch1Records(updatedDsp1);
    saveState({ gradings: updatedGradings, dispatch1Records: updatedDsp1 });

    logAudit({
      module: "grading",
      action: "create",
      recordId: newGrading.id,
      recordRef: newGrading.gradingRef,
      details: `Graded ${totalGradedStems} stems of ${grading.varietyName} across stem length categories (${rejectedDamagedStems} rejected)`,
    });

    return newGrading;
  };

  const updateGrading = (id: string, partial: Partial<ProcessingGrading>) => {
    const target = gradings.find((g) => g.id === id);
    const updated = gradings.map((g) => {
      if (g.id === id) {
        const mergedLines = partial.lines || g.lines;
        const totalGradedStems = mergedLines.reduce((sum, l) => sum + (Number(l.stemsGraded ?? l.stemsCount) || 0), 0);
        const incoming = partial.incomingStemsReceived !== undefined ? Number(partial.incomingStemsReceived) : (partial.totalIncomingStems !== undefined ? Number(partial.totalIncomingStems) : g.incomingStemsReceived);
        const rejected = partial.rejectedDamagedStems !== undefined ? Number(partial.rejectedDamagedStems) : (partial.rejectedStems !== undefined ? Number(partial.rejectedStems) : g.rejectedDamagedStems);
        const unexplained = incoming - (totalGradedStems + rejected);
        return {
          ...g,
          ...partial,
          totalGradedStems,
          rejectedDamagedStems: rejected,
          rejectedStems: rejected,
          incomingStemsReceived: incoming,
          totalIncomingStems: incoming,
          unexplainedDifference: unexplained,
          unexplainedVariance: unexplained,
          status: partial.status || g.status || "graded",
          gradedDate: partial.gradedDate || partial.date || g.gradedDate || g.date,
          updatedAt: new Date().toISOString(),
        };
      }
      return g;
    });
    setGradings(updated);
    saveState({ gradings: updated });
    logAudit({
      module: "grading",
      action: "update",
      recordId: id,
      recordRef: target?.gradingRef || id,
      details: `Updated grading record`,
    });
  };

  const voidGrading = (id: string, reason: string) => {
    const target = gradings.find((g) => g.id === id);
    const updated = gradings.map((g) =>
      g.id === id ? { ...g, isVoid: true, voidReason: reason, updatedAt: new Date().toISOString() } : g
    );
    setGradings(updated);
    saveState({ gradings: updated });
    logAudit({
      module: "grading",
      action: "void",
      recordId: id,
      recordRef: target?.gradingRef || id,
      details: `Voided grading entry: ${reason}`,
    });
  };

  // Stage 5: Packing Management
  const addPackingBatch = (packing: Omit<PackingBatch, "id" | "createdAt" | "isVoid">) => {
    const totalStemsPacked = (Number(packing.stemsPerBunch) || 20) * (Number(packing.bunchesCount) || 0);

    const dateVal = packing.packingDate || packing.date || new Date().toISOString().split("T")[0];
    const dateStr = dateVal.replace(/-/g, "");
    const count = packingBatches.length + 1;
    const packingRef = packing.packingRef || `PCK-${dateStr}-${String(count).padStart(3, "0")}`;

    const newPacking: PackingBatch = {
      ...packing,
      date: dateVal,
      packingDate: dateVal,
      id: `pck-${Date.now()}`,
      packingRef,
      totalStemsPacked,
      bunchesDispatched: 0,
      bunchesAvailable: Number(packing.bunchesCount) || 0,
      availableBunches: Number(packing.bunchesCount) || 0,
      createdAt: new Date().toISOString(),
      isVoid: false,
    };

    // Update available stems in grading category
    const updatedGradings = gradings.map((g) => {
      if (g.id === packing.gradingId) {
        const updatedLines = g.lines.map((l) => {
          if (l.stemLengthCategoryId === packing.stemCategoryId) {
            const packed = (l.stemsPacked || 0) + totalStemsPacked;
            return {
              ...l,
              stemsPacked: packed,
              stemsAvailable: Math.max(0, l.stemsGraded - packed),
            };
          }
          return l;
        });
        return { ...g, lines: updatedLines };
      }
      return g;
    });

    const updatedPacking = [newPacking, ...packingBatches];
    setPackingBatches(updatedPacking);
    setGradings(updatedGradings);
    saveState({ packingBatches: updatedPacking, gradings: updatedGradings });

    logAudit({
      module: "packing",
      action: "create",
      recordId: newPacking.id,
      recordRef: newPacking.packingRef,
      details: `Packed ${packing.bunchesCount} bunches (${totalStemsPacked} stems) of ${packing.varietyName} ${packing.stemLengthCategoryName}`,
    });

    return newPacking;
  };

  const updatePackingBatch = (id: string, partial: Partial<PackingBatch>) => {
    const target = packingBatches.find((p) => p.id === id);
    const updated = packingBatches.map((p) => {
      if (p.id === id) {
        const stemsPerBunch = partial.stemsPerBunch || p.stemsPerBunch;
        const bunchesCount = partial.bunchesCount !== undefined ? partial.bunchesCount : p.bunchesCount;
        const totalStemsPacked = stemsPerBunch * bunchesCount;
        const bunchesDispatched = partial.bunchesDispatched !== undefined ? partial.bunchesDispatched : p.bunchesDispatched;
        return {
          ...p,
          ...partial,
          totalStemsPacked,
          bunchesAvailable: Math.max(0, bunchesCount - bunchesDispatched),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    setPackingBatches(updated);
    saveState({ packingBatches: updated });
    logAudit({
      module: "packing",
      action: "update",
      recordId: id,
      recordRef: target?.packingRef || id,
      details: `Updated packing batch configuration`,
    });
  };

  const voidPackingBatch = (id: string, reason: string) => {
    const target = packingBatches.find((p) => p.id === id);
    const updated = packingBatches.map((p) =>
      p.id === id ? { ...p, isVoid: true, voidReason: reason, updatedAt: new Date().toISOString() } : p
    );
    setPackingBatches(updated);
    saveState({ packingBatches: updated });
    logAudit({
      module: "packing",
      action: "void",
      recordId: id,
      recordRef: target?.packingRef || id,
      details: `Voided packing batch: ${reason}`,
    });
  };

  // Stage 6: Dispatch 2 (Processing Farm to Auction Centre)
  const addDispatch2 = (dispatch: Omit<Dispatch2, "id" | "createdAt" | "isVoid">) => {
    const totalBunchesSent = dispatch.lines.reduce((sum, l) => sum + (Number(l.bunchesSent) || 0), 0);
    const totalStemsSent = dispatch.lines.reduce((sum, l) => sum + (Number(l.totalStemsSent) || l.bunchesSent * l.stemsPerBunch), 0);

    const dateStr = dispatch.date.replace(/-/g, "");
    const count = dispatch2Records.length + 1;
    const dispatchRef = dispatch.dispatchRef || `DSP2-${dateStr}-${String(count).padStart(3, "0")}`;

    const newDispatch: Dispatch2 = {
      ...dispatch,
      id: `dsp2-${Date.now()}`,
      dispatchRef,
      totalBunchesSent,
      totalStemsSent,
      status: "dispatched",
      lines: dispatch.lines.map((l) => ({
        ...l,
        bunchesSold: 0,
        bunchesUnsold: 0,
      })),
      createdAt: new Date().toISOString(),
      isVoid: false,
    };

    // Deduct bunches from packing inventory
    const updatedPacking = packingBatches.map((p) => {
      const match = dispatch.lines.find((l) => l.packingBatchId === p.id || l.packingBatchRef === p.packingRef);
      if (match) {
        const dispatched = (p.bunchesDispatched || 0) + match.bunchesSent;
        return {
          ...p,
          bunchesDispatched: dispatched,
          bunchesAvailable: Math.max(0, p.bunchesCount - dispatched),
        };
      }
      return p;
    });

    const updatedDsp2 = [newDispatch, ...dispatch2Records];
    setPackingBatches(updatedPacking);
    setDispatch2Records(updatedDsp2);
    saveState({ packingBatches: updatedPacking, dispatch2Records: updatedDsp2 });

    logAudit({
      module: "dispatch2",
      action: "create",
      recordId: newDispatch.id,
      recordRef: newDispatch.dispatchRef,
      details: `Dispatched ${totalBunchesSent} bunches (${totalStemsSent} stems) to auction at ${dispatch.destAuctionCentreName}`,
    });

    return newDispatch;
  };

  const updateDispatch2Status = (id: string, status: Dispatch2["status"]) => {
    const target = dispatch2Records.find((d) => d.id === id);
    const updated = dispatch2Records.map((d) => (d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d));
    setDispatch2Records(updated);
    saveState({ dispatch2Records: updated });
    logAudit({
      module: "dispatch2",
      action: "status_change",
      recordId: id,
      recordRef: target?.dispatchRef || id,
      details: `Dispatch 2 status changed to ${status}`,
      previousValue: target?.status,
      newValue: status,
    });
  };

  const voidDispatch2 = (id: string, reason: string) => {
    const target = dispatch2Records.find((d) => d.id === id);
    const updated = dispatch2Records.map((d) =>
      d.id === id ? { ...d, isVoid: true, voidReason: reason, updatedAt: new Date().toISOString() } : d
    );
    setDispatch2Records(updated);
    saveState({ dispatch2Records: updated });
    logAudit({
      module: "dispatch2",
      action: "void",
      recordId: id,
      recordRef: target?.dispatchRef || id,
      details: `Voided Dispatch 2: ${reason}`,
    });
  };

  // Stage 7: Auction Sales and Price Realization
  const addAuctionRealization = (realization: Omit<AuctionRealization, "id" | "createdAt" | "isVoid">) => {
    const calculatedLines = realization.lines.map((l, idx) => {
      const bunchesSold = Number(l.bunchesSold) || 0;
      const pricePerUnit = Number(l.pricePerUnit) || 0;
      const stemsPerBunch = Number(l.stemsPerBunch) || 20;

      let grossSaleValue = 0;
      if (l.priceUnit === "stem") {
        grossSaleValue = bunchesSold * stemsPerBunch * pricePerUnit;
      } else {
        grossSaleValue = bunchesSold * pricePerUnit;
      }

      const commissionAmount = Number(l.commissionAmount) || Math.round(grossSaleValue * 0.045 * 10) / 10;
      const otherCharges = Number(l.otherCharges) || 0;
      const netRealization = grossSaleValue - commissionAmount - otherCharges;

      return {
        ...l,
        id: l.id || `arl-${Date.now()}-${idx}`,
        grossSaleValue,
        commissionAmount,
        otherCharges,
        netRealization,
      };
    });

    const totalBunchesSent = calculatedLines.reduce((s, l) => s + (Number(l.bunchesSent) || 0), 0);
    const totalBunchesSold = calculatedLines.reduce((s, l) => s + (Number(l.bunchesSold) || 0), 0);
    const totalBunchesUnsold = calculatedLines.reduce((s, l) => s + (Number(l.bunchesUnsold) || 0), 0);
    const totalGrossValue = calculatedLines.reduce((s, l) => s + l.grossSaleValue, 0);
    const totalCommission = calculatedLines.reduce((s, l) => s + l.commissionAmount, 0);
    const totalOtherCharges = calculatedLines.reduce((s, l) => s + l.otherCharges, 0);
    const totalNetRealization = calculatedLines.reduce((s, l) => s + l.netRealization, 0);

    const dateStr = realization.auctionDate.replace(/-/g, "");
    const count = auctionRealizations.length + 1;
    const realizationRef = realization.realizationRef || `AUC-${dateStr}-${String(count).padStart(3, "0")}`;

    const newRealization: AuctionRealization = {
      ...realization,
      id: `auc-${Date.now()}`,
      realizationRef,
      lines: calculatedLines,
      totalBunchesSent,
      totalBunchesSold,
      totalBunchesUnsold,
      totalGrossValue,
      totalGrossRealization: totalGrossValue,
      totalCommission,
      auctionCommission: totalCommission,
      totalOtherCharges,
      otherCharges: totalOtherCharges,
      totalNetRealization,
      netRealization: totalNetRealization,
      paymentStatus: realization.paymentStatus || "settled",
      createdAt: new Date().toISOString(),
      isVoid: false,
    };

    // Update Dispatch 2 line sold/unsold counts and close dispatch if all sold
    const updatedDsp2 = dispatch2Records.map((d) => {
      if (d.id === realization.dispatch2Id) {
        const updatedLines = d.lines.map((dl) => {
          const match = calculatedLines.find((cl) => cl.dispatch2LineId === dl.id || cl.packingBatchRef === dl.packingBatchRef);
          if (match) {
            return {
              ...dl,
              bunchesSold: match.bunchesSold,
              bunchesUnsold: match.bunchesUnsold,
            };
          }
          return dl;
        });
        return {
          ...d,
          lines: updatedLines,
          status: "closed" as const,
        };
      }
      return d;
    });

    const updatedRealizations = [newRealization, ...auctionRealizations];
    setAuctionRealizations(updatedRealizations);
    setDispatch2Records(updatedDsp2);
    saveState({ auctionRealizations: updatedRealizations, dispatch2Records: updatedDsp2 });

    logAudit({
      module: "auction",
      action: "create",
      recordId: newRealization.id,
      recordRef: newRealization.realizationRef,
      details: `Settled auction sale: Gross ₹${totalGrossValue.toLocaleString()}, Net ₹${totalNetRealization.toLocaleString()} at ${realization.auctionCentreName}`,
    });

    return newRealization;
  };

  const updateAuctionRealization = (id: string, partial: Partial<AuctionRealization>) => {
    const target = auctionRealizations.find((a) => a.id === id);
    const updated = auctionRealizations.map((a) => {
      if (a.id === id) {
        const mergedLines = (partial.lines || a.lines).map((l) => {
          let gross = 0;
          if (l.priceUnit === "stem") {
            gross = (Number(l.bunchesSold) || 0) * (Number(l.stemsPerBunch) || 20) * (Number(l.pricePerUnit) || 0);
          } else {
            gross = (Number(l.bunchesSold) || 0) * (Number(l.pricePerUnit) || 0);
          }
          const comm = Number(l.commissionAmount) || 0;
          const other = Number(l.otherCharges) || 0;
          return {
            ...l,
            grossSaleValue: gross,
            netRealization: gross - comm - other,
          };
        });

        const totalGrossValue = mergedLines.reduce((s, l) => s + l.grossSaleValue, 0);
        const totalCommission = mergedLines.reduce((s, l) => s + l.commissionAmount, 0);
        const totalOtherCharges = mergedLines.reduce((s, l) => s + l.otherCharges, 0);
        const totalNetRealization = mergedLines.reduce((s, l) => s + l.netRealization, 0);

        return {
          ...a,
          ...partial,
          lines: mergedLines,
          totalGrossValue,
          totalGrossRealization: totalGrossValue,
          totalCommission,
          auctionCommission: totalCommission,
          totalOtherCharges,
          otherCharges: totalOtherCharges,
          totalNetRealization,
          netRealization: totalNetRealization,
          paymentStatus: partial.paymentStatus || a.paymentStatus || "settled",
          updatedAt: new Date().toISOString(),
        };
      }
      return a;
    });

    setAuctionRealizations(updated);
    saveState({ auctionRealizations: updated });
    logAudit({
      module: "auction",
      action: "update",
      recordId: id,
      recordRef: target?.realizationRef || id,
      details: `Corrected auction realization statement with audit preservation`,
    });
  };

  const voidAuctionRealization = (id: string, reason: string) => {
    const target = auctionRealizations.find((a) => a.id === id);
    const updated = auctionRealizations.map((a) =>
      a.id === id ? { ...a, isVoid: true, voidReason: reason, updatedAt: new Date().toISOString() } : a
    );
    setAuctionRealizations(updated);
    saveState({ auctionRealizations: updated });
    logAudit({
      module: "auction",
      action: "void",
      recordId: id,
      recordRef: target?.realizationRef || id,
      details: `Voided auction realization: ${reason}`,
    });
  };

  const addBuyer = (newBuyer: Omit<Buyer, "id">) => {
    const item: Buyer = { ...newBuyer, id: `buy-${Date.now()}` };
    const updated = [...buyers, item];
    setBuyers(updated);
    saveState({ buyers: updated });
    return item;
  };

  const updateBuyer = (id: string, partial: Partial<Buyer>) => {
    const updated = buyers.map((b) => (b.id === id ? { ...b, ...partial } : b));
    setBuyers(updated);
    saveState({ buyers: updated });
  };

  const deleteBuyer = (id: string) => {
    const updated = buyers.filter((b) => b.id !== id);
    setBuyers(updated);
    saveState({ buyers: updated });
  };

  // Transaction Actions
  const addExpense = (newExpense: Omit<Expense, "id" | "createdAt" | "isVoid">) => {
    const item: Expense = {
      ...newExpense,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isVoid: false,
    };
    const updated = [item, ...expenses];
    setExpenses(updated);
    saveState({ expenses: updated });
  };

  const voidExpense = (id: string, reason: string) => {
    const updated = expenses.map((e) => (e.id === id ? { ...e, isVoid: true, voidReason: reason } : e));
    setExpenses(updated);
    saveState({ expenses: updated });
  };

  const addContribution = (newCon: Omit<Contribution, "id" | "createdAt" | "isVoid">) => {
    const item: Contribution = {
      ...newCon,
      id: `con-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isVoid: false,
    };
    const updated = [item, ...contributions];
    setContributions(updated);
    saveState({ contributions: updated });
  };

  const addCommitment = (newCom: Omit<Commitment, "id" | "createdAt" | "isVoid">) => {
    const item: Commitment = {
      ...newCom,
      id: `com-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isVoid: false,
    };
    const updated = [item, ...commitments];
    setCommitments(updated);
    saveState({ commitments: updated });
  };

  const addReimbursement = (newReimb: Omit<Reimbursement, "id" | "createdAt" | "isVoid">) => {
    const item: Reimbursement = {
      ...newReimb,
      id: `reimb-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isVoid: false,
    };
    const updated = [item, ...reimbursements];
    setReimbursements(updated);
    saveState({ reimbursements: updated });
  };

  const addHarvest = (newHarvest: Omit<HarvestEntry, "id" | "createdAt" | "isVoid">) => {
    const item: HarvestEntry = {
      ...newHarvest,
      id: `har-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isVoid: false,
    };
    const updated = [item, ...harvests];
    setHarvests(updated);
    saveState({ harvests: updated });
  };

  const addDispatch = (newDispatch: Omit<Dispatch, "id" | "createdAt" | "isVoid">) => {
    const item: Dispatch = {
      ...newDispatch,
      id: `disp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isVoid: false,
    };
    const updated = [item, ...dispatches];
    setDispatches(updated);
    saveState({ dispatches: updated });
  };

  const updateDispatchStatus = (id: string, status: Dispatch["status"], stemsReceived?: number, notes?: string) => {
    const updated = dispatches.map((d) =>
      d.id === id
        ? {
            ...d,
            status,
            deliveredAt: status === "delivered" ? new Date().toISOString() : d.deliveredAt,
            stemsReceivedAtAggregator: stemsReceived !== undefined ? stemsReceived : d.stemsReceivedAtAggregator,
            aggregatorNotes: notes !== undefined ? notes : d.aggregatorNotes,
          }
        : d
    );
    setDispatches(updated);
    saveState({ dispatches: updated });
  };

  const addSale = (newSale: Omit<Sale, "id" | "createdAt" | "isVoid">) => {
    const item: Sale = {
      ...newSale,
      id: `sale-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isVoid: false,
    };
    const updated = [item, ...sales];
    setSales(updated);
    saveState({ sales: updated });
  };

  const addPayment = (newPay: Omit<PaymentReceived, "id" | "createdAt" | "isVoid">) => {
    const item: PaymentReceived = {
      ...newPay,
      id: `pay-${Date.now()}`,
      createdAt: new Date().toISOString(),
      isVoid: false,
    };
    const updated = [item, ...payments];
    setPayments(updated);
    saveState({ payments: updated });
  };

  const deletePayment = (id: string) => {
    const updated = payments.filter((p) => p.id !== id);
    setPayments(updated);
    saveState({ payments: updated });
  };

  const updateSettings = (newSettings: Partial<FarmSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveState({ settings: updated });
  };

  // Reset all transactions to ZERO (0) for clean practice
  const clearAllTransactionsToZero = () => {
    if (isCloudMode) return; // never wipe the shared farm database from a button
    setExpenses([]);
    setContributions([]);
    setCommitments([]);
    setReimbursements([]);
    setHarvests([]);
    setDispatches([]);
    setSales([]);
    setPayments([]);
    saveState({
      expenses: [],
      contributions: [],
      commitments: [],
      reimbursements: [],
      harvests: [],
      dispatches: [],
      sales: [],
      payments: [],
    });
  };

  // Load sample practice data
  const loadSamplePracticeData = () => {
    if (isCloudMode) return; // sample data is only for demo mode
    setExpenses(SAMPLE_PRACTICE_EXPENSES);
    setHarvests(SAMPLE_PRACTICE_HARVESTS);
    setDispatches(SAMPLE_PRACTICE_DISPATCHES);
    saveState({
      expenses: SAMPLE_PRACTICE_EXPENSES,
      harvests: SAMPLE_PRACTICE_HARVESTS,
      dispatches: SAMPLE_PRACTICE_DISPATCHES,
    });
  };

  // Download every record as one JSON file (free Supabase plan has no automatic backups)
  const downloadBackup = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      settings, partners, varieties, polyhouses, farms, auctionCentres, stemLengthCategories, bunchSizes, buyers,
      users: users.map(({ password: _pw, ...u }) => u),
      harvestBatches, dispatch1Records, gradings, packingBatches, dispatch2Records, auctionRealizations,
      expenses, contributions, commitments, reimbursements, harvests, dispatches, sales, payments, auditLogs,
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tribloom-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAllToDefault = () => {
    if (isCloudMode) return; // never wipe the shared farm database from a button
    localStorage.removeItem(STORAGE_KEY);
    setSettings(INITIAL_SETTINGS);
    setUsers(INITIAL_USERS);
    setPartners(INITIAL_PARTNERS);
    setBlocks(INITIAL_BLOCKS);
    setPolyhouses(INITIAL_POLYHOUSES);
    setVarieties(INITIAL_VARIETIES);
    setGrades(INITIAL_GRADES);
    setCategories(INITIAL_CATEGORIES);
    setBuyers(INITIAL_BUYERS);
    setVehicles(INITIAL_VEHICLES);
    setInventory(INITIAL_INVENTORY);
    setFarms(INITIAL_FARMS);
    setAuctionCentres(INITIAL_AUCTION_CENTRES);
    setStemLengthCategories(INITIAL_STEM_LENGTH_CATEGORIES);
    setBunchSizes(INITIAL_BUNCH_SIZES);
    setHarvestBatches(INITIAL_HARVEST_BATCHES);
    setDispatch1Records(INITIAL_DISPATCH1_RECORDS);
    setGradings(INITIAL_GRADINGS);
    setPackingBatches(INITIAL_PACKING_BATCHES);
    setDispatch2Records(INITIAL_DISPATCH2_RECORDS);
    setAuctionRealizations(INITIAL_AUCTION_REALIZATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setExpenses([]);
    setContributions([]);
    setCommitments([]);
    setReimbursements([]);
    setHarvests([]);
    setDispatches([]);
    setSales([]);
    setPayments([]);
  };

  return (
    <FarmContext.Provider
      value={{
        isCloud: isCloudMode,
        authReady,
        syncStatus,
        syncMessage,
        authError: cloudLoginError,
        downloadBackup,
        passwordRecovery,
        requestPasswordReset,
        setNewPassword,
        changePassword,
        resetUserPassword,
        currentUser,
        login,
        logout,
        currentRole,
        setCurrentRole,
        currentPartnerId,
        setCurrentPartnerId,
        filterPeriod,
        setFilterPeriod,
        selectedFY,
        setSelectedFY,
        customDateRange,
        setCustomDateRange,
        selectedPolyhouseFilter,
        setSelectedPolyhouseFilter,
        selectedVarietyFilter,
        setSelectedVarietyFilter,
        selectedFarmFilter,
        setSelectedFarmFilter,
        selectedAuctionFilter,
        setSelectedAuctionFilter,
        users,
        addUser,
        updateUser,
        deleteUser,
        settings,
        updateSettings,
        partners,
        addPartner,
        updatePartner,
        deletePartner,
        varieties,
        addVariety,
        updateVariety,
        deleteVariety,
        polyhouses,
        addPolyhouse,
        updatePolyhouse,
        deletePolyhouse,
        assignVarietyToPolyhouse,
        removeVarietyFromPolyhouse,
        farms,
        addFarm,
        updateFarm,
        deleteFarm,
        auctionCentres,
        addAuctionCentre,
        updateAuctionCentre,
        deleteAuctionCentre,
        stemLengthCategories,
        addStemLengthCategory,
        updateStemLengthCategory,
        deleteStemLengthCategory,
        bunchSizes,
        addBunchSize,
        updateBunchSize,
        deleteBunchSize,
        blocks,
        grades,
        categories,
        buyers,
        addBuyer,
        updateBuyer,
        deleteBuyer,
        vehicles,
        inventory,
        harvestBatches,
        addHarvestBatch,
        updateHarvestBatch,
        voidHarvestBatch,
        dispatch1Records,
        addDispatch1,
        updateDispatch1,
        confirmDispatch1Receipt,
        voidDispatch1,
        gradings,
        addGrading,
        updateGrading,
        voidGrading,
        packingBatches,
        addPackingBatch,
        updatePackingBatch,
        voidPackingBatch,
        dispatch2Records,
        addDispatch2,
        updateDispatch2Status,
        voidDispatch2,
        auctionRealizations,
        addAuctionRealization,
        updateAuctionRealization,
        voidAuctionRealization,
        auditLogs,
        logAudit,
        getBatchTraceability,
        expenses,
        addExpense,
        voidExpense,
        contributions,
        addContribution,
        commitments,
        addCommitment,
        reimbursements,
        addReimbursement,
        harvests,
        addHarvest,
        dispatches,
        addDispatch,
        updateDispatchStatus,
        sales,
        addSale,
        payments,
        addPayment,
        deletePayment,
        partnerLedgers,
        coldRoomStock,
        filteredExpenses,
        filteredHarvests,
        filteredDispatches,
        filteredSales,
        filteredPayments,
        matchesPeriod,
        filteredHarvestBatches,
        filteredDispatch1Records,
        filteredGradings,
        filteredPackingBatches,
        filteredDispatch2Records,
        filteredAuctionRealizations,
        kpis,
        traceabilityKPIs,
        isQuickExpenseOpen,
        setIsQuickExpenseOpen,
        isQuickHarvestOpen,
        setIsQuickHarvestOpen,
        isQuickContributionOpen,
        setIsQuickContributionOpen,
        clearAllTransactionsToZero,
        loadSamplePracticeData,
        resetAllToDefault,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error("useFarm must be used within a FarmProvider");
  }
  return context;
}




