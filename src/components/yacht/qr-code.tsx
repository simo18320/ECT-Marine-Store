import { generateQrDataUrl } from "@/lib/qr/generate";

export async function QrCode({ url, label }: { url: string; label: string }) {
  const dataUrl = await generateQrDataUrl(url);

  return (
    <div className="inline-flex flex-col items-center gap-2 rounded-md border border-border p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={`QR code for ${label}`} width={160} height={160} />
      <p className="max-w-40 truncate text-center text-xs text-muted-foreground" title={url}>
        {url}
      </p>
    </div>
  );
}
