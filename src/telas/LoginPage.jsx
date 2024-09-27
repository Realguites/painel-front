import React, { useState, useEffect } from 'react';
import InputField from '../components/InputField';
import Button from '../components/Button';
import AnimatedLogo from '../others/AnimatedLogo';
import config from '../config/config';
import { FaInstagram } from 'react-icons/fa'; // Importa o ícone do Instagram
import { isExpired, decodeToken } from "react-jwt";

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [responseMessage, setResponseMessage] = useState('');

  const { API_BASE_URL } = config;

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if(token != null || typeof token != "undefined"){
      if(!isExpired(token)){
        window.location.href = "/home"
      }
    }

  }, [])

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const userData = decodeToken(data.token)
        localStorage.setItem("jwtToken", JSON.stringify(data.token).slice(1,-1));//remove as asas duplas geradas pelo json na API
        setResponseMessage(`Usuário ${userData?.nomeUsuario} logado com sucesso!`);
        window.location.href = "/home"
      } else if (response.status === 401){
        setResponseMessage(`Error: Usuário ou senha incorretos`);
      }
    } catch (error) {
      setResponseMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <AnimatedLogo />
        <h2 style={styles.title}>Login</h2>
        <InputField
          type="email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
        {responseMessage && (
          <div style={responseMessage.startsWith('Error:') ? styles.errorAlert : styles.successAlert}>
            {responseMessage}
          </div>
        )}
        <div style={styles.instagramLink}>
          <a href="https://www.instagram.com/TaskTime" target="_blank" rel="noopener noreferrer" style={styles.link}>
            <FaInstagram style={styles.icon} />
            <span style={styles.label}>Siga @TaskTime</span>
          </a>
        </div>
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
  instagramLink: {
    marginTop: '20px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    textDecoration: 'none',
    color: '#333',
    justifyContent: 'center', // Adiciona centralização horizontal
  },
  icon: {
    fontSize: '30px',
    marginRight: '5px',
    color: '#C13584', // Cor do ícone do Instagram
  },
  label: {
    fontSize: '16px',
  },
  errorAlert: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
    borderRadius: '5px',
    textAlign: 'center',
  },
  successAlert: {
    marginTop: '20px',
    padding: '10px',
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
    borderRadius: '5px',
    textAlign: 'center',
  },
};

export default LoginPage;
