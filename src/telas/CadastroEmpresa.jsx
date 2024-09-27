import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputField from '../components/InputField';
import InputMask from 'react-input-mask';
import Header from '../others/Header';
import config from '../config/config';
import Table from '../components/Table';
import ConfirmModal from '../others/ConfirmModal';

function EmpresaRegistration() {
  const [cnpj, setCnpj] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [ddd, setDdd] = useState('');
  const [telefone, setTelefone] = useState('');
  const [nomeContato, setNomeContato] = useState('');
  const [tipoJuridico, setTipoJuridico] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editEmpresaId, setEditEmpresaId] = useState(null);
  const [errors, setErrors] = useState({});
  const { API_BASE_URL } = config;
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [empresaToDelete, setEmpresaToDelete] = useState(null);

  const handleDeleteConfirmation = (data) => {
    setEmpresaToDelete(data);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (empresaToDelete) {
      await handleDelete(empresaToDelete);
      setIsConfirmModalOpen(false);
      setEmpresaToDelete(null);
    }
  };

  const handleUnauthorized = () => {
    window.location.href = "/login";
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
      fetchEmpresas();
    }
  }, []);

  const validateFields = () => {
    let errors = {};

    if (!cnpj) errors.cnpj = 'CNPJ é obrigatório';
    if (!nomeFantasia) errors.nomeFantasia = 'Nome Fantasia é obrigatório';
    if (!razaoSocial) errors.razaoSocial = 'Razão Social é obrigatória';
    if (!ddd) errors.ddd = 'DDD é obrigatório';
    if (!telefone) errors.telefone = 'Telefone é obrigatório';
    if (!nomeContato) errors.nomeContato = 'Nome do Contato é obrigatório';
    if (!tipoJuridico) errors.tipoJuridico = 'Tipo Jurídico é obrigatório';

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFields()) return;

    const empresaData = {
      cnpj,
      nomeFantasia,
      razaoSocial,
      ddd,
      telefone,
      nomeContato,
      tipoJuridico,
    };

    try {
      const token = localStorage.getItem("jwtToken");
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/empresas/${editEmpresaId}`, empresaData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setIsEditing(false);
        setEditEmpresaId(null);
      } else {
        await axios.post(`${API_BASE_URL}/empresas`, empresaData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      fetchEmpresas();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
      } else {
        console.error('Erro ao registrar ou editar empresa:', error);
      }
    }

    setCnpj('');
    setNomeFantasia('');
    setRazaoSocial('');
    setDdd('');
    setTelefone('');
    setNomeContato('');
    setTipoJuridico('');
    setErrors({});
  };

  const handleEdit = (empresa) => {
    setCnpj(empresa.cnpj);
    setNomeFantasia(empresa.nomeFantasia);
    setRazaoSocial(empresa.razaoSocial);
    setDdd(empresa.ddd);
    setTelefone(empresa.telefone);
    setNomeContato(empresa.nomeContato);
    setTipoJuridico(empresa.tipoJuridico);
    setIsEditing(true);
    setEditEmpresaId(empresa.idEmpresa);
  };

  const handleDelete = async (data) => {
    try {
      const token = localStorage.getItem("jwtToken");
      await axios.delete(`${API_BASE_URL}/empresas/${data.idEmpresa}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchEmpresas();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
      } else {
        console.error('Erro ao excluir empresa:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditEmpresaId(null);
    setCnpj('');
    setNomeFantasia('');
    setRazaoSocial('');
    setDdd('');
    setTelefone('');
    setNomeContato('');
    setTipoJuridico('');
    setErrors({});
  };

  const companiesColumns = [
    { header: 'Id', accessor: 'idEmpresa' },
    { header: 'Nome Empresa', accessor: 'nomeFantasia' },
    { header: 'CNPJ', accessor: 'cnpj' },
    { header: 'DDD', accessor: 'ddd' },
    { header: 'Telefone', accessor: 'telefone' },
    { header: 'Nome Contato', accessor: 'nomeContato' },
  ];

  return (
    <div>
      <Header />
      <div style={styles.container}>
        <h2 style={styles.header}>{isEditing ? 'Editar Empresa' : 'Cadastro de Empresa'}</h2>
        <h4 style={styles.subHeader}>Preencha os dados abaixo para {isEditing ? 'editar' : 'cadastrar'}</h4>

        <div style={styles.inputGroup}>
          <div style={styles.fieldContainerCnpj}>
            <InputMask
              mask="99.999.999/9999-99"
              value={cnpj}
              onChange={(e) =>{
                setCnpj(e.target.value)
              }}
            >
              {(inputProps) => (
                <input
                  {...inputProps}
                  type="text"
                  placeholder="Digite o CNPJ"
                  style={{ ...styles.inputField, borderColor: errors.nomeFantasia ? 'red' : '#ccc'}}
                />
              )}
            </InputMask>
            {errors.cnpj && <span style={styles.errorText}>{errors.cnpj}</span>}
          </div>

          <div style={styles.fieldContainer}>
            <InputField
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
              placeholder="Nome Fantasia"
              style={{ ...styles.inputField, borderColor: errors.nomeFantasia ? 'red' : '#ccc' }}
            />
            {errors.nomeFantasia && <span style={styles.errorText}>{errors.nomeFantasia}</span>}
          </div>
        </div>

        <div style={styles.inputGroup}>
          <div style={styles.fieldContainer}>
            <InputField
              value={razaoSocial}
              onChange={(e) => setRazaoSocial(e.target.value)}
              placeholder="Razão Social"
              style={{ ...styles.inputField, borderColor: errors.razaoSocial ? 'red' : '#ccc' }}
            />
            {errors.razaoSocial && <span style={styles.errorText}>{errors.razaoSocial}</span>}
          </div>

          <div style={styles.fieldContainer}>
            <InputField
              value={ddd}
              onChange={(e) => {
                const value = e.target.value;
            
                // Verifica se o valor é um número e tem no máximo 3 dígitos
                if (/^\d{0,3}$/.test(value)) {
                  setDdd(value);
                }
              }}
              placeholder="DDD"
              style={{ ...styles.inputField, borderColor: errors.ddd ? 'red' : '#ccc' }}
            />
            {errors.ddd && <span style={styles.errorText}>{errors.ddd}</span>}
          </div>

          <div style={styles.fieldContainer}>
            <InputField
              value={telefone}
              onChange={(e) => {
                const value = e.target.value;
            
                // Verifica se o valor é um número e tem no máximo 3 dígitos
                if (/^\d{0,9}$/.test(value)) {
                  setTelefone(value);
                }             
              }}
              placeholder="Telefone"
              style={{ ...styles.inputField, borderColor: errors.telefone ? 'red' : '#ccc' }}
            />
            {errors.telefone && <span style={styles.errorText}>{errors.telefone}</span>}
          </div>
        </div>

        <div style={styles.inputGroup}>
          <div style={styles.fieldContainer}>
            <InputField
              value={nomeContato}
              onChange={(e) => setNomeContato(e.target.value)}
              placeholder="Nome do Contato"
              style={{ ...styles.inputField, borderColor: errors.nomeContato ? 'red' : '#ccc' }}
            />
            {errors.nomeContato && <span style={styles.errorText}>{errors.nomeContato}</span>}
          </div>

          <div style={styles.fieldContainer}>
            <select
              value={tipoJuridico}
              onChange={(e) => setTipoJuridico(e.target.value)}
              style={{ ...styles.inputField, borderColor: errors.tipoJuridico ? 'red' : '#ccc' }}
            >
              <option value="">Selecione o Tipo Jurídico</option>
              <option value="SA">Sociedade Anônima (SA)</option>
              <option value="LTDA">Sociedade Limitada (LTDA)</option>
              <option value="EIRELI">Empresa Individual de Responsabilidade Limitada (EIRELI)</option>
              <option value="MEI">Microempreendedor Individual (MEI)</option>
              <option value="OUTROS">Outros</option>
            </select>
            {errors.tipoJuridico && <span style={styles.errorText}>{errors.tipoJuridico}</span>}
          </div>
        </div>

        <div style={styles.buttonContainer}>
          <button style={{ ...styles.button, backgroundColor: isEditing ? '#add8e6' : '#4CAF50'}} onClick={handleSubmit}>
            {isEditing ? 'Atualizar Empresa' : 'Salvar'}
          </button>
          {isEditing && (
            <button style={{ ...styles.button, backgroundColor: 'red', marginLeft: '10px' }} onClick={handleCancelEdit}>
              Cancelar Edição
            </button>
          )}
        </div>
        <h2 style={styles.header}>Empresas Cadastradas</h2>
        <Table columns={companiesColumns} data={empresas} onEdit={handleEdit} onDelete={handleDeleteConfirmation} />

        <ConfirmModal
          isOpen={isConfirmModalOpen}
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsConfirmModalOpen(false)}
          message={`Tem certeza que deseja excluir a empresa ${empresaToDelete?.nomeFantasia}?`}
        />
      
      </div>
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
    flex: '1 1 calc(33% - 15px)', // Ajuste conforme necessário para largura
    marginRight: '10px',
    marginBottom: '15px',
  },
  fieldContainerCnpj: {
    flex: '1 1 calc(33% - 15px)', // Ajuste conforme necessário para largura
    marginRight: '30px',
    marginBottom: '15px',
  },
  inputField: {
    padding: '10px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    width: '100%', // Garante que o campo ocupe a largura total
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

export default EmpresaRegistration;
