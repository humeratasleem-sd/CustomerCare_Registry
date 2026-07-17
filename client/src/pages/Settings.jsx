import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Save, Settings as SettingsIcon, ShieldAlert, FileIcon, Mail, Cpu } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../constants';
import { CardSkeleton } from '../components/Skeletons';

const Settings = () => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enableAiPredictions: true,
    automaticEscalationTimeHours: 48,
    maxFileSizeMB: 5,
    systemEmailSender: 'system@customercare.com'
  });

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.data) {
        setSettings(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/admin/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('System settings saved successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save system settings.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded"></div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      <div>
        <h1 className="text-xl font-bold tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-1">Configure global application behavior, service level agreements, AI triggers, and mail parameters.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8 space-y-6">
          {/* AI Settings Section */}
          <div className="flex gap-4 items-start border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-2xl">
              <Cpu size={24} />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Artificial Intelligence Predictions</h3>
              <p className="text-xs text-slate-400">Toggle NLP algorithms to predict ticket priority and suggest departments dynamically based on customer input text.</p>
              <label className="inline-flex items-center gap-3 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAiPredictions}
                  onChange={(e) => setSettings({ ...settings, enableAiPredictions: e.target.checked })}
                  className="w-4.5 h-4.5 rounded border-slate-350 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-350">Enable Auto-Prioritization & Category Matching</span>
              </label>
            </div>
          </div>

          {/* SLA Settings Section */}
          <div className="flex gap-4 items-start border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl">
              <ShieldAlert size={24} />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Service Level Agreement Escalations</h3>
              <p className="text-xs text-slate-400">Establish the time frame (in hours) after which a pending or unassigned complaint will automatically escalate to the supervisor tier.</p>
              <div className="max-w-xs">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Escalation Deadline (Hours)</label>
                <input
                  type="number"
                  min="1"
                  value={settings.automaticEscalationTimeHours}
                  onChange={(e) => setSettings({ ...settings, automaticEscalationTimeHours: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-205 dark:border-slate-800 bg-transparent rounded-xl text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* File Attachments Settings Section */}
          <div className="flex gap-4 items-start border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-600 rounded-2xl">
              <FileIcon size={24} />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">File Storage Limit</h3>
              <p className="text-xs text-slate-400">Enforce maximum size restrictions (in Megabytes) on document and picture attachments uploaded by customers or agents.</p>
              <div className="max-w-xs">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Max Upload Size (MB)</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.maxFileSizeMB}
                  onChange={(e) => setSettings({ ...settings, maxFileSizeMB: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email Settings Section */}
          <div className="flex gap-4 items-start pb-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-600 rounded-2xl">
              <Mail size={24} />
            </div>
            <div className="flex-1 space-y-3">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Outbound Mail Sender</h3>
              <p className="text-xs text-slate-400">Define the default email signature header/sender identity used for all system-generated email alerts and ticket confirmations.</p>
              <div className="max-w-sm">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Sender Email Address</label>
                <input
                  type="email"
                  value={settings.systemEmailSender}
                  onChange={(e) => setSettings({ ...settings, systemEmailSender: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
