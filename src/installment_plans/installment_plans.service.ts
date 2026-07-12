import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InstallmentPlan } from './installment_plan.entity';
import { CreateInstallmentPlanDTO } from './dto/createInstallmentPlan.dto';
import { CreateInstallmentMonthDTO } from '../installment_months/dto/createInstallmentMonth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentDTO } from './dto/payment.dto';
import { Admin } from '../admins/admin.entity';
import { InstallmentMonthStatus } from '../installment_months/enums/installmentMonthStatus.enum';
import { InstallmentMonth } from '../installment_months/installment_month.entity';
import { Client } from '../clients/client.entity';
import { Transaction } from '../transactions/transaction.entity';
import dayjs from 'dayjs';
import Big from 'big.js';
import { Account } from '../accounts/account.entity';

@Injectable()
export class InstallmentPlansService {  
  constructor (
    @InjectRepository(InstallmentPlan)
    private installmentPlansRepository: Repository<InstallmentPlan>,
    private dataSource: DataSource
  ) {}

  findAll() {
    return this.installmentPlansRepository.find();
  }

  async create(createPlanDTO: CreateInstallmentPlanDTO) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const client = await queryRunner.manager.findOneBy(Client, {
        id: createPlanDTO.client_id,
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${createPlanDTO.client_id} not found`);
      }

      // Update the client's total_paid_cash (down payment)
      client.total_paid_cash = Big(client.total_paid_cash).add(createPlanDTO.down_payment).toNumber();
      await queryRunner.manager.save(Client, client);

      const installmentPlan = queryRunner.manager.create(InstallmentPlan, {
        client,
        down_payment: createPlanDTO.down_payment,
      });

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
        const installmentMonth = queryRunner.manager.create(InstallmentMonth, {
          due_date: monthData.due_date,
          expected_amount: monthData.expected_amount,
          installment_plan: { id: monthData.installment_plan_id },
        });

        await queryRunner.manager.save(installmentMonth);
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

  async pay(paymentDTO: PaymentDTO, accountId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    
    try {
      const account = await queryRunner.manager.findOne(Account, {
        where: {
          id: accountId
        },
        relations: {
          person: {
            admin: true
          }
        }
      });
      if (!account?.person?.admin) {
        throw new NotFoundException(`Admin associated with account ID ${accountId} not found`);
      }

      const admin = account.person.admin;

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

      let newStatus: InstallmentMonthStatus;  // New month status after payment

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

      // Update client's total_paid_cash
      const client = installmentPlan.client;

      const clientTotalPaidCash = new Big(client.total_paid_cash);
      const updatedTotal = clientTotalPaidCash.plus(newPayment);

      client.total_paid_cash = updatedTotal.toNumber();

      await queryRunner.manager.save(Client, client);

      // Record the transaction
      const transaction = queryRunner.manager.create(Transaction);

      transaction.admin = admin;
      transaction.amount = newPayment.toNumber();
      transaction.installment_plan = installmentPlan;
      transaction.payment_type = paymentDTO.payment_type;

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();

      return {
        message: 'Payment recorded successfully.',
        transaction: savedTransaction,
      };
    
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
