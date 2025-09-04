import { createContext } from 'react';
export { useAuth } from './useAuth.js';

// Create the auth context
export const AuthContext = createContext(null);
// Keep this file focused on the context object only.
