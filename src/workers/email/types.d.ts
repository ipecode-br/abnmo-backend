export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface BuildEmailTemplateOutput {
  subject: string;
  html: string;
}
