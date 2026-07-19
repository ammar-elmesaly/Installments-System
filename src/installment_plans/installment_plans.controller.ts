import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { CreateInstallmentPlanDTO } from './dto/createInstallmentPlan.dto';
import { InstallmentPlansService } from './installment_plans.service';
import { PaymentDTO, UnpayDTO } from './dto/payment.dto';
import { FindPlansDto } from './dto/find-plan.dto';
import { UpdateNotesDTO } from './dto/updateNotes.dto';
import { MinAdminLevel } from '../auth/admin-level.decorator';
import { AdminLevel } from '../admins/enums/adminLevel.enum';

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
  @MinAdminLevel(AdminLevel.Collector)
  create(@Body() createPlanDTO: CreateInstallmentPlanDTO, @Req() req) {
    return this.installmentPlansService.create(createPlanDTO, req.user.id);
  }

  @Post('pay')
  @MinAdminLevel(AdminLevel.Collector)
  pay(@Body() paymentDTO: PaymentDTO, @Req() req) {
    return this.installmentPlansService.pay(paymentDTO, req.user.id);
  }

  @Post('unpay')
  @MinAdminLevel(AdminLevel.Collector)
  unpay(@Body() unpayDTO: UnpayDTO, @Req() req) {
    return this.installmentPlansService.unpay(unpayDTO, req.user.id);
  }

  @Post('freeze/:id')
  @MinAdminLevel(AdminLevel.Collector)
  freeze(@Param('id', ParseUUIDPipe) id: string) {
    return this.installmentPlansService.freeze(id);
  }

  @Post('unfreeze/:id')
  @MinAdminLevel(AdminLevel.Collector)
  unfreeze(@Param('id', ParseUUIDPipe) id: string) {
    return this.installmentPlansService.unfreeze(id);
  }

  @Patch('notes/:id')
  @MinAdminLevel(AdminLevel.Collector)
  updateNotes(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateNotesDTO) {
    return this.installmentPlansService.updateNotes(id, dto.notes)
  }
}
