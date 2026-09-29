/**
 * Téléversement du support d'une ressource.
 *
 * C'est ce qui manquait : l'ancien formulaire demandait un titre, un niveau et
 * un type, sans jamais permettre de joindre le fichier réel. Sans support, une
 * ressource n'existe pas pour l'élève.
 */
import React, { useRef, useState } from 'react';
import { CheckCircle2, FileAudio, FileText, FileVideo, Trash2, UploadCloud } from 'lucide-react';
import { readUpload } from '../../../../lib/api/content';
import { formatBytes, MAX_UPLOAD_BYTES } from '../../../../lib/data/mobile-sections';
import type { UploadedFile } from '../../../../lib/data/types';
import { AppError } from '../../../../lib/errors';
import { IconButton } from '../../../ui/Button';

interface FileUploadFieldProps {
  label: string;
  hint?: string;
  accept: string;
  required?: boolean;
  value: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  error?: string;
}

function iconFor(mimeType: string) {
  if (mimeType.startsWith('audio/')) return <FileAudio size={20} />;
  if (mimeType.startsWith('video/')) return <FileVideo size={20} />;
  return <FileText size={20} />;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label, hint, accept, required, value, onChange, error,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const accept_ = accept;

  const handleFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setLocalError(null);
    try {
      onChange(await readUpload(file));
    } catch (e) {
      setLocalError(e instanceof AppError ? e.message : 'Téléversement impossible.');
      onChange(null);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const shown = error ?? localError;

  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label className="text-xs font-semibold text-[#8A8173]">
        {label}
        {required && <span className="text-[#C0512F]"> *</span>}
      </label>

      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#DDF0E6] border border-[#B9E2CC]">
          <span className="w-10 h-10 rounded-lg bg-white border border-[#B9E2CC] text-[#1F6B47] flex items-center justify-center shrink-0">
            {iconFor(value.mimeType)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[#1F6B47] truncate">{value.name}</p>
            <p className="text-[11px] text-[#1F6B47]/75">
              {formatBytes(value.size)} · {value.mimeType || 'type inconnu'}
            </p>
          </div>
          <CheckCircle2 size={16} className="text-[#2F9E6E] shrink-0" />
          <IconButton label={`Retirer ${value.name}`} tone="danger" onClick={() => onChange(null)}>
            <Trash2 size={15} />
          </IconButton>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          disabled={busy}
          className={`w-full flex flex-col items-center justify-center gap-1.5 px-4 py-6 rounded-xl border-[1.5px] border-dashed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
            shown
              ? 'border-[#B3261E] bg-[#FBE9E7]/40 text-[#B3261E]'
              : dragging
                ? 'border-[#C0512F] bg-[#FBEDE6] text-[#C0512F]'
                : 'border-[#D8CEBC] bg-[#FAF7F2] text-[#8A8173] hover:border-[#C7BDA8] hover:bg-[#F5F1EA]'
          } disabled:cursor-wait`}
        >
          {busy ? (
            <>
              <span className="mbeng-spinner-sm" />
              <span className="text-xs font-bold">Lecture du fichier…</span>
            </>
          ) : (
            <>
              <UploadCloud size={22} />
              <span className="text-xs font-bold">Glisse ton fichier ici ou clique pour parcourir</span>
              <span className="text-[11px]">
                {hint ?? `Jusqu'à ${MAX_UPLOAD_BYTES / 1024 / 1024} Mo`}
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept_}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {shown && <p className="text-[11.5px] text-[#B3261E] font-medium">{shown}</p>}
    </div>
  );
};
