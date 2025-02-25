/**
 * AI Assistant Service
 * This service connects to an AI provider (like OpenAI) to generate content.
 */

const { OpenAI } = require('openai');

// Variable to store the OpenAI client
let aiClient = null;

/**
 * Initialize the AI service with configuration
 * @param {Object} config - Configuration options for the AI service
 */
const initialize = (config = {}) => {
    try {
        // Check if API key is available
        if (!process.env.OPENAI_API_KEY && !config.apiKey) {
            console.warn('OpenAI API key not found. AI features will use fallback mode.');
            return null;
        }
        
        // Initialize OpenAI client
        aiClient = new OpenAI({ 
            apiKey: config.apiKey || process.env.OPENAI_API_KEY 
        });
        
        console.log('OpenAI client initialized successfully');
        return aiClient;
    } catch (error) {
        console.error('Error initializing OpenAI client:', error);
        return null;
    }
};

/**
 * Generate a response from the AI
 * @param {string} prompt - The user's prompt
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - The AI's response
 */
const generateResponse = async (prompt, options = {}) => {
    // If AI client is not initialized, try to initialize it
    if (!aiClient) {
        aiClient = initialize();
    }
    
    // If still not initialized and not in mock mode, use fallback response
    if (!aiClient && !process.env.AI_SERVICE_MOCK) {
        console.warn('AI client not initialized. Using fallback response.');
        return getFallbackResponse(prompt);
    }
    
    try {
        // For development/testing, allow a mock mode
        if (process.env.AI_SERVICE_MOCK === 'true') {
            console.log('Using mock AI response');
            return getMockResponse(prompt, options);
        }
        
        // Real implementation with OpenAI
        console.log('Sending request to OpenAI...');
        const completion = await aiClient.chat.completions.create({
            model: options.model || "gpt-3.5-turbo",
            messages: [
                { role: "system", content: options.systemPrompt || "You are a helpful assistant for psychological reports. Respond in Spanish." },
                { role: "user", content: prompt }
            ],
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 500
        });
        
        console.log('Received response from OpenAI');
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating AI response:', error);
        throw new Error('Failed to generate AI response: ' + error.message);
    }
};

/**
 * Generate content for report sections
 * @param {string} sectionType - Type of section (conclusions, recommendations, etc.)
 * @param {Object} reportData - Data about the report
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - The generated content
 */
const generateReportContent = async (sectionType, reportData, options = {}) => {
    // Build a prompt based on the section type and report data
    let prompt = '';
    
    switch (sectionType) {
        case 'conclusions':
            prompt = `Genera conclusiones psicológicas profesionales basadas en los siguientes datos de evaluación:\n\n`;
            break;
            
        case 'recommendations':
            prompt = `Genera recomendaciones psicológicas profesionales basadas en los siguientes datos de evaluación:\n\n`;
            break;
            
        case 'summary':
            prompt = `Genera un resumen ejecutivo profesional para un informe psicológico con los siguientes datos:\n\n`;
            break;
            
        default:
            prompt = `Genera contenido profesional para una sección de informe psicológico con los siguientes datos:\n\n`;
    }
    
    // Add report data to the prompt
    if (reportData.patient && reportData.patient.name) {
        prompt += `Paciente: ${reportData.patient.name}\n`;
    }
    
    if (reportData.patient && reportData.patient.age) {
        prompt += `Edad: ${reportData.patient.age}\n`;
    }
    
    // Add all section data
    if (reportData.sections && reportData.sections.length > 0) {
        prompt += `\nDatos de Evaluación:\n`;
        
        reportData.sections.forEach(section => {
            prompt += `- ${section.name}: `;
            
            if (section.type === 'text') {
                prompt += `${section.value || 'No proporcionado'}\n`;
            } else if (section.type === 'checkbox' && section.values && section.values.length > 0) {
                prompt += `${section.values.join(', ')}\n`;
            } else if ((section.type === 'radio' || section.type === 'select') && section.value) {
                prompt += `${section.value}\n`;
            } else {
                prompt += `No proporcionado\n`;
            }
        });
    }
    
    // Add specific instructions based on section type
    switch (sectionType) {
        case 'conclusions':
            prompt += `\nPor favor, genera conclusiones psicológicas completas basadas en los datos anteriores. Incluye:
1. Resumen de hallazgos principales
2. Posible diagnóstico psicológico si es aplicable
3. Fortalezas y desafíos identificados
4. Estado psicológico general

Usa un tono profesional y clínico apropiado para un informe psicológico.`;
            break;
            
        case 'recommendations':
            prompt += `\nPor favor, genera recomendaciones psicológicas apropiadas basadas en los datos anteriores. Incluye:
1. Intervenciones o tratamientos recomendados
2. Sugerencias de frecuencia y duración
3. Evaluaciones adicionales si fueran necesarias
4. Recursos de apoyo para el paciente/familia

Formátalo como una lista numerada en orden de prioridad.`;
            break;
            
        case 'summary':
            prompt += `\nPor favor, genera un resumen ejecutivo conciso para esta evaluación psicológica. Mantenlo en aproximadamente 150-200 palabras.`;
            break;
    }
    
    // Add style guidelines if provided
    if (options.style) {
        prompt += `\n\nPor favor, usa un estilo de escritura ${options.style}.`;
    }
    
    // Generate response
    return generateResponse(prompt, options);
};

/**
 * Enhance or improve existing text
 * @param {string} originalText - The text to enhance
 * @param {string} enhancementType - Type of enhancement (improve_clarity, formal_tone, etc.)
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - The enhanced text
 */
const enhanceText = async (originalText, enhancementType, options = {}) => {
    if (!originalText) {
        return "Por favor proporciona texto para mejorar.";
    }
    
    let prompt = '';
    
    switch (enhancementType) {
        case 'improve_clarity':
            prompt = `Mejora la claridad y legibilidad del siguiente texto manteniendo el tono profesional:\n\n${originalText}`;
            break;
            
        case 'formal_tone':
            prompt = `Reescribe el siguiente texto para tener un tono más formal y profesional adecuado para un informe psicológico:\n\n${originalText}`;
            break;
            
        case 'simplify':
            prompt = `Simplifica el siguiente texto para que sea más accesible manteniendo el significado profesional:\n\n${originalText}`;
            break;
            
        case 'expand':
            prompt = `Amplía el siguiente texto para proporcionar más detalle y profundidad manteniendo el tono profesional:\n\n${originalText}`;
            break;
            
        default:
            prompt = `Mejora el siguiente texto manteniendo su significado central:\n\n${originalText}`;
    }
    
    return generateResponse(prompt, options);
};

/**
 * Generate mock responses for development/testing
 * @param {string} prompt - The user's prompt
 * @param {Object} options - Additional options
 * @returns {string} - A mock response
 */
const getMockResponse = (prompt, options = {}) => {
    // Simple rules to generate different responses based on keywords in the prompt
    const lowercasePrompt = prompt.toLowerCase();
    
    if (lowercasePrompt.includes('conclusiones') || lowercasePrompt.includes('conclusions')) {
        return `## Conclusiones

En base a la evaluación realizada, se observa que el paciente presenta indicadores compatibles con un Trastorno de Ansiedad Generalizada (TAG) de intensidad moderada. Los síntomas principales incluyen:

1. Preocupación excesiva y persistente
2. Dificultad para controlar las preocupaciones
3. Inquietud y tensión muscular
4. Alteraciones del sueño
5. Irritabilidad

Estos síntomas han estado presentes por más de 6 meses y están causando un deterioro significativo en su funcionamiento social y laboral. La aparición de los síntomas coincide con cambios importantes en su entorno laboral, lo que sugiere un componente situacional en la manifestación del trastorno.

Como aspectos positivos, el paciente muestra buena introspección y motivación para el cambio, lo que representa un factor favorable para el pronóstico del tratamiento.`;
    }
    
    if (lowercasePrompt.includes('recomendaciones') || lowercasePrompt.includes('recommendations')) {
        return `## Recomendaciones

1. **Terapia Cognitivo-Conductual (TCC)**: Se recomienda un programa de 12 sesiones iniciales, con frecuencia semanal, enfocado en técnicas de manejo de ansiedad, reestructuración cognitiva y exposición gradual.

2. **Evaluación Psiquiátrica**: Derivación para valoración de posible tratamiento farmacológico complementario, especialmente para el manejo de los síntomas de ansiedad aguda y trastornos del sueño.

3. **Técnicas de Relajación**: Entrenamiento en respiración diafragmática, relajación muscular progresiva y mindfulness como herramientas de autorregulación.

4. **Higiene del Sueño**: Implementación de rutinas y hábitos que favorezcan un sueño reparador.

5. **Actividad Física Regular**: Incorporación de 30 minutos diarios de actividad física moderada para reducir la tensión física y mejorar el estado de ánimo.

6. **Reevaluación**: Seguimiento en 3 meses para valorar la evolución de los síntomas y ajustar las intervenciones según sea necesario.`;
    }
    
    if (lowercasePrompt.includes('resumen') || lowercasePrompt.includes('summary')) {
        return `## Resumen Ejecutivo

Evaluación psicológica realizada al paciente de 34 años que acude por presentar sintomatología ansiosa persistente relacionada con su entorno laboral. La evaluación incluyó entrevista clínica, evaluación psicométrica y análisis funcional de la conducta. Los resultados indican un cuadro compatible con Trastorno de Ansiedad Generalizada de intensidad moderada, con afectación en las áreas social y laboral. Se observa buena introspección y motivación hacia el tratamiento. Se recomienda un abordaje multimodal que incluye terapia cognitivo-conductual, posible apoyo farmacológico y estrategias de autorregulación emocional. Pronóstico favorable con adecuada adherencia al tratamiento.`;
    }
    
    // Default response for other types of prompts
    return `Como asistente especializado en psicología, puedo ayudarte a redactar informes profesionales, elaborar conclusiones basadas en evaluaciones, o sugerir recomendaciones terapéuticas personalizadas.

Para obtener mejores resultados, te sugiero proporcionar detalles específicos sobre el caso, como datos demográficos básicos, resultados de evaluaciones, y las preocupaciones principales del paciente.

¿En qué aspecto específico del informe psicológico necesitas asistencia?`;
};

/**
 * Get a fallback response when AI service is unavailable
 * @param {string} prompt - The user's prompt
 * @returns {string} - A fallback response
 */
const getFallbackResponse = (prompt) => {
    return `Lo siento, el servicio de IA no está disponible en este momento. Por favor, configura un proveedor de IA en las configuraciones del sistema o active el modo de simulación para pruebas.

Para activar el modo de simulación, agregue AI_SERVICE_MOCK=true en su archivo .env`;
};

module.exports = {
    initialize,
    generateResponse,
    generateReportContent,
    enhanceText
};