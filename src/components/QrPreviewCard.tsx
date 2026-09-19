import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Smartphone, Copy, Check } from "lucide-react";

export default function QrPreviewCard() {
  const url = `${window.location.origin}/m`;
  const isLocal = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isLocal) return;
    QRCode.toDataURL(url, { margin: 1, width: 160, color: { dark: "#08141D", light: "#F3F6F8" } }).then(setDataUrl).catch(() => setDataUrl(null));
  }, [url, isLocal]);

  const copy = () => { navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); };

  return (
    <div>
      <div className="text-sm font-semibold text-ink mb-2 flex items-center gap-1.5"><Smartphone size={14} /> Mobile preview</div>
      {isLocal ? (
        <div className="rounded-xl border border-border bg-field p-3.5">
          <div className="text-xs text-priority font-medium">Configuration needed</div>
          <p className="text-[11px] text-faint mt-1 leading-relaxed">A QR code needs a publicly reachable origin — localhost isn't reachable from a phone. Once deployed, this card generates a real QR to the compact preview.</p>
          <button onClick={copy} className="mt-2 flex items-center gap-1.5 text-[11px] text-action hover:underline">{copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied" : "Copy local preview link"}</button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface p-3.5 flex items-center gap-3">
          {dataUrl ? <img src={dataUrl} alt="QR code to the mobile preview" className="w-24 h-24 rounded-lg" /> : <div className="w-24 h-24 rounded-lg bg-field animate-pulse" />}
          <div className="min-w-0">
            <div className="text-xs text-ink">Scan for the compact assessment view</div>
            <button onClick={copy} className="mt-1 flex items-center gap-1.5 text-[11px] text-action hover:underline">{copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied" : "Copy link"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
