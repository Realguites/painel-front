import React, { useEffect, useState, useRef } from 'react';
import Header from '../others/Header';
import config from '../config/config';
import axios from 'axios';

function CallNextTicket() {
  const [tickets, setTickets] = useState({
    NORMAL: null,
    PRIORITARIO: null,
    ATPVE: null
  });
  const [lastCalledTickets, setLastCalledTickets] = useState({
    NORMAL: null,
    PRIORITARIO: null,
    ATPVE: null
  });
  const [lastCalledIds, setLastCalledIds] = useState({
    NORMAL: null,
    PRIORITARIO: null,
    ATPVE: null
  });
  const [ticketCounts, setTicketCounts] = useState({
    NORMAL: 0,
    PRIORITARIO: 0,
    ATPVE: 0
  });
  const [guiche, setGuiche] = useState('Nenhum Guichê definido!');
  const [nextTickets, setNextTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [ticketsOriginais, setTicketsOriginais] = useState([]);
  const { API_BASE_URL } = config;
  const [isBlinking, setIsBlinking] = useState(false);
  const [highlightedTicket, setHighlightedTicket] = useState(null);
  const [activePriority, setActivePriority] = useState(null);
  const [loadingStates, setLoadingStates] = useState({
    NORMAL: false,
    PRIORITARIO: false,
    ATPVE: false,
    REPEAT: false
  });
  const [activeFilters, setActiveFilters] = useState({
    NORMAL: false,
    PRIORITARIO: false,
    ATPVE: false,
    ALL: true
  });

  // Use refs para evitar dependências cíclicas no useEffect do SSE
  const nextTicketsRef = useRef([]);
  const ticketsOriginaisRef = useRef([]);
  const activeFiltersRef = useRef(activeFilters);
  const filteredTicketsRef = useRef([]);

  // Carregar histórico do localStorage ao iniciar
  useEffect(() => {
    const savedHistory = localStorage.getItem('ticketHistory');
    const savedIds = localStorage.getItem('ticketIdHistory');
    
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setLastCalledTickets(history);
      } catch (error) {
        console.error('Erro ao carregar histórico do localStorage:', error);
      }
    }
    
    if (savedIds) {
      try {
        const ids = JSON.parse(savedIds);
        setLastCalledIds(ids);
      } catch (error) {
        console.error('Erro ao carregar IDs do localStorage:', error);
      }
    }
  }, []);

  // Atualizar refs quando os estados mudarem
  useEffect(() => {
    nextTicketsRef.current = nextTickets;
    ticketsOriginaisRef.current = ticketsOriginais;
    activeFiltersRef.current = activeFilters;
    filteredTicketsRef.current = filteredTickets;
  }, [nextTickets, ticketsOriginais, activeFilters, filteredTickets]);

  const handleNextTicket = async (priorityType) => {
    try {
      setLoadingStates(prev => ({ ...prev, [priorityType]: true }));
      setActivePriority(priorityType);
      
      const hasTicket = await callTicketByPriority(priorityType);
      
      if (hasTicket) {
        await fetchLastCalledTicket(priorityType);
        await fetchFichas();
      } else {
        await fetchFichas(); // Atualiza os contadores mesmo se não chamou
      }
      
      // Sempre busca a última chamada para atualizar o display
      await fetchLastCalledTicket(priorityType);
    } catch (error) {
      console.error(`Erro ao chamar ticket ${priorityType}:`, error);
    } finally {
      // Garante que o estado de loading seja resetado
      setLoadingStates(prev => ({ ...prev, [priorityType]: false }));
      setActivePriority(null);
    }
  };

  const handleRepeatLastTicket = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, REPEAT: true }));
      
      // Buscar qual foi a última ficha chamada (a mais recente)
      const lastCalledInfo = getLastCalledInfo();
      
      if (!lastCalledInfo) {
        alert('Nenhuma ficha foi chamada ainda!');
        setLoadingStates(prev => ({ ...prev, REPEAT: false }));
        return;
      }

      console.log('Repetindo última ficha chamada:', lastCalledInfo);
      
      // Chamar a ficha específica pelo ID usando o novo endpoint
      const success = await callSpecificTicketById(lastCalledInfo.id, lastCalledInfo.priority);
      
      if (success) {
        // Atualizar a última chamada
        await fetchLastCalledTicket(lastCalledInfo.priority);
        await fetchFichas();
      }
      
    } catch (error) {
      console.error('Erro ao repetir última chamada:', error);
      alert('Erro ao repetir última chamada. Tente novamente.');
    } finally {
      setLoadingStates(prev => ({ ...prev, REPEAT: false }));
    }
  };

  // NOVA FUNÇÃO: Chamar ficha específica pelo ID
  const callSpecificTicketById = async (idFicha, priorityType) => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(
        `${API_BASE_URL}/fichas/chamarNovamente/${idFicha}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 204) {
        console.log(`Ficha ${idFicha} não encontrada`);
        alert('Ficha não encontrada. Ela pode já ter sido atendida.');
        return false;
      }

      const data = response.data;
      const formattedTicket = formatTicketNumber(data.numero, data.identPrioridade);
      
      console.log('Ficha específica chamada com sucesso:', formattedTicket);
      
      // Atualizar display
      setTickets(prev => ({
        ...prev,
        [priorityType]: formattedTicket
      }));
      
      // Salvar no histórico do localStorage
      saveToHistory(priorityType, formattedTicket, idFicha);
      
      // Salvar última prioridade chamada
      localStorage.setItem('lastCalledPriority', priorityType);
      localStorage.setItem('lastCalledId', idFicha.toString());
      
      setIsBlinking(true);
      return true;
    } catch (error) {
      console.error(`Erro ao chamar ficha ${idFicha}:`, error);
      
      if (error.response) {
        if (error.response.status === 204) {
          console.log(`Ficha ${idFicha} não encontrada`);
          alert('Ficha não encontrada. Ela pode já ter sido atendida.');
          return false;
        }
        if (error.response.status === 401) {
          handleUnauthorized();
        } else {
          alert(`Erro ao chamar ficha: ${error.response.status} - ${error.response.statusText}`);
        }
      }
      return false;
    }
  };

  // Função para obter informações da última chamada
  const getLastCalledInfo = () => {
    const lastCalledPriority = localStorage.getItem('lastCalledPriority');
    const lastCalledId = localStorage.getItem('lastCalledId');
    
    if (lastCalledPriority && lastCalledId) {
      return {
        priority: lastCalledPriority,
        id: parseInt(lastCalledId),
        ticket: lastCalledTickets[lastCalledPriority]
      };
    }
    
    // Fallback: verificar qual ticket está preenchido (último chamado)
    if (tickets.NORMAL && lastCalledIds.NORMAL) {
      return {
        priority: 'NORMAL',
        id: lastCalledIds.NORMAL,
        ticket: tickets.NORMAL
      };
    }
    if (tickets.PRIORITARIO && lastCalledIds.PRIORITARIO) {
      return {
        priority: 'PRIORITARIO',
        id: lastCalledIds.PRIORITARIO,
        ticket: tickets.PRIORITARIO
      };
    }
    if (tickets.ATPVE && lastCalledIds.ATPVE) {
      return {
        priority: 'ATPVE',
        id: lastCalledIds.ATPVE,
        ticket: tickets.ATPVE
      };
    }
    
    return null;
  };

  const callTicketByPriority = async (priorityType) => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(
        `${API_BASE_URL}/fichas/chamar/${priorityType}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 204) {
        console.log(`Nenhum ticket ${priorityType} disponível`);
        showNoTicketsMessage(priorityType);
        return false;
      }

      const data = response.data;
      const formattedTicket = formatTicketNumber(data.numero, data.identPrioridade);
      
      // Atualizar display
      setTickets(prev => ({
        ...prev,
        [priorityType]: formattedTicket
      }));
      
      // Salvar no histórico do localStorage com ID
      saveToHistory(priorityType, formattedTicket, data.idFicha);
      
      // Salvar última prioridade chamada
      localStorage.setItem('lastCalledPriority', priorityType);
      localStorage.setItem('lastCalledId', data.idFicha.toString());
      
      setIsBlinking(true);
      return true;
    } catch (error) {
      console.error(`Erro ao chamar ticket ${priorityType}:`, error);
      
      if (error.response) {
        if (error.response.status === 204) {
          console.log(`Nenhum ticket ${priorityType} disponível`);
          showNoTicketsMessage(priorityType);
          return false;
        }
        if (error.response.status === 401) {
          handleUnauthorized();
        }
      }
      return false;
    }
  };

  // Salvar ticket no histórico do localStorage com ID
  const saveToHistory = (priorityType, ticketNumber, idFicha) => {
    // Atualizar estado local
    setLastCalledTickets(prev => ({
      ...prev,
      [priorityType]: ticketNumber
    }));
    
    setLastCalledIds(prev => ({
      ...prev,
      [priorityType]: idFicha
    }));
    
    // Salvar no localStorage
    const updatedHistory = {
      ...lastCalledTickets,
      [priorityType]: ticketNumber
    };
    
    const updatedIds = {
      ...lastCalledIds,
      [priorityType]: idFicha
    };
    
    localStorage.setItem('ticketHistory', JSON.stringify(updatedHistory));
    localStorage.setItem('ticketIdHistory', JSON.stringify(updatedIds));
    
    // Também salvar histórico completo
    const fullHistory = JSON.parse(localStorage.getItem('fullTicketHistory') || '[]');
    fullHistory.push({
      priority: priorityType,
      ticket: ticketNumber,
      id: idFicha,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('pt-BR'),
      time: new Date().toLocaleTimeString('pt-BR')
    });
    
    // Manter apenas os últimos 50 registros
    if (fullHistory.length > 50) {
      fullHistory.shift();
    }
    
    localStorage.setItem('fullTicketHistory', JSON.stringify(fullHistory));
  };

  const showNoTicketsMessage = (priorityType) => {
    console.log(`Não há tickets ${priorityType} na fila`);
    alert(`Não há tickets ${getPriorityLabel(priorityType)} disponíveis na fila.`);
  };

  const fetchLastCalledTicket = async (priorityType) => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(
        `${API_BASE_URL}/fichas/ultimaChamada/${priorityType}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        const data = response.data;
        const formattedTicket = formatTicketNumber(data.numero, data.identPrioridade);
        
        setTickets(prev => ({
          ...prev,
          [priorityType]: formattedTicket
        }));
        
        // Atualizar histórico com ID
        saveToHistory(priorityType, formattedTicket, data.idFicha);
      }
    } catch (error) {
      console.error(`Erro ao buscar última chamada ${priorityType}:`, error);
    }
  };

  const handleUnauthorized = () => {
    window.location.href = "/login";
  };

  const formatTicketNumber = (numero, prioridade) => {
    const formattedNumber = numero.toString().padStart(5, '0');
    const prefix = getPriorityPrefix(prioridade);
    return `${prefix}${formattedNumber}`;
  };

  const getPriorityPrefix = (priority) => {
    const prefixes = {
      'NORMAL': 'N',
      'PRIORITARIO': 'P',
      'ATPVE': 'A'
    };
    return prefixes[priority] || '';
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
    return colors[priority] || '#757575';
  };

  const sortTickets = (tickets) => {
    const priorityOrder = ['PRIORITARIO', 'ATPVE', 'NORMAL'];
    return [...tickets].sort((a, b) => {
      return priorityOrder.indexOf(a.identPrioridade) - priorityOrder.indexOf(b.identPrioridade);
    });
  };

  const addNewTicket = (newFicha) => {
    // Verificar se a ficha já existe na lista atual usando refs
    const alreadyExists = nextTicketsRef.current.some(
      ticket => ticket.idFicha === newFicha.idFicha
    );
    
    if (alreadyExists) {
      console.log('Ficha já existe na lista, ignorando:', newFicha);
      return;
    }

    // Verificar se já existe nas originais
    const alreadyExistsInOriginais = ticketsOriginaisRef.current.some(
      ticket => ticket.idFicha === newFicha.idFicha
    );
    
    if (!alreadyExistsInOriginais) {
      console.log('Nova ficha recebida:', newFicha);
      
      // Adicionar às originais
      const updatedOriginais = [...ticketsOriginaisRef.current, newFicha];
      setTicketsOriginais(updatedOriginais);
      ticketsOriginaisRef.current = updatedOriginais;
      
      // Adicionar à lista principal
      const updatedTickets = sortTickets([...nextTicketsRef.current, newFicha]);
      setNextTickets(updatedTickets);
      nextTicketsRef.current = updatedTickets;
      
      // Atualizar contadores
      updateTicketCounts(updatedTickets);
      
      // Aplicar filtros - SEMPRE aplicar após adicionar nova ficha
      applyFilters(updatedTickets, activeFiltersRef.current);
      
      // Destacar o novo ticket
      setHighlightedTicket(newFicha);
      
      console.log('Ficha adicionada com sucesso:', newFicha);
    }
  };

  const updateTicketCounts = (ticketList) => {
    const counts = {
      NORMAL: 0,
      PRIORITARIO: 0,
      ATPVE: 0
    };

    ticketList.forEach(ticket => {
      if (counts.hasOwnProperty(ticket.identPrioridade)) {
        counts[ticket.identPrioridade]++;
      }
    });

    setTicketCounts(counts);
  };

  const applyFilters = (ticketList, filters) => {
    console.log('Aplicando filtros:', filters);
    
    // Se "ALL" estiver ativo, mostrar TODAS as fichas sem filtro
    if (filters.ALL) {
      console.log('Mostrando TODAS as fichas (sem filtro)');
      setFilteredTickets(ticketList);
      return;
    }
    
    // Caso contrário, aplicar filtros pelos tipos específicos
    const filtered = ticketList.filter(ticket => {
      return filters[ticket.identPrioridade];
    });
    
    console.log('Tickets filtrados:', filtered.length);
    setFilteredTickets(filtered);
  };

  const handleFilterClick = (priorityType) => {
    // Quando clica em um tipo específico, desativa "ALL" e ativa apenas esse tipo
    const newFilters = {
      NORMAL: false,
      PRIORITARIO: false,
      ATPVE: false,
      ALL: false, // Desativa "Mostrar Todos"
      [priorityType]: true // Ativa apenas o tipo clicado
    };
    
    console.log('Mudando filtro para:', newFilters);
    setActiveFilters(newFilters);
    applyFilters(nextTicketsRef.current, newFilters);
  };

  const handleShowAllClick = () => {
    // Ativar "Mostrar Todos" - mostra todas as fichas sem filtro
    const resetFilters = {
      NORMAL: false,
      PRIORITARIO: false,
      ATPVE: false,
      ALL: true // Ativa "Mostrar Todos"
    };
    
    console.log('Ativando "Mostrar Todos" - sem filtro');
    setActiveFilters(resetFilters);
    applyFilters(nextTicketsRef.current, resetFilters);
  };

  const handleRefreshClick = async () => {
    try {
      await fetchFichas();
    } catch (error) {
      console.error('Erro ao atualizar fichas:', error);
    }
  };

  // Função para verificar se apenas um filtro específico está ativo (excluindo ALL)
  const getActiveSpecificFilterCount = () => {
    return Object.entries(activeFilters)
      .filter(([key]) => key !== 'ALL')
      .filter(([_, value]) => value)
      .length;
  };

  // Função para obter o tipo ativo específico (excluindo ALL)
  const getActiveSpecificFilterType = () => {
    const activeEntries = Object.entries(activeFilters)
      .filter(([key]) => key !== 'ALL')
      .filter(([_, isActive]) => isActive);
    
    return activeEntries.length === 1 ? activeEntries[0][0] : null;
  };

  // Função para verificar se está no modo "Mostrar Todos"
  const isShowAllMode = () => {
    return activeFilters.ALL;
  };

  // Função para limpar histórico
  const handleClearHistory = () => {
    if (window.confirm('Tem certeza que deseja limpar o histórico de chamadas?')) {
      localStorage.removeItem('ticketHistory');
      localStorage.removeItem('ticketIdHistory');
      localStorage.removeItem('fullTicketHistory');
      localStorage.removeItem('lastCalledPriority');
      localStorage.removeItem('lastCalledId');
      setLastCalledTickets({
        NORMAL: null,
        PRIORITARIO: null,
        ATPVE: null
      });
      setLastCalledIds({
        NORMAL: null,
        PRIORITARIO: null,
        ATPVE: null
      });
      alert('Histórico limpo com sucesso!');
    }
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
  }, [isBlinking]);

  useEffect(() => {
    if (highlightedTicket) {
      const timeout = setTimeout(() => {
        setHighlightedTicket(null);
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [highlightedTicket]);

  useEffect(() => {
    const connectToSSE = () => {
      const eventSource = new EventSource(`${API_BASE_URL}/fichas/stream`);

      eventSource.addEventListener('newFicha', (event) => {
        try {
          const newFicha = JSON.parse(event.data);
          console.log('SSE - Nova ficha recebida via stream:', newFicha);
          addNewTicket(newFicha);
        } catch (error) {
          console.error('Erro ao processar evento SSE:', error);
        }
      });

      eventSource.onerror = (error) => {
        console.error('Erro na conexão SSE:', error);
        eventSource.close();
        setTimeout(() => {
          console.log('Tentando reconectar ao SSE...');
          connectToSSE();
        }, 5000);
      };

      return eventSource;
    };

    const eventSource = connectToSSE();

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchFichas = async () => {
    const token = localStorage.getItem("jwtToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/fichas`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const fetchedFichas = response.data;
      const sortedTickets = sortTickets(fetchedFichas);
      
      // Limpar duplicatas usando idFicha como chave única
      const uniqueTickets = Array.from(
        new Map(sortedTickets.map(ticket => [ticket.idFicha, ticket])).values()
      );
      
      const finalTickets = sortTickets(uniqueTickets);
      
      console.log('FetchFichas - Tickets carregados:', finalTickets.length);
      
      setNextTickets(finalTickets);
      setTicketsOriginais(finalTickets);
      nextTicketsRef.current = finalTickets;
      ticketsOriginaisRef.current = finalTickets;
      
      updateTicketCounts(finalTickets);
      applyFilters(finalTickets, activeFilters);
      
    } catch (error) {
      if (error.response && error.response.status === 401) {
        handleUnauthorized();
      } else {
        console.error('Erro ao buscar fichas:', error);
      }
    }
  };

  useEffect(() => {
    fetchFichas();
    // Buscar últimas chamadas para cada prioridade
    ['NORMAL', 'PRIORITARIO', 'ATPVE'].forEach(priority => {
      fetchLastCalledTicket(priority);
    });
  }, []);

  // Aplicar filtros quando activeFilters ou nextTickets mudar
  useEffect(() => {
    console.log('useEffect - Aplicando filtros devido a mudança de estado');
    applyFilters(nextTickets, activeFilters);
  }, [activeFilters, nextTickets]);

  return (
    <div style={styles.container}>
      <Header />
      {/* Botão de Chamar Novamente */}
      <div style={styles.repeatButtonContainer}>
        <button 
          onClick={handleRepeatLastTicket}
          disabled={loadingStates.REPEAT || !getLastCalledInfo()}
          style={{
            ...styles.repeatButton,
            opacity: loadingStates.REPEAT || !getLastCalledInfo() ? 0.6 : 1,
            cursor: loadingStates.REPEAT || !getLastCalledInfo() ? 'not-allowed' : 'pointer'
          }}
          title={getLastCalledInfo() 
            ? `Chamar novamente: ${getLastCalledInfo().ticket} (ID: ${getLastCalledInfo().id})` 
            : 'Nenhuma ficha foi chamada ainda'
          }
        >
          {loadingStates.REPEAT ? (
            <div style={styles.loadingContainer}>
              <span style={styles.loadingSpinner}></span>
              Chamando...
            </div>
          ) : (
            <>
              <span style={styles.repeatIcon}>↺</span>
              Chamar Novamente
              <span style={styles.lastCalledInfo}>
                {getLastCalledInfo() ? `(${getLastCalledInfo().ticket})` : ''}
              </span>
            </>
          )}
        </button>
        
        {/* Botão para ver histórico completo */}
        <button 
          onClick={() => {
            const fullHistory = JSON.parse(localStorage.getItem('fullTicketHistory') || '[]');
            if (fullHistory.length > 0) {
              const historyText = fullHistory.map((item, index) => 
                `${index + 1}. ${item.ticket} (${getPriorityLabel(item.priority)}) - ID: ${item.id} - ${item.date} ${item.time}`
              ).join('\n');
              alert(`Histórico de Chamadas:\n\n${historyText}`);
            } else {
              alert('Nenhuma chamada no histórico ainda.');
            }
          }}
          style={styles.historyButton}
          title="Ver histórico completo de chamadas"
        >
          📋 Histórico
        </button>
        
        {/* Botão para limpar histórico */}
        <button 
          onClick={handleClearHistory}
          style={styles.clearHistoryButton}
          title="Limpar histórico de chamadas"
        >
          🗑️ Limpar Histórico
        </button>
      </div>

      <div style={styles.ticketsDisplay}>
        {['NORMAL', 'PRIORITARIO', 'ATPVE'].map(priority => {
          const isLoading = loadingStates[priority];
          const isActive = activePriority === priority;
          const count = ticketCounts[priority];
          const isFilterActive = activeFilters[priority];
          const isOnlyActiveFilter = getActiveSpecificFilterCount() === 1 && isFilterActive;
          const showAllMode = isShowAllMode();
          const lastCalled = lastCalledTickets[priority];
          const lastCalledId = lastCalledIds[priority];
          
          return (
            <div 
              key={priority}
              style={{
                ...styles.ticketCard,
                borderColor: getPriorityColor(priority),
                backgroundColor: isActive ? `${getPriorityColor(priority)}20` : '#ffffff',
                borderWidth: isOnlyActiveFilter ? '4px' : '3px',
                animation: highlightedTicket && highlightedTicket.identPrioridade === priority 
                  ? 'highlightPulse 1s ease-in-out 3' 
                  : 'none',
                position: 'relative'
              }}
            >
              {/* Indicador de última chamada */}
              {lastCalled && (
                <div style={styles.lastCalledBadge}>
                  <span style={styles.lastCalledText}>Última: {lastCalled}</span>
                  {lastCalledId && (
                    <span style={styles.lastCalledId} title={`ID: ${lastCalledId}`}>
                      (ID: {lastCalledId})
                    </span>
                  )}
                </div>
              )}
              
              <div style={styles.ticketHeader}>
                <div style={styles.titleContainer}>
                  <span style={{
                    ...styles.priorityBadge,
                    backgroundColor: getPriorityColor(priority)
                  }}>
                    {getPriorityLabel(priority)}
                  </span>
                  <div style={styles.countContainer}>
                    <span style={styles.countBadge}>
                      {count} {count === 1 ? 'ficha' : 'fichas'}
                    </span>
                    <span style={styles.countLabel}>para chamar</span>
                  </div>
                </div>
              </div>
              <div style={styles.ticketContent}>
                <h1 style={{
                  ...styles.ticketNumber,
                  opacity: isBlinking && tickets[priority] ? 0.5 : 1,
                  animation: isActive && tickets[priority] ? 'pulse 0.5s ease-in-out' : 'none'
                }}>
                  {tickets[priority] || '---'}
                </h1>
                <p style={styles.ticketStatus}>
                  {tickets[priority] ? 'Última chamada' : 'Aguardando chamada'}
                </p>
              </div>
              <button 
                style={{
                  ...styles.priorityButton,
                  backgroundColor: getPriorityColor(priority),
                  opacity: isLoading || count === 0 ? 0.7 : 1,
                  cursor: isLoading || count === 0 ? 'not-allowed' : 'pointer'
                }}
                onClick={() => !isLoading && count > 0 && handleNextTicket(priority)}
                disabled={isLoading || count === 0}
                title={count === 0 ? `Não há ${getPriorityLabel(priority)} disponíveis` : ''}
              >
                {isLoading ? (
                  <div style={styles.loadingContainer}>
                    <span style={styles.loadingSpinner}></span>
                    Chamando...
                  </div>
                ) : count === 0 ? (
                  `Sem ${getPriorityLabel(priority)}`
                ) : (
                  `Chamar ${getPriorityLabel(priority)}`
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div style={styles.queueContainer}>
        <div style={styles.queueHeader}>
          <div style={styles.queueTitleContainer}>
            <h3 style={styles.queueTitle}>Fila de Espera</h3>
            <button 
              onClick={handleRefreshClick}
              style={styles.refreshButton}
              title="Atualizar lista"
            >
              <span style={styles.refreshIcon}>↻</span>
              Atualizar
            </button>
          </div>
          <div style={styles.queueStats}>
            <span style={styles.queueCounter}>
              {filteredTickets.length} de {nextTickets.length} na fila
            </span>
            <div style={styles.queueTypeCounts}>
              {Object.entries(ticketCounts).map(([type, count]) => {
                const isFilterActive = activeFilters[type];
                const isOnlyActive = getActiveSpecificFilterCount() === 1 && isFilterActive;
                const showAllMode = isShowAllMode();
                
                return (
                  <button
                    key={type}
                    onClick={() => handleFilterClick(type)}
                    style={{
                      ...styles.queueTypeCount,
                      color: getPriorityColor(type),
                      backgroundColor: showAllMode 
                        ? `${getPriorityColor(type)}10` 
                        : isFilterActive 
                          ? `${getPriorityColor(type)}${isOnlyActive ? '25' : '15'}` 
                          : `${getPriorityColor(type)}05`,
                      border: showAllMode 
                        ? '2px solid #e9ecef'
                        : isFilterActive 
                          ? `2px solid ${getPriorityColor(type)}` 
                          : '2px solid transparent',
                      borderWidth: isOnlyActive ? '3px' : '2px',
                      opacity: showAllMode ? 0.7 : (isFilterActive ? 1 : 0.4),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: isOnlyActive ? '800' : (showAllMode ? '500' : '600'),
                      transform: isOnlyActive ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.2s ease'
                    }}
                    title={showAllMode 
                      ? `Clique para mostrar apenas ${getPriorityLabel(type)}`
                      : isFilterActive 
                        ? isOnlyActive
                          ? `Mostrando apenas ${getPriorityLabel(type)}. Clique em "Mostrar Todos" para ver todos.`
                          : `Clique para mostrar apenas ${getPriorityLabel(type)}`
                        : `Clique para mostrar apenas ${getPriorityLabel(type)}`
                    }
                  >
                    <span style={styles.queueTypePrefix}>{getPriorityPrefix(type)}:</span>
                    <span style={styles.queueTypeNumber}>{count}</span>
                    {isOnlyActive && (
                      <span style={styles.filterSoloIndicator}>👁️</span>
                    )}
                    {isFilterActive && !isOnlyActive && !showAllMode && (
                      <span style={styles.filterActiveIndicator}>✓</span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={handleShowAllClick}
                style={{
                  ...styles.resetFilterButton,
                  backgroundColor: isShowAllMode() ? '#28a745' : '#6c757d',
                  color: 'white',
                  fontWeight: isShowAllMode() ? '700' : '500',
                  border: isShowAllMode() ? '2px solid #28a745' : '2px solid #6c757d'
                }}
                title={isShowAllMode() ? "Mostrando todas as fichas" : "Mostrar todas as fichas (sem filtro)"}
              >
                {isShowAllMode() ? '✓ Todos' : 'Mostrar Todos'}
              </button>
            </div>
          </div>
        </div>
        
        <div style={styles.filterStatus}>
          <div style={styles.filterStatusLeft}>
            <span style={styles.filterStatusText}>
              {isShowAllMode() 
                ? 'Mostrando todas as fichas (sem filtro)'
                : getActiveSpecificFilterCount() === 1
                  ? `Mostrando apenas: ${getPriorityLabel(getActiveSpecificFilterType())}`
                  : getActiveSpecificFilterCount() > 1
                    ? `Mostrando: ${Object.entries(activeFilters)
                        .filter(([key]) => key !== 'ALL')
                        .filter(([_, isActive]) => isActive)
                        .map(([type]) => getPriorityLabel(type))
                        .join(', ')}`
                    : 'Nenhum filtro ativo'
              }
            </span>
            {!isShowAllMode() && getActiveSpecificFilterCount() > 0 && (
              <span style={styles.filterCountBadge}>
                {getActiveSpecificFilterCount()} {getActiveSpecificFilterCount() === 1 ? 'tipo' : 'tipos'}
              </span>
            )}
          </div>
          {!isShowAllMode() && (
            <div style={styles.filterHintContainer}>
              <span style={styles.filterHint}>
                Clique em um número para mostrar apenas aquele tipo
              </span>
            </div>
          )}
        </div>
        
        <div style={styles.queueGrid}>
          {filteredTickets.length > 0 ? (
            filteredTickets.slice(0, 25).map((ticket, index) => (
              <div
                key={`${ticket.idFicha}-${index}`}
                style={{
                  ...styles.queueItem,
                  borderColor: getPriorityColor(ticket.identPrioridade),
                  transform: highlightedTicket && highlightedTicket.idFicha === ticket.idFicha 
                    ? 'scale(1.05)' 
                    : 'scale(1)',
                  boxShadow: highlightedTicket && highlightedTicket.idFicha === ticket.idFicha 
                    ? `0 0 0 3px ${getPriorityColor(ticket.identPrioridade)}40` 
                    : '0 2px 4px rgba(0,0,0,0.1)',
                  animation: highlightedTicket && highlightedTicket.idFicha === ticket.idFicha
                    ? 'highlightItem 0.5s ease-in-out 3'
                    : 'none'
                }}
              >
                <span style={{
                  ...styles.queuePriorityDot,
                  backgroundColor: getPriorityColor(ticket.identPrioridade)
                }}></span>
                <span style={styles.queueNumber}>
                  {formatTicketNumber(ticket.numero, ticket.identPrioridade)}
                </span>
                <span style={styles.queueType}>
                  {getPriorityLabel(ticket.identPrioridade)}
                </span>
                <span style={styles.ticketId} title={`ID: ${ticket.idFicha}`}>
                  #{ticket.idFicha}
                </span>
              </div>
            ))
          ) : (
            <div style={styles.emptyQueue}>
              {nextTickets.length > 0 ? (
                <>
                  <span style={styles.emptyQueueText}>
                    {isShowAllMode() 
                      ? 'Nenhuma ficha na fila' 
                      : getActiveSpecificFilterCount() === 0
                        ? 'Nenhum tipo selecionado'
                        : 'Nenhum ticket corresponde aos filtros selecionados'
                    }
                  </span>
                  {getActiveSpecificFilterCount() === 0 && !isShowAllMode() && (
                    <button 
                      onClick={handleShowAllClick}
                      style={styles.showAllButton}
                    >
                      Mostrar todas as fichas
                    </button>
                  )}
                </>
              ) : (
                <span style={styles.emptyQueueText}>Nenhum ticket na fila</span>
              )}
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes highlightPulse {
            0% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); }
            100% { box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
          }
          
          @keyframes highlightItem {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    padding: '20px',
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  guicheContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    margin: '30px 0',
    padding: '15px 25px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  guicheLabel: {
    fontSize: '18px',
    color: '#6c757d',
    fontWeight: '500',
  },
  guicheValue: {
    fontSize: '22px',
    color: '#495057',
    fontWeight: '600',
  },
  // Container para o botão de repetir
  repeatButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '25px',
    flexWrap: 'wrap',
  },
  repeatButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '15px 30px',
    backgroundColor: '#9C27B0',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 8px rgba(156, 39, 176, 0.3)',
    minWidth: '220px',
  },
  repeatIcon: {
    fontSize: '22px',
    animation: 'spin 2s linear infinite',
  },
  lastCalledInfo: {
    fontSize: '14px',
    opacity: 0.9,
    marginLeft: '5px',
    fontStyle: 'italic',
  },
  historyButton: {
    padding: '10px 20px',
    backgroundColor: '#607D8B',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  clearHistoryButton: {
    padding: '10px 20px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  lastCalledBadge: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  lastCalledText: {
    color: '#666',
    fontWeight: '500',
  },
  lastCalledId: {
    color: '#888',
    fontSize: '10px',
    marginTop: '2px',
  },
  ticketsDisplay: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px',
    marginBottom: '40px',
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '25px',
    border: '3px solid',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  ticketHeader: {
    width: '100%',
    marginBottom: '20px',
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  priorityBadge: {
    padding: '8px 24px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '18px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  countContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  countBadge: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#212529',
  },
  countLabel: {
    fontSize: '14px',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  ticketContent: {
    textAlign: 'center',
    marginBottom: '25px',
    flexGrow: 1,
  },
  ticketNumber: {
    fontSize: '72px',
    fontWeight: '700',
    color: '#212529',
    margin: '20px 0',
    transition: 'opacity 0.3s ease',
    fontFamily: '"Courier New", monospace',
  },
  ticketStatus: {
    fontSize: '14px',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginTop: '10px',
  },
  priorityButton: {
    padding: '16px 32px',
    fontSize: '18px',
    fontWeight: '600',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    position: 'relative',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '3px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  queueContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    position: 'relative',
  },
  queueHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e9ecef',
  },
  queueTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  queueTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#212529',
    margin: 0,
  },
  refreshButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  refreshIcon: {
    fontSize: '16px',
  },
  queueStats: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
  },
  queueCounter: {
    fontSize: '16px',
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: '500',
  },
  queueTypeCounts: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  queueTypeCount: {
    fontSize: '14px',
    padding: '6px 12px',
    borderRadius: '12px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    border: '2px solid transparent',
  },
  queueTypePrefix: {
    fontWeight: '700',
  },
  queueTypeNumber: {
    fontWeight: '800',
    fontSize: '16px',
  },
  filterActiveIndicator: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  filterSoloIndicator: {
    fontSize: '12px',
    marginLeft: '2px',
  },
  resetFilterButton: {
    marginLeft: '8px',
    padding: '6px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  filterStatus: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #2196F3',
  },
  filterStatusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  filterStatusText: {
    fontSize: '14px',
    color: '#495057',
    fontWeight: '500',
  },
  filterCountBadge: {
    fontSize: '12px',
    color: '#6c757d',
    backgroundColor: '#e9ecef',
    padding: '2px 8px',
    borderRadius: '10px',
    fontWeight: '600',
  },
  filterHintContainer: {
    textAlign: 'right',
  },
  filterHint: {
    fontSize: '12px',
    color: '#6c757d',
    fontStyle: 'italic',
  },
  queueGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px',
    animation: 'fadeIn 0.3s ease-out',
  },
  queueItem: {
    backgroundColor: '#ffffff',
    padding: '15px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: '2px solid',
    transition: 'all 0.3s ease',
    position: 'relative',
  },
  queuePriorityDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  queueNumber: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#212529',
    flexGrow: 1,
    fontFamily: '"Courier New", monospace',
  },
  queueType: {
    fontSize: '12px',
    color: '#6c757d',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontWeight: '500',
  },
  ticketId: {
    fontSize: '10px',
    color: '#999',
    position: 'absolute',
    bottom: '5px',
    right: '10px',
    fontFamily: 'monospace',
  },
  emptyQueue: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '40px',
    color: '#6c757d',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  emptyQueueText: {
    fontSize: '18px',
    fontStyle: 'italic',
  },
  showAllButton: {
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
};

export default CallNextTicket;