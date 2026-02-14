import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaArrowLeft, FaArrowRight } from 'react-icons/fa'; // Adicionando ícones de seta
import '../css/Table.css';
import InputField from '../components/InputField';

const Table = ({ columns, data, onEdit, onDelete, itemsPerPage = 10 }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    if(data?.length > 0){
      setFilteredData(
        data.filter((row) =>
          columns.some((column) =>
            String(row[column.accessor])
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
        )
      );
      setCurrentPage(1);
    }
  }, [searchQuery, data, columns]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container">
      <InputField
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Insira o nome para buscar..."
        style={{fontSize:'18px'}}
      />

      <ul className="responsive-table">
        <li className="table-header">
          {columns.map((column, index) => (
            <div key={index} className={`col col-${index + 1}`}>
              {column.header}
            </div>
          ))}
          <div className="col col-actions">Actions</div>
        </li>

        {currentData.length > 0 ? (
          currentData.map((row, rowIndex) => (
            <li key={rowIndex} className="table-row">
              {columns.map((column, colIndex) => (
                <div
                  key={colIndex}
                  className={`col col-${colIndex + 1}`}
                  data-label={column.header}
                >
                  {row[column.accessor]}
                </div>
              ))}
              <div className="col col-actions" data-label="Actions">
                <FaEdit
                  className="icon edit-icon"
                  onClick={() => onEdit(row)}
                />
                <FaTrash
                  className="icon delete-icon"
                  onClick={() => onDelete(row)}
                />
              </div>
            </li>
          ))
        ) : (
          <li className="table-row">
            <div className="no-data">Sem dados</div>
          </li>
        )}
      </ul>

      <div className="pagination">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="page-btn"
        >
          <FaArrowLeft /> {/* Ícone de seta para a esquerda */}
        </button>
        <span className="page-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="page-btn"
        >
          <FaArrowRight /> {/* Ícone de seta para a direita */}
        </button>
      </div>
    </div>
  );
};

export default Table;
