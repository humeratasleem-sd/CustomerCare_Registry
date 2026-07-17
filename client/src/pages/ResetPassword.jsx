import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { API_URL } from '../constants';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/reset-password/${token}`, {
        password: data.password
      });
      toast.success(response.data.message);
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl max-w-sm mx-auto transition-all">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">New Password</h2>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Enter your new account passkey to complete recovery.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-655 dark:text-slate-350 mb-1">New Password</label>
          <input
            type="password"
            placeholder="Min 6 characters"
            {...register('password', { 
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' }
            })}
            className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-xs outline-none transition-all ${errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'}`}
          />
          {errors.password && (
            <span className="text-[10px] text-rose-500 mt-1 block">{errors.password.message}</span>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-655 dark:text-slate-350 mb-1">Confirm New Password</label>
          <input
            type="password"
            placeholder="Re-enter password"
            {...register('confirmPassword', { 
              required: 'Confirm password is required',
              validate: (val) => val === password || 'Passwords do not match'
            })}
            className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-xs outline-none transition-all ${errors.confirmPassword ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'}`}
          />
          {errors.confirmPassword && (
            <span className="text-[10px] text-rose-500 mt-1 block">{errors.confirmPassword.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Renewing Pass
            </>
          ) : 'Change Password'}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <p className="text-xs text-slate-500">
          Remember passkey?{' '}
          <Link to="/login" className="font-semibold text-primary-500 hover:underline">
            Go to Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
