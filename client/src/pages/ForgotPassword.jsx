import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { API_URL } from '../constants';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, data);
      toast.success(response.data.message);
      setSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl max-w-sm mx-auto transition-all">
      {!success ? (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Forgot Password</h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Provide your email address to receive pass recovery details.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-655 dark:text-slate-350 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="john@company.com"
                {...register('email', { required: 'Email address is required' })}
                className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-xs outline-none transition-all ${errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'}`}
              />
              {errors.email && (
                <span className="text-[10px] text-rose-500 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Sending Link
                </>
              ) : 'Send Reset Link'}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center py-4">
          <Mail className="text-primary-500 h-10 w-10 mx-auto mb-4" />
          <h3 className="text-xl font-bold">Mail Sent</h3>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed">If that email exists, we have sent a reset password link there. Please check your inbox (or backend logs).</p>
        </div>
      )}

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-slate-850 dark:hover:text-white font-medium hover:underline transition-colors"
      >
        <ArrowLeft size={14} /> Back to Sign In
      </Link>
    </div>
  );
};

export default ForgotPassword;
