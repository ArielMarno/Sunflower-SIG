import { useState, useEffect, useCallback } from 'react';
import { getProducts, saveSales, getSales, saveProducts } from '../utils/storage';
//ICONOS
import clean from '../assets/icons/limpiar.png';
import trash from '../assets/icons/eliminar.png';
import plus from '../assets/icons/plus.png';
import pay from '../assets/icons/cobrar.png';
//HOJA DE ESTILOS
import './SaleCalculator.css';

const SaleCalculator = () => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('current_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [total, setTotal] = useState(0);
  const [paid, setPaid] = useState('');
  const [change, setChange] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [manualCode, setManualCode] = useState('');
  
  const [manualName, setManualName] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualQty, setManualQty] = useState('');
  const [manualMeasure, setManualMeasure] = useState('ud');

  const [errorScan, setErrorScan] = useState('');
  const [successSale, setSuccessSale] = useState('');

  const capitalizeFirst = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  //VALIDACIÓN DE STOCK PARA AGREGAR AL CARRITO
  const addToCartByBarcode = useCallback((code) => {
    if (!code) return;
    setErrorScan('');
    const allProducts = getProducts();
    const product = allProducts.find(p => p.barcode === code);

    if (product) {
      // VALIDACIÓN DE STOCK
      const itemInCart = cart.find(item => item.id === product.id);
      const currentQtyInCart = itemInCart ? itemInCart.qty : 0;

      if (product.quantity <= 0 || currentQtyInCart >= product.quantity) {
        setErrorScan(`¡Sin stock! Total disponible: ${product.quantity}`);
        setTimeout(() => setErrorScan(''), 3000);
        return; 
      }

      setCart(prevCart => {
        const existing = prevCart.find(item => item.id === product.id);
        if (existing) {
          return prevCart.map(item =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item
          );
        }
        return [...prevCart, { ...product, qty: 1, measure: 'ud' }];
      });
      setManualCode('');
    } else {
      setErrorScan("Producto no encontrado.");
      setTimeout(() => setErrorScan(''), 3000);
    }
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('current_cart', JSON.stringify(cart));
    
    const newTotal = cart.reduce((sum, item) => {
      let subtotal = 0;
      if (item.measure === 'g') {
        subtotal = (item.price / 1000) * item.qty;
      } else {
        subtotal = item.price * item.qty;
      }
      return sum + subtotal;
    }, 0);
    
    setTotal(newTotal);

    if (paid && paid !== '') {
      setChange(parseFloat(paid) - newTotal);
    } else {
      setChange(0);
    }
  }, [cart, paid]);

  //lOGICA DE SCANNER
  useEffect(() => {
    let scannedCode = '';
    let lastTime = Date.now();

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
      const currentTime = Date.now();
      if (currentTime - lastTime > 30) scannedCode = '';
      if (e.key === 'Enter') {
        if (scannedCode.length > 2) {
          addToCartByBarcode(scannedCode);
          scannedCode = '';
        }
      } else if (e.key.length === 1) {
        scannedCode += e.key;
      }
      lastTime = currentTime;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addToCartByBarcode]);

  const handleAddManualRow = () => {
    if (!manualName || !manualPrice || !manualQty) return;
    
    const newItem = {
      id: `manual-${Date.now()}`,
      name: manualName,
      price: parseFloat(manualPrice),
      qty: parseFloat(manualQty),
      measure: manualMeasure
    };

    setCart([newItem, ...cart]);
    setManualName('');
    setManualPrice('');
    setManualQty('');
    setManualMeasure('ud');
  };

  const calculateSubtotal = (price, qty, measure) => {
    const p = parseFloat(price) || 0;
    const q = parseFloat(qty) || 0;
    if (measure === 'g') return (p / 1000) * q;
    return p * q;
  };

  const removeItem = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const clearSale = () => {
    setCart([]); setPaid(''); setChange(0);
    localStorage.removeItem('current_cart');
  };

  const finishSale = () => {
    if (cart.length === 0) return;
    const sale = { 
      id: Date.now(), 
      products: cart, 
      total, 
      method: paymentMethod, 
      date: new Date().toLocaleString() 
    };
    saveSales([...getSales(), sale]);

    const allProducts = getProducts();
    const updated = allProducts.map(p => {
      const sold = cart.find(item => item.id === p.id);
      return (sold && !sold.id.toString().startsWith('manual-')) 
        ? { ...p, quantity: p.quantity - sold.qty } 
        : p;
    });
    
    saveProducts(updated);
    setCart([]); setPaid(''); setChange(0);
    localStorage.removeItem('current_cart'); 
    setSuccessSale(`Venta finalizada con éxito (${paymentMethod})`);
    setTimeout(() => setSuccessSale(''), 4000);
  };

  return (
    <div className="sales-mode">
      <div className="checkout-header" >
        <div className='title'>
          <h2>Escanee los productos para cobrar</h2>
        </div>
        <div className='cod-bar_inp'>
          <input 
            type="text" 
            placeholder="Código de barras + Enter" 
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addToCartByBarcode(manualCode)}
          />
          {errorScan && <p className='input-error' style={{color: 'var(--red)'}}>{errorScan}</p>}
        </div>
      </div>

      <div className="sales-container">
        <div className="ticket-area">
          <table className="ticket-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio (Ref.)</th>
                <th>Cant / Medida</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr className="manual-input-row">
                <td>
                  <input type="text" placeholder="Nombre" value={manualName} onChange={(e) => setManualName(capitalizeFirst(e.target.value))} style={{ maxWidth: '90px' }} />
                </td>
                <td>
                  <input type="number" placeholder="$" value={manualPrice} onChange={(e) => setManualPrice(e.target.value)} style={{ maxWidth: '70px' }} />
                </td>
                <td>
                  <div className='unit'>
                    <input type="number" placeholder="Cant" value={manualQty} onChange={(e) => setManualQty(e.target.value)} style={{ maxWidth: '70px' }} />
                    <select value={manualMeasure} onChange={(e) => setManualMeasure(e.target.value)}>
                      <option value="ud">ud</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                    </select>
                  </div>
                </td>
                <td className='manual-subtotal'>
                   ${calculateSubtotal(manualPrice, manualQty, manualMeasure).toFixed(0)}
                </td>
                <td>
                  <button className="add-btn-manual" onClick={handleAddManualRow}><img src={plus} alt='plus' className='plus'/>Agregar</button>
                </td>
              </tr>

              {cart.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>${item.price.toFixed(0)} <small>({item.measure})</small></td>
                  <td>{item.qty} {item.measure}</td>
                  <td>${calculateSubtotal(item.price, item.qty, item.measure).toFixed(0)}</td>
                  <td>
                    <button className="remove-item-btn" title="Eliminar" onClick={() => removeItem(item.id)}><img src={trash} alt="trash"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cart.length > 0 && (
            <button className="clear-sale-btn" onClick={clearSale}><img src={clean} alt="brush"/> Limpiar</button>
          )}
        </div>

        <div className="payment-panel">
          <div className="total-box">
            <span className='total'>TOTAL :</span>
            <span className="total-amount"><span className="money-sign">$</span>{total.toFixed(0)}</span>
          </div>
          
          <div className="payment-input">
            <label>Método de Pago:</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="QR">QR</option>
            </select>
          </div>

          <div className="payment-input">
            <label>Paga con:</label>
            <input type="number" value={paid} onChange={(e) => setPaid(e.target.value)} disabled={paymentMethod !== 'Efectivo'} />
          </div>

          <div className="change-box">
            <span className='cash-back'>Vuelto: </span>
            <div className="change-amount">
              ${(paymentMethod === 'Efectivo' && change > 0) ? change.toFixed(0) : "0.00"}
            </div>
          </div>

          <button className="finish-sale-btn" onClick={finishSale} disabled={cart.length === 0}>
            <img src={pay} alt="pay"/> FINALIZAR COBRO
          </button>
          
          {/*VENTA EXITOSA*/}
          {successSale && <p className='sell-success' style={{ 
            color: '#28a745', 
            fontWeight: '600',
            backgroundColor: '#eafaf1',
            padding: '0.5rem',
            borderRadius: '5px',
            border: '1px solid #28a745',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            marginTop: '1rem'
          }}>{successSale}</p>}
        </div>
      </div>
    </div>
  );
};

export default SaleCalculator;