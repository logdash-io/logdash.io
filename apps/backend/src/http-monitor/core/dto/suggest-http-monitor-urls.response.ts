import { ApiProperty } from '@nestjs/swagger';

export class SuggestHttpMonitorUrlsResponse {
  @ApiProperty({
    type: [String],
    description: 'Related addresses that answer, like an api subdomain or a health path',
    example: ['https://api.example.com/', 'https://example.com/health'],
  })
  urls: string[];
}
