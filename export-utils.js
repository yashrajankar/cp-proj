/**
 * Generate a professional PDF document using jsPDF library
 * @param {Object} options - Configuration options for the PDF
 * @param {string} options.title - Document title
 * @param {Array} options.headers - Table headers
 * @param {Array} options.data - Table data rows
 * @param {string} options.filename - Output filename
 * @param {Object} options.metadata - Additional metadata to include
 */
function exportToPDF(options) {
    const {
        title,
        headers,
        data,
        filename,
        metadata = {}
    } = options;
    
    try {
        // Check if jsPDF is available
        if (typeof window.jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            console.error('jsPDF library is not loaded');
            hideLoadingOverlay();
            showToast('Failed to export as PDF: PDF library not loaded', 'error');
            return false;
        }
        
        // Initialize jsPDF (handle both global and module versions)
        let jsPDFLib;
        if (typeof window.jspdf !== 'undefined') {
            // Modern version (as UMD module)
            jsPDFLib = window.jspdf.jsPDF;
        } else {
            // Legacy version (as global)
            jsPDFLib = window.jsPDF;
        }
        
        if (typeof jsPDFLib === 'undefined') {
            console.error('jsPDF library is not properly loaded');
            hideLoadingOverlay();
            showToast('Failed to export as PDF: PDF library not properly loaded', 'error');
            return false;
        }
        
        // Create new jsPDF instance
        const doc = new jsPDFLib({
            orientation: headers.length > 5 ? 'l' : 'p',
            unit: 'mm',
            format: 'a4'
        });
        
        // Set document properties
        doc.setProperties({
            title: title,
            subject: 'AICN Management System Report',
            author: 'AICN Management System',
            keywords: 'report, export, pdf',
            creator: 'AICN Management System'
        });
        
        // Set font and styling
        doc.setFont('helvetica');
        
        // Add title
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        const titleWidth = doc.getTextWidth(title.toUpperCase());
        const pageWidth = doc.internal.pageSize.width;
        doc.text(title.toUpperCase(), (pageWidth - titleWidth) / 2, 20);
        
        // Add generation date
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const dateText = `Generated on: ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`;
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, (pageWidth - dateWidth) / 2, 30);
        
        // Add metadata if provided
        let yPos = 40;
        if (Object.keys(metadata).length > 0) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            const metadataText = Object.entries(metadata)
                .map(([key, value]) => `${key}: ${value}`)
                .join('  |  ');
            const metadataWidth = doc.getTextWidth(metadataText);
            doc.text(metadataText, (pageWidth - metadataWidth) / 2, yPos);
            yPos += 10;
        }
        
        // Add table using autoTable plugin
        doc.autoTable({
            head: [headers.map(h => h.toUpperCase())],
            body: data,
            startY: yPos,
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            headStyles: {
                fillColor: [52, 152, 219], // #3498db
                textColor: [255, 255, 255], // white
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250] // #f8f9fa
            },
            margin: { top: yPos, left: 10, right: 10 },
            didDrawPage: function(data) {
                // Add footer with page numbers
                const pageCount = doc.internal.getNumberOfPages();
                const footerText = `AICN Management System | Page ${data.pageNumber} of ${pageCount}`;
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(footerText, 10, doc.internal.pageSize.height - 10);
            }
        });
        
        // Add watermark
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(40);
            doc.setTextColor(224, 224, 224); // #e0e0e0
            doc.setFont('helvetica', 'bold');
            doc.text('CONFIDENTIAL', pageWidth / 2, doc.internal.pageSize.height / 2, {
                angle: 45,
                align: 'center'
            });
        }
        
        // Save the PDF
        doc.save(filename);
        
        hideLoadingOverlay();
        showToast('PDF exported successfully', 'success');
        return true;
    } catch (error) {
        console.error('Failed to export as PDF:', error);
        hideLoadingOverlay();
        showToast('Failed to export as PDF: ' + error.message, 'error');
        return false;
    }
}

/**
 * Calculate optimal column widths based on content and page size
 * @param {Array} headers - Table headers
 * @param {Array} data - Table data rows
 * @param {string} pageOrientation - Page orientation ('portrait' or 'landscape')
 * @returns {Array} - Array of column widths
 */
function calculateColumnWidths(headers, data, pageOrientation) {
    // Available width for content (A4 dimensions minus margins)
    const pageWidth = pageOrientation === 'landscape' ? 842 - 80 : 595 - 80;
    
    // Calculate content widths for each column
    const contentWidths = headers.map((header, colIndex) => {
        // Get max content length for this column
        const maxLength = Math.max(
            header.length,
            ...data.map(row => String(row[colIndex] || '').length)
        );
        
        // Estimate width based on character count (adjust multiplier as needed)
        // Using a more precise calculation based on font metrics
        return Math.min(Math.max(maxLength * 6.5, 50), 200);
    });
    
    // Calculate total content width
    const totalContentWidth = contentWidths.reduce((sum, width) => sum + width, 0);
    
    // If content fits within page, distribute proportionally
    if (totalContentWidth <= pageWidth) {
        return contentWidths.map(width => width);
    }
    
    // If content is too wide, scale down proportionally
    const scaleFactor = pageWidth / totalContentWidth;
    return contentWidths.map(width => width * scaleFactor);
}

/**
 * Generate a professional Excel document with standardized styling
 * @param {Object} options - Configuration options for the Excel file
 * @param {string} options.title - Document title
 * @param {Array} options.headers - Table headers
 * @param {Array} options.data - Table data rows
 * @param {string} options.filename - Output filename
 * @param {Object} options.metadata - Additional metadata to include
 */
function exportToExcel(options) {
    const {
        title,
        headers,
        data,
        filename,
        metadata = {}
    } = options;
    
    try {
        // Prepare data for Excel with headers
        const worksheetData = [
            [], // Empty row for title
            [title.toUpperCase()],
            [`Generated on: ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`],
            [], // Empty row
        ];
        
        // Add metadata if provided
        if (Object.keys(metadata).length > 0) {
            const metadataText = Object.entries(metadata)
                .map(([key, value]) => `${key}: ${value}`)
                .join('  |  ');
            worksheetData.push([metadataText]);
            worksheetData.push([]); // Empty row
        }
        
        // Add table headers and data
        worksheetData.push(headers);
        data.forEach(row => worksheetData.push(row));
        
        // Create workbook and worksheet
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Style the title row
        ws['A2'] = { t: 's', v: title.toUpperCase() };
        ws['!merges'] = [{s: {r:1, c:0}, e: {r:1, c:headers.length-1}}]; // Merge cells for title
        
        // Set column widths based on content
        const colWidths = headers.map((header, index) => {
            const maxWidth = Math.max(
                header.length,
                ...data.map(row => String(row[index] || '').length)
            );
            return { wch: Math.min(Math.max(maxWidth + 2, 15), 50) }; // Min 15, max 50 chars
        });
        ws['!cols'] = colWidths;
        
        // Add styling (basic styling for Excel)
        if (!ws['!rows']) ws['!rows'] = [];
        ws['!rows'][1] = { hpt: 24 }; // Title row height
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title.split(' ')[0] + ' Report');
        
        // Export to Excel file
        XLSX.writeFile(wb, filename);
        return true;
    } catch (error) {
        console.error('Failed to export as Excel:', error);
        return false;
    }
}

/**
 * Generate a CSV file with standardized formatting
 * @param {Object} options - Configuration options for the CSV file
 * @param {string} options.title - Document title
 * @param {Array} options.headers - Table headers
 * @param {Array} options.data - Table data rows
 * @param {string} options.filename - Output filename
 * @param {Object} options.metadata - Additional metadata to include
 */
function exportToCSV(options) {
    const {
        title,
        headers,
        data,
        filename,
        metadata = {}
    } = options;
    
    try {
        // Generate CSV data with enhanced formatting
        let csvContent = '';
        
        // Report title
        csvContent += title.toUpperCase() + '\n';
        csvContent += `Generated on: ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}\n`;
        csvContent += '\n';
        
        // Add metadata if provided
        if (Object.keys(metadata).length > 0) {
            const metadataText = Object.entries(metadata)
                .map(([key, value]) => `${key}: ${value}`)
                .join('  |  ');
            csvContent += metadataText + '\n';
            csvContent += '\n';
        }
        
        // Column headers
        csvContent += headers.join(',') + '\n';
        
        // Data rows
        data.forEach(row => {
            const escapedRow = row.map(cell => {
                // Escape values that contain commas, quotes, or newlines
                const stringValue = String(cell || '');
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            csvContent += escapedRow.join(',') + '\n';
        });
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    } catch (error) {
        console.error('Failed to export as CSV:', error);
        return false;
    }
}

// Export functions for global use
window.exportToPDF = exportToPDF;
window.exportToExcel = exportToExcel;
window.exportToCSV = exportToCSV;

// Make jsPDF available globally for compatibility
if (typeof window.jspdf !== 'undefined' && typeof window.jsPDF === 'undefined') {
    window.jsPDF = window.jspdf.jsPDF;
}
