import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@tailorconnect/api-client';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState, Skeleton } from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  FileText,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Plus,
} from 'lucide-react';

export function CustomerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      setIsLoading(true);
      try {
        const res = await api.requests.getMyRequests();
        if (res.success && res.data) {
          setRequests(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadRequests();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            My Stitching Requests
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Track incoming quotes and tailor questions for your custom garments.
          </p>
        </div>
        <Link to="/app/requests/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1.5" />
            New Request
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="p-5 rounded-2xl border border-stone-200 bg-white space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-6 h-6 text-stone-400" />}
          title="No stitching requests yet"
          description="Ready to get something stitched? Describe your garment, and verified tailors nearby will send you itemized quotes."
          actionLabel="Create First Request"
          onAction={() => (window.location.href = '/app/requests/new')}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-stone-400">
                        {req.requestNumber}
                      </span>
                      <h3 className="font-bold text-lg text-stone-900">
                        {req.garmentType}
                      </h3>
                      <StatusBadge status={req.status} />
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 max-w-2xl">
                      "{req.rawPrompt}"
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        Required: <strong>{formatDate(req.requiredDate)}</strong>
                      </span>
                      {req.budgetMin && req.budgetMax && (
                        <span>
                          Budget: {formatCurrency(req.budgetMin)} – {formatCurrency(req.budgetMax)}
                        </span>
                      )}
                      <span>
                        Locality: {req.locationLocality}, {req.locationCity}
                      </span>
                    </div>
                  </div>

                  {/* Quotes Received Callout & Link */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <div className="text-left sm:text-right">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        {req.quotesCount || 0} Quotes Received
                      </span>
                    </div>

                    <Link to={`/app/requests/${req.id}`}>
                      <Button size="sm" variant="outline">
                        View Details & Quotes
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
