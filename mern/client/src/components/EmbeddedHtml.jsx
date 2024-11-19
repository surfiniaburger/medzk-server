import { useState } from "react";

const EmbeddedHtml = () => {
    const API_BASE = process.env.NODE_ENV === 'production' 
        ? 'https://medzk-server.onrender.com'
        : 'http://localhost:5050';

    const htmlFileUrl = `${API_BASE}/record/map`; // Path to your HTML file
    const [isLoading, setIsLoading] = useState(true);

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    return (
        <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            {isLoading && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "1.5rem",
                        color: "#555",
                        textAlign: "center",
                    }}
                >
                    <div className="spinner" style={{ marginBottom: "1rem" }}>
                        {/* Add a spinner or any custom animation */}
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                border: "4px solid #ccc",
                                borderTop: "4px solid #007bff",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                            }}
                        />
                    </div>
                    Loading map...
                </div>
            )}
            <iframe
                src={htmlFileUrl}
                title="Embedded HTML"
                style={{ width: "100%", height: "100vh", border: "none" }}
                onLoad={handleIframeLoad}
            />
        </div>
    );
};

export default EmbeddedHtml;
