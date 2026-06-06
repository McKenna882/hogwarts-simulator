import { Controller, Get, Put, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser('userId') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Put('profile')
  updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }
}
