import React from 'react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import CheckboxField from '../components/CheckboxField';
import Button from '../components/Button';
import SideMenu from '../components/SideMenu';

function UserRegistration() {
  const handleSubmit = () => {
    // Lógica de submissão
    console.log('Formulário enviado');
  };

  return (
    <div style={styles.container}>
      <SideMenu />
        <div style={{ marginLeft: '50px', padding: '20px' }}>
          {/* Conteúdo da aplicação */}
          <h1>Bem-vindo à aplicação</h1>
          <p>Este é um exemplo de conteúdo.</p>
        </div>
      <h2 style={styles.header}>BATATA</h2>
      <h4 style={styles.subHeader}>INSCREVA-SE PARA CONTINUAR</h4>
      
      <div style={styles.inputGroup}>
        <InputField placeholder="Nome" style={styles.inputHalf} />
        <InputField placeholder="Sobrenome" style={styles.inputHalf} />
      </div>
      
      <InputField type="email" placeholder="Endereço de email" />
      <InputField type="password" placeholder="Senha" />
      
      <CheckboxField 
        id="terms" 
        label="Li e concordo com os" 
        linkText="Termos de uso e a Política de privacidade."
        linkHref="#"
      />
     <div style={styles.inputGroup}>
      <Button label="Inscrever-se" onClick={handleSubmit} />
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
  inputSmall: {
    width: '30%',
  },
};

export default UserRegistration;