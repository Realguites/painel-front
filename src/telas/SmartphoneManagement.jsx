import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMobileAlt, FaSync, FaLock, FaLockOpen, FaTrash, FaPlus } from 'react-icons/fa';
import config from '../config/config';
import Header from '../others/Header';

function SmartphoneManagement() {
  const [smartphones, setSmartphones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSmartphone, setEditingSmartphone] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    modelo: '',
    nrIdentificacao: '',
    versao: ''
  });
  const { API_BASE_URL } = config;

  useEffect(() => {
    fetchSmartphones();
  }, []);

  const fetchSmartphones = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/smartphones/empresa`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSmartphones(response.data);
    } catch (err) {
      setError('Erro ao carregar smartphones. Tente novamente.');
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    const token = localStorage.getItem("jwtToken");
    const newStatus = !currentStatus;

    try {
      const response = await axios.put(`${API_BASE_URL}/smartphones/${id}`, {
        ativo: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        setSmartphones(smartphones.map(device => 
          device.id === id ? { ...device, ativo: newStatus } : device
        ));
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setError('Erro ao atualizar status do smartphone.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este smartphone?')) return;
    
    const token = localStorage.getItem("jwtToken");
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/smartphones/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 204) {
        setSmartphones(smartphones.filter(device => device.id !== id));
      }
    } catch (error) {
      console.error('Erro ao excluir smartphone:', error);
      setError('Erro ao excluir smartphone.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");

    try {
      if (editingSmartphone) {
        // Atualizar smartphone existente
        const response = await axios.put(
          `${API_BASE_URL}/smartphones/${editingSmartphone.id}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.status === 200) {
          setSmartphones(smartphones.map(device => 
            device.id === editingSmartphone.id ? response.data : device
          ));
          setShowModal(false);
          resetForm();
        }
      } else {
        // Criar novo smartphone
        const response = await axios.post(
          `${API_BASE_URL}/smartphones`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.status === 201 || response.status === 200) {
          setSmartphones([...smartphones, response.data]);
          setShowModal(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Erro ao salvar smartphone:', error);
      if (error.response?.status === 409) {
        setError('Este smartphone já está cadastrado mas está bloqueado.');
      } else {
        setError('Erro ao salvar smartphone. Verifique os dados e tente novamente.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      modelo: '',
      nrIdentificacao: '',
      versao: ''
    });
    setEditingSmartphone(null);
  };

  const openModal = (smartphone = null) => {
    if (smartphone) {
      setEditingSmartphone(smartphone);
      setFormData({
        nome: smartphone.nome || '',
        modelo: smartphone.modelo || '',
        nrIdentificacao: smartphone.nrIdentificacao || '',
        versao: smartphone.versao || ''
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  };

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content}>
        <div style={styles.header}>
          <div style={styles.titleContainer}>
            <FaMobileAlt style={styles.titleIcon} />
            <h1 style={styles.title}>Gerenciamento de Smartphones</h1>
          </div>
          <div style={styles.headerButtons}>
            <button 
              onClick={() => openModal()}
              style={styles.addButton}
            >
              <FaPlus /> Adicionar Smartphone
            </button>
            <button 
              onClick={fetchSmartphones}
              style={styles.refreshButton}
              disabled={loading}
            >
              <FaSync style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              {loading ? ' Atualizando...' : ' Atualizar'}
            </button>
          </div>
        </div>
        
        {/* Status Cards */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{smartphones.length}</div>
            <div style={styles.statLabel}>Total de Dispositivos</div>
          </div>
          <div style={{...styles.statCard, borderLeft: '4px solid #4CAF50'}}>
            <div style={{...styles.statValue, color: '#4CAF50'}}>
              {smartphones.filter(d => d.ativo).length}
            </div>
            <div style={styles.statLabel}>Liberados</div>
          </div>
          <div style={{...styles.statCard, borderLeft: '4px solid #F44336'}}>
            <div style={{...styles.statValue, color: '#F44336'}}>
              {smartphones.filter(d => !d.ativo).length}
            </div>
            <div style={styles.statLabel}>Bloqueados</div>
          </div>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
            <button onClick={() => setError(null)} style={styles.closeError}>×</button>
          </div>
        )}

        {/* Lista de Smartphones */}
        <div style={styles.devicesContainer}>
          {smartphones.length > 0 ? (
            smartphones.map((device) => (
              <div key={device.id} style={styles.deviceCard}>
                <div style={styles.deviceHeader}>
                  <FaMobileAlt style={styles.deviceIcon} />
                  <div style={styles.deviceTitle}>
                    <h3 style={styles.deviceName}>{device.nome}</h3>
                    <span style={styles.deviceModel}>{device.modelo}</span>
                  </div>
                  <span style={{
                    ...styles.deviceStatus,
                    backgroundColor: device.ativo ? '#E8F5E9' : '#FFEBEE',
                    color: device.ativo ? '#2E7D32' : '#C62828'
                  }}>
                    {device.ativo ? (
                      <>
                        <FaLockOpen style={{marginRight: '5px'}} />
                        Liberado
                      </>
                    ) : (
                      <>
                        <FaLock style={{marginRight: '5px'}} />
                        Bloqueado
                      </>
                    )}
                  </span>
                </div>
                
                <div style={styles.deviceDetails}>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Nº Série:</span>
                    <span style={styles.detailValue}>{device.nrIdentificacao}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Sistema:</span>
                    <span style={styles.detailValue}>{device.versao}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Data Cadastro:</span>
                    <span style={styles.detailValue}>{formatDate(device.dataCadastro)}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Último Acesso:</span>
                    <span style={styles.detailValue}>{formatDate(device.ultimoAcesso)}</span>
                  </div>
                </div>
                
                <div style={styles.deviceActions}>
                  <button 
                    onClick={() => handleStatusChange(device.idSmartphone, device.ativo)}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: device.ativo ? '#F44336' : '#4CAF50',
                    }}
                  >
                    {device.ativo ? (
                      <><FaLock /> Bloquear</>
                    ) : (
                      <><FaLockOpen /> Liberar</>
                    )}
                  </button>
                  <button 
                    onClick={() => openModal(device)}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#2196F3',
                    }}
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(device.id)}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: '#757575',
                    }}
                  >
                    <FaTrash /> Excluir
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={styles.noDevices}>
              {loading ? 'Carregando dispositivos...' : 'Nenhum smartphone cadastrado'}
            </div>
          )}
        </div>

        {/* Modal para Adicionar/Editar */}
        {showModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h2>{editingSmartphone ? 'Editar Smartphone' : 'Adicionar Smartphone'}</h2>
                <button onClick={() => setShowModal(false)} style={styles.closeButton}>×</button>
              </div>
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nome:</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Modelo:</label>
                  <input
                    type="text"
                    value={formData.modelo}
                    onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Número de Série:</label>
                  <input
                    type="text"
                    value={formData.nrIdentificacao}
                    onChange={(e) => setFormData({...formData, nrIdentificacao: e.target.value})}
                    style={styles.input}
                    required
                    disabled={!!editingSmartphone}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Versão do Sistema:</label>
                  <input
                    type="text"
                    value={formData.versao}
                    onChange={(e) => setFormData({...formData, versao: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.modalActions}>
                  <button type="button" onClick={() => setShowModal(false)} style={styles.cancelButton}>
                    Cancelar
                  </button>
                  <button type="submit" style={styles.saveButton}>
                    {editingSmartphone ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    color: '#333',
  },
  content: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  titleIcon: {
    fontSize: '28px',
    color: '#2196F3',
  },
  title: {
    fontSize: '24px',
    margin: '0',
    color: '#333',
    fontWeight: '600',
  },
  headerButtons: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  addButton: {
    padding: '10px 16px',
    fontSize: '14px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  refreshButton: {
    padding: '10px 16px',
    fontSize: '14px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
  },
  statsContainer: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  statCard: {
    flex: '1',
    minWidth: '150px',
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderLeft: '4px solid #2196F3',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
  },
  error: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeError: {
    background: 'none',
    border: 'none',
    color: '#C62828',
    fontSize: '18px',
    cursor: 'pointer',
  },
  devicesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '20px',
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  },
  deviceHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#f9f9f9',
  },
  deviceIcon: {
    fontSize: '24px',
    color: '#2196F3',
    marginRight: '12px',
  },
  deviceTitle: {
    flex: '1',
  },
  deviceName: {
    fontSize: '16px',
    margin: '0 0 4px 0',
    fontWeight: '600',
  },
  deviceModel: {
    fontSize: '13px',
    color: '#666',
  },
  deviceStatus: {
    padding: '6px 10px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
  },
  deviceDetails: {
    padding: '16px',
  },
  detailRow: {
    display: 'flex',
    marginBottom: '12px',
  },
  detailLabel: {
    flex: '0 0 120px',
    fontSize: '13px',
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    flex: '1',
    fontSize: '14px',
    fontWeight: '500',
  },
  deviceActions: {
    display: 'flex',
    padding: '12px 16px',
    borderTop: '1px solid #eee',
    backgroundColor: '#f9f9f9',
    gap: '8px',
  },
  actionButton: {
    flex: '1',
    padding: '10px',
    fontSize: '13px',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.3s ease',
  },
  noDevices: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '0',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #eee',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
  },
  form: {
    padding: '20px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#757575',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

// Adicionando a animação de rotação
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default SmartphoneManagement;