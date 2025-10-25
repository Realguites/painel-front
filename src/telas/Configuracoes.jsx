import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSave, FaMusic, FaImage, FaVideo, FaPlay, FaStop } from 'react-icons/fa';
import config from '../config/config';
import Header from '../others/Header';

function ConfiguracoesPainel() {
  const [configuracoes, setConfiguracoes] = useState({
    sons: {
      chamadaFicha: '',
      chamadaPrioritaria: '',
      background: ''
    },
    midias: [],
    volume: 80
  });
  const [novoSom, setNovoSom] = useState({ nome: '', arquivo: null });
  const [novaMidia, setNovaMidia] = useState({ url: '', tipo: 'imagem' });
  const [audioTest, setAudioTest] = useState(null);

  const { API_BASE_URL } = config;

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    const token = localStorage.getItem("jwtToken");
    try {
      const response = await axios.get(`${API_BASE_URL}/configuracoes/painel`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setConfiguracoes(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Configurações padrão
      setConfiguracoes({
        sons: {
          chamadaFicha: '/sons/chamada-normal.mp3',
          chamadaPrioritaria: '/sons/chamada-prioritaria.mp3',
          background: '/sons/background.mp3'
        },
        midias: [
          { url: 'https://i.pinimg.com/originals/06/ec/d0/06ecd0afe6a0c76d51f943b5321fb318.gif', tipo: 'imagem' },
          { url: 'https://static.wixstatic.com/media/06f338_84ec404210a240d58ab5aa62ffab6f06~mv2.gif', tipo: 'imagem' }
        ],
        volume: 80
      });
    }
  };

  const salvarConfiguracoes = async () => {
    const token = localStorage.getItem("jwtToken");
    try {
      await axios.post(`${API_BASE_URL}/configuracoes/painel`, configuracoes, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    }
  };

  const testarSom = (somUrl) => {
    if (audioTest) {
      audioTest.pause();
      audioTest.currentTime = 0;
    }
    
    const audio = new Audio(somUrl);
    audio.volume = configuracoes.volume / 100;
    audio.play();
    setAudioTest(audio);
  };

  const pararSom = () => {
    if (audioTest) {
      audioTest.pause();
      audioTest.currentTime = 0;
    }
  };

  const adicionarMidia = () => {
    if (novaMidia.url) {
      setConfiguracoes(prev => ({
        ...prev,
        midias: [...prev.midias, { ...novaMidia }]
      }));
      setNovaMidia({ url: '', tipo: 'imagem' });
    }
  };

  const removerMidia = (index) => {
    setConfiguracoes(prev => ({
      ...prev,
      midias: prev.midias.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (event, tipoSom) => {
    const file = event.target.files[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setConfiguracoes(prev => ({
        ...prev,
        sons: { ...prev.sons, [tipoSom]: objectUrl }
      }));
    }
  };

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.content}>
        <h1 style={styles.title}>Configurações do Painel</h1>
        
        {/* Seção de Sons */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <FaMusic style={styles.sectionIcon} />
            Configurações de Áudio
          </h2>
          
          <div style={styles.volumeControl}>
            <label style={styles.label}>Volume Geral: {configuracoes.volume}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={configuracoes.volume}
              onChange={(e) => setConfiguracoes(prev => ({
                ...prev,
                volume: parseInt(e.target.value)
              }))}
              style={styles.slider}
            />
          </div>

          <div style={styles.soundsGrid}>
            <div style={styles.soundItem}>
              <label style={styles.label}>Som Chamada Normal</label>
              <div style={styles.soundControls}>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, 'chamadaFicha')}
                  style={styles.fileInput}
                />
                {configuracoes.sons.chamadaFicha && (
                  <>
                    <button 
                      onClick={() => testarSom(configuracoes.sons.chamadaFicha)}
                      style={styles.testButton}
                    >
                      <FaPlay /> Testar
                    </button>
                    <button 
                      onClick={pararSom}
                      style={styles.stopButton}
                    >
                      <FaStop /> Parar
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={styles.soundItem}>
              <label style={styles.label}>Som Chamada Prioritária</label>
              <div style={styles.soundControls}>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, 'chamadaPrioritaria')}
                  style={styles.fileInput}
                />
                {configuracoes.sons.chamadaPrioritaria && (
                  <>
                    <button 
                      onClick={() => testarSom(configuracoes.sons.chamadaPrioritaria)}
                      style={styles.testButton}
                    >
                      <FaPlay /> Testar
                    </button>
                    <button 
                      onClick={pararSom}
                      style={styles.stopButton}
                    >
                      <FaStop /> Parar
                    </button>
                  </>
                )}
              </div>
            </div>

            <div style={styles.soundItem}>
              <label style={styles.label}>Som de Fundo (Opcional)</label>
              <div style={styles.soundControls}>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, 'background')}
                  style={styles.fileInput}
                />
                {configuracoes.sons.background && (
                  <>
                    <button 
                      onClick={() => testarSom(configuracoes.sons.background)}
                      style={styles.testButton}
                    >
                      <FaPlay /> Testar
                    </button>
                    <button 
                      onClick={pararSom}
                      style={styles.stopButton}
                    >
                      <FaStop /> Parar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Mídias */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <FaImage style={styles.sectionIcon} />
            Carrossel de Mídias
          </h2>
          
          <div style={styles.mediaForm}>
            <input
              type="text"
              placeholder="URL da mídia (GIF, imagem ou vídeo)"
              value={novaMidia.url}
              onChange={(e) => setNovaMidia(prev => ({ ...prev, url: e.target.value }))}
              style={styles.urlInput}
            />
            <select
              value={novaMidia.tipo}
              onChange={(e) => setNovaMidia(prev => ({ ...prev, tipo: e.target.value }))}
              style={styles.typeSelect}
            >
              <option value="imagem">Imagem/GIF</option>
              <option value="video">Vídeo</option>
            </select>
            <button onClick={adicionarMidia} style={styles.addButton}>
              Adicionar
            </button>
          </div>

          <div style={styles.mediaGrid}>
            {configuracoes.midias.map((midia, index) => (
              <div key={index} style={styles.mediaItem}>
                <div style={styles.mediaPreview}>
                  {midia.tipo === 'video' ? (
                    <video
                      src={midia.url}
                      style={styles.preview}
                      muted
                      loop
                      autoPlay
                    />
                  ) : (
                    <img
                      src={midia.url}
                      alt={`Mídia ${index + 1}`}
                      style={styles.preview}
                    />
                  )}
                </div>
                <div style={styles.mediaInfo}>
                  <span style={styles.mediaType}>{midia.tipo}</span>
                  <button 
                    onClick={() => removerMidia(index)}
                    style={styles.removeButton}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={salvarConfiguracoes} style={styles.saveButton}>
          <FaSave /> Salvar Configurações
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '32px',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionIcon: {
    color: '#3b82f6',
  },
  volumeControl: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#374151',
  },
  slider: {
    width: '100%',
    maxWidth: '300px',
  },
  soundsGrid: {
    display: 'grid',
    gap: '16px',
  },
  soundItem: {
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
  },
  soundControls: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fileInput: {
    flex: '1',
    minWidth: '200px',
  },
  testButton: {
    padding: '8px 12px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  stopButton: {
    padding: '8px 12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  mediaForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  urlInput: {
    flex: '1',
    minWidth: '300px',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
  },
  typeSelect: {
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: 'white',
  },
  addButton: {
    padding: '10px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  mediaItem: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  mediaPreview: {
    width: '100%',
    height: '120px',
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  mediaInfo: {
    padding: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mediaType: {
    fontSize: '12px',
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  removeButton: {
    padding: '4px 8px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  saveButton: {
    padding: '12px 24px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '0 auto',
  },
};

export default ConfiguracoesPainel;