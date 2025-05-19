import type { Cookies } from '@sveltejs/kit';
import { get_access_token } from './cookies.utils.js';

type LockFunction = { set: (value: boolean) => void };
type ConnectionInfo = { lock: LockFunction };

/**
 * Creates an endpoint-specific SSE connection manager
 */
export function createConnectionManager(endpointName: string) {
	const clientConnections = new Map<string, Set<ConnectionInfo>>();

	return {
		/**
		 * Generates a client ID primarily from access token, with fallbacks
		 */
		getClientId(request: Request, cookies: Cookies, tabId: string): string {
			const accessToken = get_access_token(cookies);

			if (accessToken) {
				return `${accessToken}-${endpointName}-${tabId}`;
			}

			const clientProvidedId = request.headers.get('x-client-id');
			if (clientProvidedId) {
				return `${clientProvidedId}-${endpointName}-${tabId}`;
			}

			return `${request.headers.get('user-agent')}-${get_access_token(cookies) || ''}-${endpointName}-${tabId}`;
		},

		/**
		 * Registers a new connection and closes previous ones for the same client
		 * @returns A cleanup function to be called when the connection closes
		 */
		registerConnection(clientId: string, lock: LockFunction): () => void {
			console.log(
				`[SSE:${endpointName}] New connection for client: ${clientId}`,
			);

			// Close previous connections for this client
			if (clientConnections.has(clientId)) {
				const connections = clientConnections.get(clientId);
				connections?.forEach((conn) => {
					try {
						conn.lock.set(false); // Signal previous connections to close
					} catch (err) {
						// Handle potential errors if connection already closed
					}
				});
			}

			// Create or update connections set for this client
			if (!clientConnections.has(clientId)) {
				clientConnections.set(clientId, new Set());
			}

			// Add current connection to the set
			const currentConnection = { lock };
			clientConnections.get(clientId)?.add(currentConnection);

			// Return cleanup function
			return () => {
				console.log(
					`[SSE:${endpointName}] Connection closed for client: ${clientId}`,
				);

				// Remove this connection from the tracked set
				clientConnections.get(clientId)?.delete(currentConnection);

				// Clean up empty client entries
				if (clientConnections.get(clientId)?.size === 0) {
					clientConnections.delete(clientId);
				}
			};
		},

		/**
		 * Gets the count of active connections for a client
		 */
		getConnectionCount(clientId: string): number {
			return clientConnections.get(clientId)?.size || 0;
		},

		/**
		 * Gets the total number of active connections for this endpoint
		 */
		getTotalConnectionCount(): number {
			let count = 0;
			for (const connections of clientConnections.values()) {
				count += connections.size;
			}
			return count;
		},

		/**
		 * Clears all connections for this endpoint (useful for testing or resets)
		 */
		clearAllConnections(): void {
			// Signal all connections to close
			for (const connections of clientConnections.values()) {
				for (const conn of connections) {
					try {
						conn.lock.set(false);
					} catch (err) {
						// Ignore errors for already closed connections
					}
				}
			}
			clientConnections.clear();
		},
	};
}
