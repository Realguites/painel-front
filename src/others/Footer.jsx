import React from 'react';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <p>&copy; 2024 TimeTask. Todos os direitos reservados.</p>
    </footer>
  );
};

const styles = {
  footer: {
    width: '100%', // Ocupa toda a largura
    backgroundColor: '#e0e0e0', // Cinza claro
    padding: '10px 20px',
    borderTop: '1px solid #ccc',
    textAlign: 'center',
    boxSizing: 'border-box', // Inclui padding e bordas na largura total
  },
};

export default Footer;
