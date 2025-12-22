import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from '../others/Header';
import config from '../config/config';
import Table from '../components/Table';
import ConfirmModal from '../others/ConfirmModal';
import { FaUserCircle, FaCamera, FaEdit, FaTrash, FaSave, FaTimes, FaUpload } from 'react-icons/fa';

function UserRegistration() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    repetirSenha: '',
    guiche: '',
    tipoUsuario: '',
  });
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [errors, setErrors] = useState({});
  const [userPhoto, setUserPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [photoCache, setPhotoCache] = useState({}); // Cache para fotos
  const { API_BASE_URL } = config;
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userType, setUserType] = useState(null);
  const fileInputRef = useRef(null);

  // Função para buscar foto do usuário com autenticação
  const fetchUserPhoto = async (userId) => {
    const token = localStorage.getItem("jwtToken");
    
    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios/${userId}/foto`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob' // Importante para imagens
      });
      
      // Converte blob para URL
      const imageUrl = URL.createObjectURL(response.data);
      
      // Atualiza cache
      setPhotoCache(prev => ({
        ...prev,
        [userId]: imageUrl
      }));
      
      return imageUrl;
    } catch (error) {
      console.error(`Erro ao buscar foto do usuário ${userId}:`, error);
      return null;
    }
  };

  // Função para buscar foto durante edição
  const fetchPhotoForEdit = async (userId) => {
    const token = localStorage.getItem("jwtToken");
    
    try {
      const response = await axios.get(`${API_BASE_URL}/usuarios/${userId}/foto`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'blob'
      });
      
      const blob = response.data;
      const reader = new FileReader();
      
      return new Promise((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result;
          resolve(base64data);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Erro ao buscar foto para edição:`, error);
      return null;
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'A foto deve ter no máximo 5MB' }));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'Por favor, selecione um arquivo de imagem' }));
        return;
      }
      
      setUserPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, photo: '' }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

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

  // Limpar URLs criadas quando componente desmontar
  useEffect(() => {
    return () => {
      Object.values(photoCache).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [photoCache]);

  const validateFields = () => {
    let newErrors = {};

    if (!formData.nome) newErrors.nome = 'Nome é obrigatório';
    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    // Validação de senha
    if (!isEditing && !formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    }
    
    // Se estiver editando e o usuário digitou uma senha, valida
    if (isEditing && formData.senha) {
      if (formData.senha.length < 6) {
        newErrors.senha = 'A senha deve ter pelo menos 6 caracteres';
      }
      if (formData.senha !== formData.repetirSenha) {
        newErrors.repetirSenha = 'As senhas não coincidem';
      }
    }
    
    // Se não estiver editando (cadastro novo), valida sempre
    if (!isEditing) {
      if (formData.senha.length < 6) {
        newErrors.senha = 'A senha deve ter pelo menos 6 caracteres';
      }
      if (formData.senha !== formData.repetirSenha) {
        newErrors.repetirSenha = 'As senhas não coincidem';
      }
    }
    
    if (!formData.tipoUsuario) newErrors.tipoUsuario = 'Tipo de Usuário é obrigatório';
    if (!formData.guiche) newErrors.guiche = 'Guichê é obrigatório';
    if (userType === 'MANAGER' && !selectedEmpresa) newErrors.empresa = 'Empresa é obrigatória';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFields()) return;

    setIsLoading(true);

    const formDataToSend = new FormData();
    const userData = {
      nome: formData.nome,
      email: formData.email,
      tipoUsuario: formData.tipoUsuario,
      empresa: { idEmpresa: selectedEmpresa },
      guiche: formData.guiche
    };

    // Apenas inclui a senha se foi fornecida
    if (formData.senha) {
      userData.senha = formData.senha;
    }

    formDataToSend.append('usuario', new Blob([JSON.stringify(userData)], { type: 'application/json' }));
    
    if (userPhoto) {
      formDataToSend.append('foto', userPhoto);
    }

    try {
      const token = localStorage.getItem("jwtToken");
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/usuarios/${editUserId}`, formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setIsEditing(false);
        setEditUserId(null);
      } else {
        await axios.post(`${API_BASE_URL}/usuarios`, formDataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      // Limpa cache de fotos após atualização
      setPhotoCache({});
      fetchUsuarios();
      resetForm();
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
      } else if (error.response && error.response.status === 409) {
        setErrors(prev => ({ ...prev, email: 'Este email já está cadastrado' }));
      } else {
        console.error('Erro ao registrar ou editar usuário:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (usuario) => {
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      repetirSenha: '',
      guiche: usuario.guiche || '',
      tipoUsuario: usuario.tipoUsuario,
    });
    
    if (usuario.empresa) {
      setSelectedEmpresa(usuario.empresa.idEmpresa);
    }
    
    // Busca foto para edição
    if (usuario.idUsuario) {
      try {
        const photoData = await fetchPhotoForEdit(usuario.idUsuario);
        if (photoData) {
          setPhotoPreview(photoData);
        } else {
          setPhotoPreview(null);
        }
      } catch (error) {
        console.error('Erro ao carregar foto para edição:', error);
        setPhotoPreview(null);
      }
    } else {
      setPhotoPreview(null);
    }
    
    setUserPhoto(null);
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

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      senha: '',
      repetirSenha: '',
      guiche: '',
      tipoUsuario: '',
    });
    setSelectedEmpresa('');
    setUserPhoto(null);
    setPhotoPreview(null);
    setErrors({});
    setIsEditing(false);
    setEditUserId(null);
  };

  // Componente para renderizar foto na tabela
  const UserPhotoCell = ({ userId, userName }) => {
    const [photoUrl, setPhotoUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      const loadPhoto = async () => {
        // Verifica se já está no cache
        if (photoCache[userId]) {
          setPhotoUrl(photoCache[userId]);
          return;
        }

        setIsLoading(true);
        try {
          const url = await fetchUserPhoto(userId);
          if (url) {
            setPhotoUrl(url);
          } else {
            setHasError(true);
          }
        } catch (error) {
          console.error(`Erro ao carregar foto do usuário ${userId}:`, error);
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      };

      if (userId) {
        loadPhoto();
      }
    }, [userId, photoCache]);

    if (isLoading) {
      return (
        <div style={styles.photoCell}>
          <div style={styles.photoLoading}></div>
        </div>
      );
    }

    if (hasError || !photoUrl) {
      return (
        <div style={styles.photoCell}>
          <FaUserCircle size={32} style={styles.placeholderIcon} />
        </div>
      );
    }

    return (
      <div style={styles.photoCell}>
        <img 
          src={photoUrl} 
          alt={userName}
          style={styles.userPhoto}
          onError={() => {
            setHasError(true);
            // Limpa URL inválida do cache
            if (photoCache[userId]) {
              setPhotoCache(prev => {
                const newCache = { ...prev };
                delete newCache[userId];
                return newCache;
              });
            }
          }}
        />
      </div>
    );
  };

  const userColumns = [
    { 
      header: 'Foto', 
      accessor: 'foto',
      cell: (row) => (
        <UserPhotoCell 
          userId={row.idUsuario} 
          userName={row.nome}
        />
      )
    },
    { header: 'Nome', accessor: 'nome' },
    { header: 'Email', accessor: 'email' },
    { header: 'Tipo', accessor: 'tipoUsuario' },
    { header: 'Guichê', accessor: 'guiche' },
    { 
      header: 'Ações', 
      accessor: 'actions',
      cell: (row) => (
        <div style={styles.actionButtons}>
          <button 
            onClick={() => handleEdit(row)} 
            style={styles.editButton}
            title="Editar"
          >
            <FaEdit />
          </button>
          <button 
            onClick={() => handleDeleteConfirmation(row)} 
            style={styles.deleteButton}
            title="Excluir"
          >
            <FaTrash />
          </button>
        </div>
      )
    },
  ];

  const filteredUsuarios = () => {
    return usuarios;
  };

  return (
    <div style={styles.container}>
      <Header />
      
      <div style={styles.content}>
        <div style={styles.card}>
          <h2 style={styles.header}>
            {isEditing ? '✏️ Editar Usuário' : '👤 Cadastro de Usuário'}
          </h2>
          <p style={styles.subHeader}>
            {isEditing ? 'Atualize os dados do usuário' : 'Preencha os dados abaixo para cadastrar um novo usuário'}
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Foto do Usuário */}
            <div style={styles.photoSection}>
              <div style={styles.photoWrapper}>
                <div 
                  style={styles.photoContainer}
                  onClick={triggerFileInput}
                  title="Clique para alterar a foto"
                >
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      style={styles.photoImage}
                    />
                  ) : (
                    <div style={styles.photoPlaceholder}>
                      <FaCamera size={48} />
                      <span style={styles.photoText}>Adicionar Foto</span>
                    </div>
                  )}
                  <div style={styles.photoOverlay}>
                    <FaUpload size={24} />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              {errors.photo && <span style={styles.errorText}>{errors.photo}</span>}
            </div>

            <div style={styles.formGrid}>
              {/* Empresa (apenas para MANAGER) */}
              {userType === 'MANAGER' && (
                <div style={styles.formGroup}>
                  <label style={styles.label}>Empresa *</label>
                  <select
                    value={selectedEmpresa}
                    onChange={(e) => setSelectedEmpresa(e.target.value)}
                    style={{
                      ...styles.select,
                      borderColor: errors.empresa ? '#ff4444' : '#ddd'
                    }}
                  >
                    <option value="">Selecione a Empresa</option>
                    {empresas.map(empresa => (
                      <option key={empresa.idEmpresa} value={empresa.idEmpresa}>
                        {empresa.cnpj} - {empresa.razaoSocial}
                      </option>
                    ))}
                  </select>
                  {errors.empresa && <span style={styles.errorText}>{errors.empresa}</span>}
                </div>
              )}

              {/* Nome */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Nome Completo *</label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Digite o nome completo"
                  style={{
                    ...styles.input,
                    borderColor: errors.nome ? '#ff4444' : '#ddd'
                  }}
                />
                {errors.nome && <span style={styles.errorText}>{errors.nome}</span>}
              </div>

              {/* Email */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="exemplo@email.com"
                  style={{
                    ...styles.input,
                    borderColor: errors.email ? '#ff4444' : '#ddd'
                  }}
                />
                {errors.email && <span style={styles.errorText}>{errors.email}</span>}
              </div>

              {/* Senha */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Senha {!isEditing ? '*' : ''}</label>
                <input
                  type="password"
                  name="senha"
                  value={formData.senha}
                  onChange={handleInputChange}
                  placeholder={isEditing ? "Deixe em branco para manter a senha atual" : "Digite a senha (mínimo 6 caracteres)"}
                  style={{
                    ...styles.input,
                    borderColor: errors.senha ? '#ff4444' : '#ddd'
                  }}
                />
                {errors.senha && <span style={styles.errorText}>{errors.senha}</span>}
                {isEditing && (
                  <span style={styles.helperText}>Deixe em branco se não quiser alterar a senha</span>
                )}
              </div>

              {/* Confirmar Senha */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirmar Senha {!isEditing ? '*' : ''}</label>
                <input
                  type="password"
                  name="repetirSenha"
                  value={formData.repetirSenha}
                  onChange={handleInputChange}
                  placeholder={isEditing ? "Deixe em branco para manter a senha atual" : "Digite a senha novamente"}
                  style={{
                    ...styles.input,
                    borderColor: errors.repetirSenha ? '#ff4444' : '#ddd'
                  }}
                />
                {errors.repetirSenha && <span style={styles.errorText}>{errors.repetirSenha}</span>}
              </div>

              {/* Tipo de Usuário */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Tipo de Usuário *</label>
                <select
                  name="tipoUsuario"
                  value={formData.tipoUsuario}
                  onChange={handleInputChange}
                  style={{
                    ...styles.select,
                    borderColor: errors.tipoUsuario ? '#ff4444' : '#ddd'
                  }}
                >
                  <option value="">Selecione o tipo</option>
                  <option value="GERENTE">Gerente</option>
                  <option value="FUNCIONARIO">Funcionário</option>
                </select>
                {errors.tipoUsuario && <span style={styles.errorText}>{errors.tipoUsuario}</span>}
              </div>

              {/* Guichê */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Guichê *</label>
                <input
                  type="number"
                  name="guiche"
                  value={formData.guiche}
                  onChange={handleInputChange}
                  placeholder="Número do guichê"
                  style={{
                    ...styles.input,
                    borderColor: errors.guiche ? '#ff4444' : '#ddd'
                  }}
                />
                {errors.guiche && <span style={styles.errorText}>{errors.guiche}</span>}
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={styles.buttonContainer}>
              <button 
                type="submit" 
                style={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span>Processando...</span>
                ) : (
                  <>
                    <FaSave style={{ marginRight: '8px' }} />
                    {isEditing ? 'Atualizar Usuário' : 'Cadastrar Usuário'}
                  </>
                )}
              </button>
              
              {isEditing && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  style={styles.cancelButton}
                >
                  <FaTimes style={{ marginRight: '8px' }} />
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Usuários */}
        <div style={styles.tableCard}>
          <h3 style={styles.tableTitle}>Usuários Cadastrados</h3>
          <div style={styles.tableContainer}>
            <Table 
              data={filteredUsuarios()} 
              columns={userColumns} 
              onEdit={handleEdit} 
              onDelete={handleDeleteConfirmation}
            />
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
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
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '0',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  header: {
    color: '#2c3e50',
    marginBottom: '8px',
    fontSize: '28px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  subHeader: {
    color: '#7f8c8d',
    marginBottom: '30px',
    fontSize: '16px',
  },
  form: {
    width: '100%',
  },
  photoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '30px',
  },
  photoWrapper: {
    position: 'relative',
    cursor: 'pointer',
    '&:hover $photoOverlay': {
      opacity: 1,
    },
  },
  photoContainer: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #3498db',
    backgroundColor: '#ecf0f1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  photoPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#95a5a6',
  },
  photoText: {
    marginTop: '8px',
    fontSize: '14px',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(52, 152, 219, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s',
    color: 'white',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#34495e',
    fontWeight: '500',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
    '&:focus': {
      outline: 'none',
      borderColor: '#3498db',
      boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)',
    },
  },
  select: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.3s',
    boxSizing: 'border-box',
    '&:focus': {
      outline: 'none',
      borderColor: '#3498db',
      boxShadow: '0 0 0 2px rgba(52, 152, 219, 0.2)',
    },
  },
  errorText: {
    color: '#ff4444',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block',
  },
  helperText: {
    color: '#7f8c8d',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block',
    fontStyle: 'italic',
  },
  buttonContainer: {
    display: 'flex',
    gap: '15px',
    marginTop: '20px',
  },
  submitButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s',
    flex: 1,
    '&:hover': {
      backgroundColor: '#2980b9',
    },
    '&:disabled': {
      backgroundColor: '#bdc3c7',
      cursor: 'not-allowed',
    },
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s',
    flex: 1,
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
  tableCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  tableTitle: {
    color: '#2c3e50',
    marginBottom: '20px',
    fontSize: '24px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  photoCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPhoto: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  photoLoading: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#ecf0f1',
    animation: 'pulse 1.5s infinite',
  },
  placeholderIcon: {
    color: '#bdc3c7',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#2980b9',
    },
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s',
    '&:hover': {
      backgroundColor: '#c0392b',
    },
  },
};

// Adicionar animação de loading
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`, styleSheet.cssRules.length);

export default UserRegistration;