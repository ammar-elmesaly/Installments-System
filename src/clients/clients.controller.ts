import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDTO, UpdateClientDTO } from './dto/client.dto';
import { FindClientsDto } from './dto/find-clients.dto';
import { MinAdminLevel } from '../auth/admin-level.decorator';
import { AdminLevel } from '../admins/enums/adminLevel.enum';

@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('all')
  findAll(@Query() query: FindClientsDto) {
    return this.clientsService.paginate(
      { page: query.page, limit: query.limit },
      query.status,
      query.search
    )
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.findById(id);
  }
  
  @Post('new')
  @MinAdminLevel(AdminLevel.Collector)
  create(@Body() createClientDTO: CreateClientDTO) {
    return this.clientsService.create(createClientDTO);
  }

  @Put('update/:id')
  @MinAdminLevel(AdminLevel.Collector)
  updateById(@Param('id', ParseUUIDPipe) id: string, @Body() updateClientDTO: UpdateClientDTO) {
    return this.clientsService.updateById(id, updateClientDTO);
  }

  @Delete('remove/:id')
  @MinAdminLevel(AdminLevel.Collector)
  removeById(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.deleteById(id);
  }
}