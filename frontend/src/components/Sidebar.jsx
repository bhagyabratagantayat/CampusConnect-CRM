import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  CalendarClock, 
  Settings, 
  LogOut,
  ShieldCheck,
  Zap,
  Mail,
  BrainCircuit
} from 'lucide-react';
import { cn } from '../utils/cn';

const allMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['ADMIN', 'MANAGER', 'COUNSELOR'] },
  { icon: Users, label: 'Leads', path: '/leads', roles: ['ADMIN', 'MANAGER', 'COUNSELOR'] },
  { icon: UserPlus, label: 'Add Lead', path: '/leads/add', roles: ['ADMIN', 'MANAGER', 'COUNSELOR'] },
  { icon: CalendarClock, label: 'Followups', path: '/followups', roles: ['ADMIN', 'MANAGER', 'COUNSELOR'] },
  { icon: BrainCircuit, label: 'AI Assistant', path: '/ai-chat', roles: ['ADMIN', 'MANAGER', 'COUNSELOR'] },
  { icon: Zap, label: 'Automation', path: '/automation', roles: ['ADMIN', 'MANAGER'] },
  { icon: Mail, label: 'Email Logs', path: '/email-logs', roles: ['ADMIN', 'MANAGER'] },
  { icon: Users, label: 'Users', path: '/users', roles: ['ADMIN', 'MANAGER'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['ADMIN'] },
];




const Sidebar = ({ isCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = user ? allMenuItems.filter(item => item.roles.includes(user.role)) : [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-white border-r border-secondary/10 transition-all duration-300 z-40',
      isCollapsed ? 'w-20' : 'w-64'
    )}>
      <div className="flex items-center gap-3 px-6 py-8 border-b border-secondary/5">
        <div className="bg-primary rounded-xl p-2 text-white">
          <ShieldCheck size={24} />
        </div>
        {!isCollapsed && (
          <h1 className="text-xl font-bold text-secondary-900 tracking-tight">
            Admission<span className="text-primary">CRM</span>
          </h1>
        )}
      </div>


      <nav className="p-4 space-y-1.5 mt-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
              isActive 
                ? 'bg-primary text-white shadow-md shadow-primary/20' 
                : 'text-secondary/60 hover:bg-secondary/5 hover:text-primary'
            )}
          >
            <item.icon size={20} className={cn(
              'transition-transform duration-200 group-hover:scale-110'
            )} />
            {!isCollapsed && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="absolute bottom-6 left-0 w-full px-4">
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-4 w-full p-4 text-danger font-black hover:bg-danger/5 transition-colors rounded-2xl",
            isCollapsed && "justify-center"
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && <span>Logout Account</span>}
        </button>

      </div>
    </aside>
  );
};

export default Sidebar;
