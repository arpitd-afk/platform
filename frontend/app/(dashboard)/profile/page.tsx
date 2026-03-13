"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUpdateUser } from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { usersAPI, analyticsAPI, authAPI } from "@/lib/api";
import Avatar from "@/components/shared/Avatar";
import {
  User,
  Phone,
  Building2,
  Save,
  Loader2,
  Swords,
  Puzzle,
  Star,
  TrendingUp,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

const ROLE_COLOR: Record<string, string> = {
  super_admin: "#7C3AED",
  academy_admin: "#9A6E00",
  coach: "#15803D",
  student: "#1D4ED8",
  parent: "#BE185D",
};
const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super Admin",
  academy_admin: "Academy Admin",
  coach: "Coach",
  student: "Student",
  parent: "Parent",
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const update = useUpdateUser();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch full profile (JWT doesn't include phone/bio)
  const { data: fullProfile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => authAPI.me().then((r) => r.data.user),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (fullProfile) {
      setName(fullProfile.name || "");
      setPhone(fullProfile.phone || "");
      setBio(fullProfile.bio || "");
    }
  }, [fullProfile]);
  const roleColor = ROLE_COLOR[user?.role || ""] || "#9A6E00";

  // Live stats for students and coaches
  const { data: stats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: () => usersAPI.stats(user!.id).then((r) => r.data),
    enabled: !!user?.id && ["student", "coach"].includes(user.role),
  });

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await update.mutateAsync({ id: user.id, data: { name, phone, bio } });
      updateUser({ name });
      // phone/bio not in auth context type but save succeeds
      toast.success("Profile updated!");
    } catch {
      toast.error("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const statCards =
    user?.role === "student"
      ? [
          {
            label: "ELO Rating",
            value: user?.rating ?? "—",
            icon: Star,
            color: "var(--amber)",
          },
          {
            label: "Games Played",
            value: stats?.games?.total ?? "—",
            icon: Swords,
            color: "#1D4ED8",
          },
          {
            label: "Puzzles Solved",
            value: stats?.puzzles?.solved ?? "—",
            icon: Puzzle,
            color: "#15803D",
          },
          {
            label: "Win Rate",
            value:
              stats?.games?.total > 0
                ? `${Math.round((stats.games.wins / stats.games.total) * 100)}%`
                : "—",
            icon: TrendingUp,
            color: "#9A6E00",
          },
        ]
      : user?.role === "coach"
        ? [
            {
              label: "Students",
              value: stats?.students ?? "—",
              icon: User,
              color: "#1D4ED8",
            },
            {
              label: "Classes Taught",
              value: stats?.classes ?? "—",
              icon: Calendar,
              color: "#15803D",
            },
            {
              label: "Rating",
              value: user?.rating ?? "—",
              icon: Star,
              color: "var(--amber)",
            },
          ]
        : [];

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="page-title flex items-center gap-2">
        <User size={22} style={{ color: "var(--amber)" }} />
        My Profile
      </h1>

      {/* Identity card */}
      <div className="card p-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <Avatar
              user={user}
              size="xl"
              editable
              onUpdate={(avatar) => updateUser({ avatar })}
            />
            <span
              className="absolute -bottom-1 -right-1 text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
              style={{
                background: `${roleColor}18`,
                color: roleColor,
                border: `1px solid ${roleColor}30`,
              }}
            >
              {ROLE_LABEL[user?.role || ""] || user?.role}
            </span>
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0">
            <h2
              className="text-xl font-bold truncate"
              style={{ color: "var(--text)" }}
            >
              {user?.name}
            </h2>
            <p
              className="text-sm mt-0.5 truncate"
              style={{ color: "var(--text-muted)" }}
            >
              {user?.email}
            </p>
            {user?.academyName && (
              <div className="flex items-center gap-1.5 mt-2 justify-center sm:justify-start">
                <Building2 size={13} style={{ color: "var(--text-muted)" }} />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {user.academyName}
                </span>
              </div>
            )}
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              Click the photo to change your profile picture
            </p>
          </div>
          {user?.rating && user.role !== "parent" && (
            <div className="shrink-0 text-center hidden sm:block">
              <div
                className="text-3xl font-display font-bold"
                style={{ color: "var(--amber)" }}
              >
                {user.rating}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                ELO Rating
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live stat cards — students & coaches only */}
      {statCards.length > 0 && (
        <div
          className={`grid gap-4 ${statCards.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}
        >
          {statCards.map((s) => (
            <div
              key={s.label}
              className="stat-card items-center text-center p-4"
            >
              <s.icon size={18} style={{ color: s.color }} />
              <div
                className="text-2xl font-display font-bold mt-1"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Personal info form */}
      <div className="card p-6 space-y-4">
        <h3 className="section-title">Personal Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={user?.email || ""} disabled />
          </div>
          <div>
            <label className="label">
              Phone{" "}
              <span style={{ color: "var(--text-muted)" }}>(optional)</span>
            </label>
            <div className="relative">
              <Phone
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                className="input pl-9"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
          <div>
            <label className="label">Academy</label>
            <input
              className="input"
              value={user?.academyName || "—"}
              disabled
            />
          </div>
        </div>
        <div>
          <label className="label">
            Bio <span style={{ color: "var(--text-muted)" }}>(optional)</span>
          </label>
          <textarea
            className="input resize-none h-20"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={
              user?.role === "coach"
                ? "Tell students about your coaching style and experience..."
                : "A short bio about yourself..."
            }
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Member since */}
      <div className="card p-4 flex items-center gap-3">
        <Calendar size={16} style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Member since{" "}
          <span style={{ color: "var(--text-mid)" }}>
            {new Date().toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </p>
      </div>
    </div>
  );
}
