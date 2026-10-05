import { Inject, Injectable } from '@nestjs/common';
import { getEnvConfig } from '../../shared/configs/env-configs';
import { Resend } from 'resend';
import { getBasicTemplate } from './templates/basic';
import { LogdashLogger } from '../../shared/logdash/aggregate-logger';
import { EMAILS_LOGGER } from '../../shared/logdash/logdash-tokens';
import { PersonalApiKeyCreatedEvent } from '../../personal-api-key/events/definitions/personal-api-key-created.event';
import { Action } from '../../personal-api-key/core/enums/action.enum';
import { Resource } from '../../personal-api-key/core/enums/resource.enum';

const RESOURCE_LABELS: Record<Resource, string> = {
  [Resource.Logs]: 'Logs',
  [Resource.Metrics]: 'Metrics',
  [Resource.Monitors]: 'Monitors',
  [Resource.Projects]: 'Services',
  [Resource.Clusters]: 'Domains',
  [Resource.Account]: 'Account',
};

const ACCESS_NOUNS = { clusters: 'domain', projects: 'service' } as const;

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

@Injectable()
export class ResendTemplatedEmailsService {
  constructor(@Inject(EMAILS_LOGGER) private readonly logger: LogdashLogger) {}

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

    if (error) {
      this.logger.error(`Failed to send email`, {
        errorMessage: error.message,
        error,
        to,
      });
    }
  }

  public async sendHttpMonitorAlertEmail(
    to: string,
    alert: {
      name: string;
      url: string;
      up: boolean;
      statusCode?: string;
      errorMessage?: string;
      dashboardUrl: string;
    },
  ): Promise<void> {
    const name = escapeHtml(alert.name);
    const subject = alert.up ? `🟢 ${alert.name} is up` : `🔴 ${alert.name} is down`;
    const details = alert.up
      ? `<b>${name}</b> is responding again.`
      : `<b>${name}</b> is not responding.<br/><br/>
<b>Status code:</b> ${escapeHtml(alert.statusCode ?? 'N/A')}<br/>
<b>Error:</b> ${escapeHtml(alert.errorMessage ?? 'N/A')}`;

    const { error } = await this.resend.emails.send({
      from: 'Logdash Alerts <alerts@updates.logdash.io>',
      to,
      subject,
      html: getBasicTemplate({
        header: subject,
        body: `${details}<br/><br/><b>Address:</b> ${escapeHtml(alert.url)}`,
        button: { text: 'Open dashboard', url: alert.dashboardUrl },
      }),
      headers: {
        'X-Entity-Ref-ID': `alert-${Date.now()}`,
      },
    });

    if (error) {
      this.logger.error(`Failed to send alert email`, {
        errorMessage: error.message,
      });
    }
  }

  public async sendPersonalApiKeyCreatedEmail(
    to: string,
    key: PersonalApiKeyCreatedEvent,
  ): Promise<void> {
    const scopes = key.scopes
      .filter((scope) => scope.action !== Action.None)
      .map((scope) => `${RESOURCE_LABELS[scope.resource]}: ${scope.action}`)
      .join(', ');
    const access =
      key.access.kind === 'all'
        ? 'All domains and services'
        : `${key.access.ids.length} ${ACCESS_NOUNS[key.access.kind]}${key.access.ids.length === 1 ? '' : 's'}`;
    const revokeUrl = `${getEnvConfig().app.url}/app/account/api-keys`;

    const body = `A new personal API key was created for your Logdash account.<br/><br/>

<b>Label:</b> ${escapeHtml(key.label)}<br/>
<b>Prefix:</b> ${key.prefix}<br/>
<b>Scopes:</b> ${scopes || 'None'}<br/>
<b>Access:</b> ${access}<br/>
<b>Expires:</b> ${key.expiresAt ? key.expiresAt.toUTCString() : 'No expiration'}<br/><br/>

Not you? Revoke it at <a href="${revokeUrl}">${revokeUrl}</a>`;

    const { error } = await this.resend.emails.send({
      from: 'LogDash <hello@updates.logdash.io>',
      to,
      subject: 'Logdash - new personal API key created',
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
    }
  }
}
