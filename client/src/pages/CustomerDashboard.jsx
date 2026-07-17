import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { PlusCircle, Search, Filter, FileDown, Heart, Star, Sparkles, X, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

import { fetchComplaints, createComplaint } from '../redux/slices/complaintSlice';
import { STATUS_COLORS, PRIORITY_COLORS, API_URL } from '../constants';
import { TableSkeleton } from '../components/Skeletons';

const CustomerDashboard = () => {
  const dispatch = useDispatch();
  const { complaints, isLoading, error } = useSelector((state) => state.complaints);
  const { token } = useSelector((state) => state.auth);

  // Lists configurations
  const [categories, setCategories] = useState([]);
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTicketForReview, setSelectedTicketForReview] = useState(null);
  
  // Search & Filters state
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  // Rating review form state
  const [starRating, setStarRating] = useState(5);
  const [reviewComments, setReviewComments] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  // Fetch tickets and categories
  useEffect(() => {
    dispatch(fetchComplaints({ search, status, priority }));
  }, [dispatch, search, status, priority]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/categories`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(res.data.categories);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, [token]);

  // Card Calculations
  const pendingCount = complaints.filter(c => ['Pending', 'Assigned', 'In Progress', 'Waiting For Customer'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const closedCount = complaints.filter(c => c.status === 'Closed').length;

  const onRaiseComplaint = (data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    
    // Pass auto-prediction details to backend
    if (data.category && data.category !== 'auto') {
      formData.append('category', data.category);
    }
    if (data.priority && data.priority !== 'auto') {
      formData.append('priority', data.priority);
    }

    if (data.attachments && data.attachments.length > 0) {
      Array.from(data.attachments).forEach((file) => {
        formData.append('attachments', file);
      });
    }

    dispatch(createComplaint(formData))
      .unwrap()
      .then(() => {
        toast.success('Complaint ticket raised successfully!');
        setShowRaiseModal(false);
        reset();
      })
      .catch((err) => toast.error(err));
  };

  const handleOpenReview = (ticket) => {
    setSelectedTicketForReview(ticket);
    setStarRating(5);
    setReviewComments('');
    setShowReviewModal(true);
  };

  const onSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewComments.trim()) {
      return toast.warning('Please enter your review comments.');
    }

    setReviewLoading(true);
    try {
      await axios.post(`${API_URL}/support/feedback`, {
        complaintId: selectedTicketForReview._id,
        rating: starRating,
        comments: reviewComments
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Feedback recorded! Thank you for rating our service!');
      setShowReviewModal(false);
      dispatch(fetchComplaints({ search, status, priority })); // reload
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed log feedback.');
    } finally {
      setReviewLoading(false);
    }
  };

  // Generate and Download PDF Report locally
  const exportPDFReport = () => {
    const doc = new jsPDF();
    
    // PDF Styling setup
    doc.setFont('helvetica');
    doc.setFontSize(20);
    doc.textColor(12, 135, 235); // primary-500
    doc.text('Customer Ticket History Report', 14, 20);
    
    doc.setFontSize(10);
    doc.textColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    const tableColumn = ["Ticket ID", "Title", "Created Date", "Priority", "Status", "Assigned Agent"];
    const tableRows = [];

    complaints.forEach(ticket => {
      const ticketData = [
        ticket.ticketId,
        ticket.title,
        new Date(ticket.createdAt).toLocaleDateString(),
        ticket.priority,
        ticket.status,
        ticket.assignedAgent ? ticket.assignedAgent.name : 'Unassigned'
      ];
      tableRows.push(ticketData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [12, 135, 235] }, // primary-500
    });

    doc.save('complaints-report.pdf');
    toast.success('PDF report downloaded successfully.');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Support Registration Portal</h1>
          <p className="text-xs text-slate-500 mt-1">Manage and track your registered complaints and tickets.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportPDFReport}
            className="flex items-center gap-1.5 px-4.5 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl text-xs font-semibold select-none transition-colors"
          >
            <FileDown size={14} /> PDF Report
          </button>
          
          <button
            onClick={() => setShowRaiseModal(true)}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md select-none transition-all active:scale-[0.98]"
          >
            <PlusCircle size={14} /> File a Complaint
          </button>
        </div>
      </div>

      {/* Cards Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-left">
          <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Complaints</h3>
          <p className="text-3xl font-extrabold mt-3 text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-left">
          <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Resolved Tickets</h3>
          <p className="text-3xl font-extrabold mt-3 text-emerald-600">{resolvedCount}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-left">
          <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Closed Tickets</h3>
          <p className="text-3xl font-extrabold mt-3 text-slate-500">{closedCount}</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-450 h-4 w-4" />
          <input
            type="text"
            placeholder="Search tickets by ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-primary-500 outline-none rounded-xl text-xs transition-all"
          />
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-201 dark:border-slate-800 bg-transparent text-xs hover:border-slate-350 outline-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting For Customer">Waiting For Customer</option>
            <option value="Escalated">Escalated</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-201 dark:border-slate-800 bg-transparent text-xs hover:border-slate-350 outline-none cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Complaints Table Layout */}
      {isLoading ? (
        <TableSkeleton cols={5} rows={5} />
      ) : complaints.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-slate-400 text-xs">No registered complaints found mapping search details.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/50 text-[10.5px] text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Ticket ID</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Title</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Raised Date</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Priority</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                {complaints.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-primary-500">{ticket.ticketId}</td>
                    <td className="py-4 px-6 font-semibold max-w-xs truncate">{ticket.title}</td>
                    <td className="py-4 px-6 text-slate-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${PRIORITY_COLORS[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${STATUS_COLORS[ticket.status]}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2.5">
                      {ticket.status === 'Resolved' && (
                        <button
                          onClick={() => handleOpenReview(ticket)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900 rounded-xl text-[10.5px] font-bold hover:bg-emerald-105 active:scale-95 transition-all w-fit pointer-events-auto"
                        >
                          <Star size={12} className="fill-current" /> Rate Agent
                        </button>
                      )}
                      
                      <Link
                        to={`/complaints/${ticket._id}`}
                        className="inline-flex items-center gap-0.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-120 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold transition-all"
                      >
                        Inspect <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RAISE COMPLAINT MODAL */}
      {showRaiseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-bold flex items-center gap-1.5 text-primary-500">
                <Sparkles size={16} /> File New Complaint
              </h2>
              <button onClick={() => setShowRaiseModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit(onRaiseComplaint)} className="space-y-4 text-left">
              <div>
                <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">Issue Title</label>
                <input
                  type="text"
                  placeholder="e.g. Billing error on double authorization charges"
                  {...register('title', { required: true })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">Detailed Description</label>
                <textarea
                  rows={4}
                  placeholder="Please describe what occurred in detail..."
                  {...register('description', { required: true })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-medium resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">Category Classification</label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all"
                  >
                    <option value="auto">Auto-Predict (AI Engine)</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">Complaint Priority</label>
                  <select
                    {...register('priority')}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all"
                  >
                    <option value="auto">Auto-Predict (AI Engine)</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">Upload Attachments (Images/PDFs)</label>
                <input
                  type="file"
                  multiple
                  {...register('attachments')}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10.5px] file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRaiseModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all"
                >
                  Submit Complaint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RATING REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold flex items-center gap-1 text-slate-850 dark:text-slate-200">
                <Heart size={16} className="text-rose-500 fill-current" /> Submit Service Review
              </h2>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <form onSubmit={onSubmitReview} className="space-y-4 text-left">
              <div>
                <p className="text-xs text-slate-550 mb-2">We have resolved ticket {selectedTicketForReview?.ticketId}. Please tell us about your experience:</p>
                
                <div className="flex justify-center gap-2.5 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      className="transition-transform active:scale-120 duration-100 hover:scale-105"
                    >
                      <Star 
                        size={28} 
                        className={star <= starRating ? 'text-yellow-450 fill-current' : 'text-slate-250 dark:text-slate-700'} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-semibold text-slate-500 mb-1">Your Feedback Details</label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="Tell us what you liked or how we can improve..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-medium resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reviewLoading}
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {reviewLoading ? 'Securing Review...' : 'Send Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerDashboard;
