import React, { useState, useEffect } from 'react';
import styled from "styled-components";
import { FaUser, FaSignOutAlt } from "react-icons/fa";
import { IoMdBusiness, IoMdClipboard } from "react-icons/io";
import { RiCustomerService2Fill } from "react-icons/ri";
import { HiDeviceMobile } from "react-icons/hi";
import { decodeToken } from "react-jwt";
import Header from '../others/Header';
import { useNavigate } from 'react-router-dom';
import { isExpired } from "react-jwt";
import config from '../config/config';

// Adicione um componente de modal
import Modal from 'react-modal';

// Estilo para a modal
Modal.setAppElement('#root'); // Para acessibilidade

const Home = () => {
  const navigate = useNavigate();
  const [canRender, setCanRender] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const { API_BASE_URL } = config;

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token === null || typeof token === "undefined" || isExpired(token)) {
      window.location.href = "/login";
    } else {
      const userData = decodeToken(token);
      if (userData?.needUpdatePass) {
        setShowModal(true); // Se precisar atualizar a senha, exibe a modal
      }
      setCanRender(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    navigate('/login');
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.currentPassword) {
      errors.currentPassword = "A senha atual é obrigatória.";
    }
    if (!formData.newPassword) {
      errors.newPassword = "A nova senha é obrigatória.";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "As senhas não coincidem.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("jwtToken");
    const userData = decodeToken(token);
    if (validateForm()) {
        try {
            
            const response = await fetch(`${API_BASE_URL}/usuarios/updatePassword`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.status === 401) {
                const errorMessage = await response.text(); // "Senha atual incorreta"
                setFormErrors({ currentPassword: errorMessage });
            } else if (response.ok) {
                // Sucesso, feche o modal
                setShowModal(false);
                alert('Senha atualizada com sucesso');
            } else {
                // Outros erros
                console.error('Erro ao atualizar senha');
            }
        } catch (error) {
            console.error('Erro de rede', error);
        }
    }
};


  return (
    <HomeBackground>
      {canRender && (
        <HomeContainer>
          <Header />

          <WelcomeMessage>
            <h1>Bem-vindo(a) ao Timetask!</h1>
            <p>Selecione uma das opções abaixo para começar:</p>
          </WelcomeMessage>

          <CardsWrapper>
            <Card style={{ backgroundColor: '#ff6b6b' }} onClick={() => window.location.href = "/cadastroEmpresas"}>
              <IoMdBusiness size={40} color="#fff" />
              <p>Empresas</p>
            </Card>

            <Card style={{ backgroundColor: '#feca57' }} onClick={() => window.location.href = "/usuarios"}>
              <FaUser size={40} color="#fff" />
              <p>Usuários</p>
            </Card>

            <Card style={{ backgroundColor: '#084d6e' }} onClick={() => alert('Guichês')}>
              <RiCustomerService2Fill size={40} color="#fff" />
              <p>Guichês</p>
            </Card>

            <Card style={{ backgroundColor: '#f7b291' }} onClick={() => alert('Chamada')}>
              <IoMdClipboard size={40} color="#fff" />
              <p>Chamada</p>
            </Card>

            <Card style={{ backgroundColor: '#54a0ff' }} onClick={() => alert('Dispositivos')}>
              <HiDeviceMobile size={40} color="#fff" />
              <p>Dispositivos</p>
            </Card>

            <Card style={{ backgroundColor: '#1dd1a1' }} onClick={handleLogout}>
              <FaSignOutAlt size={40} color="#fff" />
              <p>Logout</p>
            </Card>
          </CardsWrapper>

          {/* Modal para atualização de senha */}
          <Modal
            isOpen={showModal}
            style={{
              content: {
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
                width: '400px',
                padding: '20px',
              },
            }}
            shouldCloseOnOverlayClick={false} // Bloqueia saída do modal sem atualizar a senha
          >
            <h2>Atualize sua senha</h2>
            <form onSubmit={handleSubmit}>
            <FormField>
    <label>Senha atual:</label>
    <input
        type="password"
        name="currentPassword"
        value={formData.currentPassword}
        onChange={handleFormChange}
        style={{ borderColor: formErrors.currentPassword ? 'red' : '#ccc' }}
        required
    />
    {formErrors.currentPassword && <ErrorMessage>{formErrors.currentPassword}</ErrorMessage>}
</FormField>
              <FormField>
                <label>Nova senha:</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleFormChange}
                  style={{ borderColor: formErrors.newPassword ? 'red' : '#ccc' }}
                  required
                />
                {formErrors.newPassword && <ErrorMessage>{formErrors.newPassword}</ErrorMessage>}
              </FormField>
              <FormField>
                <label>Confirmar nova senha:</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleFormChange}
                  style={{ borderColor: formErrors.confirmPassword ? 'red' : '#ccc' }}
                  required
                />
                {formErrors.confirmPassword && <ErrorMessage>{formErrors.confirmPassword}</ErrorMessage>}
              </FormField>
              <button type="submit">Atualizar Senha</button>
            </form>
          </Modal>
        </HomeContainer>
      )}
    </HomeBackground>
  );
};

// Estilizando os componentes
const HomeBackground = styled.div`
  background: linear-gradient(to right, #e0eafc, #cfdef3); 
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  overflow: hidden; /* Remove a barra de rolagem */
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
  gap: 20px; 
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

const FormField = styled.div`
  margin-bottom: 15px;

  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 16px;
  }
`;

const ErrorMessage = styled.span`
  display: block;
  color: red;
  font-size: 0.9rem;
  margin-top: 5px;
`;

export default Home;
