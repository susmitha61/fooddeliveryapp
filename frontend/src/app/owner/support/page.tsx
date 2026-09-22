'use client';

import React, { useState } from 'react';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StatCard } from '@/components/ui/StatCard';
import { useGetMyRestaurantsQuery } from '@/store/api/restaurantApi';
import { useGetRestaurantOrdersQuery } from '@/store/api/orderApi';
import {
  useGetAllTicketsQuery,
  useUpdateTicketMutation,
  useAgentReplyMutation,
  useCloseTicketMutation,
  useDeleteTicketMutation,
} from '@/store/api/supportApi';
import {
  MessageSquare, Send, ChevronDown, ChevronRight,
  Clock, CheckCircle, AlertCircle, Loader2, Search, Filter, Store, RefreshCw,
  Edit2, Trash2, X, Save,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'text-sky-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-orange-400',
  URGENT: 'text-rose-400',
};

export default function OwnerSupportPage() {
  const [selectedRestId, setSelectedRestId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ownerReplyText, setOwnerReplyText] = useState<Record<string, string>>({});

  const { data: myRestaurantsRes, isLoading: restsLoading } = useGetMyRestaurantsQuery(
    undefined,
    { pollingInterval: 5000 }
  );

  const extractArray = (res: any): any[] => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.content)) return res.data.content;
    if (Array.isArray(res.content)) return res.content;
    return [];
  };

  const myRestaurants = extractArray(myRestaurantsRes);
  const currentRestId = selectedRestId || (myRestaurants.length > 0 ? myRestaurants[0].id : '');

  // Query tickets
  const { data: ticketsRes, isLoading: ticketsLoading, refetch } = useGetAllTicketsQuery(
    { status: statusFilter || undefined, page: 0, size: 100 },
    { pollingInterval: 5000 }
  );

  // Query orders for the selected restaurant to correlate order-level tickets
  const { data: restOrdersRes } = useGetRestaurantOrdersQuery(
    { restaurantId: currentRestId, page: 0, size: 100 },
    { skip: !currentRestId, pollingInterval: 5000 }
  );

  const [updateTicket, { isLoading: updatingTicket }] = useUpdateTicketMutation();
  const [agentReply, { isLoading: sendingReply }] = useAgentReplyMutation();
  const [closeTicket] = useCloseTicketMutation();
  const [deleteTicket] = useDeleteTicketMutation();

  const [editingTicket, setEditingTicket] = useState<any | null>(null);

  const allTickets = extractArray(ticketsRes);
  const restOrders = extractArray(restOrdersRes);
  const orderIdSet = new Set(
    restOrders.map((o: any) => String(o.id || o.orderId)).filter(Boolean)
  );
  const myRestaurantIds = new Set(myRestaurants.map((r: any) => String(r.id)));

  // Filter tickets to owner's restaurants
  const ownerTickets = allTickets.filter((t: any) => {
    if (currentRestId) {
      if (t.restaurantId && String(t.restaurantId) === String(currentRestId)) return true;
      if (t.orderId && orderIdSet.has(String(t.orderId))) return true;
      return false;
    }
    // Any of owner's restaurants
    return (
      (t.restaurantId && myRestaurantIds.has(String(t.restaurantId))) ||
      (t.orderId && orderIdSet.has(String(t.orderId)))
    );
  });

  const filteredTickets = ownerTickets.filter((t: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (t.ticketNumber || '').toLowerCase().includes(term) ||
      (t.subject || '').toLowerCase().includes(term) ||
      (t.userName || '').toLowerCase().includes(term) ||
      (t.description || '').toLowerCase().includes(term) ||
      String(t.orderId || '').toLowerCase().includes(term)
    );
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
    const msg = (ownerReplyText[ticketId] || '').trim();
    if (!msg) return;
    try {
      await agentReply({ ticketId, message: `[Store Response]: ${msg}` }).unwrap();
      toast.success('Reply sent to diner');
      setOwnerReplyText((prev) => ({ ...prev, [ticketId]: '' }));
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to post reply');
    }
  };

  const handleSaveEditTicket = async (data: { subject: string; category: string; description: string }) => {
    if (!editingTicket) return;
    const ticketId = editingTicket.id || editingTicket.ticketId;
    try {
      await updateTicket({ ticketId, ...data }).unwrap();
      toast.success('Ticket updated successfully!');
      setEditingTicket(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update ticket');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete / withdraw this ticket?')) return;
    try {
      await closeTicket(ticketId).unwrap();
      toast.success('Ticket closed and removed');
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete ticket');
    }
  };

  const currentRest = myRestaurants.find((r: any) => String(r.id) === String(currentRestId));

  return (
    <div className="space-y-6">
            <PageHeader
              title="Customer Support & Disputes"
              subtitle={`Manage customer tickets, refund requests, and kitchen quality feedback for ${currentRest?.name || 'your restaurants'}.`}
              actions={
                <button
                  onClick={() => refetch()}
                  className="p-2.5 bg-[var(--surface-color)] border border-[var(--border-color)] hover:border-amber-500 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Refresh Tickets"
                >
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  <span>Refresh</span>
                </button>
              }
            />

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={MessageSquare}
                label="Total Tickets"
                value={ownerTickets.length}
                accentColor="orange"
              />
              <StatCard
                icon={Clock}
                label="Open Tickets"
                value={ownerTickets.filter((t: any) => t.status === 'OPEN').length}
                accentColor="amber"
              />
              <StatCard
                icon={AlertCircle}
                label="In Progress"
                value={ownerTickets.filter((t: any) => t.status === 'IN_PROGRESS' || t.status === 'WAITING_USER').length}
                accentColor="sky"
              />
              <StatCard
                icon={CheckCircle}
                label="Resolved"
                value={ownerTickets.filter((t: any) => t.status === 'RESOLVED' || t.status === 'CLOSED').length}
                accentColor="emerald"
              />
            </div>

            {/* Store Picker & Filter Controls */}
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Store className="w-4 h-4 text-amber-400 shrink-0" />
                <select
                  value={currentRestId}
                  onChange={(e) => setSelectedRestId(e.target.value)}
                  className="px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                >
                  {myRestaurants.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.city || r.area || 'Store'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 w-48 sm:w-60"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="">All Statuses ({ownerTickets.length})</option>
                  {['OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED'].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tickets List */}
            {ticketsLoading || restsLoading ? (
              <div className="flex justify-center py-20">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-[var(--border-color)] rounded-3xl bg-[var(--surface-color)]/60">
                <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                <h3 className="font-outfit font-bold text-lg">No Store Tickets Found</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {statusFilter || searchTerm
                    ? 'No tickets match the selected filters.'
                    : 'There are no open customer support tickets for this restaurant.'}
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
                      className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm hover:border-amber-500/30 transition-all"
                    >
                      <div
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-[var(--background-color)]/40 transition-colors gap-3"
                        onClick={() => setExpandedId(isExpanded ? null : id)}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <span className="p-2 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] text-amber-400 shrink-0 mt-0.5">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
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

                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] shrink-0">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Recent'}</span>
                          </div>
                          <span className="text-xs font-semibold px-2 py-1 bg-[var(--background-color)] rounded-lg border border-[var(--border-color)]">
                            👤 {ticket.userName || 'Customer'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTicket(ticket);
                            }}
                            className="p-1.5 rounded-lg bg-[var(--background-color)] border border-[var(--border-color)] text-[var(--text-muted)] hover:text-amber-400"
                            title="Edit Ticket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTicket(id);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                            title="Delete / Close Ticket"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-[var(--border-color)] p-5 sm:p-6 bg-[var(--background-color)]/30 space-y-5">
                          <div className="p-4 rounded-xl bg-[var(--background-color)] border border-[var(--border-color)] space-y-2">
                            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Customer Description</p>
                            <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                            {ticket.orderId && (
                              <p className="text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-color)]">
                                🔗 Related Order ID: <span className="font-mono text-amber-400 font-bold">{ticket.orderId}</span>
                              </p>
                            )}
                          </div>

                          {ticket.replies && ticket.replies.length > 0 && (
                            <div className="space-y-3">
                              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Ticket Thread</p>
                              {ticket.replies.map((r: any) => (
                                <div
                                  key={r.replyId || Math.random()}
                                  className={`p-3.5 rounded-xl text-sm ${
                                    r.senderType === 'AGENT'
                                      ? 'bg-amber-500/10 border border-amber-500/20 ml-4'
                                      : 'bg-[var(--background-color)] border border-[var(--border-color)] mr-4'
                                  }`}
                                >
                                  <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[11px] font-bold ${r.senderType === 'AGENT' ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
                                      {r.senderType === 'AGENT' ? '🏪 Restaurant Staff' : '👤 ' + (r.repliedByName || ticket.userName || 'Customer')}
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

                          <div className="space-y-2">
                            <label className="block text-xs font-bold text-[var(--text-secondary)]">
                              Send Response to Diner:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Type response from restaurant management..."
                                value={ownerReplyText[id] || ''}
                                onChange={(e) => setOwnerReplyText((prev) => ({ ...prev, [id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleReply(id); }}
                                className="flex-1 px-4 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-amber-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleReply(id)}
                                disabled={sendingReply || !ownerReplyText[id]?.trim()}
                                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center gap-1.5 transition-all shrink-0"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Reply</span>
                              </button>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-[var(--border-color)] flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--text-muted)]">Update Status:</span>
                            <select
                              value={ticket.status}
                              onChange={(e) => handleStatusChange(id, e.target.value)}
                              className="px-3 py-1.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs font-bold focus:outline-none focus:border-amber-500"
                            >
                              {['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
                                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

        {editingTicket && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-[var(--surface-color)] border border-[var(--border-color)] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-3">
                <h3 className="font-outfit font-bold text-base flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-400" />
                  <span>Edit Ticket #{editingTicket.ticketNumber || editingTicket.ticketId?.slice(-8)}</span>
                </h3>
                <button onClick={() => setEditingTicket(null)} className="p-1.5 text-[var(--text-muted)] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  handleSaveEditTicket({
                    subject: target.subject.value,
                    category: target.category.value,
                    description: target.description.value,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                  <input
                    name="category"
                    defaultValue={editingTicket.category || 'ORDER_ISSUE'}
                    className="w-full px-3 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject</label>
                  <input
                    name="subject"
                    defaultValue={editingTicket.subject || ''}
                    className="w-full px-3 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    defaultValue={editingTicket.description || ''}
                    className="w-full px-3 py-2.5 bg-[var(--background-color)] border border-[var(--border-color)] rounded-xl text-xs focus:outline-none focus:border-amber-500 resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTicket(null)}
                    className="px-4 py-2 bg-[var(--background-color)] border border-[var(--border-color)] text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
