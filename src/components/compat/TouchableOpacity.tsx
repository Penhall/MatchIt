import React from 'react';

interface Props {
  onPress?: () => void;
  style?: any;
  children: React.ReactNode;
}

const TouchableOpacity: React.FC<Props> = ({ onPress, style, children }) => (
  <button onClick={onPress} style={{ ...style, background: 'none', border: 'none', cursor: 'pointer' }}>
    {children}
  </button>
);

export default TouchableOpacity;
