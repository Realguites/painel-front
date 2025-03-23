import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config/config';
import Header from '../others/Header';
import { isExpired, decodeToken } from "react-jwt";

function Painel() {
  const [lastCalledTicket, setLastCalledTicket] = useState('Nenhuma ficha chamada!');
  const [nextTickets, setNextTickets] = useState([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [temperature, setTemperature] = useState('--°C');
  const [guiche, setGuiche] = useState('-');
  const { API_BASE_URL } = config;
  const [isLastTicketVisible, setIsLastTicketVisible] = useState(true);
  const [blinkCount, setBlinkCount] = useState(0);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

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

  // Função para buscar a temperatura atual (exemplo usando uma API fictícia)
  const fetchTemperature = async () => {
    try {
      const response = await axios.get('https://api.temperatura.com/current');
      setTemperature(`${response.data.temperature}°C`);
    } catch (error) {
      console.error('Erro ao buscar a temperatura:', error);
    }
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
    fetchTemperature();
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
          <p style={styles.infoText}>Temperatura: {temperature}</p>
          <p style={styles.infoText}>Data: {currentDateTime.toLocaleDateString()}</p>
          <p style={styles.infoText}>Hora: {currentDateTime.toLocaleTimeString()}</p>
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
  infoText: {
    fontSize: '20px',
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