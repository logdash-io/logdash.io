import { SetMetadata } from '@nestjs/common';

export const DEMO_ENDPOINT_KEY = 'demo_endpoint';
export const DemoEndpoint = () => SetMetadata(DEMO_ENDPOINT_KEY, true);
