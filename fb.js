// Inicialização do Firebase (SDK modular via CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { FIREBASE } from "./config.js";

export const app = initializeApp(FIREBASE);
export const db = getFirestore(app);
export const auth = getAuth(app);
export * from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
