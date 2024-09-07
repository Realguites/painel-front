import React, { useState } from 'react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import AnimatedLogo from '../others/AnimatedLogo';


function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Lógica de autenticação aqui
    alert(`Email: ${email}\nPassword: ${password}`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
      <AnimatedLogo />
        <h2 style={styles.title}>Login</h2>
        <InputField
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={styles.input}
        />
        <InputField
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          style={styles.input}
        />
        <Button label="Entrar" onClick={handleLogin} style={styles.button} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f7f9fc',
  },
  loginBox: {
    width: '350px',
    padding: '40px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  title: {
    marginBottom: '20px',
    color: '#333',
    fontSize: '24px',
  },
  input: {
    marginBottom: '20px',
  },
  button: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: '#fff',
    cursor: 'pointer',
  },
};

export default LoginPage;