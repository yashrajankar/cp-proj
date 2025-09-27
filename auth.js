// auth.js - Authentication functions for the application

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'toast show ' + type;
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    } else {
        // Fallback to console if toast element doesn't exist
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Show loading spinner
function showLoader() {
    const loader = document.getElementById('loaderNew');
    if (loader) {
        loader.classList.remove('hidden');
    }
}

// Hide loading spinner
function hideLoader() {
    const loader = document.getElementById('loaderNew');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// Login function
async function login(userType) {
    showLoader();
    
    try {
        let username, password;
        
        if (userType === 'admin') {
            username = document.getElementById('adminUsername').value;
            password = document.getElementById('adminPassword').value;
        } else {
            username = document.getElementById('userRollNo').value;
            password = document.getElementById('userPassword').value;
        }
        
        // Validate input
        if (!username || !password) {
            showToast('Please enter both username and password', 'error');
            hideLoader();
            return;
        }
        
        // Prepare request data
        const requestData = userType === 'admin' 
            ? { username, password }
            : { rollNo: username, password };
        
        // Make API request with timeout
        const apiUrl = `http://localhost:3003/api/auth/${userType}/login`;
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000) // 10 second timeout
        );
        
        // Make the actual request
        const fetchPromise = fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        // Race the fetch against the timeout
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        // Check if response is OK
        if (!response.ok) {
            let errorMessage = 'Login failed';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
            } catch (e) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            showToast(errorMessage, 'error');
            hideLoader();
            return;
        }
        
        // Try to parse JSON response
        let result;
        try {
            result = await response.json();
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            showToast('Invalid response from server', 'error');
            hideLoader();
            return;
        }
        
        if (result.success) {
            showToast('Login successful!', 'success');
            
            // Store user info in localStorage
            localStorage.setItem('userType', userType);
            localStorage.setItem('userInfo', JSON.stringify(result[userType === 'admin' ? 'user' : 'student']));
            
            // Redirect based on user type with shorter delay
            setTimeout(() => {
                window.location.href = userType === 'admin' ? 'admin-features/dashboard/dashboard.html' : 'user-features/dashboard/dashboard.html';
            }, 500); // Reduced from 1000ms to 500ms
        } else {
            showToast(result.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (error.message === 'Request timeout') {
            showToast('Login request timed out. Please check your connection and try again.', 'error');
        } else {
            showToast('An error occurred during login. Please try again.', 'error');
        }
    } finally {
        hideLoader();
    }
}

// Check if user is authenticated
function isAuthenticated() {
    const userType = localStorage.getItem('userType');
    const userInfo = localStorage.getItem('userInfo');
    return userType && userInfo;
}

// Get current user info
function getCurrentUser() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('userType');
    localStorage.removeItem('userInfo');
    window.location.href = 'index.html';
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a protected page
    const protectedPages = ['admin-features/dashboard/dashboard.html', 'user-features/dashboard/dashboard.html'];
    const currentPage = window.location.pathname;
    
    if (protectedPages.some(page => currentPage.includes(page))) {
        if (!requireAuth()) {
            return;
        }
        
        // Add user info to header if available
        const userInfo = getCurrentUser();
        if (userInfo) {
            const userInfoElement = document.querySelector('.user-info');
            if (userInfoElement) {
                userInfoElement.innerHTML = `
                    <span>Welcome, ${userInfo.username || userInfo.name}</span>
                    <button class="btn btn-secondary" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                `;
            }
        }
    }
    
    // Handle user login form submission
    const userLoginFormSubmit = document.getElementById('userLoginFormSubmit');
    if (userLoginFormSubmit) {
        userLoginFormSubmit.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get values from user login form
            const rollNo = document.getElementById('signupRollNo').value;
            const password = document.getElementById('signupPassword').value;
            
            // Set values in hidden user form fields
            document.getElementById('userRollNo').value = rollNo;
            document.getElementById('userPassword').value = password;
            
            // Call login function for user
            login('user');
        });
    }
});