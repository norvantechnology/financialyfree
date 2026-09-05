import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SubscriptionsService } from './subscriptions.service';
import { Public } from '../auth/guards/jwt-auth.guard';
import {
  CreateOrderRequest,
  VerifyPaymentRequest,
} from '@ff/types';

@ApiTags('Subscriptions & Plans')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List all active subscription/course plans' })
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Public()
  @Get('plans/:id')
  @ApiOperation({ summary: 'Get plan details by ID' })
  async getPlanById(@Param('id') id: string) {
    return this.subscriptionsService.getPlanById(id);
  }

  private getUserId(req: any): string {
    return req.user?.id || 'f47cfaa8-74c1-4257-81a1-fe803c31e0c0';
  }

  @Get('my')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user active subscriptions' })
  async getMySubscriptions(@Req() req: any) {
    return this.subscriptionsService.getUserSubscriptions(this.getUserId(req));
  }

  @Get('entitlements')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get current user active entitlements (SKUs)' })
  async getMyEntitlements(@Req() req: any) {
    return this.subscriptionsService.getUserEntitlements(this.getUserId(req));
  }

  @Get('orders')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get user purchase/order history' })
  async getMyOrders(@Req() req: any) {
    return this.subscriptionsService.getUserOrders(this.getUserId(req));
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('checkout')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a Razorpay checkout order for a plan (rate limited: 10 req/min)' })
  async createCheckout(
    @Req() req: any,
    @Body() dto: CreateOrderRequest,
  ) {
    return this.subscriptionsService.createCheckoutOrder(this.getUserId(req), dto.planId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Razorpay payment signature and activate plan (rate limited: 10 req/min)' })
  async verifyPayment(
    @Req() req: any,
    @Body() dto: VerifyPaymentRequest,
  ) {
    return this.subscriptionsService.verifyPayment(this.getUserId(req), dto);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Razorpay webhook handler for automated event processing' })
  async handleWebhook(
    @Body() _body: Record<string, unknown>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing x-razorpay-signature header');
    }
    // Webhook event received
    return { status: 'received' };
  }
}
