"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DataStore } from "@/lib/data/store";
import { Charity } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  MapPin,
  Globe,
  Heart,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function CharityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const charityId = params.id as string;
  const [charity, setCharity] = React.useState<Charity | null>(null);
  const [pledgePushed, setPledgePushed] = React.useState(false);

  React.useEffect(() => {
    const found = DataStore.getCharityById(charityId);
    if (found) setCharity(found);
  }, [charityId]);

  if (!charity) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-white">Charity not found</h2>
        <Link href="/charities" className="mt-4 inline-block">
          <Button variant="outline">Back to directory</Button>
        </Link>
      </div>
    );
  }

  const handleSelectAsPledge = () => {
    const active = DataStore.getCurrentUser();
    DataStore.setUserCharity(active.id, charity.id, 20);
    setPledgePushed(true);
    setTimeout(() => {
      router.push("/dashboard/charity");
    }, 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/charities"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Charity Directory
      </Link>

      {/* Hero Banner */}
      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden mb-10 border border-slate-800 shadow-2xl">
        <img
          src={charity.banner_url || "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200"}
          alt={charity.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex gap-2 mb-2">
              <Badge variant="success">{charity.category}</Badge>
              {charity.is_featured && <Badge variant="gold">Featured Partner</Badge>}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {charity.name}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-xs sm:text-sm text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-brand-400" />
                {charity.location}
              </span>
              <a
                href={charity.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-brand-400 hover:underline"
              >
                <Globe className="h-4 w-4" />
                Visit Official Site <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          <Button
            variant={pledgePushed ? "secondary" : "primary"}
            onClick={handleSelectAsPledge}
            className="gap-2 shrink-0"
          >
            {pledgePushed ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-brand-400" />
                Pledge Selected!
              </>
            ) : (
              <>
                <Heart className="h-4 w-4" />
                Select as My Charity Pledge
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main description */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <h3 className="text-xl font-bold text-white mb-3">About The Organization</h3>
            <p className="text-base text-slate-300 font-medium leading-relaxed italic mb-4">
              &ldquo;{charity.tagline}&rdquo;
            </p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {charity.description}
            </p>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-400" />
                Upcoming Tournaments &amp; Events
              </h3>
              <Badge variant="outline">{charity.upcoming_events?.length || 0} Scheduled</Badge>
            </div>

            {charity.upcoming_events && charity.upcoming_events.length > 0 ? (
              <div className="space-y-4">
                {charity.upcoming_events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-base font-bold text-white">{event.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {event.location} &middot; {formatDate(event.date)}
                      </p>
                      {event.description && (
                        <p className="text-xs text-slate-300 mt-1">{event.description}</p>
                      )}
                    </div>
                    {event.target_amount && (
                      <div className="sm:text-right shrink-0">
                        <p className="text-[10px] uppercase text-slate-400 font-semibold">Goal</p>
                        <p className="text-sm font-bold text-amber-400">
                          {formatCurrency(event.target_amount)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">
                No public events currently scheduled. Check back soon for seasonal clinics and pro-ams.
              </p>
            )}
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-b from-brand-950/20 to-slate-900/60 border-brand-500/20">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Funding Milestones
            </h4>
            <div className="mt-4">
              <p className="text-3xl font-black text-brand-400">
                {formatCurrency(charity.total_received)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Total received through Digital Heroes</p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-3 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-400 font-semibold">Verified 501(c)(3) Equivalent</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Governance Rating</span>
                <span className="text-white font-semibold">Platinum Seal of Transparency</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              How Pledges Work
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              When you select this charity, your chosen percentage (minimum 10%) of each monthly subscription payment is disbursed directly on the 1st of every month.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
