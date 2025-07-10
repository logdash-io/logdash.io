import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CustomDomainSerialized } from '../../src/custom-domain/core/entities/custom-domain.interface';
import { CreateCustomDomainBody } from '../../src/custom-domain/core/dto/create-custom-domain.body';
import { CustomDomainDnsServiceMock } from '../../src/custom-domain/dns/custom-domain-dns.service.mock';
import { CustomDomainDnsService } from '../../src/custom-domain/dns/custom-domain-dns.service';

export class CustomDomainUtils {
  private dnsServiceMock: CustomDomainDnsServiceMock;

  constructor(private readonly app: INestApplication) {
    this.dnsServiceMock = app.get(CustomDomainDnsService);
  }

  public async createCustomDomain(dto: {
    token: string;
    domain: string;
    publicDashboardId: string;
  }): Promise<CustomDomainSerialized> {
    const body: CreateCustomDomainBody = {
      domain: dto.domain,
    };

    const response = await request(this.app.getHttpServer())
      .post(`/public_dashboards/${dto.publicDashboardId}/custom_domains`)
      .set('Authorization', `Bearer ${dto.token}`)
      .send(body);

    return response.body;
  }

  public async getCustomDomainByPublicDashboardId(dto: {
    token: string;
    publicDashboardId: string;
  }): Promise<CustomDomainSerialized> {
    const response = await request(this.app.getHttpServer())
      .get(`/public_dashboards/${dto.publicDashboardId}/custom_domain`)
      .set('Authorization', `Bearer ${dto.token}`);

    return response.body;
  }

  public async deleteCustomDomain(dto: { token: string; customDomainId: string }): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/custom_domains/${dto.customDomainId}`)
      .set('Authorization', `Bearer ${dto.token}`);
  }

  public configureDomainMock(config: {
    domain: string;
    failCount: number;
    targetCname: string;
  }): void {
    this.dnsServiceMock.configureDomain(config);
  }

  public getDnsCallCount(domain: string): number {
    return this.dnsServiceMock.getCallCount(domain);
  }

  public resetDnsMock(): void {
    this.dnsServiceMock.reset();
  }
}
