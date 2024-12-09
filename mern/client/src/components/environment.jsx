import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authenticatedFetch } from '../firebase';

const Environment = () => {
    const navigate = useNavigate();
    const API_BASE = process.env.NODE_ENV === 'production'
        ? 'https://zero-kare5-837262597425.us-central1.run.app'
        : 'http://localhost:5050';
    
    const htmlFileUrl = `/record/environment`; // Remove API_BASE as it's handled in authenticatedFetch
    const [isLoading, setIsLoading] = useState(true);
    const [htmlContent, setHtmlContent] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHtmlContent = async () => {
            try {
                const response = await authenticatedFetch(htmlFileUrl);
                const content = await response.text();
                setHtmlContent(content);
            } catch (err) {
                console.error('Error fetching HTML:', err);
                if (err.message === 'UNAUTHORIZED') {
                    // Use React Router navigation instead of window.location
                    navigate('/login', { 
                        state: { from: window.location.pathname }
                    });
                    return;
                }
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHtmlContent();
    }, [htmlFileUrl, navigate]);

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-red-500">Error loading content: {error}</div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen">
            {isLoading && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xl text-gray-600 text-center">
                    <div className="mb-4">
                        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                    Loading map...
                </div>
            )}
            {htmlContent ? (
                <iframe
                    srcDoc={htmlContent}
                    title="Embedded HTML"
                    className="w-full h-screen border-none"
                    onLoad={handleIframeLoad}
                    sandbox="allow-scripts allow-same-origin"
                />
            ) : (
                <iframe
                    src={htmlFileUrl}
                    title="Embedded HTML"
                    className="w-full h-screen border-none"
                    onLoad={handleIframeLoad}
                />
            )}
        </div>
    );
};

export default Environment;