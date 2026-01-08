import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from 'react';

import LoginPage from './telas/LoginPage';
import UserRegistration from './telas/UserRegistration';
import CadastroEmpresa from './telas/CadastroEmpresa';
import HomePage from './telas/HomePage';
import Chamada from './telas/Chamada';
import Painel from './telas/Painel';
import Dispositivos from './telas/Dispositivos';
import SmartphoneManagement from "./telas/SmartphoneManagement";
import Configuracoes from "./telas/Configuracoes";
import Settings from "./telas/Settings";


function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route index path="/login" element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/usuarios" element={<UserRegistration />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/cadastroEmpresas" element={<CadastroEmpresa />} />
        <Route path="/chamada" element={<Chamada />} />
        <Route path="/painel" element={<Painel/>} />
        <Route path="/dispositivos" element={<Dispositivos/>} />
        <Route path="/smartphones" element={<SmartphoneManagement/>} />
        <Route path="/config" element={<Configuracoes/>} />
        <Route path="/settings" element={<Settings/>} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
