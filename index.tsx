import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 强制注入 Key 到全局环境，确保部署后能直接运行
(window as any).process = (window as any).process || { env: {} };
process.env.API_KEY = "AIzaSyCB_TbsqsVWUJ8gI9QN6OshkQ7UEZxI_QM";

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);