const EmbeddedHtml = () => {
    const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://medzk-server.onrender.com'
    : 'http://localhost:5050';

    const htmlFileUrl = `${API_BASE}/record/map`; // Path to your HTML file
    return <iframe src={htmlFileUrl} title="Embedded HTML" style={{ width: "100%", height: "100vh", border: "none" }} />;
  };
  
  export default EmbeddedHtml;
  