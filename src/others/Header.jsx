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


export default Header;