export function anonymizeEmail(email: string): string {
  const [local, domain] = email.split('@');
  const visible = local.slice(0, Math.min(local.length, 3));
  return `${visible}***@${domain}`;
}

export function anonymizeName(name: string): string {
  if (name.length <= 6) return name[0] + '***';
  return name.slice(0, 3) + '***' + name.slice(-3);
}

export function anonymizeCpf(cpf: string): string {
  return `${cpf.slice(0, 3)}***${cpf.slice(-2)}`;
}

export function anonymizePhone(phone: string): string {
  return `(${phone.slice(0, 2)}) ${phone.slice(2, 5)}**-****`;
}
