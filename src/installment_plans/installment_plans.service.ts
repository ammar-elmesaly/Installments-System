import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InstallmentPlan } from './installment_plan.entity';
import { CreateInstallmentPlanDTO } from './dto/createInstallmentPlan.dto';
import { ClientsService } from '../clients/clients.service';
import { InstallmentMonthsService } from '../installment_months/installment_months.service';
import dayjs from 'dayjs';
import { CreateInstallmentMonthDTO } from '../installment_months/dto/createInstallmentMonth.dto';
import Big from 'big.js';
import { InjectRepository } from '@nestjs/typeorm';

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
}
