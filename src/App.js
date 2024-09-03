import logo from './logo.svg';
import './App.css';
import UserRegistration from './telas/UserRegistration';

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
    <UserRegistration/>
  );
}

export default App;
