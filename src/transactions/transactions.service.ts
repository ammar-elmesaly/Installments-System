import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async findByPlan(installmentPlanId: string, limit = 10): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: { installment_plan: { id: installmentPlanId } },
      relations: {
        admin: { person: true },
        installment_month: true,
      },
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}