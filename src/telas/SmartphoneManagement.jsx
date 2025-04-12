import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMobileAlt, FaSync, FaLock, FaLockOpen, FaTrash } from 'react-icons/fa';
import config from '../config/config';
import Header from '../others/Header';

function SmartphoneManagement() {
  const [smartphones, setSmartphones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { API_BASE_URL } = config;

  // Dados mockados aprimorados
  const mockSmartphones = [
    {
      id: 1,
      nome: 'Samsung Galaxy S23',
      modelo: 'SM-S911B',
      numeroSerie: 'R58T40XYZAB',
      status: 'liberado',
      usuario: 'João Silva',
      departamento: 'TI',
      dataCadastro: '15/03/2023',
      sistemaOperacional: 'Android 13',
      ultimoAcesso: 'Hoje, 09:42'
    },
    {
      id: 2,
      nome: 'iPhone 14 Pro',
      modelo: 'A2890',
      numeroSerie: 'F2GH45XYZCD',
      status: 'bloqueado',
      usuario: 'Maria Souza',
      departamento: 'RH',
      dataCadastro: '22/02/2023',
      sistemaOperacional: 'iOS 16',
      ultimoAcesso: 'Ontem, 15:30'
    },
    {
      id: 3,
      nome: 'Xiaomi Redmi Note 12',
      modelo: '22111317G',
      numeroSerie: 'XMN12345678',
      status: 'liberado',
      usuario: 'Carlos Oliveira',
      departamento: 'Vendas',
      dataCadastro: '10/04/2023',
      sistemaOperacional: 'Android 12',
      ultimoAcesso: 'Hoje, 11:15'
    }
  ];

  useEffect(() => {
    fetchSmartphones();
  }, []);

  const fetchSmartphones = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulação de chamada API
      await new Promise(resolve => setTimeout(resolve, 800));
      setSmartphones(mockSmartphones);
    } catch (err) {
      setError('Erro ao carregar smartphones. Tente novamente.');
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSmartphones(smartphones.map(device => 
        device.id === id ? { ...device, status: newStatus } : device
      ));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este smartphone?')) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSmartphones(smartphones.filter(device => device.id !== id));
    } catch (error) {
      console.error('Erro ao excluir smartphone:', error);
    }
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
          <button 
            onClick={fetchSmartphones}
            style={styles.refreshButton}
            disabled={loading}
          >
            <FaSync style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            {loading ? ' Atualizando...' : ' Atualizar'}
          </button>
        </div>
        
        {/* Status Cards */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{smartphones.length}</div>
            <div style={styles.statLabel}>Dispositivos</div>
          </div>
          <div style={{...styles.statCard, borderLeft: '4px solid #4CAF50'}}>
            <div style={{...styles.statValue, color: '#4CAF50'}}>
              {smartphones.filter(d => d.status === 'liberado').length}
            </div>
            <div style={styles.statLabel}>Liberados</div>
          </div>
          <div style={{...styles.statCard, borderLeft: '4px solid #F44336'}}>
            <div style={{...styles.statValue, color: '#F44336'}}>
              {smartphones.filter(d => d.status === 'bloqueado').length}
            </div>
            <div style={styles.statLabel}>Bloqueados</div>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

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
                    backgroundColor: device.status === 'liberado' ? '#E8F5E9' : '#FFEBEE',
                    color: device.status === 'liberado' ? '#2E7D32' : '#C62828'
                  }}>
                    {device.status === 'liberado' ? (
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
                    <span style={styles.detailValue}>{device.numeroSerie}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Usuário:</span>
                    <span style={styles.detailValue}>{device.usuario}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Departamento:</span>
                    <span style={styles.detailValue}>{device.departamento}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Sistema:</span>
                    <span style={styles.detailValue}>{device.sistemaOperacional}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <span style={styles.detailLabel}>Último Acesso:</span>
                    <span style={styles.detailValue}>{device.ultimoAcesso}</span>
                  </div>
                </div>
                
                <div style={styles.deviceActions}>
                  <button 
                    onClick={() => handleStatusChange(
                      device.id, 
                      device.status === 'liberado' ? 'bloqueado' : 'liberado'
                    )}
                    style={{
                      ...styles.actionButton,
                      backgroundColor: device.status === 'liberado' ? '#F44336' : '#4CAF50',
                    }}
                  >
                    {device.status === 'liberado' ? (
                      <><FaLock /> Bloquear</>
                    ) : (
                      <><FaLockOpen /> Liberar</>
                    )}
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
    '&:hover': {
      backgroundColor: '#1976D2',
    },
    '&:disabled': {
      opacity: '0.7',
      cursor: 'not-allowed',
    },
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
    gap: '8px',
  },
  devicesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px',
  },
  deviceCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
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
    '&:last-child': {
      marginBottom: '0',
    },
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
    '&:hover': {
      opacity: '0.9',
    },
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