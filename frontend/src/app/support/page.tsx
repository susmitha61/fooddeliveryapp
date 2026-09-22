'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { RoleSidebar } from '@/components/layout/CustomerSidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAppSelector } from '@/store';
import {
  useGetMyTicketsQuery,
  useCreateTicketMutation,
  useCloseTicketMutation,
  useReplyToTicketMutation,
  useGetAllTicketsQuery,
  useUpdateTicketMutation,
  useAgentReplyMutation,
  useDeleteTicketMutation,
  useGetMyReviewsQuery,
  useDeleteReviewMutation,
} from '@/store/api/supportApi';
import { useGetRestaurantsQuery, useGetMyRestaurantsQuery } from '@/store/api/restaurantApi';
import { ManagerUnassignedScreen } from '@/components/manager/ManagerUnassignedScreen';
import { LoadingSpinner } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  MessageSquare, Plus, X, Send, ChevronDown, ChevronRight,
  Clock, CheckCircle, AlertCircle, Loader2, Trash2, Star, ThumbsUp, MessageCircle, Edit2, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'ORDER_ISSUE', 'PAYMENT_ISSUE', 'DELIVERY_ISSUE',
  'FOOD_QUALITY', 'APP_ISSUE', 'ACCOUNT_ISSUE', 'REFUND_REQUEST', 'OTHER',
];

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'text-sky-400', MEDIUM: 'text-amber-400',
  HIGH: 'text-orange-400', URGENT: 'text-rose-400',
};

// ─── Create Ticket Form ───────────────────────────────────────────────────────
function CreateTicketForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    category: 'OTHER', subject: '', description: '', orderId: '',
  });
  const [createTicket, { isLoading }] = useCreateTicketMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.subject.length < 5) { toast.error('Subject must be at least 5 characters'); return; }
    if (form.description.length < 10) { toast.error('Description must be at least 10 characters'); return; }
    try {
      await createTicket({
        category: form.category,
        subject: form.subject.trim(),
        description: form.description.trim(),
        ...(form.orderId.trim() ? { orderId: form.orderId.trim() } : {}),
      }).unwrap();
      toast.success('Support ticket created!');
      onClose();
    } catch (err: any) {
      const errors = err?.data?.data;
      if (errors && typeof errors === 'object') {
        toast.error(Object.values(errors)[0] as string);
      } else {
        toast.error(err?.data?.message || 'Failed to create ticket');
      }
    }
  };

  const inputCls = 'w-full px-3 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors';

  return (
    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 mb-6">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-outfit font-bold text-lg">New Support Ticket</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--background-color)] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category *</label>
            <select className={inputCls} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Order ID (if order-related)</label>
            <input className={inputCls} value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
              placeholder="Leave blank if not order-related" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject * (5–200 chars)</label>
          <input className={inputCls} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
            placeholder="Brief summary of your issue" required minLength={5} maxLength={200} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Description * (10–2000 chars)</label>
          <textarea className={inputCls} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={4} placeholder="Describe your issue in detail..." required minLength={10} maxLength={2000} />
        </div>

        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose}
            className="px-5 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] text-sm font-semibold rounded-xl">
            Cancel
          </button>
          <button type="submit" disabled={isLoading}
            className="px-5 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-sm font-bold rounded-xl disabled:opacity-60 flex items-center gap-2">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Ticket
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Edit Ticket Modal ───────────────────────────────────────────────────────
function EditTicketModal({
  ticket,
  onClose,
  onSave,
}: {
  ticket: any;
  onClose: () => void;
  onSave: (data: { subject: string; category: string; description: string }) => void;
}) {
  const [form, setForm] = useState({
    subject: ticket.subject || '',
    category: ticket.category || 'OTHER',
    description: ticket.description || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.subject.length < 5) {
      toast.error('Subject must be at least 5 characters');
      return;
    }
    if (form.description.length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }
    onSave(form);
  };

  const inputCls =
    'w-full px-3 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)] transition-colors';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
          <h3 className="font-outfit font-bold text-base flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-[var(--primary-color)]" />
            <span>Edit Ticket #{ticket.ticketNumber || ticket.ticketId?.slice(-8)}</span>
          </h3>
          <button onClick={onClose} className="p-1.5 text-[var(--text-muted)] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Category
            </label>
            <select
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Subject
            </label>
            <input
              className={inputCls}
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              required
              minLength={5}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
              Description
            </label>
            <textarea
              className={inputCls}
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              minLength={10}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Ticket Row ───────────────────────────────────────────────────────────────
function TicketRow({
  ticket,
  isAdmin,
  isExpanded,
  onToggle,
  onClose,
  onReply,
  onDelete,
  onUpdate,
  onEdit,
}: {
  ticket: any;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  onReply: (msg: string) => void;
  onDelete: () => void;
  onUpdate: (data: any) => void;
  onEdit?: () => void;
}) {
  const [replyMsg, setReplyMsg] = useState('');
  const [agentNote, setAgentNote] = useState('');

  return (
    <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-[var(--background-color)] transition-colors gap-2"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[var(--primary-color)] mt-0.5 shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)] mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold text-[var(--primary-color)]">
                {ticket.ticketNumber || ticket.ticketId?.slice(-8)}
              </span>
              <StatusBadge status={ticket.status} type="ticket" />
              <span
                className={`text-[10px] font-bold ${
                  PRIORITY_STYLES[ticket.priority] || ''
                }`}
              >
                {ticket.priority}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] bg-[var(--background-color)] px-2 py-0.5 rounded-lg border border-[var(--border-color)]">
                {ticket.category?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm font-semibold truncate">{ticket.subject}</p>
            {ticket.userName && (
              <p className="text-xs text-[var(--text-muted)]">
                by {ticket.userName} · {ticket.userEmail}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-7 sm:ml-0">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors"
              title="Edit Ticket"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {ticket.status !== 'CLOSED' && !isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-semibold rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              Close
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
            title="Delete / Withdraw Ticket"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t border-[var(--border-color)] p-4 space-y-4">
          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-[var(--text-muted)] mb-1">Description</p>
            <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {ticket.orderId && (
            <p className="text-xs text-[var(--text-muted)]">🔗 Order ID: <span className="font-mono text-[var(--primary-color)]">{ticket.orderId}</span></p>
          )}

          {/* Replies thread */}
          {ticket.replies && ticket.replies.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Conversation</p>
              {ticket.replies.map((r: any) => (
                <div key={r.replyId} className={`p-3 rounded-xl text-sm ${
                  r.senderType === 'AGENT'
                    ? 'bg-[var(--primary-color)]/10 border border-[var(--primary-color)]/20 ml-6'
                    : 'bg-[var(--background-color)] border border-[var(--border-color)] mr-6'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[10px] font-bold ${r.senderType === 'AGENT' ? 'text-[var(--primary-color)]' : 'text-[var(--text-muted)]'}`}>
                      {r.senderType === 'AGENT' ? '🛠 Support Agent' : '👤 ' + (r.repliedByName || 'You')}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                    </span>
                  </div>
                  <p>{r.message}</p>
                </div>
              ))}
            </div>
          )}

          {ticket.resolutionNote && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-xs font-bold text-emerald-400 mb-1">Resolution Note</p>
              <p className="text-sm text-emerald-200">{ticket.resolutionNote}</p>
            </div>
          )}

          {/* User reply */}
          {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && !isAdmin && (
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                value={replyMsg} onChange={e => setReplyMsg(e.target.value)}
                placeholder="Add a reply..." maxLength={2000} />
              <button
                disabled={!replyMsg.trim()}
                onClick={() => { onReply(replyMsg); setReplyMsg(''); }}
                className="px-3 py-2 bg-[var(--primary-color)] text-white rounded-xl disabled:opacity-40 hover:bg-[var(--primary-hover)] transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Admin/Manager controls */}
          {isAdmin && ticket.status !== 'CLOSED' && (
            <div className="border-t border-[var(--border-color)] pt-4 space-y-3">
              <p className="text-xs font-bold text-rose-400">Agent / Manager Actions</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Update Status</label>
                  <select
                    className="w-full px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                    value={ticket.status}
                    onChange={e => onUpdate({ status: e.target.value })}
                  >
                    {['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'].map(s => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Priority</label>
                  <select
                    className="w-full px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                    value={ticket.priority}
                    onChange={e => onUpdate({ priority: e.target.value })}
                  >
                    {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary-color)]"
                  value={agentNote} onChange={e => setAgentNote(e.target.value)}
                  placeholder="Agent reply or resolution note (optional)..." />
                <button
                  disabled={!agentNote.trim()}
                  onClick={() => { onReply(agentNote); setAgentNote(''); }}
                  className="px-3 py-2 bg-violet-500 text-white rounded-xl disabled:opacity-40 hover:bg-violet-600 transition-colors text-xs font-bold">
                  Send Reply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Support Page ────────────────────────────────────────────────────────
export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'REVIEWS'>('TICKETS');
  const [showCreate, setShowCreate] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmDeleteTicketId, setConfirmDeleteTicketId] = useState<string | null>(null);
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null);

  const { user } = useAppSelector(s => s.auth);
  const role = user?.role || '';
  const isAdmin = ['ADMIN', 'MANAGER', 'RESTAURANT_OWNER'].includes(role);
  const userId = user?.id || '';

  const isManager = role === 'MANAGER';
  const { data: myRestaurantsRes, isLoading: myRestsLoading, refetch: refetchMyRests } = useGetMyRestaurantsQuery(undefined, { skip: !isManager });
  const myRestaurants: any[] = myRestaurantsRes?.data || [];
  const hasAssociatedRestaurant = !isManager || myRestaurants.length > 0;

  // Users: fetch their tickets
  const { data: myTicketsRes, isLoading: myLoading, refetch: refetchMy } = useGetMyTicketsQuery(undefined, { skip: isAdmin });
  // Admin/Manager: fetch all tickets
  const { data: allTicketsRes, isLoading: allLoading, refetch: refetchAll } = useGetAllTicketsQuery(
    { status: statusFilter || undefined, page: 0, size: 50 },
    { skip: !['ADMIN', 'MANAGER'].includes(role) || (isManager && !hasAssociatedRestaurant) }
  );

  // Reviews query & delete mutation
  const { data: reviewsRes, isLoading: reviewsLoading, refetch: refetchReviews } = useGetMyReviewsQuery();
  const [deleteReview] = useDeleteReviewMutation();

  const [closeTicket] = useCloseTicketMutation();
  const [replyToTicket] = useReplyToTicketMutation();
  const [agentReply] = useAgentReplyMutation();
  const [updateTicket] = useUpdateTicketMutation();
  const [deleteTicket] = useDeleteTicketMutation();

  const refetch = () => {
    if (['ADMIN', 'MANAGER'].includes(role)) refetchAll();
    else refetchMy();
    refetchReviews();
    if (isManager) refetchMyRests();
  };

  const rawTicketsData = ['ADMIN', 'MANAGER'].includes(role) ? allTicketsRes?.data : myTicketsRes?.data;
  const rawTicketsList: any[] = Array.isArray(rawTicketsData)
    ? rawTicketsData
    : Array.isArray(rawTicketsData?.content)
    ? rawTicketsData.content
    : [];

  const tickets: any[] = isManager
    ? rawTicketsList.filter(t => myRestaurants.some(r => r.id === t.restaurantId))
    : rawTicketsList;

  const rawReviewsData = reviewsRes?.data;
  const reviews: any[] = Array.isArray(rawReviewsData)
    ? rawReviewsData
    : Array.isArray(rawReviewsData?.content)
    ? rawReviewsData.content
    : [];

  const isLoading = ['ADMIN', 'MANAGER'].includes(role) ? allLoading : myLoading;

  const handleClose = async (ticketId: string) => {
    try {
      await closeTicket(ticketId).unwrap();
      toast.success('Ticket closed');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to close ticket');
    }
  };

  const handleReply = async (ticketId: string, message: string) => {
    try {
      if (['ADMIN', 'MANAGER'].includes(role)) {
        await agentReply({ ticketId, message }).unwrap();
      } else {
        await replyToTicket({ ticketId, message }).unwrap();
      }
      toast.success('Reply sent');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send reply');
    }
  };

  const handleUpdate = async (ticketId: string, data: any) => {
    try {
      await updateTicket({ ticketId, ...data }).unwrap();
      toast.success('Ticket updated');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update ticket');
    }
  };

  const handleSaveEditTicket = async (data: { subject: string; category: string; description: string }) => {
    if (!editingTicket) return;
    const ticketId = editingTicket.id || editingTicket.ticketId;
    try {
      if (['ADMIN', 'MANAGER'].includes(role)) {
        await updateTicket({ ticketId, ...data }).unwrap();
      } else {
        await replyToTicket({
          ticketId,
          message: `[Ticket Updated by Author] Subject: ${data.subject} | Category: ${data.category} | Details: ${data.description}`,
        }).unwrap();
      }
      toast.success('Ticket updated successfully!');
      setEditingTicket(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update ticket');
    }
  };

  const handleDelete = (ticketId: string) => {
    setConfirmDeleteTicketId(ticketId);
  };

  const handleConfirmDeleteTicket = async () => {
    if (!confirmDeleteTicketId) return;
    try {
      if (role === 'ADMIN') {
        await deleteTicket(confirmDeleteTicketId).unwrap();
        toast.success('Ticket deleted permanently');
      } else {
        await closeTicket(confirmDeleteTicketId).unwrap();
        toast.success('Ticket withdrawn and closed');
      }
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete ticket');
    } finally {
      setConfirmDeleteTicketId(null);
    }
  };

  const handleDeleteRev = (reviewId: string) => {
    setConfirmDeleteReviewId(reviewId);
  };

  const handleConfirmDeleteReview = async () => {
    if (!confirmDeleteReviewId) return;
    try {
      await deleteReview(confirmDeleteReviewId).unwrap();
      toast.success('Review deleted');
      refetchReviews();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete review');
    } finally {
      setConfirmDeleteReviewId(null);
    }
  };

  return (
    <AuthGuard allowedRoles={['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_DRIVER', 'MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-[var(--background-color)] text-[var(--text-primary)] flex flex-col font-sans">
        <Header />
        <div className="flex-1 flex">
          <RoleSidebar role={role} />
          <main className="flex-1 p-4 sm:p-8 max-w-4xl mx-auto w-full">
            {isManager && myRestsLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-xs text-[var(--text-secondary)] font-semibold">Verifying store associations...</p>
              </div>
            ) : isManager && !hasAssociatedRestaurant ? (
              <ManagerUnassignedScreen onRefresh={refetchMyRests} pageTitle="Support & Ticket Center" />
            ) : (
              <>
                {/* Header & Tabs */}
                <div className="mb-6">
                  <PageHeader
                    title={isAdmin ? 'Support & Feedback Center' : 'Customer Support'}
                    subtitle={
                      isAdmin
                        ? 'Manage support tickets and monitor customer ratings & reviews.'
                        : 'Get help with orders, payments, and view ratings.'
                    }
                    actions={
                      <div className="flex items-center gap-2 p-1 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl">
                        <button
                          onClick={() => setActiveTab('TICKETS')}
                          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                            activeTab === 'TICKETS'
                              ? 'bg-[var(--primary-color)] text-white shadow-md'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Support Tickets</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('REVIEWS')}
                          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                            activeTab === 'REVIEWS'
                              ? 'bg-[var(--primary-color)] text-white shadow-md'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          <span>Reviews & Feedback</span>
                        </button>
                      </div>
                    }
                  />
                </div>

            {/* Content View 1: Support Tickets */}
            {activeTab === 'TICKETS' && (
              <>
                <div className="flex justify-end gap-2 mb-4">
                  {['ADMIN', 'MANAGER'].includes(role) && (
                    <select
                      className="px-4 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'].map(s => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  )}
                  {!['ADMIN', 'MANAGER'].includes(role) && !showCreate && (
                    <button
                      onClick={() => setShowCreate(true)}
                      className="px-4 py-2 bg-[var(--primary-color)] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md hover:bg-[var(--primary-hover)] transition-all"
                    >
                      <Plus className="w-4 h-4" /> New Ticket
                    </button>
                  )}
                </div>

                {showCreate && <CreateTicketForm onClose={() => setShowCreate(false)} />}

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl animate-pulse h-20" />
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No Support Tickets Found"
                    description={
                      ['ADMIN', 'MANAGER'].includes(role)
                        ? 'No support tickets in the system.'
                        : 'Have an issue? Create a support ticket and we will help you.'
                    }
                    action={
                      !['ADMIN', 'MANAGER'].includes(role)
                        ? {
                            label: 'Create Ticket',
                            onClick: () => setShowCreate(true),
                          }
                        : undefined
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => {
                      const tId = ticket.id || ticket.ticketId;
                      return (
                        <TicketRow
                          key={tId}
                          ticket={ticket}
                          isAdmin={['ADMIN', 'MANAGER'].includes(role)}
                          isExpanded={expandedId === tId}
                          onToggle={() => setExpandedId(expandedId === tId ? null : tId)}
                          onClose={() => handleClose(tId)}
                          onReply={(msg) => handleReply(tId, msg)}
                          onDelete={() => handleDelete(tId)}
                          onUpdate={(data) => handleUpdate(tId, data)}
                          onEdit={() => setEditingTicket(ticket)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Content View 2: Customer Reviews & Ratings */}
            {activeTab === 'REVIEWS' && (
              <div className="space-y-4">
                {reviewsLoading ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-color)]" />
                  </div>
                ) : reviews.length === 0 ? (
                  <EmptyState
                    icon={Star}
                    title="No Customer Reviews Yet"
                    description="Customer ratings and food reviews will appear here once submitted."
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {reviews.map((rev: any) => (
                      <div
                        key={rev.id || rev.reviewId}
                        className="bg-[var(--surface-color)] border border-[var(--border-color)] p-5 rounded-2xl space-y-3 shadow-sm hover:border-amber-500/30 transition-all"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-color)]/60 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center text-amber-400 gap-1 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{rev.rating || 5} / 5</span>
                            </div>
                            <span className="text-xs font-bold text-[var(--text-primary)]">
                              {rev.reviewType === 'RESTAURANT' ? 'Restaurant Review' : 'Menu Item Review'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-muted)]">
                              {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                            </span>
                            {['ADMIN', 'MANAGER'].includes(role) && (
                              <button
                                onClick={() => handleDeleteRev(rev.id || rev.reviewId)}
                                className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-all"
                                title="Delete Review"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {rev.comment && (
                          <p className="text-xs text-[var(--text-primary)] font-medium leading-relaxed italic">
                            "{rev.comment}"
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-[var(--text-muted)] pt-2">
                          <span>Submitted by: <strong className="text-[var(--text-primary)]">{rev.userName || rev.userEmail || 'Verified Customer'}</strong></span>
                          {rev.orderId && <span>Order: <strong className="font-mono text-[var(--primary-color)]">#{String(rev.orderId).slice(-8)}</strong></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </main>
        </div>

        {editingTicket && (
          <EditTicketModal
            ticket={editingTicket}
            onClose={() => setEditingTicket(null)}
            onSave={handleSaveEditTicket}
          />
        )}

        <ConfirmDialog
          isOpen={Boolean(confirmDeleteTicketId)}
          title={role === 'ADMIN' ? 'Delete Support Ticket' : 'Withdraw Support Ticket'}
          message={
            role === 'ADMIN'
              ? 'Are you sure you want to permanently delete this support ticket from the system?'
              : 'Are you sure you want to withdraw and close this support ticket?'
          }
          confirmLabel={role === 'ADMIN' ? 'Delete Permanently' : 'Withdraw Ticket'}
          cancelLabel="Keep Ticket"
          variant="danger"
          onConfirm={handleConfirmDeleteTicket}
          onCancel={() => setConfirmDeleteTicketId(null)}
        />

        <ConfirmDialog
          isOpen={Boolean(confirmDeleteReviewId)}
          title="Delete Customer Review"
          message="Are you sure you want to delete this customer review? This will permanently remove the rating and feedback."
          confirmLabel="Delete Review"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleConfirmDeleteReview}
          onCancel={() => setConfirmDeleteReviewId(null)}
        />
      </div>
    </AuthGuard>
  );
}
