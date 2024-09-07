import React from 'react';
import AnimatedLogoHeader from './AnimatedLogoHeader';
import SideMenu from '../components/SideMenu';

const Header = () => {
  return (
    <div>
      <SideMenu />
      <AnimatedLogoHeader />
    </div>
  );
};

const styles = {
  header: {
    width: '100%', // Ocupa toda a largura
    padding: '10px 20px',
    borderBottom: '1px solid #ccc',
    textAlign: 'center',
  },
};

export default Header;