import { auth } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginBox = document.getElementById('login-box');
const signupBox = document.getElementById('signup-box');
const showSignupBtn = document.getElementById('show-signup');
const showLoginBtn = document.getElementById('show-login');

const welcomeContainer = document.getElementById('welcome-container');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const userInfo = document.getElementById('user-info');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

const btnGetStarted = document.getElementById('btn-get-started');
const btnGuestMode = document.getElementById('btn-guest-mode');

// Navigation Logic
function showWelcome() {
    welcomeContainer.classList.remove('hidden');
    authContainer.classList.add('hidden');
    appContainer.classList.add('hidden');
    userInfo.classList.add('hidden');
}

function showAuth() {
    welcomeContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
    userInfo.classList.add('hidden');
}

function showApp(user) {
    welcomeContainer.classList.add('hidden');
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');

    if (user) {
        // Logged In
        userInfo.classList.remove('hidden');
        userEmailSpan.textContent = user.email;
        logoutBtn.classList.remove('hidden');
    } else {
        // Guest Mode
        userInfo.classList.remove('hidden');
        userEmailSpan.textContent = "Guest Mode (Not Saving)";
        // Show a "Switch to Login" instead of Logout? Or just Logout returns to welcome.
        logoutBtn.textContent = "Exit Guest Mode";
        logoutBtn.classList.remove('hidden');
    }
}

// Welcome Page Listeners
btnGetStarted.addEventListener('click', showAuth);

// Guest Mode Redirect
btnGuestMode.addEventListener('click', () => {
    window.location.href = 'guestmode.html';
});

// Toggle between Login and Signup
showSignupBtn.addEventListener('click', () => {
    loginBox.classList.add('hidden');
    signupBox.classList.remove('hidden');
});

showLoginBtn.addEventListener('click', () => {
    signupBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
});

// Authentication State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        console.log("User in:", user.email);
        showApp(user);
    } else {
        // User is signed out.
        // BUT, we don't want to force them to Welcome Screen if they just clicked "Guest Mode".
        // This observer fires on load. 
        // If we are in Guest Mode, stay there? 
        // Simple approach: Default is Welcome. 
        // If user logs out, go to Welcome.
        // If page loads and no user, go to Welcome.
        // guest mode is manual trigger.
        console.log("User out");
        // Only force welcome if we are not explicitly in guest mode? 
        // For simplicity, let's just make showApp(null) handle the UI.
        // If we are refreshing, we lose "Guest Mode" state (unless we use sessionStorage, but let's keep it simple).
        // So on refresh -> Welcome.
        if (appContainer.classList.contains('hidden')) {
            // If app is hidden, we might be in auth or welcome. 
            // If we are in auth, stay in auth? 
            // If we are in welcome, stay in welcome.
            // If we just logged out, we want Welcome.
        }
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        showWelcome(); // Force return to welcome
    } catch (error) {
        console.error(error);
        showWelcome();
    }
});

// Login Form Handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle showing the app
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
    }
});

// Signup Form Handler
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        await createUserWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle showing the app
    } catch (error) {
        console.error('Signup error:', error);
        alert('Signup failed: ' + error.message);
    }
});
