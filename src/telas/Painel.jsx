import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import config from '../config/config';
import Header from '../others/Header';
import { decodeToken } from "react-jwt";
import Carrossel from '../others/Carrossel';
import logo from '../others/logo.png';
import { MdBorderColor } from 'react-icons/md';

function Painel() {
  const [lastCalledTicket, setLastCalledTicket] = useState({
    numero: ' - ',
    prioridade: 'NORMAL',
    guiche: '-',
    tipo: 'NORMAL',
    usuarioQueChamou: null
  });
  
  const [nextTicketsByType, setNextTicketsByType] = useState({
    NORMAL: [],
    PRIORITARIO: [],
    ATPVE: []
  });
  
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [ticketCounts, setTicketCounts] = useState({
    NORMAL: 0,
    PRIORITARIO: 0,
    ATPVE: 0
  });
  
  const [soundPermission, setSoundPermission] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    nome: 'Operador',
    foto: null,
    tipoUsuario: 'OPERADOR',
    idUsuario: null,
    guiche: '-'
  });
  
  const [userLoading, setUserLoading] = useState(true);
  
  // Histórico das últimas fichas chamadas
  const [recentTickets, setRecentTickets] = useState([]);
  
  // Configurações do sistema
  const [systemSettings, setSystemSettings] = useState({
    somAtivado: true,
    vozAtivada: true,
    volumeGeral: 80,
    somAlertaSelecionado: 'notification',
    vozSelecionada: 'pt-BR',
    velocidadeVoz: 0,
    tomVoz: 0
  });
  
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  const { API_BASE_URL } = config;
  const audioContextRef = useRef(null);
  const audioCacheRef = useRef({});

  // API de Clima
  const API_KEY = 'c4200076a97c0a637b7c3aca46b9bc6c';
  const cidade = 'Canguçu,BR';
  const url_previsao_tempo = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&APPID=${API_KEY}&units=metric`;

  // Dados do carrossel
  const midias = [
    {
      url: 'https://i.pinimg.com/originals/06/ec/d0/06ecd0afe6a0c76d51f943b5321fb318.gif',
      tipo: 'imagem',
      titulo: 'Publicidade 1'
    },
    {
      url: 'https://static.wixstatic.com/media/06f338_84ec404210a240d58ab5aa62ffab6f06~mv2.gif',
      tipo: 'imagem',
      titulo: 'Publicidade 2'
    },
    {
      url: 'https://i.gifer.com/X15M.gif',
      tipo: 'imagem',
      titulo: 'Publicidade 3'
    }
  ];

  // ================= FUNÇÕES DE CONFIGURAÇÕES =================
  
  const fetchSystemSettings = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        setSettingsLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/settings/empresa`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('🔧 Configurações carregadas:', response.data);
      
      // Garante valores padrão se não vierem do backend
      setSystemSettings({
        somAtivado: response.data.somAtivado !== false,
        vozAtivada: response.data.vozAtivada !== false,
        volumeGeral: response.data.volumeGeral || 80,
        somAlertaSelecionado: response.data.somAlertaSelecionado || 'notification',
        vozSelecionada: response.data.vozSelecionada || 'pt-BR',
        velocidadeVoz: response.data.velocidadeVoz || 0,
        tomVoz: response.data.tomVoz || 0
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  // ================= FUNÇÕES DE HISTÓRICO =================
  
  const loadRecentTickets = () => {
    try {
      const stored = localStorage.getItem('recentTickets');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📋 Histórico carregado:', parsed.length, 'fichas');
        
        // Processar fotos no histórico
        const processed = parsed.map(ticket => ({
          ...ticket,
          usuarioFoto: ticket.usuarioFoto ? processUserPhoto(ticket.usuarioFoto) : null
        }));
        
        setRecentTickets(processed);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico do localStorage:', error);
    }
  };

  const processUserPhoto = (foto) => {
    if (!foto) return null;
    
    try {
      if (foto.startsWith('data:image')) {
        return foto;
      } else if (foto.startsWith('/') || foto.startsWith('http')) {
        return foto;
      } else {
        // Assume que é base64
        return `data:image/jpeg;base64,${foto}`;
      }
    } catch (error) {
      console.error('Erro ao processar foto:', error);
      return null;
    }
  };

  const saveRecentTickets = (tickets) => {
    try {
      localStorage.setItem('recentTickets', JSON.stringify(tickets));
    } catch (error) {
      console.error('Erro ao salvar histórico no localStorage:', error);
    }
  };

  const addToRecentTickets = (ticket) => {
    if (!ticket || !ticket.idFicha) {
      console.log('Ticket inválido para histórico');
      return;
    }

    setRecentTickets(prev => {
      const exists = prev.some(t => t.idFicha === ticket.idFicha);
      if (exists) {
        console.log(`Ticket ${ticket.idFicha} já está no histórico, ignorando...`);
        return prev;
      }

      const usuarioQueChamou = ticket.usuarioQueChamou;
      const usuarioFoto = usuarioQueChamou?.foto ? processUserPhoto(usuarioQueChamou.foto) : null;

      const newRecent = [
        {
          idFicha: ticket.idFicha,
          numero: ticket.numero,
          prioridade: ticket.identPrioridade,
          guiche: usuarioQueChamou?.guiche || '-',
          usuario: usuarioQueChamou?.nome || 'Operador',
          data: new Date().toISOString(),
          usuarioFoto: usuarioFoto,
          usuarioId: usuarioQueChamou?.idUsuario
        },
        ...prev.slice(0, 4) // Mantém apenas 5 itens
      ];

      saveRecentTickets(newRecent);
      return newRecent;
    });
  };

  const clearRecentTickets = () => {
    if (window.confirm('Tem certeza que deseja limpar o histórico de fichas?')) {
      setRecentTickets([]);
      localStorage.removeItem('recentTickets');
    }
  };

  // ================= FUNÇÕES DE USUÁRIO =================
  
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setUserLoading(false);
      return;
    }

    try {
      setUserLoading(true);
      const decodedToken = decodeToken(token);
      
      if (!decodedToken) {
        setUserLoading(false);
        return;
      }

      setCurrentUser({
        nome: decodedToken.nome || 'Operador',
        tipoUsuario: decodedToken.tipoUsuario || 'FUNCIONARIO',
        idUsuario: decodedToken.idUsuario,
        guiche: decodedToken.guiche || '-',
        foto: null
      });
      
    } catch (error) {
      console.error('❌ Erro ao decodificar token:', error);
    } finally {
      setUserLoading(false);
    }
  };

  const processCalledByUser = (usuarioData) => {
    if (!usuarioData) return null;
    
    let fotoUrl = null;
    
    if (usuarioData.foto && typeof usuarioData.foto === 'string') {
      try {
        if (usuarioData.foto.startsWith('data:image')) {
          fotoUrl = usuarioData.foto;
        } else if (usuarioData.foto.startsWith('/') || usuarioData.foto.startsWith('http')) {
          fotoUrl = usuarioData.foto;
        } else {
          fotoUrl = `data:image/jpeg;base64,${usuarioData.foto}`;
        }
      } catch (error) {
        console.error('Erro ao processar foto do usuário:', error);
        fotoUrl = null;
      }
    }
    
    return {
      nome: usuarioData.nome || 'Operador',
      tipoUsuario: usuarioData.tipoUsuario || 'FUNCIONARIO',
      idUsuario: usuarioData.idUsuario,
      guiche: usuarioData.guiche || '-',
      email: usuarioData.email || '',
      foto: fotoUrl
    };
  };

  const formatUserType = (tipo) => {
    const tipos = {
      'GERENTE': 'Gerente',
      'FUNCIONARIO': 'Funcionário',
      'MANAGER': 'Manager',
      'ADMIN': 'Administrador'
    };
    return tipos[tipo] || tipo;
  };

  // ================= FUNÇÕES DE SOM E VOZ =================
  
  const initAudioContext = () => {
    try {
      if (!audioContextRef.current && (window.AudioContext || window.webkitAudioContext)) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (error) {
      console.error('Erro ao inicializar AudioContext:', error);
    }
  };

  // FUNÇÃO CORRIGIDA: Toca o som das configurações
  const playSelectedSound = async () => {
    console.log('🎵 Iniciando playSelectedSound');
    
    if (!soundPermission) {
      console.log('🔇 Som desativado pelo usuário');
      return Promise.resolve();
    }
    
    if (!systemSettings.somAtivado) {
      console.log('🔇 Som desativado nas configurações');
      return Promise.resolve();
    }
    
    if (!systemSettings.somAlertaSelecionado) {
      console.log('⚠️ Nenhum som selecionado');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          console.error('❌ Token não encontrado');
          reject(new Error('Token não encontrado'));
          return;
        }
        
        const cacheKey = systemSettings.somAlertaSelecionado;
        console.log('🔑 Cache key:', cacheKey);
        
        // Se já tem no cache, usa do cache
        if (audioCacheRef.current[cacheKey]) {
          console.log('💾 Usando som do cache');
          const audio = new Audio(audioCacheRef.current[cacheKey]);
          audio.volume = systemSettings.volumeGeral / 100;
          
          audio.oncanplaythrough = () => {
            console.log('▶️ Tocando som do cache...');
            audio.play().then(() => {
              console.log('✅ Som do cache iniciado');
            }).catch(reject);
          };
          
          audio.onended = () => {
            console.log('✅ Som do cache finalizado');
            resolve();
          };
          
          audio.onerror = (error) => {
            console.error('❌ Erro no som do cache:', error);
            // Remove do cache se der erro
            delete audioCacheRef.current[cacheKey];
            reject(error);
          };
          
          audio.load();
          return;
        }
        
        // Busca do servidor
        const encodedSomId = encodeURIComponent(systemSettings.somAlertaSelecionado);
        const url = `${API_BASE_URL}/settings/testar-som/${encodedSomId.slice(0,-4)}`;
        console.log('🌐 Buscando som:', url);
        
        fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'audio/mpeg'
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return response.blob();
        })
        .then(blob => {
          console.log('📦 Blob recebido:', blob.size, 'bytes');
          const blobUrl = URL.createObjectURL(blob);
          
          // Armazena no cache
          audioCacheRef.current[cacheKey] = blobUrl;
          console.log('💾 Som armazenado no cache');
          
          const audio = new Audio(blobUrl);
          audio.volume = systemSettings.volumeGeral / 100;
          
          audio.oncanplaythrough = () => {
            console.log('▶️ Tocando som do servidor...');
            audio.play().then(() => {
              console.log('✅ Som do servidor iniciado');
            }).catch(error => {
              console.error('❌ Erro ao tocar áudio:', error);
              reject(error);
            });
          };
          
          audio.onended = () => {
            console.log('✅ Som do servidor finalizado');
            resolve();
          };
          
          audio.onerror = (error) => {
            console.error('❌ Erro no áudio:', error);
            reject(error);
          };
          
          audio.load();
          
          // Limpa do cache após 5 minutos
          setTimeout(() => {
            if (audioCacheRef.current[cacheKey]) {
              URL.revokeObjectURL(audioCacheRef.current[cacheKey]);
              delete audioCacheRef.current[cacheKey];
              console.log('🗑️ Cache limpo');
            }
          }, 5 * 60 * 1000);
        })
        .catch(error => {
          console.error('❌ Erro ao buscar som:', error);
          reject(error);
        });
        
      } catch (error) {
        console.error('❌ Erro em playSelectedSound:', error);
        reject(error);
      }
    });
  };

  // FUNÇÃO SIMPLIFICADA: Fala a ficha
  const speakTicket = (ticketData) => {
    if (!soundPermission || !window.speechSynthesis || !systemSettings.vozAtivada) {
      console.log('🗣️ Voz não disponível ou desativada');
      return;
    }
    
    try {
      // Cancela fala anterior
      window.speechSynthesis.cancel();
      
      const ticketNumber = formatTicketNumberForSpeech(
        ticketData.numero, 
        ticketData.prioridade
      );
      const guiche = ticketData.usuarioQueChamou?.guiche || currentUser.guiche || '-';
      const priorityLabel = getPriorityLabel(ticketData.prioridade).toLowerCase();
      
      const textToSpeak = `Ficha ${ticketNumber}, ${priorityLabel}, dirija-se ao atendente ${ticketData.usuarioQueChamou?.nome}`;
      
      console.log('🗣️ Texto para falar:', textToSpeak);
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = systemSettings.vozSelecionada;
      utterance.volume = systemSettings.volumeGeral / 100;
      
      // Ajusta velocidade
      const rate = 0.5 + (systemSettings.velocidadeVoz + 10) * 0.15;
      utterance.rate = Math.min(Math.max(rate, 0.5), 2);
      
      // Ajusta tom
      const pitch = 1 + (systemSettings.tomVoz * 0.1);
      utterance.pitch = Math.min(Math.max(pitch, 0), 2);
      
      // Encontra voz
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const voice = voices.find(v => v.lang.startsWith(systemSettings.vozSelecionada)) || voices[0];
        utterance.voice = voice;
        console.log('🔊 Voz selecionada:', voice.name);
      }
      
      utterance.onstart = () => console.log('▶️ Voz iniciada');
      utterance.onend = () => console.log('✅ Voz finalizada');
      utterance.onerror = (e) => console.error('❌ Erro na voz:', e);
      
      console.log('🎤 Iniciando fala...');
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('❌ Erro ao falar:', error);
    }
  };

  const formatTicketNumberForSpeech = (numero, prioridade) => {
    const formattedNumber = numero.toString().padStart(3, '0');
    const prefix = getPriorityPrefix(prioridade);
    return `${prefix} ${formattedNumber}`;
  };

  // FUNÇÃO PRINCIPAL CORRIGIDA: Notificação com sequência correta
  const playNotificationSound = async (ticketData = null) => {
    console.log('🔔 INICIANDO NOTIFICAÇÃO COMPLETA');
    
    if (!soundPermission) {
      console.log('🔇 Som global desativado');
      showVisualNotification(ticketData);
      return;
    }
    
    // 1. Mostra notificação visual primeiro
    showVisualNotification(ticketData);
    
    // 2. Toca o som (com tratamento de erro)
    if (systemSettings.somAtivado && systemSettings.somAlertaSelecionado) {
      console.log('🎵 Iniciando reprodução do som...');
      try {
        await playSelectedSound();
        console.log('✅ Som reproduzido com sucesso');
      } catch (error) {
        console.error('❌ Falha ao tocar som:', error);
        // Tenta fallback
        try {
          playFallbackBeep();
          console.log('🔄 Usando fallback beep');
        } catch (fallbackError) {
          console.error('❌ Falha no fallback também:', fallbackError);
        }
      }
    } else {
      console.log('⏭️ Som desativado nas configurações, pulando...');
    }
    
    // 3. Pequena pausa entre som e voz
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // 4. Fala a ficha
    if (ticketData && systemSettings.vozAtivada) {
      console.log('🗣️ Iniciando fala da ficha...');
      speakTicket(ticketData);
    } else {
      console.log('⏭️ Voz desativada ou sem ticket, pulando...');
    }
    
    console.log('🎉 NOTIFICAÇÃO CONCLUÍDA');
  };

  const playFallbackBeep = () => {
    try {
      if (!audioContextRef.current) {
        initAudioContext();
      }
      
      const audioContext = audioContextRef.current;
      if (!audioContext) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      oscillator.start(now);
      oscillator.stop(now + 0.5);
      
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
      };
      
    } catch (error) {
      console.error('Erro no fallback beep:', error);
    }
  };
  

  const testSound = async () => {
  
    if (!soundPermission) {
      alert('🔇 Som desativado pelo usuário');
      return;
    }
    
    if (!systemSettings.somAtivado) {
      alert('🔇 Som desativado nas configurações');
      return;
    }
    
    if (!systemSettings.somAlertaSelecionado) {
      alert('⚠️ Nenhum som selecionado nas configurações');
      return;
    }
    
    try {
      await playSelectedSound();
    } catch (error) {
      console.error('❌ Erro no teste de som:', error);
     // alert('❌ Erro ao testar som: ' + error.message);
    }
  };

  const testVoice = () => {
    if (!window.speechSynthesis) {
      alert('❌ Seu navegador não suporta síntese de voz');
      return;
    }
    
    if (!systemSettings.vozAtivada) {
      alert('🔇 Voz desativada nas configurações');
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance('Teste de voz do sistema de atendimento');
    utterance.lang = systemSettings.vozSelecionada;
    utterance.volume = systemSettings.volumeGeral / 100;
    
    const rate = 0.5 + (systemSettings.velocidadeVoz + 10) * 0.15;
    utterance.rate = Math.min(Math.max(rate, 0.5), 2);
    
    const pitch = 1 + (systemSettings.tomVoz * 0.1);
    utterance.pitch = Math.min(Math.max(pitch, 0), 2);
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const voice = voices.find(v => v.lang.startsWith(systemSettings.vozSelecionada));
      if (voice) utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
    alert('🗣️ Teste de voz iniciado');
  };

  const showVisualNotification = (ticketData) => {
    try {
      const ticketInfo = ticketData || lastCalledTicket;
      const ticketNumber = formatTicketNumber(ticketInfo.numero, ticketInfo.prioridade);
      const guiche = ticketInfo.usuarioQueChamou?.guiche || currentUser.guiche || '-';
      
      const existingNotification = document.getElementById('visual-notification');
      if (existingNotification) {
        existingNotification.remove();
      }
      
      const notification = document.createElement('div');
      notification.id = 'visual-notification';
      notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 30px;
        background: linear-gradient(135deg, ${getPriorityColor(ticketInfo.prioridade)}, #3b82f6);
        color: white;
        padding: 20px;
        border-radius: 15px;
        z-index: 10000;
        animation: notificationSlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        max-width: 300px;
        border: 2px solid rgba(255,255,255,0.2);
        backdrop-filter: blur(10px);
      `;
      
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="font-size: 32px; animation: bellShake 0.5s ease-in-out 3;">🔔</div>
          <div>
            <div style="font-size: 18px; font-weight: 700; margin-bottom: 5px;">NOVA FICHA CHAMADA</div>
            <div style="font-size: 24px; font-weight: 800; margin: 5px 0;">${ticketNumber}</div>
            <div style="font-size: 14px; opacity: 0.9;">Guichê: ${guiche}</div>
            <div style="font-size: 12px; opacity: 0.7; margin-top: 5px;">${formatDateTime(new Date())}</div>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" 
            style="background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; margin-left: auto;">
            ×
          </button>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.style.animation = 'notificationSlideOut 0.3s ease-in';
          setTimeout(() => notification.remove(), 300);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Erro na notificação visual:', error);
    }
  };

  // ================= FUNÇÕES AUXILIARES =================
  
  const formatTicketNumber = (numero, prioridade) => {
    const formattedNumber = numero.toString().padStart(3, '0');
    const prefix = getPriorityPrefix(prioridade);
    return `${prefix}${formattedNumber}`;
  };

  const getPriorityPrefix = (priority) => {
    const prefixes = {
      'NORMAL': 'N',
      'PRIORITARIO': 'P',
      'ATPVE': 'A'
    };
    return prefixes[priority] || 'N';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'NORMAL': 'Normal',
      'PRIORITARIO': 'Prioritário',
      'ATPVE': 'ATPV-e'
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'NORMAL': '#4CAF50',
      'PRIORITARIO': '#FF5722',
      'ATPVE': '#2196F3'
    };
    return colors[priority] || '#4CAF50';
  };

  const sortTickets = (tickets) => {
    const priorityOrder = ['PRIORITARIO', 'ATPVE', 'NORMAL'];
    return [...tickets].sort((a, b) => {
      return priorityOrder.indexOf(a.identPrioridade) - priorityOrder.indexOf(b.identPrioridade);
    });
  };

  const organizeTicketsByType = (tickets) => {
    const organized = {
      NORMAL: [],
      PRIORITARIO: [],
      ATPVE: []
    };

    tickets.forEach(ticket => {
      if (organized[ticket.identPrioridade]) {
        organized[ticket.identPrioridade].push(ticket);
      }
    });

    Object.keys(organized).forEach(key => {
      organized[key] = organized[key].sort((a, b) => a.numero - b.numero);
    });

    return organized;
  };

  const fetchWeatherData = async () => {
    try {
      const response = await fetch(url_previsao_tempo);
      if (!response.ok) throw new Error(`Erro: ${response.status}`);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Erro ao buscar dados do clima:', error);
    }
  };

  const fetchLastCalledTicket = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/fichas/ultimaChamada`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const ticketData = response.data;
      const calledBy = ticketData.usuarioQueChamou ? 
        processCalledByUser(ticketData.usuarioQueChamou) : null;
      
      setLastCalledTicket({
        numero: ticketData.numero || ' - ',
        prioridade: ticketData.identPrioridade || 'NORMAL',
        guiche: calledBy?.guiche || currentUser.guiche || '-',
        tipo: ticketData.identPrioridade || 'NORMAL',
        usuarioQueChamou: calledBy
      });
      
    } catch (error) {
      console.error('Erro ao buscar última ficha:', error);
    }
  };

  const fetchNextTickets = async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/fichas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const sortedTickets = sortTickets(response.data);
      const organized = organizeTicketsByType(sortedTickets);
      
      setNextTicketsByType(organized);
      
      setTicketCounts({
        NORMAL: organized.NORMAL.length,
        PRIORITARIO: organized.PRIORITARIO.length,
        ATPVE: organized.ATPVE.length
      });
    } catch (error) {
      console.error('Erro ao buscar fichas:', error);
    }
  };

  const formatDateTime = (date) => {
    const options = {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    return new Intl.DateTimeFormat('pt-BR', options).format(date);
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins === 1) return 'Há 1 minuto';
    if (diffMins < 60) return `Há ${diffMins} minutos`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Há 1 hora';
    if (diffHours < 24) return `Há ${diffHours} horas`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
  };

  const formatTemperature = (temp) => `${Math.round(temp)}°C`;
  const iconUrl = (iconCode) => `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  // ================= EFFECTS =================
  
  useEffect(() => {
    initAudioContext();
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes notificationSlideIn {
        from { transform: translateX(100%) translateY(-20px); opacity: 0; }
        to { transform: translateX(0) translateY(0); opacity: 1; }
      }
      @keyframes notificationSlideOut {
        from { transform: translateX(0) translateY(0); opacity: 1; }
        to { transform: translateX(100%) translateY(-20px); opacity: 0; }
      }
      @keyframes bellShake {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(15deg); }
        75% { transform: rotate(-15deg); }
      }
    `;
    document.head.appendChild(style);

    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    fetchWeatherData();
    const weatherInterval = setInterval(fetchWeatherData, 300000);

    // Carregar histórico ao iniciar
    loadRecentTickets();

    // Inicializar vozes do navegador
    if (window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('🔊 Vozes disponíveis:', voices.map(v => `${v.name} (${v.lang})`));
      };
      
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      clearInterval(timer);
      clearInterval(weatherInterval);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // Limpa cache de áudio
      Object.values(audioCacheRef.current).forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);


  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!userLoading) {
      fetchSystemSettings();
      fetchLastCalledTicket();
      fetchNextTickets();
    }
  }, [userLoading, currentUser]);

  // Recarrega configurações periodicamente
  useEffect(() => {
    if (!userLoading) {
      const interval = setInterval(() => {
        fetchSystemSettings();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [userLoading]);

  useEffect(() => {
    if (lastCalledTicket.numero !== ' - ') {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [lastCalledTicket]);

  useEffect(() => {
    let eventSource;
    let reconnectTimeout;

    const connectToSSE = () => {
      const token = localStorage.getItem("jwtToken");
      if (!token) return;

      eventSource = new EventSource(`${API_BASE_URL}/fichas/stream?token=${token}`);

      eventSource.addEventListener('newFicha', (event) => {
        const newFicha = JSON.parse(event.data);
        
        setNextTicketsByType(prev => {
          const updated = { ...prev };
          if (updated[newFicha.identPrioridade]) {
            updated[newFicha.identPrioridade] = 
              [...updated[newFicha.identPrioridade], newFicha]
                .sort((a, b) => a.numero - b.numero);
          }
          return updated;
        });

        setTicketCounts(prev => ({
          ...prev,
          [newFicha.identPrioridade]: prev[newFicha.identPrioridade] + 1
        }));
      });

      eventSource.addEventListener('fichaChamada', (event) => {
        console.log('📨 Evento SSE: fichaChamada recebido');
        const calledTicket = JSON.parse(event.data);
        console.log('🎫 Ficha chamada:', calledTicket.numero, calledTicket.identPrioridade);
        
        const calledBy = calledTicket.usuarioQueChamou ? 
          processCalledByUser(calledTicket.usuarioQueChamou) : null;

        const ticketInfo = {
          numero: calledTicket.numero,
          prioridade: calledTicket.identPrioridade,
          guiche: calledBy?.guiche || currentUser.guiche || '-',
          tipo: calledTicket.identPrioridade,
          usuarioQueChamou: calledBy
        };

        setLastCalledTicket(ticketInfo);

        setNextTicketsByType(prev => {
          const updated = { ...prev };
          if (updated[calledTicket.identPrioridade]) {
            updated[calledTicket.identPrioridade] = 
              updated[calledTicket.identPrioridade]
                .filter(t => t.idFicha !== calledTicket.idFicha);
          }
          return updated;
        });

        setTicketCounts(prev => ({
          ...prev,
          [calledTicket.identPrioridade]: Math.max(0, prev[calledTicket.identPrioridade] - 1)
        }));

        // ADICIONAR AO HISTÓRICO
        addToRecentTickets(calledTicket);

        // Chama a notificação
        console.log('🔔 Chamando playNotificationSound...');
        playNotificationSound(ticketInfo);
      });

      eventSource.onerror = (error) => {
        console.error('❌ Erro SSE:', error);
        eventSource.close();
        
        setReconnectAttempts(prev => prev + 1);
        reconnectTimeout = setTimeout(() => {
          console.log('🔄 Reconectando SSE...');
          connectToSSE();
        }, 1000);
      };
    };

    if (!userLoading && !settingsLoading) {
      connectToSSE();
    }

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [soundPermission, userLoading, settingsLoading, currentUser, systemSettings]);

  // ================= RENDER =================
  
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.mainSection}>
          <div style={styles.ticketCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>ATENDIMENTO ATUAL</h2>
            </div>
            
            <div style={styles.ticketAndUserContainer}>
              <div style={{
                ...styles.ticketDisplay,
                backgroundColor: getPriorityColor(lastCalledTicket.prioridade),
                animation: isBlinking ? 'blinkEffect 0.5s ease-in-out 5' : 'none',
                flex: 2
              }}>
                <h1 style={styles.ticketNumber}>
                  {formatTicketNumber(lastCalledTicket.numero, lastCalledTicket.prioridade)}
                </h1>
                <p style={styles.ticketType}>
                  {getPriorityLabel(lastCalledTicket.prioridade)}
                </p>
              </div>
              
              <div style={styles.userCard}>
                <div style={styles.userCardHeader}>
                  <span style={styles.userCardTitle}>
                    {lastCalledTicket.usuarioQueChamou ? 'OPERADOR QUE CHAMOU' : 'AGUARDANDO CHAMADA'}
                  </span>
                </div>
                <div style={styles.userCardContent}>
                  {lastCalledTicket.usuarioQueChamou ? (
                    <>
                      <div style={styles.userCardPhoto}>
                        {lastCalledTicket.usuarioQueChamou.foto ? (
                          <img 
                            src={lastCalledTicket.usuarioQueChamou.foto} 
                            alt={lastCalledTicket.usuarioQueChamou.nome}
                            style={styles.userCardPhotoImage}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.nextElementSibling;
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div style={{
                          ...styles.userCardPhotoPlaceholder,
                          display: !lastCalledTicket.usuarioQueChamou.foto ? 'flex' : 'none'
                        }}>
                          <span style={styles.userCardInitial}>
                            {lastCalledTicket.usuarioQueChamou.nome.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div style={styles.userCardInfo}>
                        <h3 style={styles.userCardName}>{lastCalledTicket.usuarioQueChamou.nome}</h3>
                      </div>
                    </>
                  ) : (
                    <div style={styles.noCaller}>
                      <div style={styles.noCallerIcon}>📞</div>
                      <span style={styles.noCallerText}>
                        Aguardando próxima chamada...
                      </span>
                      <span style={styles.noCallerSubtext}>
                        Quando uma ficha for chamada, o operador aparecerá aqui
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* HISTÓRICO DE ULTIMAS FICHAS CHAMADAS - NOVO LAYOUT */}
          <div style={styles.recentTicketsCard}>
            <div style={styles.recentTicketsHeader}>
              <h3 style={styles.recentTicketsTitle}>
                <span style={styles.historyIcon}>📋</span>
                ÚLTIMAS FICHAS CHAMADAS
              </h3>
              <div style={styles.recentTicketsControls}>
                <span style={styles.recentTicketsCount}>
                  {recentTickets.length} fichas
                </span>
              </div>
            </div>
            
            <div style={styles.recentTicketsList}>
              {recentTickets.length > 0 ? (
                recentTickets.map((ticket, index) => (
                  <div key={ticket.idFicha || index} style={styles.recentTicketItem}>
                    <div style={styles.recentTicketNumberCompact}>
                      <span style={styles.ticketNumCompact}>
                      {getPriorityPrefix(ticket.prioridade)}{ticket.numero.toString().padStart(3, '0')}
                      </span>
                      <span style={styles.ticketDivider}>—</span>
                    </div>
                    
                    <div style={styles.recentTicketInfoCompact}>
                      <div style={styles.recentTicketUserCompact}>
                        {ticket.usuarioFoto ? (
                          <img 
                            src={ticket.usuarioFoto} 
                            alt={ticket.usuario}
                            style={styles.recentUserPhotoCompact}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div style={{
                          ...styles.recentUserInitialCompact,
                          display: !ticket.usuarioFoto ? 'flex' : 'none'
                        }}>
                          {ticket.usuario.charAt(0).toUpperCase()}
                        </div>
                        <span style={styles.recentUserNameCompact}>
                          {ticket.usuario}
                        </span>
                      </div>
                      
                      <div style={styles.recentTicketTimeCompact}>
                        {formatRelativeTime(ticket.data)}
                      </div>
                    </div>
                    
                    {/* REMOVIDO: Badge colorido do tipo */}
                  </div>
                ))
              ) : (
                <div style={styles.noRecentTickets}>
                  <div style={styles.noRecentIcon}>📭</div>
                  <span style={styles.noRecentText}>
                    Nenhuma ficha chamada recentemente
                  </span>
                  <span style={styles.noRecentSubtext}>
                    As fichas chamadas aparecerão aqui
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SIDEBAR COM OS 3 CARDS EMPILHADOS */}
        <div style={styles.sidebar}>
          {/* 1. PREVISÃO DO TEMPO */}
          <div style={styles.weatherCardLarge}>
            <div style={styles.weatherHeaderLarge}>
              <h3 style={styles.widgetTitleLarge}>PREVISÃO DO TEMPO</h3>
              <span style={styles.weatherLocationLarge}>Canguçu, RS</span>
            </div>
            
            {weatherData && (
              <div style={styles.weatherContentLarge}>
                <div style={styles.weatherMainLarge}>
                  <img
                    src={iconUrl(weatherData.weather[0].icon)}
                    alt={weatherData.weather[0].description}
                    style={styles.weatherIconLarge}
                  />
                  <div style={styles.weatherTempLarge}>
                    <span style={styles.tempValueLarge}>
                      {formatTemperature(weatherData.main.temp)}
                    </span>
                    <span style={styles.weatherDescLarge}>
                      {weatherData.weather[0].description}
                    </span>
                  </div>
                </div>
                
                <div style={styles.weatherDetailsLarge}>
                  <div style={styles.detailItemLarge}>
                    <span style={styles.detailLabelLarge}>Sensação</span>
                    <span style={styles.detailValueLarge}>
                      {formatTemperature(weatherData.main.feels_like)}
                    </span>
                  </div>
                  <div style={styles.detailItemLarge}>
                    <span style={styles.detailLabelLarge}>Umidade</span>
                    <span style={styles.detailValueLarge}>{weatherData.main.humidity}%</span>
                  </div>
                  <div style={styles.detailItemLarge}>
                    <span style={styles.detailLabelLarge}>Vento</span>
                    <span style={styles.detailValueLarge}>{(weatherData.wind.speed / 3.6).toFixed(0)} Km/h</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. RELÓGIO E DATA */}
          <div style={styles.timeCard}>
            <div style={styles.dateDisplay}>
              <span style={styles.dateText}>
                {formatDateTime(currentDateTime).split(',')[0]}
              </span>
            </div>
            <div style={styles.timeDisplay}>
              <span style={styles.timeText}>
                {formatDateTime(currentDateTime).split(' ')[1]}
              </span>
              <span style={styles.secondText}>
                {formatDateTime(currentDateTime).split(' ')[2]}
              </span>
            </div>
            <div style={styles.weekDay}>
              {currentDateTime.toLocaleDateString('pt-BR', { 
                weekday: 'long',
                timeZone: 'America/Sao_Paulo'
              }).toUpperCase()}
            </div>
          </div>

          {/* 3. LOGO DO SISTEMA - DENTRO DA SIDEBAR */}
          <div style={styles.logoCard}>
  <div style={styles.logoContent}>
    {/* Imagem da logo */}
    <img 
      src={logo} 
      alt="Logo do Sistema"
      style={styles.logoImage}
    />
    
    {/* Mensagem abaixo da logo */}
    <div style={styles.logoMessage}>
      Visão em sistemas empresariais
    </div>
    
    {/* Instagram e @trvision */}
    <div style={styles.socialContainer}>
      {/* Ícone do Instagram roxo */}
      <svg style={styles.instagramIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <defs>
          <linearGradient id="instagramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <path 
          d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" 
          fill="url(#instagramGradient)"
        />
      </svg>
      
      <div style={styles.instagramText}>
        Siga <span style={styles.instagramHandle}>@trvision</span>
      </div>
    </div>
  </div>
</div>
        </div>
      </div>

      {/* RODAPÉ */}
      <div style={styles.footer}>
        <div style={styles.footerContent}>
          <span style={styles.footerText}>
            Sistema de Atendimento • {formatDateTime(currentDateTime).split(',')[0]} • 
            Conectado via SSE • {reconnectAttempts > 0 ? `(${reconnectAttempts} reconexões)` : 'Conexão estável'} •
            Som: {soundPermission ? 'Ativado' : 'Desativado'} • 
            Som Sistema: {systemSettings.somAtivado ? '✅' : '❌'} • 
            Voz: {systemSettings.vozAtivada ? '✅' : '❌'} •
            Volume: {systemSettings.volumeGeral}% •
            {lastCalledTicket.usuarioQueChamou ? 
              `Chamado por: ${lastCalledTicket.usuarioQueChamou.nome} (Guichê ${lastCalledTicket.usuarioQueChamou.guiche})` : 
              'Aguardando chamada'} •
            Histórico: {recentTickets.length} fichas
          </span>
        </div>
      </div>

      <style>
        {`
          @keyframes blinkEffect {
            0% { 
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.8),
                         inset 0 0 20px rgba(255, 255, 255, 0.4);
            }
            50% { 
              box-shadow: 0 0 40px rgba(255, 255, 255, 1),
                         inset 0 0 40px rgba(255, 255, 255, 0.8);
            }
            100% { 
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.8),
                         inset 0 0 20px rgba(255, 255, 255, 0.4);
            }
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}

// ================= STYLES =================

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
  },
  soundControl: {
    position: 'absolute',
    top: '80px',
    right: '30px',
    display: 'flex',
    gap: '10px',
    zIndex: 1000,
    alignItems: 'center',
  },
  soundButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  testSoundButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  },
  testVoiceButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#8b5cf6',
    color: 'white',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
  },
  settingsInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '6px 12px',
    borderRadius: '10px',
    marginLeft: '10px',
  },
  settingsText: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '24px',
    padding: '24px',
    maxWidth: '1800px',
    margin: '0 auto',
    width: '100%',
    marginTop: '20px',
  },
  mainSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  ticketCard: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'fadeIn 0.6s ease-out',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: 0,
    letterSpacing: '0.5px',
  },
  userInfoContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  userLoading: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    color: '#94a3b8',
    fontSize: '14px',
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #3b82f6',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '8px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  userPhotoContainer: {
    position: 'relative',
  },
  userPhoto: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #3b82f6',
  },
  userPhotoPlaceholder: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  userName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#f1f5f9',
  },
  userRole: {
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '2px 8px',
    borderRadius: '10px',
    alignSelf: 'flex-start',
  },
  ticketAndUserContainer: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
  },
  ticketDisplay: {
    padding: '48px 32px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '300px',
    transition: 'all 0.3s ease',
  },
  ticketNumber: {
    fontSize: '120px',
    fontWeight: '900',
    color: '#ffffff',
    margin: '0 0 16px 0',
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
    letterSpacing: '2px',
    fontFamily: "'Courier New', monospace",
  },
  ticketType: {
    fontSize: '24px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '8px 24px',
    borderRadius: '30px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  userCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
  },
  userCardHeader: {
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  userCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: '1px',
  },
  userCardContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    flex: 1,
  },
  userCardPhoto: {
    position: 'relative',
  },
  userCardPhotoImage: {
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #3b82f6',
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
  },
  userCardPhotoPlaceholder: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '4px solid rgba(59, 130, 246, 0.3)',
    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
  },
  userCardInitial: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userCardInfo: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  userCardName: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: 0,
  },
  userCardBadge: {
    display: 'inline-block',
  },
  userCardRole: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: '6px 16px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
  },
  userCardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px',
  },
  userCardMetaItem: {
    fontSize: '14px',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  metaIcon: {
    fontSize: '16px',
  },
  noCaller: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '12px',
    textAlign: 'center',
  },
  noCallerIcon: {
    fontSize: '48px',
    opacity: 0.5,
    marginBottom: '10px',
  },
  noCallerText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#94a3b8',
  },
  noCallerSubtext: {
    fontSize: '14px',
    color: '#64748b',
    fontStyle: 'italic',
  },
  infoBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  infoLabel: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '16px',
    color: '#f1f5f9',
    fontWeight: '600',
  },
  // HISTÓRICO DE ULTIMAS FICHAS - NOVO LAYOUT COMPACTO
  recentTicketsCard: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'fadeIn 0.6s ease-out',
    height: 'auto',
    minHeight: 'auto',
    flex: '0 0 auto',
  },
  recentTicketsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  recentTicketsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#f1f5f9',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  historyIcon: {
    fontSize: '18px',
  },
  recentTicketsControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  recentTicketsCount: {
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '4px 8px',
    borderRadius: '10px',
  },
  clearHistoryButton: {
    padding: '4px 8px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  recentTicketsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  recentTicketItem: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '10px 12px',
    borderRadius: '10px',
    transition: 'all 0.2s ease',
    borderLeft: '3px solid transparent',
    height: '48px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },
  recentTicketNumberCompact: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: '100px',
  },
  ticketPrefixCompact: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#94a3b8',
  },
  ticketNumCompact: {
    fontSize: '27px',
    fontWeight: '500',
    color: '#f1f5f9',
    fontFamily: "'Courier New', monospace",
  },
  ticketDivider: {
    color: '#64748b',
    fontSize: '14px',
    margin: '0 8px',
  },
  recentTicketInfoCompact: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentTicketUserCompact: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  recentUserPhotoCompact: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #3b82f6',
  },
  recentUserInitialCompact: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  recentUserNameCompact: {
    fontSize: '14px',
    color: '#f1f5f9',
    fontWeight: '500',
  },
  recentTicketTimeCompact: {
    fontSize: '12px',
    color: '#94a3b8',
    fontStyle: 'italic',
    minWidth: '80px',
    textAlign: 'right',
  },
  noRecentTickets: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
  },
  noRecentIcon: {
    fontSize: '28px',
    opacity: 0.5,
    marginBottom: '4px',
  },
  noRecentText: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  noRecentSubtext: {
    fontSize: '12px',
    color: '#64748b',
    fontStyle: 'italic',
  },
  mediaSection: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'fadeIn 0.6s ease-out 0.2s both',
  },
  mediaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  mediaTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#f1f5f9',
    margin: 0,
  },
  mediaCounter: {
    fontSize: '14px',
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  carouselContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    height: '200px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  weatherCardLarge: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'fadeIn 0.6s ease-out 0.3s both',
  },
  weatherHeaderLarge: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  widgetTitleLarge: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: 0,
    letterSpacing: '0.5px',
  },
  weatherLocationLarge: {
    fontSize: '16px',
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '6px 14px',
    borderRadius: '12px',
    fontWeight: '600',
  },
  weatherContentLarge: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  weatherMainLarge: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
  },
  weatherIconLarge: {
    width: '100px',
    height: '100px',
    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
  },
  weatherTempLarge: {
    display: 'flex',
    flexDirection: 'column',
  },
  tempValueLarge: {
    fontSize: '52px',
    fontWeight: '800',
    color: '#f1f5f9',
  },
  weatherDescLarge: {
    fontSize: '20px',
    color: '#94a3b8',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  weatherDetailsLarge: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
  },
  detailItemLarge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  detailLabelLarge: {
    fontSize: '14px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  detailValueLarge: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#f1f5f9',
  },
  timeCard: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    animation: 'fadeIn 0.6s ease-out 0.4s both',
  },
  dateDisplay: {
    marginBottom: '16px',
  },
  dateText: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#f1f5f9',
    margin: 0,
  },
  timeDisplay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: '8px',
    marginBottom: '16px',
  },
  timeText: {
    fontSize: '64px',
    fontWeight: '800',
    color: '#3b82f6',
    fontFamily: "'Courier New', monospace",
    letterSpacing: '2px',
  },
  secondText: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#94a3b8',
    fontFamily: "'Courier New', monospace",
  },
  weekDay: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#f1f5f9',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: '8px 16px',
    borderRadius: '12px',
    display: 'inline-block',
  },
  logoCard: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'fadeIn 0.6s ease-out 0.5s both',
  },
  logoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  logoTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#f1f5f9',
    margin: 0,
    letterSpacing: '0.5px',
  },
  logoContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    minHeight: '120px',
  },
  logoPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  logoText: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#3b82f6',
    letterSpacing: '2px',
  },
  logoSubtext: {
    fontSize: '30px',
    color: '#94a3b8',
    textAlign: 'center',
  },
  logoImage: {
    maxWidth: '100%',
    maxHeight: '320px',
    objectFit: 'contain',
  },
  logoInfo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '10px',
  },
  versionInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  },
  versionLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: '4px',
  },
  versionValue: {
    fontSize: '16px',
    color: '#f1f5f9',
    fontWeight: '700',
    fontFamily: "'Courier New', monospace",
  },
  statusInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(34, 197, 94, 0.2)',
  },
  statusLabel: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: '4px',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    backgroundColor: '#22c55e',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  statusText: {
    fontSize: '14px',
    color: '#22c55e',
    fontWeight: '600',
  },
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: '16px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  footerContent: {
    maxWidth: '1800px',
    margin: '0 auto',
    width: '100%',
    textAlign: 'center',
  },
  footerText: {
    fontSize: '14px',
    color: '#94a3b8',
  },
  logoCard: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'fadeIn 0.6s ease-out 0.5s both',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
  },
  
  logoContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    width: '100%',
  },

  
  logoMessage: {
    fontSize: '18px',
    color: 'gray',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    textAlign: 'center',
    fontWeight: '800',
    marginTop: '8px',
    letterSpacing: '0.5px',
  },
  
  socialContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '12px',
    padding: '10px 16px',
    borderRadius: '12px',
    width: '100%',
  },
  
  instagramIcon: {
    width: '32px',
    height: '32px',
  },
  
  instagramText: {
    fontSize: '22px',
    color: '#f1f5f9',
    fontWeight: '500',
  },
  
  instagramHandle: {
    color: '#E4405F', // Cor roxa do Instagram
    fontWeight: '600',
    letterSpacing: '0.3px',
  },
};

export default Painel;