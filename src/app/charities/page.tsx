"use client";

import * as React from "react";
import Link from "next/link";
import { DataStore } from "@/lib/data/store";
import { Charity } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Search, MapPin, Heart, ArrowRight, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

export default function CharitiesPage() {
  const [query, setQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [charities, setCharities] = React.useState<Charity[]>([]);

  // Direct independent donation modal
  const [directDonateOpen, setDirectDonateOpen] = React.useState(false);
  const [selectedCharityForDonation, setSelectedCharityForDonation] = React.useState<Charity | null>(null);
  const [donationAmount, setDonationAmount] = React.useState(50);
  const [donationSuccess, setDonationSuccess] = React.useState(false);

  React.useEffect(() => {
    setCharities(DataStore.getCharities());
  }, []);

  const categories = ["All", "Veterans & Mental Health", "Environment & Climate", "Youth & Education", "Conservation", "Medical Research"];

  const filteredCharities = charities.filter((c) => {
    const matchesCat = selectedCategory === "All" || c.category === selectedCategory;
    const matchesQuery =
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.tagline.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase()) ||
      c.location.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleDirectDonate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharityForDonation) return;
    // Simulate direct non-gameplay donation
    selectedCharityForDonation.total_received += donationAmount;
    setDonationSuccess(true);
    setTimeout(() => {
      setDonationSuccess(false);
      setDirectDonateOpen(false);
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Heart className="h-3.5 w-3.5" />
            Vetted Non-Profit Directory
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Charities Changing Lives
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Choose which verified organization receives your monthly subscription pledge, or make an independent donation.
          </p>
        </div>

        <Link href="/charities/donate">
          <Button
            variant="gold"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Make Independent Donation
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, location, or keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-brand-500 text-slate-950"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Charity Grid */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredCharities.map((charity) => (
          <Card
            key={charity.id}
            className="group flex flex-col justify-between hover:border-slate-700 transition-all duration-300 overflow-hidden"
          >
            <div>
              <div className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden">
                <img
                  src={charity.banner_url || "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800"}
                  alt={charity.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge variant="success">{charity.category}</Badge>
                  {charity.is_featured && <Badge variant="gold">Featured</Badge>}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MapPin className="h-3.5 w-3.5 text-brand-400" />
                  {charity.location}
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-brand-400 transition-colors">
                  {charity.name}
                </h3>
                <p className="text-xs font-semibold text-slate-300 italic">{charity.tagline}</p>
                <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                  {charity.description}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Raised</p>
                <p className="text-lg font-bold text-white">{formatCurrency(charity.total_received)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedCharityForDonation(charity);
                    setDirectDonateOpen(true);
                  }}
                  className="text-xs font-semibold text-amber-400 hover:text-amber-300 px-2 py-1 rounded"
                >
                  Direct Gift
                </button>
                <Link href={`/charities/${charity.id}`}>
                  <Button size="sm" variant="secondary" className="text-xs gap-1">
                    Details <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCharities.length === 0 && (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl my-8">
          <p className="text-slate-400">No charities found matching your search.</p>
        </div>
      )}

      {/* Independent Donation Modal (Not tied to gameplay) */}
      <Dialog
        isOpen={directDonateOpen}
        onClose={() => setDirectDonateOpen(false)}
        title="Direct Independent Donation"
        description="Support a vetted charity directly without subscription or gameplay entry."
      >
        {donationSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Heart className="h-7 w-7" />
            </div>
            <h4 className="text-2xl font-bold text-white">Thank You For Your Support!</h4>
            <p className="text-sm text-slate-300">
              Your direct gift of {formatCurrency(donationAmount)} to{" "}
              <strong>{selectedCharityForDonation?.name}</strong> has been processed. A receipt has been sent to your email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleDirectDonate} className="space-y-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Select Beneficiary
              </label>
              <select
                value={selectedCharityForDonation?.id || ""}
                onChange={(e) => {
                  const c = charities.find((item) => item.id === e.target.value);
                  if (c) setSelectedCharityForDonation(c);
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Gift Amount (USD)
              </label>
              <div className="grid grid-cols-4 gap-2.5 mt-2">
                {[25, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDonationAmount(amt)}
                    className={`py-2 text-sm font-bold rounded-xl border transition-colors ${
                      donationAmount === amt
                        ? "border-brand-500 bg-brand-500/20 text-brand-400"
                        : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
              <p>
                <strong>100% Pass-Through:</strong> 100% of direct donations bypass all platform fees and are transferred directly to the charity&apos;s registered account.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setDirectDonateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Complete Gift of ${donationAmount}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
