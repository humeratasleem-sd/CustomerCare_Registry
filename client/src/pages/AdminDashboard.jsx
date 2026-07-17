import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Users, FileText, Clock, AlertTriangle, ShieldCheck, TrendingUp, HelpCircle } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../constants';
import { CardSkeleton, ChartSkeleton } from '../components/Skeletons';

// Import and register ChartJS components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const { token } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_URL}/analytics/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load system analytical metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-slate-205 dark:bg-slate-800 animate-pulse rounded"></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton /><ChartSkeleton />
        </div>
      </div>
    );
  }

  const { cards, charts } = data;

  // Chart 1: Monthly Trend
  const monthlyData = {
    labels: charts.monthlyDistribution.map(m => `${m._id.month}/${m._id.year}`),
    datasets: [
      {
        label: 'Monthly Volume',
        data: charts.monthlyDistribution.map(m => m.count),
        borderColor: '#0c87eb',
        backgroundColor: '#0c87eb20',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5
      }
    ]
  };

  // Chart 2: Priority breakdown (Doughnut)
  const priorityData = {
    labels: charts.priorityDistribution.map(p => p.priority),
    datasets: [
      {
        data: charts.priorityDistribution.map(p => p.count),
        backgroundColor: ['#b2c6cf', '#3b82f6', '#f97316', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  // Chart 3: Agent Ratings rank (Bar)
  const agentPerformanceData = {
    labels: charts.agentsOverview.map(a => a.user?.name || 'Agent'),
    datasets: [
      {
        label: 'Satisfaction Rating (5.0)',
        data: charts.agentsOverview.map(a => a.performanceRating || 5.0),
        backgroundColor: '#10b981',
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          font: { size: 10 }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">System Control & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Cross-platform tracking of complaints volumes, SLAs violation rates and performance ratings.</p>
        </div>
      </div>

      {/* Cards Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 text-left shadow-sm">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-555 rounded-xl"><Users size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Registry Staff</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{cards.totalAgents} Agents</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 text-left shadow-sm">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-555 rounded-xl"><FileText size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Global Tickets</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{cards.totalComplaints}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 text-left shadow-sm">
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-555 rounded-xl"><Clock size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Avg resolution</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{cards.avgResolutionTimeHours} hrs</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 text-left shadow-sm">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-555 rounded-xl"><AlertTriangle size={20} /></div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Escalated Tickets</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">{cards.escalatedCount}</p>
          </div>
        </div>

      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Trend (Line) - 2 Cols */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl h-80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 border-b pb-2">
            <TrendingUp size={16} className="text-primary-500" />
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-250">Monthly Escalations & Inquiries</h3>
          </div>
          <div className="flex-1 h-full py-2">
            <Line data={monthlyData} options={chartOptions} />
          </div>
        </div>

        {/* Priority breakdown (Doughnut) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl h-80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 border-b pb-2">
            <AlertTriangle size={16} className="text-primary-500" />
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-250">Tickets Priority Distribution</h3>
          </div>
          <div className="flex-1 h-full py-2">
            <Doughnut data={priorityData} options={chartOptions} />
          </div>
        </div>

        {/* Agent performance (Bar) - 3 Cols wide */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl h-80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-1.5 border-b pb-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            <h3 className="text-xs font-bold text-slate-850 dark:text-slate-250">Agent Performance Rating Ranks</h3>
          </div>
          <div className="flex-1 h-full py-1">
            <Bar data={agentPerformanceData} options={{
              ...chartOptions,
              scales: {
                y: {
                  min: 0,
                  max: 5,
                  ticks: { stepSize: 1 }
                }
              }
            }} />
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
