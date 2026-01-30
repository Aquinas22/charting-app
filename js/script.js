// ------------------------------
// Firebase configuration
// ------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyDjMk4VMAwXoq56RN3MJOzogd8y93VISmU",
    authDomain: "charting-app-b4ed8.firebaseapp.com",
    projectId: "charting-app-b4ed8",
    storageBucket: "charting-app-b4ed8.appspot.com",
    messagingSenderId: "907875035214",
    appId: "1:907875035214:web:d5e636bf846010f952fb1f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ------------------------------
// LOGIN LOGIC (login.html)
// ------------------------------
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = loginForm["username"].value;
        const password = loginForm["password"].value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log("Logged in:", userCredential.user);
                window.location.href = "charting.html"; // redirect after login
            })
            .catch((error) => {
                document.getElementById("loginMessage").textContent = error.message;
            });
    });
}

// ------------------------------
// SIGNUP LOGIC (signup.html)
// ------------------------------
const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = signupForm["email"].value;
        const password = signupForm["password"].value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log("User created:", userCredential.user);

                // Optional: save extra user info in Firestore
                db.collection("users").doc(userCredential.user.uid).set({
                    email: email,
                    createdAt: new Date()
                });

                // Redirect to login page after signup
                window.location.href = "login.html";
            })
            .catch((error) => {
                document.getElementById("signupMessage").textContent = error.message;
            });
    });
}

// ------------------------------
// OPTIONAL: Auth state listener
// ------------------------------
// Keeps user logged in across pages
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("User is logged in:", user.email);
        // Optionally redirect if already logged in
        // window.location.href = "charting.html";
    } else {
        console.log("No user logged in");
    }
});
