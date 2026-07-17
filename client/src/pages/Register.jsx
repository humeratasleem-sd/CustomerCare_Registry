import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { registerUser, clearAuthError, resetRegistrationState } from '../redux/slices/authSlice';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, isRegistered } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Redirect on successful registration
  useEffect(() => {
    if (isRegistered) {
      toast.success('Registration successful! Please check your email (or server console) to verify your account.');
      dispatch(resetRegistrationState());
      navigate('/login');
    }
  }, [isRegistered, navigate, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  const onSubmit = (data) => {
    dispatch(registerUser(data));
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl transition-all">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
        <p className="text-xs text-slate-500 mt-1.5 font-medium">Register to file and track support issues</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-655 dark:text-slate-350 mb-1">Full Name</label>
          <input
            type="text"
            placeholder="John Doe"
            {...register('name', { required: 'Name is required' })}
            className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-xs outline-none transition-all ${errors.name ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'}`}
          />
          {errors.name && (
            <span className="text-[10px] text-rose-500 mt-1 block">{errors.name.message}</span>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-655 dark:text-slate-350 mb-1">Email Address</label>
          <input
            type="email"
            placeholder="john@company.com"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^\S+@\S+$/i,
                message: 'Invalid email address formula'
              }
            })}
            className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-xs outline-none transition-all ${errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'}`}
          />
          {errors.email && (
            <span className="text-[10px] text-rose-500 mt-1 block">{errors.email.message}</span>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-655 dark:text-slate-350 mb-1">Phone Number (Optional)</label>
          <input
            type="text"
            placeholder="+1 (555) 000-0000"
            {...register('phone')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-xs outline-none focus:border-primary-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-655 dark:text-slate-350 mb-1">Password</label>
          <input
            type="password"
            placeholder="Min 6 characters"
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              }
            })}
            className={`w-full px-4 py-2.5 rounded-xl border bg-transparent text-xs outline-none transition-all ${errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800 focus:border-primary-500'}`}
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
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800/80 pt-4">
        <p className="text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-primary-500 hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
