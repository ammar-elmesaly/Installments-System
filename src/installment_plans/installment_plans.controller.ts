import { Body, Controller, Post } from '@nestjs/common';
import { CreateInstallmentPlanDTO } from './dto/createInstallmentPlan.dto';
import { InstallmentPlansService } from './installment_plans.service';

@Controller('installment-plans')
export class InstallmentPlansController {
  constructor (private installmentPlansService: InstallmentPlansService) {}

  @Post('new')
  create(@Body() createPlanDTO: CreateInstallmentPlanDTO) {
    return this.installmentPlansService.create(createPlanDTO);
  }
}
