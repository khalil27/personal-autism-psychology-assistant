import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  LogOut, 
  Bell, 
  Menu, 
  X, 
  Home,
  Calendar,
  FileText,
  Users,
  Settings,
  Shield,
  Activity
} from 'lucide-react';
import { notificationsAPI } from '../../services/api';
import { Notification } from '../../types';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationsAPI.getByUserId(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNavigationItems = () => {
    if (!user) return [];

    const baseItems = [
      { name: 'Dashboard', href: `/${user.role}`, icon: Home },
    ];

    switch (user.role) {
      case 'patient':
        return [
          ...baseItems,
          { name: 'My Profile', href: '/patient/profile', icon: User },
          { name: 'Sessions', href: '/patient/sessions', icon: Calendar },
          { name: 'Reports', href: '/patient/reports', icon: FileText },
        ];
      case 'doctor':
        return [
          ...baseItems,
          { name: 'Patients', href: '/doctor/patients', icon: Users },
          { name: 'Sessions', href: '/doctor/sessions', icon: Calendar },
          { name: 'Reports', href: '/doctor/reports', icon: FileText },
        ];
      case 'admin':
        return [
          ...baseItems,
          { name: 'Users', href: '/admin/users', icon: Users },
          { name: 'Sessions', href: '/admin/sessions', icon: Calendar },
          { name: 'Reports', href: '/admin/reports', icon: FileText },
          { name: 'Audit Logs', href: '/admin/logs', icon: Activity },
          { name: 'Settings', href: '/admin/settings', icon: Settings },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-blue-600 text-white">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8" />
            <span className="text-xl font-bold">HealthCare</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {user?.name} {user?.last_name}
              </div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col min-h-screen w-full bg-gray-50">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 lg:hidden" />

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b hover:bg-gray-50 ${
                              !notification.is_read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default Layout;