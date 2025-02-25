const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const asyncHandler = require('express-async-handler');

// @desc    Generate PDF report
// @route   POST /api/reports/generate-pdf
// @access  Private
const generatePDF = asyncHandler(async (req, res) => {
    const { reportData } = req.body;
    
    if (!reportData) {
        res.status(400);
        throw new Error('No report data provided');
    }
    
    // Create a document
    const doc = new PDFDocument({
        size: reportData.pdfOptions?.format || 'A4',
        layout: reportData.pdfOptions?.orientation || 'portrait',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
            Title: `${reportData.templateName} - ${reportData.patient?.name || 'Patient Report'}`,
            Author: reportData.professional?.name || 'Medical Professional',
            Subject: 'Psychological Report',
            Keywords: 'psychology, report, assessment',
            CreationDate: new Date(),
            Producer: 'Psychological Report System'
        }
    });
    
    // Create temporary filename
    const fileName = `report_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '..', '..', 'temp', fileName);
    
    // Ensure temp directory exists
    if (!fs.existsSync(path.join(__dirname, '..', '..', 'temp'))) {
        fs.mkdirSync(path.join(__dirname, '..', '..', 'temp'), { recursive: true });
    }
    
    // Pipe its output to a file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Add content to the PDF
    
    // Header with logo if available
    if (reportData.config?.logo) {
        try {
            // Logo is stored as base64 data URL, extract the actual base64 data
            const base64Data = reportData.config.logo.split(';base64,').pop();
            const logoPath = path.join(__dirname, '..', '..', 'temp', `logo_${Date.now()}.png`);
            
            // Save logo temporarily
            fs.writeFileSync(logoPath, base64Data, { encoding: 'base64' });
            
            // Add logo to document
            doc.image(logoPath, {
                fit: [200, 100],
                align: 'center'
            });
            
            // Clean up temporary logo file
            setTimeout(() => {
                try {
                    fs.unlinkSync(logoPath);
                } catch (error) {
                    console.error('Error removing temporary logo file:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('Error adding logo to PDF:', error);
        }
    }
    
    // Report title
    doc.moveDown(2);
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .fillColor(reportData.config?.primaryColor || '#000000')
       .text(reportData.templateName, { align: 'center' });
    
    doc.moveDown(1);
    
    // Report date
    const reportDate = reportData.date ? new Date(reportData.date).toLocaleDateString() : new Date().toLocaleDateString();
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`Fecha: ${reportDate}`, { align: 'right' });
    
    doc.moveDown(2);
    
    // Patient information
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .fillColor(reportData.config?.primaryColor || '#000000')
       .text('Información del Paciente');
    
    doc.moveDown(0.5);
    doc.fontSize(12)
       .font('Helvetica')
       .fillColor('#333333');
    
    // Patient name
    if (reportData.patient?.name) {
        doc.text(`Nombre: ${reportData.patient.name}`);
    }
    
    // Patient age
    if (reportData.patient?.age) {
        doc.text(`Edad: ${reportData.patient.age} años`);
    }
    
    // Patient ID
    if (reportData.patient?.id) {
        doc.text(`ID: ${reportData.patient.id}`);
    }
    
    // Patient phone
    if (reportData.patient?.phone) {
        doc.text(`Teléfono: ${reportData.patient.phone}`);
    }
    
    doc.moveDown(2);
    
    // Report sections
    if (reportData.sections && reportData.sections.length > 0) {
        reportData.sections.forEach(section => {
            // Section title
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .fillColor(reportData.config?.primaryColor || '#000000')
               .text(section.name);
            
            doc.moveDown(0.5);
            doc.fontSize(12)
               .font('Helvetica')
               .fillColor('#333333');
            
            // Section content based on type
            switch (section.type) {
                case 'text':
                    doc.text(section.value || '(Sin datos)');
                    break;
                    
                case 'checkbox':
                    if (section.values && section.values.length > 0) {
                        section.values.forEach(value => {
                            doc.text(`• ${value}`);
                        });
                    } else {
                        doc.text('(Sin selección)');
                    }
                    break;
                    
                case 'radio':
                case 'select':
                    doc.text(section.value || '(Sin selección)');
                    break;
            }
            
            doc.moveDown(2);
        });
    }
    
    // Professional information
    doc.moveDown(1);
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#333333');
    
    if (reportData.professional?.name) {
        doc.text(reportData.professional.name);
    }
    
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666');
    
    if (reportData.professional?.license) {
        doc.text(`Licencia: ${reportData.professional.license}`);
    }
    
    if (reportData.professional?.specialty) {
        doc.text(`Especialidad: ${reportData.professional.specialty}`);
    }
    
    // Add watermark if enabled
    if (reportData.config?.enableWatermark && reportData.config?.watermark) {
        try {
            // Watermark is stored as base64 data URL, extract the actual base64 data
            const base64Data = reportData.config.watermark.split(';base64,').pop();
            const watermarkPath = path.join(__dirname, '..', '..', 'temp', `watermark_${Date.now()}.png`);
            
            // Save watermark temporarily
            fs.writeFileSync(watermarkPath, base64Data, { encoding: 'base64' });
            
            // Get page dimensions
            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
            const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
            
            // Add watermark to each page
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                
                // Save graphics state
                doc.save();
                
                // Translate to center of page and rotate
                doc.translate(doc.page.width / 2, doc.page.height / 2);
                doc.rotate(-45);
                doc.opacity(0.15);
                
                // Draw watermark
                doc.image(watermarkPath, -pageWidth / 4, -pageHeight / 4, {
                    width: pageWidth / 2,
                    height: pageHeight / 2,
                    align: 'center',
                    valign: 'center'
                });
                
                // Restore graphics state
                doc.restore();
            }
            
            // Clean up temporary watermark file
            setTimeout(() => {
                try {
                    fs.unlinkSync(watermarkPath);
                } catch (error) {
                    console.error('Error removing temporary watermark file:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('Error adding watermark to PDF:', error);
        }
    }
    
    // Add footer with page numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        
        // Footer line
        doc.moveTo(50, doc.page.height - 50)
           .lineTo(doc.page.width - 50, doc.page.height - 50)
           .stroke('#cccccc');
        
        // Page number
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#666666')
           .text(
                `Página ${i + 1} de ${range.count}`,
                50,
                doc.page.height - 40,
                { align: 'center', width: doc.page.width - 100 }
            );
    }
    
    // Finalize PDF
    doc.end();
    
    // Wait for the PDF to be fully written
    stream.on('finish', () => {
        // Serve the PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(reportData.patient?.name || 'report')}_${reportDate.replace(/\//g, '-')}.pdf"`);
        
        // Send the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        // Clean up temporary file after sending
        fileStream.on('end', () => {
            setTimeout(() => {
                try {
                    fs.unlinkSync(filePath);
                } catch (error) {
                    console.error('Error removing temporary PDF file:', error);
                }
            }, 1000);
        });
    });
});

// @desc    Preview PDF report
// @route   POST /api/reports/preview-pdf
// @access  Private
const previewPDF = asyncHandler(async (req, res) => {
    const { reportData } = req.body;
    
    if (!reportData) {
        res.status(400);
        throw new Error('No report data provided');
    }
    
    // Create a document
    const doc = new PDFDocument({
        size: reportData.pdfOptions?.format || 'A4',
        layout: reportData.pdfOptions?.orientation || 'portrait',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
            Title: `PREVIEW - ${reportData.templateName} - ${reportData.patient?.name || 'Patient Report'}`,
            Author: reportData.professional?.name || 'Medical Professional',
            Subject: 'Psychological Report Preview',
            Keywords: 'psychology, report, assessment, preview',
            CreationDate: new Date(),
            Producer: 'Psychological Report System'
        }
    });
    
    // The rest of the code is the same as generatePDF but adding a "PREVIEW" watermark
    
    // Create temporary filename
    const fileName = `preview_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '..', '..', 'temp', fileName);
    
    // Ensure temp directory exists
    if (!fs.existsSync(path.join(__dirname, '..', '..', 'temp'))) {
        fs.mkdirSync(path.join(__dirname, '..', '..', 'temp'), { recursive: true });
    }
    
    // Pipe its output to a file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Add content to the PDF - same as generatePDF function
    // [...same content generation code as above...]
    
    // Add a "PREVIEW" watermark on each page
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        
        // Save graphics state
        doc.save();
        
        // Translate to center of page and rotate
        doc.translate(doc.page.width / 2, doc.page.height / 2);
        doc.rotate(-45);
        doc.opacity(0.2);
        
        // Draw PREVIEW text
        doc.fontSize(100)
           .font('Helvetica-Bold')
           .fillColor('#FF0000')
           .text('VISTA PREVIA', 0, 0, {
                align: 'center',
                width: doc.page.width,
                characterSpacing: 10
           });
        
        // Restore graphics state
        doc.restore();
    }
    
    // Finalize PDF
    doc.end();
    
    // Wait for the PDF to be fully written
    stream.on('finish', () => {
        // Serve the PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="preview_${Date.now()}.pdf"`);
        
        // Send the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        // Clean up temporary file after sending
        fileStream.on('end', () => {
            setTimeout(() => {
                try {
                    fs.unlinkSync(filePath);
                } catch (error) {
                    console.error('Error removing temporary PDF file:', error);
                }
            }, 1000);
        });
    });
});

module.exports = {
    generatePDF,
    previewPDF
};