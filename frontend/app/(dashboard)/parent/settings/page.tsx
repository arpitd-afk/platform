"use client";
import Link from "next/link";
import {
  Settings,
  User,
  Bell,
  Heart,
  ShieldAlert,
} from "lucide-react";

export default function ParentSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h1 className="page-title flex items-center gap-2">
          <Settings size={22} style={{ color: "var(--amber)" }} />
          Parent Settings
        </h1>
        <p className="text-sm text-surface-500">
          Manage your account and notification preferences for your children.
        </p>
      </div>

      {/* Account Info Link */}
      <div className="card p-6 flex items-center justify-between border-gold/10 bg-gold-dim/10 transform transition-all hover:scale-[1.01]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold-dim border border-gold/20">
            <User size={20} className="text-gold" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Personal Profile</h3>
            <p className="text-xs text-surface-500">Update your name, bio, and contact details</p>
          </div>
        </div>
        <Link href="/profile" className="btn-secondary text-xs px-4">
          Edit Profile
        </Link>
      </div>

      {/* Communication Preferences Placeholder */}
      <div className="card p-6 space-y-5 shadow-sm border-surface-100">
        <h3 className="section-title flex items-center gap-2">
          <Bell size={16} style={{ color: "var(--amber)" }} />
          Communication Preferences
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Progress Alerts</p>
              <p className="text-xs text-surface-400">Receive weekly summaries of your children&apos;s progress</p>
            </div>
            <span className="badge badge-gray text-[10px] uppercase">Weekly</span>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-surface-50">
            <div className="flex items-center gap-3">
              <Heart size={16} className="text-surface-400" />
              <div>
                <p className="text-sm font-medium">Child Safety Notifications</p>
                <p className="text-xs text-surface-400">Immediate alerts for classroom absences or issues</p>
              </div>
            </div>
            <div className="relative w-11 h-6 rounded-full bg-surface-200 cursor-not-allowed">
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full" />
            </div>
          </div>
        </div>
        <p className="text-[10px] text-gray-500 italic mt-4">
          Fine-grained notification controls will be available soon.
        </p>
      </div>

      {/* Parent Account Safety */}
      <div className="card p-6 space-y-5 border-red-50 bg-red-50/10 opacity-80">
        <h3 className="section-title flex items-center gap-2 text-red-600">
          <ShieldAlert size={16} />
          Danger Zone
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-900">Deactivate Parent Account</p>
            <p className="text-xs text-red-600/70">Suspend your access to student monitoring</p>
          </div>
          <button className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-not-allowed" disabled>
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}
