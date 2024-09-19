import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputField from '../components/InputField';
import CheckboxField from '../components/CheckboxField';
import Button from '../components/Button';
import Header from '../others/Header';
import { FaEdit, FaTrash } from 'react-icons/fa';

function UserRegistration() {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [users, setUsers] = useState([]); // Estado para armazenar os usuários
  const [isEditing, setIsEditing] = useState(false); // Estado para verificar se está editando
  const [editUserId, setEditUserId] = useState(null); // Armazena o ID do usuário que está sendo editado

  // Função para buscar os usuários da base de dados
  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8080/users'); // Substitua pelo endpoint correto
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  // UseEffect para buscar os dados quando a página carregar
  useEffect(() => {
    fetchUsers();
  }, []);

  // Função para enviar ou atualizar os dados
  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = {
      nome,
      sobrenome,
      email,
      senha,
      aceitaTermos,
    };

    try {
      if (isEditing) {
        // Se estiver editando, fazer PUT
        await axios.put(`http://localhost:8080/users/${editUserId}`, userData); // Substitua pelo endpoint correto
        setIsEditing(false);
        setEditUserId(null);
      } else {
        // Se não, fazer POST
        await axios.post('http://localhost:8080/users', userData); // Substitua pelo endpoint correto
      }
      fetchUsers(); // Atualizar a tabela após o registro/edição
    } catch (error) {
      console.error('Erro ao registrar ou editar usuário:', error);
    }

    // Resetar os campos após o envio
    setNome('');
    setSobrenome('');
    setEmail('');
    setSenha('');
    setAceitaTermos(false);
  };

  // Função para editar usuário
  const handleEdit = (user) => {
    setNome(user.nome);
    setSobrenome(user.sobrenome);
    setEmail(user.email);
    setSenha(user.senha); // Apenas para simular, a senha não seria retornada assim normalmente
    setAceitaTermos(user.aceitaTermos);
    setIsEditing(true);
    setEditUserId(user.id);
  };

  // Função para excluir usuário
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/users/${id}`); // Substitua pelo endpoint correto
      fetchUsers(); // Atualizar a tabela após a exclusão
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  return (
    <div>
      <Header />
      <div style={styles.container}>
        <h2 style={styles.header}>{isEditing ? 'Editar Usuário' : 'Cadastro de Usuário'}</h2>
        <h4 style={styles.subHeader}>Preencha os dados abaixo para {isEditing ? 'editar' : 'cadastrar'}</h4>

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

        <CheckboxField 
          id="terms" 
          label="Li e concordo com os" 
          linkText="Termos de uso e a Política de privacidade."
          linkHref="#"
          checked={aceitaTermos}
          onChange={(e) => setAceitaTermos(e.target.checked)}
        />

        <div style={styles.inputGroup}>
          <Button label={isEditing ? 'Salvar Alterações' : 'Inscrever-se'} onClick={handleSubmit} />
        </div>

        {/* Tabela para exibir os usuários */}
        {users.length > 0 && (
          <>
            <h3 style={styles.tableHeader}>Usuários Registrados</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Sobrenome</th>
                  <th>Email</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.nome}</td>
                    <td>{user.sobrenome}</td>
                    <td>{user.email}</td>
                    <td>
                      <FaEdit 
                        onClick={() => handleEdit(user)} 
                        style={styles.icon} 
                        title="Editar" 
                      />
                      <FaTrash 
                        onClick={() => handleDelete(user.id)} 
                        style={styles.icon} 
                        title="Excluir" 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
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
  tableHeader: {
    marginTop: '30px',
    marginBottom: '10px',
    fontSize: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '8px',
    backgroundColor: '#f2f2f2',
    borderBottom: '1px solid #ddd',
  },
  td: {
    textAlign: 'left',
    padding: '8px',
    borderBottom: '1px solid #ddd',
  },
  icon: {
    cursor: 'pointer',
    marginRight: '10px',
  },
};

export default UserRegistration;
