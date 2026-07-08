import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { InstallmentMonth } from './installment_month.entity';
import { CreateInstallmentMonthDTO } from './dto/createInstallmentMonth.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class InstallmentMonthsService {
  constructor (
    @InjectRepository(InstallmentMonth)
    private installmentMonthsRepository: Repository<InstallmentMonth>,
    private dataSource: DataSource
  ) {}

  async create(
    createInstallmentMonthDTO: CreateInstallmentMonthDTO,
    queryRunner: QueryRunner = this.dataSource.createQueryRunner()
  ) {
    const isLocalRunner = !queryRunner.isTransactionActive;

    if (isLocalRunner) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }

    try {
      const installmentMonth = queryRunner.manager.create(InstallmentMonth, {
        due_date: createInstallmentMonthDTO.due_date,
        expected_amount: createInstallmentMonthDTO.expected_amount,
        installment_plan: { id: createInstallmentMonthDTO.installment_plan_id },
      });

      const savedInstallmentMonth = await queryRunner.manager.save(installmentMonth);

      if (isLocalRunner) {
        await queryRunner.commitTransaction();
      }

      return savedInstallmentMonth;

    } catch (error) {
      if (isLocalRunner) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      if (isLocalRunner) {
        await queryRunner.release();
      }
    }
  }
}
