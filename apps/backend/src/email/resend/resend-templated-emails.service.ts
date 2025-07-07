import { Injectable } from '@nestjs/common';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { Resend } from 'resend';
import { getBasicTemplate } from './templates/basic';
import { Logger } from '@logdash/js-sdk';

@Injectable()
export class ResendTemplatedEmailsService {
  constructor(private readonly logger: Logger) {}

  private resend = new Resend(getEnvConfig().resend.apiKey);

  public async sendWelcomeEmail(to: string): Promise<void> {
    const body = `<b>Logdash is an observability tool built for people who’d rather fix bugs than fight dashboards:</b><br/><br/>

✅ Logs instrumentation – feel your system whisper to you<br/>
✅ Metrics – turn key numbers in your system into actionable KPIs<br/>
✅ Monitoring – uptime checks + alerts when your service goes down<br/><br/>

Also — I’d love to hear from you. Got a feature idea, need help setting things up, or found something odd? Just hit reply and let me know.<br/><br/>

Simon Gracki<br/>
CEO, Logdash<br/><br/>

P.S. What brought you to Logdash?<br/><br/>
    `;

    const header = 'Welcome to Logdash!';

    const { error } = await this.resend.emails.send({
      from: 'LogDash <hello@updates.logdash.io>',
      to,
      subject: header,
      html: getBasicTemplate({
        body,
      }),
      replyTo: 'logdash.contact@gmail.com',
      headers: {
        'X-Entity-Ref-ID': `user-${Date.now()}`,
      },
    });

    if (error) {
      this.logger.error(`Failed to send email`, {
        errorMessage: error.message,
        error,
        to,
      });
      return;
    }
  }

  public async sendPaidPlanWelcomeEmail(to: string): Promise<void> {
    const body = `Hey,<br/><br/>

Just wanted to say thanks for subscribing to Logdash — really appreciate it.<br/><br/>

If you ever have feedback, questions, or feel something could work better, just reply here. Always happy to chat.<br/><br/>

Also, if you hang out on Discord, we’d love to have you join us there. It’s where we talk to users, share updates, and get quick feedback. Just let me know your nickname and I’ll create a channel for us.<br/><br/>

Simon Gracki<br/>
CEO, Logdash<br/><br/>

P.S. I’d love to know — what made you decide to give Logdash a try?`;

    const { error } = await this.resend.emails.send({
      from: 'LogDash <hello@updates.logdash.io>',
      to,
      subject: 'Logdash - thanks again!',
      html: getBasicTemplate({
        body,
      }),
      replyTo: 'logdash.contact@gmail.com',
      headers: {
        'X-Entity-Ref-ID': `user-${Date.now()}`,
      },
    });
  }
}
