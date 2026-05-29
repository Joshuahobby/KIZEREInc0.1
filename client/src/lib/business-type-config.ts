export type BusinessType =
  | "Retailer"
  | "Wholesaler"
  | "InsuranceCompany"
  | "EventOrganizer"
  | "NGO"
  | "GovernmentAgency"
  | "TechCompany"
  | "Other";

export interface BusinessTypeConfig {
  label: string;
  hubTitle: string;
  dashboardDesc: string;
  itemLabel: string;
  itemsLabel: string;
  transferLabel: string;
  transfersLabel: string;
  customerLabel: string;
  customersLabel: string;
  showPOS: boolean;
  showCommissions: boolean;
  showShiftSummary: boolean;
  navLabels: {
    dashboard: string;
    pos?: string;
    items: string;
    transactions: string;
    customers: string;
  };
}

const CONFIGS: Record<BusinessType, BusinessTypeConfig> = {
  Retailer: {
    label: "Retailer",
    hubTitle: "RETAIL HUB",
    dashboardDesc: "Overview of your POS registrations and activity",
    itemLabel: "Product",
    itemsLabel: "Products",
    transferLabel: "Transfer",
    transfersLabel: "Transfers",
    customerLabel: "Customer",
    customersLabel: "Customers",
    showPOS: true,
    showCommissions: true,
    showShiftSummary: true,
    navLabels: {
      dashboard: "Retailer Dashboard",
      pos: "Point of Sale",
      items: "Products",
      transactions: "Transactions",
      customers: "Customers",
    },
  },
  Wholesaler: {
    label: "Wholesaler / Distributor",
    hubTitle: "WHOLESALE HUB",
    dashboardDesc: "Overview of your bulk registrations and distribution activity",
    itemLabel: "Product",
    itemsLabel: "Products",
    transferLabel: "Distribution",
    transfersLabel: "Distributions",
    customerLabel: "Client",
    customersLabel: "Clients",
    showPOS: true,
    showCommissions: true,
    showShiftSummary: true,
    navLabels: {
      dashboard: "Wholesale Dashboard",
      pos: "Distribution Terminal",
      items: "Products",
      transactions: "Transactions",
      customers: "Clients",
    },
  },
  InsuranceCompany: {
    label: "Insurance Company",
    hubTitle: "INSURANCE HUB",
    dashboardDesc: "Overview of registered policies and claim activity",
    itemLabel: "Policy",
    itemsLabel: "Policies",
    transferLabel: "Claim",
    transfersLabel: "Claims",
    customerLabel: "Policyholder",
    customersLabel: "Policyholders",
    showPOS: false,
    showCommissions: false,
    showShiftSummary: false,
    navLabels: {
      dashboard: "Insurance Dashboard",
      items: "Policies",
      transactions: "Claims History",
      customers: "Policyholders",
    },
  },
  EventOrganizer: {
    label: "Event Organizer",
    hubTitle: "EVENTS HUB",
    dashboardDesc: "Overview of your events, tickets, and attendees",
    itemLabel: "Ticket",
    itemsLabel: "Events & Tickets",
    transferLabel: "Ticket Transfer",
    transfersLabel: "Ticket Transfers",
    customerLabel: "Attendee",
    customersLabel: "Attendees",
    showPOS: false,
    showCommissions: false,
    showShiftSummary: false,
    navLabels: {
      dashboard: "Events Dashboard",
      items: "Events & Tickets",
      transactions: "Transactions",
      customers: "Attendees",
    },
  },
  NGO: {
    label: "NGO / Non-Profit",
    hubTitle: "NGO HUB",
    dashboardDesc: "Overview of registered assets and beneficiary activity",
    itemLabel: "Asset",
    itemsLabel: "Assets",
    transferLabel: "Handoff",
    transfersLabel: "Handoffs",
    customerLabel: "Beneficiary",
    customersLabel: "Beneficiaries",
    showPOS: false,
    showCommissions: false,
    showShiftSummary: false,
    navLabels: {
      dashboard: "NGO Dashboard",
      items: "Assets",
      transactions: "Transactions",
      customers: "Beneficiaries",
    },
  },
  GovernmentAgency: {
    label: "Government Agency",
    hubTitle: "AGENCY HUB",
    dashboardDesc: "Overview of registered items and citizen interactions",
    itemLabel: "Item",
    itemsLabel: "Items & Records",
    transferLabel: "Transfer",
    transfersLabel: "Transfers",
    customerLabel: "Citizen",
    customersLabel: "Citizens",
    showPOS: false,
    showCommissions: false,
    showShiftSummary: false,
    navLabels: {
      dashboard: "Agency Dashboard",
      items: "Items & Records",
      transactions: "Transactions",
      customers: "Citizens",
    },
  },
  TechCompany: {
    label: "Tech Company",
    hubTitle: "TECH HUB",
    dashboardDesc: "Overview of registered devices and ownership transfers",
    itemLabel: "Device",
    itemsLabel: "Devices",
    transferLabel: "Transfer",
    transfersLabel: "Transfers",
    customerLabel: "Customer",
    customersLabel: "Customers",
    showPOS: false,
    showCommissions: false,
    showShiftSummary: false,
    navLabels: {
      dashboard: "Tech Dashboard",
      items: "Devices",
      transactions: "Transactions",
      customers: "Customers",
    },
  },
  Other: {
    label: "Business",
    hubTitle: "BUSINESS HUB",
    dashboardDesc: "Overview of your registered items and activity",
    itemLabel: "Item",
    itemsLabel: "Items",
    transferLabel: "Transfer",
    transfersLabel: "Transfers",
    customerLabel: "Customer",
    customersLabel: "Customers",
    showPOS: false,
    showCommissions: false,
    showShiftSummary: false,
    navLabels: {
      dashboard: "Business Dashboard",
      items: "Items",
      transactions: "Transactions",
      customers: "Customers",
    },
  },
};

export function getBusinessConfig(businessType?: string | null): BusinessTypeConfig {
  return CONFIGS[(businessType as BusinessType) ?? "Retailer"] ?? CONFIGS.Retailer;
}
