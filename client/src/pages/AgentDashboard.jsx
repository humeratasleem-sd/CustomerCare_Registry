import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  fetchComplaints, 
  acceptTicket, 
  rejectTicket,
  resolveTicket,
  postInternalNote,
  escalateTicket
} from '../redux/slices/complaintSlice';
import { 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MessageSquareOff, 
  Search, 
  X, 
  Save, 
  ChevronRight, 
  HeartHandshake,
  MessageCircleQuestion,
  FilePlus,
  Flame
} from 'lucide-react';
import { toast } from 'react-toastify';
import { STATUS_COLORS, PRIORITY_COLORS, API_URL } from '../constants';
import { TableSkeleton } from '../components/Skeletons';
import axios from 'axios';

const AgentDashboard = () => {
  const dispatch = useDispatch();
  const { complaints, isLoading } = useSelector((state) => state.complaints);
  const { token, user } = useSelector((state) => state.auth);

  const [metrics, setMetrics] = useState({
    assignedCount: 0,
    resolvedCount: 0,
    pendingCount: 0,
    escalatedCount: 0,
    performanceRating: 5.0
  });

  const [search, setSearch] = useState('');
  const [rejectingTicket, setRejectingTicket] = useState(null);
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [escalatingTicket, setEscalatingTicket] = useState(null);

  const [rejectComments, setRejectComments] = useState('');
  const [escalateComments, setEscalateComments] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [resolutionFiles, setResolutionFiles] = useState([]);

  const loadAgentData = async () => {
    dispatch(fetchComplaints({ search }));
    try {
      const res = await axios.get(`${API_URL}/analytics/agent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMetrics(res.data.metrics);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAgentData();
  }, [dispatch, search]);

  const handleAccept = (id) => {
    dispatch(acceptTicket(id))
      .unwrap()
      .then(() => {
        toast.success('Assignment accepted of ticket.');
        loadAgentData();
      })
      .catch((err) => toast.error(err));
  };

  const handleOpenReject = (ticket) => {
    setRejectingTicket(ticket);
    setRejectComments('');
  };

  const submitReject = () => {
    if (!rejectComments.trim()) return toast.warning('Please input comments explaining rejection.');
    dispatch(rejectTicket({ id: rejectingTicket._id, comments: rejectComments }))
      .unwrap()
      .then(() => {
        toast.success('Assignment rejected.');
        setRejectingTicket(null);
        loadAgentData();
      })
      .catch((err) => toast.error(err));
  };

  const handleOpenResolve = (ticket) => {
    setResolvingTicket(ticket);
    setResolutionText('');
    setResolutionFiles([]);
  };

  const submitResolution = () => {
    if (!resolutionText.trim()) return toast.warning('Please input details of resolution.');
    
    const formData = new FormData();
    formData.append('resolutionDescription', resolutionText);
    if (resolutionFiles && resolutionFiles.length > 0) {
      Array.from(resolutionFiles).forEach(file => {
        formData.append('resolutionAttachments', file);
      });
    }

    dispatch(resolveTicket({ id: resolvingTicket._id, formData }))
      .unwrap()
      .then(() => {
        toast.success('Ticket resolution recorded successfully.');
        setResolvingTicket(null);
        loadAgentData();
      })
      .catch((err) => toast.error(err));
  };

  const handleOpenEscalate = (ticket) => {
    setEscalatingTicket(ticket);
    setEscalateComments('');
  };

  const submitEscalate = () => {
    if (!escalateComments.trim()) return toast.warning('Please state reasons for SLA escalation.');
    dispatch(escalateTicket({ id: escalatingTicket._id, comments: escalateComments }))
      .unwrap()
      .then(() => {
        toast.success('Ticket Escalated to administrators dashboard.');
        setEscalatingTicket(null);
        loadAgentData();
      })
      .catch((err) => toast.error(err));
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Agent Resolution Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">Review active assignments and record client resolutions.</p>
        </div>
      </div>

      {/* Metrics Header Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-primary-50 dark:bg-primary-950/20 text-primary-555 rounded-xl"><Award size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Rating</p>
            <p className="text-xl font-extrabold text-slate-850 dark:text-white mt-1">{metrics.performanceRating} / 5</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-555 rounded-xl"><FilePlus size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Assigned</p>
            <p className="text-xl font-extrabold text-slate-850 dark:text-white mt-1">{metrics.assignedCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-555 rounded-xl"><Clock size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Pending</p>
            <p className="text-xl font-extrabold text-slate-850 dark:text-white mt-1">{metrics.pendingCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-555 rounded-xl"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Resolved</p>
            <p className="text-xl font-extrabold text-slate-850 dark:text-white mt-1">{metrics.resolvedCount}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-555 rounded-xl"><Flame size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Escalated</p>
            <p className="text-xl font-extrabold text-slate-850 dark:text-white mt-1">{metrics.escalatedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex gap-4 items-center justify-between shadow-sm">
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
      </div>

      {/* Complaints Table Layout */}
      {isLoading ? (
        <TableSkeleton cols={6} rows={5} />
      ) : complaints.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-slate-400 text-xs">No assigned complaints matching active records.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/50 text-[10.5px] text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Ticket ID</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Title</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Priority</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Escalation Count</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                {complaints.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-primary-500">{ticket.ticketId}</td>
                    <td className="py-4 px-6 font-semibold max-w-xs truncate">{ticket.title}</td>
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
                    <td className="py-4 px-6 text-slate-500 italic">
                      {ticket.isEscalated ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-500">
                          <Flame size={12} className="animate-bounce" /> Escalated
                        </span>
                      ) : (
                        `Normal SLA (${ticket.escalationCount || 0} times)`
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-y-1.5 md:space-y-0 md:space-x-2">
                       {ticket.status === 'Assigned' && (
                         <div className="inline-flex gap-2">
                           <button 
                             onClick={() => handleAccept(ticket._id)}
                             className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition-all"
                           >
                             Accept
                           </button>
                           <button 
                             onClick={() => handleOpenReject(ticket)}
                             className="px-3 py-1.5 bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900 rounded-xl text-[10px] font-bold transition-all"
                           >
                             Reject
                           </button>
                         </div>
                       )}

                       {['In Progress', 'Waiting For Customer', 'Escalated'].includes(ticket.status) && (
                         <div className="inline-flex gap-2">
                           <button 
                             onClick={() => handleOpenResolve(ticket)}
                             className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold transition-all"
                           >
                             Resolve
                           </button>
                           <button 
                             onClick={() => handleOpenEscalate(ticket)}
                             className="px-3 py-1.5 bg-orange-600 hover:bg-orange-750 text-white rounded-xl text-[10px] font-bold transition-all"
                           >
                             Escalate
                           </button>
                         </div>
                       )}

                      <Link
                        to={`/complaint/${ticket._id}`}
                        className="inline-flex items-center gap-0.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-[10.5px] font-bold transition-all"
                      >
                        Details <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-rose-600 flex items-center gap-1.5">
                <AlertTriangle size={16} /> Reject Assignment
              </h2>
              <button onClick={() => setRejectingTicket(null)} className="text-slate-400 hover:text-slate-655"><X size={18} /></button>
            </div>
            
            <div>
              <p className="text-xs text-slate-500 mb-2">Please explain why you are rejecting ticket {rejectingTicket.ticketId}:</p>
              <textarea
                rows={3}
                value={rejectComments}
                onChange={(e) => setRejectComments(e.target.value)}
                placeholder="Reasoning for assignment rejection..."
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-rose-500 transition-all font-medium resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setRejectingTicket(null)} className="px-4 py-2 border rounded-xl text-xs">Cancel</button>
              <button onClick={submitReject} className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold shadow-md">Reject Ticket</button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE MODAL */}
      {resolvingTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Resolve Complaint
              </h2>
              <button onClick={() => setResolvingTicket(null)} className="text-slate-400 hover:text-slate-655"><X size={18} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Resolution Summary Details</label>
                <textarea
                  rows={4}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Detail the steps taken to address and resolve this customer issue..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-emerald-500 transition-all font-medium resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Add resolution files / receipts (Optional)</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setResolutionFiles(e.target.files)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10.5px] file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setResolvingTicket(null)} className="px-4 py-2 border rounded-xl text-xs">Cancel</button>
              <button onClick={submitResolution} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-md">Complete Resolution</button>
            </div>
          </div>
        </div>
      )}

      {/* ESCALATE MODAL */}
      {escalatingTicket && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold text-orange-600 flex items-center gap-1.5">
                <Flame size={16} /> Escalate Ticket to Admin
              </h2>
              <button onClick={() => setEscalatingTicket(null)} className="text-slate-400 hover:text-slate-655"><X size={18} /></button>
            </div>
            
            <div>
              <p className="text-xs text-slate-550 mb-2">Provide brief details or context for administrative override:</p>
              <textarea
                rows={3}
                value={escalateComments}
                onChange={(e) => setEscalateComments(e.target.value)}
                placeholder="reasons for escalation..."
                className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-orange-500 transition-all font-medium resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setEscalatingTicket(null)} className="px-4 py-2 border rounded-xl text-xs">Cancel</button>
              <button onClick={submitEscalate} className="px-5 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-md">Submit Escalation</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AgentDashboard;
