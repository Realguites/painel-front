import React, { useState, useEffect } from 'react';

function Carrossel({ midias }) {
  const [indiceAtivo, setIndiceAtivo] = useState(0);

  // Função para navegar para o próximo item
  const proximoItem = () => {
    setIndiceAtivo((prevIndice) => (prevIndice + 1) % midias.length);
  };

  // Autoplay: Passa para o próximo item a cada 10 segundos
  useEffect(() => {
    const intervalo = setInterval(() => {
      proximoItem();
    }, 10000); // 10 segundos

    return () => clearInterval(intervalo); // Limpa o intervalo ao desmontar o componente
  }, [indiceAtivo]); // Dependência do índice ativo

  return (
    <div style={styles.carrosselContainer}>
      {/* Item Ativo */}
      <div style={styles.itemContainer}>
        {midias[indiceAtivo].tipo === 'imagem' && (
          <img
            src={midias[indiceAtivo].url}
            alt={`Mídia ${indiceAtivo + 1}`}
            style={styles.midia}
          />
        )}
        {midias[indiceAtivo].tipo === 'gif' && (
          <img
            src={midias[indiceAtivo].url}
            alt={`Mídia ${indiceAtivo + 1}`}
            style={styles.midia}
          />
        )}
        {midias[indiceAtivo].tipo === 'video' && (
          <video
            src={midias[indiceAtivo].url}
            controls
            style={styles.midia}
          />
        )}
      </div>
    </div>
  );
}

// Estilos
const styles = {
  carrosselContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    maxWidth: '800px',
    margin: '0 auto',
    overflow: 'hidden',
  },
  itemContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  midia: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
};

export default Carrossel;