import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { Repository } from 'typeorm';

import { InstallmentMonth } from '../installment_months/installment_month.entity';
import { InstallmentMonthStatus } from '../installment_months/enums/installmentMonthStatus.enum';
import { PaymentType } from '../installment_plans/enums/paymentType.enum';
import { Transaction } from '../transactions/transaction.entity';
import {
	DashboardArchiveItem,
	DashboardOverview,
	DashboardQueryOptions,
	DashboardSummary,
} from './dashboard.types';
import Big from 'big.js';

@Injectable()
export class DashboardService {
	constructor(
		@InjectRepository(Transaction)
		private readonly transactionsRepository: Repository<Transaction>,
    
		@InjectRepository(InstallmentMonth)
		private readonly installmentMonthsRepository: Repository<InstallmentMonth>,
	) {}

	async getDashboard(options: DashboardQueryOptions = {}): Promise<DashboardOverview> {
		const archiveLimit = options.archiveLimit ?? 100;
		const startOfDay = dayjs().startOf('day').toDate();
		const endOfDay = dayjs().endOf('day').toDate();

    // * archiveRows basically fetches made transactions up to 100 (the default)
    // * receivable refers to money that you don't have but expect to come in the feature, Basically installments that haven't been paid yet
		const [dailyAdminRows, receivableRow, overdueRow, archiveRows, archiveTotalCount] = await Promise.all([
			this.transactionsRepository
				.createQueryBuilder('transaction')
				.innerJoin('transaction.admin', 'admin')
				.innerJoin('admin.person', 'adminPerson')
				.where('transaction.created_at BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
				.select('admin.id', 'admin_id')
				.addSelect(
					"TRIM(CONCAT(adminPerson.first_name, ' ', adminPerson.second_name, ' ', adminPerson.third_name, ' ', adminPerson.last_name))",
					'admin_name',
				)
				.addSelect('adminPerson.phone_number', 'admin_phone_number')
				.addSelect('COUNT(transaction.id)', 'transaction_count')
				.addSelect('SUM(CASE WHEN transaction.amount > 0 THEN 1 ELSE 0 END)', 'collection_count')
				.addSelect('COALESCE(SUM(CASE WHEN transaction.amount > 0 THEN transaction.amount ELSE 0 END), 0)', 'collected_total')
				.addSelect('COALESCE(SUM(CASE WHEN transaction.amount > 0 AND transaction.payment_type = :cashType THEN transaction.amount ELSE 0 END), 0)', 'cash_collected_total')
				.addSelect('SUM(CASE WHEN transaction.amount < 0 THEN 1 ELSE 0 END)', 'reversal_count')
				.addSelect('COALESCE(SUM(CASE WHEN transaction.amount < 0 THEN ABS(transaction.amount) ELSE 0 END), 0)', 'reversal_total')
				.addSelect('COALESCE(SUM(transaction.amount), 0)', 'net_total')
				.setParameter('cashType', PaymentType.Cash)
				.groupBy('admin.id')
				.addGroupBy('adminPerson.first_name')
				.addGroupBy('adminPerson.second_name')
				.addGroupBy('adminPerson.third_name')
				.addGroupBy('adminPerson.last_name')
				.addGroupBy('adminPerson.phone_number')
				.orderBy('collected_total', 'DESC')
				.getRawMany(),

      this.installmentMonthsRepository
        .createQueryBuilder('installmentMonth')
        .select('COUNT(installmentMonth.id)', 'pending_installments_count')
        .addSelect(
          'COALESCE(SUM(installmentMonth.expected_amount - installmentMonth.paid_amount), 0)', 
          'receivable_amount_total'
        )
        .where('installmentMonth.status IN (:...statuses)', { 
          statuses: [InstallmentMonthStatus.Pending, InstallmentMonthStatus.PartiallyPaid, InstallmentMonthStatus.Overdue] 
        })
        .getRawOne(),

      this.installmentMonthsRepository
        .createQueryBuilder('installmentMonth')
        .select('COUNT(installmentMonth.id)', 'overdue_count')
        .addSelect(
          'COALESCE(SUM(installmentMonth.expected_amount - installmentMonth.paid_amount), 0)',
          'overdue_amount_total'
        )
        .where('installmentMonth.status = :status', { status: InstallmentMonthStatus.Overdue })
        .getRawOne(),

			this.transactionsRepository
				.createQueryBuilder('transaction')
				.innerJoin('transaction.admin', 'admin')
				.innerJoin('admin.person', 'adminPerson')
				.leftJoin('transaction.installment_plan', 'installmentPlan')
				.leftJoin('installmentPlan.client', 'client')
				.leftJoin('client.person', 'clientPerson')
				.leftJoin('transaction.installment_month', 'installmentMonth')
				.orderBy('transaction.created_at', 'DESC')
				.take(archiveLimit)
				.select('transaction.id', 'transaction_id')
				.addSelect('transaction.created_at', 'created_at')
				.addSelect('transaction.amount', 'amount')
				.addSelect('transaction.payment_type', 'payment_type')
				.addSelect('admin.id', 'admin_id')
				.addSelect(
					"TRIM(CONCAT(adminPerson.first_name, ' ', adminPerson.second_name, ' ', adminPerson.third_name, ' ', adminPerson.last_name))",
					'admin_name',
				)
				.addSelect('adminPerson.phone_number', 'admin_phone_number')
				.addSelect('client.id', 'client_id')
				.addSelect(
					"TRIM(CONCAT(clientPerson.first_name, ' ', clientPerson.second_name, ' ', clientPerson.third_name, ' ', clientPerson.last_name))",
					'client_name',
				)
				.addSelect('clientPerson.phone_number', 'client_phone_number')
				.addSelect('installmentPlan.id', 'installment_plan_id')
				.addSelect('installmentPlan.status', 'installment_plan_status')
				.addSelect('installmentMonth.id', 'installment_month_id')
				.addSelect('installmentMonth.due_date', 'installment_month_due_date')
				.addSelect('installmentMonth.expected_amount', 'installment_month_expected_amount')
				.addSelect('installmentMonth.paid_amount', 'installment_month_paid_amount')
				.addSelect('installmentMonth.status', 'installment_month_status')
				.getRawMany(),
        
			this.transactionsRepository.count(),
		]);

		const cashFlowToday = this.buildCashFlowSummary(dailyAdminRows);
		const accountsReceivable = {
			pending_installments_count: Big(receivableRow?.pending_installments_count ?? 0).toNumber(),
			receivable_amount_total: Big(receivableRow?.receivable_amount_total ?? 0).toNumber(),
		};

    const overdueInstallments = {
      overdue_count: Big(overdueRow?.overdue_count ?? 0).toNumber(),
      overdue_amount_total: Big(overdueRow?.overdue_amount_total ?? 0).toNumber(),
    };

    return {
      generated_at: new Date().toISOString(),
      cash_flow_today: cashFlowToday,
      accounts_receivable: accountsReceivable,
      overdue_installments: overdueInstallments,
      archive_total_count: archiveTotalCount,
      transaction_log_archive: archiveRows.map((row) => this.mapArchiveRow(row)),
    };
	}

	private buildCashFlowSummary(rows: any[]): DashboardSummary {
		const byAdmin = rows.map((row) => ({
			admin_id: row.admin_id,
			admin_name: row.admin_name,
			admin_phone_number: row.admin_phone_number,
			transaction_count: Number(row.transaction_count ?? 0),
			collection_count: Number(row.collection_count ?? 0),
			collected_total: Number(row.collected_total ?? 0),
			cash_collected_total: Number(row.cash_collected_total ?? 0),
			reversal_count: Number(row.reversal_count ?? 0),
			reversal_total: Number(row.reversal_total ?? 0),
			net_total: Number(row.net_total ?? 0),
		}));

		return {
			date: dayjs().format('YYYY-MM-DD'),
			total_collected: byAdmin.reduce((sum, item) => sum + item.collected_total, 0),  // Total money collected
			cash_collected_total: byAdmin.reduce((sum, item) => sum + item.cash_collected_total, 0),  // Hard-cash collected (Not VISA or VODAFONE CASH)
			reversal_count: byAdmin.reduce((sum, item) => sum + item.reversal_count, 0),
			reversal_total: byAdmin.reduce((sum, item) => sum + item.reversal_total, 0),
			net_total: byAdmin.reduce((sum, item) => sum + item.net_total, 0),  // Reversal + Collected
			collection_count: byAdmin.reduce((sum, item) => sum + item.collection_count, 0),
			by_admin: byAdmin,
		};
	}

	private mapArchiveRow(row: Record<string, any>): DashboardArchiveItem {
		return {
			transaction_id: row.transaction_id,
			created_at: row.created_at,
			amount: Number(row.amount ?? 0),
			payment_type: row.payment_type,
			direction: Number(row.amount ?? 0) < 0 ? 'OUTFLOW' : 'INFLOW',
			admin: {
				id: row.admin_id,
				name: row.admin_name,
				phone_number: row.admin_phone_number,
			},
			client: {
				id: row.client_id,
				name: row.client_name,
				phone_number: row.client_phone_number,
			},
			installment_plan: {
				id: row.installment_plan_id,
				status: row.installment_plan_status,
			},
			installment_month: {
				id: row.installment_month_id,
				due_date: row.installment_month_due_date,
				expected_amount: Number(row.installment_month_expected_amount ?? 0),
				paid_amount: Number(row.installment_month_paid_amount ?? 0),
				status: row.installment_month_status,
			},
		};
	}
}