// Room Management JavaScript

// Add pagination variables
let roomsData = [];
let currentPage = 1;
let pageSize = 25;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeRooms();
    // Add a small delay to ensure DOM is fully loaded
    setTimeout(() => {
        initializeRollAssignments(); // Initialize the roll assignments section
    }, 100);
});

function setupEventListeners() {
    // Button event listeners
    const addRoomBtn = document.getElementById('addRoomBtn');
    if (addRoomBtn) {
        addRoomBtn.addEventListener('click', () => openAddRoomModal());
    }
    
    const importRoomsBtn = document.getElementById('importRoomsBtn');
    if (importRoomsBtn) {
        importRoomsBtn.addEventListener('click', () => openImportModal());
    }
    
    // Enhanced export dropdown functionality
    const exportRoomsBtn = document.getElementById('exportRoomsBtn');
    const exportDropdown = document.getElementById('exportRoomsDropdown');
    const exportPdfBtn = document.getElementById('exportRoomsPdfBtn');
    const exportCsvBtn = document.getElementById('exportRoomsCsvBtn');
    const exportExcelBtn = document.getElementById('exportRoomsExcelBtn');
    
    if (exportRoomsBtn && exportDropdown) {
        // Toggle dropdown on button click
        exportRoomsBtn.addEventListener('click', function(e) {
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
                !exportRoomsBtn.contains(e.target) && 
                !exportDropdown.contains(e.target)) {
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            }
        });
        
        // Export handlers
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportRoomsAsPDF();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportRoomsAsCSV();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportRoomsAsExcel();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
    }
    
    const clearAllRoomBtn = document.getElementById('clearAllRoomBtn');
    if (clearAllRoomBtn) {
        clearAllRoomBtn.addEventListener('click', clearAllRooms);
    }
    
    // Form submission
    const roomForm = document.getElementById('roomForm');
    if (roomForm) {
        roomForm.addEventListener('submit', handleRoomSubmit);
    }
    
    const importForm = document.getElementById('importForm');
    if (importForm) {
        importForm.addEventListener('submit', handleImportSubmit);
    }
    
    // Search functionality with debouncing
    const roomSearch = document.getElementById('roomSearch');
    if (roomSearch) {
        roomSearch.addEventListener('input', debouncedSearch);
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
            loadRooms();
        });
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });
    
    // Refresh assignments button
    const refreshAssignmentsBtn = document.getElementById('refreshAssignmentsBtn');
    if (refreshAssignmentsBtn) {
        refreshAssignmentsBtn.addEventListener('click', loadRollAssignments);
    }
    
    // Export assignments button
    const exportAssignmentsBtn = document.getElementById('exportAssignmentsBtn');
    if (exportAssignmentsBtn) {
        exportAssignmentsBtn.addEventListener('click', exportAssignments);
    }
    
    // Shuffle classrooms button
    const shuffleClassroomsBtn = document.getElementById('shuffleClassroomsBtn');
    if (shuffleClassroomsBtn) {
        shuffleClassroomsBtn.addEventListener('click', shuffleClassrooms);
    }
}

// Add a debounced search function to improve performance
let searchTimeout;
function debouncedSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage = 1; // Reset to first page when search changes
        loadRooms();
    }, 300); // 300ms delay
}

async function initializeRooms() {
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 60000); // Update every minute
    
    // Load rooms data
    await loadRooms();
}

async function initializeRollAssignments() {
    // Load roll assignments data
    await loadRollAssignments();
}

async function loadRooms() {
    try {
        showLoadingOverlay('Loading rooms...');
        const searchTerm = document.getElementById('roomSearch')?.value || '';
        
        // Build query parameters
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        
        // Fetch rooms from API with search parameters
        roomsData = await fetchData(`rooms?${params.toString()}`);
        
        // Calculate pagination
        totalPages = Math.ceil(roomsData.length / pageSize);
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        renderRoomsTable(roomsData);
        updateStats(roomsData);
        updatePaginationControls();
        
        // Also refresh roll assignments when rooms are loaded
        // Add a small delay to ensure the DOM is ready
        setTimeout(() => {
            loadRollAssignments();
        }, 100);
        hideLoadingOverlay();
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to load rooms:', error);
        showToast('Failed to load rooms: ' + error.message, 'error');
    }
}

// Pagination functions
function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderRoomsTable(roomsData);
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
    
    paginationInfo.textContent = `Showing ${startIndex}-${endIndex} of ${totalItems} rooms`;
}

// Render rooms table
function renderRoomsTable(data) {
    const tableBody = document.getElementById('roomsTableBody');
    
    if (!tableBody) return;
    
    // Calculate pagination indices
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, data.length);
    const paginatedData = data.slice(startIndex, endIndex);
    
    if (paginatedData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-door-open" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                    <h3>No Rooms Found</h3>
                    <p>Add rooms or import from CSV to get started</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    paginatedData.forEach(room => {
        html += `
            <tr>
                <td>${room.number}</td>
                <td>${room.building}</td>
                <td>${room.capacity}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-btn" data-id="${room._id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-btn" data-id="${room._id}">
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
        const roomId = button.dataset.id;
        // Clone the button to remove all event listeners
        const newButton = button.cloneNode(true);
        newButton.addEventListener('click', () => {
            editRoom(roomId);
        });
        button.parentNode.replaceChild(newButton, button);
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        const roomId = button.dataset.id;
        // Clone the button to remove all event listeners
        const newButton = button.cloneNode(true);
        newButton.addEventListener('click', () => {
            deleteRoom(roomId);
        });
        button.parentNode.replaceChild(newButton, button);
    });
    
    // Update pagination info
    updatePaginationInfo(data.length);
}

// Update statistics
function updateStats(roomsData) {
    const totalRooms = roomsData.length;
    const totalCapacity = roomsData.reduce((sum, room) => sum + room.capacity, 0);
    const avgCapacity = totalRooms > 0 ? Math.round(totalCapacity / totalRooms) : 0;
    
    document.getElementById('totalRooms').textContent = totalRooms;
    document.getElementById('totalCapacity').textContent = totalCapacity;
    document.getElementById('avgCapacity').textContent = avgCapacity;
}

// Open add room modal
function openAddRoomModal() {
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-door-open"></i> Add Room';
    document.getElementById('roomId').value = '';
    document.getElementById('roomNumber').value = '';
    document.getElementById('building').value = '';
    document.getElementById('capacity').value = '';
    document.getElementById('roomModal').style.display = 'flex';
}

// Edit room
function editRoom(roomId) {
    // Find the row with the matching roomId
    const row = document.querySelector(`button[data-id="${roomId}"]`).closest('tr');
    if (!row) return;
    
    const cells = row.querySelectorAll('td');
    const roomNumber = cells[0].textContent;
    const building = cells[1].textContent;
    const capacity = cells[2].textContent;
    
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Room';
    document.getElementById('roomId').value = roomId;
    document.getElementById('roomNumber').value = roomNumber;
    document.getElementById('building').value = building;
    document.getElementById('capacity').value = capacity;
    document.getElementById('roomModal').style.display = 'flex';
}

// Close modal
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

// Handle room form submission
async function handleRoomSubmit(e) {
    e.preventDefault();
    
    const roomId = document.getElementById('roomId').value;
    const isUpdate = !!roomId;
    
    const roomData = {
        number: (document.getElementById('roomNumber').value || '').trim(),
        building: (document.getElementById('building').value || '').trim(),
        capacity: parseInt(document.getElementById('capacity').value) || 0
    };
    
    // Validate required fields
    if (!roomData.number) {
        showToast('Room number is required', 'error');
        document.getElementById('roomNumber').focus();
        return;
    }
    
    if (!roomData.building) {
        showToast('Building is required', 'error');
        document.getElementById('building').focus();
        return;
    }
    
    if (!roomData.capacity || roomData.capacity <= 0) {
        showToast('Capacity must be a positive number', 'error');
        document.getElementById('capacity').focus();
        return;
    }
    
    try {
        await saveRoomAndNotify(roomData, isUpdate, roomId);
    } catch (error) {
        // Error is handled in saveRoomAndNotify
        console.error('Error in handleRoomSubmit:', error);
    }
}

// Delete room
async function deleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room?')) {
        return;
    }
    
    try {
        await deleteRoomAndNotify(roomId);
    } catch (error) {
        // Error is handled in deleteRoomAndNotify
        console.error('Error in deleteRoom:', error);
    }
}

// Clear all rooms function
async function clearAllRooms() {
    if (!confirm('Are you sure you want to clear all rooms? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Call the clear all rooms API endpoint using fetchData utility
        const result = await fetchData('rooms', {
            method: 'DELETE'
        });
        
        // Show success message
        showToast('All rooms cleared successfully!', 'success');
        
        // Refresh the rooms display
        await loadRooms();
    } catch (error) {
        console.error('Failed to clear all rooms:', error);
        showToast('Failed to clear all rooms: ' + error.message, 'error');
    }
}

// Open import modal
function openImportModal() {
    console.log('openImportModal called');
    const modal = document.getElementById('importModal');
    const importForm = document.getElementById('importForm');
    
    // Reset form
    if (importForm) {
        console.log('Resetting import form');
        importForm.reset();
    }
    
    if (modal) {
        console.log('Showing import modal');
        modal.style.display = 'flex';
    } else {
        console.log('Import modal not found');
    }
}

// Close import modal
function closeImportModal() {
    console.log('closeImportModal called');
    document.getElementById('importModal').style.display = 'none';
}

// Process rooms data from CSV
function processRoomsData(csvData) {
    if (!csvData || !Array.isArray(csvData)) {
        throw new Error('Invalid CSV data provided');
    }
    
    return csvData.map(row => {
        // Handle different possible column names with better error handling
        const number = row['Room Number'] || row['room_number'] || row['number'] || row['Room No.'] || row['Room'] || '';
        const building = row['Building'] || row['building'] || row['Location'] || row['location'] || row['Block'] || '';
        const capacity = parseInt(row['Capacity'] || row['capacity'] || row['Seating Capacity'] || row['seats'] || '0');
        
        return {
            number: number.toString().trim(),
            building: building.toString().trim(),
            capacity: isNaN(capacity) ? 0 : capacity
        };
    }).filter(room => room.number && room.building); // Filter out invalid rooms
}

// Handle import form submission
async function handleImportSubmit(event) {
    event.preventDefault();
    
    try {
        const formData = new FormData(event.target);
        const file = formData.get('csvFile');
        // Fix checkbox handling - it returns "on" when checked, null when unchecked
        const overwriteData = formData.get('overwriteData') === 'on';
        
        if (!file) {
            showToast('No file selected. Please choose a CSV or Excel file to import.', 'error');
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
        let fileData;
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            // Parse CSV file
            fileData = await parseCSV(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                   file.type === 'application/vnd.ms-excel' || 
                   file.name.endsWith('.xlsx') || 
                   file.name.endsWith('.xls')) {
            // Parse Excel file
            fileData = await parseExcel(file);
        } else {
            showToast('Please select a valid CSV or Excel file.', 'error');
            return;
        }
        
        console.log('Raw file data:', fileData);
        
        // Show loading state
        const importBtn = event.target.querySelector('button[type="submit"]');
        const originalBtnText = importBtn.innerHTML;
        importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        importBtn.disabled = true;
        
        // Process rooms data
        const rooms = processRoomsData(fileData.data);
        console.log('Processed rooms:', rooms);
        
        if (rooms.length === 0) {
            showToast('No valid rooms found in the file. Please check the file format and try again.', 'error');
            importBtn.innerHTML = originalBtnText;
            importBtn.disabled = false;
            return;
        }
        
        if (overwriteData) {
            // Clear existing data first if overwrite is selected
            await fetchData('rooms', {
                method: 'DELETE'
            });
        }
        
        // Add rooms to the database
        // Use bulk import endpoint for better performance
        const result = await fetchData('rooms/bulk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rooms)
        });
        
        closeImportModal();
        await loadRooms();
        updateStats(roomsData);
        
        // Show detailed success message
        const successCount = result.results ? result.results.filter(r => r.success).length : rooms.length;
        const failedCount = result.results ? result.results.filter(r => !r.success).length : 0;
        
        if (failedCount > 0) {
            showToast(`Rooms import completed: ${successCount} successful, ${failedCount} failed. Check the console for details.`, 'warning');
        } else {
            showToast(`Rooms imported successfully (${successCount} rooms)`, 'success');
        }
        
        // Reset button state
        importBtn.innerHTML = originalBtnText;
        importBtn.disabled = false;
    } catch (error) {
        console.error('Failed to import rooms:', error);
        showToast('Failed to import rooms: ' + error.message, 'error');
        
        // Reset button state on error
        const importBtn = event.target.querySelector('button[type="submit"]');
        if (importBtn) {
            importBtn.innerHTML = '<i class="fas fa-upload"></i> Import Data';
            importBtn.disabled = false;
        }
    }
}

// Export rooms to CSV (deprecated - keeping for backward compatibility)
// function exportRooms() {
//     try {
//         // Generate CSV content
//         generateRoomsCSV();
//     } catch (error) {
//         console.error('Failed to export rooms:', error);
//         showToast('Failed to export rooms: ' + error.message, 'error');
//     }
// }

// Generate CSV from rooms data
function generateRoomsCSV() {
    fetchData('rooms')
        .then(roomsData => {
            if (roomsData.length === 0) {
                showToast('No rooms to export', 'warning');
                return;
            }
            
            // Prepare data for CSV with additional information
            const csvData = roomsData.map(room => ({
                "Room Number": room.number,
                "Building": room.building,
                "Capacity": room.capacity,
                "ID": room._id
            }));
            
            // Generate CSV using the enhanced CSV generator
            const csvContent = generateCSV(csvData, ['Room Number', 'Building', 'Capacity', 'ID']);
            
            // Create download link with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `rooms_export_${timestamp}.csv`;
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('Rooms exported successfully', 'success');
        })
        .catch(error => {
            console.error('Failed to fetch rooms for export:', error);
            showToast('Failed to export rooms: ' + error.message, 'error');
        });
}

// Export roll assignments to CSV
function exportRollAssignments() {
    try {
        // Generate CSV content
        generateRollAssignmentsCSV();
    } catch (error) {
        console.error('Failed to export roll assignments:', error);
        showToast('Failed to export roll assignments: ' + error.message, 'error');
    }
}

// Generate roll assignments using Python script
async function generateRollAssignmentsWithPython() {
    try {
        console.log('Generating roll assignments with Python script...');
        // Show loading state
        const tableBody = document.getElementById('rollAssignmentsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-600); margin-bottom: 1rem;"></i>
                        <p>Generating room assignments with Python script...</p>
                    </td>
                </tr>
            `;
        }

        // Call the new API endpoint using fetchData utility
        console.log('Calling fetchData with endpoint: roomAssignments');
        const result = await fetchData('roomAssignments');
        console.log('Received result from roomAssignments endpoint:', result);
        
        // Render the assignments from the Python script
        renderRollAssignmentsTableFromPython(result.assignments);
        
        // Show success message with statistics
        const stats = result.stats;
        showToast(`Room assignments generated: ${stats.assigned_students}/${stats.total_students} students assigned`, 'success');
    } catch (error) {
        console.error('Failed to generate roll assignments with Python:', error);
        showToast('Failed to generate roll assignments: ' + error.message, 'error');
        
        // Show error in table
        const tableBody = document.getElementById('rollAssignmentsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--error-600);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Failed to generate room assignments: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Render roll assignments table from Python script data
function renderRollAssignmentsTableFromPython(assignments) {
    const tableBody = document.getElementById('rollAssignmentsTableBody');
    
    if (!tableBody) {
        console.log('rollAssignmentsTableBody not found');
        return;
    }

    // Handle case where assignments might be wrapped in an object
    let assignmentsData = assignments;
    if (assignments && !Array.isArray(assignments) && assignments.assignments) {
        assignmentsData = assignments.assignments;
    }

    console.log('Rendering assignments data:', assignmentsData);

    if (!assignmentsData || assignmentsData.length === 0) {
        console.log('No assignments data to render');
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-door-open" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                    <h3>No Room Assignments Found</h3>
                    <p>Generate seating arrangements to see roll number assignments</p>
                    <button id="generateSampleAssignmentsBtn" class="btn btn-primary" style="margin-top: 1rem;">
                        <i class="fas fa-cogs"></i> Generate Sample Assignments
                    </button>
                </td>
            </tr>
        `;
        // Add event listener to the generate button
        const generateBtn = document.getElementById('generateSampleAssignmentsBtn');
        if (generateBtn) {
            // Remove any existing event listeners to prevent duplicates
            const newBtn = generateBtn.cloneNode(true);
            newBtn.addEventListener('click', generateSampleAssignments);
            generateBtn.parentNode.replaceChild(newBtn, generateBtn);
        }
        return;
    }

    let html = '';

    assignmentsData.forEach(assignment => {
        // Format roll numbers as tags (they're already sorted)
        const rollNumbersHtml = assignment.students && assignment.students.length > 0 
            ? assignment.students
                .map(student => `<span class="roll-number-tag">${student.rollNo || 'N/A'}</span>`)
                .join('')
            : '<span class="no-assignments">No roll numbers assigned</span>';

        html += `
            <tr>
                <td>${assignment.number || assignment.roomNumber || 'N/A'}</td>
                <td>${assignment.building || 'N/A'}</td>
                <td>${assignment.capacity || 0}</td>
                <td class="roll-numbers-cell">${rollNumbersHtml}</td>
                <td>${assignment.students ? assignment.students.length : 0}</td>
            </tr>
        `;
    });

    console.log('Generated HTML for assignments table:', html);
    tableBody.innerHTML = html;
    
    // Add event listener to any generate buttons that might have been added
    const generateBtn = document.getElementById('generateSampleAssignmentsBtn');
    if (generateBtn) {
        // Remove any existing event listeners to prevent duplicates
        const newBtn = generateBtn.cloneNode(true);
        newBtn.addEventListener('click', generateSampleAssignments);
        generateBtn.parentNode.replaceChild(newBtn, generateBtn);
    }
}

// Update the generateRollAssignmentsCSV function with the same logic
function generateRollAssignmentsCSV() {
    Promise.all([
        fetchData('rooms'),
        fetchData('seatingPlans'),
        fetchData('students')
    ])
        .then(([rooms, seatingPlans, students]) => {
            // Create a map of student ID to student data for quick lookup
            const studentMap = {};
            students.forEach(student => {
                studentMap[student._id] = student;
            });

            // Create a map of room ID to room details
            const roomMap = {};
            rooms.forEach(room => {
                roomMap[room._id] = {
                    ...room,
                    rollNumbers: []
                };
            });

            // Process seating plans to extract roll numbers for each room
            seatingPlans.forEach(plan => {
                const roomId = plan.roomId;
                if (roomId && roomMap[roomId]) {
                    // Extract roll numbers from seats
                    if (plan.seats && Array.isArray(plan.seats)) {
                        plan.seats.forEach(seat => {
                            // Check if the seat has a student assigned and is not a teacher desk
                            if (seat.studentId && !seat.isTeacherDesk) {
                                // First try to get roll number directly from seat data
                                if (seat.rollNo) {
                                    // Add roll number to the room's list if not already present
                                    if (!roomMap[roomId].rollNumbers.includes(seat.rollNo)) {
                                        roomMap[roomId].rollNumbers.push(seat.rollNo);
                                    }
                                } else {
                                    // Fallback to looking up the student to get their roll number
                                    const student = studentMap[seat.studentId];
                                    if (student && student.rollNo) {
                                        // Add roll number to the room's list if not already present
                                        if (!roomMap[roomId].rollNumbers.includes(student.rollNo)) {
                                            roomMap[roomId].rollNumbers.push(student.rollNo);
                                        }
                                    }
                                }
                            }
                        });
                    }
                }
            });

            // Convert map to array and sort by room number
            const assignments = Object.values(roomMap).sort((a, b) => {
                // Sort by building first, then by room number
                if (a.building !== b.building) {
                    return a.building.localeCompare(b.building);
                }
                return a.number.localeCompare(b.number);
            });

            if (assignments.length === 0) {
                showToast('No room assignments to export', 'warning');
                return;
            }

            // Sort roll numbers in each assignment before exporting
            assignments.forEach(assignment => {
                if (assignment.rollNumbers && assignment.rollNumbers.length > 0) {
                    assignment.rollNumbers.sort((a, b) => {
                        // Improved sorting for roll numbers like "AIDSU24001"
                        // Extract the numeric part and sort by it
                        const numA = parseInt(a.match(/\d+/g)?.join('') || '0');
                        const numB = parseInt(b.match(/\d+/g)?.join('') || '0');
                        return numA - numB;
                    });
                }
            });

            // Prepare data for CSV with better formatting
            const csvData = assignments.map(assignment => ({
                "Room Number": assignment.number,
                "Building": assignment.building,
                "Capacity": assignment.capacity,
                "Assigned Students": assignment.rollNumbers.length,
                "Roll Numbers": assignment.rollNumbers.join('; ')
            }));

            // Generate CSV with timestamped filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const filename = `room_roll_assignments_${timestamp}.csv`;
            
            const csvContent = generateCSV(csvData, ['Room Number', 'Building', 'Capacity', 'Assigned Students', 'Roll Numbers']);

            // Create download link
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast('Room assignments exported successfully', 'success');
        })
        .catch(error => {
            console.error('Failed to fetch data for export:', error);
            showToast('Failed to export room assignments: ' + error.message, 'error');
        });
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

// New function to notify user interface of changes
async function notifyUserInterfaceOfChanges() {
    try {
        // In a real implementation, this could send WebSocket messages
        // For now, we'll just log that changes were made and refresh the display
        console.log('Notifying user interface of changes...');
        
        // Refresh the roll assignments display
        await loadRollAssignments();
    } catch (error) {
        console.error('Error notifying user interface of changes:', error);
    }
}

// Enhanced function to save room data and notify user interface
async function saveRoomAndNotify(roomData, isUpdate = false, roomId = null) {
    try {
        showLoadingOverlay(isUpdate ? 'Updating room...' : 'Adding room...');
        
        const endpoint = isUpdate ? `rooms/${roomId}` : 'rooms';
        const method = isUpdate ? 'PUT' : 'POST';
        
        const response = await fetchData(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(roomData)
        });
        
        hideLoadingOverlay();
        
        if (isUpdate) {
            showToast('Room updated successfully!', 'success');
        } else {
            showToast('Room added successfully!', 'success');
        }
        
        // Close the modal
        closeModal();
        
        // Refresh rooms list
        await loadRooms();
        
        // Notify user interface of changes
        await notifyUserInterfaceOfChanges();
        
        return response;
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to save room:', error);
        
        if (error.message.includes('already exists')) {
            showToast('A room with this number and building already exists!', 'error');
        } else {
            showToast(`Failed to save room: ${error.message}`, 'error');
        }
        
        throw error;
    }
}

// Enhanced function to delete room and notify user interface
async function deleteRoomAndNotify(roomId) {
    try {
        showLoadingOverlay('Deleting room...');
        
        await fetchData(`rooms/${roomId}`, {
            method: 'DELETE'
        });
        
        hideLoadingOverlay();
        showToast('Room deleted successfully!', 'success');
        
        // Refresh rooms list
        await loadRooms();
        
        // Notify user interface of changes
        await notifyUserInterfaceOfChanges();
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to delete room:', error);
        showToast(`Failed to delete room: ${error.message}`, 'error');
        throw error;
    }
}

// Enhanced function to clear all rooms and notify user interface
async function clearAllRoomsAndNotify() {
    if (!confirm('Are you sure you want to delete ALL rooms? This action cannot be undone.')) {
        return;
    }
    
    try {
        showLoadingOverlay('Clearing all rooms...');
        
        await fetchData('rooms', {
            method: 'DELETE'
        });
        
        hideLoadingOverlay();
        showToast('All rooms cleared successfully!', 'success');
        
        // Refresh rooms list
        await loadRooms();
        
        // Notify user interface of changes
        await notifyUserInterfaceOfChanges();
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to clear rooms:', error);
        showToast(`Failed to clear rooms: ${error.message}`, 'error');
        throw error;
    }
}

// Enhanced function to generate seating arrangements and notify user interface
async function generateSeatingArrangementsAndNotify() {
    try {
        showLoadingOverlay('Generating seating arrangements...');
        
        // Fetch rooms and students data
        const [rooms, students] = await Promise.all([
            fetchData('rooms'),
            fetchData('students')
        ]).catch(error => {
            throw new Error('Failed to fetch required data: ' + error.message);
        });
        
        if (!Array.isArray(rooms) || rooms.length === 0) {
            hideLoadingOverlay();
            showToast('No rooms available. Please add rooms first.', 'warning');
            await loadRollAssignments();
            return;
        }
        
        if (!Array.isArray(students) || students.length === 0) {
            hideLoadingOverlay();
            showToast('No students available. Please add students first.', 'warning');
            await loadRollAssignments();
            return;
        }
        
        // Clear existing seating plans
        await fetchData('seatingPlans', {
            method: 'DELETE'
        });
        
        // Sort students by roll number to maintain sequence
        const sortedStudents = [...students].sort((a, b) => {
            // Improved sorting for roll numbers like "AIDSU24001"
            // Extract the numeric part and sort by it
            const numA = parseInt((a.rollNo || '').match(/\d+/g)?.join('') || '0');
            const numB = parseInt((b.rollNo || '').match(/\d+/g)?.join('') || '0');
            return numA - numB;
        });
        
        // Shuffle rooms randomly
        const shuffledRooms = [...rooms].sort(() => Math.random() - 0.5);
        
        // Distribute students to rooms evenly while maintaining sequence
        const seatingPlans = [];
        const totalStudents = sortedStudents.length;
        const totalRooms = shuffledRooms.length;
        
        // Calculate base allocation and remainder
        const baseAllocation = Math.floor(totalStudents / totalRooms);
        let remainder = totalStudents % totalRooms;
        
        let studentIndex = 0;
        
        for (let roomIndex = 0; roomIndex < totalRooms; roomIndex++) {
            const room = shuffledRooms[roomIndex];
            
            // Validate room data
            if (!room || !room._id || !room.number || !room.building) {
                console.warn('Invalid room data, skipping:', room);
                continue;
            }
            
            // Create a seating plan for this room with the correct structure
            const planData = {
                roomId: room._id,
                building: room.building || '',
                roomNumber: room.number || '',
                capacity: room.capacity || 0,
                rows: Math.ceil((room.capacity || 0) / 5),
                columns: 5,
                seats: []
            };
            
            // Determine how many students this room should get
            // Each room gets base allocation, and first 'remainder' rooms get one extra
            let studentsForThisRoom = baseAllocation;
            if (roomIndex < remainder) {
                studentsForThisRoom++;
            }
            
            // But don't exceed room capacity
            studentsForThisRoom = Math.min(studentsForThisRoom, room.capacity || 0);
            
            // Assign students to this room (consecutive block from the sorted list)
            for (let i = 0; i < studentsForThisRoom && studentIndex < totalStudents; i++) {
                if (studentIndex < sortedStudents.length) {
                    const student = sortedStudents[studentIndex];
                    // Validate student data
                    if (!student || !student._id || !student.rollNo) {
                        console.warn('Invalid student data, skipping:', student);
                        continue;
                    }
                    
                    planData.seats.push({
                        id: `seat-${room._id}-${i}`,
                        row: Math.floor(i / 5), // Assuming 5 seats per row
                        col: i % 5,
                        studentId: student._id,
                        rollNo: student.rollNo,
                        isTeacherDesk: false
                    });
                    studentIndex++;
                }
            }
            
            // Add the seating plan with proper structure
            const plan = {
                planData: planData,
                examDate: new Date().toISOString().split('T')[0],
                examCode: `SHUF_${Date.now().toString().slice(-4)}${room._id.toString().slice(-2)}` // Use short format to match backend
            };
            seatingPlans.push(plan);
        }
        
        // Save the seating plans to the database
        let successCount = 0;
        let errorCount = 0;
        
        for (const plan of seatingPlans) {
            try {
                await fetchData('seatingPlans', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(plan)
                });
                successCount++;
            } catch (error) {
                errorCount++;
                console.warn('Failed to save seating plan for room:', plan.planData?.roomNumber || 'Unknown', error);
            }
        }
        
        hideLoadingOverlay();
        
        if (errorCount > 0) {
            showToast(`Seating arrangements generated for ${successCount} rooms (${errorCount} failed)!`, 'warning');
        } else {
            showToast(`Seating arrangements generated for ${successCount} rooms!`, 'success');
        }
        
        // Refresh the assignments display
        await loadRollAssignments();
        
        // Notify user interface of changes
        await notifyUserInterfaceOfChanges();
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to generate seating arrangements:', error);
        showToast('Failed to generate seating arrangements: ' + (error.message || 'Unknown error occurred'), 'error');
        await loadRollAssignments();
    }
}

// Enhanced shuffle classrooms function that notifies user interface
async function shuffleClassroomsAndNotify() {
    console.log('Shuffle classrooms function called');
    
    if (!confirm('Are you sure you want to shuffle all classrooms? This will redistribute students among rooms while maintaining their sequence.')) {
        return;
    }
    
    try {
        console.log('User confirmed shuffle operation');
        
        showLoadingOverlay('Shuffling classrooms and redistributing students...');

        // Call the shuffle API endpoint using fetchData utility
        console.log('Calling shuffleClassrooms API endpoint');
        const result = await fetchData('shuffleClassrooms', {
            method: 'POST'
        });
        
        console.log('Shuffle API response:', result);
        
        hideLoadingOverlay();
        
        // Show success message
        showToast('Classrooms shuffled successfully!', 'success');
        
        // Refresh the assignments display
        await loadRollAssignments();
        
        // Notify user interface of changes
        await notifyUserInterfaceOfChanges();
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to shuffle classrooms:', error);
        showToast('Failed to shuffle classrooms: ' + (error.message || 'Unknown error occurred'), 'error');
        
        // Still refresh the assignments display even on error
        await loadRollAssignments();
    }
}

// Export assignments function
async function exportAssignments() {
    try {
        showLoadingOverlay('Exporting assignments...');
        
        // Fetch the assignments data
        const result = await fetchData('roomAssignments');
        
        if (!result || !result.assignments || result.assignments.length === 0) {
            hideLoadingOverlay();
            showToast('No assignments to export', 'warning');
            return;
        }
        
        // Prepare data for CSV export
        const csvData = result.assignments.map(assignment => ({
            "Room Number": assignment.number,
            "Building": assignment.building,
            "Capacity": assignment.capacity,
            "Assigned Students": assignment.students ? assignment.students.length : 0,
            "Roll Numbers": assignment.students ? assignment.students.map(s => s.rollNo).join('; ') : ''
        }));
        
        // Generate CSV
        const csvContent = generateCSV(csvData);
        
        // Create download link with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `room_assignments_${timestamp}.csv`;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        hideLoadingOverlay();
        showToast('Assignments exported successfully', 'success');
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export assignments:', error);
        showToast('Failed to export assignments: ' + error.message, 'error');
    }
}

// Shuffle classrooms function
async function shuffleClassrooms() {
    await shuffleClassroomsAndNotify();
}

// Add the missing loadRollAssignments function
async function loadRollAssignments() {
    try {
        console.log('Loading roll assignments...');
        // Show loading state
        const tableBody = document.getElementById('rollAssignmentsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-600); margin-bottom: 1rem;"></i>
                        <p>Loading room assignments...</p>
                    </td>
                </tr>
            `;
        }

        // Try to fetch assignments from the new API endpoint
        console.log('Fetching room assignments from API...');
        const result = await fetchData('roomAssignments');
        console.log('Room assignments API response:', result);
        
        if (result && (result.assignments || (Array.isArray(result) && result.length > 0))) {
            console.log('Rendering assignments data...');
            // Use the new endpoint's data
            renderRollAssignmentsTableFromPython(result);
        } else {
            console.log('No assignments found, showing empty state');
            // If no assignments exist, show empty state
            renderRollAssignmentsTableFromPython([]);
        }
    } catch (error) {
        console.error('Failed to load roll assignments:', error);
        showToast('Failed to load roll assignments: ' + error.message, 'error');
        
        // Show error in table
        const tableBody = document.getElementById('rollAssignmentsTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem; color: var(--error-600);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Failed to load room assignments: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
    }
}

// Export rooms to PDF
async function exportRoomsAsPDF() {
    try {
        showLoadingOverlay('Exporting rooms as PDF...');
        
        // Ensure we have the latest data
        if (roomsData.length === 0) {
            await loadRooms();
        }
        
        // Prepare data for export
        const headers = ['Room Number', 'Building', 'Capacity'];
        const data = roomsData.map(room => [
            room.number || '',
            room.building || '',
            room.capacity || ''
        ]);
        
        const metadata = {
            'Total Rooms': roomsData.length,
            'Total Capacity': roomsData.reduce((sum, room) => sum + (parseInt(room.capacity) || 0), 0),
            'Export Format': 'PDF'
        };
        
        // Export using the standardized utility
        // Note: exportToPDF now works asynchronously with callbacks
        exportToPDF({
            title: 'Room Management Report',
            headers,
            data,
            filename: `rooms_export_${new Date().toISOString().slice(0, 10)}.pdf`,
            metadata
        });
        
        // Don't hide the loading overlay here since exportToPDF is asynchronous
        // The overlay and success message will be handled by the callback in exportToPDF
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export rooms as PDF:', error);
        showToast('Failed to export rooms as PDF: ' + error.message, 'error');
    }
}

// Export Rooms to Excel
async function exportRoomsAsExcel() {
    try {
        showLoadingOverlay('Exporting rooms as Excel...');
        
        // Ensure we have the latest data
        if (roomsData.length === 0) {
            await loadRooms();
        }
        
        // Prepare data for export
        const headers = ['Room Number', 'Building', 'Capacity'];
        const data = roomsData.map(room => [
            room.number || '',
            room.building || '',
            room.capacity || ''
        ]);
        
        const metadata = {
            'Total Rooms': roomsData.length,
            'Total Capacity': roomsData.reduce((sum, room) => sum + (parseInt(room.capacity) || 0), 0),
            'Export Format': 'Excel'
        };
        
        // Export using the standardized utility
        const success = exportToExcel({
            title: 'Room Management Report',
            headers,
            data,
            filename: `rooms_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showToast('Rooms exported as Excel successfully', 'success');
        } else {
            showToast('Failed to export rooms as Excel', 'error');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export rooms as Excel:', error);
        showToast('Failed to export rooms as Excel: ' + error.message, 'error');
    }
}

// Export Rooms to CSV
async function exportRoomsAsCSV() {
    try {
        showLoadingOverlay('Exporting rooms as CSV...');
        
        // Ensure we have the latest data
        if (roomsData.length === 0) {
            await loadRooms();
        }
        
        // Prepare data for export
        const headers = ['Room Number', 'Building', 'Capacity'];
        const data = roomsData.map(room => [
            room.number || '',
            room.building || '',
            room.capacity || ''
        ]);
        
        const metadata = {
            'Total Rooms': roomsData.length,
            'Total Capacity': roomsData.reduce((sum, room) => sum + (parseInt(room.capacity) || 0), 0),
            'Export Format': 'CSV'
        };
        
        // Export using the standardized utility
        const success = exportToCSV({
            title: 'Room Management Report',
            headers,
            data,
            filename: `rooms_export_${new Date().toISOString().slice(0, 10)}.csv`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showToast('Rooms exported as CSV successfully', 'success');
        } else {
            showToast('Failed to export rooms as CSV', 'error');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export rooms as CSV:', error);
        showToast('Failed to export rooms as CSV: ' + error.message, 'error');
    }
}

// Setup export event listeners for rooms
function setupRoomExportListeners() {
    // Export dropdown functionality
    const exportDropdown = document.getElementById('exportRoomsDropdown');
    const exportPdfBtn = document.getElementById('exportRoomsPdfBtn');
    const exportCsvBtn = document.getElementById('exportRoomsCsvBtn');
    const exportExcelBtn = document.getElementById('exportRoomsExcelBtn');
    const exportRoomsBtn = document.getElementById('exportRoomsBtn');
    
    if (exportRoomsBtn && exportDropdown) {
        // Toggle dropdown on button click
        exportRoomsBtn.addEventListener('click', function(e) {
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
                !exportRoomsBtn.contains(e.target) && 
                !exportDropdown.contains(e.target)) {
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            }
        });
        
        // Export handlers
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportRoomsAsPDF();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportRoomsAsCSV();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                exportRoomsAsExcel();
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            });
        }
    }
}

// Export Rooms to PDF
async function exportRoomsAsPDF() {
    try {
        showLoadingOverlay('Exporting rooms as PDF...');
        
        // Ensure we have the latest data
        if (roomsData.length === 0) {
            await loadRooms();
        }
        
        // Prepare data for export
        const headers = ['Room Number', 'Building', 'Capacity'];
        const data = roomsData.map(room => [
            room.number || '',
            room.building || '',
            room.capacity || ''
        ]);
        
        const metadata = {
            'Total Rooms': roomsData.length,
            'Total Capacity': roomsData.reduce((sum, room) => sum + (parseInt(room.capacity) || 0), 0),
            'Export Format': 'PDF'
        };
        
        // Export using the standardized utility
        const success = exportToPDF({
            title: 'Room Management Report',
            headers,
            data,
            filename: `rooms_export_${new Date().toISOString().slice(0, 10)}.pdf`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showToast('Rooms exported as PDF successfully', 'success');
        } else {
            showToast('Failed to export rooms as PDF', 'error');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export rooms as PDF:', error);
        showToast('Failed to export rooms as PDF: ' + error.message, 'error');
    }
}

// Export Rooms to Excel
async function exportRoomsAsExcel() {
    try {
        showLoadingOverlay('Exporting rooms as Excel...');
        
        // Ensure we have the latest data
        if (roomsData.length === 0) {
            await loadRooms();
        }
        
        // Prepare data for export
        const headers = ['Room Number', 'Building', 'Capacity'];
        const data = roomsData.map(room => [
            room.number || '',
            room.building || '',
            room.capacity || ''
        ]);
        
        const metadata = {
            'Total Rooms': roomsData.length,
            'Total Capacity': roomsData.reduce((sum, room) => sum + (parseInt(room.capacity) || 0), 0),
            'Export Format': 'Excel'
        };
        
        // Export using the standardized utility
        const success = exportToExcel({
            title: 'Room Management Report',
            headers,
            data,
            filename: `rooms_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showToast('Rooms exported as Excel successfully', 'success');
        } else {
            showToast('Failed to export rooms as Excel', 'error');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export rooms as Excel:', error);
        showToast('Failed to export rooms as Excel: ' + error.message, 'error');
    }
}

// Export Rooms to CSV
async function exportRoomsAsCSV() {
    try {
        showLoadingOverlay('Exporting rooms as CSV...');
        
        // Ensure we have the latest data
        if (roomsData.length === 0) {
            await loadRooms();
        }
        
        // Prepare data for export
        const headers = ['Room Number', 'Building', 'Capacity'];
        const data = roomsData.map(room => [
            room.number || '',
            room.building || '',
            room.capacity || ''
        ]);
        
        const metadata = {
            'Total Rooms': roomsData.length,
            'Total Capacity': roomsData.reduce((sum, room) => sum + (parseInt(room.capacity) || 0), 0),
            'Export Format': 'CSV'
        };
        
        // Export using the standardized utility
        const success = exportToCSV({
            title: 'Room Management Report',
            headers,
            data,
            filename: `rooms_export_${new Date().toISOString().slice(0, 10)}.csv`,
            metadata
        });
        
        hideLoadingOverlay();
        
        if (success) {
            showToast('Rooms exported as CSV successfully', 'success');
        } else {
            showToast('Failed to export rooms as CSV', 'error');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export rooms as CSV:', error);
        showToast('Failed to export rooms as CSV: ' + error.message, 'error');
    }
}
