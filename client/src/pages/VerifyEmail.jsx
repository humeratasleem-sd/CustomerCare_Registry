import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { API_URL } from '../constants';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleVerify = async () => {
      try {
        const response = await axios.get(`${API_URL}/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification token is invalid or expired.');
      }
    };
    handleVerify();
  }, [token]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl text-center max-w-sm mx-auto">
      {status === 'verifying' && (
        <div className="flex flex-col items-center py-6">
          <Loader2 className="animate-spin text-primary-500 h-10 w-10 mb-4" />
          <h2 className="text-xl font-bold">Verifying Email Address</h2>
          <p className="text-slate-500 text-xs mt-2">Checking validation tokens against register registry...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-6">
          <CheckCircle className="text-emerald-500 h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Verification Success!</h2>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed">{message}</p>
          <Link
            to="/login"
            className="mt-6 inline-block w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
          >
            Go to Log In
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="py-6">
          <XCircle className="text-rose-500 h-12 w-12 mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Verification Failed</h2>
          <p className="text-slate-550 text-xs mt-2 leading-relaxed">{message}</p>
          <Link
            to="/login"
            className="mt-6 inline-block w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition-all"
          >
            Back to Log In
          </Link>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
