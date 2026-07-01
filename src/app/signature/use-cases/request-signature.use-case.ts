import { Injectable } from '@nestjs/common';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';

import { SignatureService } from '../signature.service';

interface RequestSignatureConfig {
  deadline?: string;
  filename: string;
  key: string;
  message?: string;
  name: string;
  notificationChannel?: 'email' | 'whatsapp';
  subject?: string;
}

interface RequestSignatureSigner {
  fullName: string;
  email: string;
  phone: string;
  cpf: string;
}

interface RequestSignatureTemplate {
  key: string;
  data: Record<string, string>;
}

interface RequestSignatureUseCaseInput {
  config: RequestSignatureConfig;
  signer: RequestSignatureSigner;
  template: RequestSignatureTemplate;
}

interface RequestSignatureUseCaseOutput {
  signatureId: string | null;
}

@Injectable()
@Log()
export class RequestSignatureUseCase {
  private readonly isEnabled: boolean;

  constructor(
    private readonly signatureService: SignatureService,
    private readonly envService: EnvService,
    private readonly logger: LogService,
  ) {
    this.isEnabled = this.envService.get('SIGNATURE_ENABLED');
  }

  async execute(
    input: RequestSignatureUseCaseInput,
  ): Promise<RequestSignatureUseCaseOutput> {
    if (!this.isEnabled) {
      this.logger.log('Signature disabled — signature request bypassed', {
        name: input.config.name,
        email: input.signer.email,
        cpf: input.signer.cpf,
      });
      return { signatureId: null };
    }

    const deadline = input.config.deadline ?? this.daysFromNow(2);
    const channel = input.config.notificationChannel ?? 'email';

    const envelope = await this.signatureService.api<{ id: string }>(
      '/envelopes',
      {
        method: 'POST',
        data: {
          type: 'envelopes',
          attributes: {
            auto_close: true,
            deadline_at: deadline,
            default_message: input.config.message,
            default_subject: input.config.subject,
            locale: 'pt-BR',
            name: input.config.name,
          },
        },
      },
    );
    const envelopeId = envelope.data.id;

    const signerRes = await this.signatureService.api<{ id: string }>(
      `/envelopes/${envelopeId}/signers`,
      {
        method: 'POST',
        data: {
          type: 'signers',
          attributes: {
            documentation: input.signer.cpf,
            email: input.signer.email,
            name: input.signer.fullName,
            phone_number: input.signer.phone,
            communicate_events: {
              signature_request: channel,
              signature_reminder: channel === 'whatsapp' ? 'none' : 'email',
              document_signed: channel === 'whatsapp' ? 'whatsapp' : 'email',
            },
          },
        },
      },
    );
    const signerId = signerRes.data.id;

    const document = await this.signatureService.api<{ id: string }>(
      `/envelopes/${envelopeId}/documents`,
      {
        method: 'POST',
        data: {
          type: 'documents',
          attributes: {
            template: input.template,
            metadata: { key: input.config.key },
            filename: `${input.config.filename}.docx`,
          },
        },
      },
    );
    const documentId = document.data.id;

    await this.signatureService.api(`/envelopes/${envelopeId}/requirements`, {
      method: 'POST',
      data: {
        type: 'requirements',
        attributes: { action: 'provide_evidence', auth: 'email' },
        relationships: {
          document: { data: { type: 'documents', id: documentId } },
          signer: { data: { type: 'signers', id: signerId } },
        },
      },
    });

    await this.signatureService.api(`/envelopes/${envelopeId}/requirements`, {
      method: 'POST',
      data: {
        type: 'requirements',
        attributes: { action: 'agree', role: 'sign' },
        relationships: {
          document: { data: { type: 'documents', id: documentId } },
          signer: { data: { type: 'signers', id: signerId } },
        },
      },
    });

    await this.signatureService.api(`/envelopes/${envelopeId}`, {
      method: 'PATCH',
      data: {
        type: 'envelopes',
        id: envelopeId,
        attributes: { status: 'running' },
      },
    });

    await this.signatureService.api(
      `/envelopes/${envelopeId}/signers/${signerId}/notifications`,
      {
        method: 'POST',
        data: { type: 'notifications', attributes: {} },
      },
    );

    this.logger.log('Signature requested', {
      envelopeId,
      channel,
      name: input.config.name,
      email: input.signer.email,
      cpf: input.signer.cpf,
    });

    return { signatureId: envelopeId };
  }

  private daysFromNow(days: number): string {
    const today = new Date();
    today.setDate(today.getDate() + days);
    return today.toISOString();
  }
}
