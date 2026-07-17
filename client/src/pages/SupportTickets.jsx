import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { HelpCircle, PlusCircle, Search, Sparkles, X, MessagesSquare } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../constants';
import { TableSkeleton } from '../components/Skeletons';

const SupportTickets = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  
  const { register, handleSubmit, reset } = useForm();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/support/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data.tickets);
    } catch (err) {
      toast.error('Failed to load support tickets log.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [token]);

  const onRaiseSupport = async (data) => {
    try {
      await axios.post(`${API_URL}/support/requests`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${data.type} ticket raised successfully.`);
      setShowModal(false);
      reset();
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed log support ticket.');
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Request & Inquiry Tickets</h1>
          <p className="text-xs text-slate-500 mt-1">Submit inquiries or requests not related to complaint escalations.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md select-none transition-all active:scale-[0.98] w-fit"
        >
          <PlusCircle size={14} /> Submit Query
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-450 h-4 w-4" />
          <input
            type="text"
            placeholder="Search queries by ID or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-primary-500 outline-none rounded-xl text-xs transition-all"
          />
        </div>
      </div>

      {/* Support Tickets Table */}
      {loading ? (
        <TableSkeleton cols={5} rows={3} />
      ) : filteredTickets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-slate-400 text-xs">No registered inquiries or requests found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/50 text-[10.5px] text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Ticket ID</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Type</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Subject</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Raised Date</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Resolution Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                {filteredTickets.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-primary-500">{t.ticketId}</td>
                    <td className="py-4 px-6 font-semibold">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${t.ticketType === 'Request' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400' : 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400'}`}>
                        {t.ticketType}
                      </span>
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate">{t.subject}</td>
                    <td className="py-4 px-6 text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${t.status === 'Open' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-450 dark:border-yellow-950' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-transparent'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 max-w-sm truncate italic">
                      {t.resolution || 'Resolution pending...'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW SUPPORT TICKET MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5 text-primary-500">
                <Sparkles size={16} /> Raise Inquiry or Request
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit(onRaiseSupport)} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ticket Type</label>
                <select
                  {...register('type', { required: true })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-semibold"
                >
                  <option value="Inquiry">General Inquiry (Question / Search)</option>
                  <option value="Request">Service Request (Change / Update info)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Topic Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Account address update request"
                  {...register('subject', { required: true })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Description</label>
                <textarea
                  rows={4}
                  placeholder="Share details of your inquiry or request..."
                  {...register('description', { required: true })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-medium resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SupportTickets;
