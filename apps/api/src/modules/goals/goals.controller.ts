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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { AuthRequest } from '../auth/strategies/jwt.strategy';
import { CreateGoalDto } from '@ff/types';

@ApiTags('Goal Engine')
@ApiBearerAuth('access-token')
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active goals for current user' })
  async getGoals(@Req() req: AuthRequest) {
    return this.goalsService.getGoals(req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new financial goal with SIP calculation' })
  async createGoal(@Req() req: AuthRequest, @Body() dto: CreateGoalDto) {
    return this.goalsService.createGoal(req.user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details & SIP recommendation for a specific goal' })
  async getGoalById(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.goalsService.getGoalById(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update goal parameters and recalculate SIP' })
  async updateGoal(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: Partial<CreateGoalDto>,
  ) {
    return this.goalsService.updateGoal(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate / remove a goal' })
  async deleteGoal(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.goalsService.deleteGoal(req.user.id, id);
  }

  @Post('multi-allocation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate multi-goal proportional surplus allocation' })
  async calculateMultiAllocation(
    @Req() req: AuthRequest,
    @Body('totalMonthlySurplus') totalMonthlySurplus: number,
  ) {
    return this.goalsService.calculateMultiGoalAllocation(
      req.user.id,
      Number(totalMonthlySurplus) || 10000,
    );
  }

  @Get(':id/projection')
  @ApiOperation({ summary: 'Get year-by-year corpus projection and step-up schedule' })
  async getGoalProjection(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Query('stepUp') stepUp?: string,
  ) {
    const annualStepUpPct = stepUp ? parseFloat(stepUp) : 10;
    return this.goalsService.getGoalProjection(req.user.id, id, annualStepUpPct);
  }
}
