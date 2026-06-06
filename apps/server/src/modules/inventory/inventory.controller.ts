import { Controller, Get, Post, Param } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  getInventory(@CurrentUser('userId') userId: string) {
    return this.inventoryService.getInventory(userId);
  }

  @Post('use/:id')
  useItem(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.inventoryService.useItem(userId, id);
  }
}
