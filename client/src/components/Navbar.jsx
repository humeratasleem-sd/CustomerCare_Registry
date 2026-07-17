import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Bell, Sun, Moon, LogOut, ChevronDown, Check, User as UserIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { logoutUser } from '../redux/slices/authSlice';
import { API_URL } from '../constants';
import { useSocket } from '../context/SocketContext';

const Navbar = ({ onToggleSidebar }) => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const socket = useSocket();

  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const notificationRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Sync theme
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.notifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  // Socket notification listener
  useEffect(() => {
    if (!socket) return;
    
    const handleNewAlert = () => {
      fetchNotifications();
    };

    socket.on('new_inapp_alert', handleNewAlert);
    return () => {
      socket.off('new_inapp_alert', handleNewAlert);
    };
  }, [socket]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationPanel(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSignOut = () => {
    dispatch(logoutUser());
    toast.success('Successfully logged out.');
    navigate('/login');
  };

  return (
    <nav className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
        <span className="hidden md:inline text-sm font-medium text-slate-500 dark:text-slate-400">
          Hello, <strong className="text-slate-850 dark:text-slate-200">{user?.name}</strong> ({user?.role})
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Dark Mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 hover:bg-slate-150 dark:hover:bg-slate-850 rounded-full text-slate-650 dark:text-slate-350 transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications Panel */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            className="p-2 hover:bg-slate-150 dark:hover:bg-slate-850 rounded-full text-slate-650 dark:text-slate-350 relative transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotificationPanel && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-primary-500 hover:underline flex items-center gap-0.5"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No notifications yet.</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n._id}
                      onClick={() => handleMarkAsRead(n._id)}
                      className={`p-3.5 border-b border-slate-50 dark:border-slate-800/40 flex gap-2 cursor-pointer transition-colors hover:bg-slate-55 dark:hover:bg-slate-850 ${!n.read ? 'bg-slate-50/70 dark:bg-slate-850/45' : ''}`}
                    >
                      <div className="flex-1">
                        <p className={`text-xs ${!n.read ? 'font-semibold' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-slate-400/90 block mt-1">{new Date(n.createdAt).toLocaleTimeString()}</span>
                      </div>
                      {!n.read && (
                        <div className="h-1.5 w-1.5 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all"
          >
            {user?.profilePicture ? (
              <img 
                src={`${SOCKET_URL}${user.profilePicture}`} 
                alt="profile" 
                className="h-8.5 w-8.5 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                }}
              />
            ) : (
              <div className="h-8.5 w-8.5 bg-primary-100 text-primary-750 dark:bg-primary-950 dark:text-primary-350 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                {user?.name?.slice(0, 2)}
              </div>
            )}
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold leading-none">{user?.name}</span>
              <span className="text-[9.5px] text-slate-400 mt-0.5 uppercase tracking-wider">{user?.role}</span>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden lg:inline" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-850 dark:text-slate-200 truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <div className="p-1.5 flex flex-col gap-0.5">
                <Link
                  to="/profile"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs transition-colors"
                >
                  <UserIcon size={14} /> My Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 rounded-xl text-xs transition-colors w-full text-left"
                >
                  <LogOut size={14} /> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
