'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useAppSelector } from '@/store';
import { useGetMyRestaurantsQuery } from '@/store/api/restaurantApi';
import {
  useGetAllTicketsQuery,
  useUpdateTicketMutation,
  useAgentReplyMutation,
  useCreateTicketMutation,
  useCloseTicketMutation,
  useDeleteTicketMutation,
} from '@/store/api/supportApi';
import { useGetRestaurantOrdersQuery } from '@/store/api/orderApi';
import { ManagerUnassignedScreen } from '@/components/manager/ManagerUnassignedScreen';
import { ManagerStoreSwitcher } from '@/components/manager/ManagerStoreSwitcher';
import { LoadingSpinner } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  MessageSquare, Send, ChevronDown, ChevronRight,
  Clock, CheckCircle, AlertCircle, Loader2, ShieldAlert,
  Plus, X, Edit2, Trash2, Save,
} from 'lucide-react';
import toast from 'react-hot-toast';

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'text-sky-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-rose-400',
};

export default function ManagerSupportPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRestId, setSelectedRestId] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [agentNotes, setAgentNotes] = useState<Record<string, string>>({});

  const { user } = useAppSelector(s => s.auth);
  const isManager = user?.role === 'MANAGER';

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  // Fetch assigned restaurants
  const { data: myRestaurantsRes, isLoading: myRestsLoading, refetch: refetchMyRests } = useGetMyRestaurantsQuery();
  const myRestaurants: any[] = extractArray(myRestaurantsRes);
  const hasAssociatedRestaurant = !isManager || myRestaurants.length > 0;

  const currentRestaurantId = selectedRestId || (myRestaurants.length > 0 ? myRestaurants[0].id : '');

  // Query tickets strictly when associated
  const { data: allTicketsRes, isLoading: ticketsLoading, refetch: refetchTickets } = useGetAllTicketsQuery(
    { status: statusFilter || undefined, page: 0, size: 100 },
    { skip: isManager && !hasAssociatedRestaurant, pollingInterval: 3000 }
  );

  // Query orders for current assigned restaurant to associate tickets raised by orderId
  const { data: restOrdersRes } = useGetRestaurantOrdersQuery(
    { restaurantId: currentRestaurantId, page: 0, size: 200 },
    { skip: !currentRestaurantId, pollingInterval: 3000 }
  );

  const [updateTicket, { isLoading: updatingTicket }] = useUpdateTicketMutation();
  const [agentReply, { isLoading: sendingReply }] = useAgentReplyMutation();
  const [createTicket, { isLoading: isCreating }] = useCreateTicketMutation();
  const [closeTicket, { isLoading: isClosing }] = useCloseTicketMutation();
  const [deleteTicket, { isLoading: isDeleting }] = useDeleteTicketMutation();

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
      refetchTickets();
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
      refetchTickets();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update ticket');
    }
  };

  const [confirmCloseTicketId, setConfirmCloseTicketId] = useState<string | null>(null);
  const [confirmDeleteTicketId, setConfirmDeleteTicketId] = useState<string | null>(null);

  const handleCloseTicket = (ticketId: string) => {
    setConfirmCloseTicketId(ticketId);
  };

  const handleConfirmCloseTicket = async () => {
    if (!confirmCloseTicketId) return;
    try {
      await closeTicket(confirmCloseTicketId).unwrap();
      toast.success('Ticket closed successfully');
      refetchTickets();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to close ticket');
    } finally {
      setConfirmCloseTicketId(null);
    }
  };

  const handleDeleteTicket = (ticketId: string) => {
    setConfirmDeleteTicketId(ticketId);
  };

  const handleConfirmDeleteTicket = async () => {
    if (!confirmDeleteTicketId) return;
    try {
      await deleteTicket(confirmDeleteTicketId).unwrap();
      toast.success('Ticket deleted successfully');
      refetchTickets();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete ticket');
    } finally {
      setConfirmDeleteTicketId(null);
    }
  };

  const rawTickets = extractArray(allTicketsRes);
  const restOrders = extractArray(restOrdersRes);
  const orderIdSet = new Set(
    restOrders.map((o: any) => String(o.id || o.orderId)).filter(Boolean)
  );

  // Filter tickets strictly to manager's assigned restaurant(s) or orders associated with them
  const tickets = isManager
    ? rawTickets.filter(t => {
        // Direct restaurant match
        if (t.restaurantId && t.restaurantId === currentRestaurantId) return true;
        // Match ticket raised with orderId belonging to this restaurant
        if (t.orderId && orderIdSet.has(String(t.orderId))) return true;
        // If no single restaurant selected, check against any assigned restaurant
        if (!currentRestaurantId && myRestaurants.some(r => r.id === t.restaurantId)) return true;
        return false;
      })
    : rawTickets;

  const handleUpdate = async (ticketId: string, data: any) => {
    try {
      await updateTicket({ ticketId, ...data }).unwrap();
      toast.success('Ticket updated by Manager');
      refetchTickets();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update ticket');
    }
  };

  const handleReply = async (ticketId: string) => {
    const note = (agentNotes[ticketId] || '').trim();
    if (!note) return;
    try {
      await agentReply({ ticketId, message: note }).unwrap();
      toast.success('Manager reply posted to customer');
      setAgentNotes(prev => ({ ...prev, [ticketId]: '' }));
      refetchTickets();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to send reply');
    }
  };

  const currentRest = myRestaurants.find(r => r.id === currentRestaurantId);

  if (myRestsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs text-[var(--text-secondary)] font-semibold">Verifying store associations...</p>
      </div>
    );
  }

  if (isManager && !hasAssociatedRestaurant) {
    return <ManagerUnassignedScreen onRefresh={refetchMyRests} pageTitle="Support Ticket Operations" />;
  }

  return (
    <div className="space-y-6">
      {/* Store Switcher for Assigned Stores */}
      {myRestaurants.length > 0 && (
        <ManagerStoreSwitcher
          restaurants={myRestaurants}
          selectedRestaurantId={currentRestaurantId}
          onSelectRestaurantId={setSelectedRestId}
        />
      )}

      {/* Header & Filter Bar */}
      <PageHeader
        title="Store Support Tickets"
        description={`Manage customer inquiries, order disputes, and ticket resolution for ${currentRest?.name || 'assigned store'}.`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-muted)]">Status:</span>
              <select
                className="px-3 py-2 bg-[var(--surface-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-[var(--primary-color)] transition-colors"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses ({tickets.length})</option>
                {['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      {/* KPI Row (C-02) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquare}
          title="Total Tickets"
          value={tickets.length}
          sublabel="All filed customer tickets"
          accentColor="sky"
        />
        <StatCard
          icon={AlertCircle}
          title="Open Issues"
          value={tickets.filter((t: any) => ['OPEN', 'IN_PROGRESS', 'WAITING_USER'].includes(t.status)).length}
          sublabel="Awaiting response / action"
          accentColor="amber"
        />
        <StatCard
          icon={CheckCircle}
          title="Resolved Tickets"
          value={tickets.filter((t: any) => ['RESOLVED', 'CLOSED'].includes(t.status)).length}
          sublabel="Successfully completed"
          accentColor="emerald"
        />
        <StatCard
          icon={Clock}
          title="Resolution Rate"
          value={
            tickets.length > 0
              ? `${Math.round(
                  (tickets.filter((t: any) => ['RESOLVED', 'CLOSED'].includes(t.status)).length /
                    tickets.length) *
                    100
                )}%`
              : '100%'
          }
          sublabel="Resolved vs total inquiries"
          accentColor="purple"
        />
      </div>

      {/* Tickets List */}
      {ticketsLoading ? (
        <div className="flex items-center justify-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)]">
          <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="font-outfit font-bold text-lg">No Support Tickets Found</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {statusFilter
              ? `There are no "${statusFilter}" tickets for this restaurant.`
              : 'No customer support tickets have been filed for this restaurant.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket: any) => {
            const id = ticket.ticketId || ticket.id;
            const isExpanded = expandedId === id;

            return (
              <div
                key={id}
                className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:border-[var(--primary-color)]/30 transition-all"
              >
                {/* Ticket Header Bar */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[var(--background-color)]/50 transition-colors gap-3"
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
                          ● {ticket.priority || 'MEDIUM'} Priority
                        </span>

                                  <span className="text-[10px] font-semibold text-[var(--text-muted)] bg-[var(--background-color)] px-2 py-0.5 rounded-lg border border-[var(--border-color)]">
                                    {ticket.category?.replace(/_/g, ' ')}
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

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTicket(ticket);
                                    setEditSubject(ticket.subject || '');
                                    setEditDescription(ticket.description || '');
                                    setEditCategory(ticket.category || 'ORDER_ISSUE');
                                    setEditPriority(ticket.priority || 'MEDIUM');
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-[var(--border-color)] text-[var(--text-muted)] hover:text-sky-400 transition-colors"
                                  title="Edit Ticket Details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                {ticket.status !== 'CLOSED' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCloseTicket(id);
                                    }}
                                    disabled={isClosing}
                                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-400 transition-colors"
                                    title="Close / Withdraw Ticket"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Expanded Conversation & Actions */}
                          {isExpanded && (
                            <div className="border-t border-[var(--border-color)] p-5 sm:p-6 bg-[var(--background-color)]/30 space-y-5">
                              {/* Full Description */}
                              <div className="p-4 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] space-y-2">
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Customer Description</p>
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                                {ticket.orderId && (
                                  <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
                                    🔗 Related Order ID: <span className="font-mono text-[var(--primary-color)] font-bold">{ticket.orderId}</span>
                                  </p>
                                )}
                              </div>

                              {/* Replies Thread */}
                              {ticket.replies && ticket.replies.length > 0 && (
                                <div className="space-y-3">
                                  <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Conversation Log</p>
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
                                          {r.senderType === 'AGENT' ? '🛠 Store Manager' : '👤 ' + (r.repliedByName || ticket.userName || 'Customer')}
                                        </span>
                                        <span className="text-[10px] text-[var(--text-muted)]">
                                          {r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}
                                        </span>
                                      </div>
                                      <p className="text-xs sm:text-sm">{r.message}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {ticket.resolutionNote && (
                                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                  <p className="text-xs font-bold text-emerald-400 mb-1">Resolution Note</p>
                                  <p className="text-xs text-emerald-200">{ticket.resolutionNote}</p>
                                </div>
                              )}

                              {/* Manager Operational Controls */}
                              {ticket.status !== 'CLOSED' && (
                                <div className="border-t border-[var(--border-color)] pt-4 space-y-4">
                                  <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">Manager Actions</p>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Update Status</label>
                                      <select
                                        className="w-full px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                                        value={ticket.status}
                                        onChange={(e) => handleUpdate(id, { status: e.target.value })}
                                      >
                                        {['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'].map((s) => (
                                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Priority</label>
                                      <select
                                        className="w-full px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-[var(--primary-color)]"
                                        value={ticket.priority}
                                        onChange={(e) => handleUpdate(id, { priority: e.target.value })}
                                      >
                                        {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                                          <option key={p} value={p}>{p}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {/* Reply input */}
                                  <div className="flex gap-2">
                                    <input
                                      className="flex-1 px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-[var(--primary-color)]"
                                      value={agentNotes[id] || ''}
                                      onChange={(e) => setAgentNotes(prev => ({ ...prev, [id]: e.target.value }))}
                                      placeholder="Write official manager reply or resolution note to customer..."
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleReply(id);
                                      }}
                                    />
                                    <button
                                      disabled={!agentNotes[id]?.trim() || sendingReply}
                                      onClick={() => handleReply(id)}
                                      className="px-4 py-2 bg-[var(--primary-color)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl disabled:opacity-40 flex items-center gap-1.5 transition-all shadow-sm"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Send Reply</span>
                                    </button>
                                  </div>
                                </div>
                              )}
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

        <ConfirmDialog
          isOpen={Boolean(confirmCloseTicketId)}
          title="Close Support Ticket"
          message="Are you sure you want to close/withdraw this support ticket?"
          confirmLabel="Close Ticket"
          cancelLabel="Keep Open"
          variant="warning"
          isLoading={isClosing}
          onConfirm={handleConfirmCloseTicket}
          onCancel={() => setConfirmCloseTicketId(null)}
        />

        <ConfirmDialog
          isOpen={Boolean(confirmDeleteTicketId)}
          title="Delete Support Ticket"
          message="Are you sure you want to permanently delete this support ticket?"
          confirmLabel="Delete Ticket"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={isDeleting}
          onConfirm={handleConfirmDeleteTicket}
          onCancel={() => setConfirmDeleteTicketId(null)}
        />
    </div>
  );
}
