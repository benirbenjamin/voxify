'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';
import {
  HardDrive,
  Cloud,
  Server,
  Plus,
  Trash2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Database,
  Mail,
  Folder,
  Sliders,
} from 'lucide-react';

interface GoogleDriveAccount {
  id: string;
  account_email: string;
  folder_id: string;
  status: 'active' | 'full' | 'disabled';
  max_storage_mb: number;
  used_storage_mb: number;
  file_count: number;
  created_at?: string;
}

interface PlatformStorageSettings {
  storage_mode: 'supabase_primary' | 'google_drive_primary' | 'supabase_only';
  storage_fallback_enabled: boolean;
}

export default function AdminStoragePage() {
  const [settings, setSettings] = useState<PlatformStorageSettings>({
    storage_mode: 'supabase_primary',
    storage_fallback_enabled: true,
  });
  const [accounts, setAccounts] = useState<GoogleDriveAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Form state for adding new Google Drive account
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFolderId, setNewFolderId] = useState('');
  const [newMaxGb, setNewMaxGb] = useState('15');
  const [newCredsJson, setNewCredsJson] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/storage');
      const data = await res.json();
      if (res.ok) {
        if (data.settings) setSettings(data.settings);
        if (data.accounts) setAccounts(data.accounts);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to load storage configuration' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load storage configuration' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings(mode?: 'supabase_primary' | 'google_drive_primary' | 'supabase_only') {
    setMessage(null);

    const newSettings = {
      storage_mode: mode !== undefined ? mode : settings.storage_mode,
      storage_fallback_enabled: settings.storage_fallback_enabled,
    };

    try {
      const res = await fetch('/api/admin/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_settings', ...newSettings }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSettings(newSettings);
        setMessage({ type: 'success', text: 'Storage settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save storage settings' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter a Google Drive Account Email' });
      return;
    }
    if (!newCredsJson.trim()) {
      setMessage({ type: 'error', text: 'Please paste the Service Account JSON key or OAuth credentials' });
      return;
    }

    setAddingAccount(true);
    setMessage(null);

    try {
      let parsedJson: any;
      try {
        parsedJson = JSON.parse(newCredsJson);
      } catch {
        parsedJson = { access_token: newCredsJson.trim() };
      }

      const maxMb = (parseFloat(newMaxGb) || 15) * 1024;

      const res = await fetch('/api/admin/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_account',
          account_email: newEmail.trim(),
          folder_id: newFolderId.trim(),
          credentials_json: parsedJson,
          max_storage_mb: maxMb,
        }),
      });
      const result = await res.json();

      if (result.data) {
        setAccounts((prev) => [...prev, result.data]);
        setShowAddModal(false);
        setNewEmail('');
        setNewFolderId('');
        setNewMaxGb('15');
        setNewCredsJson('');
        setMessage({ type: 'success', text: `Google Drive account '${result.data.account_email}' added to rotation pool!` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add Google Drive account' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error processing credentials JSON' });
    } finally {
      setAddingAccount(false);
    }
  }

  async function handleToggleStatus(account: GoogleDriveAccount) {
    const nextStatus = account.status === 'active' ? 'disabled' : 'active';

    try {
      const res = await fetch('/api/admin/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_account', id: account.id, updates: { status: nextStatus } }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, status: nextStatus } : a))
        );
        setMessage({ type: 'success', text: `Account '${account.account_email}' status updated to ${nextStatus}` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update account status' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update account' });
    }
  }

  async function handleDeleteAccount(id: string, email: string) {
    if (!confirm(`Are you sure you want to remove '${email}' from the Google Drive pool?`)) return;

    try {
      const res = await fetch('/api/admin/storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_account', id }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setMessage({ type: 'success', text: `Removed '${email}' from pool.` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete account' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete account' });
    }
  }

  // Pool summary stats
  const totalMaxMb = accounts.reduce((acc, a) => acc + (a.max_storage_mb || 0), 0);
  const totalUsedMb = accounts.reduce((acc, a) => acc + (a.used_storage_mb || 0), 0);
  const totalFiles = accounts.reduce((acc, a) => acc + (a.file_count || 0), 0);
  const activeCount = accounts.filter((a) => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10">
      {/* Header & Back Link */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <BackButton href="/admin" label="Back to Super Admin Dashboard" className="mb-3" />
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
              <HardDrive className="w-8 h-8 text-purple-500" />
              Storage Management & Multi-Drive Pool
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Configure platform-wide audio and document storage mode for Choirs & Artists, and manage Google Drive email pool auto-rotation.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* System Alert Messages */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between border ${
              message.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100">
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Storage Mode Configuration */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <Sliders className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Platform Storage Provider Strategy</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Controls where uploaded choir songs, stems, PDFs, and artist marketplace tracks are saved.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Supabase Primary Card */}
            <div
              onClick={() => handleSaveSettings('supabase_primary')}
              className={`cursor-pointer rounded-xl p-5 border-2 transition relative flex flex-col justify-between ${
                settings.storage_mode === 'supabase_primary'
                  ? 'border-purple-500 bg-purple-950/30'
                  : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Database className="w-7 h-7 text-purple-400" />
                  {settings.storage_mode === 'supabase_primary' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500 text-white">
                      Active Mode
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white text-base">Supabase Primary + Drive Fallback</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Uploads files to Supabase Storage first. If Supabase storage is full or reaches quota limits, it automatically routes files to the Google Drive email pool.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-purple-300">
                Recommended for standard production
              </div>
            </div>

            {/* Google Drive Primary Card */}
            <div
              onClick={() => handleSaveSettings('google_drive_primary')}
              className={`cursor-pointer rounded-xl p-5 border-2 transition relative flex flex-col justify-between ${
                settings.storage_mode === 'google_drive_primary'
                  ? 'border-purple-500 bg-purple-950/30'
                  : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Cloud className="w-7 h-7 text-blue-400" />
                  {settings.storage_mode === 'google_drive_primary' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500 text-white">
                      Active Mode
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white text-base">Google Drive Primary Pool</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Uploads all new choir and artist audio tracks and sheet music directly to active Google Drive email accounts in rotation.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-blue-300">
                Saves Supabase Storage quota completely
              </div>
            </div>

            {/* Supabase Only Card */}
            <div
              onClick={() => handleSaveSettings('supabase_only')}
              className={`cursor-pointer rounded-xl p-5 border-2 transition relative flex flex-col justify-between ${
                settings.storage_mode === 'supabase_only'
                  ? 'border-purple-500 bg-purple-950/30'
                  : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Server className="w-7 h-7 text-emerald-400" />
                  {settings.storage_mode === 'supabase_only' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500 text-white">
                      Active Mode
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white text-base">Supabase Storage Only</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Uploads strictly to Supabase Storage. Disables automated routing to Google Drive email pool.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-semibold text-slate-400">
                Standard Supabase storage
              </div>
            </div>
          </div>
        </div>

        {/* 2. Pool Overview Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Drive Accounts</div>
            <div className="text-3xl font-extrabold text-white mt-2 flex items-center justify-between">
              {activeCount} / {accounts.length}
              <Cloud className="w-7 h-7 text-purple-400 opacity-80" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Available for automatic rotation</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Drive Storage</div>
            <div className="text-3xl font-extrabold text-white mt-2 flex items-center justify-between">
              {(totalMaxMb / 1024).toFixed(1)} GB
              <HardDrive className="w-7 h-7 text-blue-400 opacity-80" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Combined capacity across pool</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Used Storage</div>
            <div className="text-3xl font-extrabold text-purple-400 mt-2 flex items-center justify-between">
              {(totalUsedMb / 1024).toFixed(2)} GB
              <Database className="w-7 h-7 text-purple-400 opacity-80" />
            </div>
            <div className="w-full bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, (totalUsedMb / (totalMaxMb || 1)) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-lg">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Stored Files</div>
            <div className="text-3xl font-extrabold text-white mt-2 flex items-center justify-between">
              {totalFiles}
              <Folder className="w-7 h-7 text-emerald-400 opacity-80" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Choir & Artist tracks stored</p>
          </div>
        </div>

        {/* 3. Google Drive Email Accounts Pool Manager */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-400" />
                Google Drive Email Accounts Pool
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                When an account fills up (e.g. 15GB reached or 403 quota), uploads automatically switch to the next active email account in this list.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-purple-600/30 transition"
            >
              <Plus className="w-4 h-4" /> Add Google Drive Email
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/40 p-6">
              <Cloud className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Google Drive Accounts Configured</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto mt-1 mb-4">
                Add Google Drive email accounts with Service Account keys to enable multi-account auto-rotation storage for Choir and Artist songs.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg text-sm transition"
              >
                Add First Drive Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => {
                const usedGb = (acc.used_storage_mb / 1024).toFixed(2);
                const maxGb = (acc.max_storage_mb / 1024).toFixed(0);
                const pct = Math.min(100, Math.round((acc.used_storage_mb / (acc.max_storage_mb || 15000)) * 100));

                return (
                  <div
                    key={acc.id}
                    className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-5 space-y-4 shadow-md flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <div className="w-9 h-9 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-5 h-5 text-purple-400" />
                          </div>
                          <div className="truncate">
                            <h4 className="font-bold text-white text-sm truncate">{acc.account_email}</h4>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Folder className="w-3 h-3 text-slate-500" /> Folder ID: {acc.folder_id || 'Root'}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex-shrink-0 ${
                            acc.status === 'active'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : acc.status === 'full'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {acc.status}
                        </span>
                      </div>

                      {/* Usage Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-400">Used Storage</span>
                          <span className="text-slate-200 font-bold">
                            {usedGb} GB / {maxGb} GB ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 90 ? 'bg-amber-500' : 'bg-purple-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
                        <span>Total Audio & Docs: <strong className="text-white">{acc.file_count || 0}</strong></span>
                        <span className="text-[11px] opacity-70">Added: {new Date(acc.created_at || Date.now()).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
                      <button
                        onClick={() => handleToggleStatus(acc)}
                        className={`font-medium px-3 py-1.5 rounded-lg border transition ${
                          acc.status === 'active'
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60'
                        }`}
                      >
                        {acc.status === 'active' ? 'Disable Account' : 'Set to Active'}
                      </button>

                      <button
                        onClick={() => handleDeleteAccount(acc.id, acc.account_email)}
                        className="text-rose-400 hover:text-rose-300 p-1.5 hover:bg-rose-950/40 rounded-lg transition"
                        title="Delete from pool"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Modal: Add Google Drive Email Account */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cloud className="w-5 h-5 text-purple-400" />
                  Add Google Drive Email to Pool
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Google Drive Account Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. storage-drive-1@gmail.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Folder ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={newFolderId}
                      onChange={(e) => setNewFolderId(e.target.value)}
                      placeholder="e.g. 1A2b3C4d5E6f..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Max Storage Limit (GB)
                    </label>
                    <input
                      type="number"
                      value={newMaxGb}
                      onChange={(e) => setNewMaxGb(e.target.value)}
                      placeholder="15"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Service Account JSON Key or OAuth Credentials *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={newCredsJson}
                    onChange={(e) => setNewCredsJson(e.target.value)}
                    placeholder='Paste your Google Cloud Service Account JSON key here...'
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Paste the JSON key downloaded from Google Cloud Console (IAM &amp; Admin Service Accounts) or access token.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={addingAccount}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/30 transition flex items-center gap-2"
                  >
                    {addingAccount && <RefreshCw className="w-4 h-4 animate-spin" />}
                    Save to Drive Pool
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
