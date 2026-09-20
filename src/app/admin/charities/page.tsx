"use client";

import * as React from "react";
import { DataStore } from "@/lib/data/store";
import { Charity, UpcomingEvent } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  Heart,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Star,
  MapPin,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export default function AdminCharitiesPage() {
  const [currentUser] = React.useState(DataStore.getCurrentUser());
  const [charities, setCharities] = React.useState<Charity[]>([]);
  const [feedback, setFeedback] = React.useState<string | null>(null);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingCharity, setEditingCharity] = React.useState<Charity | null>(null);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Environment & Climate");
  const [location, setLocation] = React.useState("");
  const [websiteUrl, setWebsiteUrl] = React.useState("");
  const [tagline, setTagline] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [bannerUrl, setBannerUrl] = React.useState("");
  const [isFeatured, setIsFeatured] = React.useState(false);

  // Delete Confirm Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [charityToDelete, setCharityToDelete] = React.useState<Charity | null>(null);

  const loadCharities = React.useCallback(() => {
    setCharities(DataStore.getCharities());
  }, []);

  React.useEffect(() => {
    loadCharities();
  }, [loadCharities]);

  const openAddModal = () => {
    setEditingCharity(null);
    setName("");
    setCategory("Environment & Climate");
    setLocation("Inverness, Scotland");
    setWebsiteUrl("https://scotlandgreenways.org");
    setTagline("Restoring native heather & bird corridors across highland fairways.");
    setDescription("Highland Greenways collaborates with course superintendents to build pesticide-free buffer zones and wetlands supporting local biodiversity.");
    setBannerUrl("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800");
    setIsFeatured(false);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Charity) => {
    setEditingCharity(c);
    setName(c.name);
    setCategory(c.category);
    setLocation(c.location);
    setWebsiteUrl(c.website_url);
    setTagline(c.tagline);
    setDescription(c.description);
    setBannerUrl(c.banner_url || "");
    setIsFeatured(c.is_featured);
    setIsModalOpen(true);
  };

  const handleSaveCharity = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCharity) {
      DataStore.updateCharity(
        editingCharity.id,
        {
          name,
          category,
          location,
          website_url: websiteUrl,
          tagline,
          description,
          banner_url: bannerUrl,
          is_featured: isFeatured,
        },
        currentUser.id
      );
      setFeedback("Charity details updated successfully.");
    } else {
      DataStore.createCharity(
        {
          name,
          slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          category,
          location,
          website_url: websiteUrl,
          tagline,
          description,
          banner_url: bannerUrl,
          is_featured: isFeatured,
          upcoming_events: [],
        },
        currentUser.id
      );
      setFeedback("New charity partner created and published to directory.");
    }

    setIsModalOpen(false);
    loadCharities();
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = () => {
    if (!charityToDelete) return;
    DataStore.deleteCharity(charityToDelete.id, currentUser.id);
    setFeedback(`Charity partner "${charityToDelete.name}" removed from platform.`);
    setDeleteConfirmOpen(false);
    setCharityToDelete(null);
    loadCharities();
    setTimeout(() => setFeedback(null), 3500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gold">Charity Governance</Badge>
            <span className="text-xs text-slate-500">PRD Section 21</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Charity Partners &amp; Beneficiaries
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage partner profiles, verify non-profit credentials, and monitor disbursed funding.
          </p>
        </div>

        <Button variant="primary" onClick={openAddModal} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Add Charity Partner
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {feedback}
        </div>
      )}

      {/* Charities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {charities.map((c) => (
          <Card key={c.id} className="p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="success">{c.category}</Badge>
                    {c.is_featured && <Badge variant="gold">Featured</Badge>}
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1.5">{c.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5 text-brand-400" /> {c.location}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Raised</span>
                  <p className="text-lg font-black text-brand-400">
                    {formatCurrency(c.total_received)}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-semibold italic">{c.tagline}</p>
              <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                {c.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {c.upcoming_events?.length || 0} scheduled events
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditModal(c)}
                  className="gap-1.5 text-xs py-1"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setCharityToDelete(c);
                    setDeleteConfirmOpen(true);
                  }}
                  className="gap-1.5 text-xs py-1"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Dialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCharity ? "Edit Charity Partner" : "Register New Charity"}
        description="Provide vetted organization details, mission overview, and category."
      >
        <form onSubmit={handleSaveCharity} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Organization Name
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Veterans On Course"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Category
              </label>
              <Input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Location
              </label>
              <Input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Website URL
            </label>
            <Input
              type="url"
              required
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Tagline
            </label>
            <Input
              type="text"
              required
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Detailed Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="isFeatured" className="text-xs text-slate-300 font-semibold cursor-pointer">
              Pin as Featured Charity on Homepage
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingCharity ? "Save Changes" : "Create Charity"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm Modal */}
      <Dialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Charity Partner"
        description="Are you certain you want to remove this charity partner? Any active subscriber pledges will be notified to reassign their pledge."
      >
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
          Organization: <strong>{charityToDelete?.name}</strong>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800">
          <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Confirm Deletion
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
