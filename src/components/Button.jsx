import React, { useState } from 'react';

function Button({ label, onClick, style }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...styles.button,
        ...style,
        backgroundColor: isHovered ? styles.buttonHover.backgroundColor : styles.button.backgroundColor,
      }}
    >
      {label}
    </button>
  );
}

const styles = {
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: '#fff',
    cursor: 'pointer',
    marginBottom: '10px',
    transition: 'background-color 0.3s',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
  },
};

export default Button;