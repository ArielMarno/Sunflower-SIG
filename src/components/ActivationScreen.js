import { useState, useEffect } from 'react';
//HOJA DE ESTILOS
import './ActivationScreen.css';
//LOGO
import logoact from '../assets/logo.png';

const { ipcRenderer } = window.require('electron');

const ActivationScreen = ({ onActivate, logo }) => {
  const [machineID, setMachineID] = useState('CARGANDO ID...');
  const [inputToken, setInputToken] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const getID = async () => {
      try {
        const id = await ipcRenderer.invoke('get-machine-id');
        // PORCIÓN DE ID (12)
        setMachineID(id.substring(0, 12).toUpperCase());
      } catch (err) {
        console.error("Error al obtener Machine ID:", err);
        setMachineID('ERROR-ID-FS');
      }
    };
    getID();
  }, []);

  const handleActivate = async (e) => {
    e.preventDefault();
    
    const rawToken = `Gloriaeterna.8${machineID}`;
    const EXPECTED_B64_TOKEN = btoa(rawToken);

    if (inputToken.trim() === EXPECTED_B64_TOKEN) {
      //GUARDADO EN ELECTRON (DISCO DURO)
      await ipcRenderer.invoke('save-activation', true);
      onActivate();
    } else {
      setError(true);
      setInputToken('');
      setTimeout(() => setError(false), 2500);
    }
  };

  return (
    <div className="act-overlay">
      <div className="act-card">
        <div className="act-header">
          <img src={logoact} alt="Sunflower Logo" className="act-logo" />
          <h1>Activación de Producto</h1>
          <p>Sunflower Sistema Integral de Gestión</p>
        </div>

        <div className="act-id-box">
          <label>Proporcione este ID para recibir su token.</label>
          <div className="act-machine-id">{machineID}</div>
        </div>

        <form onSubmit={handleActivate} className="act-form">
          <label>INGRESE SU TOKEN DE ACTIVACIÓN:</label>
          <input
            type="text"
            placeholder="XXXX-XXXX-XXXX"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            className={error ? 'act-input-error' : ''}
            required
            autoFocus
          />
          <div className="act-btn-container">
            <button type="submit" className="act-btn">
                ACTIVAR LICENCIA
            </button>
            {error && <p className="act-error-msg">Token inválido para esta terminal.</p>}
            </div>
        </form>

        <div className="act-footer">
          <p>© {new Date().getFullYear()} Sunflower Agencia. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default ActivationScreen;