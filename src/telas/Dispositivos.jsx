import React, { useEffect, useState } from "react";

const Dispositivos = () => {
  const [vozes, setVozes] = useState([]);

  useEffect(() => {
    const voices = window.speechSynthesis.getVoices();
console.log("vozes",voices);




    const carregarVozes = () => {
      const listaVozes = window.speechSynthesis.getVoices();
      console.log("TESTE", listaVozes)
      setVozes(listaVozes);
    };

    // Aguarda o carregamento das vozes
    window.speechSynthesis.onvoiceschanged = carregarVozes;
    carregarVozes();
  }, []);

  const falar = (texto, idioma = "pt-BR") => {
    if (!window.speechSynthesis) {
      alert("Seu navegador não suporta a API de síntese de fala.");
      return;
    }

    if (vozes.length === 0) {
      alert("As vozes ainda estão carregando. Tente novamente em alguns segundos.");
      return;
    }

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = idioma;

    // Seleciona a primeira voz compatível com o idioma
    const vozSelecionada = vozes.find((voz) => voz.lang.startsWith(idioma));
    if (vozSelecionada) {
      fala.voice = vozSelecionada;
    }

    fala.onstart = () => console.log("Fala iniciada...");
    fala.onend = () => console.log("Fala concluída.");
    fala.onerror = (e) => console.error("Erro na fala:", e);

    window.speechSynthesis.speak(fala);
  };

  return (
    <div>
      <h1>Teste de Fala</h1>
      <button onClick={() => falar("Olá, isso é um teste de fala em português.", "pt-BR")}>
        Falar em Português
      </button>
      <button onClick={() => falar("Hello, this is a speech test in English.", "en-US")}>
        Falar em Inglês
      </button>
    </div>
  );
};

export default Dispositivos;
