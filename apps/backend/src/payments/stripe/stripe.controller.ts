import {
  BadRequestException,
  Controller,
  Get,
  Headers,
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
import { Logger } from '@logdash/js-sdk';
import { StripeEventsHandler } from './stripe.events-handler';
import { StripeCheckoutService } from './stripe-checkout.service';
import { CheckoutQuery } from './dto/checkout.query';
import { UserReadService } from '../../user/read/user-read.service';

@ApiTags('Payments (stripe)')
@Controller('payments/stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly stripeEventsHandler: StripeEventsHandler,
    private readonly stripeCheckoutService: StripeCheckoutService,
    private readonly logger: Logger,
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

    await this.stripeEventsHandler.handleEvent(event);
  }

  @ApiBearerAuth()
  @Get('checkout')
  public async getCheckoutUrl(
    @Query() query: CheckoutQuery,
    @CurrentUserId() userId: string,
  ): Promise<CheckoutResponse> {
    const user = await this.userReadService.readByIdOrThrow(userId);

    if (query.isTrial && user.paymentsMetadata?.usedTrial) {
      throw new BadRequestException('User has already used a trial');
    }

    const checkoutUrl = await this.stripeCheckoutService.getCheckoutUrl({
      userId,
      tier: query.tier,
      isTrial: query.isTrial,
    });

    return {
      checkoutUrl,
    };
  }

  @ApiBearerAuth()
  @Get('customer_portal')
  public async getCustomerPortalUrl(
    @CurrentUserId() userId: string,
  ): Promise<CustomerPortalResponse> {
    const url = await this.stripeService.getCustomerPortalUrl(userId);
    return {
      customerPortalUrl: url,
    };
  }
}
