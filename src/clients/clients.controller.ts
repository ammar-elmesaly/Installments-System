import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDTO, UpdateClientDTO } from './dto/client.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Client } from './client.entity';

@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Get('all')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit = 10,
  ): Promise<Pagination<Client>> {
    limit = limit > 100 ? 100 : limit;
    return this.clientsService.paginate({
      page,
      limit,
    });
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