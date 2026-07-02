import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDTO, UpdateAdminDTO } from './dto/admin.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Admin } from './admin.entity';

@Controller('admins')
export class AdminsController {
  constructor(private adminsService: AdminsService) {}
  
  @Get('all')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit = 10,
  ): Promise<Pagination<Admin>> {
    limit = limit > 100 ? 100 : limit;
    return this.adminsService.paginate({
      page,
      limit,
    });
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.findById(id);
  }
  
  @Put('update/:id')
  updateById(@Param('id', ParseUUIDPipe) id: string, @Body() updateAdminDTO: UpdateAdminDTO) {
    return this.adminsService.updateById(id, updateAdminDTO);
  }

  @Delete('remove/:id')
  removeById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.deleteById(id);
  }
}
