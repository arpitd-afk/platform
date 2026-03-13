"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { authAPI } from "@/lib/api";
import {
  Settings,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  Check,
  Trash2,
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

export default function ParentSettingsPage() {
  const { user } = useAuth();

  const [notifs, setNotifs] = useState({
    classReminder: true,
    missedClass: true,
    progressReport: true,
    newMessage: true,
    feeReminder: true,
    assignmentDue: false,
  });

  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [changingPass, setChangingPass] = useState(false);

  const handlePasswordChange = async () => {
    if (!newPass || !currentPass)
      return toast.error("Fill in all password fields");
    if (newPass.length < 6)
      return toast.error("New password must be at least 6 characters");
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

  const notifItems = [
    {
      key: "classReminder",
      label: "Class reminders",
      desc: "1 hour before each scheduled class",
    },
    {
      key: "missedClass",
      label: "Missed class alerts",
      desc: "When your child misses a class",
    },
    {
      key: "progressReport",
      label: "Progress reports",
      desc: "Weekly digest of your child's performance",
    },
    {
      key: "newMessage",
      label: "New messages",
      desc: "When a coach sends you a message",
    },
    {
      key: "feeReminder",
      label: "Fee reminders",
      desc: "Reminders about upcoming or overdue fees",
    },
    {
      key: "assignmentDue",
      label: "Assignment due reminders",
      desc: "When your child has an assignment due soon",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2">
        <Settings size={22} style={{ color: "var(--amber)" }} />
        Settings
      </h1>

      {/* Notifications */}
      <div className="card p-6 space-y-1">
        <h3 className="section-title flex items-center gap-2 mb-4">
          <Bell size={16} style={{ color: "var(--amber)" }} />
          Notifications
        </h3>
        {notifItems.map((item, i) => (
          <div
            key={item.key}
            className="flex items-center justify-between py-3"
            style={{
              borderBottom:
                i < notifItems.length - 1 ? "1px solid var(--border)" : "none",
            }}
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
                placeholder="Min. 6 characters"
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

      {/* Danger zone */}
      <div className="card p-6 space-y-3">
        <h3 className="section-title flex items-center gap-2 text-red-600">
          <Trash2 size={16} />
          Danger Zone
        </h3>
        <div
          className="rounded-xl p-4"
          style={{ background: "#FEF2F2", border: "1px solid #FEE2E2" }}
        >
          <h4 className="font-medium text-sm text-red-700">
            Deactivate Account
          </h4>
          <p className="text-xs text-red-600 mt-1">
            Your parent account will be deactivated and you will lose access to
            your children's progress.
          </p>
          <button
            className="mt-3 text-xs py-2 px-4 rounded-lg font-medium"
            style={{ background: "#DC2626", color: "white" }}
            onClick={() =>
              toast.error(
                "Please contact the academy to deactivate your account.",
              )
            }
          >
            Deactivate My Account
          </button>
        </div>
      </div>
    </div>
  );
}
