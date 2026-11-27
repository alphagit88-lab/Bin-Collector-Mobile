import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { showMessage } from 'react-native-flash-message';
import { useAuth } from './AuthContext';
import { BASE_URL, api } from '../config/api';
import { ENDPOINTS } from '../config/endpoints';
import { themeColors } from '../theme/colors';
import { navigate } from '../navigation/navigationRef';
import IncomingRequestModal from '../components/IncomingRequestModal';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Helper to robustly match whether a socket event (removal/claim) matches a request
const matchesRequest = (item: any, eventData: any) => {
    if (!item || !eventData) return false;
    const itemDbId = item.request?.id || item.requestId || item.id;
    const itemCode = item.request?.request_id || item.request_id;

    const eventDbId = eventData.id !== undefined ? eventData.id : eventData.requestId;
    const eventCode = eventData.requestId || eventData.request_id;

    // Check database ID match (e.g. 121)
    if (itemDbId && eventDbId && !isNaN(Number(itemDbId)) && !isNaN(Number(eventDbId))) {
        if (Number(itemDbId) === Number(eventDbId)) return true;
    }
    // Check formatted string code match (e.g. "IE8DS")
    if (itemCode && eventCode && String(itemCode).trim().toLowerCase() === String(eventCode).trim().toLowerCase()) {
        return true;
    }
    // Cross match if eventDbId is code or eventCode is number
    if (itemCode && eventDbId && String(itemCode).trim().toLowerCase() === String(eventDbId).trim().toLowerCase()) {
        return true;
    }
    if (itemDbId && eventCode && String(itemDbId) === String(eventCode)) {
        return true;
    }
    return false;
};

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, token } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    const [requestQueue, setRequestQueue] = useState<any[]>([]);
    // Track IDs of requests the supplier declined locally (to suppress "accepted by other" toast)
    const dismissedIdsRef = useRef<Set<string>>(new Set());

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
                    setRequestQueue(prev => {
                        const exists = prev.some(item => matchesRequest(item, data));
                        if (exists) return prev;
                        return [...prev, data];
                    });
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
                    backgroundColor: themeColors.primaryLight2,
                    icon: "success",
                    duration: 5000,
                });
            });

            // Handle real-time removal when accepted by another supplier or cancelled
            const removeOrderFromQueue = (data: any) => {
                setRequestQueue(prev => {
                    const matchedItem = prev.find(item => matchesRequest(item, data));
                    if (matchedItem) {
                        const dbId = String(matchedItem.request?.id || matchedItem.id || '');
                        const code = matchedItem.request?.request_id || matchedItem.requestId || '';
                        // Only show toast if the supplier didn't locally dismiss this request themselves
                        const wasDismissedByUser = dismissedIdsRef.current.has(dbId) || (code && dismissedIdsRef.current.has(code));
                        if (!wasDismissedByUser) {
                            showMessage({
                                message: "Request No Longer Available",
                                description: data?.message || `Request ${code ? '#' + code : ''} has been accepted by another supplier.`,
                                type: "info",
                                backgroundColor: "#DC2626",
                                duration: 4000,
                            });
                        }
                        // Clean up from dismissed set
                        if (dbId) dismissedIdsRef.current.delete(dbId);
                        if (code) dismissedIdsRef.current.delete(code);
                        return prev.filter(item => !matchesRequest(item, data));
                    }
                    return prev;
                });
            };

            newSocket.on('request_removed', (data) => {
                console.log('Global Socket: Request removed', data);
                removeOrderFromQueue(data);
            });

            newSocket.on('order_claimed', (data) => {
                console.log('Global Socket: Order claimed', data);
                removeOrderFromQueue(data);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            setSocket(null);
            setConnected(false);
            setRequestQueue([]);
        }
    }, [token, user]);

    const currentRequest = requestQueue[0] || null;

    const handleAccept = async () => {
        if (currentRequest && currentRequest.request) {
            const request = currentRequest.request;
            const acceptedId = request.id;

            // Remove current request from queue immediately so UI advances (match by DB id directly)
            setRequestQueue(prev => prev.filter(item => Number(item.request?.id ?? item.id) !== Number(acceptedId)));

            try {
                // Call acception endpoint
                const response = await api.post(ENDPOINTS.BOOKINGS.ACCEPT(request.id), {});

                if (response.success) {
                    showMessage({
                        message: "Success",
                        description: "Request accepted successfully!",
                        type: "success",
                        backgroundColor: themeColors.primaryLight2,
                    });

                    // Navigate to my jobs screen
                    navigate('SupplierJobs');
                } else {
                    showMessage({
                        message: "Unable to Accept Request",
                        description: response.message || "This request may have already been accepted by another supplier.",
                        type: "danger",
                        duration: 5000,
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

    const handleDecline = async () => {
        if (currentRequest && currentRequest.request) {
            // Capture data BEFORE any async or state changes
            const reqId = currentRequest.request.id;
            const reqCode = currentRequest.request.request_id;
            const capturedRequest = currentRequest;

            // Mark as dismissed by user so we suppress any "No Longer Available" toast
            if (reqId) dismissedIdsRef.current.add(String(reqId));
            if (reqCode) dismissedIdsRef.current.add(String(reqCode));

            // Pop from queue immediately so modal closes (match by DB id directly — not by queue item shape)
            setRequestQueue(prev => prev.filter(item => Number(item.request?.id ?? item.id) !== Number(reqId)));

            // Show confirmation toast immediately (don't wait for API)
            showMessage({
                message: "Request Declined",
                description: `Request ${reqCode ? '#' + reqCode : ''} has been declined.`,
                type: "warning",
                backgroundColor: "#F59E0B",
                duration: 3000,
            });

            try {
                await api.delete(ENDPOINTS.BOOKINGS.CANCEL(String(reqId)));
            } catch (err) {
                console.error('Error declining request:', err);
            }
        }
    };

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
            {user?.role === 'supplier' && (
                <IncomingRequestModal
                    visible={requestQueue.length > 0}
                    requestData={currentRequest}
                    queueCount={requestQueue.length}
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
