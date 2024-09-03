import React, { useState } from 'react';
import { FaHome, FaUserAlt, FaCog } from 'react-icons/fa'; // Exemplos de ícones

function SideMenu() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div style={isExpanded ? styles.menuExpanded : styles.menuCollapsed}>
      <button onClick={toggleMenu} style={styles.toggleButton}>
        {isExpanded ? '←' : <span style={styles.hamburgerIcon}>&#9776;</span>}
      </button>
      {isExpanded && (
        <ul style={styles.menuList}>
          <li style={styles.menuItem}>
            <FaHome style={styles.icon} /> {window.innerWidth > 768 ? 'Home' : null}
          </li>
          <li style={styles.menuItem}>
            <FaUserAlt style={styles.icon} /> {window.innerWidth > 768 ? 'Profile' : null}
          </li>
          <li style={styles.menuItem}>
            <FaCog style={styles.icon} /> {window.innerWidth > 768 ? 'Settings' : null}
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
    '@media (max-width: 768px)': {
      width: '0px',
    },
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
    '@media (max-width: 768px)': {
      width: '100%',
      top: '0',
      left: '0',
      height: 'auto',
      position: 'fixed',
    },
  },
  toggleButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#444',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    '@media (max-width: 768px)': {
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  },
  hamburgerIcon: {
    fontSize: '24px',
  },
  menuList: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  menuItem: {
    padding: '10px 20px',
    borderBottom: '1px solid #555',
    display: 'flex',
    alignItems: 'center',
  },
};

export default SideMenu;