import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { showMessage } from 'react-native-flash-message';
import { useAuth } from './AuthContext';
import { BASE_URL, api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { navigate } from '../navigation/navigationRef';
import IncomingRequestModal from '../components/IncomingRequestModal';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    // Modal state
    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [incomingRequest, setIncomingRequest] = useState<any>(null);

    useEffect(() => {
        if (token && user) {
            // Connect to socket
            const newSocket = io(BASE_URL, {
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
                console.log('Global Socket: New request received', data);
                if (user.role === 'supplier') {
                    setIncomingRequest(data);
                    setRequestModalVisible(true);
                } else {
                    showMessage({
                        message: "New Service Request",
                        description: data.message || "A new service request is available",
                        type: "success",
                        backgroundColor: "#37B112",
                        icon: "info",
                        duration: 5000,
                    });
                }
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

    const handleAccept = async () => {
        if (incomingRequest && incomingRequest.request) {
            const request = incomingRequest.request;

            try {
                // Call acception endpoint
                const response = await api.post(ENDPOINTS.BOOKINGS.ACCEPT(request.id), {});

                if (response.success) {
                    setRequestModalVisible(false);
                    setIncomingRequest(null);

                    showMessage({
                        message: "Success",
                        description: "Request accepted successfully!",
                        type: "success",
                        backgroundColor: "#29B554",
                    });

                    // Navigate to my jobs screen
                    navigate('SupplierJobs');
                } else {
                    showMessage({
                        message: "Error",
                        description: response.message || "Failed to accept request",
                        type: "danger",
                    });
                }
            } catch (error) {
                console.error('Accept request error:', error);
                showMessage({
                    message: "Error",
                    description: "An unexpected error occurred",
                    type: "danger",
                });
            }
        }
    };

    const handleDecline = () => {
        setRequestModalVisible(false);
        setIncomingRequest(null);
    };

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
            {user?.role === 'supplier' && (
                <IncomingRequestModal
                    visible={requestModalVisible}
                    requestData={incomingRequest}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                />
            )}
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
