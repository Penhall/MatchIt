
import React, { useState } from 'react';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { MOCK_MATCHES, NEON_COLORS } from '../constants';
import { Match, User } from '../types';
import { HeartIcon, SparklesIcon } from '../components/common/Icon';

interface MatchCardProps {
  match: Match;
  onRequestConnection: (user: User) => void;
}

const MatchCardComponent: React.FC<MatchCardProps> = ({ match, onRequestConnection }) => {
  return (
    <Card className="flex flex-col items-center text-center transition-transform duration-300 hover:scale-105" glowColor="blue">
      <Avatar src={match.user.avatarUrl} alt={match.user.displayName} size="lg" isVip={match.user.isVip}/>
      <h3 className="text-xl font-semibold mt-3 text-neon-blue">{match.user.displayName}</h3>
      <p className="text-sm text-gray-400">{match.user.city}</p>
      <p className={`text-2xl font-bold mt-2 ${NEON_COLORS.green}`}>{match.compatibilityScore}%</p>
      <p className="text-xs text-gray-500">Compatibility</p>
      <Button 
        variant="primary" 
        size="md" 
        className="mt-4 w-full"
        onClick={() => onRequestConnection(match.user)}
      >
        <HeartIcon className="w-5 h-5 mr-2"/> Request Connection
      </Button>
    </Card>
  );
};


const MatchAreaScreen: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectedUser, setConnectedUser] = useState<User | null>(null);

  const handleRequestConnection = (user: User) => {
    // Simulate connection request & mutual match
    console.log('Connection requested with:', user.displayName);
    // For demo, assume mutual match immediately
    setConnectedUser(user);
    setIsModalOpen(true);
    // Potentially remove user from list or mark as connected
    // setMatches(prevMatches => prevMatches.filter(m => m.user.id !== user.id));
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setConnectedUser(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 text-gray-200 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-green">
          Your Potential Connections
        </h1>
        <p className="text-gray-400 mt-1">Discover profiles that vibe with your style.</p>
      </div>

      {matches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {matches.map(match => (
            <MatchCardComponent key={match.id} match={match} onRequestConnection={handleRequestConnection} />
          ))}
        </div>
      ) : (
        <Card className="text-center py-10">
          <SparklesIcon className="w-16 h-16 mx-auto text-neon-orange mb-4" />
          <h2 className="text-xl font-semibold text-neon-orange">No New Matches Yet</h2>
          <p className="text-gray-400 mt-2">Keep refining your style or check back soon!</p>
          <Button variant="primary" className="mt-6">Adjust Your Style</Button>
        </Card>
      )}

      {connectedUser && (
        <Modal isOpen={isModalOpen} onClose={closeModal} title="Connection Established!">
          <div className="text-center">
            <Avatar src={connectedUser.avatarUrl} alt={connectedUser.displayName} size="xl" className="mx-auto mb-4" isVip={connectedUser.isVip} />
            <p className="text-xl text-neon-green font-semibold">
              You and {connectedUser.displayName} are now connected!
            </p>
            <p className="text-gray-300 mt-2">Start a conversation and see where it goes.</p>
            <Button variant="primary" size="lg" className="mt-6 w-full" onClick={() => { closeModal(); alert(`Navigate to chat with ${connectedUser.displayName}`); }}>
              Start Chatting
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MatchAreaScreen;
