import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { IoMdBusiness, IoMdClipboard } from "react-icons/io";
import { RiCustomerService2Fill  } from "react-icons/ri";
import { HiDeviceMobile } from "react-icons/hi";



import Header from '../others/Header';
import { useNavigate } from 'react-router-dom';
import { isExpired } from "react-jwt";


const Home = () => {
  const handleCardClick = (action) => {
    alert(`Você clicou em: ${action}`);
  };
  const navigate = useNavigate();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token === null || typeof token === "undefined") {
      if (!isExpired(token)) {
        window.location.href = "/login"
      }
      window.location.href = "/login"
    }
    setCanRender(true)

  }, [])

  const handleLogout = () => {
    // Remover o token de autenticação do localStorage
    localStorage.removeItem('jwtToken');

    // Redirecionar o usuário para a página de login
    navigate('/login');

  }
  return (
    <HomeBackground>
      {canRender && (
        <HomeContainer>
          <Header></Header>

          <WelcomeMessage>
            <h1>Bem-vindo(a) ao Timetask!</h1>
            <p>Selecione uma das opções abaixo para começar:</p>
          </WelcomeMessage>
          <CardsWrapper>
            <Card style={{ backgroundColor: '#ff6b6b' }} onClick={() => handleCardClick('Home')}>
              <IoMdBusiness  size={40} color="#fff" />
              <p>Empresas</p>
            </Card>

            <Card style={{ backgroundColor: '#feca57' }} onClick={() => window.location.href = "/usuarios"}>
              <FaUser size={40} color="#fff" />
              <p>Usuários</p>
            </Card>

            <Card style={{ backgroundColor: '#084d6e' }} onClick={() => handleCardClick('Configurações')}>
              <RiCustomerService2Fill  size={40} color="#fff" />
              <p>Guichês</p>
            </Card>

            <Card style={{ backgroundColor: '#f7b291' }} onClick={() => handleCardClick('Configurações')}>
              <IoMdClipboard  size={40} color="#fff" />
              <p>Chamada</p>
            </Card>
            

            <Card style={{ backgroundColor: '#54a0ff' }} onClick={() => handleCardClick('Configurações')}>
              <HiDeviceMobile size={40} color="#fff" />
              <p>Dispositivos</p>
            </Card>

            <Card style={{ backgroundColor: '#1dd1a1' }} onClick={() => handleLogout()}>
              <FaSignOutAlt size={40} color="#fff" />
              <p>Logout</p>
            </Card>
          </CardsWrapper>


        </HomeContainer>
      )}
    </HomeBackground>
  );
};

// Estilizando os componentes
const HomeBackground = styled.div`
  background: linear-gradient(to right, #e0eafc, #cfdef3); /* Gradiente de fundo suave */
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  max-width: 1200px;
`;

const WelcomeMessage = styled.div`
  text-align: center;
  margin-bottom: 30px;

  h1 {
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 10px;
  }

  p {
    font-size: 1.2rem;
    color: #666;
  }
`;

const CardsWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px; /* Espaçamento entre os cards */
  justify-content: center;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 150px;
  height: 150px;
  border-radius: 15px;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.3);
  }

  p {
    margin-top: 10px;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
  }
`;

export default Home;
