import { io } from "socket.io-client";

// On pointe vers l'URL de ton serveur Node.js (Objectif 1)
const SOCKET_URL = "http://localhost:3001";

export const socket = io(SOCKET_URL, {
    autoConnect: false, // On ne connecte pas tout de suite, on attend le chargement du composant
});