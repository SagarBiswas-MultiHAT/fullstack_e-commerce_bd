'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiGet, apiPut } from '@/lib/api';

interface AdminSettings {
  storeName: string;
  logoUrl: string;
  brandColor: string;
  senderEmail: string;
  contactInfo: string;
  lowStockAlertThreshold: number;
  abandonedCartDelayMinutes: number;
}

const defaults: AdminSettings = {
  storeName: '',
  logoUrl: '',
  brandColor: '#2563EB',
  senderEmail: '',
  contactInfo: '',
  lowStockAlertThreshold: 10,
  abandonedCartDelayMinutes: 60,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(defaults);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiGet<AdminSettings>('/admin/settings').then((payload) => setSettings(payload));
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const updated = await apiPut<AdminSettings>('/admin/settings', settings);
      setSettings(updated);
      setMessage('Settings saved successfully.');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Settings save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="max-w-3xl space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-4" onSubmit={save}>
      <h2 className="text-lg font-semibold">Store Settings</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={settings.storeName}
          onChange={(event) => setSettings((current) => ({ ...current, storeName: event.target.value }))}
          placeholder="Store name"
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
        />
        <input
          type="email"
          value={settings.senderEmail}
          onChange={(event) => setSettings((current) => ({ ...current, senderEmail: event.target.value }))}
          placeholder="Sender email"
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
        />
      </div>

      <input
        value={settings.logoUrl}
        onChange={(event) => setSettings((current) => ({ ...current, logoUrl: event.target.value }))}
        placeholder="Logo URL"
        className="h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
      />

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <input
          value={settings.contactInfo}
          onChange={(event) => setSettings((current) => ({ ...current, contactInfo: event.target.value }))}
          placeholder="Contact info"
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
        />
        <input
          type="color"
          value={settings.brandColor}
          onChange={(event) => setSettings((current) => ({ ...current, brandColor: event.target.value }))}
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          type="number"
          min={0}
          value={settings.lowStockAlertThreshold}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              lowStockAlertThreshold: Number(event.target.value) || 0,
            }))
          }
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
        />
        <input
          type="number"
          min={1}
          value={settings.abandonedCartDelayMinutes}
          onChange={(event) =>
            setSettings((current) => ({
              ...current,
              abandonedCartDelayMinutes: Number(event.target.value) || 1,
            }))
          }
          className="h-10 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm"
        />
      </div>

      {message ? <p className="text-sm text-slate-300">{message}</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}
