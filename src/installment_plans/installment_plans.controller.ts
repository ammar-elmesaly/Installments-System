import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { CreateInstallmentPlanDTO } from './dto/createInstallmentPlan.dto';
import { InstallmentPlansService } from './installment_plans.service';
import { PaymentDTO, UnpayDTO } from './dto/payment.dto';
import { FindPlansDto } from './dto/find-plan.dto';
import { UpdateNotesDTO } from './dto/updateNotes.dto';

@Controller('installment-plans')
export class InstallmentPlansController {
  constructor (private installmentPlansService: InstallmentPlansService) {}

  @Get('all')
  findAll(@Query() query: FindPlansDto) {
    return this.installmentPlansService.paginate(
      { page: query.page, limit: query.limit },
      query.status,
      query.search
    )
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

  @Post('freeze/:id')
  freeze(@Param('id', ParseUUIDPipe) id: string) {
    return this.installmentPlansService.freeze(id);
  }

  @Post('unfreeze/:id')
  unfreeze(@Param('id', ParseUUIDPipe) id: string) {
    return this.installmentPlansService.unfreeze(id);
  }

  @Patch('notes/:id')
  updateNotes(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNotesDTO) {
    return this.installmentPlansService.updateNotes(id, dto.notes)
  }
}
