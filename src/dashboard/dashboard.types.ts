import { PaymentType } from '../installment_plans/enums/paymentType.enum';

export interface DashboardQueryOptions {
  archiveLimit?: number;
}

export interface DashboardAdminCashFlowRow {
  admin_id: string;
  admin_name: string;
  admin_phone_number: string;
  transaction_count: number;
  collection_count: number;
  collected_total: number;
  cash_collected_total: number;
  reversal_count: number;
  reversal_total: number;
  net_total: number;
}

export interface DashboardSummary {
  date: string;
  total_collected: number;
  cash_collected_total: number;
  reversal_count: number;
  reversal_total: number;
  net_total: number;
  collection_count: number;
  by_admin: DashboardAdminCashFlowRow[];
}

export interface DashboardArchiveClient {
  id: string;
  name: string;
  phone_number: string;
}

export interface DashboardArchiveAdmin {
  id: string;
  name: string;
  phone_number: string;
}

export interface DashboardArchiveInstallmentPlan {
  id: string;
  status: string;
}

export interface DashboardArchiveInstallmentMonth {
  id: string;
  due_date: string;
  expected_amount: number;
  paid_amount: number;
  status: string;
}

export interface DashboardArchiveItem {
  transaction_id: string;
  created_at: string;
  amount: number;
  payment_type: PaymentType;
  direction: 'INFLOW' | 'OUTFLOW';
  admin: DashboardArchiveAdmin;
  client: DashboardArchiveClient;
  installment_plan: DashboardArchiveInstallmentPlan;
  installment_month: DashboardArchiveInstallmentMonth;
}

export interface DashboardAccountsReceivable {
  pending_installments_count: number;
  pending_amount_total: number;
}

export interface DashboardOverview {
  generated_at: string;
  cash_flow_today: DashboardSummary;
  accounts_receivable: DashboardAccountsReceivable;
  archive_total_count: number;
  transaction_log_archive: DashboardArchiveItem[];
}