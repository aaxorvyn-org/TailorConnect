import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@tailorconnect/api-client';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDate, formatDateTime } from '../lib/utils';
import {
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Send,
  AlertCircle,
  Scissors,
  CreditCard,
  Banknote,
  Store,
} from 'lucide-react';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [request, setRequest] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Quote Acceptance State
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptPaymentOption, setAcceptPaymentOption] = useState<'ONLINE' | 'PAY_LATER' | 'OFFLINE'>('ONLINE');
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await api.requests.getById(id);
      if (res.success && res.data) {
        setRequest(res.data);
        setMessages(res.data.messages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newMessage.trim()) return;
    setIsSendingMessage(true);
    try {
      const res = await api.requests.sendMessage(id, newMessage.trim());
      if (res.success && res.data) {
        setMessages([...messages, res.data]);
        setNewMessage('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!selectedQuote) return;
    setIsAccepting(true);
    setError(null);
    try {
      const res = await api.quotes.accept(selectedQuote.id, acceptPaymentOption);
      if (res.success && res.data?.order) {
        setSelectedQuote(null);
        navigate(`/app/orders/${res.data.order.id}`);
      } else {
        throw new Error(res.error?.message || 'Failed to accept quote');
      }
    } catch (e: any) {
      setError(e.message || 'Error accepting quote');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-stone-500">Loading request details...</div>;
  }

  if (!request) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-stone-900">Request Not Found</h2>
        <Link to="/app/requests" className="mt-4 inline-block">
          <Button size="sm">Back to My Requests</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-stone-400">{request.requestNumber}</span>
            <h1 className="font-display text-2xl font-bold text-stone-900">{request.garmentType}</h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Submitted on {formatDate(request.createdAt)} · Target Date: {formatDate(request.requiredDate)}
          </p>
        </div>

        {request.status === 'ACCEPTED' && request.order && (
          <Link to={`/app/orders/${request.order.id}`}>
            <Button size="sm">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              View Active Order Timeline
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Request Specs & Contextual Messages */}
        <div className="lg:col-span-2 space-y-6">
          {/* Specifications Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Garment Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-stone-700 bg-stone-50 p-3.5 rounded-xl border border-stone-200 leading-relaxed italic">
                "{request.rawPrompt}"
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-stone-100 bg-white">
                  <span className="text-stone-400 block">Category</span>
                  <span className="font-semibold text-stone-900 mt-0.5 block">{request.categoryName}</span>
                </div>
                <div className="p-3 rounded-lg border border-stone-100 bg-white">
                  <span className="text-stone-400 block">Sleeve Style</span>
                  <span className="font-semibold text-stone-900 mt-0.5 block">
                    {request.structuredRequirements?.sleeveStyle || 'Standard'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-stone-100 bg-white">
                  <span className="text-stone-400 block">Neckline</span>
                  <span className="font-semibold text-stone-900 mt-0.5 block">
                    {request.structuredRequirements?.necklineStyle || 'Standard'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-stone-100 bg-white">
                  <span className="text-stone-400 block">Fabric Status</span>
                  <span className="font-semibold text-stone-900 mt-0.5 block">
                    {request.fabricProvidedByCustomer ? 'Provided by Customer' : 'Tailor Sourced'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-stone-100 bg-white">
                  <span className="text-stone-400 block">Budget Target</span>
                  <span className="font-semibold text-stone-900 mt-0.5 block">
                    {request.budgetMin ? `${formatCurrency(request.budgetMin)} - ${formatCurrency(request.budgetMax)}` : 'Flexible'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-stone-100 bg-white">
                  <span className="text-stone-400 block">Pickup & Delivery</span>
                  <span className="font-semibold text-stone-900 mt-0.5 block">
                    {request.pickupRequired ? 'Pickup Requested' : 'Store Visit'}
                  </span>
                </div>
              </div>

              {/* Photos */}
              {request.images && request.images.length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-semibold text-stone-500 block mb-2">Reference Images ({request.images.length})</span>
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {request.images.map((img: any) => (
                      <div key={img.id} className="relative w-28 h-28 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                        <img src={img.imageUrl} alt="Reference" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contextual Q&A Messaging Thread */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-800" />
                  Clarifications & Contextual Q&A
                </CardTitle>
                <p className="text-xs text-stone-500 mt-0.5">
                  Direct questions about fabric, padding, or measurements stay tied to this request.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <p className="text-xs text-stone-400 text-center py-6 italic">
                    No questions yet. Tailors can ask clarifying questions before submitting quotes.
                  </p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-slate-900 text-white rounded-br-none'
                              : 'bg-stone-100 text-stone-900 rounded-bl-none border border-stone-200'
                          }`}
                        >
                          <p>{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-stone-400 mt-1 px-1">
                          {formatDateTime(msg.createdAt)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-stone-100">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message or answer tailor's question..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
                <Button type="submit" size="sm" isLoading={isSendingMessage} disabled={!newMessage.trim()}>
                  <Send className="w-3.5 h-3.5 mr-1" /> Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quotes Received */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Quotes Received ({request.quotes?.length || 0})
            </h2>
          </div>

          {request.quotes && request.quotes.length > 0 ? (
            request.quotes.map((quote: any) => {
              const isAccepted = quote.status === 'ACCEPTED';
              return (
                <Card
                  key={quote.id}
                  className={`border transition-all ${
                    isAccepted ? 'border-emerald-300 bg-emerald-50/30' : 'border-stone-200 hover:border-amber-300'
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Studio header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          to={`/tailors/${quote.business.slug}`}
                          className="font-bold text-stone-900 hover:text-amber-700 transition-colors text-base"
                        >
                          {quote.business.name}
                        </Link>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          Verified Atelier · Banjara Hills
                        </p>
                      </div>
                      <StatusBadge status={quote.status} />
                    </div>

                    {/* Itemized line items breakdown */}
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
                      {quote.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-stone-600">
                          <span>{item.title}</span>
                          <span className="font-medium text-stone-900">{formatCurrency(item.amount)}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-stone-200 flex justify-between font-bold text-sm text-stone-900">
                        <span>Total Quote</span>
                        <span className="text-amber-700">{formatCurrency(quote.totalAmount)}</span>
                      </div>
                      {quote.advanceAmount > 0 && (
                        <div className="flex justify-between text-stone-500 text-[11px]">
                          <span>Advance Required:</span>
                          <span className="font-medium">{formatCurrency(quote.advanceAmount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Ready Date & Fittings */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600">
                      <div className="p-2 rounded-lg bg-white border border-stone-200">
                        <span className="text-stone-400 block text-[10px]">Estimated Ready</span>
                        <span className="font-semibold text-stone-900">{formatDate(quote.estimatedReadyDate)}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-stone-200">
                        <span className="text-stone-400 block text-[10px]">Fittings Included</span>
                        <span className="font-semibold text-stone-900">{quote.fittingsIncluded} fitting trial</span>
                      </div>
                    </div>

                    {quote.notes && (
                      <p className="text-xs text-stone-500 italic bg-white p-2 rounded-lg border border-stone-100">
                        Note: {quote.notes}
                      </p>
                    )}

                    {/* Actions */}
                    {request.status !== 'ACCEPTED' && quote.status === 'SENT' && (
                      <Button
                        size="md"
                        className="w-full"
                        onClick={() => setSelectedQuote(quote)}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                        Accept Quote & Book
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-dashed p-6 text-center text-xs text-stone-500 space-y-2">
              <Clock className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="font-medium text-stone-800">Awaiting Tailor Quotes</p>
              <p className="text-stone-400">
                Tailors within your service radius have been notified and will issue itemized quotes shortly.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Quote Acceptance Modal */}
      <Modal
        isOpen={!!selectedQuote}
        onClose={() => setSelectedQuote(null)}
        title="Accept Quote & Initiate Order"
        description="Select how you wish to settle payment. An official order and tracking timeline will be created immediately."
      >
        {selectedQuote && (
          <div className="space-y-6 text-sm">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex justify-between font-bold text-stone-900">
                <span>{selectedQuote.business?.name}</span>
                <span className="text-amber-700">{formatCurrency(selectedQuote.totalAmount)}</span>
              </div>
              <p className="text-xs text-stone-500">
                Estimated Delivery: {formatDate(selectedQuote.estimatedReadyDate)} (Includes {selectedQuote.fittingsIncluded} fitting)
              </p>
            </div>

            {/* Payment Options Selection */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-stone-700 uppercase tracking-wider">Choose Payment Preference</p>

              <label
                onClick={() => setAcceptPaymentOption('ONLINE')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  acceptPaymentOption === 'ONLINE'
                    ? 'border-slate-900 bg-stone-50 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <CreditCard className="w-5 h-5 text-slate-900 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-900 text-xs">Pay Online Now (UPI / Card)</p>
                  <p className="text-xs text-stone-500">Pay advance or full amount digitally through test payment adapter</p>
                </div>
              </label>

              <label
                onClick={() => setAcceptPaymentOption('PAY_LATER')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  acceptPaymentOption === 'PAY_LATER'
                    ? 'border-slate-900 bg-stone-50 shadow-sm'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <Store className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-900 text-xs">Pay at Studio / Doorstep</p>
                  <p className="text-xs text-stone-500">Pay cash or UPI in person when tailor collects fabric or measurements</p>
                </div>
              </label>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedQuote(null)}>
                Cancel
              </Button>
              <Button size="md" onClick={handleAcceptQuote} isLoading={isAccepting}>
                Confirm Acceptance & Create Order
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
