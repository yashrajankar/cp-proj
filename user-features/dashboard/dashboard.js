// Check if user is authenticated
function isAuthenticated() {
    const userType = localStorage.getItem('userType');
    const userInfo = localStorage.getItem('userInfo');
    return userType === 'user' && userInfo;
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '../../index.html';
        return false;
    }
    return true;
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
    document.getElementById('currentDateTime').textContent = now.toLocaleString("en-US", options);
}

// Logout function
function logout() {
    // Clear user data from localStorage
    localStorage.removeItem('userType');
    localStorage.removeItem('userInfo');
    // Redirect to login page
    window.location.href = '../../index.html';
}

// Add event listener to logout link
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!requireAuth()) {
        return;
    }
    
    const logoutLink = document.querySelector('a[href="#"]');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Fetch student profile data
async function fetchProfileData() {
    try {
        // Get user data from localStorage
        const currentUser = JSON.parse(localStorage.getItem('userInfo'));
        
        if (!currentUser) {
            console.error('No user data found');
            return;
        }
        
        // Use the authenticated user data
        const profile = {
            name: currentUser.name,
            rollNo: currentUser.rollNo,
            section: currentUser.section,
            email: currentUser.email || 'Not provided',
            phone: currentUser.phone || 'Not provided',
            enrollmentDate: currentUser.createdAt || new Date().toISOString()
        };
        
        // Update profile data by selecting specific elements
        // Name is the first .seating-value in the first card
        const nameElements = document.querySelectorAll('.card .card:nth-child(1) .seating-value');
        if (nameElements.length > 0) nameElements[0].textContent = profile.name;
        
        // Roll Number is the second .seating-value in the first card
        if (nameElements.length > 1) nameElements[1].textContent = profile.rollNo;
        
        // Section is the third .seating-value in the first card
        if (nameElements.length > 2) nameElements[2].textContent = profile.section;
        
        // Email is the first .seating-value in the second card
        const contactElements = document.querySelectorAll('.card .card:nth-child(2) .seating-value');
        if (contactElements.length > 0) contactElements[0].textContent = profile.email;
        
        // Phone is the second .seating-value in the second card
        if (contactElements.length > 1) contactElements[1].textContent = profile.phone;
        
        // Enrollment Date is the third .seating-value in the second card
        if (contactElements.length > 2) {
            contactElements[2].textContent = new Date(profile.enrollmentDate).toLocaleDateString("en-US", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    } catch (error) {
        console.error('Error fetching profile data:', error);
    }
}

// Fetch upcoming exams data
async function fetchUpcomingExams() {
    try {
        const exams = await fetchData('user/exams/upcoming');
        const examList = document.querySelector('.exam-list');
        examList.innerHTML = '';
        
        exams.slice(0, 3).forEach(exam => {
            const examDate = new Date(exam.date).toLocaleDateString("en-US", {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            
            const examItem = document.createElement('div');
            examItem.className = 'exam-item';
            examItem.innerHTML = `
                <div class="exam-details">
                    <div class="exam-subject">${exam.subject}</div>
                    <div class="exam-meta">
                        <span><i class="fas fa-calendar"></i> ${examDate}</span>
                        <span><i class="fas fa-clock"></i> ${exam.time}</span>
                    </div>
                </div>
                <div class="exam-status status-scheduled">${exam.status}</div>
            `;
            examList.appendChild(examItem);
        });
    } catch (error) {
        console.error('Error fetching exams data:', error);
    }
}

// Fetch seating arrangements data
async function fetchSeatingArrangements() {
    try {
        console.log('Fetching seating arrangements...');
        // Fetch real seating arrangement data from the API
        const arrangements = await fetchData('user/seating');
        console.log('Seating arrangements data:', arrangements);
        
        // Update the seating info display
        const seatingInfo = document.getElementById('seatingInfo');
        if (arrangements && arrangements.length > 0) {
            let html = '';
            // Display up to 3 arrangements
            arrangements.slice(0, 3).forEach((arrangement, index) => {
                // Use more user-friendly exam names
                const examNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];
                const examName = examNames[index] || arrangement.exam;
                
                html += `
                    <div class="seating-item">
                        <span class="seating-label">${examName} Exam:</span>
                        <span class="seating-value">${arrangement.room}, ${arrangement.seat}</span>
                    </div>
                `;
            });
            seatingInfo.innerHTML = html;
        } else {
            seatingInfo.innerHTML = `
                <div class="seating-item">
                    <span class="seating-label">No arrangements available</span>
                    <span class="seating-value">Check back later</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error fetching seating data:', error);
        // Show error state
        const seatingInfo = document.getElementById('seatingInfo');
        if (seatingInfo) {
            seatingInfo.innerHTML = `
                <div class="seating-item">
                    <span class="seating-label">Error loading data</span>
                    <span class="seating-value">Please try again later</span>
                </div>
            `;
        }
    }
}

// Fetch notifications data
async function fetchRecentNotifications() {
    try {
        const notifications = await fetchData('user/notifications?limit=3');
        const notificationList = document.querySelector('.notification-list');
        notificationList.innerHTML = '';
        
        notifications.forEach(notification => {
            const notificationTime = new Date(notification.timestamp).toLocaleDateString("en-US", {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const notificationItem = document.createElement('div');
            notificationItem.className = 'notification-item';
            notificationItem.innerHTML = `
                <div class="notification-title">${notification.title}</div>
                <div class="notification-content">${notification.message}</div>
                <div class="notification-time">${notificationTime}</div>
            `;
            notificationList.appendChild(notificationItem);
        });
    } catch (error) {
        console.error('Error fetching notifications data:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    if (!requireAuth()) {
        return;
    }
    
    updateCurrentDateTime();
    setInterval(updateCurrentDateTime, 60000); // Update every minute
    
    // Fetch all data
    fetchProfileData();
    fetchUpcomingExams();
    fetchSeatingArrangements();
    fetchRecentNotifications();
});