import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config/config';
import Header from '../others/Header';
import { isExpired, decodeToken } from "react-jwt";
import Carrossel from '../others/Carrossel';

function Painel() {
  const [lastCalledTicket, setLastCalledTicket] = useState(' - ');
  const [nextTickets, setNextTickets] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [guiche, setGuiche] = useState('-');
  const { API_BASE_URL } = config;
  const [isLastTicketVisible, setIsLastTicketVisible] = useState(true);
  const [blinkCount, setBlinkCount] = useState(0);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [weatherData, setWeatherData] = useState(null);

  const API_KEY = 'c4200076a97c0a637b7c3aca46b9bc6c';
  const cidade = 'Canguçu,BR';
  const url_previsao_tempo = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&APPID=${API_KEY}&units=metric`;

  const midias = [
    {
      url: 'https://i.pinimg.com/originals/06/ec/d0/06ecd0afe6a0c76d51f943b5321fb318.gif',
      tipo: 'imagem',
    },
    {
      url: 'https://static.wixstatic.com/media/06f338_84ec404210a240d58ab5aa62ffab6f06~mv2.gif/v1/fill/w_280,h_151,q_90,enc_avif,quality_auto/06f338_84ec404210a240d58ab5aa62ffab6f06~mv2.gif',
      tipo: 'imagem',
    },
    {
      url: 'https://i.gifer.com/X15M.gif',
      tipo: 'imagem',
    },
    {
      url: 'https://static.wixstatic.com/media/06f338_84ec404210a240d58ab5aa62ffab6f06~mv2.gif/v1/fill/w_280,h_151,q_90,enc_avif,quality_auto/06f338_84ec404210a240d58ab5aa62ffab6f06~mv2.gif',
      tipo: 'imagem',
    }
  ];

  const fetchWeatherData = async () => {
    try {
      console.log('🔄 Atualizando dados do clima...');
      const response = await fetch(url_previsao_tempo);
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      const data = await response.json();
      setWeatherData(data);
      console.log('✅ Dados do clima atualizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao buscar dados do clima:', error);
    }
  };

  const fetchLastCalledTicket = async () => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/fichas/ultimaChamada`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setLastCalledTicket(formatTicketNumber(response.data.numero, response.data.identPrioridade));
      const userData = decodeToken(token);
      setGuiche(userData.guiche || 'Nenhum guichê definido');
      speakFicha(response.data.numero, response.data.identPrioridade, userData.guiche);
    } catch (error) {
      console.error('Erro ao buscar a última ficha chamada:', error);
    }
  };

  useEffect(() => {
    if (!lastCalledTicket || lastCalledTicket === " - ") return;

    setBlinkCount(0);
    setIsLastTicketVisible(true);

    const interval = setInterval(() => {
      setIsLastTicketVisible((prev) => !prev);
      setBlinkCount((prev) => prev + 1);
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsLastTicketVisible(true);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [lastCalledTicket]);

  const fetchNextTickets = async () => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/fichas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNextTickets(sortTickets(response.data));
    } catch (error) {
      console.error('Erro ao buscar as fichas:', error);
    }
  };

  const formatTicketNumber = (numero, prioridade) => {
    const formattedNumber = numero.toString().padStart(5, '0');
    return prioridade === 'PRIORITARIO' ? `P${formattedNumber}` : `N${formattedNumber}`;
  };

  const sortTickets = (tickets) => {
    const priorityTickets = tickets.filter(ticket => ticket.identPrioridade === 'PRIORITARIO');
    const normalTickets = tickets.filter(ticket => ticket.identPrioridade === 'NORMAL');
    return [...priorityTickets, ...normalTickets];
  };

  const speakFicha = (numero, prioridade, guiche) => {
    const ticketFormatado = formatTicketNumber(numero, prioridade);
    
    // Texto formatado para uma fala mais natural
    const texto = `Ficha ${ticketFormatado}, dirija-se ao guichê ${guiche}`;
    
    // Criar utterance
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; // Velocidade um pouco mais lenta para melhor compreensão
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Tentar usar voz do Google se disponível
    const voices = speechSynthesis.getVoices();
    
    // Procurar por vozes em português do Brasil com qualidade do Google
    const googleVoice = voices.find(voice => 
      voice.lang.includes('pt-BR') && 
      (
        voice.name.includes('Google') || 
        voice.name.includes('Natural') || 
        voice.name.includes('Premium') ||
        voice.voiceURI.includes('google')
      )
    );

    // Se não encontrar voz do Google, usar qualquer voz em português
    const portugueseVoice = voices.find(voice => 
      voice.lang.includes('pt-BR')
    );

    // Priorizar voz do Google, depois qualquer voz em português
    if (googleVoice) {
      utterance.voice = googleVoice;
      console.log('🎤 Usando voz do Google:', googleVoice.name);
    } else if (portugueseVoice) {
      utterance.voice = portugueseVoice;
      console.log('🎤 Usando voz em português:', portugueseVoice.name);
    } else {
      console.log('🎤 Usando voz padrão do sistema');
    }

    // Eventos para debug
    utterance.onstart = () => {
      console.log('🔊 Iniciando fala da ficha:', texto);
    };

    utterance.onend = () => {
      console.log('✅ Fala concluída');
    };

    utterance.onerror = (event) => {
      console.error('❌ Erro na síntese de voz:', event.error);
    };

    // Parar qualquer fala anterior antes de iniciar nova
    speechSynthesis.cancel();
    
    // Pequeno delay para garantir que a fala anterior foi cancelada
    setTimeout(() => {
      speechSynthesis.speak(utterance);
    }, 100);
  };

  // Carregar vozes quando disponíveis
  useEffect(() => {
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      console.log('🗣️ Vozes disponíveis:', voices.map(v => `${v.name} (${v.lang})`));
    };

    // Carregar vozes quando estiverem disponíveis
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Carregar vozes imediatamente se já estiverem disponíveis
    loadVoices();
  }, []);

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

  // Atualiza a data e hora a cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Busca inicial dos dados
  useEffect(() => {
    fetchLastCalledTicket();
    fetchNextTickets();
    fetchWeatherData(); // Busca inicial dos dados do clima
  }, [guiche]);

  // Atualiza a previsão do tempo a cada 5 minutos (300000 ms)
  useEffect(() => {
    const weatherInterval = setInterval(() => {
      fetchWeatherData();
    }, 300000); // 5 minutos = 300000 milissegundos

    // Limpa o intervalo quando o componente for desmontado
    return () => clearInterval(weatherInterval);
  }, []);

  // Conecta ao SSE para receber atualizações em tempo real
  useEffect(() => {
    let eventSource;
    let reconnectTimeout;

    const connectToSSE = () => {
      eventSource = new EventSource(`${API_BASE_URL}/fichas/stream`);

      eventSource.addEventListener('newFicha', (event) => {
        const newFicha = JSON.parse(event.data);
        setNextTickets((prevTickets) => {
          if (!prevTickets.find(ticket => ticket.idFicha === newFicha.idFicha)) {
            return sortTickets([...prevTickets, newFicha]);
          }
          return prevTickets;
        });
      });

      eventSource.addEventListener('fichaChamada', (event) => {
        const calledTicket = JSON.parse(event.data);
        const userData = decodeToken(localStorage.getItem("jwtToken"));
        setGuiche(userData.guiche || 'Nenhum guichê definido');
        setLastCalledTicket(formatTicketNumber(calledTicket.numero, calledTicket.identPrioridade));
        setNextTickets((prevTickets) => sortTickets(prevTickets.filter(ticket => ticket.idFicha !== calledTicket.idFicha)));
        speakFicha(calledTicket.numero, calledTicket.identPrioridade, userData.guiche);
      });

      eventSource.onerror = (error) => {
        console.error('Erro na conexão SSE:', error);
        eventSource.close();

        setReconnectAttempts((prev) => prev + 1);
        reconnectTimeout = setTimeout(() => {
          console.log('Reconectando ao SSE...');
          connectToSSE();
        }, 1000);
      };
    };

    connectToSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [reconnectAttempts]);

  const iconUrl = (iconCode) => `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

  return (
    <div style={styles.container}>

      <div style={styles.grid}>
        {/* Última ficha chamada - Card Principal */}
        <div style={styles.mainCard}>
          <div style={styles.cardHeader}>
            <h2 style={styles.mainCardTitle}>Última Ficha Chamada</h2>
            <div style={styles.guicheBadge}>
              Guichê: <span style={styles.guicheNumber}>{guiche}</span>
            </div>
          </div>
          
          <div style={styles.ticketDisplay}>
            <p style={{
              ...styles.ticketNumber,
              opacity: isLastTicketVisible ? 1 : 0,
              transition: "opacity 0.3s ease-in-out"
            }}>
              {lastCalledTicket}
            </p>
          </div>

          <div style={styles.carouselContainer}>
            <Carrossel midias={midias} />
          </div>
        </div>

        {/* Informações do Clima e Tempo */}
        <div style={styles.sidebar}>
          <div style={styles.weatherCard}>
            <h2 style={styles.cardTitle}>Previsão do Tempo</h2>
            {weatherData && (
              <div style={styles.weatherContent}>
                <div style={styles.citySection}>
                  <p style={styles.cityText}>Canguçu, RS</p>
                  <small style={styles.updateInfo}>Atualiza a cada 5 min</small>
                </div>
                <div style={styles.weatherMain}>
                  <img
                    src={iconUrl(weatherData.weather[0].icon)}
                    alt={weatherData.weather[0].description}
                    style={styles.weatherIcon}
                  />
                  <div style={styles.weatherTemp}>
                    <p style={styles.tempText}>{Math.round(weatherData.main.temp)}°C</p>
                    <p style={styles.weatherDescription}>
                      {weatherData.weather[0].description}
                    </p>
                  </div>
                </div>
                
                <div style={styles.weatherDetails}>
                  <div style={styles.weatherDetail}>
                    <span style={styles.detailLabel}>Sensação Térmica</span>
                    <span style={styles.detailValue}>{Math.round(weatherData.main.feels_like)}°C</span>
                  </div>
                  <div style={styles.weatherDetail}>
                    <span style={styles.detailLabel}>Umidade</span>
                    <span style={styles.detailValue}>{weatherData.main.humidity}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data e Hora */}
          <div style={styles.timeCard}>
            <div style={styles.dateSection}>
              <p style={styles.dateText}>{formatDateTime(currentDateTime).split(',')[0]}</p>
            </div>
            <div style={styles.timeSection}>
              <p style={styles.timeText}>{formatDateTime(currentDateTime).split(' ')[1]}</p>
            </div>
          </div>

          {/* Próximas fichas */}
          <div style={styles.ticketsCard}>
            <h2 style={styles.cardTitle}>Próximas Fichas</h2>
            <div style={styles.ticketList}>
              {nextTickets.length > 0 ? (
                nextTickets.slice(0, 5).map((ticket, index) => (
                  <div 
                    key={index} 
                    style={{
                      ...styles.ticketItem,
                      backgroundColor: ticket.identPrioridade === 'PRIORITARIO' ? '#ff9e80' : '#81d4fa'
                    }}
                  >
                    <span style={styles.ticketType}>
                      {ticket.identPrioridade === 'PRIORITARIO' ? 'P' : 'N'}
                    </span>
                    {formatTicketNumber(ticket.numero, ticket.identPrioridade)}
                  </div>
                ))
              ) : (
                <div style={styles.emptyTickets}>
                  Nenhuma ficha na fila
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    padding: '20px',
    color: '#334155',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '24px',
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  mainCard: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  mainCardTitle: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  guicheBadge: {
    backgroundColor: '#3b82f6',
    padding: '12px 24px',
    borderRadius: '25px',
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
  },
  guicheNumber: {
    fontSize: '26px',
    fontWeight: '700',
  },
  ticketDisplay: {
    backgroundColor: '#1e293b',
    padding: '40px',
    borderRadius: '15px',
    border: '2px solid #334155',
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketNumber: {
    fontSize: '120px',
    fontWeight: '900',
    color: '#ffffff',
    margin: 0,
    textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
  },
  carouselContainer: {
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    padding: '10px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  weatherCard: {
    backgroundColor: '#ffffff',
    padding: '25px',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  timeCard: {
    backgroundColor: '#ffffff',
    padding: '25px',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
  },
  ticketsCard: {
    backgroundColor: '#ffffff',
    padding: '25px',
    borderRadius: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e2e8f0',
  },
  cardTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '20px',
    textAlign: 'center',
  },
  weatherContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  citySection: {
    textAlign: 'center',
    marginBottom: '10px',
  },
  cityText: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#3b82f6',
    margin: '0 0 5px 0',
  },
  updateInfo: {
    fontSize: '12px',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  weatherMain: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
  },
  weatherIcon: {
    width: '100px',
    height: '100px',
  },
  weatherTemp: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  tempText: {
    fontSize: '48px',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  weatherDescription: {
    fontSize: '18px',
    color: '#64748b',
    textTransform: 'capitalize',
    margin: 0,
  },
  weatherDetails: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '15px',
  },
  weatherDetail: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
  },
  dateSection: {
    marginBottom: '15px',
  },
  dateText: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  timeSection: {
    backgroundColor: '#f1f5f9',
    padding: '15px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  timeText: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#3b82f6',
    margin: 0,
    fontFamily: 'monospace',
  },
  ticketList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  ticketItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '18px',
    borderRadius: '12px',
    fontSize: '22px',
    fontWeight: '600',
    color: '#1e293b',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s ease',
  },
  ticketType: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: '6px 10px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
  },
  emptyTickets: {
    textAlign: 'center',
    padding: '30px',
    color: '#94a3b8',
    fontSize: '18px',
    fontStyle: 'italic',
  },
};

export default Painel;