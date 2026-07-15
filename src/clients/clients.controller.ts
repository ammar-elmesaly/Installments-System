import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseEnumPipe, ParseIntPipe, ParseUUIDPipe, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDTO, UpdateClientDTO } from './dto/client.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Client } from './client.entity';
import { JwtGuard } from '../auth/jwt.guard';
import { ClientStatus } from './enums/clientStatus.enum';
import { FindClientsDto } from './dto/find-clients.dto';

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
  create(@Body() createClientDTO: CreateClientDTO) {
    return this.clientsService.create(createClientDTO);
  }

  @Put('update/:id')
  updateById(@Param('id', ParseUUIDPipe) id: string, @Body() updateClientDTO: UpdateClientDTO) {
    return this.clientsService.updateById(id, updateClientDTO);
  }

  @Delete('remove/:id')
  removeById(@Param('id', ParseUUIDPipe) id: string) {
    return this.clientsService.deleteById(id);
  }
}