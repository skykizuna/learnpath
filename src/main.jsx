import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Initialize storage API using IndexedDB
const initStorageAPI = async () => {
  return new Promise((resolve) => {
    const dbRequest = indexedDB.open('LearnPathDB', 1);
    
    dbRequest.onerror = () => {
      console.error('Failed to open IndexedDB');
      resolve(null);
    };
    
    dbRequest.onsuccess = (event) => {
      const db = event.target.result;
      
      window.storage = {
        set: async (key, value, isLargeData = false) => {
          return new Promise((resolve, reject) => {
            try {
              const transaction = db.transaction(['data'], 'readwrite');
              const objectStore = transaction.objectStore('data');
              const request = objectStore.put({ key, value });
              
              request.onsuccess = () => resolve({ success: true });
              request.onerror = () => reject(new Error('Failed to set data'));
            } catch (error) {
              reject(error);
            }
          });
        },
        
        get: async (key, isLargeData = false) => {
          return new Promise((resolve, reject) => {
            try {
              const transaction = db.transaction(['data'], 'readonly');
              const objectStore = transaction.objectStore('data');
              const request = objectStore.get(key);
              
              request.onsuccess = () => {
                const result = request.result;
                resolve(result ? { value: result.value } : null);
              };
              request.onerror = () => reject(new Error('Failed to get data'));
            } catch (error) {
              reject(error);
            }
          });
        },
        
        list: async (prefix, isLargeData = false) => {
          return new Promise((resolve, reject) => {
            try {
              const transaction = db.transaction(['data'], 'readonly');
              const objectStore = transaction.objectStore('data');
              const request = objectStore.getAll();
              
              request.onsuccess = () => {
                const results = request.result;
                const keys = results
                  .filter(item => item.key.startsWith(prefix))
                  .map(item => item.key);
                resolve({ keys });
              };
              request.onerror = () => reject(new Error('Failed to list data'));
            } catch (error) {
              reject(error);
            }
          });
        },
        
        delete: async (key, isLargeData = false) => {
          return new Promise((resolve, reject) => {
            try {
              const transaction = db.transaction(['data'], 'readwrite');
              const objectStore = transaction.objectStore('data');
              const request = objectStore.delete(key);
              
              request.onsuccess = () => resolve({ success: true });
              request.onerror = () => reject(new Error('Failed to delete data'));
            } catch (error) {
              reject(error);
            }
          });
        }
      };
      
      resolve(window.storage);
    };
    
    dbRequest.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data', { keyPath: 'key' });
      }
    };
  });
};

// Initialize storage before rendering the app
initStorageAPI().then(() => {
  console.log('Storage initialized, rendering app...');
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}).catch((error) => {
  console.error('Failed to initialize storage:', error);
  // Render app anyway even if storage fails
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});