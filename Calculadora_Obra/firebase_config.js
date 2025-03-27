const firebaseConfig = {
    apiKey: "AIzaSyB_LtzRC7JF3wNlDfxYIjzY6Dug2VKixrU",
    authDomain: "calculadoraobra-bab7b.firebaseapp.com",
    projectId: "calculadoraobra-bab7b",
    storageBucket: "calculadoraobra-bab7b.firebasestorage.app",
    messagingSenderId: "636285425931",
    appId: "1:636285425931:web:73ed66804d003972bb2a0e",
    measurementId: "G-0JV48HN7N1"
};

// Incializar Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);