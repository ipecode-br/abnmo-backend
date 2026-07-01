import { Injectable } from '@nestjs/common';

import { EnvService } from '@/env/env.service';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  data: Record<string, unknown>;
}

interface ApiResponse<T = unknown> {
  data: T;
}

@Injectable()
export class SignatureService {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(private readonly envService: EnvService) {
    this.apiUrl = this.envService.get('CLICKSIGN_API_URL');
    this.apiKey = this.envService.get('CLICKSIGN_API_KEY');
  }

  async api<T = unknown>(
    path: string,
    options: ApiOptions,
  ): Promise<ApiResponse<T>> {
    const { headers, data, ...rest } = options;
    const relativePath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(relativePath, this.apiUrl);

    const body = JSON.stringify({ data });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: this.apiKey,
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
        ...headers,
      },
      body,
      ...rest,
    });

    return response.json() as Promise<ApiResponse<T>>;
  }
}
