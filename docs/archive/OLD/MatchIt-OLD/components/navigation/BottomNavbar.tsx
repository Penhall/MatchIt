
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../../constants';
import { UserIcon, AdjustmentsIcon, HeartIcon, ChatBubbleIcon, ShoppingBagIcon, CogIcon, SparklesIcon } from '../common/Icon';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to === APP_ROUTES.CHAT && location.pathname.startsWith('/chat/'));


  return (
    <NavLink
      to={to}
      className={({ isActive: navLinkIsActive }) => // Use NavLink's isActive if preferred over manual check
        `flex flex-col items-center justify-center flex-1 p-2 transition-all duration-200 hover:text-neon-blue ${
          isActive ? 'text-neon-blue scale-110' : 'text-gray-400'
        }`
      }
    >
      <div className={`mb-0.5 ${isActive ? 'animate-pulseGlow' : ''}`}>{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </NavLink>
  );
};

const BottomNavbar: React.FC = () => {
  return (
    <nav className="bg-dark-card/80 backdrop-blur-md border-t border-neon-blue/20 shadow-lg flex justify-around items-center h-16 sticky bottom-0 z-10 rounded-b-[34px]">
      <NavItem to={APP_ROUTES.PROFILE} icon={<UserIcon className="w-5 h-5" />} label="Profile" />
      <NavItem to={APP_ROUTES.STYLE_ADJUSTMENT} icon={<AdjustmentsIcon className="w-5 h-5" />} label="Style" />
      <NavItem to={APP_ROUTES.MATCH_AREA} icon={<HeartIcon className="w-5 h-5" />} label="Matches" />
      <NavItem to={APP_ROUTES.CHAT.replace(':chatId', 'global')} icon={<ChatBubbleIcon className="w-5 h-5" />} label="Chats" />
      <NavItem to={APP_ROUTES.VENDOR} icon={<ShoppingBagIcon className="w-5 h-5" />} label="Shop" />
      <NavItem to={APP_ROUTES.SETTINGS} icon={<CogIcon className="w-5 h-5" />} label="Settings" />
    </nav>
  );
};

export default BottomNavbar;
