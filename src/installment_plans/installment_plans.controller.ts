import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { CreateInstallmentPlanDTO } from './dto/createInstallmentPlan.dto';
import { InstallmentPlansService } from './installment_plans.service';
import { PaymentDTO, UnpayDTO } from './dto/payment.dto';

@Controller('installment-plans')
export class InstallmentPlansController {
  constructor (private installmentPlansService: InstallmentPlansService) {}

  @Get('all')
  findAll() {
    return this.installmentPlansService.findAll();
  }

  @Post('new')
  create(@Body() createPlanDTO: CreateInstallmentPlanDTO) {
    return this.installmentPlansService.create(createPlanDTO);
  }

  @Post('pay')
  pay(@Body() paymentDTO: PaymentDTO, @Req() req) {
    return this.installmentPlansService.pay(paymentDTO, req.user.id);
  }

  @Post('unpay')
  unpay(@Body() unpayDTO: UnpayDTO, @Req() req) {
    return this.installmentPlansService.unpay(unpayDTO, req.user.id);
  }
}
