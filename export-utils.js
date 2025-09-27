// export-utils.js - Standardized export utilities for consistent export functionality across all sections

/**
 * Generate a professional PDF document with standardized styling
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
        // Check if pdfMake is available
        if (typeof pdfMake === 'undefined') {
            console.error('pdfMake library is not loaded');
            hideLoadingOverlay();
            showToast('Failed to export as PDF: PDF library not loaded', 'error');
            return false;
        }
        
        // Determine page orientation based on number of columns
        const pageOrientation = headers.length > 5 ? 'landscape' : 'portrait';
        
        // Prepare data for PDF with enhanced styling
        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: pageOrientation,
            pageMargins: [40, 80, 40, 60],
            content: [
                {
                    text: title.toUpperCase(),
                    style: 'header',
                    alignment: 'center'
                },
                {
                    text: `Generated on: ${new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}`,
                    style: 'subheader',
                    alignment: 'center',
                    margin: [0, 0, 0, 20]
                }
            ],
            styles: {
                header: {
                    fontSize: 22,
                    bold: true,
                    margin: [0, 0, 0, 10],
                    color: '#2c3e50'
                },
                subheader: {
                    fontSize: 12,
                    bold: true,
                    margin: [0, 5, 0, 15],
                    color: '#7f8c8d'
                },
                metadata: {
                    fontSize: 10,
                    italics: true,
                    color: '#95a5a6'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 10,
                    color: '#ffffff',
                    fillColor: '#3498db',
                    alignment: 'center'
                },
                tableCell: {
                    fontSize: 9,
                    color: '#2c3e50'
                },
                tableAltRow: {
                    fillColor: '#f8f9fa'
                }
            },
            defaultStyle: {
                fontSize: 9,
                color: '#34495e'
            }
        };
        
        // Add metadata if provided
        if (Object.keys(metadata).length > 0) {
            const metadataText = Object.entries(metadata)
                .map(([key, value]) => `${key}: ${value}`)
                .join('  |  ');
                
            docDefinition.content.push({
                text: metadataText,
                style: 'metadata',
                alignment: 'center',
                margin: [0, 0, 0, 20]
            });
        }
        
        // Prepare table data with alternating row colors
        const tableBody = [
            headers.map(header => ({ text: header.toUpperCase(), style: 'tableHeader' })),
            ...data.map((row, index) => {
                const rowStyle = index % 2 === 0 ? {} : { fillColor: '#f8f9fa' };
                return row.map(cell => ({
                    text: cell,
                    style: 'tableCell',
                    ...rowStyle
                }));
            })
        ];
        
        // Improved column width calculation
        const columnWidths = calculateColumnWidths(headers, data, pageOrientation);
        
        // Add table to document with improved layout and page breaks
        docDefinition.content.push({
            table: {
                headerRows: 1,
                widths: columnWidths,
                body: tableBody,
                dontBreakRows: true, // Prevent rows from splitting across pages
                keepWithHeaderRows: 1 // Keep at least 1 row with header on page break
            },
            layout: {
                hLineWidth: function(i, node) {
                    return (i === 0 || i === node.table.body.length) ? 1.5 : 1;
                },
                vLineWidth: function(i, node) {
                    return (i === 0 || i === node.table.widths.length) ? 1.5 : 0.5;
                },
                hLineColor: function(i, node) {
                    return (i === 0 || i === node.table.body.length) ? '#2c3e50' : '#e1e5e9';
                },
                vLineColor: function(i, node) {
                    return (i === 0 || i === node.table.widths.length) ? '#2c3e50' : '#e1e5e9';
                },
                paddingLeft: function(i, node) { return 8; },
                paddingRight: function(i, node) { return 8; },
                paddingTop: function(i, node) { return 6; },
                paddingBottom: function(i, node) { return 6; }
            },
            margin: [0, 0, 0, 20]
        });
        
        // Add footer with page numbers and branding
        docDefinition.footer = function(currentPage, pageCount) {
            return {
                columns: [
                    {
                        text: 'AICN Management System',
                        fontSize: 8,
                        color: '#7f8c8d',
                        margin: [40, 10, 0, 0]
                    },
                    {
                        text: `Page ${currentPage} of ${pageCount}`,
                        alignment: 'right',
                        fontSize: 8,
                        color: '#7f8c8d',
                        margin: [0, 10, 40, 0]
                    }
                ],
                margin: [0, 10, 0, 0]
            };
        };
        
        // Add page header with title and logo on subsequent pages
        docDefinition.header = function(currentPage, pageCount) {
            if (currentPage > 1) {
                return {
                    columns: [
                        {
                            // This would be a logo if we had one
                            // image: 'logo.png',
                            // width: 30,
                            // height: 30
                        },
                        {
                            text: 'AICN Management System',
                            fontSize: 16,
                            bold: true,
                            color: '#2c3e50',
                            alignment: 'center',
                            margin: [0, 15, 0, 0]
                        }
                    ],
                    margin: [40, 20, 40, 0]
                };
            }
            return null;
        };
        
        // Add watermark for professional appearance
        docDefinition.watermark = {
            text: 'CONFIDENTIAL',
            color: '#e0e0e0',
            opacity: 0.3,
            bold: true,
            angle: 45
        };
        
        // Generate and download PDF with better error handling
        console.log('Creating PDF with docDefinition:', JSON.stringify(docDefinition, null, 2));
        
        // Create the PDF document with custom font settings to avoid Helvetica-Bold error
        const pdfDoc = pdfMake.createPdf(docDefinition);
        
        // Check if pdfMake is properly loaded
        if (typeof pdfDoc === 'undefined' || pdfDoc === null) {
            console.error('pdfMake is not properly loaded');
            hideLoadingOverlay();
            showToast('Failed to export as PDF: PDF engine error', 'error');
            return false;
        }
        
        // Use getBase64 to test if PDF generation works
        pdfDoc.getBase64(function(base64) {
            console.log('PDF generated successfully, base64 length:', base64.length);
            
            // Now download the PDF
            try {
                pdfDoc.download(filename);
                console.log('PDF download initiated');
                hideLoadingOverlay();
                showToast('PDF exported successfully', 'success');
            } catch (downloadError) {
                console.error('Error during PDF download:', downloadError);
                hideLoadingOverlay();
                showToast('Failed to download PDF: ' + downloadError.message, 'error');
                // Fallback: open in new window
                try {
                    pdfDoc.open();
                    console.log('PDF opened in new window as fallback');
                    showToast('PDF opened in new window', 'info');
                } catch (openError) {
                    console.error('Error opening PDF in new window:', openError);
                    showToast('Failed to open PDF: ' + openError.message, 'error');
                }
            }
        }, function(error) {
            console.error('Error generating PDF:', error);
            hideLoadingOverlay();
            showToast('Failed to generate PDF: ' + error.message, 'error');
            return false;
        });
        
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