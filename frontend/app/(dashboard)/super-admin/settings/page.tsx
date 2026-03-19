"use client";
import { useState } from "react";
import {
  Settings,
  Globe,
  Palette,
  Megaphone,
  ShieldAlert,
} from "lucide-react";

export default function SuperAdminSettingsPage() {
  const [platformName, setPlatformName] = useState("Chess Academy Platform");

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="page-title flex items-center gap-2">
          <Settings size={22} style={{ color: "var(--amber)" }} />
          Platform Settings
        </h1>
        <p className="text-sm text-surface-500">
          Configure global platform attributes and defaults.
        </p>
      </div>

      {/* Platform Branding */}
      <div className="card p-6 space-y-5">
        <h3 className="section-title flex items-center gap-2">
          <Globe size={16} style={{ color: "var(--amber)" }} />
          Platform Branding
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="label">Platform Display Name</label>
            <input
              className="input bg-gray-50/50 cursor-not-allowed"
              value={platformName}
              readOnly
              disabled
              title="Platform name configuration coming soon"
            />
            <p className="text-[10px] mt-1 text-gray-500 italic">
              Global branding configuration will be available in the next update.
            </p>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-surface-100">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold-dim">
                <Palette size={16} className="text-gold" />
              </div>
              <div>
                <p className="text-sm font-medium">Custom Theme</p>
                <p className="text-xs text-surface-400">Apply custom branding colors across all academies</p>
              </div>
            </div>
            <span className="badge badge-gray text-[10px] uppercase">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* Global Announcements */}
      <div className="card p-6 space-y-5 opacity-75">
        <h3 className="section-title flex items-center gap-2">
          <Megaphone size={16} style={{ color: "var(--amber)" }} />
          Global Announcements
        </h3>
        <p className="text-xs text-surface-500">
          Broadcast messages to all users across all academies.
        </p>
        <button className="btn-secondary w-full text-xs cursor-not-allowed" disabled>
          Create Global Announcement
        </button>
      </div>

      {/* Platform Danger Zone */}
      <div className="card p-6 space-y-5 border-red-100 bg-red-50/20">
        <h3 className="section-title flex items-center gap-2 text-red-600">
          <ShieldAlert size={16} />
          Danger Zone
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-900">Maintenance Mode</p>
            <p className="text-xs text-red-600/70">Disable entire platform access for maintenance</p>
          </div>
          <button className="btn-danger-outline text-xs px-4 py-1.5 opacity-50 cursor-not-allowed" disabled>
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}
