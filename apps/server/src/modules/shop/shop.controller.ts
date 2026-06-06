import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ShopService } from './shop.service';
import { BuyProductDto } from './dto/buy-product.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('shop')
export class ShopController {
  constructor(private shopService: ShopService) {}

  @Get('shops')
  getShops() {
    return this.shopService.getShops();
  }

  @Get('shops/:id/products')
  getProducts(@Param('id') id: string) {
    return this.shopService.getProducts(id);
  }

  @Post('buy')
  buyProduct(@CurrentUser('userId') userId: string, @Body() dto: BuyProductDto) {
    return this.shopService.buyProduct(userId, dto.productId, dto.quantity || 1);
  }
}
