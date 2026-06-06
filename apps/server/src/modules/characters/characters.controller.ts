import { Controller, Get, Param, Query } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Public()
  @Get()
  findAll(
    @Query('house') house?: string,
    @Query('grade') grade?: string,
  ) {
    return this.charactersService.findAll(house, grade);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.charactersService.findOne(id);
  }

  @Get(':id/affinity')
  async getAffinity(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.charactersService.getAffinity(userId, id);
  }
}
