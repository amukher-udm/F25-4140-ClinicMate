import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState(null);


  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setData(data);
      })
      .catch(err => console.error('Error:', err));
  }, []);

  return (
    <div className="App">
      <img src="/clinicmate_large.png" alt="" />
      <h1>ClinicMate v1.0</h1>
      <p>Care Starts with a Simple Click.</p>
      
      {data ? (
        <div className="status">
          <p>Server Status: {data.status}</p>
          <p>{data.message}</p>
        </div>
      ) : (
        <p>Failed to connect to server</p>
      )}
    </div>
  );
}

export default App;
