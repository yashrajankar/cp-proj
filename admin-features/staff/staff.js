// Staff Management JavaScript

let staffData = [];
let currentPage = 1; // Track current page
let pageSize = 25; // Default page size
let totalPages = 1; // Track total pages

// DOM Elements
const staffTableBody = document.getElementById('staffTableBody');
const staffForm = document.getElementById('staffForm');
const staffModal = document.getElementById('staffModal');
const importModal = document.getElementById('importModal');
const staffSearch = document.getElementById('staffSearch');

// Buttons
const addStaffBtn = document.getElementById('addStaffBtn');
const importStaffBtn = document.getElementById('importStaffBtn');
const exportStaffBtn = document.getElementById('exportStaffBtn');
const clearAllStaffBtn = document.getElementById('clearAllStaffBtn');

// Modal Elements
const modalTitle = document.getElementById('modalTitle');
const staffIdInput = document.getElementById('staffId');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const departmentInput = document.getElementById('department');
const availabilityInput = document.getElementById('availability');
const isActiveInput = document.getElementById('isActive');

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing staff management');
    initializeStaffManagement();
});

async function initializeStaffManagement() {
    console.log('Setting up staff management');
    setupEventListeners();
    await loadStaffData();
    updateStats();
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
}

function setupEventListeners() {
    console.log('Setting up event listeners');
    
    // Existing event listeners
    document.getElementById('addStaffBtn')?.addEventListener('click', openAddStaffModal);
    document.getElementById('importStaffBtn')?.addEventListener('click', openImportModal);
    document.getElementById('clearAllStaffBtn')?.addEventListener('click', clearAllStaff);
    document.getElementById('staffSearch')?.addEventListener('input', debouncedSearch);
    
    // Export dropdown functionality
    const exportDropdown = document.getElementById('exportStaffDropdown');
    const exportPdfBtn = document.getElementById('exportStaffPdfBtn');
    const exportCsvBtn = document.getElementById('exportStaffCsvBtn');
    const exportExcelBtn = document.getElementById('exportStaffExcelBtn');
    
    console.log('Export elements:', { exportStaffBtn, exportDropdown, exportPdfBtn, exportCsvBtn, exportExcelBtn });
    
    if (exportStaffBtn && exportDropdown) {
        console.log('Setting up export dropdown event listeners');
        
        // Toggle dropdown on button click
        exportStaffBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Export button clicked');
            
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
                console.log('Dropdown shown');
            } else {
                exportDropdown.style.display = 'none';
                console.log('Dropdown hidden');
            }
            console.log('Dropdown class after toggle:', exportDropdown.className);
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (exportDropdown.classList.contains('show') && 
                !exportStaffBtn.contains(e.target) && 
                !exportDropdown.contains(e.target)) {
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
                console.log('Dropdown closed due to outside click');
            }
        });
        
        // Export handlers
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('PDF export clicked');
                exportStaffAsPDF();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('CSV export clicked');
                exportStaffAsCSV();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Excel export clicked');
                exportStaffAsExcel();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
    } else {
        console.log('Export dropdown elements not found');
    }
    
    // Form submissions
    document.getElementById('staffForm')?.addEventListener('submit', handleStaffSubmit);
    document.getElementById('importForm')?.addEventListener('submit', handleImportSubmit);
    
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
            loadStaffData();
        });
    }
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Cancel buttons
    document.getElementById('cancelImportBtn')?.addEventListener('click', closeModal);
    
    // Download sample CSV
    document.getElementById('downloadSampleBtn')?.addEventListener('click', downloadSampleCSV);
    
    // Add event listeners for assignment section
    const assignInvigilatorsBtn = document.getElementById('assignInvigilatorsBtn');
    const saveAssignmentsBtn = document.getElementById('saveAssignmentsBtn');
    const clearAssignmentsBtn = document.getElementById('clearAssignmentsBtn');
    const viewAssignmentsBtn = document.getElementById('viewAssignmentsBtn');
    let exportAssignmentsBtn = document.getElementById('exportAssignmentsBtn');
    
    console.log('Assignment buttons:', { assignInvigilatorsBtn, saveAssignmentsBtn, clearAssignmentsBtn, viewAssignmentsBtn, exportAssignmentsBtn });
    
    // Add event listeners for assignment buttons
    if (assignInvigilatorsBtn) {
        assignInvigilatorsBtn.addEventListener('click', generateAssignments);
    } else {
        console.error('Assign invigilators button not found in DOM');
    }
    
    if (saveAssignmentsBtn) {
        saveAssignmentsBtn.addEventListener('click', saveAssignments);
        // Hide the save button initially
        saveAssignmentsBtn.style.display = 'none';
    } else {
        console.error('Save assignments button not found in DOM');
    }
    
    if (clearAssignmentsBtn) {
        clearAssignmentsBtn.addEventListener('click', clearAssignments);
    } else {
        console.error('Clear assignments button not found in DOM');
    }
    
    if (viewAssignmentsBtn) {
        viewAssignmentsBtn.addEventListener('click', viewAssignments);
    } else {
        console.error('View assignments button not found in DOM');
    }
    
    if (exportAssignmentsBtn) {
        exportAssignmentsBtn.addEventListener('click', exportAssignments);
    } else {
        console.error('Export assignments button not found in DOM');
    }
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Add keyboard shortcut for export (Ctrl+E)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            console.log('Export shortcut triggered');
            exportAssignments();
        }
    });
}

// Load Staff Data
async function loadStaffData() {
    try {
        showLoadingOverlay('Loading staff...');
        
        // Get search term
        const searchTerm = document.getElementById('staffSearch')?.value || '';
        
        // Build query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        
        // Fetch staff from API with search parameters
        staffData = await fetchData(`staff?${params.toString()}`);
        
        // Calculate pagination
        totalPages = Math.ceil(staffData.length / pageSize);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        renderStaffTable();
        updateStats();
        updatePaginationControls();
        hideLoadingOverlay();
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to load staff:', error);
        showToast('Failed to load staff: ' + error.message, 'error');
    }
}

// Render Staff Table
function renderStaffTable(filteredData = null) {
    const dataToRender = filteredData || staffData;
    
    // Calculate pagination indices
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, dataToRender.length);
    const paginatedData = dataToRender.slice(startIndex, endIndex);
    
    if (paginatedData.length === 0) {
        staffTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-user-tie" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>No staff members found</p>
                    <button class="btn btn-primary" onclick="openAddStaffModal()" style="margin-top: 1rem;">
                        <i class="fas fa-plus-circle"></i> Add Staff Member
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    staffTableBody.innerHTML = paginatedData.map(staff => `
        <tr>
            <td><i class="fas fa-user"></i> ${escapeHtml(staff.name)}</td>
            <td><i class="fas fa-building"></i> ${escapeHtml(staff.department || 'N/A')}</td>
            <td><i class="fas fa-envelope"></i> ${escapeHtml(staff.email || 'N/A')}</td>
            <td><i class="fas fa-phone"></i> ${escapeHtml(staff.phone || 'N/A')}</td>
            <td>
                <span class="status-badge status-${staff.availability === 'Yes' ? 'available' : 'unavailable'}">
                    <i class="fas fa-${staff.availability === 'Yes' ? 'check-circle' : 'times-circle'}"></i>
                    ${staff.availability === 'Yes' ? 'Available' : 'Unavailable'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-${staff.availability === 'Yes' ? 'warning' : 'success'}" onclick="toggleAvailability('${staff._id}', '${staff.availability}')">
                    <i class="fas fa-${staff.availability === 'Yes' ? 'times' : 'check'}"></i> ${staff.availability === 'Yes' ? 'Set Unavailable' : 'Set Available'}
                </button>
                <button class="btn btn-sm btn-secondary" onclick="editStaff('${staff._id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteStaff('${staff._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('');
    
    // Update pagination info
    updatePaginationInfo(dataToRender.length);
}

// Update Statistics
function updateStats() {
    const totalStaff = staffData.length;
    const availableStaff = staffData.filter(staff => staff.availability === 'Yes').length;
    const unavailableStaff = totalStaff - availableStaff;
    
    document.getElementById('totalStaff').textContent = totalStaff;
    document.getElementById('availableStaff').textContent = availableStaff;
    document.getElementById('unavailableStaff').textContent = unavailableStaff;
}

// Add a debounced search function to improve performance
let searchTimeout;
function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1; // Reset to first page when search changes
        loadStaffData();
    }, 300); // 300ms delay
}

// Pagination functions
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderStaffTable();
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
    
    paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems} staff members`;
}

// Show Loading State
function showLoadingState() {
    staffTableBody.innerHTML = `
        <tr>
            <td colspan="6" style="text-align: center; padding: 2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-600); margin-bottom: 1rem;"></i>
                <p>Loading staff data...</p>
            </td>
        </tr>
    `;
}

// Hide Loading State
function hideLoadingState() {
    // This function is intentionally left empty as the loading state is replaced by renderStaffTable
}

// Show Loading Overlay
function showLoading(message = 'Loading...') {
    showLoadingOverlay(message);
}

// Hide Loading Overlay
function hideLoading() {
    hideLoadingOverlay();
}

// Show Success Message
function showSuccess(message) {
    showToast(message, 'success');
}

// Show Error Message
function showError(message) {
    showToast(message, 'error');
}

// Show Warning Message
function showWarning(message) {
    showToast(message, 'warning');
}

// Open Add Staff Modal
function openAddStaffModal() {
    editingStaffId = null;
    modalTitle.innerHTML = '<i class="fas fa-user-tie"></i> Add Staff';
    staffForm.reset();
    staffIdInput.value = '';
    availabilityInput.value = 'Yes';
    emailInput.value = '';
    phoneInput.value = '';
    staffModal.style.display = 'block';
}

// Open Edit Staff Modal
function editStaff(id) {
    const staff = staffData.find(s => s._id == id);
    if (!staff) {
        showToast('Staff member not found', 'error');
        return;
    }
    
    editingStaffId = id;
    modalTitle.innerHTML = '<i class="fas fa-user-tie"></i> Edit Staff';
    staffIdInput.value = staff._id;
    nameInput.value = staff.name;
    emailInput.value = staff.email || '';
    phoneInput.value = staff.phone || '';
    departmentInput.value = staff.department || '';
    availabilityInput.value = staff.availability || 'Yes';
    
    staffModal.style.display = 'block';
}

// Close Modal
function closeModal() {
    staffModal.style.display = 'none';
    importModal.style.display = 'none';
    editingStaffId = null;
}

// Handle Staff Form Submission
async function handleStaffSubmit(event) {
    event.preventDefault();
    
    const staffData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        department: departmentInput.value.trim(),
        availability: availabilityInput.value
    };
    
    if (!staffData.name) {
        showToast('Please enter a name', 'error');
        return;
    }
    
    if (!staffData.email) {
        showToast('Please enter an email', 'error');
        return;
    }
    
    if (!staffData.phone) {
        showToast('Please enter a phone number', 'error');
        return;
    }
    
    if (!staffData.department) {
        showToast('Please enter a department', 'error');
        return;
    }
    
    try {
        if (editingStaffId) {
            // Update existing staff
            await fetchData(`/api/staff/${editingStaffId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(staffData)
            });
            showToast('Staff member updated successfully', 'success');
        } else {
            // Create new staff
            await fetchData('/api/staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(staffData)
            });
            showToast('Staff member added successfully', 'success');
        }
        
        closeModal();
        loadStaffData(); // Refresh the data
    } catch (error) {
        console.error('Error saving staff:', error);
        showToast(`Failed to save staff member: ${error.message}`, 'error');
    }
}

// Delete Staff
async function deleteStaff(id) {
    if (!confirm('Are you sure you want to delete this staff member?')) {
        return;
    }
    
    try {
        await fetchData(`/api/staff/${id}`, {
            method: 'DELETE'
        });
        showToast('Staff member deleted successfully', 'success');
        loadStaffData(); // Refresh the data
    } catch (error) {
        console.error('Error deleting staff:', error);
        showToast(`Failed to delete staff member: ${error.message}`, 'error');
    }
}

// Toggle Staff Availability
async function toggleAvailability(id, currentAvailability) {
    try {
        // Determine new availability status
        const newAvailability = currentAvailability === 'Yes' ? 'No' : 'Yes';
        
        // Get the current staff member data
        const staffMember = staffData.find(s => s._id == id);
        if (!staffMember) {
            showToast('Staff member not found', 'error');
            return;
        }
        
        // Prepare updated data
        const updatedData = {
            ...staffMember,
            availability: newAvailability
        };
        
        // Update the staff member
        await fetchData(`/api/staff/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });
        
        showToast(`Staff member marked as ${newAvailability === 'Yes' ? 'available' : 'unavailable'}`, 'success');
        loadStaffData(); // Refresh the data
    } catch (error) {
        console.error('Error updating staff availability:', error);
        showToast(`Failed to update availability: ${error.message}`, 'error');
    }
}

// Open Import Modal
function openImportModal() {
    importForm.reset();
    importModal.style.display = 'block';
}

// Close Import Modal
function closeImportModalFunc() {
    importModal.style.display = 'none';
}

// Parse CSV file for staff data
async function parseStaffCSVFile(file) {
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
                
                const staff = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    
                    // Handle quoted values that may contain commas
                    const values = parseCSVLine(lines[i]);
                    const staffMember = {};
                    
                    headers.forEach((header, index) => {
                        // Clean value by trimming whitespace and removing quotes and trailing carriage returns
                        const value = values[index] ? values[index].trim().replace(/["']+/g, '').replace(/\r$/, '') : '';
                        switch (header.toLowerCase()) {
                            case 'name':
                            case 'staff name':
                            case 'full name':
                                staffMember.name = value;
                                break;
                            case 'department':
                            case 'dept':
                                staffMember.department = value;
                                break;
                            case 'email':
                            case 'email address':
                                staffMember.email = value;
                                break;
                            case 'phone':
                            case 'phone number':
                            case 'mobile':
                                staffMember.phone = value;
                                break;
                            case 'availability':
                                staffMember.availability = value || 'Yes';
                                break;
                        }
                    });
                    
                    // Only add if we have required fields (name, department, email, phone)
                    if (staffMember.name && staffMember.department && staffMember.email && staffMember.phone) {
                        // Validate availability value
                        if (staffMember.availability && !['Yes', 'No'].includes(staffMember.availability)) {
                            staffMember.availability = 'Yes'; // Default to available
                        }
                        staff.push(staffMember);
                    }
                }
                
                resolve(staff);
            } catch (error) {
                reject(new Error(`Failed to parse CSV: ${error.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

// Handle staff import submission
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
        let staffData;
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            // Parse CSV file
            staffData = await parseStaffCSVFile(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.type === 'application/vnd.ms-excel' || 
                   file.name.endsWith('.xlsx') || 
                   file.name.endsWith('.xls')) {
            // Parse Excel file
            const fileData = await parseExcel(file);
            staffData = fileData.data.map(row => {
                const staffMember = {};
                
                // Map headers to staff member properties
                Object.keys(row).forEach(header => {
                    const value = row[header] ? String(row[header]).trim().replace(/\r$/, '') : '';
                    switch (header.toLowerCase()) {
                        case 'name':
                        case 'staff name':
                        case 'full name':
                            staffMember.name = value;
                            break;
                        case 'department':
                        case 'dept':
                            staffMember.department = value;
                            break;
                        case 'email':
                        case 'email address':
                            staffMember.email = value;
                            break;
                        case 'phone':
                        case 'phone number':
                        case 'mobile':
                            staffMember.phone = value;
                            break;
                        case 'availability':
                            staffMember.availability = value || 'Yes';
                            break;
                    }
                });
                
                return staffMember;
            }).filter(s => s.name && s.department && s.email && s.phone); // Filter out invalid staff members
        } else {
            showError('Please select a valid CSV or Excel file.');
            return;
        }
        
        // Show loading state
        const importBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnText = importBtn.innerHTML;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        importBtn.disabled = true;
        
        console.log('Parsed staff:', staffData);
        
        if (staffData.length === 0) {
            showError('No valid staff members found in the file. Please check the file format and try again.');
            importBtn.innerHTML = originalBtnText;
            importBtn.disabled = false;
            return;
        }
        
        // Validate that we have at least some staff with required fields
        const validStaff = staffData.filter(s => s.name && s.department && s.email && s.phone);
        if (validStaff.length === 0) {
            showError('No staff members with required fields (Name, Department, Email, Phone) found in the file.');
            importBtn.innerHTML = originalBtnText;
            importBtn.disabled = false;
            return;
        }
        
        if (overwriteData) {
            // Clear existing data first if overwrite is selected
            await fetchData('staff', {
                method: 'DELETE'
            });
        }
        
        // Add staff to the database
        // Use bulk import endpoint for better performance
        const result = await fetchData('staff/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(staffData)
        });
        
        closeModal();
        await loadStaffData();
        updateStats();
        
        // Show detailed success message
        const successCount = result.results ? result.results.filter(r => r.success).length : staffData.length;
        const failedCount = result.results ? result.results.filter(r => !r.success).length : 0;
        
        if (failedCount > 0) {
            showWarning(`Staff import completed: ${successCount} successful, ${failedCount} failed. Check the console for details.`);
        } else {
            showSuccess(`Staff imported successfully (${successCount} staff members)`);
        }
        
        // Reset button state
        importBtn.innerHTML = originalBtnText;
        importBtn.disabled = false;
    } catch (error) {
        console.error('Failed to import staff:', error);
        showError('Failed to import staff: ' + error.message);
        
        // Reset button state on error
        const importBtn = event.target.querySelector('button[type="submit"]');
        if (importBtn) {
            importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Staff';
            importBtn.disabled = false;
        }
    }
}

// Enhanced CSV parser with better error handling and data validation
async function parseCSVFile(file) {
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
                
                // Parse headers using the improved CSV parser
                const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"(.*)"$/, '$1'));
                
                const staff = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    
                    // Handle quoted values that may contain commas
                    const values = parseCSVLine(lines[i]);
                    const staffMember = {};
                    
                    headers.forEach((header, index) => {
                        // Clean value by trimming whitespace and removing quotes and trailing carriage returns
                        const value = values[index] ? values[index].trim().replace(/^"(.*)"$/, '$1').replace(/\r$/, '') : '';
                        switch (header.toLowerCase()) {
                            case 'name':
                            case 'staff name':
                            case 'full name':
                                staffMember.name = value;
                                break;
                            case 'email':
                            case 'email address':
                                staffMember.email = value;
                                break;
                            case 'phone':
                            case 'phone number':
                            case 'mobile':
                                staffMember.phone = value;
                                break;
                            case 'department':
                            case 'dept':
                                staffMember.department = value;
                                break;
                            case 'availability':
                                staffMember.availability = value || 'Yes';
                                break;
                        }
                    });
                    
                    // Only add if we have required fields (name, email, phone)
                    if (staffMember.name && staffMember.email && staffMember.phone) {
                        staff.push(staffMember);
                    }
                }
                
                resolve(staff);
            } catch (error) {
                reject(new Error(`Failed to parse CSV file: ${error.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            // Check for escaped quotes (double quotes)
            if (i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i += 2; // Skip both quotes
                continue;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
                i++;
                continue;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            values.push(current);
            current = '';
            i++;
            continue;
        } else {
            // Regular character
            current += char;
            i++;
        }
    }
    
    // Add the last value
    values.push(current);
    
    return values;
}

// Export Staff to PDF
async function exportStaffAsPDF() {
    try {
        showLoadingOverlay('Exporting staff as PDF...');
        
        // Ensure we have the latest data
        if (staffData.length === 0) {
            await loadStaffData();
        }
        
        // Prepare data for export
        const headers = ['Name', 'Department', 'Email', 'Phone', 'Availability'];
        const data = staffData.map(staff => [
            staff.name || '',
            staff.department || '',
            staff.email || '',
            staff.phone || '',
            staff.availability || ''
        ]);
        
        const metadata = {
            'Total Staff': staffData.length,
            'Export Format': 'PDF'
        };
        
        // Export using the standardized utility
        // Note: exportToPDF now works asynchronously with callbacks
        exportToPDF({
            title: 'Staff Management Report',
            headers,
            data,
            filename: `staff_export_${new Date().toISOString().slice(0, 10)}.pdf`,
            metadata
        });
        
        // Don't hide the loading overlay here since exportToPDF is asynchronous
        // The overlay and success message will be handled by the callback in exportToPDF
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export staff as PDF:', error);
        showToast('Failed to export staff as PDF: ' + error.message, 'error');
    }
}

// Export Staff to Excel
async function exportStaffAsExcel() {
    try {
        showLoadingOverlay('Exporting staff as Excel...');
        
        // Ensure we have the latest data
        if (staffData.length === 0) {
            await loadStaffData();
        }
        
        // Prepare data for export
        const headers = ['Name', 'Department', 'Email', 'Phone', 'Availability'];
        const data = staffData.map(staff => [
            staff.name || '',
            staff.department || '',
            staff.email || '',
            staff.phone || '',
            staff.availability || ''
        ]);
        
        const metadata = {
            'Total Staff': staffData.length,
            'Export Format': 'Excel'
        };
        
        // Export using the standardized utility
        const success = exportToExcel({
            title: 'Staff Management Report',
            headers,
            data,
            filename: `staff_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showToast('Staff exported as Excel successfully', 'success');
        } else {
            showToast('Failed to export staff as Excel', 'error');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export staff as Excel:', error);
        showToast('Failed to export staff as Excel: ' + error.message, 'error');
    }
}

// Export Staff to CSV
async function exportStaffAsCSV() {
    try {
        showLoadingOverlay('Exporting staff as CSV...');
        
        // Ensure we have the latest data
        if (staffData.length === 0) {
            await loadStaffData();
        }
        
        // Prepare data for export
        const headers = ['Name', 'Department', 'Email', 'Phone', 'Availability'];
        const data = staffData.map(staff => [
            staff.name || '',
            staff.department || '',
            staff.email || '',
            staff.phone || '',
            staff.availability || ''
        ]);
        
        const metadata = {
            'Total Staff': staffData.length,
            'Export Format': 'CSV'
        };
        
        // Export using the standardized utility
        const success = exportToCSV({
            title: 'Staff Management Report',
            headers,
            data,
            filename: `staff_export_${new Date().toISOString().slice(0, 10)}.csv`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showToast('Staff exported as CSV successfully', 'success');
        } else {
            showToast('Failed to export staff as CSV', 'error');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export staff as CSV:', error);
        showToast('Failed to export staff as CSV: ' + error.message, 'error');
    }
}

// Clear All Staff
async function clearAllStaff() {
    if (!confirm('Are you sure you want to delete ALL staff members? This action cannot be undone.')) {
        return;
    }
    
    try {
        await fetchData('/api/staff', {
            method: 'DELETE'
        });
        showToast('All staff members cleared successfully', 'success');
        loadStaffData(); // Refresh the data
    } catch (error) {
        console.error('Error clearing staff:', error);
        showToast(`Failed to clear staff members: ${error.message}`, 'error');
    }
}

// Handle Search
function handleSearch() {
    const searchTerm = staffSearch.value.toLowerCase().trim();
    
    if (!searchTerm) {
        renderStaffTable();
        return;
    }
    
    const filteredData = staffData.filter(staff => 
        (staff.name && staff.name.toLowerCase().includes(searchTerm)) ||
        (staff.department && staff.department.toLowerCase().includes(searchTerm)) ||
        (staff.email && staff.email.toLowerCase().includes(searchTerm)) ||
        (staff.phone && staff.phone.toLowerCase().includes(searchTerm)) ||
        (staff.availability && staff.availability.toLowerCase().includes(searchTerm))
    );
    
    renderStaffTable(filteredData);
}

// Filter Staff based on search input
function filterStaff(event) {
    const searchTerm = event.target.value.toLowerCase();
    
    const filteredData = staffData.filter(staff => {
        return (
            (staff.name && staff.name.toLowerCase().includes(searchTerm)) ||
            (staff.department && staff.department.toLowerCase().includes(searchTerm)) ||
            (staff.email && staff.email.toLowerCase().includes(searchTerm)) ||
            (staff.phone && staff.phone.toLowerCase().includes(searchTerm))
        );
    });
    
    renderStaffTable(filteredData);
}

// Download Sample CSV
function downloadSampleCSV(event) {
    event.preventDefault();
    
    const csvContent = `Name,Email,Phone,Department,Availability
John Doe,john.doe@example.com,123-456-7890,Computer Science,Yes
Jane Smith,jane.smith@example.com,098-765-4321,Mathematics,No
Robert Johnson,robert.johnson@example.com,555-123-4567,Physics,Yes
Emily Davis,emily.davis@example.com,555-987-6543,Chemistry,Yes
Michael Wilson,michael.wilson@example.com,555-456-7890,Biology,No`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample-staff.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility Functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
}

// Toast Notification Function
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove toast after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Redirect to login page or home page
        window.location.href = '../../index.html';
    }
}

// New functions for invigilator assignment
async function generateAssignments() {
    try {
        showLoading('Generating random assignments...');
        
        // Call the smart assignment API endpoint using fetchData
        const result = await fetchData('staffing/smart-assign', {
            method: 'POST'
        });
        
        console.log('Generate assignments result:', result);
        
        showSuccess(result.message);
        displayAssignments(result.assignments, 'generated');
        
        // Show the save assignments button
        const saveBtn = document.getElementById('saveAssignmentsBtn');
        if (saveBtn) {
            saveBtn.style.display = 'inline-flex';
            // Store the generated assignments in a global variable
            window.generatedAssignments = result.assignments;
        }
        
        // Note: We're not automatically saving to database anymore
        // The user can now choose when to save using the Save Assignments button
    } catch (error) {
        console.error('Error generating assignments:', error);
        showError('Failed to generate assignments: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function saveAssignments() {
    try {
        showLoading('Saving assignments...');
        
        // Check if we have generated assignments
        if (!window.generatedAssignments) {
            showError('No assignments to save. Please generate assignments first.');
            return;
        }
        
        console.log('Generated assignments to save:', window.generatedAssignments);
        
        // Structure the data correctly for the database
        const allocationData = {
            date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
            allocationData: window.generatedAssignments
        };
        
        console.log('Sending allocation data:', allocationData);
        
        const response = await fetchData('staffAllocations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(allocationData)
        });
        
        console.log('Save response:', response);
        
        // Check if it's an update or creation
        if (response.message && response.message.includes('updated')) {
            showSuccess('Assignments updated successfully in database');
        } else {
            showSuccess('Assignments saved successfully to database');
        }
        
        // Hide the save button after successful save
        const saveBtn = document.getElementById('saveAssignmentsBtn');
        if (saveBtn) {
            saveBtn.style.display = 'none';
        }
        
        // Clear the generated assignments
        window.generatedAssignments = null;
    } catch (saveError) {
        console.error('Failed to save assignments to database:', saveError);
        // Check if it's a conflict error (409) for duplicate allocations
        if (saveError.message.includes('already exists')) {
            showWarning('Assignments already exist for today. Please clear existing allocations first if you want to generate new ones.');
        } else {
            showError('Failed to save assignments to database: ' + saveError.message);
        }
    } finally {
        hideLoading();
    }
}

async function clearAssignments() {
    try {
        if (!confirm('Are you sure you want to clear all saved assignments? This action cannot be undone.')) {
            return;
        }
        
        showLoading('Clearing assignments...');
        
        // Clear all staff allocations using fetchData
        await fetchData('staffAllocations', {
            method: 'DELETE'
        });
        
        showSuccess('All assignments cleared successfully');
        
        // Also hide the save button if it's visible
        const saveBtn = document.getElementById('saveAssignmentsBtn');
        if (saveBtn) {
            saveBtn.style.display = 'none';
        }
        
        // Clear any displayed assignments
        const resultsSection = document.getElementById('assignmentResults');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
        
        // Clear the assignments container
        const assignmentsContainer = document.getElementById('assignmentsContainer');
        if (assignmentsContainer) {
            assignmentsContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('Error clearing assignments:', error);
        showError('Failed to clear assignments: ' + error.message);
    } finally {
        hideLoading();
    }
}

async function viewAssignments() {
    try {
        showLoading('Loading assignments...');
        
        // Fetch the latest staff allocations using fetchData
        const allocations = await fetchData('staffAllocations/history');
        
        console.log('Retrieved allocations:', allocations);
        
        if (allocations && allocations.length > 0) {
            displayAssignments(allocations);
            // Add a success message with count
            showToast(`Successfully loaded ${allocations.length} assignment set(s)`, 'success');
        } else {
            displayAssignments([]); // Display empty state
            showToast('No assignment history found', 'info');
        }
    } catch (error) {
        console.error('Error loading assignments:', error);
        // Display error state
        const resultsSection = document.getElementById('assignmentResults');
        const container = document.getElementById('assignmentsContainer');
        if (resultsSection && container) {
            container.innerHTML = `<p class="error-message">Failed to load assignments: ${error.message}</p>`;
            resultsSection.style.display = 'block';
            resultsSection.className = 'assignment-results error-assignments';
        }
        showToast('Failed to load assignments: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Export assignments function
async function exportAssignments() {
    console.log('Export assignments button clicked');
    try {
        showLoading('Loading assignments for export...');
        
        // Fetch the latest staff allocations using fetchData
        const allocations = await fetchData('staffAllocations/history');
        
        console.log('Retrieved allocations for export:', allocations);
        
        if (!allocations || allocations.length === 0) {
            showToast('No assignments found to export', 'warning');
            hideLoading();
            return;
        }
        
        // Create export dropdown menu
        createExportDropdown(allocations);
    } catch (error) {
        console.error('Error preparing assignments for export:', error);
        hideLoading();
        showToast('Failed to prepare assignments for export: ' + error.message, 'error');
    }
}

// Create export dropdown menu
function createExportDropdown(allocations) {
    console.log('Creating export dropdown with allocations:', allocations);
    
    // Remove any existing dropdown
    const existingDropdown = document.getElementById('exportAssignmentsDropdown');
    if (existingDropdown) {
        existingDropdown.remove();
    }
    
    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.id = 'exportAssignmentsDropdown';
    dropdown.className = 'dropdown-menu show';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 1000;
        display: block;
        min-width: 200px;
        padding: 0;
        margin: 0.125rem 0 0;
        font-size: 1rem;
        color: #212529;
        text-align: left;
        background-color: #fff;
        background-clip: padding-box;
        border: 1px solid rgba(0, 0, 0, 0.15);
        border-radius: 0.25rem;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.175);
        animation: fadeIn 0.3s ease;
    `;
    
    // Add dropdown items
    dropdown.innerHTML = `
        <button class="dropdown-item" id="exportAssignmentsPdfBtn">
            <i class="fas fa-file-pdf"></i> Export as PDF
        </button>
        <button class="dropdown-item" id="exportAssignmentsCsvBtn">
            <i class="fas fa-file-csv"></i> Export as CSV
        </button>
        <button class="dropdown-item" id="exportAssignmentsExcelBtn">
            <i class="fas fa-file-excel"></i> Export as Excel
        </button>
    `;
    
    // Add dropdown to the export button
    const exportBtn = document.getElementById('exportAssignmentsBtn');
    if (exportBtn) {
        // Ensure the button has relative positioning for proper dropdown placement
        exportBtn.style.position = 'relative';
        
        // Position the dropdown relative to the button
        dropdown.style.position = 'absolute';
        dropdown.style.top = '100%';
        dropdown.style.right = '0';
        dropdown.style.zIndex = '1000';
        
        // Append dropdown to the button's parent container to ensure proper positioning
        exportBtn.parentNode.style.position = 'relative';
        exportBtn.parentNode.appendChild(dropdown);
        
        // Add event listeners
        const pdfBtn = document.getElementById('exportAssignmentsPdfBtn');
        const csvBtn = document.getElementById('exportAssignmentsCsvBtn');
        const excelBtn = document.getElementById('exportAssignmentsExcelBtn');
        
        if (pdfBtn) {
            pdfBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('PDF export clicked');
                exportAssignmentsAsPDF(allocations);
                dropdown.remove();
            });
        }
        
        if (csvBtn) {
            csvBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('CSV export clicked');
                exportAssignmentsAsCSV(allocations);
                dropdown.remove();
            });
        }
        
        if (excelBtn) {
            excelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Excel export clicked');
                exportAssignmentsAsExcel(allocations);
                dropdown.remove();
            });
        }
        
        // Close dropdown when clicking outside
        const closeDropdown = (e) => {
            if (!exportBtn.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
        }, 100);
    } else {
        console.error('Export button not found');
        showToast('Export button not found', 'error');
    }
}

// Export assignments as PDF
async function exportAssignmentsAsPDF(allocations) {
    try {
        showLoading('Exporting assignments as PDF...');
        
        // Prepare data for PDF with enhanced styling
        const docDefinition = {
            pageSize: 'A4',
            pageOrientation: 'portrait',
            pageMargins: [40, 60, 40, 60],
            content: [
                {
                    text: 'INVIGILATOR ASSIGNMENTS REPORT',
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
                    margin: [0, 0, 0, 30]
                }
            ],
            styles: {
                header: {
                    fontSize: 22,
                    bold: true,
                    margin: [0, 0, 0, 15],
                    color: '#2c3e50'
                },
                subheader: {
                    fontSize: 14,
                    bold: true,
                    margin: [0, 15, 0, 10],
                    color: '#7f8c8d'
                },
                sectionHeader: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 25, 0, 15],
                    color: '#3498db',
                    decoration: 'underline'
                },
                tableHeader: {
                    bold: true,
                    fontSize: 11,
                    color: '#ffffff',
                    fillColor: '#3498db',
                    alignment: 'center'
                },
                tableCell: {
                    fontSize: 10,
                    color: '#2c3e50'
                },
                metadata: {
                    fontSize: 10,
                    italics: true,
                    color: '#95a5a6',
                    margin: [0, 0, 0, 5]
                }
            },
            defaultStyle: {
                fontSize: 10,
                color: '#34495e'
            }
        };
        
        // Add assignments data to PDF
        if (allocations && allocations.length > 0) {
            allocations.forEach((allocation, index) => {
                const allocationData = allocation.allocationData || {};
                const allocationDate = allocation.date || 'Unknown Date';
                
                // Add section header for this allocation
                if (allocations.length > 1) {
                    docDefinition.content.push({
                        text: `Assignment Set ${index + 1}: ${allocationDate}`,
                        style: 'sectionHeader'
                    });
                } else {
                    docDefinition.content.push({
                        text: `Assignments for ${allocationDate}`,
                        style: 'sectionHeader'
                    });
                }
                
                // Prepare table data
                const tableBody = [
                    [
                        { text: 'DAY', style: 'tableHeader' },
                        { text: 'ROOM', style: 'tableHeader' },
                        { text: 'STAFF MEMBER', style: 'tableHeader' }
                    ]
                ];
                
                // Process allocation data
                let assignmentCount = 0;
                Object.keys(allocationData).forEach(day => {
                    const dayAssignments = allocationData[day];
                    if (typeof dayAssignments === 'object') {
                        Object.keys(dayAssignments).forEach(room => {
                            const staffName = dayAssignments[room] || 'Unassigned';
                            tableBody.push([
                                { text: day, style: 'tableCell' },
                                { text: room, style: 'tableCell' },
                                { text: staffName, style: 'tableCell' }
                            ]);
                            assignmentCount++;
                        });
                    }
                });
                
                // Add metadata about this assignment set
                docDefinition.content.push({
                    text: `Total Assignments: ${assignmentCount}`,
                    style: 'metadata',
                    alignment: 'right'
                });
                
                // Add table to document
                docDefinition.content.push({
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', '*'],
                        body: tableBody
                    },
                    layout: {
                        hLineWidth: function(i, node) {
                            return (i === 0 || i === node.table.body.length) ? 2 : 1;
                        },
                        vLineWidth: function(i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                        },
                        hLineColor: function(i, node) {
                            return (i === 0 || i === node.table.body.length) ? '#2c3e50' : '#e1e5e9';
                        },
                        vLineColor: function(i, node) {
                            return (i === 0 || i === node.table.widths.length) ? '#2c3e50' : '#e1e5e9';
                        },
                        paddingLeft: function(i, node) { return 10; },
                        paddingRight: function(i, node) { return 10; },
                        paddingTop: function(i, node) { return 8; },
                        paddingBottom: function(i, node) { return 8; }
                    },
                    margin: [0, 0, 0, 20]
                });
            });
        } else {
            // No assignments message
            docDefinition.content.push({
                text: 'No assignments available to export.',
                style: 'subheader',
                alignment: 'center',
                margin: [0, 50, 0, 0]
            });
        }
        
        // Add footer with page numbers
        docDefinition.footer = function(currentPage, pageCount) {
            return {
                columns: [
                    {
                        text: 'AICN Invigilator Assignment System',
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
        
        // Generate and download PDF
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        pdfMake.createPdf(docDefinition).download(`invigilator_assignments_${timestamp}.pdf`);
        
        hideLoading();
        showToast('Assignments exported as PDF successfully', 'success');
    } catch (error) {
        hideLoading();
        console.error('Failed to export assignments as PDF:', error);
        showToast('Failed to export assignments as PDF: ' + error.message, 'error');
    }
}

// Export assignments as CSV
async function exportAssignmentsAsCSV(allocations) {
    try {
        showLoading('Exporting assignments as CSV...');
        
        // Prepare data for CSV export
        let csvContent = '';
        
        // Add header with report information
        csvContent += 'INVIGILATOR ASSIGNMENTS REPORT\n';
        csvContent += `Generated on: ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}\n`;
        csvContent += '\n';
        
        // Process each allocation
        if (allocations && allocations.length > 0) {
            allocations.forEach((allocation, index) => {
                const allocationData = allocation.allocationData || {};
                const allocationDate = allocation.date || 'Unknown Date';
                
                // Add section header
                if (allocations.length > 1) {
                    csvContent += `Assignment Set ${index + 1}: ${allocationDate}\n`;
                } else {
                    csvContent += `Assignments for ${allocationDate}\n`;
                }
                
                // Add column headers for this section
                csvContent += 'Day,Room,Staff Member\n';
                
                // Process allocation data
                let assignmentCount = 0;
                Object.keys(allocationData).forEach(day => {
                    const dayAssignments = allocationData[day];
                    if (typeof dayAssignments === 'object') {
                        Object.keys(dayAssignments).forEach(room => {
                            const staffName = dayAssignments[room];
                            csvContent += `"${day}","${room}","${staffName}"\n`;
                            assignmentCount++;
                        });
                    }
                });
                
                // Add count and separator
                csvContent += `Total Assignments: ${assignmentCount}\n`;
                csvContent += '\n'; // Empty line as separator
            });
        } else {
            csvContent += 'No assignments available to export.\n';
        }
        
        // Create download link with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `invigilator_assignments_${timestamp}.csv`;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        hideLoading();
        showToast('Assignments exported as CSV successfully', 'success');
    } catch (error) {
        hideLoading();
        console.error('Failed to export assignments as CSV:', error);
        showToast('Failed to export assignments as CSV: ' + error.message, 'error');
    }
}

// Export assignments as Excel
async function exportAssignmentsAsExcel(allocations) {
    try {
        showLoading('Exporting assignments as Excel...');
        
        // Prepare worksheet data
        const worksheetData = [
            [], // Empty row for title
            ['INVIGILATOR ASSIGNMENTS REPORT'],
            [`Generated on: ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}`],
            [], // Empty row
        ];
        
        // Process each allocation
        if (allocations && allocations.length > 0) {
            allocations.forEach((allocation, index) => {
                const allocationData = allocation.allocationData || {};
                const allocationDate = allocation.date || 'Unknown Date';
                
                // Add section header
                if (allocations.length > 1) {
                    worksheetData.push([`Assignment Set ${index + 1}: ${allocationDate}`]);
                } else {
                    worksheetData.push([`Assignments for ${allocationDate}`]);
                }
                
                // Add header row for this section
                worksheetData.push(['Day', 'Room', 'Staff Member']);
                
                // Process allocation data
                let assignmentCount = 0;
                Object.keys(allocationData).forEach(day => {
                    const dayAssignments = allocationData[day];
                    if (typeof dayAssignments === 'object') {
                        Object.keys(dayAssignments).forEach(room => {
                            const staffName = dayAssignments[room];
                            worksheetData.push([day, room, staffName]);
                            assignmentCount++;
                        });
                    }
                });
                
                // Add count and separator
                worksheetData.push([`Total Assignments: ${assignmentCount}`]);
                worksheetData.push([]); // Empty row as separator
            });
        } else {
            worksheetData.push(['No assignments available to export.']);
        }
        
        // Create workbook and worksheet
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // Style the title row
        ws['A2'] = { t: 's', v: 'INVIGILATOR ASSIGNMENTS REPORT' };
        ws['!merges'] = [{s: {r:1, c:0}, e: {r:1, c:2}}]; // Merge cells for title
        
        // Set column widths
        ws['!cols'] = [
            { wch: 20 }, // Day
            { wch: 15 }, // Room
            { wch: 30 }  // Staff Member
        ];
        
        // Add styling (basic styling for Excel)
        if (!ws['!rows']) ws['!rows'] = [];
        ws['!rows'][1] = { hpt: 24 }; // Title row height
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Invigilator Assignments');
        
        // Export to Excel file with timestamp
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        XLSX.writeFile(wb, `invigilator_assignments_${timestamp}.xlsx`);
        
        hideLoading();
        showToast('Assignments exported as Excel successfully', 'success');
    } catch (error) {
        hideLoading();
        console.error('Failed to export assignments as Excel:', error);
        showToast('Failed to export assignments as Excel: ' + error.message, 'error');
    }
}

// Display assignments in a modal or designated area
function displayAssignments(allocations, type = 'viewed') {
    console.log('Displaying assignments:', allocations);
    
    // Get the results section and container
    const resultsSection = document.getElementById('assignmentResults');
    const container = document.getElementById('assignmentsContainer');
    
    if (!resultsSection || !container) {
        console.error('Assignment results elements not found');
        showToast('UI elements for displaying assignments not found', 'error');
        return;
    }
    
    // Clear previous content
    container.innerHTML = '';
    
    // Check if we have allocations to display
    if (!allocations || (Array.isArray(allocations) && allocations.length === 0)) {
        container.innerHTML = '<p class="no-assignments">No assignments available to display.</p>';
        resultsSection.style.display = 'block';
        return;
    }
    
    // If allocations is an object (generated assignments), convert it to array format
    let allocationsArray = allocations;
    if (!Array.isArray(allocations)) {
        // Convert object to array format
        allocationsArray = [{
            date: new Date().toISOString().split('T')[0],
            allocationData: allocations
        }];
    }
    
    // Create HTML for assignments
    let html = '';
    
    allocationsArray.forEach((allocation, index) => {
        const allocationData = allocation.allocationData || allocation;
        const allocationDate = allocation.date || `Assignment Set ${index + 1}`;
        
        html += `
            <div class="assignment-set">
                <h3 class="assignment-date">Assignments for ${allocationDate}</h3>
                <div class="assignment-content">
        `;
        
        // If allocationData is an object with days
        if (typeof allocationData === 'object' && !Array.isArray(allocationData)) {
            // Check if this is a nested structure (days -> rooms -> staff)
            const keys = Object.keys(allocationData);
            
            // If the first key looks like a day (e.g., "Day 1", "Monday", etc.)
            if (keys.length > 0 && (keys[0].includes('Day') || keys[0].includes('Monday') || keys[0].includes('Tuesday') || 
                keys[0].includes('Wednesday') || keys[0].includes('Thursday') || keys[0].includes('Friday') || keys[0].includes('Saturday') || keys[0].includes('Sunday'))) {
                // Handle day-based structure
                keys.forEach(day => {
                    const dayAssignments = allocationData[day];
                    html += `<div class="day-section"><h4 class="day-title">${day}</h4><div class="rooms-container">`;
                    
                    if (typeof dayAssignments === 'object' && dayAssignments !== null) {
                        Object.keys(dayAssignments).forEach(room => {
                            const staffName = dayAssignments[room] || 'Unassigned';
                            html += `
                                <div class="room-card">
                                    <div class="room-header">${room}</div>
                                    <div class="staff-name">${staffName}</div>
                                </div>
                            `;
                        });
                    } else {
                        html += `<p class="no-rooms">No room assignments for ${day}</p>`;
                    }
                    
                    html += `</div></div>`;
                });
            } else {
                // Handle direct room-based structure
                html += `<div class="rooms-container">`;
                keys.forEach(room => {
                    const staffName = allocationData[room] || 'Unassigned';
                    html += `
                        <div class="room-card">
                            <div class="room-header">${room}</div>
                            <div class="staff-name">${staffName}</div>
                        </div>
                    `;
                });
                html += `</div>`;
            }
        } else if (Array.isArray(allocationData)) {
            // Handle array format
            html += '<p class="array-format">Array format detected but not fully supported in display.</p>';
        } else {
            // Handle simple object format
            html += `<p class="unknown-format">Assignment data format not recognized: ${typeof allocationData}</p>`;
        }
        
        html += '</div></div>';
    });
    
    // Set the HTML content
    container.innerHTML = html;
    
    // Show the results section
    resultsSection.style.display = 'block';
    
    // Add the appropriate class for styling
    resultsSection.className = 'assignment-results ' + type + '-assignments';
    
    // Scroll to the results section
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    showToast('Assignments displayed successfully', 'success');
}
