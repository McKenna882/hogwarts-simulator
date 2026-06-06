import { Controller, Get, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  getWallet(@CurrentUser('userId') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Get('transactions')
  getTransactions(
    @CurrentUser('userId') userId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.walletService.getTransactions(userId, +page, +limit);
  }

  @Post('signin')
  dailySignIn(@CurrentUser('userId') userId: string) {
    return this.walletService.dailySignIn(userId);
  }

  @Get('signin/check')
  checkSignIn(@CurrentUser('userId') userId: string) {
    return this.walletService.checkSignIn(userId);
  }
}
