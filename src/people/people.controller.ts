import { Body, Controller, Delete, Get, Param, ParseIntPipe, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { PeopleService } from './people.service';
import { CreatePersonDTO, UpdatePersonDTO } from './dto/person.dto';

@Controller('people')
export class PeopleController {
  constructor(private peopleService: PeopleService) {}

  @Get('all')
  findAll() {
    return this.peopleService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.peopleService.findById(id);
  }

  @Post('new')
  create(@Body() createPersonDTO: CreatePersonDTO) {
    return this.peopleService.create(createPersonDTO);
  }

  @Put('update/:id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePersonDTO: UpdatePersonDTO
  ) {
    return this.peopleService.updateById(id, updatePersonDTO);
  }

  @Delete('remove/:id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.peopleService.deleteById(id);
  }
}
