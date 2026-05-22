/**
 * Optimized base template for maximum email client compatibility
 * Follows best practices for Gmail, Outlook, Apple Mail, etc.
 */

/**
 * Optimized base template for maximum email client compatibility
 * @param config - Email settings, including title and preheader
 * @param content - Main email content
 * @param data - Additional data for template personalization
 */
export function createEmailTemplate({
  config,
  content,
  data = {},
}: {
  config: { title: string; preheader?: string };
  content: string | string[];
  data?: { headerImageUrl?: string; headerImageAlt?: string };
}): string {
  const {
    headerImageUrl = `${process.env.CDN_PUBLIC_URL}/brand/email-header-default.png`,
    headerImageAlt = 'SVM | ABNMO',
  } = data;

  const footerContent =
    'O SVM é um sistema de gestão e acompanhamento de pacientes da <a href="https://abnmo.org" style="color: #333333; text-decoration: underline;" target="_blank" rel="noopener noreferrer">ABNMO</a>.';

  const preheaderText = config.preheader
    ? `
		<!-- Preheader text -->
		<div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; font-size: 1px; color: #ffffff; line-height: 1px;">
			${config.preheader}
		</div>
		<!-- End preheader text -->
	`
    : '';

  const body = Array.isArray(content) ? content.join('') : content;

  return `<!DOCTYPE html>
		<html lang="pt-BR" dir="ltr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
		<head>
			<meta charset="utf-8">
			<meta http-equiv="X-UA-Compatible" content="IE=edge">
			<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=yes">
			<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
			<meta name="x-apple-disable-message-reformatting">
			<meta name="color-scheme" content="light dark">
			<meta name="supported-color-schemes" content="light dark">
			<title>${config.title}</title>
			<!--[if mso]>
			<noscript>
				<xml>
					<o:OfficeDocumentSettings>
						<o:PixelsPerInch>96</o:PixelsPerInch>
					</o:OfficeDocumentSettings>
				</xml>
			</noscript>
			<![endif]-->
			<style>
				/* Reset styles */
				body, table, td, p, a, li, blockquote {
					-webkit-text-size-adjust: 100%;
					-ms-text-size-adjust: 100%;
				}
				table, td {
					mso-table-lspace: 0pt;
					mso-table-rspace: 0pt;
				}
				img {
					-ms-interpolation-mode: bicubic;
					border: 0;
					outline: none;
					text-decoration: none;
				}
				.email-link:hover {
					color: #000000 !important;
				}

				/* Client-specific styles */
				.ReadMsgBody { width: 100%; }
				.ExternalClass { width: 100%; }
				.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }

				/* Dark mode support */
				:root {
					color-scheme: light dark;
					supported-color-schemes: light dark;
				}
			</style>
		</head>
		<body style="margin: 0; padding: 0; background-color: #f6f8fa; font-family: Arial, sans-serif; padding: 24px 0px;" bgcolor="#f6f8fa">
		${preheaderText}

			<!-- Email container table -->
			<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f6f8fa;" bgcolor="#f6f8fa">
				<tr>
					<td align="center">

						<!-- Main content table with 600px max width -->
						<table border="0" cellpadding="0" cellspacing="0" width="600" role="presentation" style="background-color: #ffffff; margin: auto !important; max-width: 600px; width: 100% !important;" bgcolor="#ffffff">

							<!-- Header image -->
							<tr>
								<td style="background-color: #036246; padding: 0;">
									<img src="${headerImageUrl}" alt="${headerImageAlt}" width="600" style="display: block; width: 100%; max-width: 600px; height: auto; border: 0; outline: none; text-decoration: none;" />
								</td>
							</tr>

							<!-- Main content -->
							<tr>
								<td style="padding: 24px; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;">
									${body}
								</td>
							</tr>

							<!-- Footer -->
							<tr>
							  <td style="background-color: #f6f8fa; padding: 24px;">
									<table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
										<tr>
										  <p style="text-align: center; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #999999;">${footerContent}</p>
											</td>
										</tr>
									</table>
								</td>
							</tr>

						</table>
					</td>
				</tr>
			</table>
		</body>
	</html>`;
}

/**
 * @param text Text rendered in the heading
 * @param style Additional style for the heading
 * @returns `<p style="${defaultStyle}${style}">${text}</p>`
 */
export function heading(text: string, style = ''): string {
  const defaultStyle =
    'font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #036246';
  return `<p style="${defaultStyle}${style}">${text}</p>`;
}

/**
 * @param text Paragraph text
 * @param style Additional style for the paragraph
 * @returns `<p style="${defaultStyle}${style}">${text}</p>`
 */
export function p(text: string, style = ''): string {
  const defaultStyle =
    'margin: 16px 0; font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333;';
  return `<p style="${defaultStyle}${style}">${text}</p>`;
}

/**
 *
 * @param text Button text
 * @param url Button URL
 * @param backgroundColor Button background color
 * @param textColor Button text color
 * @param padding Button inner spacing
 */
export function button(
  text: string,
  url: string,
  backgroundColor = '#036246',
  textColor = '#FFFFFF',
  padding = '12px 20px',
): string {
  return `
		<table border="0" cellspacing="0" cellpadding="0" role="presentation" width="100%" style="margin: 16px 0;">
			<tr>
				<td align="center" bgcolor="${backgroundColor}" style="
					background-color: ${backgroundColor};
					border-radius: 12px;
					padding: 0;
				">
					<a href="${url}" target="_blank" rel="noopener noreferrer" style="
						background-color: ${backgroundColor};
						border-radius: 10px;
						box-sizing: border-box;
						color: ${textColor};
						display: block;
						font-family: Arial, sans-serif;
						font-size: 16px;
						font-weight: bold;
						padding: ${padding};
						text-decoration: none;
						width: 100%;
					">
						${text}
					</a>
				</td>
			</tr>
		</table>
	`;
}
