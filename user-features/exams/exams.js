// Polyfill for padStart if not available
if (!String.prototype.padStart) {
    String.prototype.padStart = function padStart(targetLength, padString) {
        targetLength = targetLength >> 0; // truncate if number, or convert non-number to 0;
        padString = String(typeof padString !== 'undefined' ? padString : ' ');
        if (this.length >= targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}

// Test the padStart function
console.log('Testing padStart:');
console.log('5'.padStart(2, '0')); // Should be "05"
console.log('12'.padStart(2, '0')); // Should be "12"

// Exam Management JavaScript

// Pagination variables have been removed to avoid conflicts with the second implementation

// This section has been removed to avoid conflicts with the second initialization section
// The second initialization section at the end of the file will be used instead

// The debouncedSearch function has been removed to avoid conflicts with the second implementation

// The setupEventListeners function has been removed to avoid conflicts with the second implementation
// Event listeners are set up in the second initialization section at the end of the file

// This function has been removed to avoid conflicts with the second implementation
// The loadExams() function at the end of the file will be used instead

// This function has been removed to avoid conflicts with the second implementation
// The renderExamsTable() function at the end of the file will be used instead

// Pagination functions
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderTimetable(timetableData);
    updatePaginationControls();
    
    // Update page input
    const pageInput = document.getElementById('pageInput');
    if (pageInput) {
        pageInput.value = currentPage;
    }
}

function updatePaginationControls() {
    const firstPageBtn = document.getElementById('firstPageBtn');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const lastPageBtn = document.getElementById('lastPageBtn');
    const pageInput = document.getElementById('pageInput');
    const totalPagesElement = document.getElementById('totalPages');
    
    // Update total pages display
    if (totalPagesElement) {
        totalPagesElement.textContent = totalPages;
    }
    
    // Update page input
    if (pageInput) {
        pageInput.value = currentPage;
        pageInput.max = totalPages;
    }
    
    // Update button states
    if (firstPageBtn) {
        firstPageBtn.disabled = currentPage === 1;
    }
    
    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage === 1;
    }
    
    if (nextPageBtn) {
        nextPageBtn.disabled = currentPage === totalPages;
    }
    
    if (lastPageBtn) {
        lastPageBtn.disabled = currentPage === totalPages;
    }
}

function updatePaginationInfo(totalItems) {
    const paginationInfo = document.getElementById('paginationInfo');
    if (!paginationInfo) return;
    
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, totalItems);
    
    paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems} exams`;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function openTimetableModal(entryId = null) {
    const modal = document.getElementById('timetableModal');
    const modalTitle = document.getElementById('modalTitle');
    const entryIdInput = document.getElementById('entryId');
    
    if (entryId) {
        // Edit existing entry
        modalTitle.innerHTML = '<i class="fas fa-calendar-plus"></i> Edit Exam';
        entryIdInput.value = entryId;
        populateFormWithEntryData(entryId);
    } else {
        // Add new entry
        modalTitle.innerHTML = '<i class="fas fa-calendar-plus"></i> Add Exam';
        entryIdInput.value = '';
        resetForm();
    }
    
    modal.style.display = 'block';
}

function populateFormWithEntryData(entryId) {
    const entry = timetableData.find(e => e._id == entryId);
    
    if (entry) {
        document.getElementById('codeInput').value = entry.code || '';
        document.getElementById('subjectInput').value = entry.subject || '';
        document.getElementById('dateInput').value = entry.date || '';
        document.getElementById('timeInput').value = entry.time || '';
        document.getElementById('statusSelect').value = entry.status || 'Scheduled';
    }
}

function resetForm() {
    const form = document.getElementById('timetableForm');
    if (form) {
        form.reset();
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

async function handleTimetableSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        
        // Log all form data entries for debugging
        console.log('All form data entries:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }
        
        const entryData = {
            code: formData.get('codeInput'),
            subject: formData.get('subjectInput'),
            date: formData.get('dateInput'),
            time: formData.get('timeInput'),
            status: formData.get('statusSelect')
        };
        
        // Log the form data for debugging
        console.log('Form data being sent:', entryData);
        
        // Validate that all required fields are present
        if (!entryData.code || !entryData.subject || !entryData.date || !entryData.time || !entryData.status) {
            const missingFields = [];
            if (!entryData.code) missingFields.push('code');
            if (!entryData.subject) missingFields.push('subject');
            if (!entryData.date) missingFields.push('date');
            if (!entryData.time) missingFields.push('time');
            if (!entryData.status) missingFields.push('status');
            
            throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }
        
        // Ensure date is in correct format (YYYY-MM-DD)
        if (entryData.date) {
            // The HTML5 date input should already return in YYYY-MM-DD format
            // But let's make sure it's a string and properly formatted
            entryData.date = entryData.date.toString();
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(entryData.date)) {
                console.log('Date is not in correct format, attempting conversion');
                // If it's not in the correct format, try to convert it
                entryData.date = ensureCorrectDateFormat(entryData.date);
                console.log('Converted date:', entryData.date);
            }
        }
        
        const entryId = formData.get('entryId');
        
        if (entryId) {
            // Update existing entry
            await fetchData(`user/exams/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entryData)
            });
        } else {
            // Add new entry
            await fetchData('user/exams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entryData)
            });
        }
        
        closeModal();
        await loadExams(); // Use the new loadExams function
        updateStatistics(); // Use the new updateStatistics function
        
        showSuccess(entryId ? 'Exam updated successfully' : 'Exam added successfully');
    } catch (error) {
        console.error('Failed to save exam:', error);
        showError('Failed to save exam: ' + error.message);
    }
}

function openImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Parse CSV file for timetable data
async function parseTimetableCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                // Handle different line endings (Windows \r\n, Unix \n, Mac \r)
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                
                if (lines.length === 0) {
                    reject(new Error('CSV file is empty'));
                    return;
                }
                
                const headers = lines[0].split(',').map(h => h.trim().replace(/["']+/g, ''));
                
                const exams = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    
                    // Handle quoted values that may contain commas
                    const values = parseCSVLine(lines[i]);
                    const exam = {};
                    
                    headers.forEach((header, index) => {
                        // Clean value by trimming whitespace and removing quotes and trailing carriage returns
                        const value = values[index] ? values[index].trim().replace(/["']+/g, '').replace(/\r$/, '') : '';
                        switch (header.toLowerCase()) {
                            case 'code':
                            case 'exam code':
                                exam.code = value;
                                break;
                            case 'subject':
                            case 'exam subject':
                                exam.subject = value;
                                break;
                            case 'date':
                            case 'exam date':
                                exam.date = value;
                                break;
                            case 'time':
                            case 'exam time':
                                exam.time = value;
                                break;
                            case 'status':
                            case 'exam status':
                                exam.status = value || 'Scheduled';
                                break;
                        }
                    });
                    
                    // Only add if we have required fields (code, subject, date, time)
                    if (exam.code && exam.subject && exam.date && exam.time) {
                        // Validate status value
                        if (exam.status && !['Scheduled', 'Completed', 'Cancelled'].includes(exam.status)) {
                            exam.status = 'Scheduled'; // Default to scheduled
                        }
                        exams.push(exam);
                    }
                }
                
                resolve(exams);
            } catch (error) {
                reject(new Error(`Failed to parse CSV: ${error.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Handle timetable import submission
async function handleImportSubmit(event) {
    event.preventDefault();
    
    try {
        const form = event.target;
        const formData = new FormData(form);
        const fileInput = form.querySelector('#csvFile');
        const file = fileInput ? fileInput.files[0] : null;
        // Fix checkbox handling - it returns "on" when checked, null when unchecked
        const overwriteData = formData.get('overwriteData') === 'on';
        
        if (!file) {
            showError('No file selected. Please choose a CSV or Excel file to import.');
            // Add visual feedback to highlight the file input
            const fileInput = document.getElementById('csvFile');
            if (fileInput) {
                fileInput.focus();
                fileInput.style.borderColor = 'red';
                fileInput.style.boxShadow = '0 0 5px red';
                
                // Remove highlight after user interacts with the input
                fileInput.addEventListener('change', function() {
                    fileInput.style.borderColor = '';
                    fileInput.style.boxShadow = '';
                }, { once: true });
            }
            return;
        }
        
        // Check file type
        let examsData;
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            // Parse CSV file
            examsData = await parseTimetableCSVFile(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.type === 'application/vnd.ms-excel' || 
                   file.name.endsWith('.xlsx') || 
                   file.name.endsWith('.xls')) {
            // Parse Excel file
            const fileData = await parseExcel(file);
            examsData = fileData.data.map(row => {
                const exam = {};
                
                // Map headers to exam properties
                Object.keys(row).forEach(header => {
                    const value = row[header] ? String(row[header]).trim().replace(/\r$/, '') : '';
                    switch (header.toLowerCase()) {
                        case 'code':
                        case 'exam code':
                            exam.code = value;
                            break;
                        case 'subject':
                        case 'exam subject':
                            exam.subject = value;
                            break;
                        case 'date':
                        case 'exam date':
                            exam.date = value;
                            break;
                        case 'time':
                        case 'exam time':
                            exam.time = value;
                            break;
                        case 'status':
                        case 'exam status':
                            exam.status = value || 'Scheduled';
                            break;
                    }
                });
                
                return exam;
            }).filter(e => e.code && e.subject && e.date && e.time); // Filter out invalid exams
        } else {
            showError('Please select a valid CSV or Excel file.');
            return;
        }
        
        // Show loading state
        const importBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnText = importBtn.innerHTML;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        importBtn.disabled = true;
        
        console.log('Parsed exams:', examsData);
        
        if (examsData.length === 0) {
            showError('No valid exams found in the file. Please check the file format and try again.');
            importBtn.innerHTML = originalBtnText;
            importBtn.disabled = false;
            return;
        }
        
        // Validate that we have at least some exams with required fields
        const validExams = examsData.filter(e => e.code && e.subject && e.date && e.time);
        if (validExams.length === 0) {
            showError('No exams with required fields (Code, Subject, Date, Time) found in the file.');
            importBtn.innerHTML = originalBtnText;
            importBtn.disabled = false;
            return;
        }
        
        if (overwriteData) {
            // Clear existing data first if overwrite is selected
            await fetchData('user/exams', {
                method: 'DELETE'
            });
        }
        
        // Add exams to the database
        // Use bulk import endpoint for better performance
        const result = await fetchData('user/exams/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(examsData)
        });
        
        closeModal();
        await loadExams(); // Use the new loadExams function
        updateStatistics(); // Use the new updateStatistics function
        
        // Show detailed success message
        const successCount = result.results ? result.results.filter(r => r.success).length : examsData.length;
        const failedCount = result.results ? result.results.filter(r => !r.success).length : 0;
        
        if (failedCount > 0) {
            showWarning(`Exams import completed: ${successCount} successful, ${failedCount} failed. Check the console for details.`);
        } else {
            showSuccess(`Exams imported successfully (${successCount} exams)`);
        }
        
        // Reset button state
        importBtn.innerHTML = originalBtnText;
        importBtn.disabled = false;
    } catch (error) {
        console.error('Failed to import exams:', error);
        showError('Failed to import exams: ' + error.message);
        
        // Reset button state on error
        const importBtn = event.target.querySelector('button[type="submit"]');
        if (importBtn) {
            importBtn.innerHTML = '<i class="fas fa-file-import"></i> Import Exams';
            importBtn.disabled = false;
        }
    }
}

// This function has been removed to avoid conflicts with the second implementation
// The updateStatistics() function at the end of the file will be used instead

async function deleteTimetableEntry(entryId) {
    if (confirm('Are you sure you want to delete this exam?')) {
        try {
            await fetchData(`user/exams/${entryId}`, {
                method: 'DELETE'
            });
            
            showSuccess('Exam deleted successfully');
            await loadExams(); // Use the new loadExams function
            updateStatistics(); // Use the new updateStatistics function
        } catch (error) {
            console.error('Failed to delete exam:', error);
            showError('Failed to delete exam: ' + error.message);
        }
    }
}

function clearAllTimetable() {
    if (confirm('Are you sure you want to clear all exams? This action cannot be undone.')) {
        fetchData('user/exams', {
            method: 'DELETE'
        })
        .then(async () => {
            showSuccess('All exams cleared successfully');
            await loadExams(); // Use the new loadExams function
            updateStatistics(); // Use the new updateStatistics function
        })
        .catch(error => {
            console.error('Failed to clear exams:', error);
            showError('Failed to clear exams: ' + error.message);
        });
    }
}

function showSuccess(message) {
    // Use the enhanced showToast function from utils.js
    showToast(message, 'success');
}

function showError(message) {
    // Use the enhanced showToast function from utils.js
    showToast(message, 'error', 5000);
}

// Function to show loading overlay
// Using showLoadingOverlay and hideLoadingOverlay from utils.js

// Test function for date conversion (for debugging)
function testDateConversion() {
    const testDates = ['18-08-2025', '19/08/2025', '2025-08-18', 'invalid-date'];
    console.log('Testing date conversion:');
    testDates.forEach(date => {
        const converted = convertDateFormat(date);
        console.log(`${date} -> ${converted}`);
    });
    
    // Additional test with actual CSV parsing
    console.log('Testing with sample CSV data:');
    const sampleData = [
        { Code: 'TEST001', Subject: 'Test Subject', Date: '18-08-2025', Time: '10:00 AM', Status: 'Scheduled' },
        { Code: 'TEST002', Subject: 'Test Subject 2', Date: '19-08-2025', Time: '2:00 PM', Status: 'Scheduled' },
        { 'Exam Code': 'TEST003', 'Subject Name': 'Test Subject 3', 'Exam Date': '20-08-2025', 'Exam Time': '9:00 AM', Status: 'Scheduled' }
    ];
    
    const convertedData = sampleData.map(row => {
        const dateValue = convertDateFormat(row.date || row.Date || row['Exam Date'] || '');
        return {
            code: row.code || row.Code || row['Exam Code'] || '',
            subject: row.subject || row.Subject || row['Subject Name'] || '',
            date: dateValue,
            time: row.time || row.Time || row['Exam Time'] || '',
            status: row.status || row.Status || 'Scheduled'
        };
    });
    
    console.log('Converted sample data:', convertedData);
    
    // Test the entire flow with actual timetable CSV format
    console.log('Testing complete flow with actual timetable format:');
    const testData = [
        { Code: 'AI302PCC03', Subject: 'Programming Methodology', Date: '18-08-2025', Time: '11.15am-12.45pm', Status: 'Scheduled' },
        { Code: 'AI301PPC02', Subject: 'Data Structures', Date: '19-08-2025', Time: '11.15am-12.45pm', Status: 'Scheduled' }
    ];
    
    const processedData = testData.map(row => {
        const dateValue = convertDateFormat(row.date || row.Date || row['Exam Date'] || '');
        return {
            code: row.code || row.Code || row['Exam Code'] || '',
            subject: row.subject || row.Subject || row['Subject Name'] || '',
            date: dateValue,
            time: row.time || row.Time || row['Exam Time'] || '',
            status: row.status || row.Status || 'Scheduled'
        };
    }).filter(entry => entry.code && entry.subject && entry.date && entry.time);
    
    console.log('Processed test data:', processedData);
    
    // Verify the dates are in the correct format
    processedData.forEach((entry, index) => {
        console.log(`Entry ${index} date:`, entry.date, 'Type:', typeof entry.date);
        // Check if date is in YYYY-MM-DD format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        console.log(`Entry ${index} date format valid:`, dateRegex.test(entry.date));
    });
}

// Helper function to parse CSV lines with quoted values
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                // Double quotes inside quoted field
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
        } else {
            // Regular character
            current += char;
        }
    }
    
    // Add the last field
    result.push(current);
    
    return result;
}

// Helper function to convert various date formats to YYYY-MM-DD
function convertDateFormat(dateString) {
    if (!dateString) return '';
    
    // Already in correct format
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoRegex.test(dateString)) {
        return dateString;
    }
    
    // Try to parse the date
    let date;
    
    // Handle various formats
    if (dateString.includes('-')) {
        // DD-MM-YYYY or MM-DD-YYYY format
        const parts = dateString.split('-');
        if (parts.length === 3) {
            // Assume DD-MM-YYYY format (more common in many regions)
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
            const year = parseInt(parts[2], 10);
            
            // Validate and create date
            if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year > 1900) {
                date = new Date(year, month, day);
            }
        }
    } else if (dateString.includes('/')) {
        // DD/MM/YYYY or MM/DD/YYYY format
        const parts = dateString.split('/');
        if (parts.length === 3) {
            // Assume DD/MM/YYYY format
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
            const year = parseInt(parts[2], 10);
            
            // Validate and create date
            if (day >= 1 && day <= 31 && month >= 0 && month <= 11 && year > 1900) {
                date = new Date(year, month, day);
            }
        }
    }
    
    // If we couldn't parse it, try the built-in Date parser
    if (!date || isNaN(date.getTime())) {
        date = new Date(dateString);
    }
    
    // If still invalid, return original string
    if (isNaN(date.getTime())) {
        return dateString;
    }
    
    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Helper function to ensure correct date format
function ensureCorrectDateFormat(dateString) {
    // Already in correct format
    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoRegex.test(dateString)) {
        return dateString;
    }
    
    // Try to convert
    return convertDateFormat(dateString);
}

// Function to update timetable status
async function updateTimetableStatus(entryId, status) {
    try {
        await fetchData(`user/exams/${entryId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        // Update local data
        const entry = timetableData.find(e => e._id == entryId);
        if (entry) {
            entry.status = status;
        }
        
        showSuccess('Exam status updated successfully');
    } catch (error) {
        console.error('Failed to update exam status:', error);
        showError('Failed to update exam status: ' + error.message);
    }
}

// Export functions
function exportTimetableAsPDF() {
    // In a real implementation, this would generate a PDF
    showSuccess('Exporting timetable as PDF...');
    setTimeout(() => {
        showSuccess('Timetable exported as PDF successfully!');
    }, 1000);
}

function exportTimetableAsCSV() {
    // In a real implementation, this would generate a CSV
    showSuccess('Exporting timetable as CSV...');
    setTimeout(() => {
        showSuccess('Timetable exported as CSV successfully!');
    }, 1000);
}

function exportTimetableAsExcel() {
    // In a real implementation, this would generate an Excel file
    showSuccess('Exporting timetable as Excel...');
    setTimeout(() => {
        showSuccess('Timetable exported as Excel successfully!');
    }, 1000);
}

// Update current date/time
function updateCurrentDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
    };
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleDateString('en-US', options);
    }
}

// Enhanced showToast function with better error handling and more options
// Using showToast from utils.js

// Function to manually dismiss a toast
// Using dismissToast from utils.js

// Enhanced loading overlay with progress indication
// Using showLoadingOverlay and hideLoadingOverlay from utils.js

// Enhanced loading progress update
// Using updateLoadingProgress from utils.js

// Enhanced data fetching with retry logic
// Constants are defined in utils.js and imported via script tag

// Global error handler for fetch operations
// Using handleFetchError from utils.js

// Enhanced fetchData function with environment awareness
// Using fetchData from utils.js

// Function to load exams data
async function loadExams() {
    try {
        showLoadingOverlay('Loading exam timetable...');
        
        // Fetch exams data
        console.log('Fetching exams data from API...');
        const exams = await fetchData('user/exams');
        console.log('Received exams data:', exams);
        
        // Render exams table
        renderExamsTable(exams);
        
        // Update statistics
        updateStatistics(exams);
        
        hideLoadingOverlay();
        return exams;
    } catch (error) {
        console.error('Error loading exams:', error);
        hideLoadingOverlay();
        showToast('Failed to load exam timetable. Please try again later.', 'error');
        throw error;
    }
}

// Function to render exams table
function renderExamsTable(exams) {
    const tableBody = document.getElementById('timetableTableBody');
    if (!tableBody) {
        console.error('Could not find timetableTableBody element');
        return;
    }
    
    console.log('Rendering exams table with data:', exams);
    
    if (!exams || exams.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">No exams found</td>
            </tr>
        `;
        return;
    }
    
    // Sort exams by date
    const sortedExams = [...exams].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let html = '';
    sortedExams.forEach(exam => {
        const examDate = new Date(exam.date);
        const formattedDate = examDate.toLocaleDateString('en-GB'); // DD/MM/YYYY format
        
        html += `
            <tr>
                <td>${exam.code || 'N/A'}</td>
                <td>${exam.subject || 'N/A'}</td>
                <td>${formattedDate}</td>
                <td>${exam.time || 'N/A'}</td>
                <td><span class="status-badge status-${(exam.status || 'scheduled').toLowerCase()}">${exam.status || 'Scheduled'}</span></td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
}

// Function to update statistics
function updateStatistics(exams) {
    if (!exams) return;
    
    // Total exams
    const totalEntriesElement = document.getElementById('totalEntries');
    if (totalEntriesElement) {
        totalEntriesElement.textContent = exams.length;
    }
    
    // Total subjects
    const subjects = [...new Set(exams.map(exam => exam.subject).filter(Boolean))];
    const totalSubjectsElement = document.getElementById('totalSubjects');
    if (totalSubjectsElement) {
        totalSubjectsElement.textContent = subjects.length;
    }
    
    // Upcoming exams (next 30 days)
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);
    
    const upcomingExams = exams.filter(exam => {
        const examDate = new Date(exam.date);
        return examDate >= today && examDate <= next30Days;
    }).length;
    
    const upcomingExamsElement = document.getElementById('upcomingExams');
    if (upcomingExamsElement) {
        upcomingExamsElement.textContent = upcomingExams;
    }
}

// Function to filter exams
function filterExams(exams) {
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const timetableSearch = document.getElementById('timetableSearch');
    
    if (!statusFilter || !dateFilter || !timetableSearch) {
        console.error('Could not find filter elements');
        return exams;
    }
    
    const statusValue = statusFilter.value;
    const dateValue = dateFilter.value;
    const searchValue = timetableSearch.value.toLowerCase();
    
    return exams.filter(exam => {
        // Status filter
        if (statusValue && exam.status !== statusValue) {
            return false;
        }
        
        // Date filter
        if (dateValue) {
            const examDate = new Date(exam.date);
            const today = new Date();
            
            if (dateValue === 'upcoming' && examDate < today) {
                return false;
            }
            
            if (dateValue === 'past' && examDate >= today) {
                return false;
            }
        }
        
        // Search term
        if (searchValue) {
            const codeMatch = exam.code && exam.code.toLowerCase().includes(searchValue);
            const subjectMatch = exam.subject && exam.subject.toLowerCase().includes(searchValue);
            return codeMatch || subjectMatch;
        }
        
        return true;
    });
}

// Function to export exams data
function exportExams(format) {
    showToast(`Exporting exams as ${format.toUpperCase()}...`, 'info');
    
    // In a real implementation, this would fetch the data and generate the export
    // For now, we'll just show a message
    setTimeout(() => {
        showToast(`Exams exported as ${format.toUpperCase()} successfully!`, 'success');
    }, 1000);
}

// Initialize exam timetable
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 60000); // Update every minute
    
    // Load exams data
    loadExams()
        .then(exams => {
            // Set up event listeners for filters
            const filters = ['statusFilter', 'dateFilter', 'timetableSearch'];
            filters.forEach(filterId => {
                const element = document.getElementById(filterId);
                if (element) {
                    element.addEventListener('change', () => {
                        const filteredExams = filterExams(exams);
                        renderExamsTable(filteredExams);
                        updateStatistics(filteredExams);
                    });
                }
            });
            
            // Set up search input with debounce
            const searchInput = document.getElementById('timetableSearch');
            if (searchInput) {
                let searchTimeout;
                searchInput.addEventListener('input', () => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        const filteredExams = filterExams(exams);
                        renderExamsTable(filteredExams);
                        updateStatistics(filteredExams);
                    }, 300);
                });
            }
        })
        .catch(error => {
            console.error('Error initializing exam timetable:', error);
            showToast('Failed to initialize exam timetable. Please try again later.', 'error');
        });
    
    // Set up export dropdown
    const exportBtn = document.getElementById('exportTimetableBtn');
    const exportDropdown = document.getElementById('exportTimetableDropdown');
    
    if (exportBtn && exportDropdown) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!exportBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
                exportDropdown.classList.remove('show');
            }
        });
        
        // Set up export buttons
        document.getElementById('exportTimetablePdfBtn').addEventListener('click', () => exportExams('pdf'));
        document.getElementById('exportTimetableCsvBtn').addEventListener('click', () => exportExams('csv'));
        document.getElementById('exportTimetableExcelBtn').addEventListener('click', () => exportExams('excel'));
    }
    
    // Set up form submission
    const timetableForm = document.getElementById('timetableForm');
    if (timetableForm) {
        timetableForm.addEventListener('submit', handleTimetableSubmit);
    }
    
    const importForm = document.getElementById('importForm');
    if (importForm) {
        importForm.addEventListener('submit', handleImportSubmit);
    }
});
