import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { AccessService } from './access.service.js';
import { ValidateAccessDto } from './dto/validate-access.dto.js';

@Controller('access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Post('validate')
  @HttpCode(200)
  validate(@Body() dto: ValidateAccessDto) {
    return this.accessService.validate(dto);
  }

  @Get('logs')
  findLogs(@Query('memberId') memberId?: string, @Query('locationId') locationId?: string) {
    return this.accessService.findLogs(memberId, locationId);
  }
}