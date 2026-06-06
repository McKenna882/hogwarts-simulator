import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AdminService } from './admin.service';
import { AdminUpsertRechargePackageDto, AdminWalletAdjustDto } from './dto/admin-wallet-adjust.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('keyword') keyword?: string,
  ) {
    return this.adminService.getUsers(+page, +limit, keyword);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @CurrentUser('userId') adminUserId: string,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.adminService.updateUserStatus(adminUserId, id, status);
  }

  @Get('wallet/transactions')
  getWalletTransactions(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getWalletTransactions(+page, +limit, userId);
  }

  @Post('wallet/adjust')
  adjustWallet(@CurrentUser('userId') adminUserId: string, @Body() dto: AdminWalletAdjustDto) {
    return this.adminService.adjustWallet(adminUserId, dto.userId, dto.amount, dto.reason);
  }

  @Get('recharge/packages')
  getRechargePackages() {
    return this.adminService.getRechargePackages();
  }

  @Post('recharge/packages')
  createRechargePackage(
    @CurrentUser('userId') adminUserId: string,
    @Body() dto: AdminUpsertRechargePackageDto,
  ) {
    return this.adminService.createRechargePackage(adminUserId, dto);
  }

  @Patch('recharge/packages/:id')
  updateRechargePackage(
    @CurrentUser('userId') adminUserId: string,
    @Param('id') id: string,
    @Body() dto: Partial<AdminUpsertRechargePackageDto> & { isActive?: boolean },
  ) {
    return this.adminService.updateRechargePackage(adminUserId, id, dto);
  }

  @Get('recharge/orders')
  getRechargeOrders(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getRechargeOrders(+page, +limit, status, userId);
  }

  @Get('recharge/orders/:id')
  getRechargeOrder(@Param('id') id: string) {
    return this.adminService.getRechargeOrder(id);
  }

  @Post('recharge/orders/:id/mark-paid')
  markRechargePaid(@CurrentUser('userId') adminUserId: string, @Param('id') id: string) {
    return this.adminService.markRechargePaid(adminUserId, id);
  }

  @Get('audit-logs')
  getAuditLogs(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.getAuditLogs(+page, +limit);
  }
}
