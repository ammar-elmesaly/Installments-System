import { Body, Controller, Post } from '@nestjs/common';
import { FallbackContactsService } from './fallback_contacts.service';
import { CreateFallbackContactDTO } from './dto/createFallbackContact.dto';

@Controller('fallback-contacts')
export class FallbackContactsController {
  constructor (private falllbackContactsService: FallbackContactsService) {}

  @Post('new')
  create(@Body() createFallbackContactDTO: CreateFallbackContactDTO) {  
    return this.falllbackContactsService.create(createFallbackContactDTO);
  }
}
