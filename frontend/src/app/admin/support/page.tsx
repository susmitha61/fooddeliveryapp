'use client';

import React, { useState } from 'react';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import {
  useGetAllTicketsQuery,
  useUpdateTicketMutation,
  useAgentReplyMutation,
  useDeleteTicketMutation,
  useCreateTicketMutation,
} from '@/store/api/supportApi';
import {
  MessageSquare, Send, ChevronDown, ChevronRight,
  Clock, CheckCircle, AlertCircle, Loader2, Trash2, Search, Filter, ShieldCheck, RefreshCw,
  Edit2, Save, X, Plus,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'text-sky-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-rose-400',
};

export default function AdminSupportPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [agentNotes, setAgentNotes] = useState<Record<string, string>>({});

  const { data: ticketsRes, isLoading, refetch } = useGetAllTicketsQuery(
    { status: statusFilter || undefined, page: 0, size: 100 },
    { pollingInterval: 5000 }
  );

  const [updateTicket, { isLoading: updatingTicket }] = useUpdateTicketMutation();
  const [agentReply, { isLoading: sendingReply }] = useAgentReplyMutation();
  const [deleteTicket, { isLoading: deletingTicket }] = useDeleteTicketMutation();
  const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ category: 'ORDER_ISSUE', subject: '', description: '', orderId: '' });

  const [editingTicket, setEditingTicket] = useState<any | null>(null);
  const [editSubject, setEditSubject] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTicket.subject.trim().length < 5) {
      toast.error('Subject must be at least 5 characters');
      return;
    }
    if (newTicket.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }
    try {
      await createTicket({
        category: newTicket.category,
        subject: newTicket.subject.trim(),
        description: newTicket.description.trim(),
        ...(newTicket.orderId.trim() ? { orderId: newTicket.orderId.trim() } : {}),
      }).unwrap();
      toast.success('Support ticket created successfully!');
      setShowCreateModal(false);
      setNewTicket({ category: 'ORDER_ISSUE', subject: '', description: '', orderId: '' });
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create support ticket');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    const ticketId = editingTicket.id || editingTicket.ticketId;
    try {
      await updateTicket({
        ticketId,
        priority: editPriority,
        resolutionNote: editDescription.trim(),
      }).unwrap();
      toast.success('Ticket details updated successfully!');
      setEditingTicket(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update ticket');
    }
  };

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const allTickets = extractArray(ticketsRes);

  const filteredTickets = allTickets.filter((t: any) => {
    const matchesPriority = !priorityFilter || t.priority === priorityFilter;
    const matchesSearch =
      !searchTerm ||
      (t.ticketNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(t.orderId || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicket({ ticketId, status: newStatus }).unwrap();
      toast.success(`Ticket marked as ${newStatus.replace(/_/g, ' ')}`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update ticket status');
    }
  };

  const handleReply = async (ticketId: string) => {
    const msg = (agentNotes[ticketId] || '').trim();
    if (!msg) return;
    try {
      await agentReply({ ticketId, message: msg }).unwrap();
      toast.success('Agent reply sent to customer');
      setAgentNotes((prev) => ({ ...prev, [ticketId]: '' }));
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to post reply');
    }
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm('Are you sure you want to permanently delete this support ticket?')) return;
    try {
      await deleteTicket(ticketId).unwrap();
      toast.success('Ticket deleted successfully');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete ticket');
    }
  };

  return (
    <div className="space-y-6">
            <PageHeader
              title="Support Ticket Operations"
              subtitle="Review customer inquiries, order disputes, delivery issues, and reply directly as Platform Admin."
              actions={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Ticket</span>
                  </button>
                  <button
                    onClick={() => refetch()}
                    className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-[var(--primary-color)] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                    title="Refresh Tickets"
                  >
                    <RefreshCw className="w-4 h-4 text-[var(--primary-color)]" />
                    <span>Refresh</span>
                  </button>
                </div>
              }
            />

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={MessageSquare}
                label="Total Tickets"
                value={allTickets.length}
                accentColor="orange"
              />
              <StatCard
                icon={Clock}
                label="Open Tickets"
                value={allTickets.filter((t: any) => t.status === 'OPEN').length}
                accentColor="amber"
              />
              <StatCard
                icon={AlertCircle}
                label="In Progress"
                value={allTickets.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'WAITING_USER').length}
                accentColor="sky"
              />
              <StatCard
                icon={CheckCircle}
                label="Resolved"
                value={allTickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
                accentColor="emerald"
              />
            </div>

            {/* Filters Bar */}
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by ticket #, user, subject, or order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                >
                  <option value="">All Statuses ({allTickets.length})</option>
                  {['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>

                {/* Priority Filter */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                >
                  <option value="">All Priorities</option>
                  {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Ticket List */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)]/60">
                <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                <h3 className="font-outfit font-bold text-lg">No Support Tickets Found</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {searchTerm || statusFilter || priorityFilter
                    ? 'No tickets match the selected filters.'
                    : 'There are currently no active support tickets in the system.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTickets.map((ticket: any) => {
                  const id = ticket.ticketId || ticket.id;
                  const isExpanded = expandedId === id;

                  return (
                    <div
                      key={id}
                      className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:border-[var(--primary-color)]/30 transition-all"
                    >
                      {/* Ticket Header Bar */}
                      <div
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[var(--background-color)]/40 transition-colors gap-3"
                        onClick={() => setExpandedId(isExpanded ? null : id)}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="p-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--primary-color)] shrink-0 mt-0.5">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="font-mono text-xs font-bold text-[var(--primary-color)] bg-[var(--primary-color)]/10 px-2 py-0.5 rounded-lg border border-[var(--primary-color)]/20">
                                {ticket.ticketNumber || `#${String(id).slice(-6)}`}
                              </span>

                              <StatusBadge status={ticket.status} type="ticket" />

                              <span className={`text-[11px] font-bold ${PRIORITY_STYLES[ticket.priority] || 'text-amber-400'}`}>
                                ● {ticket.priority || 'MEDIUM'}
                              </span>

                              <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--background-color)] px-2 py-0.5 rounded-lg border border-[var(--border-color)]">
                                {ticket.category?.replace(/_/g, ' ') || 'GENERAL'}
                              </span>
                            </div>

                            <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{ticket.subject}</h3>
                            <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mt-0.5">{ticket.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Recent'}</span>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 bg-[var(--background-color)] rounded-lg border border-[var(--border-color)]">
                            👤 {ticket.userName || 'Customer'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Ticket View */}
                      {isExpanded && (
                        <div className="border-t border-[var(--border-color)] p-5 sm:p-6 bg-[var(--background-color)]/30 space-y-5">
                          {/* Details */}
                          <div className="p-4 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] space-y-2">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Customer Description</p>
                            <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                            {ticket.orderId && (
                              <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
                                🔗 Related Order ID: <span className="font-mono text-[var(--primary-color)] font-bold">{ticket.orderId}</span>
                              </p>
                            )}
                          </div>

                          {/* Conversation Thread */}
                          {ticket.replies && ticket.replies.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Conversation Thread</p>
                              {ticket.replies.map((r: any) => (
                                <div
                                  key={r.replyId || Math.random()}
                                  className={`p-3.5 rounded-xl text-sm ${
                                    r.senderType === 'AGENT'
                                      ? 'bg-[var(--primary-color)]/10 border border-[var(--primary-color)]/20 ml-4'
                                      : 'bg-[var(--background-color)] border border-[var(--border-color)] mr-4'
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[11px] font-bold ${r.senderType === 'AGENT' ? 'text-[var(--primary-color)]' : 'text-[var(--text-muted)]'}`}>
                                      {r.senderType === 'AGENT' ? '🛡 Support Agent (Admin)' : '👤 ' + (r.repliedByName || ticket.userName || 'Customer')}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)]">
                                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[var(--text-primary)] whitespace-pre-wrap">{r.message}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Admin Reply Input */}
                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-[var(--text-secondary)]">
                              Send Response to Customer:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Type official admin response..."
                                value={agentNotes[id] || ''}
                                onChange={(e) => setAgentNotes((prev) => ({ ...prev, [id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleReply(id); }}
                                className="flex-1 px-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary-color)]"
                              />
                              <button
                                type="button"
                                onClick={() => handleReply(id)}
                                disabled={sendingReply || !agentNotes[id]?.trim()}
                                className="px-4 py-2.5 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5 transition-all shrink-0"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Reply</span>
                              </button>
                            </div>
                          </div>

                          {/* Status Management & Delete */}
                          <div className="pt-3 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[var(--text-muted)]">Update Status:</span>
                              <select
                                value={ticket.status}
                                onChange={(e) => handleStatusChange(id, e.target.value)}
                                className="px-3 py-1.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                              >
                                {['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'].map((s) => (
                                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTicket(ticket);
                                  setEditSubject(ticket.subject || '');
                                  setEditDescription(ticket.description || '');
                                  setEditCategory(ticket.category || 'ORDER_ISSUE');
                                  setEditPriority(ticket.priority || 'MEDIUM');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Ticket</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(id)}
                                disabled={deletingTicket}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Ticket</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

        {/* Create Support Ticket Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-outfit font-extrabold text-lg">Create Support Ticket</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-xl hover:bg-[var(--background-color)] text-[var(--text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                    <select
                      className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                      value={newTicket.category}
                      onChange={(e) => setNewTicket(f => ({ ...f, category: e.target.value }))}
                    >
                      {['ORDER_ISSUE', 'PAYMENT_ISSUE', 'DELIVERY_ISSUE', 'FOOD_QUALITY', 'APP_ISSUE', 'ACCOUNT_ISSUE', 'REFUND_REQUEST', 'OTHER'].map(c => (
                        <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Related Order ID (Optional)</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary-color)]"
                      value={newTicket.orderId}
                      onChange={(e) => setNewTicket(f => ({ ...f, orderId: e.target.value }))}
                      placeholder="e.g. ord-123..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject (min 5 chars) *</label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary-color)]"
                    value={newTicket.subject}
                    onChange={(e) => setNewTicket(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Brief summary of the issue..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Description (min 10 chars) *</label>
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary-color)]"
                    value={newTicket.description}
                    onChange={(e) => setNewTicket(f => ({ ...f, description: e.target.value }))}
                    placeholder="Provide detailed description..."
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isCreating ? 'Creating...' : 'Submit Ticket'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Support Ticket Modal */}
        {editingTicket && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-outfit font-extrabold text-lg">Edit Ticket Details</h3>
                <button
                  onClick={() => setEditingTicket(null)}
                  className="p-1 rounded-xl hover:bg-[var(--background-color)] text-[var(--text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                    <select
                      className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                    >
                      {['ORDER_ISSUE', 'PAYMENT_ISSUE', 'DELIVERY_ISSUE', 'FOOD_QUALITY', 'APP_ISSUE', 'ACCOUNT_ISSUE', 'REFUND_REQUEST', 'OTHER'].map(c => (
                        <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Priority</label>
                    <select
                      className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)]"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                    >
                      {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    minLength={5}
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary-color)]"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Description *</label>
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    className="w-full p-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary-color)]"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTicket(null)}
                    className="px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingTicket}
                    className="px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{updatingTicket ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
