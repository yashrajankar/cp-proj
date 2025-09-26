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

// Add pagination variables
let timetableData = [];
let currentSearchTerm = '';
let currentPage = 1;
let pageSize = 25;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    // Run test for debugging
    testDateConversion();
    
    initializeTimetable();
});

async function initializeTimetable() {
    setupEventListeners();
    await loadTimetableData();
    updateStats();
}

// Add a debounced search function to improve performance
let searchTimeout;
function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1; // Reset to first page when search changes
        loadTimetableData();
    }, 300); // 300ms delay
}

function setupEventListeners() {
    // Button event listeners
    const addTimetableBtn = document.getElementById('addTimetableBtn');
    if (addTimetableBtn) {
        addTimetableBtn.addEventListener('click', () => openTimetableModal());
    }
    
    const importTimetableBtn = document.getElementById('importTimetableBtn');
    if (importTimetableBtn) {
        importTimetableBtn.addEventListener('click', () => openImportModal());
    }
    
    // Enhanced export dropdown functionality
    const exportTimetableBtn = document.getElementById('exportTimetableBtn');
    const exportDropdown = document.getElementById('exportTimetableDropdown');
    const exportPdfBtn = document.getElementById('exportTimetablePdfBtn');
    const exportCsvBtn = document.getElementById('exportTimetableCsvBtn');
    const exportExcelBtn = document.getElementById('exportTimetableExcelBtn');
    
    if (exportTimetableBtn && exportDropdown) {
        // Toggle dropdown on button click
        exportTimetableBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close any other open dropdowns first
            const openDropdowns = document.querySelectorAll('.dropdown-menu.show');
            openDropdowns.forEach(dropdown => {
                if (dropdown !== exportDropdown) {
                    dropdown.classList.remove('show');
                    dropdown.style.display = 'none';
                }
            });
            
            // Toggle current dropdown
            exportDropdown.classList.toggle('show');
            if (exportDropdown.classList.contains('show')) {
                exportDropdown.style.display = 'block';
            } else {
                exportDropdown.style.display = 'none';
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (exportDropdown.classList.contains('show') && 
                !exportTimetableBtn.contains(e.target) && 
                !exportDropdown.contains(e.target)) {
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            }
        });
        
        // Export handlers
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportTimetableAsPDF();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportTimetableAsCSV();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportTimetableAsExcel();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
    }
    
    const clearAllTimetableBtn = document.getElementById('clearAllTimetableBtn');
    if (clearAllTimetableBtn) {
        clearAllTimetableBtn.addEventListener('click', clearAllTimetable);
    }
    
    // Form submission
    const timetableForm = document.getElementById('timetableForm');
    if (timetableForm) {
        timetableForm.addEventListener('submit', handleTimetableSubmit);
    }
    
    const importForm = document.getElementById('importForm');
    if (importForm) {
        importForm.addEventListener('submit', handleImportSubmit);
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Cancel buttons
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }
    
    const cancelImportBtn = document.getElementById('cancelImportBtn');
    if (cancelImportBtn) {
        cancelImportBtn.addEventListener('click', closeModal);
    }
    
    // Filter changes
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            currentPage = 1; // Reset to first page when filter changes
            loadTimetableData();
        });
    }
    
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            currentPage = 1; // Reset to first page when filter changes
            loadTimetableData();
        });
    }
    
    // Search functionality
    const timetableSearch = document.getElementById('timetableSearch');
    if (timetableSearch) {
        timetableSearch.addEventListener('input', function(event) {
            currentSearchTerm = event.target.value;
            debouncedSearch();
        });
    }
    
    // Pagination event listeners
    const firstPageBtn = document.getElementById('firstPageBtn');
    if (firstPageBtn) {
        firstPageBtn.addEventListener('click', () => goToPage(1));
    }
    
    const prevPageBtn = document.getElementById('prevPageBtn');
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
    }
    
    const nextPageBtn = document.getElementById('nextPageBtn');
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
    }
    
    const lastPageBtn = document.getElementById('lastPageBtn');
    if (lastPageBtn) {
        lastPageBtn.addEventListener('click', () => goToPage(totalPages));
    }
    
    const pageInput = document.getElementById('pageInput');
    if (pageInput) {
        pageInput.addEventListener('change', function() {
            const page = parseInt(this.value);
            if (page >= 1 && page <= totalPages) {
                goToPage(page);
            } else {
                this.value = currentPage;
            }
        });
    }
    
    const pageSizeSelect = document.getElementById('pageSizeSelect');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            pageSize = parseInt(this.value);
            currentPage = 1; // Reset to first page when page size changes
            loadTimetableData();
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });
}

async function loadTimetableData() {
    try {
        // Show loading state
        const timetableBody = document.getElementById('timetableTableBody');
        if (timetableBody) {
            timetableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading exams...</td></tr>';
        }
        
        // Get search term
        const searchTerm = document.getElementById('timetableSearch')?.value || '';
        
        // Apply filters
        const statusFilter = document.getElementById('statusFilter')?.value;
        const dateFilter = document.getElementById('dateFilter')?.value;
        
        // Build query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (statusFilter) params.append('status', statusFilter);
        if (dateFilter) params.append('date', dateFilter);
        
        // Fetch timetable data from API with search parameters
        timetableData = await fetchData(`timetables?${params.toString()}`);
        
        // Apply filters on the frontend as well (for consistency)
        let filteredData = timetableData;
        
        // Apply status filter
        if (statusFilter) {
            filteredData = filteredData.filter(entry => entry.status === statusFilter);
        }
        
        // Apply date filter
        if (dateFilter) {
            const today = new Date();
            if (dateFilter === 'upcoming') {
                filteredData = filteredData.filter(entry => new Date(entry.date) >= today);
            } else if (dateFilter === 'past') {
                filteredData = filteredData.filter(entry => new Date(entry.date) < today);
            }
        }
        
        // Calculate pagination
        totalPages = Math.ceil(filteredData.length / pageSize);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        renderTimetable(filteredData);
        updateStats();
        updatePaginationControls();
    } catch (error) {
        console.error('Failed to load exam data:', error);
        showError('Failed to load exam data: ' + error.message);
        
        // Show error in timetable
        const timetableBody = document.getElementById('timetableTableBody');
        if (timetableBody) {
            timetableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Failed to load exam data</td></tr>';
        }
    }
}

function renderTimetable(data) {
    const timetableBody = document.getElementById('timetableTableBody');
    if (!timetableBody) return;
    
    // Calculate pagination indices
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, data.length);
    const paginatedData = data.slice(startIndex, endIndex);
    
    if (paginatedData.length === 0) {
        timetableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No exams found</td></tr>';
        return;
    }
    
    let html = '';
    
    // Sort by date
    paginatedData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    paginatedData.forEach(entry => {
        html += `
            <tr>
                <td>${entry.code}</td>
                <td>${entry.subject}</td>
                <td>${formatDate(entry.date)}</td>
                <td>${entry.time}</td>
                <td>
                    <select class="status-select" data-id="${entry._id}">
                        <option value="Scheduled" ${entry.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
                        <option value="Completed" ${entry.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        <option value="Cancelled" ${entry.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-btn" data-id="${entry._id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-btn" data-id="${entry._id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    timetableBody.innerHTML = html;
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            openTimetableModal(button.dataset.id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => {
            deleteTimetableEntry(button.dataset.id);
        });
    });
    
    // Add event listeners for status select changes
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
            updateTimetableStatus(this.dataset.id, this.value);
        });
    });
    
    // Update pagination info
    updatePaginationInfo(data.length);
}

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
            await fetchData(`timetables/${entryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entryData)
            });
        } else {
            // Add new entry
            await fetchData('timetables', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entryData)
            });
        }
        
        closeModal();
        await loadTimetableData();
        updateStats();
        
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

async function handleImportSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const file = formData.get('csvFile');
        // Fix checkbox handling - it returns "on" when checked, null when unchecked
        const overwriteData = formData.get('overwriteData') === 'on';
        
        if (!file) {
            showError('No file selected. Please choose a CSV file to import.');
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
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            showError('Please select a valid CSV file.');
            return;
        }
        
        // Show loading state
        const importBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnText = importBtn.innerHTML;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        importBtn.disabled = true;
        
        // Parse CSV file
        const parsedData = await parseCSVFile(file);
        console.log('Parsed timetable entries:', parsedData);
        
        if (parsedData.length === 0) {
            showError('No valid timetable entries found in the file. Please check that your CSV file contains the required columns: Code, Subject, Date, Time, and Status.');
            importBtn.innerHTML = originalBtnText;
            importBtn.disabled = false;
            return;
        }
        
        // Import data using the standardized import endpoint
        const requestData = { data: parsedData, overwrite: overwriteData };
        console.log('Request data being sent to server:', JSON.stringify(requestData, null, 2));
        
        const response = await fetchData('import/timetables', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        console.log('Server response:', response);
        
        closeModal();
        await loadTimetableData();
        updateStats();
        
        // Show detailed success message
        const successCount = response.results ? response.results.filter(r => r.success).length : parsedData.length;
        const failedCount = response.results ? response.results.filter(r => !r.success).length : 0;
        
        if (failedCount > 0) {
            showWarning(`Timetable import completed: ${successCount} successful, ${failedCount} failed. Check the console for details.`);
        } else {
            showSuccess(`Timetable imported successfully (${successCount} entries)`);
        }
        
        // Reset button state
        importBtn.innerHTML = originalBtnText;
        importBtn.disabled = false;
    } catch (error) {
        console.error('Failed to import timetable:', error);
        showError('Failed to import timetable: ' + error.message);
        
        // Reset button state on error
        const importBtn = event.target.querySelector('button[type="submit"]');
        if (importBtn) {
            importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Data';
            importBtn.disabled = false;
        }
    }
}

async function parseCSVFile(file) {
    try {
        const { data, headers } = await parseCSV(file);
        
        console.log('Raw CSV data:', data);
        console.log('CSV headers:', headers);
        
        // Validate and filter timetable entries
        const timetableEntries = data.map((row, index) => {
            console.log(`Processing row ${index}:`, row);
            
            // Convert date format - make sure we're getting the right field and converting properly
            const rawDate = row.date || row.Date || row['Exam Date'] || '';
            console.log(`Raw date for row ${index}:`, rawDate);
            
            // Use a more robust date conversion function
            const dateValue = convertToISODate(rawDate);
            console.log(`Converted date for row ${index}:`, dateValue);
            
            const entry = {
                code: row.code || row.Code || row['Exam Code'] || '',
                subject: row.subject || row.Subject || row['Subject Name'] || '',
                date: dateValue,
                time: row.time || row.Time || row['Exam Time'] || '',
                status: row.status || row.Status || 'Scheduled'
            };
            
            console.log(`Final entry for row ${index}:`, entry);
            return entry;
        }).filter((entry, index) => {
            const isValid = entry.code && entry.subject && entry.date && entry.time;
            console.log(`Entry ${index} is valid:`, isValid, 'Entry:', entry);
            return isValid;
        });
        
        console.log('Final parsed timetable entries:', timetableEntries);
        
        // Double-check the dates in the final entries
        timetableEntries.forEach((entry, index) => {
            console.log(`Final entry ${index} date:`, entry.date);
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            console.log(`Final entry ${index} date format is correct:`, dateRegex.test(entry.date));
        });
        
        return timetableEntries;
    } catch (error) {
        console.error('Error in parseCSVFile:', error);
        throw new Error(`Failed to parse timetable CSV: ${error.message}`);
    }
}

// More robust date conversion function
function convertToISODate(dateStr) {
    if (!dateStr) return '';
    
    // Trim whitespace
    dateStr = dateStr.trim();
    
    // Check if already in correct format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    
    // Handle DD-MM-YYYY or DD/MM/YYYY formats
    const separators = ['-', '/'];
    for (const separator of separators) {
        if (dateStr.includes(separator)) {
            const parts = dateStr.split(separator);
            if (parts.length === 3) {
                const [day, month, year] = parts;
                
                // Validate that we have valid numbers
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    // Ensure day, month, and year are valid with proper padding
                    const dayNum = parseInt(day, 10);
                    const monthNum = parseInt(month, 10);
                    const yearNum = parseInt(year, 10);
                    
                    // Validate ranges
                    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
                        // Format as YYYY-MM-DD with zero-padding
                        return `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                    }
                }
            }
        }
    }
    
    // If we can't parse it, try to parse as a Date object and format it correctly
    const dateObj = new Date(dateStr);
    if (dateObj instanceof Date && !isNaN(dateObj)) {
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // If all else fails, return as is
    return dateStr;
}

// Export timetable to CSV (deprecated - keeping for backward compatibility)
// function exportTimetable() {
//     try {
//         // Generate CSV content
//         const csvContent = generateTimetableCSV();
//         
//         // Create download link with timestamp
//         const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
//         const filename = `timetable_export_${timestamp}.csv`;
//         
//         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.setAttribute('href', url);
//         link.setAttribute('download', filename);
//         link.style.visibility = 'hidden';
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         
//         showSuccess('Timetable exported successfully');
//     } catch (error) {
//         console.error('Failed to export timetable:', error);
//         showError('Failed to export timetable: ' + error.message);
//     }
// }

function generateTimetableCSV() {
    // Prepare data for CSV with better formatting
    const csvData = timetableData.map(entry => ({
        "Exam Code": entry.code,
        "Subject": entry.subject,
        "Date": entry.date,
        "Time": entry.time,
        "Status": entry.status,
        "ID": entry._id
    }));
    
    // Use the enhanced CSV generator from utils.js
    return generateCSV(csvData, ['Exam Code', 'Subject', 'Date', 'Time', 'Status', 'ID']);
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function updateStats() {
    try {
        // Fetch actual stats from API
        const timetables = await fetchData('timetables');
        
        document.getElementById('totalEntries').textContent = timetables.length;
        
        // Calculate subjects
        const subjects = new Set(timetables.map(t => t.subject));
        document.getElementById('totalSubjects').textContent = subjects.size;
        
        // Calculate upcoming exams
        const today = new Date();
        const upcomingExams = timetables.filter(t => new Date(t.date) >= today).length;
        document.getElementById('upcomingExams').textContent = upcomingExams;
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

async function deleteTimetableEntry(entryId) {
    if (confirm('Are you sure you want to delete this exam?')) {
        try {
            await fetchData(`timetables/${entryId}`, {
                method: 'DELETE'
            });
            
            showSuccess('Exam deleted successfully');
            await loadTimetableData();
            updateStats();
        } catch (error) {
            console.error('Failed to delete exam:', error);
            showError('Failed to delete exam: ' + error.message);
        }
    }
}

function clearAllTimetable() {
    if (confirm('Are you sure you want to clear all exams? This action cannot be undone.')) {
        fetchData('timetables', {
            method: 'DELETE'
        })
        .then(() => {
            showSuccess('All exams cleared successfully');
            loadTimetableData();
            updateStats();
        })
        .catch(error => {
            console.error('Failed to clear exams:', error);
            showError('Failed to clear exams: ' + error.message);
        });
    }
}

function showSuccess(message) {
    // Use the enhanced showToast function from utils.js
    if (typeof showToast === 'function') {
        showToast(message, 'success');
    } else {
        // Fallback to custom implementation
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            border: 1px solid #c3e6cb;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

function showError(message) {
    // Use the enhanced showToast function from utils.js
    if (typeof showToast === 'function') {
        showToast(message, 'error', 5000);
    } else {
        // Fallback to custom implementation
        const toast = document.createElement('div');
        toast.className = 'toast error';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            color: #721c24;
            padding: 15px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            border: 1px solid #f5c6cb;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Function to show loading overlay
function showLoadingOverlay(message = 'Loading...') {
    // Remove any existing overlay
    hideLoadingOverlay();
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'importLoadingOverlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

// Function to hide loading overlay
function hideLoadingOverlay() {
    const overlay = document.getElementById('importLoadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

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
        console.log(`Entry ${index} date format is correct:`, dateRegex.test(entry.date));
    });
    
    // Test with the exact data from the error message
    console.log('Testing with exact error data:');
    const errorData = [
        { code: 'AI302PCC03', subject: 'Programming Methodology', date: '18-08-2025', time: '11.15am-12.45pm', status: 'Scheduled' },
        { code: 'AI301PPC02', subject: 'Data Structures', date: '19-08-2025', time: '11.15am-12.45pm', status: 'Scheduled' }
    ];
    
    const processedErrorData = errorData.map(row => {
        const dateValue = convertDateFormat(row.date || row.Date || row['Exam Date'] || '');
        return {
            code: row.code || row.Code || row['Exam Code'] || '',
            subject: row.subject || row.Subject || row['Subject Name'] || '',
            date: dateValue,
            time: row.time || row.Time || row['Exam Time'] || '',
            status: row.status || row.Status || 'Scheduled'
        };
    }).filter(entry => entry.code && entry.subject && entry.date && entry.time);
    
    console.log('Processed error data:', processedErrorData);
    
    // Test the enhanced date conversion function
    console.log('Testing enhanced date conversion function:');
    const enhancedTestData = ['18-08-2025', '19/08/2025', '2025-08-18'];
    enhancedTestData.forEach(date => {
        const result = ensureCorrectDateFormat(date);
        console.log(`${date} -> ${result}`);
    });
}

// Function to convert date format from DD-MM-YYYY or DD/MM/YYYY to YYYY-MM-DD
function convertDateFormat(dateStr) {
    console.log('Converting date:', dateStr);
    
    if (!dateStr) {
        console.log('Date is empty, returning as is');
        return dateStr;
    }
    
    // Trim whitespace
    dateStr = dateStr.trim();
    
    // Check if already in correct format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        console.log('Date already in correct format, returning as is');
        return dateStr;
    }
    
    // Handle DD-MM-YYYY or DD/MM/YYYY formats
    const separators = ['-', '/'];
    for (const separator of separators) {
        if (dateStr.includes(separator)) {
            const parts = dateStr.split(separator);
            if (parts.length === 3) {
                const [day, month, year] = parts;
                console.log('Parsing date parts:', { day, month, year });
                
                // Validate that we have valid numbers
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    // Ensure day, month, and year are valid
                    const dayNum = parseInt(day, 10);
                    const monthNum = parseInt(month, 10);
                    const yearNum = parseInt(year, 10);
                    
                    console.log('Parsed numbers:', { dayNum, monthNum, yearNum });
                    
                    // Validate ranges (more permissive validation)
                    if (dayNum >= 1 && dayNum <= 31 && monthNum >= 1 && monthNum <= 12 && yearNum >= 1900 && yearNum <= 2100) {
                        // Format as YYYY-MM-DD with zero-padding
                        // For DD-MM-YYYY format, we need to rearrange to YYYY-MM-DD
                        const result = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                        console.log('Converted date result:', result);
                        return result;
                    } else {
                        console.log('Date values out of valid ranges');
                    }
                } else {
                    console.log('Date parts are not valid numbers');
                }
            } else {
                console.log('Date does not have 3 parts');
            }
        }
    }
    
    // If we can't parse it, try to parse as a Date object and format it correctly
    console.log('Trying to parse as Date object');
    const dateObj = new Date(dateStr);
    if (dateObj instanceof Date && !isNaN(dateObj)) {
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        console.log('Parsed from Date object:', result);
        return result;
    }
    
    // If we can't parse it, return as is
    console.log('Could not parse date, returning as is');
    return dateStr;
}

// Enhanced function to ensure date is always in correct format
function ensureCorrectDateFormat(dateStr) {
    console.log('Ensuring correct date format for:', dateStr);
    
    // Handle empty or null dates
    if (!dateStr) {
        console.log('Date is empty, returning as is');
        return dateStr;
    }
    
    // First convert the date using our conversion function
    const convertedDate = convertDateFormat(dateStr);
    console.log('After convertDateFormat:', convertedDate);
    
    // Double-check that it's in the correct format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(convertedDate)) {
        console.log('Date is in correct format');
        return convertedDate;
    } else {
        console.log('Date is not in correct format, trying alternative parsing');
        
        // Try to parse it as a date and format it correctly
        try {
            // Handle DD-MM-YYYY format specifically
            if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateStr)) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    const [day, month, year] = parts;
                    const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    console.log('Alternative parsing result:', result);
                    return result;
                }
            }
            
            // Handle DD/MM/YYYY format specifically
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    const [day, month, year] = parts;
                    const result = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    console.log('Alternative parsing result:', result);
                    return result;
                }
            }
            
            // Try parsing as a Date object as a last resort
            console.log('Trying to parse as Date object as last resort');
            const dateObj = new Date(dateStr);
            if (dateObj instanceof Date && !isNaN(dateObj)) {
                const year = dateObj.getFullYear();
                const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                const day = dateObj.getDate().toString().padStart(2, '0');
                const result = `${year}-${month}-${day}`;
                console.log('Parsed from Date object as last resort:', result);
                return result;
            }
        } catch (error) {
            console.log('Error in alternative parsing:', error);
        }
    }
    
    // If all else fails, return the converted date
    console.log('Returning converted date as fallback');
    return convertedDate;
}

// Export timetable to PDF
async function exportTimetableAsPDF() {
    try {
        showLoadingOverlay('Exporting timetable as PDF...');
        
        // Ensure we have the latest data
        if (timetableData.length === 0) {
            await loadTimetableData();
        }
        
        // Prepare data for export
        const headers = ['Exam Code', 'Subject', 'Date', 'Time', 'Status'];
        const data = timetableData.map(entry => [
            entry.code || '',
            entry.subject || '',
            entry.date || '',
            entry.time || '',
            entry.status || ''
        ]);
        
        const metadata = {
            'Total Exams': timetableData.length,
            'Export Format': 'PDF'
        };
        
        // Export using the standardized utility
        // Note: exportToPDF now works asynchronously with callbacks
        exportToPDF({
            title: 'Exam Management Report',
            headers,
            data,
            filename: `timetable_export_${new Date().toISOString().slice(0, 10)}.pdf`,
            metadata
        });
        
        // Don't hide the loading overlay here since exportToPDF is asynchronous
        // The overlay and success message will be handled by the callback in exportToPDF
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export timetable as PDF:', error);
        showError('Failed to export timetable as PDF: ' + error.message);
    }
}

// Export timetable to Excel
async function exportTimetableAsExcel() {
    try {
        showLoadingOverlay('Exporting timetable as Excel...');
        
        // Ensure we have the latest data
        if (timetableData.length === 0) {
            await loadTimetableData();
        }
        
        // Prepare data for export
        const headers = ['Exam Code', 'Subject', 'Date', 'Time', 'Status'];
        const data = timetableData.map(entry => [
            entry.code || '',
            entry.subject || '',
            entry.date || '',
            entry.time || '',
            entry.status || ''
        ]);
        
        const metadata = {
            'Total Exams': timetableData.length,
            'Export Format': 'Excel'
        };
        
        // Export using the standardized utility
        const success = exportToExcel({
            title: 'Exam Management Report',
            headers,
            data,
            filename: `timetable_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showSuccess('Timetable exported as Excel successfully');
        } else {
            showError('Failed to export timetable as Excel');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export timetable as Excel:', error);
        showError('Failed to export timetable as Excel: ' + error.message);
    }
}

// Export timetable to CSV
async function exportTimetableAsCSV() {
    try {
        showLoadingOverlay('Exporting timetable as CSV...');
        
        // Ensure we have the latest data
        if (timetableData.length === 0) {
            await loadTimetableData();
        }
        
        // Prepare data for export
        const headers = ['Exam Code', 'Subject', 'Date', 'Time', 'Status'];
        const data = timetableData.map(entry => [
            entry.code || '',
            entry.subject || '',
            entry.date || '',
            entry.time || '',
            entry.status || ''
        ]);
        
        const metadata = {
            'Total Exams': timetableData.length,
            'Export Format': 'CSV'
        };
        
        // Export using the standardized utility
        const success = exportToCSV({
            title: 'Exam Management Report',
            headers,
            data,
            filename: `timetable_export_${new Date().toISOString().slice(0, 10)}.csv`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showSuccess('Timetable exported as CSV successfully');
        } else {
            showError('Failed to export timetable as CSV');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export timetable as CSV:', error);
        showError('Failed to export timetable as CSV: ' + error.message);
    }
}
