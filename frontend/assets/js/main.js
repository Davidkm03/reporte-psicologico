// frontend/js/main.js

// Configuration object to store user preferences
const config = {
    logo: null,
    header: null,
    footer: null,
    watermark: null,
    primaryColor: '#0d6efd',
    secondaryColor: '#6c757d',
    headerFont: 'Arial',
    bodyFont: 'Arial',
    enableWatermark: false,
    templates: [], // Array para almacenar plantillas
    userId: null, // Para identificar al usuario autenticado
};

// Function to handle image preview
function handleImagePreview(input, previewId) {
    const preview = document.getElementById(previewId);
    const file = input.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.remove('d-none');
            const key = previewId.replace('Preview', '').toLowerCase();
            config[key] = e.target.result;
            saveConfig();
            updatePreview();
            syncConfigWithBackend(); // Sincroniza con el backend
        };
        reader.readAsDataURL(file);
    }
}

// Function to handle color changes
function handleColorChange(colorId, targetClass) {
    const colorInput = document.getElementById(colorId);
    colorInput.addEventListener('input', function(e) {
        document.querySelectorAll(targetClass).forEach(element => {
            element.style.color = e.target.value;
        });
        config[colorId] = e.target.value;
        saveConfig();
        updatePreview();
        syncConfigWithBackend();
    });
}

// Function to handle font changes
function handleFontChange(fontId, targetClass) {
    const fontSelect = document.getElementById(fontId);
    fontSelect.addEventListener('change', function(e) {
        document.querySelectorAll(targetClass).forEach(element => {
            element.style.fontFamily = e.target.value;
        });
        config[fontId] = e.target.value;
        saveConfig();
        updatePreview();
        syncConfigWithBackend();
    });
}

// Function to handle watermark toggle
function handleWatermarkToggle() {
    const watermarkToggle = document.getElementById('enableWatermark');
    watermarkToggle.addEventListener('change', function(e) {
        config.enableWatermark = e.target.checked;
        saveConfig();
        syncConfigWithBackend();
    });
}

// Update preview panel dynamically
function updatePreview() {
    const preview = document.getElementById('stylePreview');
    const title = preview.querySelector('.preview-title');
    const text = preview.querySelector('.preview-text');
    const logo = preview.querySelector('img');

    title.style.color = config.primaryColor;
    title.style.fontFamily = config.headerFont;
    text.style.color = config.secondaryColor;
    text.style.fontFamily = config.bodyFont;
    
    if (config.logo) {
        logo.src = config.logo;
        logo.classList.remove('d-none');
    } else {
        logo.classList.add('d-none');
    }
}

// Save configuration to localStorage
function saveConfig() {
    localStorage.setItem('reportConfig', JSON.stringify(config));
    showToast('Configuración guardada localmente', 'success');
}

// Load configuration from localStorage
function loadConfig() {
    const savedConfig = localStorage.getItem('reportConfig');
    if (savedConfig) {
        Object.assign(config, JSON.parse(savedConfig));
        applyConfig();
    }
    syncConfigWithBackend(); // Sincroniza con el backend al cargar
}

// Apply loaded configuration to the UI
function applyConfig() {
    // Images
    ['logo', 'header', 'footer', 'watermark'].forEach(item => {
        if (config[item]) {
            const preview = document.getElementById(`${item}Preview`);
            if (preview) {
                preview.src = config[item];
                preview.classList.remove('d-none');
            }
        }
    });

    // Colors
    document.getElementById('primaryColor').value = config.primaryColor;
    document.querySelectorAll('.preview-title').forEach(el => el.style.color = config.primaryColor);
    document.getElementById('secondaryColor').value = config.secondaryColor;
    document.querySelectorAll('.preview-text').forEach(el => el.style.color = config.secondaryColor);

    // Fonts
    document.getElementById('headerFont').value = config.headerFont;
    document.querySelectorAll('.preview-title').forEach(el => el.style.fontFamily = config.headerFont);
    document.getElementById('bodyFont').value = config.bodyFont;
    document.querySelectorAll('.preview-text').forEach(el => el.style.fontFamily = config.bodyFont);

    // Watermark
    document.getElementById('enableWatermark').checked = config.enableWatermark;
    updatePreview();
}

// Show toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0 position-fixed bottom-0 end-0 m-3`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.body.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    setTimeout(() => toast.remove(), 3000);
}

// Synchronize configuration with backend
async function syncConfigWithBackend() {
    try {
        const token = localStorage.getItem('authToken'); // Suponiendo que usas un token de autenticación
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(config)
        });
        if (!response.ok) throw new Error('Error al sincronizar configuración');
        showToast('Configuración sincronizada con el servidor', 'success');
    } catch (error) {
        showToast(`Error: ${error.message}`, 'danger');
    }
}

// Load user-specific config from backend
async function loadConfigFromBackend() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/config', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Error al cargar configuración');
        const data = await response.json();
        Object.assign(config, data);
        applyConfig();
        saveConfig();
    } catch (error) {
        showToast(`Error: ${error.message}`, 'danger');
    }
}

// Template management
function handleTemplates() {
    const templateList = document.querySelector('#templates .list-group');
    const newTemplateBtn = document.querySelector('#templates .btn-primary');
    
    newTemplateBtn.addEventListener('click', async () => {
        const templateName = prompt('Nombre de la nueva plantilla:');
        if (templateName) {
            const newTemplate = {
                name: templateName,
                category: 'General',
                sections: []
            };
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/templates', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newTemplate)
                });
                if (!response.ok) throw new Error('Error al crear plantilla');
                const createdTemplate = await response.json();
                config.templates.push(createdTemplate);
                saveConfig();
                renderTemplates();
                showToast('Plantilla creada exitosamente', 'success');
            } catch (error) {
                showToast(`Error: ${error.message}`, 'danger');
            }
        }
    });

    async function renderTemplates() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/templates', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Error al cargar plantillas');
            config.templates = await response.json();
            templateList.innerHTML = '';
            config.templates.forEach((template, index) => {
                const item = document.createElement('a');
                item.href = '#';
                item.className = 'list-group-item list-group-item-action';
                item.innerHTML = `
                    <div class="d-flex w-100 justify-content-between">
                        <h6 class="mb-1">${template.name}</h6>
                        <small><i class="far fa-star"></i></small>
                    </div>
                    <small class="text-muted">${template.category}</small>
                `;
                item.addEventListener('click', () => loadTemplateEditor(index));
                templateList.appendChild(item);
            });
        } catch (error) {
            showToast(`Error: ${error.message}`, 'danger');
        }
    }

    function loadTemplateEditor(index) {
        const template = config.templates[index];
        document.querySelector('#templates input.form-control').value = template.name;
        document.querySelector('#templates select.form-select').value = template.category;
    }

    renderTemplates();
}

// Report generation
function handleReport() {
    const saveBtn = document.querySelector('#report .btn-success');
    saveBtn.addEventListener('click', async () => {
        const reportData = {
            patientName: document.querySelector('#report input[placeholder="Nombre completo"]')?.value,
            age: document.querySelector('#report input[type="number"]')?.value,
            date: document.querySelector('#report input[type="date"]')?.value,
            reason: document.querySelector('#report textarea')?.value,
        };
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reportData)
            });
            if (!response.ok) throw new Error('Error al guardar informe');
            showToast('Informe guardado exitosamente', 'success');
        } catch (error) {
            showToast(`Error: ${error.message}`, 'danger');
        }
    });
}

// AI Assistant simulation
function handleAIAssistant() {
    const chatInput = document.querySelector('#ai-assistant .input-group input');
    const chatSend = document.querySelector('#ai-assistant .input-group button');
    const chatContainer = document.querySelector('#ai-assistant .border.rounded.p-3');

    chatSend.addEventListener('click', async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        const userMsg = `
            <div class="d-flex mb-3 flex-row-reverse">
                <div class="flex-shrink-0">
                    <i class="fas fa-user fs-4 text-secondary"></i>
                </div>
                <div class="flex-grow-1 me-3">
                    <div class="bg-primary text-white rounded p-3">
                        <p class="mb-0">${message}</p>
                    </div>
                </div>
            </div>
        `;
        chatContainer.insertAdjacentHTML('beforeend', userMsg);

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/ai/assist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message })
            });
            if (!response.ok) throw new Error('Error al obtener respuesta de IA');
            const aiData = await response.json();

            setTimeout(() => {
                const aiResponse = `
                    <div class="d-flex mb-3">
                        <div class="flex-shrink-0">
                            <i class="fas fa-robot fs-4 text-primary"></i>
                        </div>
                        <div class="flex-grow-1 ms-3">
                            <div class="bg-light rounded p-3">
                                <p class="mb-0">${aiData.response || 'Procesando: Sugerencia basada en tu mensaje.'}</p>
                            </div>
                        </div>
                    </div>
                `;
                chatContainer.insertAdjacentHTML('beforeend', aiResponse);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }, 1000);
        } catch (error) {
            showToast(`Error: ${error.message}`, 'danger');
        }

        chatInput.value = '';
    });
}

// Settings management
function handleSettings() {
    const saveSettingsBtn = document.querySelector('#settings .btn-success');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', async () => {
            const settings = {
                professionalName: document.querySelector('#settings input[placeholder="Nombre Completo"]')?.value,
                license: document.querySelector('#settings input[placeholder="Número de Licencia"]')?.value,
            };
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(settings)
                });
                if (!response.ok) throw new Error('Error al guardar ajustes');
                showToast('Configuración de ajustes guardada', 'success');
            } catch (error) {
                showToast(`Error: ${error.message}`, 'danger');
            }
        });
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication and load user data
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/auth/login'; // Redirige si no hay token
        return;
    }

    loadConfigFromBackend(); // Cargar configuración desde el backend

    // Personalization tab
    ['logoInput', 'headerInput', 'footerInput', 'watermarkInput'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', () => handleImagePreview(input, id.replace('Input', 'Preview')));
        }
    });

    handleColorChange('primaryColor', '.preview-title');
    handleColorChange('secondaryColor', '.preview-text');
    handleFontChange('headerFont', '.preview-title');
    handleFontChange('bodyFont', '.preview-text');
    handleWatermarkToggle();

    // Clear image buttons
    document.querySelectorAll('.btn-outline-secondary i.fa-trash').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.previousElementSibling;
            const preview = document.getElementById(input.id.replace('Input', 'Preview'));
            input.value = '';
            preview.classList.add('d-none');
            config[input.id.replace('Input', '').toLowerCase()] = null;
            saveConfig();
            updatePreview();
            syncConfigWithBackend();
        });
    });

    // Other tabs
    handleTemplates();
    handleReport();
    handleAIAssistant();
    handleSettings();
});