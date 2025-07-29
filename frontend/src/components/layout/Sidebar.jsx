import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Video, BarChart3, PieChart, User, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: Home,
    },
    {
      name: 'Clients',
      path: '/clients',
      icon: Users,
    },
    {
      name: 'Meetings',
      path: '/meetings',
      icon: Video,
    },
    {
      name: 'A/B Testing',
      path: '/ab-testing',
      icon: BarChart3,
    },
    {
      name: 'Portfolio Management',
      path: '/portfolio-management',
      icon: PieChart,
    },
  ];;

  const accountItems = [
    {
      name: 'Profile',
      path: '/profile',
      icon: User,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-[#1e3a5f] transition-transform duration-300 transform translate-x-0">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-white/10">
          <h1 className="text-2xl font-bold text-white">Richie AI</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {/* Main Section */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Main
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${active 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon 
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`} 
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Account Section - Bottom */}
        <div className="border-t border-white/10 p-2">
          <div className="space-y-1">
            {accountItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
                    ${active 
                      ? 'bg-orange-500 text-white' 
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon 
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                    }`} 
                  />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 text-gray-300 hover:bg-red-600/20 hover:text-red-400"
            >
              <LogOut 
                className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-red-400" 
              />
              Logout
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-4 py-2">
          <p className="text-xs text-gray-500 text-center">
            Richie v1.0 • SEBI 2025
          </p>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;