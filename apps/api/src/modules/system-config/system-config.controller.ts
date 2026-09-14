import {
  Controller,
  Get,
  Put,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SystemConfigService, AccessMode } from './system-config.service';
import { Public } from '../auth/guards/jwt-auth.guard';

import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateAccessModeDto {
  @IsNotEmpty()
  @IsIn(['FREE', 'SUBSCRIPTION'])
  mode!: AccessMode;
}

@ApiTags('System Configuration & Access Mode')
@Controller()
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Public()
  @Get('app-config/access-mode')
  @ApiOperation({
    summary: 'Public endpoint returning current platform access mode (FREE vs SUBSCRIPTION)',
  })
  async getAccessMode() {
    return this.systemConfigService.getAccessMode();
  }

  @Public()
  @Put('admin/app-config/access-mode')
  @ApiOperation({
    summary: 'Admin toggle to switch between FREE access and SUBSCRIPTION enforced mode',
  })
  async setAccessMode(@Body() body: UpdateAccessModeDto) {
    if (!body || (body.mode !== 'FREE' && body.mode !== 'SUBSCRIPTION')) {
      throw new BadRequestException("Mode must be either 'FREE' or 'SUBSCRIPTION'");
    }
    return this.systemConfigService.setAccessMode(body.mode);
  }
}
