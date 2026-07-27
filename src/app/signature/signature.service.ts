import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { EnvService } from '@/env/env.service';

interface ApiOptions extends Omit<RequestInit, 'body'> {
  data: Record<string, unknown>;
}

interface ApiResponse<T = unknown> {
  data?: T;
  errors?: T;
}

@Injectable()
export class SignatureService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly enabled: boolean;

  constructor(private readonly envService: EnvService) {
    this.apiUrl = this.envService.get('CLICKSIGN_API_URL');
    this.apiKey = this.envService.get('CLICKSIGN_API_KEY');
    this.enabled = this.envService.get('SIGNATURE_ENABLED');
  }

  async check(): Promise<boolean> {
    if (!this.enabled) {
      return true;
    }

    try {
      const url = new URL('envelopes?per_page=1', this.apiUrl);

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: this.apiKey,
          Accept: 'application/vnd.api+json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
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

    const responseData = (await response.json()) as ApiResponse<T>;

    if (!responseData.data) {
      throw new InternalServerErrorException('Signature API failed', {
        cause: { url: url.toString(), errors: responseData.errors },
      });
    }

    return responseData;
  }
}
