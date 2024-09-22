import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputField from '../components/InputField';
import Button from '../components/Button';
import Header from '../others/Header';
import { FaEdit, FaTrash } from 'react-icons/fa';
import config from '../config/config';
import { decodeToken } from "react-jwt";


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
  const [credentials, setCredentials] = useState(null);
  const { API_BASE_URL } = config;

  const fetchEmpresas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/empresa`, credentials);
      setEmpresas(response.data);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token === null || typeof token === "undefined") {
      window.location.href = "/login"
    }
    setCredentials(`Àuthorization: Bearer${token}`)

  }, [])

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/empresa/${editEmpresaId}`, empresaData, credentials);
        setIsEditing(false);
        setEditEmpresaId(null);
      } else {
        await axios.post(`${API_BASE_URL}/empresa`, empresaData, credentials);
      }
      fetchEmpresas();
    } catch (error) {
      console.error('Erro ao registrar ou editar empresa:', error);
    }

    setCnpj('');
    setNomeFantasia('');
    setRazaoSocial('');
    setDdd('');
    setTelefone('');
    setNomeContato('');
    setTipoJuridico('');
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
    setEditEmpresaId(empresa.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/empresa/${id}`, credentials);
      fetchEmpresas();
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
    }
  };

  return (
    <div>
      <Header />
      <div style={styles.container}>
        <h2 style={styles.header}>{isEditing ? 'Editar Empresa' : 'Cadastro de Empresa'}</h2>
        <h4 style={styles.subHeader}>Preencha os dados abaixo para {isEditing ? 'editar' : 'cadastrar'}</h4>

        <div style={styles.inputGroup}>
          <InputField 
            value={cnpj} 
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="CNPJ" 
            style={{ ...styles.inputField, width: '60%' }} // CNPJ com largura maior
          />
          
          <InputField 
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
            placeholder="Nome Fantasia" 
            style={{ ...styles.inputField, width: '38%' }} // Nome Fantasia com largura menor
          />
        </div>

        <div style={styles.inputGroup}>
          <InputField 
            value={razaoSocial} 
            onChange={(e) => setRazaoSocial(e.target.value)}
            placeholder="Razão Social" 
            style={{ ...styles.inputField, width: '70%' }} // Razão Social com largura maior
          />
          <InputField 
            value={ddd}
            onChange={(e) => setDdd(e.target.value)}
            placeholder="DDD" 
            style={{ ...styles.inputField, width: '28%' }} // DDD com largura menor
          />
        </div>

        <div style={styles.inputGroup}>
          <InputField 
            value={telefone} 
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone" 
            style={{ ...styles.inputField, width: '48%' }} // Telefone com largura intermediária
          />
          <InputField 
            value={nomeContato}
            onChange={(e) => setNomeContato(e.target.value)}
            placeholder="Nome do Contato" 
            style={{ ...styles.inputField, width: '48%' }} // Nome do Contato com largura igual
          />
        </div>

        <div style={styles.inputGroup}>
          <select
            value={tipoJuridico}
            onChange={(e) => setTipoJuridico(e.target.value)}
            style={{ ...styles.inputField, width: '100%' }} // Select de tipo jurídico com largura cheia
          >
            <option value="">Selecione o Tipo Jurídico</option>
            <option value="SA">Sociedade Anônima (SA)</option>
            <option value="LTDA">Sociedade Limitada (LTDA)</option>
            <option value="EIRELI">Empresa Individual de Responsabilidade Limitada (EIRELI)</option>
            <option value="MEI">Microempreendedor Individual (MEI)</option>
            <option value="OUTROS">Outros</option>
          </select>
        </div>

        <div style={styles.inputGroup}>
          <Button label={isEditing ? 'Salvar Alterações' : 'Cadastrar Empresa'} onClick={handleSubmit} />
        </div>

        {empresas.length > 0 && (
          <>
            <h3 style={styles.tableHeader}>Empresas Registradas</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>CNPJ</th>
                  <th>Nome Fantasia</th>
                  <th>Razão Social</th>
                  <th>Telefone</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((empresa) => (
                  <tr key={empresa.id}>
                    <td>{empresa.cnpj}</td>
                    <td>{empresa.nomeFantasia}</td>
                    <td>{empresa.razaoSocial}</td>
                    <td>{empresa.telefone}</td>
                    <td>
                      <FaEdit 
                        onClick={() => handleEdit(empresa)} 
                        style={styles.icon} 
                        title="Editar" 
                      />
                      <FaTrash 
                        onClick={() => handleDelete(empresa.id)} 
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
  inputField: {
    padding: '8px',
    fontSize: '14px',
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

export default EmpresaRegistration;
