import React, { useEffect, useState } from 'react';
import Header from '../others/Header';
import config from '../config/config';
import axios from 'axios';

function CallNextTicket() {
  const [ticketNumber, setTicketNumber] = useState('Nenhuma ficha chamada!');
  const [guiche, setGuiche] = useState('Nenhum Guichê definido!');
  const [nextTickets, setNextTickets] = useState([]);
  const [ticketsOriginais, setTicketsOriginais] = useState([]);
  const { API_BASE_URL } = config;
  const [isBlinking, setIsBlinking] = useState(false);
  const [highlightedTicket, setHighlightedTicket] = useState(null);

  const handleNextTicket = async () => {
    const nextTicket = nextTickets.shift(); // Remove o próximo ticket da fila
   
      await sendTicketToAPI(nextTicket);
      await fetchFichas();
      // Verifica se o número de tickets restantes é menor que 10 e busca mais fichas se necessário
      if (nextTickets.length < 10) {
        //await fetchMoreFichas();
      }
    //}
  };

  const sendTicketToAPI = async () => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.post(`${API_BASE_URL}/fichas/chamar`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then((e)=>{
        console.log(e)
        setTicketNumber(formatTicketNumber(e.data.numero, e.data.identPrioridade)); // Mostra o número formatado ao usuário
        setIsBlinking(true)
      });
      //console.log('Ticket enviado com sucesso:', response.data);
    } catch (error) {
      console.error('Erro ao enviar o ticket:', error);
    }
  };

  const handleUnauthorized = () => {
    window.location.href = "/login";
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

  const addNewTicket = (newFicha) => {
    const updatedTickets = sortTickets([...nextTickets, newFicha]);
    setNextTickets(updatedTickets); // Atualiza e reordena a fila com o novo ticket
    setHighlightedTicket(newFicha); // Destaca o novo ticket
  };

  useEffect(() => {
    if (isBlinking) {
      let blinkCount = 0;
      const blinkInterval = setInterval(() => {
        blinkCount += 1;
        setIsBlinking((prev) => !prev);

        if (blinkCount >= 5) {
          clearInterval(blinkInterval);
          setIsBlinking(false);
        }
      }, 300);

      return () => clearInterval(blinkInterval);
    }
  }, [ticketNumber, isBlinking]);

  useEffect(() => {
    if (highlightedTicket) {
      const timeout = setTimeout(() => {
        setHighlightedTicket(null);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [highlightedTicket]);

  // Inicializando o EventSource (SSE) para receber novas fichas da API
  useEffect(() => {
    const connectToSSE = () => {
        const eventSource = new EventSource(`${API_BASE_URL}/fichas/stream`);

        eventSource.addEventListener('newFicha', (event) => {
          const newFicha = JSON.parse(event.data);  
          if(!ticketsOriginais.find(obj=> obj.idFicha === newFicha.idFicha)){
              console.log('Nova ficha recebida:', newFicha);
              ticketsOriginais.push(newFicha)
              addNewTicket(newFicha); // Adiciona e ordena a nova ficha na fila
            }
        });

        eventSource.onerror = (error) => {
            console.error('Erro na conexão SSE:', error);
            eventSource.close(); // Fecha a conexão em caso de erro

            // Tenta reconectar após 5 segundos
            setTimeout(() => {
                console.log('Tentando reconectar ao SSE...');
                connectToSSE();
            }, 5000);
        };

        return eventSource;
    };

    const eventSource = connectToSSE();

    return () => {
        eventSource.close(); // Fecha a conexão ao desmontar o componente
    };
}, [nextTickets]); // Atualiza sempre que o estado nextTickets mudar

  const fetchFichas = async () => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/fichas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const fetchedFichas = response.data;
      setNextTickets(sortTickets(fetchedFichas)); // Armazena objetos completos e ordena a fila
      setTicketsOriginais(sortTickets(fetchedFichas))
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
      } else {
        console.error('Erro ao buscar fichas:', error);
      }
    }
  };

  const fetchMoreFichas = async () => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/fichas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const fetchedFichas = response.data;
      const updatedTickets = sortTickets([...nextTickets, ...fetchedFichas]); // Adiciona as novas fichas à fila existente e reordena
      setNextTickets(updatedTickets); // Atualiza a lista de tickets
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
      } else {
        console.error('Erro ao buscar fichas:', error);
      }
    }
  };

  // Chama a API para buscar fichas ao carregar a página
  useEffect(() => {
    fetchFichas();
  }, []);

  return (
    <div style={styles.container}>
      <Header />
      <h1 style={{
        ...styles.ticket,
        opacity: isBlinking ? 0 : 1,
      }}>
        {ticketNumber}
      </h1>
      <h2 style={styles.guiche}>{guiche}</h2>
      <button style={styles.button} onClick={handleNextTicket}>
        Chamar o Próximo
      </button>
      <h3 style={styles.subHeader}>Próximos a serem chamados: ({nextTickets.length} na fila)</h3>
      <ul style={styles.nextTickets}>
        {nextTickets.length > 0 ? (
          nextTickets.slice(0, 10).map((ticket, index) => (
            <li
              key={index}
              style={{
                ...styles.ticketItem,
                border: highlightedTicket === ticket ? '2px solid green' : 'none'
              }}
            >
              {formatTicketNumber(ticket.numero, ticket.identPrioridade)} {/* Mostra o número formatado */}
            </li>
          ))
        ) : (
          <li style={styles.ticketItem}>Nenhum próximo ticket</li>
        )}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f5f5f5',
  },
  ticket: {
    fontSize: '64px',
    color: '#333',
    fontWeight: 'bold',
    transition: 'opacity 0.3s ease',
  },
  guiche: {
    fontSize: '40px',
    color: '#666',
    marginBottom: '20px',
  },
  button: {
    fontSize: '24px',
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  subHeader: {
    fontSize: '32px',
    color: '#333',
  },
  nextTickets: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '16px',
    padding: '20px',
    maxWidth: '100%',
    margin: '0 auto',
    boxSizing: 'border-box',
    listStyleType: 'none',
  },
  ticketItem: {
    flex: '1 1 calc(33.33% - 16px)',
    padding: '15px 20px',
    backgroundColor: '#ffffff',
    marginBottom: '12px',
    borderRadius: '12px',
    fontSize: '24px',
    color: '#333',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    minWidth: '220px',
    maxWidth: '320px',
  },
};

export default CallNextTicket;
