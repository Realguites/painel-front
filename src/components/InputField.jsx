import React from 'react';

function InputField({ type = 'text', placeholder, style }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      style={{ ...styles.input, ...style }}
    />
  );
}

const styles = {
  input: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    marginBottom: '10px',
  },
};

export default InputField;