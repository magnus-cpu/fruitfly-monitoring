import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Map, BarChart3, FileText, LogOut, User, Menu, X, Activity, ImageIcon, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;
  const hideOnAuth = location.pathname === '/login' || location.pathname === '/register';
  if (hideOnAuth) return null;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/map', label: 'Map', icon: Map },
    { path: '/gateways', label: 'Gateways', icon: BarChart3 },
    { path: '/system-telemetry', label: 'Telemetry', icon: Activity },
    { path: '/fruitfly-images', label: 'Images', icon: ImageIcon },
    { path: '/reports', label: 'Reports', icon: FileText },
  ];

  const adminItems = user?.role === 'admin'
    ? [{ path: '/admin/content', label: 'Content', icon: FileText }]
    : [];

  return (
    <nav className="bg-gradient-to-r from-green-900 via-emerald-800 to-lime-700 text-emerald-50 w-full shadow-lg sticky top-0 z-50 border-b border-green-500/40">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-2.5">
            <div className="bg-white/15 text-white p-2 rounded-lg border border-white/25">
              <Map className="w-6 h-6" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-wide text-white">iFF Trap</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {user && (
              <>
                {[...navItems, ...adminItems].map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                        ? 'bg-white/20 text-white'
                        : 'text-emerald-50/90 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user ? (
              <>
                {/* Desktop User Menu */}
                <div className="hidden lg:flex items-center space-x-2">
                  <Link
                    to="/profile"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/profile')
                      ? 'bg-white/20 text-white'
                      : 'text-emerald-50/90 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{user.username}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-emerald-50/90 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-2 rounded-md text-emerald-50/90 hover:text-white hover:bg-white/10"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/login')
                    ? 'bg-white/20 text-white'
                    : 'text-emerald-50/90 hover:text-white hover:bg-white/10'
                    }`}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-md text-sm font-medium bg-amber-200 text-green-900 hover:bg-amber-100 ${isActive('/register') ? 'bg-amber-100' : ''
                    }`}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && user && (
          <div className="lg:hidden py-4 border-t border-emerald-400/30">
            <div className="flex flex-col space-y-2">
              {[...navItems, ...adminItems].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(item.path)
                      ? 'bg-white/20 text-white'
                      : 'text-emerald-50/90 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="p-4 border-t border-emerald-400/30">
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/profile')
                    ? 'bg-white/20 text-white'
                    : 'text-emerald-50/90 hover:text-white hover:bg-white/10'
                    }`}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">{user.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-3 py-2 rounded-md text-sm font-medium text-emerald-50/90 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
