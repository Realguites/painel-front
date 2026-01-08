import React from 'react';
import AnimatedLogoHeader from './AnimatedLogoHeader';
import SideMenu from '../components/SideMenu';
import logo from './logo.png';

const Header = () => {
  return (
    <div>
      <SideMenu />
      <div style={styles.logoWrapper}>
        <img src={logo} alt="Logo do Sistema" style={styles.logo} />
      </div>
    </div>
  );
};

const styles = {
  logoWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',         // Garante que ocupe a largura toda
    marginTop: '10px',
    marginBottom: '10px',
  },
  logo: {
    width: '400px',
    height: 'auto',
  },
};



export default Header;