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
      const userData = decodeToken(token)
      setGuiche(userData.guiche || 'Nenhum guichê definido');
      speakFicha(response.data.numero, response.data.identPrioridade, userData.guiche); // Fala a ficha chamada
    } catch (error) {
      console.error('Erro ao buscar a última ficha chamada:', error);
    }
  };
  useEffect(() => {
    if (!lastCalledTicket || lastCalledTicket === "Nenhuma ficha chamada!") return;
  
    setBlinkCount(0); // Reinicia a contagem de piscadas
    setIsLastTicketVisible(true); // Garante que o texto começa visível
  
    const interval = setInterval(() => {
      setIsLastTicketVisible(prev => !prev); // Alterna a visibilidade
      setBlinkCount(prev => prev + 1);
    }, 500); // Pisca a cada 500ms
  
    // Para após 5 piscadas (5 mudanças de visibilidade = 2.5s)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsLastTicketVisible(true); // Garante que termina visível
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
    console.log(texto)
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR'; // Define o idioma para português do Brasil
    utterance.rate = 1; // Velocidade da fala (1 = normal)
    utterance.pitch = 1; // Tom da voz (1 = normal)
    speechSynthesis.speak(utterance); // Inicia a fala
        

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
    let eventSource = new EventSource(`${API_BASE_URL}/fichas/stream`);

    // Evento para nova ficha adicionada
    eventSource.addEventListener('newFicha', (event) => {
      const newFicha = JSON.parse(event.data);
      setNextTickets((prevTickets) => sortTickets([...prevTickets, newFicha]));
    });

    // Evento para ficha chamada
    eventSource.addEventListener('fichaChamada', (event) => {
    console.log("Nova Ficha ", event)
      const token = localStorage.getItem("jwtToken");
      const userData = decodeToken(token)
      setGuiche(userData.guiche || 'Nenhum guichê definido');
      const calledTicket = JSON.parse(event.data);
      setLastCalledTicket(formatTicketNumber(calledTicket.numero, calledTicket.identPrioridade));
      setNextTickets((prevTickets) => prevTickets.filter(ticket => ticket.idFicha !== calledTicket.idFicha));
      speakFicha(calledTicket.numero, calledTicket.identPrioridade, guiche); // Fala a ficha chamada
    });

    // Tratamento de erro e reconexão
    eventSource.onerror = (error) => {
      console.error('Erro na conexão SSE:', error);
      eventSource.close();

      // Reconecta após 5 segundos
      setTimeout(() => {
        console.log('Reconectando ao SSE...');
        eventSource = new EventSource(`${API_BASE_URL}/fichas/stream`);
      }, 1000);
    };

    return () => {
      eventSource.close(); // Fecha a conexão ao desmontar o componente
    };
  }, []);

  return (
    <div style={styles.container}>
      <Header />
      <div style={styles.grid}>
        {/* Área de vídeo */}
        <div style={styles.videoContainer}>
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1"
            title="Publicidade"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {/* Última ficha chamada */}
        <div style={styles.lastCalled}>
          <h2 style={styles.lastCalledTitle}>Última Ficha Chamada</h2>
          <p style={{
  ...styles.ticketNumber,
  opacity: isLastTicketVisible ? 1 : 0, // Fica transparente ao piscar
  transition: "opacity 0.3s ease-in-out" // Suaviza a animação
}}>
  {lastCalledTicket}
</p>
          <p style={styles.guiche}>Guichê: {guiche}</p>
        </div>

        {/* Data, Hora e Temperatura */}
        <div style={styles.info}>
          <p style={styles.infoText}>Data: {currentDateTime.toLocaleDateString()}</p>
          <p style={styles.infoText}>Hora: {currentDateTime.toLocaleTimeString()}</p>
          <p style={styles.infoText}>Temperatura: {temperature}</p>
        </div>

        {/* Próximas fichas a serem chamadas */}
        <div style={styles.nextTickets}>
          <h2 style={styles.nextTicketsTitle}>Próximas Fichas</h2>
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
  videoContainer: {
    gridColumn: '1 / 2',
    gridRow: '1 / 2',
    backgroundColor: '#333',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
  lastCalled: {
    gridColumn: '2 / 3',
    gridRow: '1 / 2',
    backgroundColor: '#2c2c2c',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  lastCalledTitle: {
    fontSize: '24px',
    marginBottom: '10px',
    color: '#4CAF50',
  },
  ticketNumber: {
    fontSize: '80px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  guiche: {
    fontSize: '24px',
    color: '#ffffff',
    marginTop: '10px',
  },
  info: {
    gridColumn: '1 / 2',
    gridRow: '2 / 3',
    backgroundColor: '#2c2c2c',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  infoText: {
    fontSize: '20px',
    margin: '10px 0',
    color: '#ffffff',
  },
  nextTickets: {
    gridColumn: '2 / 3',
    gridRow: '2 / 3',
    backgroundColor: '#2c2c2c',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
  },
  nextTicketsTitle: {
    fontSize: '24px',
    marginBottom: '10px',
    color: '#4CAF50',
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