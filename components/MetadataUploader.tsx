'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, UploadCloud, X } from 'lucide-react';
import { Button } from '@/components/ui/Form';

type Props = {
  /** Full agent name, e.g. mcp://sentiment.text-analysis.acme.v1.0 (disabled until valid). */
  name: string | null;
  endpoint: string;
  onUploaded: (uri: string) => void;
};

const MAX = 2 * 1024 * 1024;

/** Drag-and-drop logo + description → pinned to IPFS → fills the Metadata URI field. */
export function MetadataUploader({ name, endpoint, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pick = (f: File | undefined) => {
    setMessage(null);
    if (!f) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(f.type)) return setMessage({ ok: false, text: 'Use a PNG, JPEG, WebP or GIF.' });
    if (f.size > MAX) return setMessage({ ok: false, text: 'Logo must be 2 MB or smaller.' });
    setFile(f);
  };

  const upload = async () => {
    if (!name) return;
    setBusy(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append('name', name);
      body.append('description', description);
      body.append('endpoint', endpoint);
      if (file) body.append('image', file);
      const res = await fetch('/api/pin', { method: 'POST', body });
      const json = (await res.json()) as { uri?: string; error?: string };
      if (!res.ok || !json.uri) throw new Error(json.error ?? 'Upload failed');
      onUploaded(json.uri);
      setMessage({ ok: true, text: `Uploaded. Metadata URI filled in: ${json.uri}` });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Upload failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-line bg-fg/[0.02] p-4">
      <p className="eyebrow">Logo &amp; description · pinned to IPFS via Pinata</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-[140px_1fr]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            pick(e.dataTransfer.files[0]);
          }}
          onClick={() => input.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
          className={`relative grid h-[140px] cursor-pointer place-items-center overflow-hidden border-2 border-dashed text-center transition-colors ${
            drag ? 'border-accent bg-accent/10' : 'border-line-strong hover:border-accent/60'
          }`}
        >
          {preview && file ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Logo preview" className="h-full w-full object-cover" />
              <button
                type="button"
                aria-label="Remove logo"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <div className="px-3 text-xs text-muted">
              <ImagePlus className="mx-auto mb-2 h-6 w-6" />
              Drag a logo here or click
              <br />
              PNG/JPEG/WebP · ≤ 2 MB
            </div>
          )}
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        <div className="flex flex-col gap-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="What does this agent do? (optional)"
            className="w-full resize-none border border-line bg-fg/[0.03] px-3.5 py-2.5 font-mono text-sm outline-none placeholder:text-muted/60 focus:border-accent/60"
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="ghost" onClick={upload} loading={busy} disabled={!name}>
              <UploadCloud className="h-4 w-4" /> Upload to IPFS
            </Button>
            {!name && <span className="text-xs text-muted">Fill in the name parts first.</span>}
          </div>
        </div>
      </div>
      {message && <p className={`mt-3 break-all text-xs ${message.ok ? 'text-ok' : 'text-bad'}`}>{message.text}</p>}
    </div>
  );
}
