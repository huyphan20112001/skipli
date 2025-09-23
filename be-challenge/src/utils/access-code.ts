export function generateAccessCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidAccessCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

export function generateAccessCodeWithExpiry(): {
  code: string;
  expiresAt: Date;
} {
  const code = generateAccessCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  return {
    code,
    expiresAt,
  };
}

export function isAccessCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
