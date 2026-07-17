import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { loginUser, clearAuthError } from '../redux/slices/authSlice';
import { ROLES } from '../constants';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, user } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Redirect on successful login
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case ROLES.ADMIN:
          navigate('/admin-dashboard');
          break;
        case ROLES.AGENT:
          navigate('/agent-dashboard');
          break;
        case ROLES.CUSTOMER:
        default:
          navigate('/customer-dashboard');
      }
    }
  }, [user, navigate]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    dispatch(loginUser(data));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-all">
      <div className="text-center mb-6">
        <div className="h-12 w-12 bg-primary-650 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md">
          CR
        </div>
        <h2 className="text-2xl font-bold mt-4 tracking-tight">Welcome Back</h2>
        <p className="text-xs text-slate-500 mt-1.5">Sign in to manage registry tickets</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-655 dark:text-slate-350 mb-1">Email Address</label>
          <input
            type="email"
            placeholder="name@company.com"
            {...register('email', { required: 'Email address is required' })}
            className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-xs outline-none transition-all ${errors.email ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'}`}
          />
          {errors.email && (
            <span className="text-[10px] text-rose-500 mt-1 block">{errors.email.message}</span>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-slate-655 dark:text-slate-350">Password</label>
            <Link to="/forgot-password" className="text-[10px] text-primary-500 hover:underline">Forgot?</Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            {...register('password', { required: 'Password is required' })}
            className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-xs outline-none transition-all ${errors.password ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'}`}
          />
          {errors.password && (
            <span className="text-[10px] text-rose-500 mt-1 block">{errors.password.message}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isLoading ? 'Signing In...' : 'Verify & Log In'}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <p className="text-xs text-slate-500">
          Need an account?{' '}
          <Link to="/register" className="font-semibold text-primary-500 hover:underline">
            Register Now
          </Link>
        </p>
        
        {/* Help Note */}
        <div className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800/50 p-3 rounded-2xl text-[10px] text-slate-500 mt-4 leading-relaxed text-left">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Demo Administrative Details:</p>
          <p className="mt-1"><strong>Email:</strong> admin@customercare.com</p>
          <p><strong>Password:</strong> AdminPassword123!</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
