"use client";

import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Check,
  X,
  Zap,
  Shield,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const PLAN_LABELS: Record<string, string> = {
  free: "Free Plan",
  pro: "Pro Plan",
  enterprise: "Enterprise Plan",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuthStore();

  // ----------- Edit Profile State -----------
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState("");

  // ----------- Change Password State -----------
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  // Populate edit fields from current user
  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditPhone(user.phone || "");
    }
  }, [user]);

  const planKey = (user?.planType || "free").toLowerCase();
  const planLabel = PLAN_LABELS[planKey] || "Free Plan";

  // ---- Handlers ----
  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError("");
    try {
      await updateProfile({ name: editName, phone: editPhone });
      setEditSuccess(true);
      setIsEditing(false);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditName(user?.name || "");
    setEditPhone(user?.phone || "");
    setEditError("");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    setPwSuccess(false);
    try {
      await changePassword(oldPassword, newPassword);
      setPwSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e) {
      setPwError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin text-[#01696F]" size={32} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-full mx-auto space-y-6 animate-fade-in">
        {/* Page Header */}
        <header className="flex flex-col gap-1 border-b border-[#01696F]/10 pb-5 shrink-0">
          <span className="text-[14px] font-black uppercase tracking-widest text-[#01696F]/60">
            Account
          </span>
          <h1 className="text-3xl font-extrabold text-[#01696F] tracking-tight">Profile</h1>
          <p className="text-xs text-zinc-500 font-medium mt-0.5">
            Manage your personal information, security settings, and subscription.
          </p>
        </header>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ──────────────────── 1. User Card ──────────────────── */}
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            {/* Teal Banner */}
            {/* <div className="w-full h-32 bg-[#01696F] relative"></div>s */}

            {/* Avatar */}
            <div className="px-6 flex flex-col items-center  pb-6">
              <div className="w-20 h-20 rounded-full bg-[#e7f1f2] border-4 border-white shadow-md flex items-center justify-center shrink-0">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-extrabold text-[#01696F]">
                    {getInitials(user.name || "U")}
                  </span>
                )}
              </div>

              {/* Username handle */}
              <p className="mt-3 text-[#01696F] font-bold text-sm tracking-wide">
                @{(user.name || "user").toLowerCase().replace(/\s+/g, "_")}
              </p>

              {/* Info rows */}
              <div className="w-full mt-5 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
                  Information
                </h3>

                {/* Name */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#e7f1f2] flex items-center justify-center shrink-0 overflow-hidden">
                    <User size={16} className="text-[#01696F]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Name</span>
                    {isEditing ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-sm font-semibold text-zinc-800 border-b border-[#01696F]/40 focus:outline-none focus:border-[#01696F] bg-transparent w-full"
                        placeholder="Your name"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-zinc-800">{user.name || "—"}</span>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#e7f1f2] flex items-center justify-center shrink-0 overflow-hidden">
                    <Mail size={16} className="text-[#01696F]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email</span>
                    <span className="text-sm font-semibold text-zinc-800 truncate">{user.email}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#e7f1f2] flex items-center justify-center shrink-0 overflow-hidden">
                    <Phone size={16} className="text-[#01696F]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Phone</span>
                    {isEditing ? (
                      <input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="text-sm font-semibold text-zinc-800 border-b border-[#01696F]/40 focus:outline-none focus:border-[#01696F] bg-transparent w-full"
                        placeholder="+91 000 000 0000"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-zinc-800">{user.phone || "—"}</span>
                    )}
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#e7f1f2] flex items-center justify-center shrink-0 overflow-hidden">
                    <Briefcase size={16} className="text-[#01696F]" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Role</span>
                    <span className="text-sm font-semibold text-zinc-800 capitalize">{user.role}</span>
                  </div>
                </div>
              </div>

              {/* Success / Error feedback */}
              {editSuccess && (
                <div className="w-full mt-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-green-700 text-xs font-semibold">
                  <Check size={12} /> Profile updated!
                </div>
              )}
              {editError && (
                <div className="w-full mt-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-600 text-xs font-semibold">
                  <X size={12} /> {editError}
                </div>
              )}

              {/* Edit / Save / Cancel Buttons */}
              <div className="w-full mt-5">
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSave}
                      disabled={editLoading}
                      className="flex-1 py-3 rounded-2xl bg-[#01696F] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#01575c] transition-all active:scale-[0.98] shadow-sm disabled:opacity-60"
                    >
                      {editLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Save
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="flex-1 py-3 rounded-2xl bg-zinc-100 text-zinc-600 text-sm font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all active:scale-[0.98]"
                    >
                      <X size={14} />
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-3 rounded-2xl bg-[#01696F] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#01575c] transition-all active:scale-[0.98] shadow-sm"
                  >
                    <Edit3 size={14} />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ──────────────────── 2. Change Password Card ──────────────────── */}
          <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm p-6 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={16} className="text-[#01696F]" />
                <h2 className="text-lg font-extrabold text-zinc-900">Change Password</h2>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Keep your account secure by using a strong password.</p>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              {/* Old Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Old Password
                </label>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full px-4 py-3 pr-10 bg-[#F0EDE7] rounded-xl text-sm text-zinc-700 placeholder-zinc-400 border border-transparent focus:outline-none focus:border-[#01696F]/40 transition-all font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password..."
                    className="w-full px-4 py-3 pr-10 bg-[#F0EDE7] rounded-xl text-sm text-zinc-700 placeholder-zinc-400 border border-transparent focus:outline-none focus:border-[#01696F]/40 transition-all font-medium"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password link */}
              <button
                type="button"
                className="text-sm text-zinc-400 hover:text-[#01696F] font-semibold text-left transition-colors"
              >
                Forgot your password?
              </button>

              {/* Feedback */}
              {pwSuccess && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-green-700 text-xs font-semibold">
                  <Check size={12} /> Password changed successfully!
                </div>
              )}
              {pwError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-red-600 text-xs font-semibold">
                  <X size={12} /> {pwError}
                </div>
              )}

              <button
                type="submit"
                disabled={pwLoading}
                className="w-full py-3 rounded-2xl bg-[#01696F] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#01575c] transition-all active:scale-[0.98] shadow-sm mt-1 disabled:opacity-60"
              >
                {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                Reset Password
              </button>
            </form>
          </div>

          {/* ──────────────────── 3. Plan Card ──────────────────── */}
          <div className="flex flex-col gap-4">
            {/* Current Plan */}
            <div
              className="relative rounded-3xl overflow-hidden border border-zinc-200 shadow-sm"
            >
              {/* Top Label */}
              <div className="w-full bg-white py-3.5 text-center border-b border-zinc-100">
                <span className="text-sm font-bold text-zinc-800 tracking-wide">
                  {planKey === "free" ? "Free tier" : planKey === "pro" ? "For one person" : "For your organization"}
                </span>
              </div>

              {/* Highlight Section */}
              <div className="flex flex-col items-center justify-center p-8 text-center min-h-[200px] bg-[#e7f1f2] text-[#01696F]">
                <div className="relative mb-3 flex items-center justify-center">
                  <span className="absolute -top-1.5 -left-4 text-[10px] font-bold text-[#01696F]/80">✦</span>
                  <span className="absolute -top-2.5 right-1 text-[11px] font-bold text-[#01696F]/80">✦</span>
                  <span className="absolute bottom-2 -right-3 text-[9px] font-bold text-[#01696F]/80">✦</span>
                  <Zap className="h-11 w-11 stroke-[1.5] text-[#01696F] fill-none" />
                </div>
                <h3 className="text-base font-extrabold tracking-wider mb-2">
                  {planLabel.toUpperCase()}
                </h3>
                <span className="text-3xl font-black tracking-tight">
                  {planKey === "free" ? "₹0/Month" : planKey === "pro" ? "₹299/Month" : "LET'S TALK"}
                </span>
              </div>

              {/* Features */}
              <div className="flex flex-col p-6 bg-white">
                <p className="text-sm font-bold text-zinc-900 mb-4">Features you&apos;ll get:</p>
                <ul className="flex flex-col gap-3 mb-6">
                  {[
                    "Easy drag & drop editor",
                    "Large library of professionally designed templates.",
                    "1000+ design types",
                    "Large library of stock photos & graphics",
                    "10 GB of cloud storage",
                  ].map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="shrink-0 text-[#01696F] mt-0.5">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23 12l-2.44-2.78.34-3.68-3.61-.82-1.89-3.18L12 3 8.6 1.54 6.71 4.72l-3.61.81.34 3.68L1 12l2.44 2.78-.34 3.69 3.61.82 1.89 3.18L12 21l3.4 1.46 1.89-3.18 3.61-.82-.34-3.68L23 12zm-13 5l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                        </svg>
                      </div>
                      <span className="text-sm text-zinc-600 font-medium leading-tight">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer anchor */}
              <Link
                href="/pricing"
                className="block w-full bg-[#01696F] text-white text-center py-3.5 font-bold text-sm tracking-wide hover:bg-[#01575c] transition-colors"
              >
                {planKey === "free" ? "Upgrade Plan" : "Your Active Plan"} →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
