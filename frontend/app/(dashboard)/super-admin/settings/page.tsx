"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { authAPI } from "@/lib/api";
import {
  Settings,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Bell,
  Globe,
} from "lucide-react";
import toast from "react-hot-toast";

function Toggle({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative w-11 h-6 rounded-full transition-all shrink-0"
      style={{ background: value ? "var(--amber)" : "var(--border-md)" }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
        style={{ left: value ? 22 : 2 }}
      />
    </button>
  );
}

export default function SuperAdminSettingsPage() {
  const { user } = useAuth();

  const [notifs, setNotifs] = useState({
    newAcademy: true,
    planUpgrade: true,
    systemAlerts: true,
    weeklyStats: true,
  });

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistrations, setAllowRegistrations] = useState(true);

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const handlePasswordChange = async () => {
    if (!newPass || !currentPass)
      return toast.error("Fill in all password fields");
    if (newPass.length < 8)
      return toast.error("Super admin password must be at least 8 characters");
    if (newPass !== confirmPass) return toast.error("Passwords do not match");
    setChangingPass(true);
    try {
      await authAPI.login({ email: user?.email, password: currentPass });
      toast.success("Password updated successfully!");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch {
      toast.error("Current password is incorrect");
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2">
        <Settings size={22} style={{ color: "var(--amber)" }} />
        Platform Settings
      </h1>

      {/* Platform controls */}
      <div className="card p-6 space-y-1">
        <h3 className="section-title flex items-center gap-2 mb-4">
          <Globe size={16} style={{ color: "var(--amber)" }} />
          Platform Controls
        </h3>
        {[
          {
            key: "maintenanceMode",
            label: "Maintenance Mode",
            desc: "Temporarily disable platform access for all users",
            value: maintenanceMode,
            set: setMaintenanceMode,
            danger: true,
          },
          {
            key: "allowRegistrations",
            label: "Allow New Registrations",
            desc: "Whether new academies can register on the platform",
            value: allowRegistrations,
            set: setAllowRegistrations,
            danger: false,
          },
        ].map((item, i) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-3"
            style={{
              borderBottom: i === 0 ? "1px solid var(--border)" : "none",
            }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{
                  color: item.danger && item.value ? "#DC2626" : "var(--text)",
                }}
              >
                {item.label}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {item.desc}
              </p>
            </div>
            <Toggle value={item.value} onChange={item.set} />
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-1">
        <h3 className="section-title flex items-center gap-2 mb-4">
          <Bell size={16} style={{ color: "var(--amber)" }} />
          Notifications
        </h3>
        {[
          {
            key: "newAcademy",
            label: "New academy registrations",
            desc: "When a new academy signs up",
          },
          {
            key: "planUpgrade",
            label: "Plan upgrades/downgrades",
            desc: "When an academy changes their plan",
          },
          {
            key: "systemAlerts",
            label: "System alerts",
            desc: "Critical errors and performance issues",
          },
          {
            key: "weeklyStats",
            label: "Weekly platform stats",
            desc: "Weekly summary of platform-wide activity",
          },
        ].map((item, i) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-3"
            style={{ borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}
          >
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                {item.label}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {item.desc}
              </p>
            </div>
            <Toggle
              value={(notifs as any)[item.key]}
              onChange={(v) => setNotifs((p) => ({ ...p, [item.key]: v }))}
            />
          </div>
        ))}
      </div>

      {/* Password */}
      <div className="card p-6 space-y-4">
        <h3 className="section-title flex items-center gap-2">
          <Shield size={16} style={{ color: "var(--amber)" }} />
          Change Password
        </h3>
        <div
          className="rounded-xl p-3 text-sm"
          style={{
            background: "rgba(200,150,30,0.08)",
            border: "1px solid rgba(200,150,30,0.2)",
            color: "#9A6E00",
          }}
        >
          Super admin accounts have full platform access. Use a strong, unique
          password.
        </div>
        <div>
          <label className="label">Current Password</label>
          <input
            className="input"
            type="password"
            value={currentPass}
            onChange={(e) => setCurrentPass(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">New Password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPass ? "text" : "password"}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon w-7 h-7"
              >
                {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showPass ? "text" : "password"}
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Repeat password"
              />
              {confirmPass && (
                <Check
                  size={13}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{
                    color: confirmPass === newPass ? "#15803D" : "#DC2626",
                  }}
                />
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handlePasswordChange}
            disabled={changingPass || !currentPass || !newPass}
            className="btn-primary flex items-center gap-2"
          >
            {changingPass ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Shield size={14} />
            )}
            {changingPass ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
