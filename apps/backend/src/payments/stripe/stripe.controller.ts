import {
  Controller,
  Get,
  Headers,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Public } from '../../auth/core/decorators/is-public';
import { StripeService } from './stripe.service';
import { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../../auth/core/decorators/current-user-id.decorator';
import { UserReadService } from '../../user/read/user-read.service';
import { AccountClaimStatus } from '../../user/core/enum/account-claim-status.enum';
import { CheckoutResponse } from './dto/checkout.response';
import { CustomerPortalResponse } from './dto/customer-portal.response';
import { Logger } from '@logdash/js-sdk';

@ApiTags('Payments (stripe)')
@Controller('payments/stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly userReadService: UserReadService,
    private readonly logger: Logger,
  ) {}

  @Public()
  @Post('webhook')
  public async handleEvent(
    @Headers('stripe-signature') stripeSignature: string,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<void> {
    this.logger.log(`Received stripe webhook event`);

    const event = await this.stripeService.getEvent(
      req.rawBody,
      stripeSignature,
    );

    if (event.type === 'invoice.payment_succeeded') {
      await this.stripeService.handlePaymentSucceeded(
        event.data.object.customer_email,
        event.data.object.customer,
        event.data.object.lines.data[0].price.id,
      );
      return;
    }

    if (event.type === 'customer.subscription.deleted') {
      //asd
      await this.stripeService.handleSubscriptionDeleted(event.data.object);
      return;
    }
  }

  @ApiBearerAuth()
  @Get('checkout')
  public async getCheckoutUrl(
    @CurrentUserId() userId: string,
  ): Promise<CheckoutResponse> {
    const user = await this.userReadService.readById(userId);

    if (!user) {
      this.logger.error(
        `User not found while trying to initiate stripe checkout`,
        { userId },
      );
      throw new Error(
        `User not found while trying to initiate stripe checkout`,
      );
    }

    if (user.accountClaimStatus !== AccountClaimStatus.Claimed) {
      this.logger.error(
        `User account not claimed while trying to initiate stripe checkout`,
        { userId },
      );
      throw new Error(
        `User account not claimed while trying to initiate stripe checkout`,
      );
    }

    return {
      checkoutUrl: await this.stripeService.getPaymentSessionUrl(user.email),
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
