import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { app } from "./firebase.js";
import { initAuthListener } from "./auth.js";

const auth = getAuth(app);
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

function showError(message) {
  if (!loginError) return;
  loginError.textContent = message;
  loginError.classList.add('show');
}

function clearError() {
  if (!loginError) return;
  loginError.classList.remove('show');
}

initAuthListener({
  onReady: function(state) {
    if (state.isAdmin) {
      window.location.href = 'admin.html';
    }
  }
});

if (loginForm) {
  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPass').value.trim();

    clearError();

    signInWithEmailAndPassword(auth, email, password)
      .then(function() {
        window.location.href = 'admin.html';
      })
      .catch(function(error) {
        let message = 'Usuario o contraseña incorrectos.';
        if (error && error.code === 'auth/invalid-credential') {
          message = 'Credenciales inválidas.';
        }
        showError(message);
      });
  });
}
