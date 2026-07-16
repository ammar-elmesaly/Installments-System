import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Brackets, DataSource, Repository } from 'typeorm';
import { InstallmentPlan } from './installment_plan.entity';
import { CreateInstallmentPlanDTO } from './dto/createInstallmentPlan.dto';
import { CreateInstallmentMonthDTO } from '../installment_months/dto/createInstallmentMonth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentDTO, UnpayDTO } from './dto/payment.dto';
import { InstallmentMonthStatus } from '../installment_months/enums/installmentMonthStatus.enum';
import { InstallmentMonth } from '../installment_months/installment_month.entity';
import { Client } from '../clients/client.entity';
import { Transaction } from '../transactions/transaction.entity';
import dayjs from 'dayjs';
import Big from 'big.js';
import { Account } from '../accounts/account.entity';
import { InstallmentPlanStatus } from './enums/installmentPlanStatus.enum';
import { IPaginationOptions, Pagination, paginate } from 'nestjs-typeorm-paginate';

@Injectable()
export class InstallmentPlansService {  
  constructor (
    @InjectRepository(InstallmentPlan)
    private installmentPlansRepository: Repository<InstallmentPlan>,
    private dataSource: DataSource
  ) {}

  async paginate(
    options: IPaginationOptions,
    status: InstallmentPlanStatus,
    search: string,
  ): Promise<Pagination<InstallmentPlan>> {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;

    const idSubQuery = this.installmentPlansRepository
      .createQueryBuilder('installmentPlan')
      .leftJoin('installmentPlan.client', 'client')
      .leftJoin('client.person', 'person')
      .select('installmentPlan.id')
      .orderBy('installmentPlan.id', 'ASC')
      .limit(limit)
      .offset((page - 1) * limit);

    if (status) {
      idSubQuery.andWhere('installmentPlan.status = :status', { status });
    }

    if (search) {
      const term = `%${search}%`;
      idSubQuery.andWhere(
        new Brackets((qb) => {
          qb.where(
            `CONCAT(person.first_name, ' ', person.second_name, ' ', person.third_name, ' ', person.last_name) ILIKE :term`,
            { term },
          )
            .orWhere('person.nick_name ILIKE :term', { term })
            .orWhere('person.phone_number ILIKE :term', { term })
            .orWhere('person.address ILIKE :term', { term })
            .orWhere('person.profession ILIKE :term', { term })
        }),
      );
    }

    // Count query: same filters, no limit/offset, just a count of distinct plans.
    const countQuery = this.installmentPlansRepository
      .createQueryBuilder('installmentPlan')
      .leftJoin('installmentPlan.client', 'client')
      .leftJoin('client.person', 'person');

    if (status) {
      countQuery.andWhere('installmentPlan.status = :status', { status });
    }
    if (search) {
      const term = `%${search}%`;
      countQuery.andWhere(
        new Brackets((qb) => {
          qb.where(
            `CONCAT(person.first_name, ' ', person.second_name, ' ', person.third_name, ' ', person.last_name) ILIKE :term`,
            { term },
          )
            .orWhere('person.nick_name ILIKE :term', { term })
            .orWhere('person.phone_number ILIKE :term', { term })
            .orWhere('person.address ILIKE :term', { term })
            .orWhere('person.profession ILIKE :term', { term })
        }),
      );
    }
    const totalItems = await countQuery.getCount();

    const items = await this.installmentPlansRepository
      .createQueryBuilder('installmentPlan')
      .leftJoinAndSelect('installmentPlan.client', 'client')
      .leftJoinAndSelect('installmentPlan.installment_months', 'installment_months')
      .leftJoinAndSelect('client.person', 'person')
      .where(`installmentPlan.id IN (${idSubQuery.getQuery()})`)
      .setParameters(idSubQuery.getParameters())
      .orderBy('installmentPlan.id', 'ASC')
      .getMany();

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
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

      // start_date here is the date of the first installment (not contract date)
      let baseDueDate = createPlanDTO.start_date ? dayjs(createPlanDTO.start_date) : dayjs().add(1, 'month');
      const expectedAmount = Big(installmentPlan.total_amount).div(createPlanDTO.duration_months);
      const roundedExpectedAmount = expectedAmount.round(2, Big.roundHalfUp).toNumber();

      installmentPlan.start_date = new Date(createPlanDTO.start_date);
      installmentPlan.monthly_amount = expectedAmount.toNumber();
      installmentPlan.notes = createPlanDTO.notes;
      
      const savedInstallmentPlan = await queryRunner.manager.save(installmentPlan);


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

      await queryRunner.manager.save(InstallmentMonth, toPayInstallmentMonth);

      // If it's the last month, then mark installmentPlan as PAID 
      if (installmentPlan.installment_months.length === 1) {
        await queryRunner.manager.update(InstallmentPlan, { id: installmentPlan.id }, { status: InstallmentPlanStatus.Paid });
      }

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
      transaction.installment_month = toPayInstallmentMonth;
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

  async unpay(unpayDTO: UnpayDTO, accountId: string) {
    const installmentPlanId = unpayDTO.installment_plan_id;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await queryRunner.manager.findOne(Account, {
        where: { id: accountId },
        relations: { person: { admin: true } }
      });
      if (!account?.person?.admin) {
        throw new NotFoundException(`Admin associated with account ID ${accountId} not found`);
      }
      const admin = account.person.admin;

      const lastTransaction = await queryRunner.manager.findOne(Transaction, {
        where: { installment_plan: { id: installmentPlanId } },
        order: { created_at: 'DESC' }
      });

      if (!lastTransaction) {
        throw new BadRequestException('No transactions found for this installment plan to revert.');
      }

      // Double reversal check.
      if (lastTransaction.amount < 0) {
        throw new BadRequestException('The last transaction is already a reversal.');
      }

      const installmentPlan = await queryRunner.manager
        .createQueryBuilder(InstallmentPlan, "installmentPlan")
        .leftJoinAndSelect("installmentPlan.installment_months", "installmentMonth")
        .innerJoinAndSelect("installmentPlan.client", "client")
        .where("installmentPlan.id = :id", { id: installmentPlanId })
        .orderBy("installmentMonth.due_date", "DESC")
        .getOne();

      if (!installmentPlan) {
        throw new NotFoundException(`Installment Plan with ID ${installmentPlanId} not found`);
      }

      // Only paid or partially paid months
      const modifiedMonth = installmentPlan.installment_months.find(
        month => month.status === InstallmentMonthStatus.Paid || month.status === InstallmentMonthStatus.PartiallyPaid
      );

      if (!modifiedMonth) {
        throw new BadRequestException('No paid or partially paid months found to revert.');
      }

      const expectedAmount = new Big(modifiedMonth.expected_amount);
      const currentPaid = new Big(modifiedMonth.paid_amount);
      const refundAmount = new Big(lastTransaction.amount);

      const totalAccumulatedPaid = currentPaid.minus(refundAmount);

      if (totalAccumulatedPaid.lt(0)) {
        throw new BadRequestException('Invalid rollback state: accumulated paid amount cannot be negative.');
      }

      let newStatus: InstallmentMonthStatus;
      if (totalAccumulatedPaid.eq(0)) {
        // Overdue or pending
        const now = dayjs();
        const dueDate = dayjs(modifiedMonth.due_date);
        newStatus = now.isAfter(dueDate) ? InstallmentMonthStatus.Overdue : InstallmentMonthStatus.Pending;
      } else {  // this means totalAccumulatedPaid is larger than 0, thus it's PartiallyPaid
        newStatus = InstallmentMonthStatus.PartiallyPaid;
      }

      modifiedMonth.paid_amount = totalAccumulatedPaid.toNumber();
      modifiedMonth.status = newStatus;

      await queryRunner.manager.save(InstallmentMonth, modifiedMonth);

      // If installmentPlan was PAID, we reopen it.
      if (installmentPlan.status === InstallmentPlanStatus.Paid) {
        await queryRunner.manager.update(InstallmentPlan, { id: installmentPlan.id }, { status: InstallmentPlanStatus.Active });
      }

      // Subtract refundAmount from client total_paid_cash
      const client = installmentPlan.client;
      const clientTotalPaidCash = new Big(client.total_paid_cash);
      const updatedTotal = clientTotalPaidCash.minus(refundAmount);

      client.total_paid_cash = updatedTotal.toNumber();
      await queryRunner.manager.save(Client, client);

      const reversalTransaction = queryRunner.manager.create(Transaction);
      reversalTransaction.admin = admin;
      reversalTransaction.amount = refundAmount.times(-1).toNumber();  // Negative amount
      reversalTransaction.installment_plan = installmentPlan;
      reversalTransaction.installment_month = modifiedMonth;
      reversalTransaction.payment_type = lastTransaction.payment_type;

      const savedReversal = await queryRunner.manager.save(reversalTransaction);

      await queryRunner.commitTransaction();

      return {
        message: 'Payment reversed successfully.',
        transaction: savedReversal,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async freeze(installmentPlanId: string): Promise<InstallmentPlan> {
    const installmentPlan = await this.installmentPlansRepository.findOneBy({ id: installmentPlanId });

    if (!installmentPlan) {
      throw new NotFoundException(`InstallmentPlan with ID ${installmentPlanId} not found`);
    }

    if (installmentPlan.status === InstallmentPlanStatus.Paid) {
      throw new BadRequestException('Cannot freeze a paid plan.');
    }

    installmentPlan.status = InstallmentPlanStatus.Frozen;

    return this.installmentPlansRepository.save(installmentPlan);
  }

  async unfreeze(installmentPlanId: string): Promise<InstallmentPlan> {
    const installmentPlan = await this.installmentPlansRepository.findOneBy({ id: installmentPlanId, status: InstallmentPlanStatus.Frozen });

    if (!installmentPlan) {
      throw new NotFoundException(`InstallmentPlan with ID ${installmentPlanId} not found`);
    }

    installmentPlan.status = InstallmentPlanStatus.Active;

    return this.installmentPlansRepository.save(installmentPlan);
  }

  async updateNotes(installmentPlanId: string, notes: string): Promise<InstallmentPlan> {
    const installmentPlan = await this.installmentPlansRepository.findOneBy({ id: installmentPlanId });

    if (!installmentPlan) {
      throw new NotFoundException(`InstallmentPlan with ID ${installmentPlanId} not found`);
    }

    installmentPlan.notes = notes;
    return this.installmentPlansRepository.save(installmentPlan);
  }
}
