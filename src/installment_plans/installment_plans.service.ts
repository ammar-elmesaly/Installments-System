import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InstallmentPlan } from './installment_plan.entity';
import { CreateInstallmentPlanDTO } from './dto/createInstallmentPlan.dto';
import { ClientsService } from '../clients/clients.service';
import { InstallmentMonthsService } from '../installment_months/installment_months.service';
import dayjs from 'dayjs';
import { CreateInstallmentMonthDTO } from '../installment_months/dto/createInstallmentMonth.dto';
import Big from 'big.js';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentDTO } from './dto/payment.dto';
import { Admin } from '../admins/admin.entity';
import { InstallmentMonthStatus } from '../installment_months/enums/installmentMonthStatus.enum';
import { InstallmentMonth } from '../installment_months/installment_month.entity';
import { Client } from '../clients/client.entity';

@Injectable()
export class InstallmentPlansService {  
  constructor (
    @InjectRepository(InstallmentPlan)
    private installmentPlansRepository: Repository<InstallmentPlan>,
    private installmentMonthsService: InstallmentMonthsService,
    private clientsService: ClientsService,
    private dataSource: DataSource
  ) {}

  async create(createPlanDTO: CreateInstallmentPlanDTO) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const client = await this.clientsService.findById(createPlanDTO.client_id);

      // update the client's total_paid_cash (down payment)
      await this.clientsService.updateById(client.id, {
        total_paid_cash: Big(client.total_paid_cash).add(createPlanDTO.down_payment).toNumber()
      });

      const installmentPlan = queryRunner.manager.create(InstallmentPlan);
      installmentPlan.client = client;
      installmentPlan.down_payment = createPlanDTO.down_payment;

      if (createPlanDTO.total_amount) {
        installmentPlan.total_amount = createPlanDTO.total_amount - createPlanDTO.down_payment;
      } else {
        // TODO: calculate total_amount based on createPlanDTO.items
      }

      const savedInstallmentPlan = await queryRunner.manager.save(installmentPlan);

      let baseDueDate = createPlanDTO.start_date ? dayjs(createPlanDTO.start_date) : dayjs().add(1, 'month');
      const expectedAmount = Big(installmentPlan.total_amount).div(createPlanDTO.duration_months);
      const roundedExpectedAmount = expectedAmount.round(2, Big.roundHalfUp).toNumber();

      // duration_months is plan duration in months
      for (let m = 0; m < createPlanDTO.duration_months; m++) {
        const calculatedDueDate = baseDueDate.add(m, 'month').toDate();
        const monthData: CreateInstallmentMonthDTO = {
          installment_plan_id: savedInstallmentPlan.id,
          due_date: calculatedDueDate,
          expected_amount: roundedExpectedAmount
        };
        await this.installmentMonthsService.create(monthData, queryRunner);
      }

      await queryRunner.commitTransaction();

      return installmentPlan;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async pay(paymentDTO: PaymentDTO, adminId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const admin = await queryRunner.manager.findOneBy(Admin, { id: adminId });
      if (!admin) {
        throw new NotFoundException(`Admin with ID ${adminId} not found`);
      }

      const targetStatuses = [
        InstallmentMonthStatus.Pending,
        InstallmentMonthStatus.PartiallyPaid,
        InstallmentMonthStatus.Overdue
      ];

      // Finds installmentPlan with the id, and embeds associated not fully paid (or overdue)
      // installment months in it.
      const installmentPlan = await queryRunner.manager
        .createQueryBuilder(InstallmentPlan, "installmentPlan")
        .leftJoinAndSelect(
          "installmentPlan.installment_months", 
          "installmentMonth",
          "installmentMonth.status IN (:...statuses)",
          { statuses: targetStatuses }
        )
        .innerJoinAndSelect(
          "installmentPlan.client",
          "client"
        )
        .where("installmentPlan.id = :id", { id: paymentDTO.installment_plan_id })
        .orderBy("installmentMonth.due_date", "ASC")
        .getOne();

      if (!installmentPlan) {
        throw new NotFoundException(`Installment Plan with ID ${paymentDTO.installment_plan_id} not found`);
      }

      if (installmentPlan.installment_months.length === 0) {
        throw new BadRequestException('There is no active months associated with this installment_plan, maybe the plan is already paid.');
      }

      
      const toPayInstallmentMonth = installmentPlan.installment_months[0];
      
      const expectedAmount = new Big(toPayInstallmentMonth.expected_amount);
      const currentPaid = new Big(toPayInstallmentMonth.paid_amount);
      const newPayment = new Big(paymentDTO.paid_amount);

      const totalAccumulatedPaid = currentPaid.plus(newPayment);

      let newStatus: InstallmentMonthStatus;  // new month status after payment

      if (totalAccumulatedPaid.lt(expectedAmount)) {
        newStatus = InstallmentMonthStatus.PartiallyPaid;
      } else if (totalAccumulatedPaid.gt(expectedAmount)) {
        throw new BadRequestException(
          `The payment of ${paymentDTO.paid_amount} EGP exceeds the remaining balance due for this installment month.`
        );
      } else {
        newStatus = InstallmentMonthStatus.Paid;
      }

      toPayInstallmentMonth.paid_amount = totalAccumulatedPaid.toNumber();
      toPayInstallmentMonth.status = newStatus;

      await queryRunner.manager.save(InstallmentMonth, toPayInstallmentMonth)

      // update client's total_paid_cash
      const client = installmentPlan.client;

      const clientTotalPaidCash = new Big(client.total_paid_cash);
      const updatedTotal = clientTotalPaidCash.plus(newPayment);

      client.total_paid_cash = updatedTotal.toNumber();

      await queryRunner.manager.save(Client, client);

      // TODO: Make a transaction
      await queryRunner.commitTransaction();
    
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
