import React from 'react';

function SelectField({ options, style }) {
  return (
    <select style={{ ...styles.select, ...style }}>
      {options.map((option, index) => (
        <option key={index} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

const styles = {
  select: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    marginBottom: '10px',
  },
};

export default SelectField;