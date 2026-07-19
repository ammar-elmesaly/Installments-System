import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { AdminsService } from './admins.service';
import { CreateAdminDTO, UpdateAdminDTO } from './dto/admin.dto';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Admin } from './admin.entity';
import { MinAdminLevel } from '../auth/admin-level.decorator';
import { AdminLevel } from './enums/adminLevel.enum';

@Controller('admins')
export class AdminsController {
  constructor(private adminsService: AdminsService) {}
  
  @Get('all')
  @MinAdminLevel(AdminLevel.SuperAdmin)
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
  @MinAdminLevel(AdminLevel.SuperAdmin)
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.findById(id);
  }
  
  @Put('update/:id')
  @MinAdminLevel(AdminLevel.SuperAdmin)
  updateById(@Param('id', ParseUUIDPipe) id: string, @Body() updateAdminDTO: UpdateAdminDTO) {
    return this.adminsService.updateById(id, updateAdminDTO);
  }

  @Delete('remove/:id')
  @MinAdminLevel(AdminLevel.SuperAdmin)
  removeById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminsService.deleteById(id);
  }
}
