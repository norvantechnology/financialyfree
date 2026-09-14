import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto } from '@ff/types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Goal Engine')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  private getUserId(req: any): string {
    if (!req.user?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    return req.user.id;
  }

  @Get()
  @ApiOperation({ summary: 'List all active goals for current user' })
  async getGoals(@Req() req: any) {
    return this.goalsService.getGoals(this.getUserId(req));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new financial goal with SIP calculation' })
  async createGoal(@Req() req: any, @Body() dto: CreateGoalDto) {
    return this.goalsService.createGoal(this.getUserId(req), dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details & SIP recommendation for a specific goal' })
  async getGoalById(@Req() req: any, @Param('id') id: string) {
    return this.goalsService.getGoalById(this.getUserId(req), id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update goal parameters and recalculate SIP' })
  async updateGoal(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: Partial<CreateGoalDto>,
  ) {
    return this.goalsService.updateGoal(this.getUserId(req), id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate / remove a goal' })
  async deleteGoal(@Req() req: any, @Param('id') id: string) {
    return this.goalsService.deleteGoal(this.getUserId(req), id);
  }

  @Post('multi-allocation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate multi-goal proportional surplus allocation' })
  async calculateMultiAllocation(
    @Req() req: any,
    @Body('totalMonthlySurplus') totalMonthlySurplus: number,
  ) {
    return this.goalsService.calculateMultiGoalAllocation(
      this.getUserId(req),
      Number(totalMonthlySurplus) || 10000,
    );
  }

  @Get(':id/projection')
  @ApiOperation({ summary: 'Get year-by-year corpus projection and step-up schedule' })
  async getGoalProjection(
    @Req() req: any,
    @Param('id') id: string,
    @Query('stepUp') stepUp?: string,
  ) {
    const annualStepUpPct = stepUp ? parseFloat(stepUp) : 10;
    return this.goalsService.getGoalProjection(this.getUserId(req), id, annualStepUpPct);
  }
}
