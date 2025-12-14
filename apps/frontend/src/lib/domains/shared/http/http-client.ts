import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { getCookieValue } from '$lib/domains/shared/utils/client-cookies.utils';
import { ACCESS_TOKEN_COOKIE_NAME } from '$lib/domains/shared/utils/cookies.utils';
import { envConfig } from '$lib/domains/shared/utils/env-config';

export interface HttpRequestOptions extends Omit<
  AxiosRequestConfig,
  'url' | 'method'
> {
  requireAuth?: boolean;
  customToken?: string;
}

export class HttpClient {
  private axiosInstance: AxiosInstance;
  private unauthorizedHandlers: (() => void)[] = [];

  constructor(baseURL?: string) {
    this.axiosInstance = axios.create({
      baseURL: baseURL || envConfig.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Response interceptor to handle auth errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.triggerUnauthorized();
        }
        return Promise.reject(error);
      },
    );
  }

  private getAccessToken(): string | undefined {
    if (typeof document === 'undefined') {
      return undefined;
    }
    return getCookieValue(ACCESS_TOKEN_COOKIE_NAME, document.cookie);
  }

  private triggerUnauthorized(): void {
    for (const handler of this.unauthorizedHandlers) {
      handler();
    }
  }

  private buildHeaders(options: HttpRequestOptions): Record<string, string> {
    const headers: Record<string, string> = {};

    // Copy existing headers, converting to strings
    if (options.headers) {
      const existingHeaders = options.headers;
      if (typeof existingHeaders === 'object' && existingHeaders !== null) {
        Object.entries(existingHeaders).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            headers[key] = String(value);
          }
        });
      }
    }

    const requireAuth = options.requireAuth ?? true;
    const customToken = options.customToken;

    if (requireAuth || customToken) {
      const token = customToken || this.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  registerUnauthorizedHandler(handler: () => void): () => void {
    this.unauthorizedHandlers.push(handler);
    return () => {
      this.unauthorizedHandlers = this.unauthorizedHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  async get<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    const { requireAuth, customToken, ...axiosOptions } = options;
    const headers = this.buildHeaders(options);

    const response: AxiosResponse<T> = await this.axiosInstance.get(url, {
      ...axiosOptions,
      headers,
    });
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    options: HttpRequestOptions = {},
  ): Promise<T> {
    const { requireAuth, customToken, ...axiosOptions } = options;
    const headers = this.buildHeaders(options);

    const response: AxiosResponse<T> = await this.axiosInstance.post(
      url,
      data,
      {
        ...axiosOptions,
        headers,
      },
    );
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    options: HttpRequestOptions = {},
  ): Promise<T> {
    const { requireAuth, customToken, ...axiosOptions } = options;
    const headers = this.buildHeaders(options);

    const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, {
      ...axiosOptions,
      headers,
    });
    return response.data;
  }

  async delete<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    const { requireAuth, customToken, ...axiosOptions } = options;
    const headers = this.buildHeaders(options);

    const response: AxiosResponse<T> = await this.axiosInstance.delete(url, {
      ...axiosOptions,
      headers,
    });
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: unknown,
    options: HttpRequestOptions = {},
  ): Promise<T> {
    const { requireAuth, customToken, ...axiosOptions } = options;
    const headers = this.buildHeaders(options);

    const response: AxiosResponse<T> = await this.axiosInstance.patch(
      url,
      data,
      {
        ...axiosOptions,
        headers,
      },
    );
    return response.data;
  }
}

// Global HTTP client instance
export const httpClient = new HttpClient();
