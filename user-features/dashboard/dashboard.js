// dashboard.js - Dashboard functionality for user panel

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
function showToast(message, type = 'info', duration = 4000, options = {}) {
    console.log('showToast called with:', { message, type, duration, options });
    const container = document.getElementById('toastContainer');
    if (!container) return;

    // Create unique ID for toast
    const toastCount = (window.toastCount || 0) + 1;
    window.toastCount = toastCount;
    const toastId = `toast-${toastCount}`;
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    const iconClass = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    }[type] || 'fa-info-circle';
    
    // Add close button for persistent toasts
    const closeButton = options.persistent ? 
        `<button class="toast-close" onclick="dismissToast('${toastId}')" aria-label="Close notification">
          <i class="fas fa-times"></i>
        </button>` : '';
    
    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
            ${options.details ? `<div class="toast-details">${options.details}</div>` : ''}
        </div>
        ${closeButton}
    `;
    
    container.appendChild(toast);
    
    // Add animation class after a small delay to ensure proper rendering
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto-dismiss unless it's persistent
    if (!options.persistent) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    container.removeChild(toast);
                    if (container.children.length === 0) window.toastCount = 0;
                }
            }, 300);
        }, duration);
    }
    
    return toastId;
}

// Function to manually dismiss a toast
function dismissToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
                const container = document.getElementById('toastContainer');
                if (container && container.children.length === 0) window.toastCount = 0;
            }
        }, 300);
    }
}

// Enhanced loading overlay with progress indication
function showLoadingOverlay(text = 'Loading...', showProgress = false) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const textElement = overlay.querySelector('.loading-text');
        const spinnerElement = overlay.querySelector('.loading-spinner');
        
        if (textElement) textElement.textContent = text;
        
        // Add progress indicator if requested
        if (showProgress) {
            let progressElement = overlay.querySelector('.loading-progress');
            if (!progressElement) {
                progressElement = document.createElement('div');
                progressElement.className = 'loading-progress';
                progressElement.innerHTML = `
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">0%</div>
                `;
                overlay.querySelector('.loading-container').appendChild(progressElement);
            }
            progressElement.style.display = 'block';
        } else {
            const progressElement = overlay.querySelector('.loading-progress');
            if (progressElement) progressElement.style.display = 'none';
        }
        
        overlay.classList.add('active');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('active');
}

// Enhanced loading progress update
function updateLoadingProgress(percent) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const progressElement = overlay.querySelector('.loading-progress');
        if (progressElement) {
            const fillElement = progressElement.querySelector('.progress-fill');
            const textElement = progressElement.querySelector('.progress-text');
            if (fillElement) fillElement.style.width = `${percent}%`;
            if (textElement) textElement.textContent = `${Math.round(percent)}%`;
        }
    }
}

// Enhanced data fetching with retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Default fetch options
const DEFAULT_FETCH_OPTIONS = {
    headers: {
        'Content-Type': 'application/json',
    },
    credentials: 'same-origin'
};

// Global error handler for fetch operations
function handleFetchError(error, operation) {
    console.error(`Error during ${operation}:`, error);
    
    // Check if we're running via file:// protocol (common issue in local development)
    if (window.location.protocol === 'file:') {
        showToast('Please access this page through a web server (http://localhost:3000) rather than opening the file directly.', 'error', 8000);
        return;
    }
    
    showToast(`Failed to ${operation}. Please check your connection and try again.`, 'error');
}

// Enhanced fetchData function with environment awareness
async function fetchData(endpoint, options = {}, retries = MAX_RETRIES, backoff = RETRY_DELAY) {
    try {
        // Handle different endpoint formats correctly
        let url;
        
        // Determine base URL based on environment
        // Fix for file:// protocol access - check if we're running via file protocol
        const isFileProtocol = window.location.protocol === 'file:';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isProduction = !isFileProtocol && !isLocalhost;
        
        // Use localhost:3000 for API calls since that's what the server is running on
        const baseURL = 'http://localhost:3000';
        
        if (endpoint.startsWith('http')) {
            // Full URL - use as is
            url = endpoint;
        } else if (endpoint.startsWith('/api/')) {
            // Absolute API endpoint
            url = `${baseURL}${endpoint}`;
        } else {
            // Relative endpoint
            url = `${baseURL}/api/${endpoint}`;
        }
        
        // Add cache-busting parameter for GET requests
        if (!options.method || options.method.toLowerCase() === 'get') {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}_t=${Date.now()}`;
        }
        
        console.log('Making fetch request to:', url);
        console.log('Fetch options:', options);
        
        const response = await fetch(url, {
            ...DEFAULT_FETCH_OPTIONS,
            ...options
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error text:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            console.warn(`Fetch failed, retrying in ${backoff}ms... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, backoff));
            return fetchData(endpoint, options, retries - 1, backoff * 2);
        }
        
        handleFetchError(error, `fetch data from ${endpoint}`);
        throw error;
    }
}

// Function to check for updates from admin
async function checkForAdminUpdates() {
    try {
        // Fetch the last modified timestamps
        const lastModifiedData = await fetchData('lastModified');
        
        // Compare with locally stored timestamps
        const lastCheck = localStorage.getItem('lastAdminUpdateCheck');
        const lastModifiedTimestamp = lastModifiedData.timestamp;
        
        // If there's a newer update, refresh the data
        if (!lastCheck || new Date(lastModifiedTimestamp) > new Date(lastCheck)) {
            console.log('New updates detected from admin, refreshing data...');
            
            // Update the last check timestamp
            localStorage.setItem('lastAdminUpdateCheck', lastModifiedTimestamp);
            
            // Return true to indicate updates are available
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking for admin updates:', error);
        return false;
    }
}

// Function to load dashboard statistics
async function loadDashboardStats() {
    try {
        // Fetch dashboard data
        const dashboardData = await fetchData('user/dashboard');
        
        // Update statistics
        document.getElementById('totalExams').textContent = dashboardData.totalExams || 0;
        document.getElementById('upcomingExams').textContent = dashboardData.upcomingExams || 0;
        
        // Update last updated time
        const lastUpdated = document.getElementById('lastUpdated');
        if (lastUpdated) {
            const now = new Date();
            lastUpdated.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        return dashboardData;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showToast('Failed to load dashboard statistics. Please try again later.', 'error');
        throw error;
    }
}

// Function to render upcoming exams
function renderUpcomingExams(exams) {
    const container = document.getElementById('upcomingExamsList');
    if (!container) return;
    
    if (!exams || exams.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar fa-3x"></i>
                <h3>No Upcoming Exams</h3>
                <p>Your exam schedule will appear here when available.</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="exam-list">';
    exams.slice(0, 5).forEach(exam => {
        const examDate = new Date(exam.date);
        html += `
            <div class="exam-item">
                <div class="exam-details">
                    <div class="exam-subject">${exam.subject || 'Exam'}</div>
                    <div class="exam-meta">
                        <span><i class="fas fa-calendar"></i> ${examDate.toLocaleDateString()}</span>
                        <span><i class="fas fa-clock"></i> ${exam.time || 'TBD'}</span>
                    </div>
                </div>
                <div class="exam-status status-${(exam.status || 'scheduled').toLowerCase()}">
                    ${exam.status || 'Scheduled'}
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}



// Initialize user panel
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 60000); // Update every minute
    
    // Load dashboard data
    loadDashboardStats()
        .then(dashboardData => {
            // Render upcoming exams
            if (dashboardData.upcomingExamsList) {
                renderUpcomingExams(dashboardData.upcomingExamsList);
            }
            

        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
        });
    
    // Check for admin updates every 30 seconds
    setInterval(async () => {
        const hasUpdates = await checkForAdminUpdates();
        if (hasUpdates) {
            // Refresh dashboard data if updates are available
            try {
                const dashboardData = await loadDashboardStats();
                
                // Re-render components
                if (dashboardData.upcomingExamsList) {
                    renderUpcomingExams(dashboardData.upcomingExamsList);
                }
                

                
                showToast('Dashboard data has been updated', 'info');
            } catch (error) {
                console.error('Error refreshing dashboard data:', error);
            }
        }
    }, 30000);
});