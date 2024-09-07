import React, { useState } from 'react';
import { FaHome, FaUserAlt, FaCog, FaBars } from 'react-icons/fa'; // Exemplos de ícones

function TopMenu() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMenu = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div style={styles.container}>
      <button onClick={toggleMenu} style={styles.toggleButton}>
        <FaBars style={styles.hamburgerIcon} />
      </button>
      {isExpanded && (
        <ul style={styles.menuList}>
          <li style={styles.menuItem}>
            <FaHome style={styles.icon} /> Home
          </li>
          <li style={styles.menuItem}>
            <FaUserAlt style={styles.icon} /> Profile
          </li>
          <li style={styles.menuItem}>
            <FaCog style={styles.icon} /> Settings
          </li>
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    backgroundColor: '#333',
    color: '#fff',
    zIndex: 1000,
    '@media (max-width: 768px)': {
      display: 'block',
    },
  },
  toggleButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#444',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    textAlign: 'center',
  },
  hamburgerIcon: {
    fontSize: '24px',
  },
  menuList: {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
    textAlign: 'center',
  },
  menuItem: {
    padding: '10px',
    borderBottom: '1px solid #444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
  },
  icon: {
    marginRight: '10px',
  },
};

export default TopMenu;
