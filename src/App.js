import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from './telas/LoginPage';
import UserRegistration from './telas/UserRegistration';
import CadastroEmpresa from './telas/CadastroEmpresa';
import UserRegistration from './telas/CadastroEmpresa';
import LoginPage from  './telas/Login';


const eventSource = new EventSource('http://localhost:8080/stream-sse');
 

eventSource.onmessage = function(event) {
    console.log('Nova mensagem:', event.data);
    // Atualize o front-end aqui com o evento recebido
};

eventSource.onerror = function(event) {
    console.error('Erro no SSE:', event);
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
      <Route index path="/login" element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/usuarios" element={<UserRegistration />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/cadastroEmpresa" element={<CadastroEmpresa />} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
