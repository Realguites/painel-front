import React from 'react';
import { motion } from 'framer-motion';

const letterVariants = {
  initial: { y: 50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
};

const AnimatedLogo = ({ fontSize = '4rem', color = '#007BFF' }) => {
  const letters = "timetask".split("");

  return (
    <div style={{ ...styles.container, fontSize, color }}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={letterVariants}
          initial="initial"
          animate="animate"
          transition={{
            delay: index * 0.1,
            duration: 0.5,
            repeat: Infinity,   // Repetir infinitamente
            repeatDelay: 4.5,   // Tempo entre as repetições
          }}
          style={styles.letter}
        >
          {letter}
        </motion.span>
      ))}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  letter: {
    margin: '0 6px',
  },
};

export default AnimatedLogo;