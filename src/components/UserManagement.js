import React, { useState, useEffect } from 'react';
//ICONOS
import borrar from '../assets/icons/eliminar.png';
import plus from '../assets/icons/plus.png';
//HOJA DE ESTILOS
import './UserManagement.css';

const { ipcRenderer } = window.require('electron');

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ user: '', pass: '', role: 'USER' });
  const [msg, setMsg] = useState({ text: '', isError: false });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await ipcRenderer.invoke('get-all-users');
    setUsers(data);
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!newUser.user || !newUser.pass) {
      setMsg({ text: "Completa todos los campos.", isError: true });
      return;
    }

    if (users.find(u => u.user.toLowerCase() === newUser.user.toLowerCase())) {
      setMsg({ text: "El nombre de usuario ya existe.", isError: true });
      return;
    }

    const updatedUsers = [...users, newUser];
    const success = await ipcRenderer.invoke('save-users', updatedUsers);
    
    if (success) {
      setUsers(updatedUsers);
      setNewUser({ user: '', pass: '', role: 'USER' });
      setMsg({ text: "Usuario agregado con éxito.", isError: false });
      setTimeout(() => setMsg({ text: '', isError: false }), 3000);
    }
  };

  const deleteUser = async (index) => {
    const userToDelete = users[index];
    const admins = users.filter(u => u.role === 'ADMIN');

    // LÓGICA PEDIDA: Solo permitir borrar si queda al menos otro ADMIN
    if (userToDelete.role === 'ADMIN' && admins.length <= 1) {
      setMsg({ 
        text: "No se puede eliminar: debe quedar al menos un Administrador en el sistema.", 
        isError: true 
      });
      setTimeout(() => setMsg({ text: '', isError: false }), 4000);
      return;
    }

    const updatedUsers = users.filter((_, i) => i !== index);
    const success = await ipcRenderer.invoke('save-users', updatedUsers);
    
    if (success) {
      setUsers(updatedUsers);
      setMsg({ text: `Usuario "${userToDelete.user}" eliminado correctamente.`, isError: false });
      setTimeout(() => setMsg({ text: '', isError: false }), 3000);
    } else {
      setMsg({ text: "Error al intentar eliminar el usuario.", isError: true });
      setTimeout(() => setMsg({ text: '', isError: false }), 4000);
    }
  };

  return (
    <div className="user-management">
      <div className="management-header">
        <h2>Gestión de usuarios y permisos</h2>
      </div>
      <form className="register-user" onSubmit={handleAddUser}>
        <input 
          type="text" 
          placeholder="Nombre de Usuario" 
          value={newUser.user} 
          onChange={e => setNewUser({...newUser, user: e.target.value})}
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={newUser.pass} 
          onChange={e => setNewUser({...newUser, pass: e.target.value})}
        />
        <select 
          value={newUser.role} 
          onChange={e => setNewUser({...newUser, role: e.target.value})}
        >
          <option value="USER">Empleado</option>
          <option value="ADMIN">Administrador</option>
        </select>
        <button type="submit" className="register-btn"><img src={plus} alt='plus' className='plus'/> Agregar usuario</button>
      </form>

      <div className='state-msg'>
        {msg.text && (
          <div className='msg' style={{ 
            color: msg.isError ? 'var(--red)' : 'var(--green)', 
            backgroundColor: msg.isError ? '#f9dfde' : '#eafaf1',
            border: `1px solid ${msg.isError ? 'var(--red)' : 'var(--green)'}`
          }}>
            {msg.text}
          </div>
        )}
      </div>

      <div className="data-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol / Permisos</th>
              <th>Contraseña</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => {
              const isOnlyAdmin = u.role === 'ADMIN' && users.filter(usr => usr.role === 'ADMIN').length <= 1;
              return (
                <tr key={i}>
                  <td><strong>{u.user}</strong></td>
                  <td>{u.role === 'ADMIN' ? 'Administrador' : 'Empleado'}</td>
                  <td>{u.pass}</td>
                  <td>
                    <button 
                      onClick={() => deleteUser(i)} 
                      className='delete-register'
                      style={{ 
                        opacity: isOnlyAdmin ? 0.3 : 1,
                        cursor: isOnlyAdmin ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <img src={borrar} alt='delete'/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;