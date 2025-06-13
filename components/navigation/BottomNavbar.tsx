import React from 'react';
import { 
  HomeIcon as HomeIconOutline,
  ChatBubbleLeftEllipsisIcon as ChatIconOutline,
  UserIcon as UserIconOutline,
  Cog6ToothIcon as CogIconOutline
} from '@heroicons/react/24/outline';

interface BottomNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-3">
      <button 
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-500'}`}
      >
        <HomeIconOutline className="w-6 h-6" />
        <span className="text-xs mt-1">Home</span>
      </button>
      
      <button 
        onClick={() => onTabChange('chat')}
        className={`flex flex-col items-center ${activeTab === 'chat' ? 'text-blue-500' : 'text-gray-500'}`}
      >
        <ChatIconOutline className="w-6 h-6" />
        <span className="text-xs mt-1">Chat</span>
      </button>
      
      <button 
        onClick={() => onTabChange('profile')}
        className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-blue-500' : 'text-gray-500'}`}
      >
        <UserIconOutline className="w-6 h-6" />
        <span className="text-xs mt-1">Profile</span>
      </button>
      
      <button 
        onClick={() => onTabChange('settings')}
        className={`flex flex-col items-center ${activeTab === 'settings' ? 'text-blue-500' : 'text-gray-500'}`}
      >
        <CogIconOutline className="w-6 h-6" />
        <span className="text-xs mt-1">Settings</span>
      </button>
    </div>
  );
};

export default BottomNavbar;
