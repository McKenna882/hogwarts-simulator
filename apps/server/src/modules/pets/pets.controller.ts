import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('pets')
export class PetsController {
  constructor(private petsService: PetsService) {}

  @Get()
  getPets(@CurrentUser('userId') userId: string) {
    return this.petsService.getPets(userId);
  }

  @Post('hatch')
  hatchEgg(
    @CurrentUser('userId') userId: string,
    @Body() body: { inventoryId: string; name?: string },
  ) {
    return this.petsService.hatchEgg(userId, body.inventoryId, body.name);
  }

  @Post(':id/feed')
  feedPet(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() body: { foodInventoryId: string },
  ) {
    return this.petsService.feedPet(userId, id, body.foodInventoryId);
  }

  @Post(':id/grow')
  growPet(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.petsService.growPet(userId, id);
  }
}
