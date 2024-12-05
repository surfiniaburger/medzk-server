import { Navigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

// eslint-disable-next-line react/prop-types
export const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" />;
    }
    return children;
};