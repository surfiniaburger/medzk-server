/* eslint-disable react/prop-types */
import { useEffect } from 'react';

const IframeCommunicator = ({ children }) => {
  useEffect(() => {
    const iframe = document.getElementById('myIframe');
    const token = localStorage.getItem('token');

    if (iframe && token) {
      iframe.contentWindow.postMessage({ type: 'AUTH_TOKEN', token }, '*');
    }

    window.addEventListener('message', (event) => {
      // Handle messages from the iframe here
      console.log('Message received from iframe:', event.data);
    });

    return () => {
      window.removeEventListener('message', (event) => {
        // Handle messages from the iframe here
        console.log('Message received from iframe:', event.data);
      });
    };
  }, []);

  return <div>{children}</div>;
};

export default IframeCommunicator;
