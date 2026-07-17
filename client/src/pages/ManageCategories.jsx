import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { PlusCircle, Search, Edit2, Trash2, ShieldAlert, X, Settings2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../constants';
import { TableSkeleton } from '../components/Skeletons';

const ManageCategories = () => {
  const { token } = useSelector((state) => state.auth);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const { register: registerAdd, handleSubmit: handleSubmitAdd, reset: resetAdd } = useForm();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit } = useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data.categories);
    } catch (err) {
      toast.error('Failed to load categories catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const handleCreateCategory = async (data) => {
    try {
      await axios.post(`${API_URL}/admin/categories`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category created successfully.');
      setShowAddModal(false);
      resetAdd();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category.');
    }
  };

  const handleEditCategory = async (data) => {
    try {
      await axios.put(`${API_URL}/admin/categories/${editingCategory._id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('SLA definition saved.');
      setEditingCategory(null);
      resetEdit();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Edit failed.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Any associated dynamic predictions will fallback to defaults.')) return;
    try {
      await axios.delete(`${API_URL}/admin/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Category removed.');
      fetchCategories();
    } catch (err) {
      toast.error('Failed to remove category.');
    }
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    resetEdit({
      name: category.name,
      description: category.description,
      slaTargetHours: category.slaTargetHours
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Complaint Categories Config</h1>
          <p className="text-xs text-slate-500 mt-1">Configure automated routing category classifications and target SLA response times.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md select-none transition-all active:scale-[0.98] w-fit"
        >
          <PlusCircle size={14} /> Add Category
        </button>
      </div>

      {/* Categories directory Table */}
      {loading ? (
        <TableSkeleton cols={4} rows={4} />
      ) : categories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-slate-400 text-xs">No complaint categories defined.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-850/50 text-[10.5px] text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Category Name</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Description</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider">Target SLA Duration</th>
                  <th className="py-4 px-6 font-semibold uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
                {categories.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-slate-250 truncate">{c.name}</td>
                    <td className="py-4 px-6 max-w-xs truncate text-slate-500">{c.description}</td>
                    <td className="py-4 px-6 font-semibold text-primary-500">{c.slaTargetHours} Hours Resolution SLA</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 hover:bg-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                      >
                        <Edit2 size={13} /> SLA config
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-201 hover:bg-rose-50 dark:hover:bg-rose-955/20 text-rose-500 rounded-xl text-[10px] font-bold transition-all active:scale-95"
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

      {/* ADD CATEGORY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5 text-primary-500">
                <Settings2 size={16} /> Add Complaint Category
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-655"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitAdd(handleCreateCategory)} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category Label</label>
                <input
                  type="text"
                  placeholder="e.g. Billing Disputes"
                  {...registerAdd('name', { required: true })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Issues relating to invoice items charges and authorizations..."
                  {...registerAdd('description', { required: true })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-medium resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Escalation SLA Target hours</label>
                <input
                  type="number"
                  placeholder="e.g. 24"
                  {...registerAdd('slaTargetHours', { required: true })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-semibold"
                />
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
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-sm font-bold flex items-center gap-1.5 text-primary-500">
                <Sparkles size={16} /> Modify SLA Thresholds
              </h2>
              <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-655"><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitEdit(handleEditCategory)} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Category Label</label>
                <input
                  type="text"
                  disabled
                  {...registerEdit('name')}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs outline-none font-semibold text-slate-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Escalation SLA Target hours</label>
                <input
                  type="number"
                  {...registerEdit('slaTargetHours', { required: true })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-800 bg-transparent rounded-xl text-xs outline-none focus:border-primary-500 transition-all font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 border rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md"
                >
                  Save Definition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageCategories;
