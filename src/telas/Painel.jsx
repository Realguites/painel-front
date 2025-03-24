import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config/config';
import Header from '../others/Header';
import { isExpired, decodeToken } from "react-jwt";

function Painel() {
  const [lastCalledTicket, setLastCalledTicket] = useState('Nenhuma ficha chamada!');
  const [nextTickets, setNextTickets] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [guiche, setGuiche] = useState('-');
  const { API_BASE_URL } = config;
  const [isLastTicketVisible, setIsLastTicketVisible] = useState(true);
  const [blinkCount, setBlinkCount] = useState(0);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [weatherData, setWeatherData] = useState(null); // Estado para armazenar os dados do clima

  const API_KEY = 'c4200076a97c0a637b7c3aca46b9bc6c'; // Sua chave de API
  const cidade = 'Canguçu,BR'; // Cidade e país
  const url_previsao_tempo = `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&APPID=${API_KEY}&units=metric`;

  // Função para buscar os dados do clima
  const fetchWeatherData = async () => {
    try {
      const response = await fetch(url_previsao_tempo);
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      const data = await response.json();
      setWeatherData(data); // Armazena os dados do clima no estado
    } catch (error) {
      console.error('Erro ao buscar dados do clima:', error);
    }
  };

  // Função para buscar a última ficha chamada
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

  // Efeito de piscar para a última ficha chamada
  useEffect(() => {
    if (!lastCalledTicket || lastCalledTicket === "Nenhuma ficha chamada!") return;

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

  // Função para buscar todas as fichas a serem chamadas
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

  // Função para formatar o número do ticket
  const formatTicketNumber = (numero, prioridade) => {
    const formattedNumber = numero.toString().padStart(5, '0');
    return prioridade === 'PRIORITARIO' ? `P${formattedNumber}` : `N${formattedNumber}`;
  };

  // Função para ordenar as fichas (prioritárias primeiro)
  const sortTickets = (tickets) => {
    const priorityTickets = tickets.filter(ticket => ticket.identPrioridade === 'PRIORITARIO');
    const normalTickets = tickets.filter(ticket => ticket.identPrioridade === 'NORMAL');
    return [...priorityTickets, ...normalTickets];
  };

  // Função para falar a ficha e o guichê
  const speakFicha = (numero, prioridade, guiche) => {
    const texto = `Ficha, ${formatTicketNumber(numero, prioridade)}, guichê ${guiche}`;
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 1;
    utterance.pitch = 1;
    speechSynthesis.speak(utterance);
  };
// Função para formatar a data e hora no formato DD/MM/YYYY HH:MM (GMT -3.0)
const formatDateTime = (date) => {
  const options = {
    timeZone: 'America/Sao_Paulo', // Fuso horário GMT -3.0 (Brasília)
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // Formato 24 horas
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

  // Busca a última ficha chamada e as próximas fichas ao carregar a tela
  useEffect(() => {
    fetchLastCalledTicket();
    fetchNextTickets();
    fetchWeatherData(); // Busca os dados do clima ao carregar a tela
  }, [guiche]);

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

  // Função para obter a URL do ícone do clima
  const iconUrl = (iconCode) => `http://openweathermap.org/img/wn/${iconCode}@2x.png`;

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.grid}>
        {/* Última ficha chamada */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Última Ficha Chamada</h2>
          <p style={{
            ...styles.ticketNumber,
            opacity: isLastTicketVisible ? 1 : 0,
            transition: "opacity 0.3s ease-in-out"
          }}>
            {lastCalledTicket}
          </p>
          <p style={styles.guiche}>Guichê: {guiche}</p>
        </div>

        {/* Temperatura, Data e Hora */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Informações</h2>
          {weatherData && (
            <>
              {/* Ícone e Descrição do Clima */}
              <div style={styles.weatherIconContainer}>
                <img
                  src={iconUrl(weatherData.weather[0].icon)}
                  alt={weatherData.weather[0].description}
                  style={styles.weatherIcon}
                />
                <p style={styles.tempText}>
                {Math.round(weatherData.main.temp)}°C
              </p>
              </div>

              
              {/* Data e Hora */}
              <p style={styles.timeText}>{formatDateTime(currentDateTime).split(',')[0]}</p>
              <p style={styles.timeText}>{formatDateTime(currentDateTime).split(' ')[1]}</p>

              {/* Sensação Térmica */}
              <p style={styles.infoText}>
                Sensação Térmica: {weatherData.main.feels_like}°C
              </p>

              {/* Umidade */}
              <p style={styles.infoText}>Umidade: {weatherData.main.humidity}%</p>

            </>
          )}
        </div>

        {/* Próximas fichas a serem chamadas */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Próximas Fichas</h2>
          <ul style={styles.ticketList}>
            {nextTickets.length > 0 ? (
              nextTickets.slice(0, 5).map((ticket, index) => (
                <li key={index} style={styles.ticketItem}>
                  {formatTicketNumber(ticket.numero, ticket.identPrioridade)}
                </li>
              ))
            ) : (
              <li style={styles.ticketItem}>Nenhuma ficha na fila</li>
            )}
          </ul>
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
    backgroundColor: '#1e1e1e',
    minHeight: '100vh',
    padding: '20px',
    color: '#ffffff',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'auto auto',
    gap: '20px',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#2c2c2c',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: '24px',
    marginBottom: '20px',
    color: '#4CAF50',
  },
  ticketNumber: {
    fontSize: '130px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: '20px 0',
  },
  guiche: {
    fontSize: '40px',
    color: '#ffffff',
    marginTop: '10px',
  },
  weatherIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  weatherIcon: {
    width: '200px',
    height: '200px',
    marginRight: '10px',
  },
  weatherDescription: {
    fontSize: '18px',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  infoText: {
    fontSize: '25px',
    margin: '10px 0',
    color: '#ffffff',
  },

  timeText: {
    fontSize: '50px',
    margin: '10px 0',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  tempText: {
    fontSize: '100px',
    margin: '10px 0',
    color: '#ffffff',
  },
  ticketList: {
    listStyle: 'none',
    padding: '0',
    margin: '0',
  },
  ticketItem: {
    fontSize: '24px',
    margin: '10px 0',
    padding: '10px',
    backgroundColor: '#333',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
};

export default Painel;