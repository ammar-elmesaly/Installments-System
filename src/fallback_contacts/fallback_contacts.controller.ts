import { Body, Controller, Post } from '@nestjs/common';
import { FallbackContactsService } from './fallback_contacts.service';
import { CreateFallbackContactDTO } from './dto/createFallbackContact.dto';
import { MinAdminLevel } from '../auth/admin-level.decorator';
import { AdminLevel } from '../admins/enums/adminLevel.enum';

@Controller('fallback-contacts')
export class FallbackContactsController {
  constructor (private falllbackContactsService: FallbackContactsService) {}

  @Post('new')
  @MinAdminLevel(AdminLevel.Collector)
  create(@Body() createFallbackContactDTO: CreateFallbackContactDTO) {  
    return this.falllbackContactsService.create(createFallbackContactDTO);
  }
}
