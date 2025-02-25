// frontend/assets/js/auth.js

// Función para comprobar si el usuario está autenticado
function isAuthenticated() {
    return localStorage.getItem('authToken') !== null;
}

// Redireccionar si no está autenticado
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Función para obtener el perfil del usuario
async function getUserProfile() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) return null;

        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token inválido o expirado
                localStorage.removeItem('authToken');
                window.location.href = '/login.html';
                return null;
            }
            throw new Error('Error al obtener perfil de usuario');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en getUserProfile:', error);
        return null;
    }
}

// Función para iniciar sesión
async function login(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al iniciar sesión');
        }

        // Guardar token en localStorage
        localStorage.setItem('authToken', data.token);
        
        // Redirigir a la página principal
        window.location.href = '/index.html';
        
        return data;
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
    }
}

// Función para registrar un nuevo usuario
async function register(userData) {
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Error al registrar usuario');
        }
        
        return data;
    } catch (error) {
        console.error('Error en register:', error);
        throw error;
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = '/login.html';
}

// Inicializar sistema de sesión
function initAuth() {
    // Agregar listener al botón de logout si existe
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Comprobar si estamos en una página protegida
    const protectedPages = ['index.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        requireAuth();
    }
    
    // Si estamos en una página de login o registro y ya estamos autenticados, redirigir al inicio
    if ((currentPage === 'login.html' || currentPage === 'register.html') && isAuthenticated()) {
        window.location.href = '/index.html';
    }
}

// Mostrar información del usuario en el navbar
async function updateUserInfo() {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        const profile = await getUserProfile();
        if (profile) {
            userDisplay.textContent = profile.email;
        }
    }
}

// Inicializar sistema de advertencia de sesión
function initSessionWarning() {
    if (!isAuthenticated()) return;
    
    // Tiempo de inactividad en milisegundos (15 minutos)
    const inactivityTime = 15 * 60 * 1000;
    // Tiempo de advertencia antes de cerrar sesión (1 minuto)
    const warningTime = 60 * 1000;
    
    let inactivityTimer;
    
    function resetTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(showWarning, inactivityTime - warningTime);
    }
    
    function showWarning() {
        const warningModal = new bootstrap.Modal(document.getElementById('sessionWarningModal'));
        warningModal.show();
        
        let secondsLeft = warningTime / 1000;
        const countdownElement = document.getElementById('sessionCountdown');
        
        const countdownInterval = setInterval(() => {
            secondsLeft--;
            if (countdownElement) {
                countdownElement.textContent = secondsLeft;
            }
            
            if (secondsLeft <= 0) {
                clearInterval(countdownInterval);
                logout();
            }
        }, 1000);
        
        // Extender sesión
        document.getElementById('extendSessionBtn').addEventListener('click', () => {
            clearInterval(countdownInterval);
            warningModal.hide();
            resetTimer();
        });
    }
    
    // Eventos para resetear el temporizador
    const events = ['mousedown', 'keypress', 'touchstart', 'scroll'];
    events.forEach(event => {
        document.addEventListener(event, resetTimer, false);
    });
    
    // Iniciar temporizador
    resetTimer();
}

// Agregar modal de advertencia de sesión al body si no existe
function addSessionWarningModal() {
    if (!document.getElementById('sessionWarningModal')) {
        const modalHTML = `
        <div class="modal fade" id="sessionWarningModal" tabindex="-1" aria-labelledby="sessionWarningModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title" id="sessionWarningModalLabel">Sesión a punto de expirar</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>Su sesión expirará en <span id="sessionCountdown">60</span> segundos.</p>
                        <p>¿Desea extender su sesión?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        <button type="button" class="btn btn-primary" id="extendSessionBtn">Extender Sesión</button>
                    </div>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Inicializar todo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    updateUserInfo();
    addSessionWarningModal();
    initSessionWarning();
});