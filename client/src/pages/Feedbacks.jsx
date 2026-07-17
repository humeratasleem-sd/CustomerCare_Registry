import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Star, MessageSquareHeart, ShieldAlert, Sparkles, Smile, Meh, Frown } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../constants';
import { TableSkeleton } from '../components/Skeletons';

const Feedbacks = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const res = await axios.get(`${API_URL}/support/feedback`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFeedbacks(res.data.feedbacks);
      } catch (err) {
        toast.error('Failed to load feedbacks log.');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedbacks();
  }, [token]);

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return <Smile className="text-emerald-500" size={16} />;
      case 'Neutral':
        return <Meh className="text-blue-500" size={16} />;
      case 'Negative':
        return <Frown className="text-rose-500" size={16} />;
      default:
        return null;
    }
  };

  const getSentimentBadge = (sentiment) => {
    switch (sentiment) {
      case 'Positive':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900';
      case 'Neutral':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100 dark:border-blue-900';
      case 'Negative':
      default:
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Grid */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Customer Feedbacks</h1>
          <p className="text-xs text-slate-500 mt-1">Review feedback reviews and satisfaction sentiment evaluations.</p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton cols={4} rows={3} />
      ) : feedbacks.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-slate-400 text-xs">No feedback reviews recorded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feedbacks.map((f) => (
            <div key={f._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 text-left flex flex-col justify-between">
              
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8.5 w-8.5 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
                      {f.customer?.profilePicture ? (
                        <img 
                          src={`${API_URL.replace('/api', '')}${f.customer.profilePicture}`} 
                          alt="avatar" 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                          }}
                        />
                      ) : f.customer?.name?.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-none">{f.customer?.name || 'Customer'}</p>
                      <span className="text-[10px] text-slate-450 mt-1 block">{new Date(f.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={12.5} 
                        className={star <= f.rating ? 'text-yellow-450 fill-current' : 'text-slate-200 dark:text-slate-700'} 
                      />
                    ))}
                  </div>
                </div>

                {/* Rating comments details */}
                <p className="text-xs text-slate-655 dark:text-slate-350 italic font-medium leading-relaxed">
                  "{f.comments}"
                </p>
              </div>

              {/* Linked Complaint Ticket SLA and Sentiment */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3.5 mt-2 flex items-center justify-between text-[11px] gap-2">
                <div className="text-slate-400">
                  Complaint:{' '}
                  <span className="font-bold text-primary-500 hover:underline">
                    {f.complaint?.ticketId || 'Unlinked'}
                  </span>
                </div>

                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${getSentimentBadge(f.sentiment)}`}>
                  {getSentimentIcon(f.sentiment)}
                  {f.sentiment} Sentiment
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Feedbacks;
