// Student Management JavaScript

let studentsData = []; // Make sure this is initialized
let currentSectionFilter = ''; // Track the current section filter
let currentPage = 1; // Track current page
let pageSize = 25; // Default page size
let totalPages = 1; // Track total pages

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadStudentsData();
    updateStats();
    setupProfilePictureHandlers();
});

async function initializeStudents() {
    console.log('initializeStudents called');
    await loadStudentsData();
    updateStats();
}

function setupEventListeners() {
    // Button event listeners
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => openStudentModal());
    }
    
    const importStudentBtn = document.getElementById('importStudentsBtn');
    if (importStudentBtn) {
        importStudentBtn.addEventListener('click', openImportModal);
    }
    
    // Export dropdown functionality
    const exportStudentBtn = document.getElementById('exportStudentsBtn');
    const exportDropdown = document.getElementById('exportDropdown');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    
    console.log('Export elements:', { exportStudentBtn, exportDropdown, exportPdfBtn, exportCsvBtn, exportExcelBtn });
    
    if (exportStudentBtn && exportDropdown) {
        console.log('Setting up export dropdown event listeners');
        
        // Toggle dropdown on button click
        exportStudentBtn.addEventListener('click', function(e) {
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
                !exportStudentBtn.contains(e.target) && 
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
                exportStudentsAsPDF();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('CSV export clicked');
                exportStudentsAsCSV();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                console.log('Excel export clicked');
                exportStudentsAsExcel();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
    } else {
        console.log('Export dropdown elements not found');
    }
    
    const clearAllStudentsBtn = document.getElementById('clearAllStudentsBtn');
    if (clearAllStudentsBtn) {
        clearAllStudentsBtn.addEventListener('click', clearAllStudents);
    }
    
    // Form submission
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', handleStudentSubmit);
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
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });
    
    // Search functionality - Fix the element ID to match HTML
    const studentSearch = document.getElementById('searchInput'); // Changed from 'studentSearch' to 'searchInput'
    if (studentSearch) {
        studentSearch.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Section filter
    const sectionFilter = document.getElementById('sectionFilter');
    if (sectionFilter) {
        sectionFilter.addEventListener('change', handleSearch);
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
            loadStudentsData();
        });
    }
}

// Search function
function handleSearch() {
    // Update the currentSectionFilter variable when the section filter changes
    const sectionFilter = document.getElementById('sectionFilter');
    if (sectionFilter) {
        currentSectionFilter = sectionFilter.value;
    }
    
    currentPage = 1; // Reset to first page when search changes
    loadStudentsData();
}

// Debounce function to limit search frequency
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

function setupProfilePictureHandlers() {
    const uploadPictureBtn = document.getElementById('uploadPictureBtn');
    const removePictureBtn = document.getElementById('removePictureBtn');
    const profilePictureInput = document.getElementById('profilePicture');
    const profilePicturePreview = document.getElementById('profilePicturePreview');
    
    if (uploadPictureBtn && profilePictureInput) {
        uploadPictureBtn.addEventListener('click', () => {
            profilePictureInput.click();
        });
        
        profilePictureInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showToast('Please select an image file', 'error');
                    return;
                }
                
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('Image size must be less than 5MB', 'error');
                    return;
                }
                
                // Preview the image
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Create image element for preview
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    
                    // Clear previous content and add image
                    profilePicturePreview.innerHTML = '';
                    profilePicturePreview.appendChild(img);
                    profilePicturePreview.classList.add('has-image');
                    
                    // Show remove button
                    if (removePictureBtn) {
                        removePictureBtn.style.display = 'flex';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (removePictureBtn) {
        removePictureBtn.addEventListener('click', function() {
            // Reset profile picture input
            if (profilePictureInput) {
                profilePictureInput.value = '';
            }
            
            // Reset preview
            profilePicturePreview.innerHTML = '<i class="fas fa-user"></i>';
            profilePicturePreview.classList.remove('has-image');
            
            // Hide remove button
            removePictureBtn.style.display = 'none';
        });
    }
    
    // Click on preview to upload
    if (profilePicturePreview) {
        profilePicturePreview.addEventListener('click', () => {
            if (uploadPictureBtn) {
                uploadPictureBtn.click();
            }
        });
    }
}

async function loadStudentsData() {
    try {
        console.log('Attempting to fetch students data...');
        // Show loading state
        const tableBody = document.getElementById('studentsTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading students...</td></tr>';
        }
        
        // Get search term and section filter
        const searchInput = document.getElementById('searchInput');
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        console.log('Search term:', searchTerm);
        
        // Apply section filter
        console.log('Section filter:', currentSectionFilter);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (currentSectionFilter) params.append('section', currentSectionFilter);
        
        // Fetch students from API with search parameters
        console.log('Calling fetchData with endpoint: students?' + params.toString());
        const response = await fetchData(`students?${params.toString()}`);
        
        // Handle case where response might be wrapped in an object
        studentsData = Array.isArray(response) ? response : (response.students || response.data || []);
        
        console.log('Received students data. Length:', studentsData.length);
        console.log('First few students:', studentsData.slice(0, 3));
        
        // Check if studentsData is an array
        if (!Array.isArray(studentsData)) {
            console.error('Students data is not an array:', studentsData);
            throw new Error('Invalid data format received from server');
        }
        
        // Calculate pagination
        totalPages = Math.ceil(studentsData.length / pageSize);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        // Display paginated data
        renderStudentsTable(studentsData);
        updateStats();
        updatePaginationControls();
    } catch (error) {
        console.error('Failed to load students data:', error);
        showError('Failed to load students data: ' + error.message);
        
        // Show error in table
        const tableBody = document.getElementById('studentsTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Failed to load students data: ' + error.message + '</td></tr>';
        }
    }
}

function renderStudentsTable(data) {
    console.log('Rendering students table with data:', data);
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) {
        console.error('Table body element not found');
        return;
    }
    
    // Calculate pagination indices
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, data.length);
    const paginatedData = data.slice(startIndex, endIndex);
    
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">No students found. Click "Add Student" or "Import CSV" to get started.</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    paginatedData.forEach(student => {
        // Check if student object has required properties
        if (!student || typeof student !== 'object') {
            console.warn('Invalid student object:', student);
            return;
        }
        
        // Determine section badge class
        let sectionBadgeClass = 'section-badge';
        if (student.section) {
            sectionBadgeClass += ' ' + student.section.toLowerCase();
        }
        
        html += `
            <tr>
                <td>${student.rollNo || ''}</td>
                <td>${student.name || ''}</td>
                <td><span class="${sectionBadgeClass}">${student.section || ''}</span></td>
                <td>${student.email || ''}</td>
                <td>${student.phone || ''}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-btn" data-id="${student._id || student.id || ''}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-btn" data-id="${student._id || student.id || ''}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Remove any existing event listeners to prevent duplicates
    document.querySelectorAll('.edit-btn').forEach(button => {
        const studentId = button.dataset.id;
        // Remove existing event listeners by cloning
        const newButton = button.cloneNode(true);
        newButton.addEventListener('click', () => {
            openStudentModal(studentId);
        });
        button.parentNode.replaceChild(newButton, button);
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        const studentId = button.dataset.id;
        // Remove existing event listeners by cloning
        const newButton = button.cloneNode(true);
        newButton.addEventListener('click', () => {
            deleteStudent(studentId);
        });
        button.parentNode.replaceChild(newButton, button);
    });
    
    // Update pagination info
    updatePaginationInfo(data.length);
}

async function updateStats() {
    try {
        console.log('Updating stats...');
        // Fetch stats from API
        const statsResponse = await fetchData('students/stats');
        
        // Handle case where response might be wrapped in an object
        const stats = statsResponse.stats || statsResponse.data || statsResponse;
        
        console.log('Received stats:', stats);
        
        document.getElementById('totalStudents').textContent = stats.totalStudents || 0;
        document.getElementById('totalClasses').textContent = stats.totalClasses || 0;
        
        // Update section-specific stats if elements exist
        const b1CountElement = document.getElementById('b1Count');
        const b2CountElement = document.getElementById('b2Count');
        const b3CountElement = document.getElementById('b3Count');
        
        if (b1CountElement) b1CountElement.textContent = stats.sectionCounts?.B1 || 0;
        if (b2CountElement) b2CountElement.textContent = stats.sectionCounts?.B2 || 0;
        if (b3CountElement) b3CountElement.textContent = stats.sectionCounts?.B3 || 0;
        
        console.log('Stats updated successfully');
    } catch (error) {
        console.error('Failed to update stats:', error);
        // Fallback to old method if new endpoint fails
        try {
            const studentsResponse = await fetchData('students');
            
            // Handle case where response might be wrapped in an object
            const students = Array.isArray(studentsResponse) ? studentsResponse : (studentsResponse.students || studentsResponse.data || []);
            
            document.getElementById('totalStudents').textContent = students.length;
            
            // Calculate classes and count by section
            const sectionCounts = {
                'B1': 0,
                'B2': 0,
                'B3': 0
            };
            
            students.forEach(student => {
                if (student.section && sectionCounts.hasOwnProperty(student.section)) {
                    sectionCounts[student.section]++;
                }
            });
            
            // Update section-specific stats if elements exist
            const b1CountElement = document.getElementById('b1Count');
            const b2CountElement = document.getElementById('b2Count');
            const b3CountElement = document.getElementById('b3Count');
            
            if (b1CountElement) b1CountElement.textContent = sectionCounts.B1;
            if (b2CountElement) b2CountElement.textContent = sectionCounts.B2;
            if (b3CountElement) b3CountElement.textContent = sectionCounts.B3;
            
            // Calculate total unique classes/sections
            const classes = new Set(students.map(s => s.section));
            document.getElementById('totalClasses').textContent = classes.size;
        } catch (fallbackError) {
            console.error('Fallback stats update also failed:', fallbackError);
        }
    }
}

async function handleStudentSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        console.log('Form Data Entries:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }
        
        // Handle profile picture
        let profilePictureData = null;
        const profilePictureFile = formData.get('profilePicture');
        
        if (profilePictureFile && profilePictureFile.size > 0) {
            // Convert image to base64 for storage
            profilePictureData = await fileToBase64(profilePictureFile);
        } else {
            // Check if there's an existing profile picture in the preview
            const profilePicturePreview = document.getElementById('profilePicturePreview');
            if (profilePicturePreview && profilePicturePreview.classList.contains('has-image')) {
                const img = profilePicturePreview.querySelector('img');
                if (img) {
                    profilePictureData = img.src;
                }
            }
        }
        
        const studentData = {
            rollNo: (formData.get('rollNo') || '').trim(),
            name: `${(formData.get('firstName') || '').trim()} ${(formData.get('lastName') || '').trim()}`.trim(),
            section: (formData.get('classSelect') || '').trim(),
            email: (formData.get('email') || '').trim(),
            phone: (formData.get('phone') || '').trim(),
            profilePicture: profilePictureData
        };
        
        console.log('Student Data:', studentData);
        
        // Validate required fields with specific error messages
        if (!studentData.rollNo) {
            showError('Roll Number is required');
            document.getElementById('rollNo').focus();
            return;
        }
        
        if (!studentData.name || studentData.name.trim() === '') {
            showError('Name is required');
            document.getElementById('firstName').focus();
            return;
        }
        
        if (!studentData.section) {
            showError('Section is required');
            document.getElementById('classSelect').focus();
            return;
        }
        
        // Validate that section is one of the allowed values
        const validSections = ['B1', 'B2', 'B3'];
        if (!validSections.includes(studentData.section)) {
            showError('Section must be one of: B1, B2, B3');
            document.getElementById('classSelect').focus();
            return;
        }
        
        // Validate email format if provided
        if (studentData.email && studentData.email.trim() !== '') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(studentData.email)) {
                showError('Please enter a valid email address');
                document.getElementById('email').focus();
                return;
            }
        }
        
        // Validate phone format if provided
        if (studentData.phone && studentData.phone.trim() !== '') {
            // Simple phone validation - at least 10 digits
            const phoneRegex = /^\d{10,15}$/;
            // Remove any non-digit characters for validation
            const cleanPhone = studentData.phone.replace(/\D/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                showError('Please enter a valid phone number (10-15 digits)');
                document.getElementById('phone').focus();
                return;
            }
        }
        
        const studentId = formData.get('studentId');
        
        if (studentId) {
            // Update existing student
            await fetchData(`students/${studentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData)
            });
        } else {
            // Add new student
            await fetchData('students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(studentData)
            });
        }
        
        closeModal();
        await loadStudentsData();
        updateStats();
        
        showSuccess(studentId ? 'Student updated successfully' : 'Student added successfully');
    } catch (error) {
        console.error('Failed to save student:', error);
        showError('Failed to save student: ' + (error.message || 'Unknown error occurred'));
    }
}

// Utility function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Export Students to PDF
async function exportStudentsAsPDF() {
    try {
        showLoadingOverlay('Exporting students as PDF...');
        
        // Ensure we have the latest data
        if (studentsData.length === 0) {
            await loadStudentsData();
        }
        
        // Prepare data for export
        const headers = ['Roll No', 'Name', 'Section', 'Email', 'Phone'];
        const data = studentsData.map(student => [
            student.rollNo || '',
            student.name || '',
            student.section || '',
            student.email || '',
            student.phone || ''
        ]);
        
        const metadata = {
            'Total Students': studentsData.length,
            'Export Format': 'PDF'
        };
        
        // Export using the standardized utility
        // Note: exportToPDF now works asynchronously with callbacks
        exportToPDF({
            title: 'Student Management Report',
            headers,
            data,
            filename: `students_export_${new Date().toISOString().slice(0, 10)}.pdf`,
            metadata
        });
        
        // Don't hide the loading overlay here since exportToPDF is asynchronous
        // The overlay and success message will be handled by the callback in exportToPDF
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export students as PDF:', error);
        showToast('Failed to export students as PDF: ' + error.message, 'error');
    }
}

// Export Students to Excel
async function exportStudentsAsExcel() {
    try {
        showLoadingOverlay('Exporting students as Excel...');
        
        // Ensure we have the latest data
        if (studentsData.length === 0) {
            await loadStudentsData();
        }
        
        // Prepare data for export
        const headers = ['Roll No', 'Name', 'Section', 'Email', 'Phone'];
        const data = studentsData.map(student => [
            student.rollNo || '',
            student.name || '',
            student.section || '',
            student.email || '',
            student.phone || ''
        ]);
        
        const metadata = {
            'Total Students': studentsData.length,
            'Export Format': 'Excel'
        };
        
        // Export using the standardized utility
        const success = exportToExcel({
            title: 'Student Management Report',
            headers,
            data,
            filename: `students_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showToast('Students exported as Excel successfully', 'success');
        } else {
            showToast('Failed to export students as Excel', 'error');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export students as Excel:', error);
        showToast('Failed to export students as Excel: ' + error.message, 'error');
    }
}

// Export Students to CSV
async function exportStudentsAsCSV() {
    try {
        showLoadingOverlay('Exporting students as CSV...');
        
        // Ensure we have the latest data
        if (studentsData.length === 0) {
            await loadStudentsData();
        }
        
        // Prepare data for export
        const headers = ['Roll No', 'Name', 'Section', 'Email', 'Phone'];
        const data = studentsData.map(student => [
            student.rollNo || '',
            student.name || '',
            student.section || '',
            student.email || '',
            student.phone || ''
        ]);
        
        const metadata = {
            'Total Students': studentsData.length,
            'Export Format': 'CSV'
        };
        
        // Export using the standardized utility
        const success = exportToCSV({
            title: 'Student Management Report',
            headers,
            data,
            filename: `students_export_${new Date().toISOString().slice(0, 10)}.csv`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showToast('Students exported as CSV successfully', 'success');
        } else {
            showToast('Failed to export students as CSV', 'error');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export students as CSV:', error);
        showToast('Failed to export students as CSV: ' + error.message, 'error');
    }
}

// Setup export event listeners for students
function setupStudentExportListeners() {
    // Export dropdown functionality
    const exportDropdown = document.getElementById('exportDropdown');
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const exportStudentsBtn = document.getElementById('exportStudentsBtn');
    
    if (exportStudentsBtn && exportDropdown) {
        // Toggle dropdown on button click
        exportStudentsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
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
                !exportStudentsBtn.contains(e.target) && 
                !exportDropdown.contains(e.target)) {
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            }
        });
        
        // Export handlers
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportStudentsAsPDF();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportStudentsAsCSV();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportStudentsAsExcel();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
    }
}

// Open student modal for adding/editing
function openStudentModal(studentId = null) {
    const modal = document.getElementById('studentModal');
    const modalTitle = document.getElementById('modalTitle');
    const studentForm = document.getElementById('studentForm');
    const studentIdInput = document.getElementById('studentId');
    
    if (studentId) {
        // Edit existing student
        modalTitle.innerHTML = '<i class="fas fa-user-edit"></i> Edit Student';
        populateFormWithStudentData(studentId);
        studentIdInput.value = studentId;
    } else {
        // Add new student
        modalTitle.innerHTML = '<i class="fas fa-user-plus"></i> Add Student';
        studentForm.reset();
        studentIdInput.value = '';
    }
    
    modal.style.display = 'block';
}

// Open import modal
function openImportModal() {
    const modal = document.getElementById('importModal');
    const importForm = document.getElementById('importForm');
    
    // Reset form
    importForm.reset();
    
    modal.style.display = 'block';
}

// Close all modals
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Delete student
async function deleteStudent(studentId) {
    if (!studentId) {
        showError('Invalid student ID');
        return;
    }
    
    try {
        // Find student name for confirmation message
        const student = studentsData.find(s => s._id == studentId);
        const studentName = student ? student.name : 'this student';
        
        // Confirm deletion with more detailed message
        const confirmMessage = `Are you sure you want to delete ${studentName}? This action cannot be undone.`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Delete student from API
        await fetchData(`students/${studentId}`, {
            method: 'DELETE'
        });
        
        // Reload students data
        await loadStudentsData();
        updateStats();
        
        showSuccess('Student deleted successfully');
    } catch (error) {
        console.error('Failed to delete student:', error);
        showError('Failed to delete student: ' + error.message);
    }
}

function clearAllStudents() {
    // Get current student count for confirmation message
    const studentCount = studentsData.length;
    
    const confirmMessage = `Are you sure you want to clear all ${studentCount} students? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        fetchData('students', {
            method: 'DELETE'
        })
        .then(() => {
            showSuccess('All students cleared successfully');
            loadStudentsData();
        })
        .catch(error => {
            console.error('Failed to clear students:', error);
            showError('Failed to clear students: ' + error.message);
        });
    }
}

function populateFormWithStudentData(studentId) {
    const student = studentsData.find(s => s._id == studentId);
    
    if (student) {
        document.getElementById('rollNo').value = student.rollNo || '';
        
        // Parse name into first and last name (assuming space separated)
        const nameParts = student.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        document.getElementById('firstName').value = firstName;
        document.getElementById('lastName').value = lastName;
        document.getElementById('classSelect').value = student.section || '';
        document.getElementById('email').value = student.email || '';
        document.getElementById('phone').value = student.phone || '';
        
        // Handle profile picture
        const profilePicturePreview = document.getElementById('profilePicturePreview');
        const removePictureBtn = document.getElementById('removePictureBtn');
        
        if (student.profilePicture && profilePicturePreview) {
            // Create image element for preview
            const img = document.createElement('img');
            img.src = student.profilePicture;
            
            // Clear previous content and add image
            profilePicturePreview.innerHTML = '';
            profilePicturePreview.appendChild(img);
            profilePicturePreview.classList.add('has-image');
            
            // Show remove button
            if (removePictureBtn) {
                removePictureBtn.style.display = 'flex';
            }
        } else if (profilePicturePreview) {
            // Reset to default preview
            profilePicturePreview.innerHTML = '<i class="fas fa-user"></i>';
            profilePicturePreview.classList.remove('has-image');
            
            // Hide remove button
            if (removePictureBtn) {
                removePictureBtn.style.display = 'none';
            }
        }
    }
}

function showSuccess(message) {
    // Use the existing showToast function if available
    if (typeof showToast === 'function') {
        showToast(message, 'success');
    } else {
        // Fallback to custom implementation
        console.log('Showing success:', message);
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
    console.log('Showing error:', message);
    // Use the existing showToast function if available
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

function showWarning(message) {
    console.log('Showing warning:', message);
    // Use the existing showToast function if available
    if (typeof showToast === 'function') {
        showToast(message, 'warning', 5000);
    } else {
        // Fallback to custom implementation
        const toast = document.createElement('div');
        toast.className = 'toast warning';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff3cd;
            color: #856404;
            padding: 15px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 10000;
            border: 1px solid #ffeaa7;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
                
                const headers = lines[0].split(',').map(h => h.trim().replace(/["']+/g, ''));
                
                const students = [];
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    
                    // Handle quoted values that may contain commas
                    const values = parseCSVLine(lines[i]);
                    const student = {};
                    
                    headers.forEach((header, index) => {
                        // Clean value by trimming whitespace and removing quotes and trailing carriage returns
                        const value = values[index] ? values[index].trim().replace(/["']+/g, '').replace(/\r$/, '') : '';
                        switch (header.toLowerCase()) {
                            case 'rollno':
                            case 'roll no':
                            case 'roll number':
                                student.rollNo = value;
                                break;
                            case 'name':
                            case 'student name':
                            case 'full name':
                                student.name = value;
                                break;
                            case 'section':
                            case 'class':
                                student.section = value;
                                break;
                            case 'email':
                            case 'email address':
                                student.email = value;
                                break;
                            case 'phone':
                            case 'phone number':
                            case 'mobile':
                                student.phone = value;
                                break;
                        }
                    });
                    
                    // Only add if we have required fields (rollNo, name, section)
                    // Validate that section is one of the allowed values
                    const validSections = ['B1', 'B2', 'B3'];
                    if (student.rollNo && student.name && student.section && validSections.includes(student.section)) {
                        students.push(student);
                    }
                }
                
                resolve(students);
            } catch (error) {
                reject(new Error(`Failed to parse CSV: ${error.message}`));
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
        
        const students = await parseCSVFile(file);
        console.log('Parsed students:', students);
        
        if (students.length === 0) {
            showError('No valid students found in the file. Please check the file format and try again.');
            importBtn.innerHTML = originalBtnText;
            importBtn.disabled = false;
            return;
        }
        
        // Validate that we have at least some students with required fields
        const validStudents = students.filter(s => s.rollNo && s.name && s.section);
        if (validStudents.length === 0) {
            showError('No students with required fields (RollNo, Name, Section) found in the file.');
            importBtn.innerHTML = originalBtnText;
            importBtn.disabled = false;
            return;
        }
        
        if (overwriteData) {
            // Clear existing data first if overwrite is selected
            await fetchData('students', {
                method: 'DELETE'
            });
        }
        
        // Add students to the database
        // Use bulk import endpoint for better performance
        const result = await fetchData('students/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(students)
        });
        
        closeModal();
        await loadStudentsData();
        updateStats();
        
        // Show detailed success message
        const successCount = result.results ? result.results.filter(r => r.success).length : students.length;
        const failedCount = result.results ? result.results.filter(r => !r.success).length : 0;
        
        if (failedCount > 0) {
            showWarning(`Students import completed: ${successCount} successful, ${failedCount} failed. Check the console for details.`);
        } else {
            showSuccess(`Students imported successfully (${successCount} students)`);
        }
        
        // Reset button state
        importBtn.innerHTML = originalBtnText;
        importBtn.disabled = false;
    } catch (error) {
        console.error('Failed to import students:', error);
        showError('Failed to import students: ' + error.message);
        
        // Reset button state on error
        const importBtn = event.target.querySelector('button[type="submit"]');
        if (importBtn) {
            importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Data';
            importBtn.disabled = false;
        }
    }
}

// Pagination functions
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderStudentsTable(studentsData);
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
    
    paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems} students`;
}

// Test function to manually show the dropdown for debugging
function testShowDropdown() {
    const exportDropdown = document.getElementById('exportDropdown');
    if (exportDropdown) {
        exportDropdown.classList.add('show');
        console.log('Dropdown manually shown');
        // Also try setting display directly
        exportDropdown.style.display = 'block';
        console.log('Dropdown display set to block');
    } else {
        console.log('Dropdown element not found');
    }
}

// Test function to manually hide the dropdown for debugging
function testHideDropdown() {
    const exportDropdown = document.getElementById('exportDropdown');
    if (exportDropdown) {
        exportDropdown.classList.remove('show');
        console.log('Dropdown manually hidden');
        // Also try setting display directly
        exportDropdown.style.display = 'none';
        console.log('Dropdown display set to none');
    } else {
        console.log('Dropdown element not found');
    }
}
