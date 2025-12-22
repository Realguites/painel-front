import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import config from '../config/config';
import Header from '../others/Header';
import { decodeToken } from "react-jwt";
import Carrossel from '../others/Carrossel';

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
  
  // NOVO: Histórico das últimas fichas chamadas
  const [recentTickets, setRecentTickets] = useState([]);
  
  const { API_BASE_URL } = config;
  const audioContextRef = useRef(null);
  const audioCacheRef = useRef(null);

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

  // ================= FUNÇÕES DE HISTÓRICO =================
  
  // Carregar histórico do localStorage
  const loadRecentTickets = () => {
    try {
      const stored = localStorage.getItem('recentTickets');
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentTickets(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico do localStorage:', error);
    }
  };

  // Salvar histórico no localStorage
  const saveRecentTickets = (tickets) => {
    try {
      localStorage.setItem('recentTickets', JSON.stringify(tickets));
    } catch (error) {
      console.error('Erro ao salvar histórico no localStorage:', error);
    }
  };

  // Adicionar ficha ao histórico (com verificação de duplicação)
  const addToRecentTickets = (ticket) => {
    if (!ticket || !ticket.idFicha) {
      console.log('Ticket inválido para histórico');
      return;
    }

    setRecentTickets(prev => {
      // Verificar se já existe (evitar duplicação)
      const exists = prev.some(t => t.idFicha === ticket.idFicha);
      if (exists) {
        console.log(`Ticket ${ticket.idFicha} já está no histórico, ignorando...`);
        return prev;
      }

      // Criar novo array com a nova ficha no início
      const newRecent = [
        {
          idFicha: ticket.idFicha,
          numero: ticket.numero,
          prioridade: ticket.identPrioridade,
          guiche: ticket.usuarioQueChamou?.guiche || '-',
          usuario: ticket.usuarioQueChamou?.nome || 'Operador',
          data: new Date().toISOString(),
          usuarioFoto: ticket.usuarioQueChamou?.foto || null
        },
        ...prev.slice(0, 4) // Manter apenas as últimas 5
      ];

      // Salvar no localStorage
      saveRecentTickets(newRecent);
      return newRecent;
    });
  };

  // Limpar histórico
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

  // Função para processar o usuário que chamou a ficha - COM FOTO DO JSON
  const processCalledByUser = (usuarioData) => {
    if (!usuarioData) return null;
    
    let fotoUrl = null;
    
    if (usuarioData.foto && typeof usuarioData.foto === 'string') {
      try {
        if (usuarioData.foto.startsWith('data:image')) {
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

  // Função auxiliar para formatar tipo de usuário
  const formatUserType = (tipo) => {
    const tipos = {
      'GERENTE': 'Gerente',
      'FUNCIONARIO': 'Funcionário',
      'MANAGER': 'Manager',
      'ADMIN': 'Administrador'
    };
    return tipos[tipo] || tipo;
  };

  // ================= FUNÇÕES DE SOM =================
  
  const initAudioContext = () => {
    try {
      if (!audioContextRef.current && (window.AudioContext || window.webkitAudioContext)) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (error) {
      console.error('Erro ao inicializar AudioContext:', error);
    }
  };

  const playNotificationSound = async (ticketData = null) => {
    if (!soundPermission) {
      showVisualNotification(ticketData);
      return;
    }

    try {
      const audio = new Audio(`${API_BASE_URL}/api/audio/notification`);
      audio.play();
      
      if (ticketData) {
        showVisualNotification(ticketData);
      }
    } catch (error) {
      playFallbackBeep();
      if (ticketData) {
        showVisualNotification(ticketData);
      }
    }
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
      'ATPVE': 'AT/PE'
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

  // Buscar última ficha chamada - ATUALIZADA
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

  // Formatadores
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

    return () => {
      clearInterval(timer);
      clearInterval(weatherInterval);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!userLoading) {
      fetchLastCalledTicket();
      fetchNextTickets();
    }
  }, [userLoading, currentUser]);

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
        const calledTicket = JSON.parse(event.data);
        
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

        // ADICIONAR AO HISTÓRICO (com verificação de duplicação)
        addToRecentTickets(calledTicket);

        playNotificationSound(ticketInfo);
      });

      eventSource.onerror = (error) => {
        console.error('Erro SSE:', error);
        eventSource.close();
        
        setReconnectAttempts(prev => prev + 1);
        reconnectTimeout = setTimeout(() => {
          console.log('Reconectando SSE...');
          connectToSSE();
        }, 1000);
      };
    };

    if (!userLoading) {
      connectToSSE();
    }

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [soundPermission, userLoading, currentUser]);

  // ================= RENDER =================
  
  return (
    <div style={styles.container}>
      <Header />
      
      <div style={styles.soundControl}>
        <button
          onClick={() => setSoundPermission(!soundPermission)}
          style={{
            ...styles.soundButton,
            backgroundColor: soundPermission ? '#4CAF50' : '#f44336'
          }}
          title={soundPermission ? "Clique para desativar som" : "Clique para ativar som"}
        >
          {soundPermission ? '🔊 Som Ativado' : '🔇 Som Desativado'}
        </button>
        <button
          onClick={() => playNotificationSound()}
          style={styles.testSoundButton}
          title="Testar som de notificação"
        >
          🔊 Testar Som
        </button>
      </div>
      
      <div style={styles.content}>
        <div style={styles.mainSection}>
          <div style={styles.ticketCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>ATENDIMENTO ATUAL</h2>
              
              <div style={styles.userInfoContainer}>
                {userLoading ? (
                  <div style={styles.userLoading}>
                    <div style={styles.spinner}></div>
                    <span>Carregando...</span>
                  </div>
                ) : (
                  <div style={styles.userBadge}>
                    <div style={styles.userPhotoContainer}>
                      {currentUser.foto ? (
                        <img 
                          src={currentUser.foto} 
                          alt={currentUser.nome}
                          style={styles.userPhoto}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.nextElementSibling;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div style={{
                        ...styles.userPhotoPlaceholder,
                        display: !currentUser.foto ? 'flex' : 'none'
                      }}>
                        <span style={styles.userInitial}>
                          {currentUser.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={styles.userDetails}>
                      <span style={styles.userName}>{currentUser.nome}</span>
                      <span style={styles.userRole}>
                        {formatUserType(currentUser.tipoUsuario)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
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
                        <div style={styles.userCardBadge}>
                          <span style={styles.userCardRole}>
                            {formatUserType(lastCalledTicket.usuarioQueChamou.tipoUsuario)}
                          </span>
                        </div>
                        <div style={styles.userCardMeta}>
                          <span style={styles.userCardMetaItem}>
                            <span style={styles.metaIcon}>📍</span>
                            Guichê {lastCalledTicket.usuarioQueChamou.guiche}
                          </span>
                          {lastCalledTicket.usuarioQueChamou.email && (
                            <span style={styles.userCardMetaItem}>
                              <span style={styles.metaIcon}>✉️</span>
                              {lastCalledTicket.usuarioQueChamou.email}
                            </span>
                          )}
                        </div>
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

            <div style={styles.infoBar}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Última atualização:</span>
                <span style={styles.infoValue}>{formatDateTime(currentDateTime)}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Total na fila:</span>
                <span style={styles.infoValue}>
                  {ticketCounts.NORMAL + ticketCounts.PRIORITARIO + ticketCounts.ATPVE} fichas
                </span>
              </div>
              {lastCalledTicket.usuarioQueChamou && (
                <div style={styles.infoItem}>
                  <span style={styles.infoLabel}>Operador ativo:</span>
                  <span style={styles.infoValue}>{lastCalledTicket.usuarioQueChamou.nome}</span>
                </div>
              )}
            </div>
          </div>

          {/* HISTÓRICO DE ULTIMAS FICHAS CHAMADAS */}
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
                {recentTickets.length > 0 && (
                  <button
                    onClick={clearRecentTickets}
                    style={styles.clearHistoryButton}
                    title="Limpar histórico"
                  >
                    🗑️ Limpar
                  </button>
                )}
              </div>
            </div>
            
            <div style={styles.recentTicketsList}>
              {recentTickets.length > 0 ? (
                recentTickets.map((ticket, index) => (
                  <div key={ticket.idFicha} style={styles.recentTicketItem}>
                    <div style={styles.recentTicketNumber}>
                      <span style={styles.ticketPrefix}>
                        {getPriorityPrefix(ticket.prioridade)}
                      </span>
                      <span style={styles.ticketNum}>
                        {ticket.numero.toString().padStart(3, '0')}
                      </span>
                    </div>
                    
                    <div style={styles.recentTicketInfo}>
                      <div style={styles.recentTicketMeta}>
                        <span style={styles.recentTicketGuiche}>
                          Guichê: {ticket.guiche}
                        </span>
                        <span style={styles.recentTicketTime}>
                          {formatRelativeTime(ticket.data)}
                        </span>
                      </div>
                      
                      <div style={styles.recentTicketUser}>
                        {ticket.usuarioFoto ? (
                          <img 
                            src={ticket.usuarioFoto} 
                            alt={ticket.usuario}
                            style={styles.recentUserPhoto}
                          />
                        ) : (
                          <div style={styles.recentUserInitial}>
                            {ticket.usuario.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span style={styles.recentUserName}>
                          {ticket.usuario}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{
                      ...styles.recentTicketBadge,
                      backgroundColor: getPriorityColor(ticket.prioridade)
                    }}>
                      <span style={styles.priorityText}>
                        {getPriorityLabel(ticket.prioridade)}
                      </span>
                    </div>
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

          {/* CARROSSEL DE MÍDIA */}
          <div style={styles.mediaSection}>
            <div style={styles.mediaHeader}>
              <h3 style={styles.mediaTitle}>INFORMAÇÕES E PUBLICIDADE</h3>
              <span style={styles.mediaCounter}>1/{midias.length}</span>
            </div>
            <div style={styles.carouselContainer}>
              <Carrossel midias={midias} />
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={styles.sidebar}>
          {/* PREVISÃO DO TEMPO */}
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
                    <span style={styles.detailValueLarge}>{weatherData.wind.speed} m/s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RELÓGIO E DATA */}
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
        </div>
      </div>

      {/* RODAPÉ */}
      <div style={styles.footer}>
        <div style={styles.footerContent}>
          <span style={styles.footerText}>
            Sistema de Atendimento • {formatDateTime(currentDateTime).split(',')[0]} • 
            Conectado via SSE • {reconnectAttempts > 0 ? `(${reconnectAttempts} reconexões)` : 'Conexão estável'} •
            Som: {soundPermission ? 'Ativado' : 'Desativado'} •
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
    width: '100px',
    height: '100px',
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
  // HISTÓRICO DE ULTIMAS FICHAS
  recentTicketsCard: {
    backgroundColor: '#1e293b',
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    animation: 'fadeIn 0.6s ease-out',
  },
  recentTicketsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  recentTicketsTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#f1f5f9',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  historyIcon: {
    fontSize: '20px',
  },
  recentTicketsControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  recentTicketsCount: {
    fontSize: '14px',
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '4px 12px',
    borderRadius: '12px',
  },
  clearHistoryButton: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  recentTicketsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  recentTicketItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: '16px',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    borderLeft: '4px solid transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      transform: 'translateX(5px)',
    },
  },
  recentTicketNumber: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '70px',
  },
  ticketPrefix: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: '2px',
  },
  ticketNum: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#f1f5f9',
    fontFamily: "'Courier New', monospace",
  },
  recentTicketInfo: {
    flex: 1,
    marginLeft: '16px',
  },
  recentTicketMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  recentTicketGuiche: {
    fontSize: '13px',
    color: '#94a3b8',
    fontWeight: '500',
  },
  recentTicketTime: {
    fontSize: '12px',
    color: '#64748b',
    fontStyle: 'italic',
  },
  recentTicketUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  recentUserPhoto: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid #3b82f6',
  },
  recentUserInitial: {
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
  recentUserName: {
    fontSize: '14px',
    color: '#f1f5f9',
    fontWeight: '500',
  },
  recentTicketBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    minWidth: '100px',
    textAlign: 'center',
  },
  priorityText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  noRecentTickets: {
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
  },
  noRecentIcon: {
    fontSize: '40px',
    opacity: 0.5,
    marginBottom: '8px',
  },
  noRecentText: {
    fontSize: '16px',
    color: '#94a3b8',
    fontWeight: '600',
  },
  noRecentSubtext: {
    fontSize: '14px',
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
};

export default Painel;