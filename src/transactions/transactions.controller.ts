import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor (
    private transactionsService: TransactionsService
  ) {}
  
  @Get('by-plan/:planId')
  findByPlan(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.transactionsService.findByPlan(planId);
  }
}
