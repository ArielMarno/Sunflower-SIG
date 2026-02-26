import { useState } from 'react';
import { getProducts, saveProducts } from '../utils/storage';
//ICONOS
import save from '../assets/icons/guardar.png';
import clean from '../assets/icons/limpiar.png';
//HOJA DE ESTILOS
import './ProductRegistration.css';

const ProductRegistration = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });

  const handleNameChange = (e) => {
    const value = e.target.value;
    if (value.length > 0) {
      const formattedName = value.charAt(0).toUpperCase() + value.slice(1);
      setName(formattedName);
    } else {
      setName('');
    }
  };

  const handleReset = () => {
    setName('');
    setPrice('');
    setBarcode('');
    setQuantity('');
  };

  const showTemporaryMessage = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => {
      setMessage({ text: '', isError: false });
    }, 3000);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!name || !price || !barcode || !quantity) {
      showTemporaryMessage("Por favor, completa todos los campos.", true);
      return;
    }

    const products = getProducts();
    
    const isDuplicate = products.some(
      p => p.barcode === barcode.trim() || p.name.toLowerCase() === name.toLowerCase().trim()
    );

    if (isDuplicate) {
      showTemporaryMessage("El producto que intenta registrar ya se encuentra en el inventario", true);
      return;
    }

    const newProduct = { 
      id: Date.now().toString(), 
      name: name.trim(), 
      price: Math.round(parseFloat(price)), 
      barcode: barcode.trim(), 
      quantity: parseInt(quantity)
    };

    saveProducts([...products, newProduct]);
    
    handleReset();
    showTemporaryMessage("¡Producto registrado con éxito!", false);
  };

  return (
    <div className="product-registration">
      <h2>Registrar nuevo producto</h2>
      <div className="input-group">
        <label>Nombre del producto:</label>
        <input 
          type="text" 
          value={name} 
          onChange={handleNameChange} 
          placeholder="Nombre del artículo"
        />
      </div>

      <div className="input-group">
        <label>Precio de venta:</label>
        <input 
          type="number" 
          step="1" 
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
          placeholder="0"
        />
      </div>

      <div className="input-group">
        <label>Stock inicial:</label>
        <input 
          type="number" 
          value={quantity} 
          onChange={(e) => setQuantity(e.target.value)} 
          placeholder="Cantidad"
        />
      </div>
      
      <div className="input-group code">
        <label>Código de barras:</label>
        <input 
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Escanee o escriba el código"
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }} 
        />
        
        <div className="error-msg">
          {message.text && (
            <p style={{ 
              color: message.isError ? 'var(--red-hover)' : 'var(--green-hover)', 
            }}>
              {message.text}
            </p>
          )}
        </div>
      </div>

      <div className="btn-container">
        <button onClick={handleSubmit} className="add-btn">
          <img src={save} alt="save"/>Guardar
        </button>
        <button onClick={handleReset} className="clear-btn">
          <img src={clean} alt="brush"/> Limpiar
        </button>
      </div>
    </div>
  );
};

export default ProductRegistration;