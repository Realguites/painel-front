import React, { useState, useEffect } from 'react';
import { FaHome, FaUserAlt, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function SideMenu() {
  const [isExpanded, setIsExpanded] = useState(window.innerWidth <= 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate(); 

  // Atualiza o estado isMobile e expande/recolhe o menu conforme o tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth <= 768;
      setIsMobile(isNowMobile);
      setIsExpanded(isNowMobile); // Expande automaticamente se for mobile, recolhe se for desktop
    };

    window.addEventListener('resize', handleResize);

    // Cleanup listener ao desmontar o componente
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div
      style={isMobile ? (isExpanded ? styles.menuExpandedMobile : styles.menuCollapsedMobile) : (isExpanded ? styles.menuExpanded : styles.menuCollapsed)}
    >
      <button onClick={toggleMenu} style={styles.toggleButton}>
        {isExpanded ? '←' : <span style={styles.hamburgerIcon}>&#9776;</span>}
      </button>
      {isExpanded && (
        <ul style={isMobile ? styles.menuListMobile : styles.menuList}>
          <li style={styles.menuItem} onClick={() => navigate('/home')}>
            <FaHome style={styles.icon} /> {isMobile ? null : 'Home'}
          </li>
          <li style={styles.menuItem} onClick={() => navigate('/profile')}>
            <FaUserAlt style={styles.icon} /> {isMobile ? null : 'Profile'}
          </li>
          <li style={styles.menuItem} onClick={() => navigate('/settings')}>
            <FaCog style={styles.icon} /> {isMobile ? null : 'Settings'}
          </li>
          <li style={styles.menuItem} onClick={handleLogout}>
            <FaSignOutAlt style={styles.icon} /> Logout
          </li>
        </ul>
      )}
    </div>
  );
}

const styles = {
  menuCollapsed: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '50px',
    height: '100%',
    backgroundColor: '#333',
    color: '#fff',
    transition: 'width 0.3s',
    overflow: 'hidden',
    zIndex: 1000,
  },
  menuExpanded: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '200px',
    height: '100%',
    backgroundColor: '#333',
    color: '#fff',
    transition: 'width 0.3s',
    zIndex: 1000,
  },
  menuCollapsedMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: 'auto',
    backgroundColor: '#333',
    color: '#fff',
    transition: 'width 0.3s',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  menuExpandedMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: 'auto',
    backgroundColor: '#333',
    color: '#fff',
    transition: 'width 0.3s',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  toggleButton: {
    width: 'auto',
    padding: '10px',
    backgroundColor: '#444',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
  },
  hamburgerIcon: {
    fontSize: '24px',
  },
  menuList: {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
  },
  menuListMobile: {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
  },
  menuItem: {
    padding: '10px',
    borderBottom: '1px solid #444',
    display: 'flex',
    alignItems: 'center',
    color: '#fff',
    cursor: 'pointer',
  },
  icon: {
    marginRight: '10px',
  },
};

export default SideMenu;
