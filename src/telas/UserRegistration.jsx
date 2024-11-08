import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputField from '../components/InputField';
import Header from '../others/Header';
import config from '../config/config';
import Table from '../components/Table';
import ConfirmModal from '../others/ConfirmModal';

function UserRegistration() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [repetirSenha, setRepetirSenha] = useState('');
  const [guiche, setGuiche] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [errors, setErrors] = useState({});
  const { API_BASE_URL } = config;
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userType, setUserType] = useState(null);

  const handleDeleteConfirmation = (data) => {
    setUserToDelete(data);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (userToDelete) {
      await handleDelete(userToDelete);
      setIsConfirmModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleUnauthorized = () => {
    window.location.href = "/login";
  };

  const fetchUsuarios = async () => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUsuarios(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
      } else {
        console.error('Erro ao buscar usuários:', error);
      }
    }
  };

  const fetchEmpresas = async () => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/empresas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEmpresas(response.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
      } else {
        console.error('Erro ao buscar empresas:', error);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      handleUnauthorized();
    } else {
      const decodedToken = JSON.parse(atob(token.split('.')[1]));
      setUserType(decodedToken.tipoUsuario);
      fetchUsuarios();
      fetchEmpresas();
    }
  }, []);

  const validateFields = () => {
    let errors = {};

    if (!nome) errors.nome = 'Nome é obrigatório';
    if (!email) errors.email = 'Email é obrigatório';
    if (!senha) errors.senha = 'Senha é obrigatória';
    if (senha !== repetirSenha) errors.repetirSenha = 'As senhas não coincidem';
    if (!tipoUsuario) errors.tipoUsuario = 'Tipo de Usuário é obrigatório';
    if (!guiche) errors.guiche = 'Guichê é obrigatório';

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFields()) return;

    const userData = {
      nome,
      email,
      senha,
      tipoUsuario,
      empresa:{ idEmpresa: selectedEmpresa},
      guiche
    };

    try {
      const token = localStorage.getItem("jwtToken");
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/usuarios/${editUserId}`, userData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setIsEditing(false);
        setEditUserId(null);
      } else {
        await axios.post(`${API_BASE_URL}/usuarios`, userData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      fetchUsuarios();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
      } else {
        console.error('Erro ao registrar ou editar usuário:', error);
      }
    }

    // Limpa os campos após o envio
    setNome('');
    setEmail('');
    setSenha('');
    setRepetirSenha('');
    setTipoUsuario('');
    setSelectedEmpresa('');
    setGuiche('');
    setErrors({});
  };

  const handleEdit = (usuario) => {
    setNome(usuario.nome);
    setEmail(usuario.email);
    setSenha(usuario.senha);
    setRepetirSenha(usuario.senha); // Preenche o campo de repetir senha com a senha atual
    setTipoUsuario(usuario.tipoUsuario);
    setGuiche(usuario.guiche)
    setIsEditing(true);
    setEditUserId(usuario.idUsuario);
  };

  const handleDelete = async (data) => {
    try {
      const token = localStorage.getItem("jwtToken");
      await axios.delete(`${API_BASE_URL}/usuarios/${data.idUsuario}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchUsuarios();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
      } else {
        console.error('Erro ao excluir usuário:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditUserId(null);
    setNome('');
    setEmail('');
    setSenha('');
    setRepetirSenha('');
    setTipoUsuario('');
    setSelectedEmpresa('');
    setGuiche('');
    setErrors({});
  };

  const userColumns = [
    { header: 'Id', accessor: 'idUsuario' },
    { header: 'Nome', accessor: 'nome' },
    { header: 'Email', accessor: 'email' },
    { header: 'Tipo de Usuário', accessor: 'tipoUsuario' },
    { header: 'Guichê', accessor: 'guiche' },

  ];

  const filteredUsuarios = () => {
    return usuarios;
  };

  return (
    <div style={styles.container}>
      <Header />
      <h2 style={styles.header}>{isEditing ? 'Editar Usuário' : 'Cadastro de Usuário'}</h2>
      <h4 style={styles.subHeader}>Preencha os dados abaixo para {isEditing ? 'editar' : 'cadastrar'}</h4>

      {userType === 'MANAGER' && (
        <div style={styles.fieldContainer}>
          <select
            value={selectedEmpresa}
            onChange={(e) => setSelectedEmpresa(e.target.value)}
            style={{ ...styles.inputField, borderColor: errors.empresa ? 'red' : '#ccc', flex: '1' }}
          >
            <option value="">Selecione a Empresa</option>
            {empresas.map(empresa => (
              <option key={empresa.idEmpresa} value={empresa.idEmpresa}>{empresa.cnpj} - {empresa.razaoSocial}</option>
            ))}
          </select>
          {errors.empresa && <span style={styles.errorText}>{errors.empresa}</span>}
        </div>
      )}

      <div style={styles.inputGroup}>
        <InputField
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome"
          style={{ ...styles.inputField, borderColor: errors.nome ? 'red' : '#ccc', flex: '2' }} // Mais largo
        />
        {errors.nome && <span style={styles.errorText}>{errors.nome}</span>}
      </div>

      <div style={styles.inputGroup}>
        <InputField
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          style={{ ...styles.inputField, borderColor: errors.email ? 'red' : '#ccc', flex: '2' }} // Mais largo
        />
        {errors.email && <span style={styles.errorText}>{errors.email}</span>}
      </div>

      <div style={styles.inputGroup}>
        <InputField
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          style={{ ...styles.inputField, borderColor: errors.senha ? 'red' : '#ccc', flex: '1' }} // Mais estreito
        />
        {errors.senha && <span style={styles.errorText}>{errors.senha}</span>}
      </div>

      <div style={styles.inputGroup}>
        <InputField
          type="password"
          value={repetirSenha}
          onChange={(e) => setRepetirSenha(e.target.value)}
          placeholder="Repetir Senha"
          style={{ ...styles.inputField, borderColor: errors.repetirSenha ? 'red' : '#ccc', flex: '1' }} // Mais estreito
        />
        {errors.repetirSenha && <span style={styles.errorText}>{errors.repetirSenha}</span>}
      </div>

      <div style={styles.inputGroup}>
        <select
          value={tipoUsuario}
          onChange={(e) => setTipoUsuario(e.target.value)}
          style={{ ...styles.inputField, borderColor: errors.tipoUsuario ? 'red' : '#ccc', flex: '1' }} // Mais estreito
        >
          <option value="">Selecione o Tipo de Usuário</option>
          <option value="GERENTE">Gerente</option>
          <option value="FUNCIONARIO">Funcionário</option>
        </select>
        {errors.tipoUsuario && <span style={styles.errorText}>{errors.tipoUsuario}</span>}
      </div>

      <div style={styles.inputGroup}>
        <InputField
          type="number"
          value={guiche}
          onChange={(e) => setGuiche(e.target.value)}
          placeholder="Guichê"
          style={{ ...styles.inputField, borderColor: errors.guiche ? 'red' : '#ccc', flex: '1' }} // Mais estreito
        />
        {errors.guiche && <span style={styles.errorText}>{errors.guiche}</span>}
      </div>

      <div style={styles.buttonContainer}>
          <button style={{ ...styles.button, backgroundColor: isEditing ? '#add8e6' : '#4CAF50'}} onClick={handleSubmit}>
            {isEditing ? 'Atualizar Usuário' : 'Salvar'}
          </button>
          {isEditing && (
            <button style={{ ...styles.button, backgroundColor: 'red', marginLeft: '10px' }} onClick={handleCancelEdit}>
              Cancelar Edição
            </button>
          )}
        </div>

      <Table data={filteredUsuarios()} columns={userColumns} onEdit={handleEdit} onDelete={handleDeleteConfirmation} />
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsConfirmModalOpen(false)}
        message={`Tem certeza que deseja excluir o usuário ${userToDelete ? userToDelete.nome : ''}?`}
      />
    </div>
  );
}

const styles = {
  container: {
    padding: '20px',
    width: '80%',
    margin: 'auto',
  },
  header: {
    color: '#333',
  },
  subHeader: {
    color: '#666',
  },
  inputGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    marginBottom: '5px',
  },
  fieldContainer: {
    flex: '1 1 calc(100% - 15px)', // Ocupa a largura total
    marginRight: '10px',
    marginBottom: '15px',
  },
  inputField: {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    width: '100%', // Garante que o campo ocupe a largura total
    minWidth: '200px', // Largura mínima para campos estreitos
  },
  errorText: {
    color: 'red',
    fontSize: '12px',
    marginTop: '5px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '20px',
  },
  button: {
    width: '50%',
    padding: '10px',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

export default UserRegistration;

