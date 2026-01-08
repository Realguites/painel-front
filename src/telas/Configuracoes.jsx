import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config/config';

function SettingsScreen() {
  const { API_BASE_URL } = config;
  const [settings, setSettings] = useState({
    numeroInicioDiaFichaPrioritario: 1,
    numeroInicioDiaFichaNormal: 1,
    numeroInicioDiaFichaAtpve: 1,
    somAlertaSelecionado: 'notification.mp3',
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
      setSettings(settingsResponse.data);

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
      await axios.put(`${API_BASE_URL}/settings/empresa`, settings, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar settings:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const testarVoz = async () => {
    if (!settings.vozAtivada || !window.speechSynthesis) {
      alert('Voz desativada ou navegador não suporta síntese de voz');
      return;
    }
  
    setTestandoVoz(true);
    try {
      // Cancela qualquer fala em andamento
      window.speechSynthesis.cancel();
  
      // Cria a utterance
      const utterance = new SpeechSynthesisUtterance('Teste de voz do sistema de atendimento');
      
      // Configura a voz selecionada
      utterance.lang = settings.vozSelecionada;
      
      // Aplica velocidade (rate: 0.5 a 2)
      const rate = 0.5 + (settings.velocidadeVoz + 10) * 0.15;
      utterance.rate = Math.min(Math.max(rate, 0.5), 2);
      
      // Aplica tom (pitch: 0 a 2)
      const pitch = 1 + (settings.tomVoz * 0.1);
      utterance.pitch = Math.min(Math.max(pitch, 0), 2);
      
      // Tenta encontrar uma voz no idioma selecionado
      const voices = window.speechSynthesis.getVoices();
      
      // Se ainda não carregou as vozes, espera um pouco
      if (voices.length === 0) {
        setTimeout(() => {
          const voicesLoaded = window.speechSynthesis.getVoices();
          const voice = voicesLoaded.find(v => v.lang.startsWith(settings.vozSelecionada));
          if (voice) {
            utterance.voice = voice;
          }
          falarUtterance(utterance);
        }, 100);
      } else {
        const voice = voices.find(v => v.lang.startsWith(settings.vozSelecionada));
        if (voice) {
          utterance.voice = voice;
        }
        falarUtterance(utterance);
      }
  
    } catch (error) {
      console.error('Erro ao testar voz:', error);
      alert('Erro ao testar voz. Verifique se o idioma está disponível.');
      setTestandoVoz(false);
    }
  };
  
  // Função auxiliar para falar
  const falarUtterance = (utterance) => {
    utterance.onstart = () => console.log('Voz iniciada');
    utterance.onend = () => {
      console.log('Voz finalizada');
      setTestandoVoz(false);
    };
    utterance.onerror = (event) => {
      console.error('Erro na voz:', event);
      alert('Erro ao testar voz. Verifique se o idioma está disponível.');
      setTestandoVoz(false);
    };
  
    // Fala
    window.speechSynthesis.speak(utterance);
  };

  const testarSom = async () => {
    if (!settings.somAtivado || !settings.somAlertaSelecionado) {
      alert('Som desativado ou não selecionado');
      return;
    }

    setTestandoSom(true);
    try {
      const token = localStorage.getItem("jwtToken");
      
      // Baixa e toca o som
      const audio = new Audio(`${API_BASE_URL}/settings/testar-som/${settings.somAlertaSelecionado}`);
      audio.volume = settings.volumeGeral / 100;
      
      audio.oncanplaythrough = () => {
        audio.play();
      };
      
      audio.onended = () => {
        setTestandoSom(false);
      };
      
      audio.onerror = () => {
        alert('Erro ao carregar som');
        setTestandoSom(false);
      };

    } catch (error) {
      console.error('Erro ao testar som:', error);
      alert('Erro ao testar som');
      setTestandoSom(false);
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

  const formatarNomeSom = (nomeArquivo) => {
    if (sonsDisponiveis[nomeArquivo]) {
      return sonsDisponiveis[nomeArquivo];
    }
    // Remove extensão e formata
    return nomeArquivo
      .replace('.mp3', '')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <span>Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Configurações do Sistema</h1>
      
      {/* Contadores */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🔢</span>
          Contadores Iniciais Diários
        </h2>
        <p style={styles.sectionDescription}>
          Define o número inicial de cada tipo de ficha a cada dia
        </p>
        
        <div style={styles.grid}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>🔴</span>
              Ficha Prioritária
            </label>
            <input
              type="number"
              min="1"
              value={settings.numeroInicioDiaFichaPrioritario}
              onChange={(e) => setSettings({...settings, numeroInicioDiaFichaPrioritario: parseInt(e.target.value) || 1})}
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>🟢</span>
              Ficha Normal
            </label>
            <input
              type="number"
              min="1"
              value={settings.numeroInicioDiaFichaNormal}
              onChange={(e) => setSettings({...settings, numeroInicioDiaFichaNormal: parseInt(e.target.value) || 1})}
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>🔵</span>
              Ficha ATPV-e
            </label>
            <input
              type="number"
              min="1"
              value={settings.numeroInicioDiaFichaAtpve}
              onChange={(e) => setSettings({...settings, numeroInicioDiaFichaAtpve: parseInt(e.target.value) || 1})}
              style={styles.input}
            />
          </div>
        </div>
        
        <button onClick={resetarContadores} style={styles.resetButton}>
          <span style={styles.buttonIcon}>🔄</span>
          Resetar Contadores para 1
        </button>
      </div>

      {/* Configurações de Áudio */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>
          <span style={styles.sectionIcon}>🔊</span>
          Configurações de Áudio
        </h2>
        <p style={styles.sectionDescription}>
          Configure sons e vozes do sistema
        </p>
        
        <div style={styles.audioSettings}>
          {/* Switches */}
          <div style={styles.switchGroup}>
            <label style={styles.switchLabel}>
              <input
                type="checkbox"
                checked={settings.somAtivado}
                onChange={(e) => setSettings({...settings, somAtivado: e.target.checked})}
                style={styles.checkbox}
              />
              <span style={styles.switchText}>Som Ativado</span>
            </label>
            
            <label style={styles.switchLabel}>
              <input
                type="checkbox"
                checked={settings.vozAtivada}
                onChange={(e) => setSettings({...settings, vozAtivada: e.target.checked})}
                style={styles.checkbox}
              />
              <span style={styles.switchText}>Voz Ativada</span>
            </label>
          </div>

          {/* Volume */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Volume Geral</label>
            <div style={styles.sliderContainer}>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.volumeGeral}
                onChange={(e) => setSettings({...settings, volumeGeral: parseInt(e.target.value)})}
                style={styles.slider}
              />
              <span style={styles.rangeValue}>{settings.volumeGeral}%</span>
            </div>
          </div>

          {/* Som de Alerta */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Som de Alerta</label>
            <div style={styles.selectContainer}>
              <select
                value={settings.somAlertaSelecionado}
                onChange={(e) => setSettings({...settings, somAlertaSelecionado: e.target.value})}
                style={styles.select}
                disabled={!settings.somAtivado}
              >
                {Object.entries(sonsDisponiveis).map(([id, nome]) => (
                  <option key={id} value={id}>
                    {nome} ({id})
                  </option>
                ))}
              </select>
              <button 
                onClick={testarSom} 
                style={styles.testButton}
                disabled={!settings.somAtivado || testandoSom}
              >
                {testandoSom ? '▶️ Tocando...' : '▶️ Testar'}
              </button>
            </div>
            <small style={styles.hint}>
              Arquivos MP3 na pasta resources/static/sounds/
            </small>
          </div>

          {/* Voz */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Voz Sintetizada</label>
            <div style={styles.selectContainer}>
              <select
                value={settings.vozSelecionada}
                onChange={(e) => setSettings({...settings, vozSelecionada: e.target.value})}
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
                style={styles.testButton}
                disabled={!settings.vozAtivada || testandoVoz}
              >
                {testandoVoz ? '🗣️ Falando...' : '🗣️ Testar'}
              </button>
            </div>
            <small style={styles.hint}>
              Depende do suporte do navegador
            </small>
          </div>

          {/* Ajustes de Voz */}
          <div style={styles.grid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Velocidade da Voz
                <span style={styles.sliderValue}>{settings.velocidadeVoz}</span>
              </label>
              <div style={styles.sliderContainer}>
                <span style={styles.sliderMin}>Lenta</span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={settings.velocidadeVoz}
                  onChange={(e) => setSettings({...settings, velocidadeVoz: parseInt(e.target.value)})}
                  style={styles.slider}
                  disabled={!settings.vozAtivada}
                />
                <span style={styles.sliderMax}>Rápida</span>
              </div>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Tom da Voz
                <span style={styles.sliderValue}>{settings.tomVoz}</span>
              </label>
              <div style={styles.sliderContainer}>
                <span style={styles.sliderMin}>Grave</span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={settings.tomVoz}
                  onChange={(e) => setSettings({...settings, tomVoz: parseInt(e.target.value)})}
                  style={styles.slider}
                  disabled={!settings.vozAtivada}
                />
                <span style={styles.sliderMax}>Agudo</span>
              </div>
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
    maxWidth: '900px',
    margin: '30px auto',
    padding: '30px',
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    color: '#f8fafc',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '20px',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #3b82f6',
    borderTop: '5px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    marginBottom: '10px',
    textAlign: 'center',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  section: {
    marginBottom: '40px',
    padding: '25px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '15px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: '22px',
    fontWeight: '700',
    marginBottom: '10px',
    color: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sectionIcon: {
    fontSize: '24px',
  },
  sectionDescription: {
    fontSize: '14px',
    color: '#94a3b8',
    marginBottom: '25px',
    fontStyle: 'italic',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '25px',
    marginBottom: '25px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  label: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  labelIcon: {
    fontSize: '18px',
  },
  input: {
    padding: '14px',
    borderRadius: '10px',
    border: '2px solid #475569',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '16px',
    transition: 'all 0.3s',
  },
  selectContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  select: {
    padding: '14px',
    borderRadius: '10px',
    border: '2px solid #475569',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    fontSize: '16px',
    flex: 1,
    transition: 'all 0.3s',
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  slider: {
    flex: 1,
    height: '8px',
    borderRadius: '4px',
    backgroundColor: '#475569',
    outline: 'none',
    WebkitAppearance: 'none',
  },
  sliderValue: {
    marginLeft: 'auto',
    fontWeight: '700',
    color: '#3b82f6',
    minWidth: '30px',
    textAlign: 'center',
  },
  sliderMin: {
    fontSize: '12px',
    color: '#94a3b8',
    minWidth: '40px',
  },
  sliderMax: {
    fontSize: '12px',
    color: '#94a3b8',
    minWidth: '40px',
  },
  rangeValue: {
    fontWeight: '700',
    color: '#3b82f6',
    minWidth: '40px',
    textAlign: 'center',
  },
  switchGroup: {
    display: 'flex',
    gap: '30px',
    marginBottom: '25px',
  },
  switchLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer',
  },
  switchText: {
    fontSize: '16px',
    fontWeight: '600',
  },
  audioSettings: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px',
  },
  testButton: {
    padding: '12px 20px',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    transition: 'all 0.3s',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  resetButton: {
    padding: '12px 24px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '14px',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  saveButton: {
    padding: '16px 40px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '18px',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '0 auto',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '40px',
  },
  hint: {
    fontSize: '12px',
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: '5px',
  },
  buttonIcon: {
    fontSize: '16px',
  },
};

// Adicionar animação de spinner
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default SettingsScreen;