import React from 'react';

function CheckboxField({ id, label, linkText, linkHref }) {
  return (
    <div style={styles.checkboxGroup}>
      <input type="checkbox" id={id} />
      <label htmlFor={id} style={styles.label}>
        {label} <a href={linkHref} style={styles.link}>{linkText}</a>
      </label>
    </div>
  );
}

const styles = {
  checkboxGroup: {
    marginBottom: '10px',
  },
  label: {
    marginLeft: '5px',
    fontSize: '14px',
  },
  link: {
    color: '#007BFF',
    textDecoration: 'none',
  },
};

export default CheckboxField;