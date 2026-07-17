import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ShieldAlert, Search } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../constants';
import { TableSkeleton } from '../components/Skeletons';

const AuditLogs = () => {
  const { token } = useSelector((state) => state.auth);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data.logs);
      } catch (err) {
        toast.error('Failed to load system audit logs.');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase()) ||
    (l.actor?.name && l.actor.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">System Audit Log</h1>
          <p className="text-xs text-slate-500 mt-1">Audit administrative operations, staff assignment settings changes, and customer suspensions.</p>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-450 h-4 w-4" />
          <input
            type="text"
            placeholder="Search audit parameters by actor, action description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-primary-500 outline-none rounded-xl text-xs transition-all"
          />
        </div>
      </div>

      {/* Audit Log Table layout */}
      {loading ? (
        <TableSkeleton cols={4} rows={6} />
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-slate-400 text-xs">No audit logs found mapping criteria.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/50 text-[10.5px] text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Date & Time</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Officer Actor</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Action Description</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Detailed Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                {filteredLogs.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="py-4 px-6 text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                    <td className="py-4 px-6 font-bold">{l.actor?.name || 'System Auto'}</td>
                    <td className="py-4 px-6 font-semibold">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold text-indigo-650 dark:text-indigo-400`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-450 italic max-w-sm truncate">
                      {l.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AuditLogs;
