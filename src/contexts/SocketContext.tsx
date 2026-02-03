import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { showMessage } from 'react-native-flash-message';
import { useAuth } from './AuthContext';
import { API_URL } from '../config/api';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (token && user) {
            // Connect to socket
            const socketUrl = API_URL.replace('/api', '');
            const newSocket = io(socketUrl, {
                auth: { token },
            });

            newSocket.on('connect', () => {
                setConnected(true);
                console.log('Socket connected');
            });

            newSocket.on('disconnect', () => {
                setConnected(false);
                console.log('Socket disconnected');
            });

            // Handle new requests for suppliers
            newSocket.on('new_request', (data) => {
                showMessage({
                    message: "New Service Request",
                    description: data.message || "A new service request is available",
                    type: "success",
                    backgroundColor: "#37B112",
                    icon: "info",
                    duration: 5000,
                });
            });

            // Handle status updates for customers
            newSocket.on('status_update', (data) => {
                showMessage({
                    message: "Booking Status Updated",
                    description: data.message || `Your booking status is now ${data.status}`,
                    type: "info",
                    backgroundColor: "#29B554",
                    icon: "success",
                    duration: 5000,
                });
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            setSocket(null);
            setConnected(false);
        }
    }, [token, user]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
