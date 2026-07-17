import React from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';
import { 
  History, 
  Settings, 
  Sliders, 
  UserSquare2, 
  HelpCircle, 
  MessageSquareHeart, 
  TicketCheck, 
  ShieldAlert, 
  User2, 
  ClipboardList 
} from 'lucide-react';
import { ROLES } from '../constants';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);

  const getSidebarLinks = () => {
    switch (user?.role) {
      case ROLES.CUSTOMER:
        return [
          { name: 'My Complaints', path: '/customer-dashboard', icon: TicketCheck },
          { name: 'Request & Inquiry', path: '/support-tickets', icon: HelpCircle },
          { name: 'My Profile', path: '/profile', icon: User2 }
        ];
      case ROLES.AGENT:
        return [
          { name: 'Agent Dashboard', path: '/agent-dashboard', icon: ClipboardList },
          { name: 'Customer Feedbacks', path: '/feedbacks', icon: MessageSquareHeart },
          { name: 'My Profile', path: '/profile', icon: User2 }
        ];
      case ROLES.ADMIN:
        return [
          { name: 'System Analytics', path: '/admin-dashboard', icon: Sliders },
          { name: 'Manage Users', path: '/manage-users', icon: UserSquare2 },
          { name: 'Complaint Categories', path: '/manage-categories', icon: Settings },
          { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert },
          { name: 'System Settings', path: '/settings', icon: Settings },
          { name: 'My Profile', path: '/profile', icon: User2 }
        ];
      default:
        return [];
    }
  };

  const links = getSidebarLinks();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
        ></div>
      )}

      <aside className={`w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col fixed inset-y-0 left-0 z-50 lg:static transition-transform duration-355 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center px-6 gap-2.5 border-b border-slate-100 dark:border-slate-800 bg-primary-600">
          <div className="h-8.5 w-8.5 bg-white/20 rounded-full flex items-center justify-center font-bold text-white text-base">
            CR
          </div>
          <span className="font-bold text-sm tracking-wide text-white">Registry System</span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={onClose}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-medium transition-all ${isActive ? 'bg-primary-50 text-primary-600 border border-primary-100 dark:bg-primary-950/30 dark:text-primary-400 dark:border-primary-900/50 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'}`}
              >
                <Icon size={16} />
                {link.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400">© 2026 Registry App</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
