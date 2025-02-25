// frontend/assets/js/main.js

// Configuración global
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
    templates: [],
    userId: null
};

// Estado de la aplicación
const state = {
    selectedTemplateId: null,
    currentReport: null,
    editingTemplate: null,
    lastSaved: null
};

// Función para manejo de errores
function handleError(error, message = 'Se produjo un error') {
    console.error(error);
    showToast(message + ': ' + (error.message || 'Error desconocido'), 'error');
}

// Funciones para manejo de imágenes
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
        };
        reader.readAsDataURL(file);
    }
}

// Función para limpiar una imagen
function clearImage(inputId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(inputId.replace('Input', 'Preview'));
    
    if (input) input.value = '';
    if (preview) {
        preview.src = '';
        preview.classList.add('d-none');
    }
    
    const key = inputId.replace('Input', '').toLowerCase();
    config[key] = null;
    saveConfig();
    updatePreview();
}

// Funciones para manejo de colores
function handleColorChange(colorId, targetClass) {
    const colorInput = document.getElementById(colorId);
    const colorText = document.querySelector(`[data-color-input="${colorId}"]`);
    
    if (colorInput) {
        colorInput.addEventListener('input', function(e) {
            const color = e.target.value;
            
            // Actualizar el campo de texto
            if (colorText) colorText.value = color;
            
            // Actualizar elementos visuales
            document.querySelectorAll(targetClass).forEach(element => {
                element.style.color = color;
            });
            
            // Actualizar configuración
            config[colorId] = color;
            saveConfig();
            updatePreview();
        });
    }
    
    // Sincronizar cambios desde el campo de texto
    if (colorText) {
        colorText.addEventListener('input', function(e) {
            const color = e.target.value;
            if (colorInput) colorInput.value = color;
            
            // Actualizar elementos visuales
            document.querySelectorAll(targetClass).forEach(element => {
                element.style.color = color;
            });
            
            // Actualizar configuración
            config[colorId] = color;
            saveConfig();
            updatePreview();
        });
    }
}

// Función para manejo de fuentes
function handleFontChange(fontId, targetClass) {
    const fontSelect = document.getElementById(fontId);
    if (fontSelect) {
        fontSelect.addEventListener('change', function(e) {
            document.querySelectorAll(targetClass).forEach(element => {
                element.style.fontFamily = e.target.value;
            });
            config[fontId] = e.target.value;
            saveConfig();
            updatePreview();
        });
    }
}

// Función para manejar checkbox de marca de agua
function handleWatermarkToggle() {
    const watermarkToggle = document.getElementById('enableWatermark');
    if (watermarkToggle) {
        watermarkToggle.addEventListener('change', function(e) {
            config.enableWatermark = e.target.checked;
            saveConfig();
        });
    }
}

// Actualizar panel de vista previa
function updatePreview() {
    const preview = document.getElementById('stylePreview');
    if (!preview) return;
    
    const title = preview.querySelector('.preview-title');
    const text = preview.querySelector('.preview-text');
    const logo = preview.querySelector('.preview-logo');
    
    if (title) {
        title.style.color = config.primaryColor;
        title.style.fontFamily = config.headerFont;
    }
    
    if (text) {
        text.style.color = config.secondaryColor;
        text.style.fontFamily = config.bodyFont;
    }
    
    if (logo) {
        if (config.logo) {
            logo.src = config.logo;
            logo.classList.remove('d-none');
        } else {
            logo.src = '/static/images/placeholder-logo.png';
        }
    }
}

// Guardar configuración en localStorage
function saveConfig() {
    try {
        localStorage.setItem('reportConfig', JSON.stringify(config));
        syncConfigWithBackend();
    } catch (error) {
        handleError(error, 'Error al guardar configuración local');
    }
}

// Cargar configuración desde localStorage
function loadConfig() {
    try {
        const savedConfig = localStorage.getItem('reportConfig');
        if (savedConfig) {
            Object.assign(config, JSON.parse(savedConfig));
            applyConfig();
        }
        
        // Cargar configuración desde backend
        loadConfigFromBackend();
    } catch (error) {
        handleError(error, 'Error al cargar configuración local');
    }
}

// Aplicar configuración a la interfaz
function applyConfig() {
    // Imágenes
    ['logo', 'header', 'footer', 'watermark'].forEach(item => {
        if (config[item]) {
            const preview = document.getElementById(`${item}Preview`);
            if (preview) {
                preview.src = config[item];
                preview.classList.remove('d-none');
            }
        }
    });

    // Colores
    const primaryColorInput = document.getElementById('primaryColor');
    const primaryColorText = document.querySelector('[data-color-input="primaryColor"]');
    if (primaryColorInput) primaryColorInput.value = config.primaryColor;
    if (primaryColorText) primaryColorText.value = config.primaryColor;
    
    const secondaryColorInput = document.getElementById('secondaryColor');
    const secondaryColorText = document.querySelector('[data-color-input="secondaryColor"]');
    if (secondaryColorInput) secondaryColorInput.value = config.secondaryColor;
    if (secondaryColorText) secondaryColorText.value = config.secondaryColor;

    // Fuentes
    const headerFontInput = document.getElementById('headerFont');
    if (headerFontInput) headerFontInput.value = config.headerFont;
    
    const bodyFontInput = document.getElementById('bodyFont');
    if (bodyFontInput) bodyFontInput.value = config.bodyFont;

    // Marca de agua
    const enableWatermarkInput = document.getElementById('enableWatermark');
    if (enableWatermarkInput) enableWatermarkInput.checked = config.enableWatermark;
    
    // Actualizar vista previa
    updatePreview();
}

// Mostrar notificaciones
function showToast(message, type = 'info') {
    const toastEl = document.getElementById('notificationToast');
    const toastHeader = document.getElementById('toastHeader');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toastEl || !toastHeader || !toastTitle || !toastMessage) return;
    
    // Configurar tipo de toast
    if (type === 'error') {
        toastHeader.className = 'toast-header bg-danger text-white';
        toastTitle.textContent = 'Error';
    } else if (type === 'success') {
        toastHeader.className = 'toast-header bg-success text-white';
        toastTitle.textContent = 'Éxito';
    } else {
        toastHeader.className = 'toast-header bg-info text-white';
        toastTitle.textContent = 'Información';
    }
    
    // Establecer mensaje
    toastMessage.textContent = message;
    
    // Mostrar toast
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
}

// API de backend
const api = {
    // Configuraciones
    async saveConfig() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/config/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ config })
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleError(error, 'Error al sincronizar configuración');
            return null;
        }
    },
    
    async loadConfig() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/config/load', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleError(error, 'Error al cargar configuración remota');
            return null;
        }
    },
    
    // Plantillas
    async getTemplates() {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/templates', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleError(error, 'Error al cargar plantillas');
            return [];
        }
    },
    
    async getTemplateById(id) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/templates/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleError(error, 'Error al cargar plantilla');
            return null;
        }
    },
    
    async createTemplate(templateData) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(templateData)
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleError(error, 'Error al crear plantilla');
            return null;
        }
    },
    
    async updateTemplate(id, templateData) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/templates/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(templateData)
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleError(error, 'Error al actualizar plantilla');
            return null;
        }
    },
    
    async deleteTemplate(id) {
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/templates/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            handleError(error, 'Error al eliminar plantilla');
            return null;
        }
    }
};

// Sincronizar configuración con el backend
async function syncConfigWithBackend() {
    const result = await api.saveConfig();
    if (result) {
        state.lastSaved = new Date();
    }
}

// Cargar configuración desde el backend
async function loadConfigFromBackend() {
    const result = await api.loadConfig();
    if (result && result.config) {
        // Fusionar con configuración local, priorizando la del backend
        Object.assign(config, result.config);
        applyConfig();
        saveConfig();
    }
}

// Funciones para la gestión de plantillas
async function loadTemplates() {
    try {
        const templates = await api.getTemplates();
        if (templates && templates.length > 0) {
            config.templates = templates;
            renderTemplateList();
            populateReportTemplateDropdown();
        } else {
            const templateList = document.getElementById('templateList');
            if (templateList) {
                templateList.innerHTML = '<div class="text-center text-muted py-4">No hay plantillas disponibles</div>';
            }
        }
    } catch (error) {
        handleError(error, 'Error al cargar plantillas');
    }
}

function renderTemplateList() {
    const templateList = document.getElementById('templateList');
    if (!templateList) return;
    
    templateList.innerHTML = '';
    
    if (config.templates.length === 0) {
        templateList.innerHTML = '<div class="text-center text-muted py-4">No hay plantillas disponibles</div>';
        return;
    }
    
    config.templates.forEach(template => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action';
        item.dataset.id = template._id;
        
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${template.name}</h6>
                <small><i class="${template.isStarred ? 'fas' : 'far'} fa-star"></i></small>
            </div>
            <small class="text-muted">${template.category}</small>
        `;
        
        item.addEventListener('click', (e) => {
            e.preventDefault();
            loadTemplateEditor(template._id);
        });
        
        templateList.appendChild(item);
    });
}

function populateReportTemplateDropdown() {
    const select = document.getElementById('reportTemplate');
    if (!select) return;
    
    // Limpiar opciones existentes
    select.innerHTML = '<option value="">Seleccione una plantilla</option>';
    
    // Agregar plantillas como opciones
    config.templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template._id;
        option.textContent = template.name;
        select.appendChild(option);
    });
    
    // Evento para cargar el formulario cuando se cambia la plantilla
    select.addEventListener('change', () => {
        const templateId = select.value;
        if (templateId) {
            loadReportForm(templateId);
        } else {
            clearReportForm();
        }
    });
}

async function loadTemplateEditor(templateId) {
    try {
        // Marcar la plantilla seleccionada en la lista
        document.querySelectorAll('#templateList a').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.id === templateId) {
                item.classList.add('active');
            }
        });
        
        // Cargar datos de la plantilla
        const template = await api.getTemplateById(templateId);
        if (template) {
            state.editingTemplate = template;
            
            // Llenar el formulario con los datos de la plantilla
            document.getElementById('templateName').value = template.name;
            document.getElementById('templateCategory').value = template.category;
            document.getElementById('templateDescription').value = template.description || '';
            
            // Renderizar secciones
            renderTemplateSections(template.sections);
        }
    } catch (error) {
        handleError(error, 'Error al cargar la plantilla');
    }
}

function renderTemplateSections(sections) {
    const container = document.getElementById('templateSections');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!sections || sections.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-3">No hay secciones definidas</div>';
        return;
    }
    
    sections.forEach((section, index) => {
        const sectionEl = document.createElement('div');
        sectionEl.className = 'border rounded p-3 mb-3';
        sectionEl.dataset.index = index;
        
        let optionsHtml = '';
        if (section.options && section.options.length > 0) {
            optionsHtml = `
                <div class="small text-muted mt-2">
                    Opciones: ${section.options.join(', ')}
                </div>
            `;
        }
        
        sectionEl.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="mb-0">
                    <i class="fas fa-grip-vertical text-muted me-2 section-handle"></i>
                    ${section.name}
                    ${section.required ? '<span class="text-danger">*</span>' : ''}
                </h6>
                <div>
                    <span class="badge bg-secondary me-2">${getTypeLabel(section.type)}</span>
                    <button class="btn btn-sm btn-outline-secondary me-2 edit-section-btn" data-index="${index}">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-section-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${optionsHtml}
        `;
        
        // Evento para editar la sección
        sectionEl.querySelector('.edit-section-btn').addEventListener('click', () => {
            editSection(index);
        });
        
        // Evento para eliminar la sección
        sectionEl.querySelector('.delete-section-btn').addEventListener('click', () => {
            if (confirm('¿Está seguro de eliminar esta sección?')) {
                state.editingTemplate.sections.splice(index, 1);
                renderTemplateSections(state.editingTemplate.sections);
            }
        });
        
        container.appendChild(sectionEl);
    });
    
    // Hacer que las secciones sean ordenables
    enableSectionSorting();
}

function getTypeLabel(type) {
    const types = {
        'text': 'Texto',
        'checkbox': 'Checkbox',
        'radio': 'Radio',
        'select': 'Desplegable'
    };
    return types[type] || type;
}

function enableSectionSorting() {
    // Aquí se implementaría la funcionalidad de arrastrar y soltar
    // Se puede usar bibliotecas como SortableJS
}

function editSection(index) {
    const section = state.editingTemplate.sections[index];
    if (!section) return;
    
    // Abrir modal de edición con los datos de la sección
    const modal = new bootstrap.Modal(document.getElementById('newSectionModal'));
    
    document.getElementById('sectionName').value = section.name;
    document.getElementById('sectionType').value = section.type;
    document.getElementById('sectionRequired').checked = section.required;
    
    // Manejar opciones si es necesario
    const optionsContainer = document.getElementById('optionsContainer');
    const optionsList = document.getElementById('optionsList');
    
    if (section.type === 'checkbox' || section.type === 'radio' || section.type === 'select') {
        optionsContainer.style.display = 'block';
        optionsList.innerHTML = '';
        
        if (section.options && section.options.length > 0) {
            section.options.forEach(option => {
                addOptionInput(option);
            });
        } else {
            addOptionInput();
        }
    } else {
        optionsContainer.style.display = 'none';
    }
    
    // Cambiar el comportamiento del botón guardar para actualizar en lugar de crear
    const saveBtn = document.getElementById('saveNewSectionBtn');
    const originalOnClick = saveBtn.onclick;
    
    saveBtn.onclick = () => {
        const name = document.getElementById('sectionName').value;
        const type = document.getElementById('sectionType').value;
        const required = document.getElementById('sectionRequired').checked;
        
        // Obtener opciones si es necesario
        let options = [];
        if (type === 'checkbox' || type === 'radio' || type === 'select') {
            document.querySelectorAll('.option-input').forEach(input => {
                if (input.value.trim()) {
                    options.push(input.value.trim());
                }
            });
        }
        
        // Actualizar la sección
        state.editingTemplate.sections[index] = {
            name,
            type,
            required,
            options
        };
        
        // Cerrar el modal y renderizar las secciones
        modal.hide();
        renderTemplateSections(state.editingTemplate.sections);
        
        // Restaurar el comportamiento original del botón
        saveBtn.onclick = originalOnClick;
    };
    
    modal.show();
}

function addOptionInput(value = '') {
    const optionsList = document.getElementById('optionsList');
    if (!optionsList) return;
    
    const optionDiv = document.createElement('div');
    optionDiv.className = 'input-group mb-2';
    optionDiv.innerHTML = `
        <input type="text" class="form-control option-input" placeholder="Opción" value="${value}">
        <button class="btn btn-outline-danger remove-option-btn" type="button">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Evento para eliminar la opción
    optionDiv.querySelector('.remove-option-btn').addEventListener('click', () => {
        optionDiv.remove();
    });
    
    optionsList.appendChild(optionDiv);
}

async function createNewTemplate() {
    const newTemplate = {
        name: 'Nueva Plantilla',
        category: 'Adultos',
        sections: [],
        description: ''
    };
    
    try {
        const created = await api.createTemplate(newTemplate);
        if (created) {
            // Actualizar la lista de plantillas
            await loadTemplates();
            
            // Seleccionar la nueva plantilla
            loadTemplateEditor(created._id);
            
            showToast('Plantilla creada correctamente', 'success');
        }
    } catch (error) {
        handleError(error, 'Error al crear nueva plantilla');
    }
}

async function saveTemplate() {
    if (!state.editingTemplate) return;
    
    // Actualizar los datos del formulario en el objeto de plantilla
    state.editingTemplate.name = document.getElementById('templateName').value;
    state.editingTemplate.category = document.getElementById('templateCategory').value;
    state.editingTemplate.description = document.getElementById('templateDescription').value;
    
    try {
        const updated = await api.updateTemplate(state.editingTemplate._id, state.editingTemplate);
        if (updated) {
            // Actualizar la lista de plantillas
            await loadTemplates();
            
            showToast('Plantilla guardada correctamente', 'success');
        }
    } catch (error) {
        handleError(error, 'Error al guardar plantilla');
    }
}

async function duplicateTemplate() {
    if (!state.editingTemplate) return;
    
    const duplicate = {
        ...state.editingTemplate,
        name: `${state.editingTemplate.name} (Copia)`,
        _id: undefined // Eliminar el ID para crear uno nuevo
    };
    
    try {
        const created = await api.createTemplate(duplicate);
        if (created) {
            // Actualizar la lista de plantillas
            await loadTemplates();
            
            // Seleccionar la nueva plantilla
            loadTemplateEditor(created._id);
            
            showToast('Plantilla duplicada correctamente', 'success');
        }
    } catch (error) {
        handleError(error, 'Error al duplicar plantilla');
    }
}

// Funciones para el manejo de informes
function loadReportForm(templateId) {
    const template = config.templates.find(t => t._id === templateId);
    if (!template) return;
    
    state.selectedTemplateId = templateId;
    
    const container = document.getElementById('reportFormContent');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Información del paciente
    const patientInfo = document.createElement('div');
    patientInfo.className = 'mb-4';
    patientInfo.innerHTML = `
        <h5 class="mb-3">Información del Paciente</h5>
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label">Nombre completo</label>
                <input type="text" class="form-control" id="patientName" required>
            </div>
            <div class="col-md-3">
                <label class="form-label">Edad</label>
                <input type="number" class="form-control" id="patientAge">
            </div>
            <div class="col-md-3">
                <label class="form-label">Fecha</label>
                <input type="date" class="form-control" id="reportDate" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="col-md-6">
                <label class="form-label">Documento de Identidad</label>
                <input type="text" class="form-control" id="patientId">
            </div>
            <div class="col-md-6">
                <label class="form-label">Teléfono</label>
                <input type="tel" class="form-control" id="patientPhone">
            </div>
        </div>
    `;
    container.appendChild(patientInfo);
    
    // Secciones de la plantilla
    if (template.sections && template.sections.length > 0) {
        template.sections.forEach((section, index) => {
            const sectionEl = document.createElement('div');
            sectionEl.className = 'mb-4';
            sectionEl.innerHTML = `
                <h5 class="mb-3">${section.name}${section.required ? ' <span class="text-danger">*</span>' : ''}</h5>
            `;
            
            const content = document.createElement('div');
            
            switch (section.type) {
                case 'text':
                    content.innerHTML = `
                        <textarea class="form-control" rows="3" id="section_${index}" ${section.required ? 'required' : ''}></textarea>
                    `;
                    break;
                    
                case 'checkbox':
                    content.className = 'row g-2';
                    if (section.options && section.options.length > 0) {
                        section.options.forEach((option, optIndex) => {
                            content.innerHTML += `
                                <div class="col-md-6">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" id="section_${index}_opt_${optIndex}">
                                        <label class="form-check-label" for="section_${index}_opt_${optIndex}">${option}</label>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    break;
                    
                case 'radio':
                    content.className = 'mb-3';
                    if (section.options && section.options.length > 0) {
                        section.options.forEach((option, optIndex) => {
                            content.innerHTML += `
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="section_${index}" id="section_${index}_opt_${optIndex}" value="${option}" ${section.required && optIndex === 0 ? 'required' : ''}>
                                    <label class="form-check-label" for="section_${index}_opt_${optIndex}">${option}</label>
                                </div>
                            `;
                        });
                    }
                    break;
                    
                case 'select':
                    content.innerHTML = `
                        <select class="form-select" id="section_${index}" ${section.required ? 'required' : ''}>
                            <option value="">Seleccione una opción</option>
                            ${section.options.map(option => `<option value="${option}">${option}</option>`).join('')}
                        </select>
                    `;
                    break;
            }
            
            sectionEl.appendChild(content);
            container.appendChild(sectionEl);
        });
    }
    
    // Profesional
    const professionalInfo = document.createElement('div');
    professionalInfo.className = 'mb-4';
    professionalInfo.innerHTML = `
        <h5 class="mb-3">Información del Profesional</h5>
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label">Nombre del Profesional</label>
                <input type="text" class="form-control" id="professionalName" value="${getUserProfile()?.profile?.fullName || ''}">
            </div>
            <div class="col-md-6">
                <label class="form-label">Número de Licencia</label>
                <input type="text" class="form-control" id="professionalLicense" value="${getUserProfile()?.profile?.licenseNumber || ''}">
            </div>
            <div class="col-md-6">
                <label class="form-label">Especialidad</label>
                <input type="text" class="form-control" id="professionalSpecialty" value="${getUserProfile()?.profile?.specialty || ''}">
            </div>
        </div>
    `;
    container.appendChild(professionalInfo);
    
    // Actualizar vista previa
    updateReportPreview();
    
    // Agregar evento a los campos para actualizar la vista previa
    container.querySelectorAll('input, textarea, select').forEach(el => {
        el.addEventListener('input', updateReportPreview);
    });
}

function clearReportForm() {
    const container = document.getElementById('reportFormContent');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-5">
                <p class="text-muted">Seleccione una plantilla para comenzar</p>
            </div>
        `;
    }
    
    state.selectedTemplateId = null;
    state.currentReport = null;
    
    // Limpiar vista previa
    const previewPanel = document.getElementById('reportPreviewPanel');
    if (previewPanel) {
        previewPanel.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-file-alt fa-3x mb-3"></i>
                <p>La vista previa se actualizará automáticamente mientras escribes</p>
            </div>
        `;
    }
}

function updateReportPreview() {
    const previewPanel = document.getElementById('reportPreviewPanel');
    if (!previewPanel) return;
    
    // Si no hay plantilla seleccionada
    if (!state.selectedTemplateId) {
        previewPanel.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-file-alt fa-3x mb-3"></i>
                <p>La vista previa se actualizará automáticamente mientras escribes</p>
            </div>
        `;
        return;
    }
    
    // Obtener la plantilla seleccionada
    const template = config.templates.find(t => t._id === state.selectedTemplateId);
    if (!template) return;
    
    // Crear la vista previa
    const preview = document.createElement('div');
    preview.className = 'report-preview';
    
    // Encabezado
    preview.innerHTML = `
        <div class="text-center mb-4">
            ${config.logo ? `<img src="${config.logo}" alt="Logo" style="max-height: 100px; max-width: 200px;">` : ''}
            <h1 style="color: ${config.primaryColor}; font-family: ${config.headerFont};">${template.name}</h1>
        </div>
    `;
    
    // Información del paciente
    const patientName = document.getElementById('patientName')?.value || 'Nombre del Paciente';
    const patientAge = document.getElementById('patientAge')?.value || '';
    const reportDate = document.getElementById('reportDate')?.value ? new Date(document.getElementById('reportDate').value).toLocaleDateString() : new Date().toLocaleDateString();
    
    preview.innerHTML += `
        <div class="mb-4">
            <h4 style="color: ${config.primaryColor}; font-family: ${config.headerFont};">Información del Paciente</h4>
            <p style="font-family: ${config.bodyFont}; color: ${config.secondaryColor};"><strong>Nombre:</strong> ${patientName}</p>
            ${patientAge ? `<p style="font-family: ${config.bodyFont}; color: ${config.secondaryColor};"><strong>Edad:</strong> ${patientAge} años</p>` : ''}
            <p style="font-family: ${config.bodyFont}; color: ${config.secondaryColor};"><strong>Fecha:</strong> ${reportDate}</p>
        </div>
    `;
    
    // Secciones de la plantilla
    if (template.sections && template.sections.length > 0) {
        template.sections.forEach((section, index) => {
            let content = '';
            
            switch (section.type) {
                case 'text':
                    const textValue = document.getElementById(`section_${index}`)?.value || '';
                    content = `<p style="font-family: ${config.bodyFont}; color: ${config.secondaryColor};">${textValue || '(Sin datos)'}</p>`;
                    break;
                    
                case 'checkbox':
                    const checkedOptions = [];
                    if (section.options && section.options.length > 0) {
                        section.options.forEach((option, optIndex) => {
                            const isChecked = document.getElementById(`section_${index}_opt_${optIndex}`)?.checked;
                            if (isChecked) {
                                checkedOptions.push(option);
                            }
                        });
                    }
                    content = `
                        <ul style="font-family: ${config.bodyFont}; color: ${config.secondaryColor};">
                            ${checkedOptions.length > 0 
                                ? checkedOptions.map(opt => `<li>${opt}</li>`).join('') 
                                : '<li>(Sin selección)</li>'}
                        </ul>
                    `;
                    break;
                    
                case 'radio':
                    const selectedOption = document.querySelector(`input[name="section_${index}"]:checked`)?.value;
                    content = `<p style="font-family: ${config.bodyFont}; color: ${config.secondaryColor};">${selectedOption || '(Sin selección)'}</p>`;
                    break;
                    
                case 'select':
                    const selectValue = document.getElementById(`section_${index}`)?.value;
                    content = `<p style="font-family: ${config.bodyFont}; color: ${config.secondaryColor};">${selectValue || '(Sin selección)'}</p>`;
                    break;
            }
            
            preview.innerHTML += `
                <div class="mb-3">
                    <h4 style="color: ${config.primaryColor}; font-family: ${config.headerFont};">${section.name}</h4>
                    ${content}
                </div>
            `;
        });
    }
    
    // Información del profesional
    const professionalName = document.getElementById('professionalName')?.value || 'Nombre del Profesional';
    const professionalLicense = document.getElementById('professionalLicense')?.value || '';
    const professionalSpecialty = document.getElementById('professionalSpecialty')?.value || '';
    
    preview.innerHTML += `
        <div class="mt-5">
            <div style="border-top: 1px solid #dee2e6; padding-top: 20px;">
                <p style="font-family: ${config.bodyFont}; color: ${config.secondaryColor};"><strong>${professionalName}</strong></p>
                ${professionalLicense ? `<p style="font-family: ${config.bodyFont}; color: ${config.secondaryColor};">Licencia: ${professionalLicense}</p>` : ''}
                ${professionalSpecialty ? `<p style="font-family: ${config.bodyFont}; color: ${config.secondaryColor};">Especialidad: ${professionalSpecialty}</p>` : ''}
            </div>
        </div>
    `;
    
    // Actualizar la vista previa
    previewPanel.innerHTML = '';
    previewPanel.appendChild(preview);
}

// Funciones para la página del Asistente IA (usando Open AI directamente)
function handleAIAssistant() {
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatHistory = document.getElementById('chatHistory');
    const newChatBtn = document.getElementById('newChatBtn');
    
    if (!chatInput || !sendChatBtn || !chatHistory || !newChatBtn) return;
    
    // Enviar mensaje a Open AI
    const sendMessage = async () => {
        if (!isAuthenticated()) {
            showToast('Debes estar autenticado para usar el Asistente IA.', 'error');
            return;
        }
        
        const message = chatInput.value.trim();
        if (!message) {
            showToast('Por favor, escribe un mensaje.', 'warning');
            return;
        }
        
        const apiKey = localStorage.getItem('openAIKey');
        if (!apiKey) {
            showToast('Por favor, configura tu API Key en la pestaña de Configuración.', 'error');
            return;
        }
        
        // Agregar mensaje del usuario
        appendUserMessage(message);
        chatInput.value = '';
        
        // Mostrar indicador de carga
        const loadingIndicator = appendLoadingIndicator();
        
        try {
            const style = document.getElementById('assistantStyle')?.value || 'formal';
            const detailLevel = document.getElementById('assistantDetail')?.value || 'standard';
            const temperature = detailLevel === 'detailed' ? 0.7 : detailLevel === 'brief' ? 0.3 : 0.5;
            
            const prompt = `Actúa como un asistente especializado en informes psicológicos con un estilo de redacción "${style}" y un nivel de detalle "${detailLevel}". Responde al siguiente mensaje: "${message}"`;
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'Eres un asistente especializado en informes psicológicos.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: detailLevel === 'detailed' ? 1000 : detailLevel === 'brief' ? 200 : 500,
                    temperature: temperature
                })
            });
            
            // Quitar indicador de carga
            if (loadingIndicator && loadingIndicator.parentNode === chatHistory) {
                chatHistory.removeChild(loadingIndicator);
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Error ${response.status}`);
            }
            
            const data = await response.json();
            appendAssistantMessage(data.choices[0].message.content.trim());
        } catch (error) {
            if (loadingIndicator && loadingIndicator.parentNode === chatHistory) {
                chatHistory.removeChild(loadingIndicator);
            }
            appendAssistantMessage(`Lo siento, ocurrió un error: ${error.message}. Verifica tu API Key o intenta de nuevo.`);
        }
    };
    
    // Evento para enviar mensaje con el botón
    sendChatBtn.addEventListener('click', sendMessage);
    
    // Evento para enviar mensaje con Enter
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Evento para nueva conversación
    newChatBtn.addEventListener('click', () => {
        if (!isAuthenticated()) {
            showToast('Debes estar autenticado para usar el Asistente IA.', 'error');
            return;
        }
        // Limpiar historial excepto el mensaje inicial
        while (chatHistory.children.length > 1) {
            chatHistory.removeChild(chatHistory.lastChild);
        }
        chatInput.value = '';
    });
    
    // Botones de sugerencias
    document.querySelectorAll('#contentSuggestions button').forEach(btn => {
        btn.addEventListener('click', async () => {
            const promptType = btn.dataset.prompt;
            if (!promptType) return;
            
            if (!isAuthenticated()) {
                showToast('Debes estar autenticado para usar el Asistente IA.', 'error');
                return;
            }
            
            const apiKey = localStorage.getItem('openAIKey');
            if (!apiKey) {
                showToast('Por favor, configura tu API Key en la pestaña de Configuración.', 'error');
                return;
            }
            
            let userMessage = '';
            let sectionType = 'general';
            
            switch (promptType) {
                case 'sugerir conclusiones':
                    userMessage = 'Sugiere conclusiones para un informe psicológico basado en una evaluación general.';
                    sectionType = 'conclusions';
                    break;
                case 'sugerir recomendaciones':
                    userMessage = 'Propón recomendaciones para un paciente tras una evaluación psicológica.';
                    sectionType = 'recommendations';
                    break;
                case 'redactar resumen':
                    userMessage = 'Redacta un resumen ejecutivo para un informe psicológico.';
                    sectionType = 'summary';
                    break;
                case 'mejorar redacción':
                    userMessage = 'Mejora la redacción de este texto: "El paciente muestra ansiedad alta y dificultades para dormir."';
                    break;
                default:
                    userMessage = promptType;
            }
            
            // Si es un prompt relacionado con el informe, incluir datos del informe
            if (promptType.startsWith('sugerir') || promptType.startsWith('redactar')) {
                if (!state.selectedTemplateId) {
                    showToast('Primero debes seleccionar una plantilla de informe', 'error');
                    return;
                }
                
                const reportData = collectReportData();
                userMessage = `${userMessage}\nDatos del informe: ${JSON.stringify(reportData, null, 2)}`;
            }
            
            // Mostrar mensaje del usuario
            appendUserMessage(userMessage);
            
            // Mostrar indicador de carga
            const loadingIndicator = appendLoadingIndicator();
            
            try {
                const style = document.getElementById('assistantStyle')?.value || 'formal';
                const detailLevel = document.getElementById('assistantDetail')?.value || 'standard';
                const temperature = detailLevel === 'detailed' ? 0.7 : detailLevel === 'brief' ? 0.3 : 0.5;
                
                const prompt = `Actúa como un asistente especializado en informes psicológicos con un estilo de redacción "${style}" y un nivel de detalle "${detailLevel}". Responde al siguiente mensaje: "${userMessage}"`;
                
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: 'Eres un asistente especializado en informes psicológicos.' },
                            { role: 'user', content: prompt }
                        ],
                        max_tokens: detailLevel === 'detailed' ? 1000 : detailLevel === 'brief' ? 200 : 500,
                        temperature: temperature
                    })
                });
                
                // Quitar indicador de carga
                if (loadingIndicator && loadingIndicator.parentNode === chatHistory) {
                    chatHistory.removeChild(loadingIndicator);
                }
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error?.message || `Error ${response.status}`);
                }
                
                const data = await response.json();
                appendAssistantMessage(data.choices[0].message.content.trim());
            } catch (error) {
                if (loadingIndicator && loadingIndicator.parentNode === chatHistory) {
                    chatHistory.removeChild(loadingIndicator);
                }
                appendAssistantMessage(`Lo siento, ocurrió un error: ${error.message}. Verifica tu API Key o intenta de nuevo.`);
            }
        });
    });
}

function appendUserMessage(message) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'd-flex mb-3 flex-row-reverse';
    messageEl.innerHTML = `
        <div class="flex-shrink-0">
            <i class="fas fa-user fs-4 text-secondary"></i>
        </div>
        <div class="flex-grow-1 me-3">
            <div class="bg-primary text-white rounded p-3">
                <p class="mb-0">${message}</p>
            </div>
        </div>
    `;
    
    chatHistory.appendChild(messageEl);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return messageEl;
}

function appendAssistantMessage(message) {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'd-flex mb-3';
    messageEl.innerHTML = `
        <div class="flex-shrink-0">
            <i class="fas fa-robot fs-4 text-primary"></i>
        </div>
        <div class="flex-grow-1 ms-3">
            <div class="bg-light rounded p-3">
                <p class="mb-0">${message}</p>
            </div>
        </div>
    `;
    
    chatHistory.appendChild(messageEl);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return messageEl;
}

function appendLoadingIndicator() {
    const chatHistory = document.getElementById('chatHistory');
    if (!chatHistory) return null;
    
    const loadingEl = document.createElement('div');
    loadingEl.className = 'd-flex mb-3';
    loadingEl.innerHTML = `
        <div class="flex-shrink-0">
            <i class="fas fa-robot fs-4 text-primary"></i>
        </div>
        <div class="flex-grow-1 ms-3">
            <div class="bg-light rounded p-3 d-flex align-items-center">
                <div class="spinner-border spinner-border-sm text-primary me-2" role="status">
                    <span class="visually-hidden">Pensando...</span>
                </div>
                <p class="mb-0">Generando respuesta...</p>
            </div>
        </div>
    `;
    
    chatHistory.appendChild(loadingEl);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return loadingEl;
}

// Guardar informe
function saveReport() {
    if (!state.selectedTemplateId) {
        showToast('Debe seleccionar una plantilla', 'error');
        return;
    }
    
    // Recopilar datos del formulario
    const reportData = collectReportData();
    
    // En un sistema real, aquí se enviaría a la API
    showToast('Informe guardado correctamente', 'success');
    console.log('Datos del informe:', reportData);
}

// Guardar borrador
function saveReportDraft() {
    if (!state.selectedTemplateId) {
        showToast('Debe seleccionar una plantilla', 'error');
        return;
    }
    
    // Recopilar datos del formulario
    const reportData = collectReportData();
    
    // Guardar en localStorage
    try {
        localStorage.setItem('reportDraft', JSON.stringify(reportData));
        showToast('Borrador guardado localmente', 'success');
    } catch (error) {
        handleError(error, 'Error al guardar borrador');
    }
}

// Recopilar datos del informe
function collectReportData() {
    const template = config.templates.find(t => t._id === state.selectedTemplateId);
    if (!template) return null;
    
    const data = {
        templateId: template._id,
        templateName: template.name,
        patient: {
            name: document.getElementById('patientName')?.value || '',
            age: document.getElementById('patientAge')?.value || '',
            id: document.getElementById('patientId')?.value || '',
            phone: document.getElementById('patientPhone')?.value || ''
        },
        date: document.getElementById('reportDate')?.value || new Date().toISOString().split('T')[0],
        professional: {
            name: document.getElementById('professionalName')?.value || '',
            license: document.getElementById('professionalLicense')?.value || '',
            specialty: document.getElementById('professionalSpecialty')?.value || ''
        },
        sections: []
    };
    
    // Recopilar datos de secciones
    if (template.sections && template.sections.length > 0) {
        template.sections.forEach((section, index) => {
            const sectionData = {
                name: section.name,
                type: section.type,
                required: section.required
            };
            
            switch (section.type) {
                case 'text':
                    sectionData.value = document.getElementById(`section_${index}`)?.value || '';
                    break;
                    
                case 'checkbox':
                    sectionData.values = [];
                    if (section.options && section.options.length > 0) {
                        section.options.forEach((option, optIndex) => {
                            const isChecked = document.getElementById(`section_${index}_opt_${optIndex}`)?.checked;
                            if (isChecked) {
                                sectionData.values.push(option);
                            }
                        });
                    }
                    break;
                    
                case 'radio':
                    sectionData.value = document.querySelector(`input[name="section_${index}"]:checked`)?.value || '';
                    break;
                    
                case 'select':
                    sectionData.value = document.getElementById(`section_${index}`)?.value || '';
                    break;
            }
            
            data.sections.push(sectionData);
        });
    }
    
    return data;
}

// Previsualizar informe
function previewReport() {
    if (!state.selectedTemplateId) {
        showToast('Debe seleccionar una plantilla', 'error');
        return;
    }
    
    // En un sistema real, esto generaría un PDF temporal
    const reportData = collectReportData();
    
    try {
        fetch('/api/reports/preview-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ reportData })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al generar vista previa');
            }
            return response.blob();
        })
        .then(blob => {
            // Crear URL para el blob
            const url = window.URL.createObjectURL(blob);
            
            // Abrir en nueva ventana
            window.open(url, '_blank');
            
            // Liberar URL después de un tiempo
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 30000);
        })
        .catch(error => {
            handleError(error, 'Error al previsualizar informe');
        });
    } catch (error) {
        handleError(error, 'Error al previsualizar informe');
    }
}

// Descargar PDF
function downloadReportPdf() {
    if (!state.selectedTemplateId) {
        showToast('Debe seleccionar una plantilla', 'error');
        return;
    }
    
    // Recopilar datos del formulario
    const reportData = collectReportData();
    
    // Enviar datos para generación y descarga de PDF
    try {
        fetch('/api/reports/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ reportData })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al generar PDF');
            }
            return response.blob();
        })
        .then(blob => {
            // Crear nombre de archivo
            const patientName = reportData.patient.name || 'paciente';
            const date = new Date().toISOString().slice(0, 10);
            const filename = `informe_${patientName.replace(/\s+/g, '_')}_${date}.pdf`;
            
            // Crear URL para el blob
            const url = window.URL.createObjectURL(blob);
            
            // Crear enlace invisible para descarga
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            
            // Agregar a documento, hacer clic y eliminar
            document.body.appendChild(a);
            a.click();
            
            // Limpiar
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showToast('PDF descargado correctamente', 'success');
        })
        .catch(error => {
            handleError(error, 'Error al descargar PDF');
        });
    } catch (error) {
        handleError(error, 'Error al descargar PDF');
    }
}

// Cambiar contraseña
function changePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmNewPassword = document.getElementById('confirmNewPassword')?.value;
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showToast('Todos los campos son obligatorios', 'error');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showToast('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }
    
    // En un sistema real, aquí se enviaría a la API
    try {
        fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ 
                currentPassword, 
                newPassword 
            })
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Contraseña actual incorrecta');
                }
                throw new Error('Error al cambiar contraseña');
            }
            return response.json();
        })
        .then(data => {
            showToast('Contraseña cambiada correctamente', 'success');
            
            // Limpiar campos
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
        })
        .catch(error => {
            handleError(error, error.message);
        });
    } catch (error) {
        handleError(error, 'Error al cambiar contraseña');
    }
}

// Enviar email de verificación
function sendVerificationEmail() {
    // En un sistema real, aquí se enviaría a la API
    try {
        fetch('/api/auth/send-verification', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al enviar email de verificación');
            }
            return response.json();
        })
        .then(data => {
            showToast('Correo de verificación enviado', 'success');
        })
        .catch(error => {
            handleError(error, 'Error al enviar email de verificación');
        });
    } catch (error) {
        handleError(error, 'Error al enviar email de verificación');
    }
}

// Limpiar caché
function clearCache() {
    // Mostrar confirmación
    if (!confirm('¿Está seguro de limpiar la caché? Esto eliminará todos los datos guardados localmente.')) {
        return;
    }
    
    // Limpiar localStorage (excepto token de autenticación)
    const authToken = localStorage.getItem('authToken');
    localStorage.clear();
    localStorage.setItem('authToken', authToken);

    // Actualizar información de almacenamiento
    updateStorageInfo();
    
    showToast('Caché limpiada correctamente', 'success');
    
    // Recargar la página para reiniciar la aplicación
    setTimeout(() => {
        window.location.reload();
    }, 1500);
}

// Actualizar información de almacenamiento
function updateStorageInfo() {
    // Estimar el uso de almacenamiento
    let storageUsed = 0;
    
    // Contar bytes de cada item en localStorage
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        storageUsed += key.length + value.length;
    }
    
    // Convertir a KB
    const storageKB = Math.round(storageUsed / 1024);
    
    // Actualizar interfaz
    document.getElementById('storageUsed')?.textContent = `${storageKB} KB de 5 MB`;
    
    // Actualizar barra de progreso (5 MB = 5120 KB)
    const percentage = Math.min(100, (storageKB / 5120) * 100);
    document.getElementById('storageProgress')?.style.setProperty('width', `${percentage}%`);
}

// Obtener información del usuario
function getUserProfile() {
    // Función ya implementada arriba
    return {
        _id: config.userId,
        email: 'usuario@ejemplo.com',
        profile: {
            fullName: 'Dr. Juan Pérez',
            licenseNumber: 'PSY12345',
            specialty: 'Psicología Clínica',
            phone: '123-456-7890'
        }
    };
}

// Mejorar texto con IA
async function enhanceTextWithAI(text, enhancementType) {
    if (!text) {
        showToast('No hay texto para mejorar', 'error');
        return null;
    }
    
    try {
        // Obtener estilo seleccionado
        const style = document.getElementById('assistantStyle')?.value || 'formal';
        
        // Mostrar indicador de carga
        showToast('Mejorando texto...', 'info');
        
        // Llamar a la API
        const response = await fetch('/api/ai/enhance-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                text,
                enhancementType,
                options: {
                    style
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status}`);
        }
        
        const data = await response.json();
        showToast('Texto mejorado correctamente', 'success');
        return data.enhancedText;
    } catch (error) {
        console.error('Error mejorando texto:', error);
        showToast('Error al mejorar el texto', 'error');
        return null;
    }
}

// Agregar botón para mejorar texto en campos de texto
function addTextEnhancementButtons() {
    // Identificar campos de texto grandes
    const textareas = document.querySelectorAll('textarea');
    
    textareas.forEach(textarea => {
        // Solo agregar si no tiene ya un botón de mejora
        if (!textarea.nextElementSibling || !textarea.nextElementSibling.classList.contains('enhance-text-btn')) {
            const container = document.createElement('div');
            container.className = 'text-end mt-1 enhance-text-btn';
            
            const btnGroup = document.createElement('div');
            btnGroup.className = 'btn-group btn-group-sm';
            
            // Botón para mejorar claridad
            const clarityBtn = document.createElement('button');
            clarityBtn.type = 'button';
            clarityBtn.className = 'btn btn-outline-secondary';
            clarityBtn.innerHTML = '<i class="fas fa-magic"></i> Mejorar claridad';
            clarityBtn.addEventListener('click', async () => {
                const enhancedText = await enhanceTextWithAI(textarea.value, 'improve_clarity');
                if (enhancedText) {
                    textarea.value = enhancedText;
                    // Disparar evento input para actualizar cualquier vista previa
                    textarea.dispatchEvent(new Event('input'));
                }
            });
            
            // Botón para formalizar
            const formalBtn = document.createElement('button');
            formalBtn.type = 'button';
            formalBtn.className = 'btn btn-outline-secondary';
            formalBtn.innerHTML = '<i class="fas fa-pen-fancy"></i> Formalizar';
            formalBtn.addEventListener('click', async () => {
                const enhancedText = await enhanceTextWithAI(textarea.value, 'formal_tone');
                if (enhancedText) {
                    textarea.value = enhancedText;
                    textarea.dispatchEvent(new Event('input'));
                }
            });
            
            // Agregar botones al grupo
            btnGroup.appendChild(clarityBtn);
            btnGroup.appendChild(formalBtn);
            
            // Agregar grupo al contenedor
            container.appendChild(btnGroup);
            
            // Insertar después del textarea
            textarea.parentNode.insertBefore(container, textarea.nextSibling);
        }
    });
}

// Inicializar todo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return; // Verificar autenticación
    
    try {
        // Cargar configuración
        loadConfig();
        
        // Cargar usuario
        loadUserProfile();
        
        // Cargar plantillas
        loadTemplates();
        
        // Inicializar eventos de la página de personalización
        document.querySelectorAll('[type="file"]').forEach(input => {
            const previewId = input.id.replace('Input', 'Preview');
            input.addEventListener('change', () => handleImagePreview(input, previewId));
        });
        
        // Evento para botones de limpiar imagen
        document.querySelectorAll('.clear-image-btn').forEach(btn => {
            btn.addEventListener('click', () => clearImage(btn.dataset.target));
        });
        
        // Eventos para colores y fuentes
        handleColorChange('primaryColor', '.preview-title');
        handleColorChange('secondaryColor', '.preview-text');
        handleFontChange('headerFont', '.preview-title');
        handleFontChange('bodyFont', '.preview-text');
        handleWatermarkToggle();
        
        // Evento para botón de guardar configuración
        document.getElementById('saveConfigBtn')?.addEventListener('click', () => {
            syncConfigWithBackend();
            showToast('Configuración guardada correctamente', 'success');
        });
        
        // Eventos para plantillas
        document.getElementById('newTemplateBtn')?.addEventListener('click', createNewTemplate);
        document.getElementById('saveTemplateBtn')?.addEventListener('click', saveTemplate);
        document.getElementById('duplicateTemplateBtn')?.addEventListener('click', duplicateTemplate);
        
        // Evento para búsqueda de plantillas
        document.getElementById('templateSearch')?.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('#templateList a').forEach(item => {
                const name = item.querySelector('h6')?.textContent.toLowerCase() || '';
                const category = item.querySelector('small')?.textContent.toLowerCase() || '';
                
                if (name.includes(searchTerm) || category.includes(searchTerm)) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        });
        
        // Eventos para el modal de nueva sección
        document.getElementById('addSectionBtn')?.addEventListener('click', () => {
            // Limpiar modal
            document.getElementById('sectionName').value = '';
            document.getElementById('sectionType').value = 'text';
            document.getElementById('sectionRequired').checked = false;
            document.getElementById('optionsContainer').style.display = 'none';
            document.getElementById('optionsList').innerHTML = '';
            
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('newSectionModal'));
            modal.show();
        });
        
        // Cambiar tipo de sección
        document.getElementById('sectionType')?.addEventListener('change', (e) => {
            const type = e.target.value;
            const optionsContainer = document.getElementById('optionsContainer');
            
            if (type === 'checkbox' || type === 'radio' || type === 'select') {
                optionsContainer.style.display = 'block';
                if (document.querySelectorAll('#optionsList .input-group').length === 0) {
                    addOptionInput();
                }
            } else {
                optionsContainer.style.display = 'none';
            }
        });
        
        // Agregar opción
        document.getElementById('addOptionBtn')?.addEventListener('click', () => {
            addOptionInput();
        });
        
        // Guardar nueva sección
        document.getElementById('saveNewSectionBtn')?.addEventListener('click', () => {
            const name = document.getElementById('sectionName').value;
            const type = document.getElementById('sectionType').value;
            const required = document.getElementById('sectionRequired').checked;
            
            if (!name) {
                alert('El nombre de la sección es obligatorio');
                return;
            }
            
            // Obtener opciones si es necesario
            let options = [];
            if (type === 'checkbox' || type === 'radio' || type === 'select') {
                document.querySelectorAll('.option-input').forEach(input => {
                    if (input.value.trim()) {
                        options.push(input.value.trim());
                    }
                });
                
                if (options.length === 0) {
                    alert('Debe agregar al menos una opción');
                    return;
                }
            }
            
            // Crear nueva sección
            const newSection = {
                name,
                type,
                required,
                options
            };
            
            // Agregar a la plantilla
            if (!state.editingTemplate) {
                return;
            }
            
            if (!state.editingTemplate.sections) {
                state.editingTemplate.sections = [];
            }
            
            state.editingTemplate.sections.push(newSection);
            
            // Cerrar modal y actualizar UI
            bootstrap.Modal.getInstance(document.getElementById('newSectionModal')).hide();
            renderTemplateSections(state.editingTemplate.sections);
        });
        
        // Eventos para guardar/descargar informe
        document.getElementById('saveReportBtn')?.addEventListener('click', saveReport);
        document.getElementById('saveDraftBtn')?.addEventListener('click', saveReportDraft);
        document.getElementById('previewReportBtn')?.addEventListener('click', previewReport);
        document.getElementById('downloadPdfBtn')?.addEventListener('click', downloadReportPdf);
        
        // Eventos para configuración de seguridad
        document.getElementById('changePasswordBtn')?.addEventListener('click', changePassword);
        document.getElementById('sendVerificationEmailBtn')?.addEventListener('click', sendVerificationEmail);
        
        // Gestión de almacenamiento
        document.getElementById('clearCacheBtn')?.addEventListener('click', clearCache);
        
        // Simulación de almacenamiento
        updateStorageInfo();
        
        // Manejar asistente IA
        handleAIAssistant();
        
        // Agregar botones de mejora de texto
        addTextEnhancementButtons();
        
    } catch (error) {
        handleError(error, 'Error al inicializar la aplicación');
    }
});