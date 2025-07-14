import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { envConfig } from "./env-config";

export interface HttpRequestOptions
  extends Omit<AxiosRequestConfig, "url" | "method"> {
  requireAuth?: boolean;
}

// todo: move to packages/core
export class HttpClient {
  private axiosInstance: AxiosInstance;

  constructor(baseURL?: string) {
    this.axiosInstance = axios.create({
      baseURL: baseURL || envConfig.apiBaseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async get<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    const { requireAuth, ...axiosOptions } = options;

    const response = await this.axiosInstance.get(url, axiosOptions);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: unknown,
    options: HttpRequestOptions = {}
  ): Promise<T> {
    const { requireAuth, ...axiosOptions } = options;

    const response = await this.axiosInstance.post(url, data, axiosOptions);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: unknown,
    options: HttpRequestOptions = {}
  ): Promise<T> {
    const { requireAuth, ...axiosOptions } = options;

    const response = await this.axiosInstance.put(url, data, axiosOptions);
    return response.data;
  }

  async delete<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    const { requireAuth, ...axiosOptions } = options;

    const response = await this.axiosInstance.delete(url, axiosOptions);
    return response.data;
  }
}

export const httpClient = new HttpClient();
