import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from './telas/LoginPage';
import UserRegistration from './telas/UserRegistration';
import CadastroEmpresa from './telas/CadastroEmpresa';


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
        <Route index element={<UserRegistration />} />
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastroEmpresa" element={<CadastroEmpresa />} />
      </Routes>
    </BrowserRouter>

  );
}

export default App;
