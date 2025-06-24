import { Record } from "../generated/prisma/runtime/library";

const otpRequest: Record<string, number> = {};

export function canRequestOTP(phone: string): boolean {
  const now = Date.now();
  const lastRequest = otpRequest[phone];
  if (!lastRequest || now - lastRequest > 60000) {
    otpRequest[phone] = now;
    return true;
  }
  return false;
}
