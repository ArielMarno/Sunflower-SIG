import { useState, useEffect } from 'react';
import ProductRegistration from './components/ProductRegistration';
import InventoryTracking from './components/InventoryTracking';
import SaleCalculator from './components/SaleCalculator';
import Reports from './components/Reports';
import UserManagement from './components/UserManagement';
//ICONOS
import logo from './assets/logo.png';
import cart from './assets/icons/venta.png';
import box from './assets/icons/inventario.png';
import registration from './assets/icons/registro.png';
import report from './assets/icons/reportes.png';
import user from './assets/icons/user.png';
import exit from './assets/icons/exit.png';
//HOJA DE ESTILOS
import './App.css';

const { ipcRenderer } = window.require('electron');

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isChecking) return;
    setIsChecking(true);

    //VALIDACIÓN DE CREDENCIALES
    const response = await ipcRenderer.invoke('login-attempt', { username, password });

    if (response.success) {
      onLoginSuccess(response.role);
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
    setIsChecking(false);
  };

  return (
    <div className="login-overlay">
      <form className="login-card" onSubmit={handleSubmit}>
        <img src={logo} alt="Logo" style={{ width: '120px', marginBottom: '20px' }} />
        <h2>Sistema de Gestión</h2>
        <h4>Ingrese sus credenciales:</h4>
        <input type="text" placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" className="login-btn" disabled={isChecking}>
          {isChecking ? 'Iniciando...' : 'INGRESAR'}
        </button>
        <div className='password-container'>
          {error && <p className="login-error">Credenciales incorrectas.</p>}
        </div>
        <p className="copy"><span>Sunflower Agencia</span> © {new Date().getFullYear()}. Todos los derechos reservados.</p>
      </form>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState({ isAuthenticated: false, role: null });

  useEffect(() => {
    setTimeout(() => setLoading(false), 1500);
  }, []);

  //SPINNER
  if (loading) return <div className="loader-container"><div className="lds-ring"><div></div><div></div><div></div><div></div></div></div>;

  if (!auth.isAuthenticated) {
    return <Login onLoginSuccess={(role) => setAuth({ isAuthenticated: true, role })} />;
  }

  const isAdmin = auth.role === 'ADMIN';

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div className='logo-container'><img src={logo} alt="Logo" className="logo" /></div>
        <div className="nav-buttons">
          <button className={activeTab === 'sales' ? 'active' : ''} onClick={() => setActiveTab('sales')}>
            <img src={cart} alt="icon" className="btn-icon" /> Nueva venta
          </button>
          <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
            <img src={box} alt="icon" className="btn-icon" /> Inventario
          </button>
          <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
            <img src={report} alt="icon" className="btn-icon" /> Reportes
          </button>
          {isAdmin && (
            <>
              <button className={activeTab === 'register' ? 'active' : ''} onClick={() => setActiveTab('register')}>
                <img src={registration} alt="icon" className="btn-icon" /> Registrar producto
              </button>
              <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                <img src={user} alt="icon" className="btn-icon" /> Usuarios
              </button>
            </>
          )}

        </div>
        <button className="logout-sidebar-btn" onClick={() => setAuth({ isAuthenticated: false, role: null })}>
          <img src={exit} alt="exit" className="btn-icon" /> Cerrar sesión
        </button>
        <p className="copy-navbar"><span>Sunflower Agencia</span> © {new Date().getFullYear()}.<br/>
        Todos los derechos reservados.</p>
      </nav>

      <main className="content">
        {activeTab === 'sales' && <SaleCalculator />}
        {activeTab === 'inventory' && <InventoryTracking role={auth.role} />}
        {activeTab === 'reports' && <Reports role={auth.role}/>}
        {activeTab === 'register' && isAdmin && <ProductRegistration />}
        {activeTab === 'users' && isAdmin && <UserManagement />}
      </main>
    </div>
  );
}

export default App;