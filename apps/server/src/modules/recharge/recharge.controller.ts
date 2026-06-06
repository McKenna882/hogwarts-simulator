import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateRechargeOrderDto, VirtualPayDto } from './dto/recharge.dto';
import { RechargeService } from './recharge.service';

@Controller('recharge')
export class RechargeController {
  constructor(private rechargeService: RechargeService) {}

  @Get('packages')
  getPackages() {
    return this.rechargeService.getPackages();
  }

  @Post('orders')
  createOrder(@CurrentUser('userId') userId: string, @Body() dto: CreateRechargeOrderDto) {
    return this.rechargeService.createOrder(userId, dto.packageId);
  }

  @Get('orders')
  getMyOrders(
    @CurrentUser('userId') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.rechargeService.getMyOrders(userId, +page, +limit);
  }

  @Get('orders/:orderNo')
  getOrder(@CurrentUser('userId') userId: string, @Param('orderNo') orderNo: string) {
    return this.rechargeService.getOrder(userId, orderNo);
  }

  @Post('orders/:orderNo/virtual-pay')
  virtualPay(
    @CurrentUser('userId') userId: string,
    @Param('orderNo') orderNo: string,
    @Body() dto: VirtualPayDto,
  ) {
    return this.rechargeService.virtualPay(userId, orderNo, dto.key);
  }
}
