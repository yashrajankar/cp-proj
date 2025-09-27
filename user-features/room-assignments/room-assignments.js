// room-assignments.js - Room assignments functionality for user panel

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

// Function to load room assignments
async function loadRoomAssignments() {
    try {
        showLoadingOverlay('Loading...');
        
        // Fetch room assignments data from the API
        const result = await fetchData('roomAssignments');
        
        // Render room assignments
        renderRoomAssignments(result.assignments);
        
        // Update statistics
        updateStatistics({
            ...result.stats,
            assignments: result.assignments
        });
        
        hideLoadingOverlay();
        return result;
    } catch (error) {
        console.error('Error loading room assignments:', error);
        hideLoadingOverlay();
        showToast('Failed to load room assignments. Please try again later.', 'error');
        throw error;
    }
}

// Function to render room assignments
function renderRoomAssignments(assignments) {
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

    if (!assignmentsData || assignmentsData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2rem;">
                    <i class="fas fa-door-open" style="font-size: 3rem; color: #bdc3c7; margin-bottom: 1rem;"></i>
                    <h3>No Room Assignments Found</h3>
                    <p>Generate seating arrangements to see roll number assignments</p>
                </td>
            </tr>
        `;
        return;
    }

    let html = '';

    assignmentsData.forEach(assignment => {
        // Create a grid for roll numbers (5 columns, 8 rows = 40 cells)
        let rollNumbersHtml = '';
        
        // Get the assigned students
        const students = assignment.students || [];
        
        // Fill the grid with up to 40 cells in vertical order (column by column)
        for (let i = 0; i < 40; i++) {
            const col = Math.floor(i / 8) + 1;  // Column index (1-5)
            const row = (i % 8) + 1;            // Row index (1-8)
            
            if (i < students.length && students[i] && students[i].rollNo) {
                // Add actual roll number with grid position
                rollNumbersHtml += `<span class="roll-number-tag" style="grid-column: ${col}; grid-row: ${row};">${students[i].rollNo}</span>`;
            } else {
                // Add placeholder for empty cell with grid position
                rollNumbersHtml += `<span class="roll-number-placeholder" style="grid-column: ${col}; grid-row: ${row};"></span>`;
            }
        }

        html += `
            <tr>
                <td>${assignment.number || assignment.roomNumber || 'N/A'}</td>
                <td>${assignment.building || 'N/A'}</td>
                <td>${assignment.capacity || 0}</td>
                <td class="roll-numbers-cell">${rollNumbersHtml}</td>
                <td>${students.length}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

// Function to update statistics
function updateStatistics(stats) {
    if (!stats) return;
    
    // Calculate total capacity from assignments
    let totalCapacity = 0;
    if (stats.assignments && Array.isArray(stats.assignments)) {
        totalCapacity = stats.assignments.reduce((sum, assignment) => sum + (assignment.capacity || 0), 0);
    }
    
    // Calculate average capacity
    const avgCapacity = stats.total_rooms > 0 ? 
        Math.round(totalCapacity / stats.total_rooms) : 0;
    
    document.getElementById('totalRooms').textContent = stats.total_rooms || 0;
    document.getElementById('totalCapacity').textContent = totalCapacity;
    document.getElementById('avgCapacity').textContent = avgCapacity;
}

// Function to export assignments data
async function exportAssignmentsData(format) {
    try {
        showLoadingOverlay(`Exporting assignments as ${format.toUpperCase()}...`);
        
        // Fetch the assignments data
        const result = await fetchData('roomAssignments');
        
        if (!result || !result.assignments || result.assignments.length === 0) {
            hideLoadingOverlay();
            showToast('No assignments to export', 'warning');
            return;
        }
        
        // Prepare data based on format
        if (format === 'csv') {
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
        } else {
            // For PDF and Excel, we would need additional libraries
            hideLoadingOverlay();
            showToast(`Export as ${format.toUpperCase()} would be implemented here`, 'info');
        }
    } catch (error) {
        hideLoadingOverlay();
        console.error('Failed to export assignments:', error);
        showToast('Failed to export assignments: ' + error.message, 'error');
    }
}

// Function to filter assignments
function filterAssignments() {
    const searchTerm = document.getElementById('assignmentsSearch').value.toLowerCase();
    
    // In a real implementation, this would filter the displayed assignments
    // For now, we'll just show a toast notification
    if (searchTerm) {
        showToast('Filtering functionality would search for: ' + searchTerm, 'info');
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    // Update date/time
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 60000); // Update every minute
    
    try {
        // Load room assignments
        await loadRoomAssignments();
    } catch (error) {
        console.error('Failed to initialize room assignments page:', error);
        showToast('Failed to initialize page. Please refresh and try again.', 'error');
    }
    
    // Add event listeners
    document.getElementById('refreshAssignmentsBtn')?.addEventListener('click', loadRoomAssignments);
    document.getElementById('assignmentsSearch')?.addEventListener('input', filterAssignments);
    
    // Export dropdown event listeners
    const exportDropdown = document.getElementById('exportAssignmentsDropdown');
    const exportBtn = document.getElementById('exportAssignmentsBtn');
    
    if (exportBtn && exportDropdown) {
        // Toggle dropdown on button click
        exportBtn.addEventListener('click', function(e) {
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
                !exportBtn.contains(e.target) && 
                !exportDropdown.contains(e.target)) {
                exportDropdown.classList.remove('show');
                exportDropdown.style.display = 'none';
            }
        });
        
        // Export handlers
        document.getElementById('exportAssignmentsPdfBtn')?.addEventListener('click', function(e) {
            e.stopPropagation();
            exportAssignmentsData('pdf');
            exportDropdown.classList.remove('show');
            exportDropdown.style.display = 'none';
        });
        
        document.getElementById('exportAssignmentsCsvBtn')?.addEventListener('click', function(e) {
            e.stopPropagation();
            exportAssignmentsData('csv');
            exportDropdown.classList.remove('show');
            exportDropdown.style.display = 'none';
        });
        
        document.getElementById('exportAssignmentsExcelBtn')?.addEventListener('click', function(e) {
            e.stopPropagation();
            exportAssignmentsData('excel');
            exportDropdown.classList.remove('show');
            exportDropdown.style.display = 'none';
        });
    }
});