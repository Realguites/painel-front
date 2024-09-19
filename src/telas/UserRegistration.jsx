import React, { useState } from 'react';
import axios from 'axios';
import InputField from '../components/InputField';
import CheckboxField from '../components/CheckboxField';
import Button from '../components/Button';
import Header from '../others/Header';


function UserRegistration() {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitaTermos, setAceitaTermos] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const postData = {
      nome,
      sobrenome,
      email,
      senha,
      aceitaTermos,
    };

    try {
      const response = await axios.post('http://localhost:8080/', postData);
      console.log('Usuário registrado:', response.data);
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
    }

    // Resetar os campos após o envio, se necessário
    setNome('');
    setSobrenome('');
    setEmail('');
    setSenha('');
    setAceitaTermos(false);
  };
  

  return (
    <div>
       <Header/>
      <div style={styles.container}>

        
        <div style={{ marginLeft: '1x', padding: '1px' }}>
          <h1>Cadastro de usuários</h1>
        </div>
        <div style={styles.inputGroup}>
          <InputField 
            value={nome} 
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome" 
            style={styles.inputHalf} 
          />
          <InputField 
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
            placeholder="Sobrenome" 
            style={styles.inputHalf} 
          />
        </div>

        <InputField 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          type="email" 
          placeholder="Endereço de email" 
        />
        <InputField 
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          type="password" 
          placeholder="Senha" 
        />
        <div style={styles.inputGroup}>
          <Button label="Inscrever-se" onClick={handleSubmit} />
        </div>
      </div>
      
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    fontSize: '24px',
    marginBottom: '10px',
  },
  subHeader: {
    fontSize: '16px',
    marginBottom: '20px',
  },
  inputGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  inputHalf: {
    width: '48%',
  },
};

export default UserRegistration;
