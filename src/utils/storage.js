const ElectronStore = window.require('electron-store');
const Store = typeof ElectronStore === 'function' ? ElectronStore : ElectronStore.default;

//CONFIRMACION
const store = new Store({
  projectName: 'pos-app' 
});

export const getProducts = () => store.get('products', []);
export const saveProducts = (products) => store.set('products', products);
export const getSales = () => store.get('sales', []);
export const saveSales = (sales) => store.set('sales', sales);