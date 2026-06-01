"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuthStore } from "@/lib/auth-store";
import {
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Search,
  ArrowLeft,
  Settings,
  ShieldAlert,
  Layers,
  ChevronRight,
  TrendingUp,
  Globe,
  Award,
  BookOpen,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "";

// Pre-defined icons list for mapping
const AVAILABLE_ICONS = [
  { key: "Briefcase", icon: Briefcase, label: "Business/Job" },
  { key: "TrendingUp", icon: TrendingUp, label: "Growth/Finance" },
  { key: "Globe", icon: Globe, label: "Global/Tech" },
  { key: "Award", icon: Award, label: "Expertise/Badge" },
  { key: "BookOpen", icon: BookOpen, label: "Education" },
  { key: "Layers", icon: Layers, label: "Architecture" },
];

interface Profession {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconKey: string | null;
  orderIndex: number;
  isActive: boolean;
}

export default function ProfessionsAdmin() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);

  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfession, setEditingProfession] = useState<Profession | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    iconKey: "Briefcase",
    orderIndex: 0,
    isActive: true,
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete states
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Headers helper — built imperatively so no key ever holds `undefined`
  const headers = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  // Fetch all professions
  const fetchProfessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/v1/admin/professions`, { headers });
      const json = await res.json();
      if (json.data) {
        setProfessions(json.data);
      } else {
        console.error("Failed to load professions list", json);
      }
    } catch (err) {
      console.error("Error fetching professions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessions();
  }, [headers]);

  // Handle auto-slug creation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nameVal = e.target.value;
    const generatedSlug = nameVal
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData((prev) => ({
      ...prev,
      name: nameVal,
      slug: generatedSlug,
    }));
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingProfession(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      iconKey: "Briefcase",
      orderIndex: professions.length ? Math.max(...professions.map(p => p.orderIndex)) + 1 : 1,
      isActive: true,
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (p: Profession) => {
    setEditingProfession(p);
    setFormData({
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      iconKey: p.iconKey || "Briefcase",
      orderIndex: p.orderIndex,
      isActive: p.isActive,
    });
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Handle submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      setErrorMsg("Name and Slug are required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      let res;
      if (editingProfession) {
        // Update
        res = await fetch(`${API}/api/v1/admin/professions/${editingProfession.id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            ...formData,
            orderIndex: Number(formData.orderIndex),
          }),
        });
      } else {
        // Create
        res = await fetch(`${API}/api/v1/admin/professions`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...formData,
            orderIndex: Number(formData.orderIndex),
          }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "An error occurred during submission.");
      }

      setIsModalOpen(false);
      fetchProfessions();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete profession
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${API}/api/v1/admin/professions/${id}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setProfessions((prev) => prev.filter((p) => p.id !== id));
        setDeletingId(null);
      } else {
        const json = await res.json();
        alert(json.error || "Failed to delete profession");
      }
    } catch (err) {
      console.error("Error deleting profession", err);
    }
  };

  // Filtered professions
  const filteredProfessions = useMemo(() => {
    return professions.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [professions, searchQuery]);

  // Icon rendering helper
  const getIconComponent = (key: string | null) => {
    const match = AVAILABLE_ICONS.find((item) => item.key === key);
    return match ? match.icon : Briefcase;
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full max-h-[calc(100vh-24px)] overflow-y-auto p-8 gap-8 animate-fade-in bg-gradient-to-br from-[#fcfcfb] to-[#f5f3ee]">
        
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4 shrink-0">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-2 text-xs font-bold text-[#01696F]/80 hover:text-[#01696F] transition-colors w-fit group"
            id="back_to_admin_dash"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#01696F]/10 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#01696F]/60">
                Profession Setup
              </span>
              <h1 className="text-3xl font-extrabold text-[#01696F] tracking-tight">
                Corporate Professions
              </h1>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Configure professional career tracks and connect them to custom corporate skill building curricula.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
              id="add_new_profession_btn"
            >
              <Plus size={16} />
              Create Profession
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 bg-white border border-zinc-200/80 rounded-2xl px-4 py-3 shadow-sm shrink-0">
          <Search size={18} className="text-zinc-400 shrink-0" />
          <input
            type="text"
            placeholder="Search professions by name, slug, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium text-zinc-700 bg-transparent border-none outline-none placeholder:text-zinc-400"
            id="search_professions_input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Professions List/Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-[#01696F] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-zinc-500 font-medium animate-pulse">Loading professions...</p>
          </div>
        ) : filteredProfessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white border border-zinc-200/60 rounded-3xl p-12 text-center shadow-sm">
            <div className="p-4 bg-[#E6F0F1] text-[#01696F] rounded-full mb-4">
              <Briefcase size={32} />
            </div>
            <h3 className="text-base font-extrabold text-zinc-800 tracking-tight">No Professions Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              {searchQuery ? "Try resetting your search query or look for another keyword." : "Get started by adding your first professional track, like Investment Banker or Auditor."}
            </p>
            {!searchQuery && (
              <button
                onClick={handleOpenCreate}
                className="mt-4 px-4 py-2 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl transition-all"
              >
                Add First Profession
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfessions.map((p) => {
              const IconComp = getIconComponent(p.iconKey);
              return (
                <div
                  key={p.id}
                  className={`bg-white border transition-all rounded-3xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between group min-h-[220px] ${
                    p.isActive ? "border-zinc-200/80 hover:border-[#01696F]/30" : "border-zinc-200/50 opacity-75"
                  }`}
                >
                  <div>
                    {/* Header: Icon and Actions */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="p-3.5 bg-[#E6F0F1] text-[#01696F] rounded-2xl group-hover:scale-105 transition-transform">
                        <IconComp size={22} />
                      </div>
                      
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-[#01696F] transition-all"
                          title="Edit Profession"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingId(p.id)}
                          className="p-2 hover:bg-rose-50 rounded-xl text-zinc-500 hover:text-rose-600 transition-all"
                          title="Delete Profession"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Metadata & Title */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                          Order: {p.orderIndex}
                        </span>
                        {!p.isActive && (
                          <span className="text-[9px] font-black uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                            Draft
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-zinc-900 leading-snug">
                        {p.name}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium line-clamp-2">
                        {p.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-zinc-400 lowercase select-all">
                      slug: {p.slug}
                    </span>

                    <button
                      onClick={() => router.push(`/admin/professions/${p.id}/topics`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#01696F]/10 hover:bg-[#01696F] text-[#01696F] hover:text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Skill Topics
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 max-w-sm w-full mx-4 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center gap-3 text-rose-600">
                <div className="p-2.5 bg-rose-50 rounded-xl">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-base font-black tracking-tight">Delete Career Track?</h3>
              </div>
              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                Are you sure you want to delete this career profession? Deleting this will also cascade and remove all child Skill Topics, Skill Lessons, and user progress records.
              </p>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deletingId && handleDelete(deletingId)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create & Edit Form */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white border border-zinc-200 rounded-3xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[85vh] overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 shrink-0">
                <h3 className="text-lg font-extrabold text-[#01696F] tracking-tight">
                  {editingProfession ? "Edit Profession Properties" : "Create Career Profession"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body (Form) */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                {errorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl text-xs font-medium flex items-center gap-2">
                    <ShieldAlert size={16} className="shrink-0" />
                    {errorMsg}
                  </div>
                )}

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Profession Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chartered Accountant"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 outline-none focus:border-[#01696F]/50 focus:bg-white transition-all"
                  />
                </div>

                {/* Slug */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Slug (Auto-generated)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="chartered-accountant"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono text-zinc-600 outline-none focus:border-[#01696F]/50 focus:bg-white transition-all"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    placeholder="Provide a concise description of the career path..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 outline-none focus:border-[#01696F]/50 focus:bg-white resize-none transition-all"
                  />
                </div>

                {/* Icon Selection & Order Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Icon Key
                    </label>
                    <select
                      value={formData.iconKey}
                      onChange={(e) => setFormData((prev) => ({ ...prev, iconKey: e.target.value }))}
                      className="px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 outline-none focus:border-[#01696F]/50 focus:bg-white transition-all"
                    >
                      {AVAILABLE_ICONS.map((i) => (
                        <option key={i.key} value={i.key}>
                          {i.label} ({i.key})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Order Index
                    </label>
                    <input
                      type="number"
                      value={formData.orderIndex}
                      onChange={(e) => setFormData((prev) => ({ ...prev, orderIndex: parseInt(e.target.value) || 0 }))}
                      className="px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-700 outline-none focus:border-[#01696F]/50 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Toggle Status */}
                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="isActive_checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="w-4 h-4 text-[#01696F] border-zinc-300 rounded focus:ring-[#01696F]"
                  />
                  <label htmlFor="isActive_checkbox" className="text-xs font-bold text-zinc-600 cursor-pointer">
                    Active & Available for Students
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 mt-6 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 hover:bg-zinc-100 rounded-xl text-xs font-bold text-zinc-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#01696F] hover:bg-[#015257] text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    <Save size={14} />
                    {isSubmitting ? "Saving..." : "Save Profession"}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}
