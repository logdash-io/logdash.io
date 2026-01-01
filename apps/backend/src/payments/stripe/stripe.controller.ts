import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  Query,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Public } from '../../auth/core/decorators/is-public';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { CheckoutResponse } from './dto/checkout.response';
import { CustomerPortalResponse } from './dto/customer-portal.response';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { STRIPE_LOGGER } from '../../shared/logdash/logdash-tokens';
import { StripeEventsHandler } from './stripe.events-handler';
import { StripeCheckoutService } from './stripe-checkout.service';
import { CheckoutQuery } from './dto/checkout.query';
import { UserReadService } from '../../user/read/user-read.service';
import { ChangePaidPlanBody } from './dto/upgrade-subscription.body';

@ApiTags('Payments (stripe)')
@Controller('payments/stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly stripeEventsHandler: StripeEventsHandler,
    private readonly stripeCheckoutService: StripeCheckoutService,
    @Inject(STRIPE_LOGGER) private readonly logger: LogdashLogger,
    private readonly userReadService: UserReadService,
  ) {}

  @Public()
  @Post('webhook')
  public async handleEvent(
    @Headers('stripe-signature') stripeSignature: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<void> {
    this.logger.log(`Received stripe webhook event`);

    const event = await this.stripeEventsHandler.decryptEvent(req.rawBody, stripeSignature);

    if (!event) {
      this.logger.error(`Failed to decrypt stripe webhook event`);
      throw new BadRequestException(`Failed to decrypt stripe webhook event`);
    }

    await this.stripeEventsHandler.handleEvent(event);
  }

  @ApiBearerAuth()
  @Get('checkout')
  public async getCheckoutUrl(
    @Query() query: CheckoutQuery,
    @CurrentUserId() userId: string,
  ): Promise<CheckoutResponse> {
    this.logger.log(`Checkout request received`, { userId, tier: query.tier });

    const user = await this.userReadService.readByIdOrThrow(userId);

    const isTrial = !user.paymentsMetadata?.trialUsed;

    const checkoutUrl = await this.stripeCheckoutService.getCheckoutUrl({
      userId,
      tier: query.tier,
      isTrial: isTrial,
    });

    return {
      checkoutUrl,
    };
  }

  @ApiBearerAuth()
  @Post('change_paid_plan')
  public async upgrade(
    @CurrentUserId() userId: string,
    @Body() body: ChangePaidPlanBody,
  ): Promise<void> {
    this.logger.log(`Change paid plan request received`, { userId, tier: body.tier });

    await this.stripeService.changePaidPlan(userId, body.tier);
  }

  @ApiBearerAuth()
  @Get('customer_portal')
  public async getCustomerPortalUrl(
    @CurrentUserId() userId: string,
  ): Promise<CustomerPortalResponse> {
    this.logger.log(`Customer portal request received`, { userId });

    const url = await this.stripeService.getCustomerPortalUrl(userId);
    return {
      customerPortalUrl: url,
    };
  }
}
