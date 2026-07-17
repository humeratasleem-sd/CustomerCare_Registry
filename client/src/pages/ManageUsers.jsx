import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { PlusCircle, Search, ToggleLeft, ToggleRight, Trash2, ShieldCheck, UserPlus, X, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { API_URL, ROLES } from '../constants';
import { TableSkeleton } from '../components/Skeletons';

const ManageUsers = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  
  const { register, handleSubmit, reset } = useForm();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load users database directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleCreateAgent = async (data) => {
    try {
      await axios.post(`${API_URL}/admin/agents`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agent profile account created successfully.');
      setShowAddModal(false);
      reset();
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create Agent account.');
    }
  };

  const handleToggleSuspend = async (targetUser) => {
    try {
      const res = await axios.patch(`${API_URL}/admin/users/${targetUser._id}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error('Failed to toggle suspension.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you absolute certain you wish to delete this user profile? This action is irreversible!')) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User account deleted.');
      fetchUsers();
    } catch (err) {
      toast.error('Deletion failure.');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">User Account Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Audit active customer directory profiles and provision agent resolution roles.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md select-none transition-all active:scale-[0.98] w-fit"
        >
          <UserPlus size={14} /> Provision Agent
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-450 h-4 w-4" />
          <input
            type="text"
            placeholder="Search accounts by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-primary-500 outline-none rounded-xl text-xs transition-all"
          />
        </div>
      </div>

      {/* Users directory Table */}
      {loading ? (
        <TableSkeleton cols={5} rows={5} />
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-slate-400 text-xs">No active user registry accounts found.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/50 text-[10.5px] text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Account Holder</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Role</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Join Date</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Suspension Status</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-bold">{u.name}</p>
                        <span className="text-[10px] text-slate-450 mt-0.5 block">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold">
                      <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${u.role === 'Admin' ? 'bg-primary-50 text-primary-709 border-primary-201 dark:bg-primary-950/20' : u.role === 'Agent' ? 'bg-yellow-50 text-yellow-700 border-yellow-250 dark:bg-yellow-950/20' : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${u.isSuspended ? 'bg-rose-50 text-rose-700 border-rose-201 dark:bg-rose-950/20' : 'bg-emerald-58 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20'}`}>
                        {u.isSuspended ? 'Suspended' : 'Clear Active'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleToggleSuspend(u)}
                        disabled={u._id === user._id}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 border rounded-xl text-[10px] font-bold transition-all ${u._id === user._id ? 'opacity-30' : 'hover:bg-slate-200 active:scale-95'}`}
                        title={u.isSuspended ? 'Activate User' : 'Suspend User'}
                      >
                        {u.isSuspended ? <ToggleRight size={14} className="text-emerald-500" /> : <ToggleLeft size={14} className="text-rose-500" />} Suspend
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u._id)}
                        disabled={u._id === user._id}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 border border-slate-201 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-rose-500 rounded-xl text-[10px] font-bold transition-all ${u._id === user._id ? 'opacity-30' : 'active:scale-95'}`}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PROVISION AGENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5 text-primary-500">
                <ShieldCheck size={16} /> Provison Agent Account
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-655"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmit(handleCreateAgent)} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Agent Full Name</label>
                <input
                  type="text"
                  placeholder="Agent Name"
                  {...register('name', { required: true })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="agent@customercare.com"
                  {...register('email', { required: true })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Temporary Password</label>
                <input
                  type="password"
                  placeholder="Password"
                  {...register('password', { required: true, minLength: 6 })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Select Department</label>
                  <select
                    {...register('department', { required: true })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all"
                  >
                    <option value="Technical Support">Technical Support</option>
                    <option value="Billing & Finance">Billing & Finance</option>
                    <option value="Customer Relations">Customer Relations</option>
                    <option value="Hardware Maintenance">Hardware Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">SLA Level</label>
                  <select
                    {...register('slaLevel')}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all"
                  >
                    <option value="Level 1">Level 1 (General Support)</option>
                    <option value="Level 2">Level 2 (Senior Support)</option>
                    <option value="Level 3">Level 3 (Enterprise Escalations)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Register Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageUsers;
