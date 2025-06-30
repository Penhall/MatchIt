import React from 'react';

interface Props {
  style?: any;
  children?: React.ReactNode;
}

const View: React.FC<Props> = ({ style, children }) => (
  <div style={style}>{children}</div>
);

export default View;
