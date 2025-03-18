import { useEffect, useRef, useCallback } from 'react';

interface WebSocketControlProps {
    onStart: () => void;
    onStop: () => void;
}

// Keep a single WebSocket instance across hook instances
let globalWs: WebSocket | null = null;
let globalReconnectTimeout: number | null = null;

export function useWebSocketControl({ onStart, onStop }: WebSocketControlProps) {
    const wsRef = useRef<WebSocket | null>(null);
    const onStartRef = useRef(onStart);
    const onStopRef = useRef(onStop);

    // Update refs when callbacks change
    useEffect(() => {
        onStartRef.current = onStart;
        onStopRef.current = onStop;
    }, [onStart, onStop]);

    const connect = useCallback(() => {
        try {
            // If we already have a global connection, use it
            if (globalWs?.readyState === WebSocket.OPEN) {
                wsRef.current = globalWs;
                return;
            }

            // Clear any existing connection
            if (globalWs) {
                globalWs.close();
                globalWs = null;
            }

            if (globalReconnectTimeout) {
                window.clearTimeout(globalReconnectTimeout);
                globalReconnectTimeout = null;
            }

            const ws = new WebSocket(`ws://${window.location.host}/ws`);
            wsRef.current = ws;
            globalWs = ws;

            ws.onopen = () => {
                console.log('WebSocket connection established');
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if (message.command === 'transcribe-start') {
                        onStartRef.current();
                    } else if (message.command === 'transcribe-stop') {
                        onStopRef.current();
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = (event) => {
                console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
                wsRef.current = null;
                globalWs = null;

                // Only attempt to reconnect if this wasn't a normal closure
                if (event.code !== 1000 && event.code !== 1001) {
                    // Attempt to reconnect after 5 seconds
                    globalReconnectTimeout = window.setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        connect();
                    }, 5000);
                }
            };
        } catch (error) {
            console.error('Error creating WebSocket connection:', error);
        }
    }, []); // Empty dependency array since we use refs for callbacks

    useEffect(() => {
        // Only connect if we don't have a global connection
        if (!globalWs || globalWs.readyState !== WebSocket.OPEN) {
            connect();
        } else {
            wsRef.current = globalWs;
        }

        return () => {
            // Don't close the global WebSocket on unmount
            wsRef.current = null;
        };
    }, [connect]);

    return {
        ws: wsRef.current,
        reconnect: connect
    };
} 