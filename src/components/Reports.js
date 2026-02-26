import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getSales, saveSales } from '../utils/storage';

// ICONOS
import download from '../assets/icons/descargar.png';
import iconoAbierto from '../assets/icons/desplegar-abajo.png';
import iconoCerrado from '../assets/icons/desplegar-derecha.png';
import borrar from '../assets/icons/eliminar.png';

// HOJA DE ESTILOS
import './Reports.css';

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [confirmDeleteDate, setConfirmDeleteDate] = useState(null);
  const [expandedDate, setExpandedDate] = useState(null);

  useEffect(() => {
    setSales(getSales());
  }, []);

  const groupedSales = sales.reduce((groups, sale) => {
    const date = sale.date.split(',')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(sale);
    return groups;
  }, {});

  const exportAllExcel = () => {
    const dataToExport = sales.map(s => ({
      Fecha: s.date,
      Productos: s.products.map(p => `${p.name} (${p.qty}${p.measure || 'un'})`).join(', '),
      Total: s.total,
      Metodo: s.method || 'No especificado'
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas_Totales');
    XLSX.writeFile(wb, 'reporte_ventas_general.xlsx');
  };

  const exportDayPDF = (date, daySales) => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Reporte de Ventas - Fecha: ${date}`, 14, 15);
    
    const totalDelDia = daySales.reduce((acc, s) => acc + s.total, 0);

    const tableData = daySales.map(s => [
      s.date.split(',')[1],
      s.products.map(p => `${p.name} (x${p.qty}${p.measure || ''})`).join('\n'),
      s.method || 'Efectivo',
      `$${s.total.toFixed(0)}`
    ]);

    // CORRECCIÓN: Llamada a autoTable como función independiente
    autoTable(doc, {
      head: [['Horario', 'Productos', 'Método de pago', 'Monto']],
      body: tableData,
      startY: 25,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      foot: [['', '', 'TOTAL DEL DÍA:', `$${totalDelDia.toFixed(0)}`]],
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
    });

    doc.save(`ventas_${date.replace(/\//g, '-')}.pdf`);
  };

  const deleteDaySales = (date) => {
    const remainingSales = sales.filter(s => s.date.split(',')[0] !== date);
    saveSales(remainingSales);
    setSales(remainingSales);
    setConfirmDeleteDate(null);
  };

  const toggleExpand = (date) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  return (
    <div className="reports">
      <div className="reports-header">
        <h2>Registro de Ventas</h2>
        <button className="btn-excel-all" onClick={exportAllExcel}>
          <img src={download} alt='download'/> Descarga general (Excel)
        </button>
      </div>

      <div className="sales-list">
        <h3>Ventas agrupadas por día</h3>
        {Object.keys(groupedSales).length === 0 ? (
          <p>No hay registros de ventas.</p>
        ) : (
          Object.entries(groupedSales).reverse().map(([date, daySales]) => (
            <div key={date} className="day-group-container">
              <div className={`day-row ${expandedDate === date ? 'active' : ''}`} onClick={() => toggleExpand(date)}>
                <span className="date-info">
                  <span className="arrow">
                    {expandedDate === date ? (
                      <img src={iconoAbierto} alt="Desplegado" className="icon-flecha" />
                    ) : (
                      <img src={iconoCerrado} alt="Contraído" className="icon-flecha" />
                    )}
                  </span>
                  <strong className='date'>{date}</strong> — {daySales.length} tickets — 
                  <span className="day-total-label"> 
                    <strong>Total:</strong> ${daySales.reduce((acc, s) => acc + s.total, 0).toFixed(0)}
                  </span>
                </span>
                <div className="day-actions" onClick={(e) => e.stopPropagation()}>
                  {confirmDeleteDate === date ? (
                    <div className="inline-confirm">
                      <button className="btn-confirm-yes" onClick={() => deleteDaySales(date)}>Sí</button>
                      <button className="btn-confirm-no" onClick={() => setConfirmDeleteDate(null)}>No</button>
                    </div>
                  ) : (
                    <>
                      <button className="btn-pdf" onClick={() => exportDayPDF(date, daySales)}>
                        <img src={download} alt='download'/> PDF
                      </button>
                      <button className="btn-delete" onClick={() => setConfirmDeleteDate(date)}>
                        <img src={borrar} alt='delete'/>
                      </button>
                    </>
                  )}
                </div>
              </div>
              {expandedDate === date && (
                <div className="day-preview-details">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Hora</th>
                        <th>Detalle</th>
                        <th>Pago</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daySales.map((sale) => (
                        <tr key={sale.id}>
                          <td className="time-col">{sale.date.split(',')[1]}</td>
                          <td className="prod-col">
                            {sale.products.map((p, i) => (
                              <div key={i} className="mini-prod-line">
                                {p.name} <span className="qty-tag">({p.qty}{p.measure || 'un'})</span>
                              </div>
                            ))}
                          </td>
                          <td className="method-col">{sale.method}</td>
                          <td className="price-col">${sale.total.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reports;