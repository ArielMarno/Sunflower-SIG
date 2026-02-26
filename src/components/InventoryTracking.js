import { useState, useEffect } from 'react';
import { getProducts, saveProducts, getSales, saveSales } from '../utils/storage';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
//ICONOS
import trash from '../assets/icons/eliminar.png';
import exportar from '../assets/icons/exportar.png';
import excel from '../assets/icons/excel.png';
import save from '../assets/icons/guardar.png';
import upload from '../assets/icons/cargar.png';
import download from '../assets/icons/descargar.png';
//HOJA DE ESTILOS
import './InventoryTracking.css';

const InventoryTracking = ({ role }) => {
  const [products, setProducts] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ text: '', isError: false });
  const [searchTerm, setSearchTerm] = useState('');

  const isAdmin = role === 'ADMIN';

  const loadProducts = () => {
    const data = getProducts();
    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const showStatus = (text, isError = false) => {
    setStatusMsg({ text, isError });
    setTimeout(() => setStatusMsg({ text: '', isError: false }), 4000);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const handleQuantityChange = (id, value) => {
    const newQuantity = value === '' ? 0 : parseInt(value, 10);
    if (newQuantity < 0) return;
    const updatedProducts = products.map(p => 
      p.id === id ? { ...p, quantity: newQuantity } : p
    );
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  const handlePriceChange = (id, newPrice) => {
    const numericPrice = newPrice === '' ? 0 : parseFloat(newPrice);
    const updatedProducts = products.map(p => 
      p.id === id ? { ...p, price: Math.round(numericPrice) || 0 } : p
    );
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  const deleteProduct = (id) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
    setDeletingId(null);
    showStatus("Producto eliminado");
  };

  const downloadOrderPDF = () => {
    const lowStock = products.filter(p => p.quantity < 5);
    if (lowStock.length === 0) {
      showStatus("No hay productos con stock bajo.", true);
      return;
    }
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();
    doc.setFontSize(18);
    doc.text("Lista de Pedido a Proveedores", 14, 20);
    doc.setFontSize(11);
    doc.text(`Fecha: ${today}`, 14, 30);
    const tableData = lowStock.map(p => [p.name, p.barcode || 'N/A', '']);
    autoTable(doc, {
      head: [['Producto', 'Código', 'Pedido (Cant.)']],
      body: tableData,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] },
      styles: { fontSize: 10, cellPadding: 7, valign: 'middle' },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 50 }, 2: { halign: 'center' } }
    });
    doc.save(`pedido_${today.replace(/\//g, '-')}.pdf`);
    showStatus("Archivo de pedido generado");
  };

  const exportBackup = () => {
    try {
      const data = { products: getProducts(), sales: getSales() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `respaldo_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
      link.click();
      showStatus("Respaldo guardado");
    } catch (e) { showStatus("Error al exportar", true); }
  };

  const importBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.products && data.sales) {
          saveProducts(data.products);
          saveSales(data.sales);
          loadProducts();
          showStatus("Respaldo cargado");
        }
      } catch (err) { showStatus("Archivo inválido", true); }
    };
    reader.readAsText(file);
  };

  const exportToExcel = () => {
    try {
      const dataToExport = products.map(p => ({ Nombre: p.name, Codigo: p.barcode || 'N/A', Stock: p.quantity, Precio: p.price }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
      XLSX.writeFile(workbook, `inventario_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
      showStatus("Excel generado");
    } catch (err) { showStatus("Error al exportar Excel", true); }
  };

  const importFromExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const newProducts = jsonData.map(row => {
          const cleanRow = {};
          Object.keys(row).forEach(key => {
            const normalizedKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            cleanRow[normalizedKey] = row[key];
          });
          return {
            id: Date.now().toString() + Math.random(),
            name: cleanRow.nombre || cleanRow.producto || "Sin nombre",
            barcode: String(cleanRow.codigo || Date.now()),
            quantity: parseInt(cleanRow.stock || cleanRow.cantidad) || 0,
            price: Math.round(parseFloat(cleanRow.precio)) || 0
          };
        });
        const combined = [...getProducts(), ...newProducts];
        saveProducts(combined);
        setProducts(combined);
        showStatus(`Sumados ${newProducts.length} productos`);
      } catch (err) { showStatus("Error en el Excel", true); }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  return (
    <div className="inventory-tracking">
      <div className="inventory-header">
        <h2>Inventario de productos</h2>
        {isAdmin && (
          <button onClick={downloadOrderPDF} className="order-pdf-btn">
            <img src={download} alt='download'/>Generar pedido
          </button>
        )}
      </div>

      <div className="inventory-search">
        <input 
          type="text" 
          placeholder="Buscar por nombre o código..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>Stock</th>
              <th>Precio</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => (
              <tr key={p.id} className={p.quantity < 5 ? 'row-red' : p.quantity < 10 ? 'row-yellow' : ''}>
                <td className='name'>{p.name}</td>
                <td className='cod'>{p.barcode || 'N/A'}</td>
                <td className="stock-cell">
                  <div className="stock-input-wrapper">
                    <input 
                      type="number" 
                      value={p.quantity === 0 ? '' : p.quantity}
                      onChange={(e) => handleQuantityChange(p.id, e.target.value)}
                      className={`stock-input ${p.quantity < 5 ? 'low-stock' : ''}`}
                      min="0"
                      placeholder="0"
                      disabled={!isAdmin}
                    />
                    {p.quantity < 10 && <span className="warning-dot">!</span>}
                  </div>
                </td>
                <td>
                  <div className="price-edit-container">
                    <span className="price-sign">$</span>
                    <input 
                      type="number" 
                      value={p.price === 0 ? '' : p.price} 
                      onChange={(e) => handlePriceChange(p.id, e.target.value)}
                      className="price-input"
                      placeholder="0"
                      disabled={!isAdmin}
                    />
                  </div>
                </td>
                <td>
                  {isAdmin && (
                    deletingId === p.id ? (
                      <div className="confirm-buttons">
                        <button onClick={() => deleteProduct(p.id)} className="btn-confirm-del">Sí</button>
                        <button onClick={() => setDeletingId(null)} className="btn-cancel-del">No</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeletingId(p.id)} className="delete-item-btn"><img src={trash} alt="trash"/></button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="backup-controls">
          <button onClick={exportBackup} className="save-btn"><img src={save} alt="save"/>Copia de seguridad</button>
          <label className="upload-btn">
            <img src={upload} alt="upload"/>Cargar copia
            <input type="file" accept=".json" onChange={importBackup} style={{ display: 'none' }} />
          </label>
          <button onClick={exportToExcel} className="excel-btn .export"><img src={exportar} alt="excel"/>Exportar Excel</button>
          <label className="excel-btn">
            <img src={excel} alt="excel"/>Importar Excel
            <input type="file" accept=".xlsx, .xls" onChange={importFromExcel} style={{ display: 'none' }} />
          </label>
        </div>
      )}

      <div className="status-message-container">
        {statusMsg.text && (
          <div className="status-box" style={{ 
            color: statusMsg.isError ? 'var(--red)' : 'var(--green)', 
            backgroundColor: statusMsg.isError ? '#fdecea' : '#eafaf1',
            padding: '10px 20px', borderRadius: '5px', border: '1px solid currentColor'
          }}>
            {statusMsg.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryTracking;