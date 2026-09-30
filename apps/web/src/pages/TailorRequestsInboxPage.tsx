import React, { useState, useEffect } from 'react';
import { api } from '@tailorconnect/api-client';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { EmptyState, Skeleton } from '../components/ui/EmptyState';
import { formatCurrency, formatDate } from '../lib/utils';
import {
  Inbox,
  Calendar,
  MapPin,
  Sparkles,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export function TailorRequestsInboxPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quote Composer Modal
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteItems, setQuoteItems] = useState<{ title: string; amount: number }[]>([
    { title: 'Pattern Cutting & Stitching Labor', amount: 1200 },
    { title: 'Hand Detailing / Finishing', amount: 300 },
  ]);
  const [advanceAmount, setAdvanceAmount] = useState('500');
  const [estimatedReadyDate, setEstimatedReadyDate] = useState('');
  const [fittingsIncluded, setFittingsIncluded] = useState(1);
  const [quoteNotes, setQuoteNotes] = useState('Customer to provide raw silk cloth with borders.');
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Q&A Question Modal
  const [questionRequest, setQuestionRequest] = useState<any | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [isSendingQuestion, setIsSendingQuestion] = useState(false);

  const loadInbox = async () => {
    setIsLoading(true);
    try {
      const res = await api.requests.getTailorInbox();
      if (res.success && res.data) {
        setRequests(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const openQuoteModal = (req: any) => {
    setActiveRequest(req);
    setError(null);
    setEstimatedReadyDate(req.requiredDate ? req.requiredDate.split('T')[0] : '');

    // Pre-populate realistic quote based on request
    if (req.garmentType.toLowerCase().includes('blouse')) {
      setQuoteItems([
        { title: 'Blouse Stitching & Pattern Cutting', amount: 1200 },
        { title: 'Zardosi & Maggam Hand Detailing', amount: 400 },
        { title: 'Padded Cups & Piping', amount: 100 },
      ]);
      setAdvanceAmount('500');
    } else if (req.garmentType.toLowerCase().includes('kurti')) {
      setQuoteItems([
        { title: 'Kurti / Anarkali Stitching', amount: 850 },
        { title: 'Bottom / Salwar Tailoring', amount: 350 },
      ]);
      setAdvanceAmount('400');
    } else {
      setQuoteItems([
        { title: 'Bespoke Stitching Labor', amount: 1500 },
        { title: 'Finishing & Trims', amount: 300 },
      ]);
      setAdvanceAmount('500');
    }
  };

  const handleAddItem = () => {
    setQuoteItems([...quoteItems, { title: '', amount: 100 }]);
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: 'title' | 'amount', value: any) => {
    const next = [...quoteItems];
    next[index] = { ...next[index], [field]: field === 'amount' ? parseFloat(value) || 0 : value };
    setQuoteItems(next);
  };

  const totalAmount = quoteItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    setIsSubmittingQuote(true);
    setError(null);

    try {
      const res = await api.quotes.create({
        requestId: activeRequest.id,
        totalAmount,
        advanceAmount: parseFloat(advanceAmount) || 0,
        estimatedReadyDate,
        fittingsIncluded: Number(fittingsIncluded),
        notes: quoteNotes,
        items: quoteItems,
      });

      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to submit quote');
      }

      setQuoteSuccess(true);
      setActiveRequest(null);
      await loadInbox();
    } catch (err: any) {
      setError(err.message || 'Error submitting quote');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionRequest || !questionText.trim()) return;
    setIsSendingQuestion(true);
    try {
      await api.requests.sendMessage(questionRequest.id, questionText.trim());
      setQuestionRequest(null);
      setQuestionText('');
      alert('Your question was sent to the customer!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingQuestion(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
          Inbound Customer Requests
        </h1>
        <p className="text-stone-500 text-sm mt-1">
          Geo-matched requests from customers within your studio's service radius looking for your stitching specializations.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="p-6 rounded-2xl border border-stone-200 bg-white space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-6 h-6 text-stone-400" />}
          title="No pending customer requests"
          description="You're all caught up! When nearby customers submit stitching requirements matching your services, they will appear here instantly."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono font-bold text-stone-400">{req.requestNumber}</span>
                      <h3 className="font-bold text-lg text-stone-900">{req.garmentType}</h3>
                      {req.alreadyQuoted && (
                        <Badge variant="gold">Quote Sent</Badge>
                      )}
                    </div>

                    <p className="text-xs text-stone-700 bg-stone-50 p-2.5 rounded-lg border border-stone-200 italic max-w-2xl">
                      "{req.rawPrompt}"
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                      <span className="font-semibold text-stone-900">
                        Customer: {req.customer?.firstName} {req.customer?.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {req.locationLocality} ({req.distanceKm} km away)
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        Target: <strong>{formatDate(req.requiredDate)}</strong>
                      </span>
                      {req.budgetMin && req.budgetMax && (
                        <span>
                          Target Budget: {formatCurrency(req.budgetMin)} - {formatCurrency(req.budgetMax)}
                        </span>
                      )}
                    </div>

                    {/* Reference Images */}
                    {req.images && req.images.length > 0 && (
                      <div className="flex gap-2 pt-2">
                        {req.images.map((img: any) => (
                          <img
                            key={img.id}
                            src={img.imageUrl}
                            alt="Reference"
                            className="w-16 h-16 rounded-lg object-cover border border-stone-200"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tailor Action Triggers */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setQuestionRequest(req);
                        setQuestionText('');
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      Ask Question
                    </Button>

                    <Button
                      size="sm"
                      variant={req.alreadyQuoted ? 'outline' : 'primary'}
                      onClick={() => openQuoteModal(req)}
                      disabled={req.alreadyQuoted}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      {req.alreadyQuoted ? 'Quoted' : 'Send Itemized Quote'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Itemized Quote Composer Modal */}
      <Modal
        isOpen={!!activeRequest}
        onClose={() => setActiveRequest(null)}
        title={`Send Itemized Quote: ${activeRequest?.garmentType}`}
        description="Specify transparent labor, embroidery, and lining line items. Customer will review and accept."
        maxWidth="lg"
      >
        {activeRequest && (
          <form onSubmit={handleSubmitQuote} className="space-y-5 text-xs">
            {/* Customer brief */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex justify-between">
              <div>
                <p className="font-semibold text-stone-900">{activeRequest.garmentType}</p>
                <p className="text-stone-500">Required: {formatDate(activeRequest.requiredDate)}</p>
              </div>
              <div className="text-right">
                <p className="text-stone-500">Customer Budget Target</p>
                <p className="font-bold text-stone-900">
                  {activeRequest.budgetMin ? `${formatCurrency(activeRequest.budgetMin)} - ${formatCurrency(activeRequest.budgetMax)}` : 'Flexible'}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800 uppercase tracking-wider text-[11px]">Itemized Breakdown</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line
                </button>
              </div>

              {quoteItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                    placeholder="e.g. Stitching labor, Maggam work, Padding"
                    className="flex-1 p-2 rounded-lg border border-stone-200 text-xs"
                    required
                  />
                  <div className="relative w-32">
                    <span className="absolute left-2.5 top-2 text-stone-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleUpdateItem(index, 'amount', e.target.value)}
                      className="w-full pl-6 pr-2 py-2 rounded-lg border border-stone-200 text-xs font-semibold"
                      required
                    />
                  </div>
                  {quoteItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1 text-stone-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900 text-white font-bold text-sm">
                <span>Total Quotation:</span>
                <span className="text-amber-400 text-base">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Turnaround & Advance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Advance Amount (₹)</label>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full p-2 rounded-lg border border-stone-200"
                />
              </div>
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Estimated Ready Date</label>
                <input
                  type="date"
                  value={estimatedReadyDate}
                  onChange={(e) => setEstimatedReadyDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-stone-200"
                  required
                />
              </div>
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Fittings Included</label>
                <input
                  type="number"
                  value={fittingsIncluded}
                  onChange={(e) => setFittingsIncluded(parseInt(e.target.value) || 1)}
                  min={0}
                  className="w-full p-2 rounded-lg border border-stone-200"
                />
              </div>
            </div>

            <Textarea
              label="Tailor Notes / Fabric Instructions"
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              placeholder="e.g. Please bring cloth to studio or request pickup. Includes gold piping."
              rows={2}
            />

            {error && (
              <p className="p-2.5 rounded-lg bg-red-50 text-red-700 font-medium">{error}</p>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveRequest(null)}>
                Cancel
              </Button>
              <Button type="submit" size="md" isLoading={isSubmittingQuote}>
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" />
                Submit Quote to Customer
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Ask Question Modal */}
      <Modal
        isOpen={!!questionRequest}
        onClose={() => setQuestionRequest(null)}
        title="Ask Customer a Clarifying Question"
        description="The customer will receive an instant notification and can reply within this request's message thread."
      >
        {questionRequest && (
          <form onSubmit={handleSendQuestion} className="space-y-4 text-xs">
            <Textarea
              label="Your Question"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g. Please provide blouse back-length and confirm whether padding is required."
              rows={3}
              required
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setQuestionRequest(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSendingQuestion} disabled={!questionText.trim()}>
                Send Question
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
