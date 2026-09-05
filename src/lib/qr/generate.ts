import QRCode from "qrcode";

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 240 });
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function equipmentQrUrl(token: string): string {
  return `${getAppUrl()}/equipment/${token}`;
}

export function filterQrUrl(token: string): string {
  return `${getAppUrl()}/filters/${token}`;
}
