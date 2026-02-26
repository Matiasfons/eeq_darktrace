'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Upload, FileJson, CheckCircle2, AlertTriangle, Loader2, Trash2, Database } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const VALID_SECRET = process.env.NEXT_PUBLIC_ADMIN_SECRET || 'dt-eeq-upload-2026';
const BATCH_SIZE = 500;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadStats {
  total: number;
  processed: number;
  inserted: number;
  updated: number;
  errors: number;
  phase: 'idle' | 'parsing' | 'uploading' | 'done' | 'error';
  message: string;
}

export default function AdminUploadPage() {
  const params = useParams();
  const router = useRouter();
  const secret = params.secret as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [stats, setStats] = useState<UploadStats>({
    total: 0, processed: 0, inserted: 0, updated: 0, errors: 0,
    phase: 'idle', message: '',
  });
  const [dbCount, setDbCount] = useState<number | null>(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (secret === VALID_SECRET) {
      setAuthorized(true);
      fetchDbCount();
    }
  }, [secret]);

  const fetchDbCount = async () => {
    const { count, error } = await supabase
      .from('antigena_actions')
      .select('*', { count: 'exact', head: true });
    if (!error && count !== null) setDbCount(count);
  };

  const processFile = useCallback(async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setStats((s) => ({ ...s, phase: 'error', message: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 10MB.` }));
      return;
    }

    if (!file.name.endsWith('.json')) {
      setStats((s) => ({ ...s, phase: 'error', message: 'Only .json files are allowed.' }));
      return;
    }

    setStats({ total: 0, processed: 0, inserted: 0, updated: 0, errors: 0, phase: 'parsing', message: 'Reading and parsing JSON...' });

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        setStats((s) => ({ ...s, phase: 'error', message: 'JSON must be an array of action objects.' }));
        return;
      }

      // Validate first item has expected fields
      if (data.length > 0 && !data[0].codeid) {
        setStats((s) => ({ ...s, phase: 'error', message: 'Invalid format: objects must have a "codeid" field.' }));
        return;
      }

      const total = data.length;
      setStats((s) => ({ ...s, total, phase: 'uploading', message: `Uploading ${total} actions in batches of ${BATCH_SIZE}...` }));

      let inserted = 0;
      let updated = 0;
      let errors = 0;

      // Process in batches
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);

        const rows = batch.map((item: Record<string, unknown>) => ({
          codeid: item.codeid,
          did: item.did,
          ip: item.ip || '',
          ips: item.ips || [],
          action: item.action || '',
          manual: item.manual || false,
          triggerer: item.triggerer || null,
          label: item.label || '',
          detail: item.detail || '',
          score: item.score || 0,
          pbid: item.pbid || 0,
          model: item.model || '',
          modeluuid: item.modeluuid || '',
          start: item.start || 0,
          expires: item.expires || 0,
          blocked: item.blocked || false,
          active: item.active || false,
          cleared: item.cleared || false,
        }));

        const { error, data: result } = await supabase
          .from('antigena_actions')
          .upsert(rows, { onConflict: 'codeid' })
          .select('codeid');

        if (error) {
          errors += batch.length;
          console.error('Batch error:', error);
        } else {
          // All upserted successfully (can't distinguish insert vs update with upsert)
          inserted += (result?.length || batch.length);
        }

        const processed = Math.min(i + BATCH_SIZE, data.length);
        setStats((s) => ({
          ...s,
          processed,
          inserted,
          updated,
          errors,
          message: `Processing batch ${Math.ceil((i + 1) / BATCH_SIZE)} of ${Math.ceil(data.length / BATCH_SIZE)}...`,
        }));
      }

      setStats((s) => ({
        ...s,
        processed: total,
        phase: 'done',
        message: `Upload complete. ${inserted} actions upserted, ${errors} errors.`,
      }));

      fetchDbCount();
    } catch (err) {
      setStats((s) => ({
        ...s,
        phase: 'error',
        message: `Parse error: ${err instanceof Error ? err.message : 'Invalid JSON'}`,
      }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const handlePurge = async () => {
    if (!confirm('Are you sure you want to DELETE ALL actions from the database? This cannot be undone.')) return;
    setStats((s) => ({ ...s, phase: 'uploading', message: 'Purging all records...' }));
    const { error } = await supabase.from('antigena_actions').delete().neq('codeid', -1);
    if (error) {
      setStats((s) => ({ ...s, phase: 'error', message: `Purge failed: ${error.message}` }));
    } else {
      setStats({ total: 0, processed: 0, inserted: 0, updated: 0, errors: 0, phase: 'done', message: 'All records purged.' });
      fetchDbCount();
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0b0c10] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-[#e2e8f0] mb-2">Unauthorized</h1>
          <p className="text-sm text-[#64748b]">Invalid access token.</p>
        </div>
      </div>
    );
  }

  const progress = stats.total > 0 ? (stats.processed / stats.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#e2e8f0]">
      {/* Header */}
      <div className="border-b border-[#2c2d36] bg-[#13141a]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database size={20} className="text-[#7b61ff]" />
            <div>
              <h1 className="text-sm font-semibold">Antigena Data Upload</h1>
              <p className="text-[10px] text-[#64748b]">Admin Panel — EEQ RESPOND Module</p>
            </div>
          </div>
          {dbCount !== null && (
            <div className="text-right">
              <span className="text-[10px] text-[#64748b]">Records in DB</span>
              <p className="text-lg font-mono font-bold text-[#7b61ff]">{dbCount.toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
            dragOver
              ? 'border-[#7b61ff] bg-[#7b61ff]/10'
              : stats.phase === 'error'
              ? 'border-red-500/50 bg-red-500/5'
              : 'border-[#2c2d36] bg-[#13141a] hover:border-[#3f404d] hover:bg-[#181920]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          {stats.phase === 'idle' || stats.phase === 'done' || stats.phase === 'error' ? (
            <>
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                dragOver ? 'bg-[#7b61ff]/20' : 'bg-[#22232b]'
              }`}>
                {stats.phase === 'error' ? (
                  <AlertTriangle size={28} className="text-red-400" />
                ) : stats.phase === 'done' ? (
                  <CheckCircle2 size={28} className="text-green-400" />
                ) : (
                  <Upload size={28} className="text-[#7b61ff]" />
                )}
              </div>
              <h3 className="text-sm font-semibold mb-1">
                {stats.phase === 'error' ? 'Upload Error' : stats.phase === 'done' ? 'Upload Complete' : 'Drop JSON file here'}
              </h3>
              <p className="text-xs text-[#64748b] mb-3">
                {stats.phase !== 'idle' ? stats.message : 'or click to browse — max 10MB'}
              </p>
              <div className="flex items-center justify-center gap-2 text-[10px] text-[#64748b]">
                <FileJson size={12} />
                <span>Antigena RESPOND JSON export</span>
              </div>
            </>
          ) : (
            <div onClick={(e) => e.stopPropagation()} className="cursor-default">
              <Loader2 size={32} className="text-[#7b61ff] animate-spin mx-auto mb-4" />
              <h3 className="text-sm font-semibold mb-2">{stats.message}</h3>

              {/* Progress bar */}
              <div className="w-full bg-[#22232b] rounded-full h-2 mb-3 overflow-hidden">
                <div
                  className="h-full bg-[#7b61ff] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-center gap-6 text-[10px] text-[#94a3b8]">
                <span>{stats.processed.toLocaleString()} / {stats.total.toLocaleString()}</span>
                <span className="text-green-400">{stats.inserted} upserted</span>
                {stats.errors > 0 && <span className="text-red-400">{stats.errors} errors</span>}
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats.phase === 'done' && stats.total > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <StatCard label="Total Processed" value={stats.total} color="text-[#e2e8f0]" />
            <StatCard label="Upserted" value={stats.inserted} color="text-green-400" />
            <StatCard label="Errors" value={stats.errors} color="text-red-400" />
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-[10px] text-[#64748b]">
            Duplicates are handled automatically via upsert on <code className="text-[#94a3b8]">codeid</code>.
            Existing records are updated with the latest data.
          </p>
          <button
            onClick={handlePurge}
            className="flex items-center gap-2 px-4 py-2 rounded text-[10px] border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={12} />
            Purge All Data
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-[#13141a] border border-[#2c2d36] rounded-lg p-4">
      <p className="text-[10px] text-[#64748b] mb-1">{label}</p>
      <p className={`text-2xl font-mono font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}
