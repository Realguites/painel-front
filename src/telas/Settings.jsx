import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config/config';

function SettingsScreen() {
  const { API_BASE_URL } = config;
  
  // Estado inicial com valores padrão
  const [settings, setSettings] = useState({
    numeroInicioDiaFichaPrioritario: 1,
    numeroInicioDiaFichaNormal: 1,
    numeroInicioDiaFichaAtpve: 1,
    somAlertaSelecionado: '', // Inicializar vazio
    vozSelecionada: 'pt-BR',
    volumeGeral: 80,
    somAtivado: true,
    vozAtivada: true,
    velocidadeVoz: 0,
    tomVoz: 0
  });

  const [vozesDisponiveis, setVozesDisponiveis] = useState({});
  const [sonsDisponiveis, setSonsDisponiveis] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testandoSom, setTestandoSom] = useState(false);
  const [testandoVoz, setTestandoVoz] = useState(false);

  useEffect(() => {
    carregarSettings();
  }, []);

  const carregarSettings = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      
      // Carregar settings
      const settingsResponse = await axios.get(`${API_BASE_URL}/settings/empresa`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Settings carregados:', settingsResponse.data);
      
      // Garantir que todos os campos existam
      const loadedSettings = {
        numeroInicioDiaFichaPrioritario: settingsResponse.data.numeroInicioDiaFichaPrioritario || 1,
        numeroInicioDiaFichaNormal: settingsResponse.data.numeroInicioDiaFichaNormal || 1,
        numeroInicioDiaFichaAtpve: settingsResponse.data.numeroInicioDiaFichaAtpve || 1,
        somAlertaSelecionado: settingsResponse.data.somAlertaSelecionado || 'notification.mp3',
        vozSelecionada: settingsResponse.data.vozSelecionada || 'pt-BR',
        volumeGeral: settingsResponse.data.volumeGeral || 80,
        somAtivado: settingsResponse.data.somAtivado !== false, // default true
        vozAtivada: settingsResponse.data.vozAtivada !== false, // default true
        velocidadeVoz: settingsResponse.data.velocidadeVoz || 0,
        tomVoz: settingsResponse.data.tomVoz || 0
      };
      
      setSettings(loadedSettings);

      // Carregar vozes disponíveis
      const vozesResponse = await axios.get(`${API_BASE_URL}/settings/empresa/vozes-disponiveis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setVozesDisponiveis(vozesResponse.data);

      // Carregar sons disponíveis
      const sonsResponse = await axios.get(`${API_BASE_URL}/settings/empresa/sons-disponiveis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setSonsDisponiveis(sonsResponse.data);

    } catch (error) {
      console.error('Erro ao carregar settings:', error);
      // Valores padrão
      setVozesDisponiveis({
        'pt-BR': 'Português Brasil',
        'pt-PT': 'Português Portugal',
        'en-US': 'Inglês EUA'
      });
      setSonsDisponiveis({
        'notification.mp3': 'Notificação Padrão',
        'bell.mp3': 'Sino',
        'beep.mp3': 'Beep'
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("jwtToken");
      
      // Log para debug
      console.log('Enviando PUT com:', settings);
      console.log('somAlertaSelecionado no PUT:', settings.somAlertaSelecionado);
      
      const response = await axios.put(`${API_BASE_URL}/settings/empresa`, settings, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('PUT response:', response.data);
      alert('Configurações salvas com sucesso!');
      
      // Recarregar para confirmar
      carregarSettings();
      
    } catch (error) {
      console.error('Erro ao salvar settings:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      alert('Erro ao salvar configurações: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  const testarSom = async () => {
    if (!settings.somAtivado || !settings.somAlertaSelecionado) {
      alert('Som desativado ou não selecionado');
      return;
    }

    setTestandoSom(true);
    try {
      const token = localStorage.getItem("jwtToken");
      
      // Usar fetch com headers
      const response = await fetch(
        `${API_BASE_URL}/settings/testar-som/${settings.somAlertaSelecionado.slice(0, -4)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'audio/mpeg'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(blobUrl);
      audio.volume = settings.volumeGeral / 100;
      
      const cleanup = () => {
        URL.revokeObjectURL(blobUrl);
        audio.remove();
        setTestandoSom(false);
      };
      
      audio.onended = cleanup;
      audio.onerror = cleanup;
      
      audio.play().catch(error => {
        console.error('Erro ao reproduzir:', error);
        cleanup();
        alert('Não foi possível reproduzir o som');
      });

    } catch (error) {
      console.error('Erro ao testar som:', error);
      alert('Erro ao testar som: ' + error.message);
      setTestandoSom(false);
    }
  };

  const testarVoz = () => {
    if (!settings.vozAtivada || !window.speechSynthesis) {
      alert('Voz desativada ou navegador não suporta síntese de voz');
      return;
    }

    setTestandoVoz(true);
    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance('Teste de voz do sistema de atendimento');
      
      utterance.lang = settings.vozSelecionada;
      
      const rate = 0.5 + (settings.velocidadeVoz + 10) * 0.15;
      utterance.rate = Math.min(Math.max(rate, 0.5), 2);
      
      const pitch = 1 + (settings.tomVoz * 0.1);
      utterance.pitch = Math.min(Math.max(pitch, 0), 2);
      
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        setTimeout(() => {
          const voicesLoaded = window.speechSynthesis.getVoices();
          const voice = voicesLoaded.find(v => v.lang.startsWith(settings.vozSelecionada));
          if (voice) utterance.voice = voice;
          window.speechSynthesis.speak(utterance);
        }, 100);
      } else {
        const voice = voices.find(v => v.lang.startsWith(settings.vozSelecionada));
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
      }

      utterance.onend = () => setTestandoVoz(false);
      utterance.onerror = () => {
        alert('Erro ao testar voz');
        setTestandoVoz(false);
      };

    } catch (error) {
      console.error('Erro ao testar voz:', error);
      alert('Erro ao testar voz');
      setTestandoVoz(false);
    }
  };

  const resetarContadores = async () => {
    if (window.confirm('Tem certeza que deseja resetar os contadores para 1?')) {
      try {
        const token = localStorage.getItem("jwtToken");
        await axios.post(`${API_BASE_URL}/settings/empresa/reset-contadores`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        carregarSettings();
        alert('Contadores resetados com sucesso!');
      } catch (error) {
        console.error('Erro ao resetar contadores:', error);
      }
    }
  };

  if (loading) {
    return <div style={styles.loading}>Carregando configurações...</div>;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Configurações do Sistema</h1>
      
      {/* Contadores */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Contadores Iniciais Diários</h2>
        
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label>Ficha Prioritária</label>
            <input
              type="number"
              min="1"
              value={settings.numeroInicioDiaFichaPrioritario}
              onChange={(e) => setSettings({
                ...settings, 
                numeroInicioDiaFichaPrioritario: parseInt(e.target.value) || 1
              })}
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label>Ficha Normal</label>
            <input
              type="number"
              min="1"
              value={settings.numeroInicioDiaFichaNormal}
              onChange={(e) => setSettings({
                ...settings, 
                numeroInicioDiaFichaNormal: parseInt(e.target.value) || 1
              })}
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label>Ficha ATPV-e</label>
            <input
              type="number"
              min="1"
              value={settings.numeroInicioDiaFichaAtpve}
              onChange={(e) => setSettings({
                ...settings, 
                numeroInicioDiaFichaAtpve: parseInt(e.target.value) || 1
              })}
              style={styles.input}
            />
          </div>
        </div>
        
        <button onClick={resetarContadores} style={styles.resetButton}>
          Resetar Contadores para 1
        </button>
      </div>

      {/* Configurações de Áudio */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Configurações de Áudio</h2>
        
        <div style={styles.audioSettings}>
          {/* Switches */}
          <div style={styles.switchGroup}>
            <label>
              <input
                type="checkbox"
                checked={settings.somAtivado}
                onChange={(e) => setSettings({
                  ...settings, 
                  somAtivado: e.target.checked
                })}
              />
              Som Ativado
            </label>
            
            <label>
              <input
                type="checkbox"
                checked={settings.vozAtivada}
                onChange={(e) => setSettings({
                  ...settings, 
                  vozAtivada: e.target.checked
                })}
              />
              Voz Ativada
            </label>
          </div>

          {/* Volume */}
          <div style={styles.inputGroup}>
            <label>Volume Geral</label>
            <div style={styles.sliderContainer}>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volumeGeral}
                onChange={(e) => setSettings({
                  ...settings, 
                  volumeGeral: parseInt(e.target.value)
                })}
                style={styles.slider}
              />
              <span>{settings.volumeGeral}%</span>
            </div>
          </div>

          {/* Som de Alerta */}
          <div style={styles.inputGroup}>
            <label>Som de Alerta</label>
            <div style={styles.selectContainer}>
              <select
                value={settings.somAlertaSelecionado || ''}
                onChange={(e) => {
                  console.log('Som selecionado:', e.target.value);
                  setSettings({
                    ...settings, 
                    somAlertaSelecionado: e.target.value
                  });
                }}
                style={styles.select}
                disabled={!settings.somAtivado}
              >
                <option value="">Selecione um som</option>
                {Object.entries(sonsDisponiveis).map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
              <button 
                onClick={testarSom} 
                disabled={!settings.somAtivado || testandoSom || !settings.somAlertaSelecionado}
                style={styles.testButton}
              >
                {testandoSom ? '▶️ Tocando...' : '▶️ Testar'}
              </button>
            </div>
            <small style={styles.hint}>
              Selecionado: {settings.somAlertaSelecionado || 'Nenhum'}
            </small>
          </div>

          {/* Voz */}
          <div style={styles.inputGroup}>
            <label>Voz Sintetizada</label>
            <div style={styles.selectContainer}>
              <select
                value={settings.vozSelecionada}
                onChange={(e) => setSettings({
                  ...settings, 
                  vozSelecionada: e.target.value
                })}
                style={styles.select}
                disabled={!settings.vozAtivada}
              >
                {Object.entries(vozesDisponiveis).map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome}
                  </option>
                ))}
              </select>
              <button 
                onClick={testarVoz} 
                disabled={!settings.vozAtivada || testandoVoz}
                style={styles.testButton}
              >
                {testandoVoz ? '🗣️ Falando...' : '🗣️ Testar'}
              </button>
            </div>
          </div>

          {/* Ajustes de Voz */}
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label>
                Velocidade da Voz: {settings.velocidadeVoz}
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                value={settings.velocidadeVoz}
                onChange={(e) => setSettings({
                  ...settings, 
                  velocidadeVoz: parseInt(e.target.value)
                })}
                style={styles.slider}
                disabled={!settings.vozAtivada}
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label>
                Tom da Voz: {settings.tomVoz}
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                value={settings.tomVoz}
                onChange={(e) => setSettings({
                  ...settings, 
                  tomVoz: parseInt(e.target.value)
                })}
                style={styles.slider}
                disabled={!settings.vozAtivada}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div style={styles.actions}>
        <button 
          onClick={salvarSettings} 
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? '💾 Salvando...' : '💾 Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '30px auto',
    padding: '30px',
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    color: '#f8fafc',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#94a3b8',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '30px',
    textAlign: 'center',
    color: '#3b82f6',
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '10px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
    color: '#f1f5f9',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '16px',
  },
  selectContainer: {
    display: 'flex',
    gap: '10px',
  },
  select: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #475569',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '16px',
    flex: 1,
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  slider: {
    flex: 1,
    height: '6px',
    borderRadius: '3px',
    backgroundColor: '#475569',
  },
  switchGroup: {
    display: 'flex',
    gap: '30px',
    marginBottom: '20px',
  },
  audioSettings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  testButton: {
    padding: '12px 20px',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  resetButton: {
    padding: '12px 24px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  saveButton: {
    padding: '16px 40px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '18px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '30px',
  },
  hint: {
    fontSize: '12px',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
};

export default SettingsScreen;