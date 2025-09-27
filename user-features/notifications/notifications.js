// User Notifications JavaScript

// DOM Elements
const notificationList = document.getElementById('notificationList');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const statusFilter = document.getElementById('statusFilter');
const typeFilter = document.getElementById('typeFilter');

// State
let notifications = [];
let filteredNotifications = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeNotifications();
});

async function initializeNotifications() {
    setupEventListeners();
    await loadNotifications();
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
}

function setupEventListeners() {
    // Filter event listeners
    statusFilter.addEventListener('change', filterNotifications);
    typeFilter.addEventListener('change', filterNotifications);
    
    // Action buttons
    markAllReadBtn.addEventListener('click', markAllAsRead);
    clearAllBtn.addEventListener('click', clearAllNotifications);
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Load Notifications
async function loadNotifications() {
    try {
        showLoadingState();
        
        // Fetch notifications from API
        const data = await fetchData('notifications');
        
        if (data && Array.isArray(data)) {
            notifications = data;
            filteredNotifications = [...notifications];
            renderNotifications();
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
        showErrorState('Failed to load notifications. Please try again later.');
    }
}

// Render Notifications
function renderNotifications() {
    if (filteredNotifications.length === 0) {
        showEmptyState();
        return;
    }
    
    notificationList.innerHTML = filteredNotifications.map(notification => {
        const createdAt = new Date(notification.createdAt);
        const timeAgo = getTimeAgo(createdAt);
        
        // Get icon class
        const iconClass = getNotificationIconClass(notification.type);
        
        return `
            <div class="notification-item ${notification.status}" 
                 data-id="${notification._id}"
                 tabindex="0">
                <div class="notification-icon ${notification.type}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-header">
                        <h3 class="notification-title">${escapeHtml(notification.title)}</h3>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    <p class="notification-message">${escapeHtml(notification.message)}</p>
                    <div class="notification-footer">
                        <div class="notification-meta">
                            <span class="notification-type">${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}</span>
                            ${notification.priority !== 'low' ? `<span class="notification-priority">${notification.priority}</span>` : ''}
                        </div>
                        <div class="notification-actions">
                            <button class="btn-icon ${notification.status === 'read' ? 'unread-btn' : 'read-btn'}" 
                                    onclick="toggleNotificationStatus('${notification._id}')"
                                    aria-label="${notification.status === 'read' ? 'Mark as unread' : 'Mark as read'}">
                                <i class="fas fa-${notification.status === 'read' ? 'envelope' : 'envelope-open'}"></i>
                            </button>
                            <button class="btn-icon delete-btn" 
                                    onclick="deleteNotification('${notification._id}')"
                                    aria-label="Delete notification">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Filter Notifications
function filterNotifications() {
    const status = statusFilter.value;
    const type = typeFilter.value;
    
    filteredNotifications = notifications.filter(notification => {
        const statusMatch = !status || notification.status === status;
        const typeMatch = !type || notification.type === type;
        return statusMatch && typeMatch;
    });
    
    renderNotifications();
}

// Get Notification Icon Class
function getNotificationIconClass(type) {
    switch (type) {
        case 'info':
            return 'fas fa-info-circle';
        case 'warning':
            return 'fas fa-exclamation-triangle';
        case 'alert':
            return 'fas fa-exclamation-circle';
        default:
            return 'fas fa-bell';
    }
}

// Toggle Notification Status (Read/Unread)
async function toggleNotificationStatus(id) {
    try {
        const notification = notifications.find(n => n._id === id);
        if (!notification) return;
        
        const newStatus = notification.status === 'read' ? 'unread' : 'read';
        
        // Update on server
        await fetchData(`notifications/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        // Update local state
        notification.status = newStatus;
        
        // Re-render
        filterNotifications();
        
        showToast(`Notification marked as ${newStatus}`, 'success');
    } catch (error) {
        console.error('Failed to toggle notification status:', error);
        showToast('Failed to update notification status', 'error');
    }
}

// Delete Notification
async function deleteNotification(id) {
    if (!confirm('Are you sure you want to delete this notification?')) {
        return;
    }
    
    try {
        // Delete from server
        await fetchData(`notifications/${id}`, {
            method: 'DELETE'
        });
        
        // Remove from local state
        notifications = notifications.filter(n => n._id !== id);
        
        // Re-render
        filterNotifications();
        
        showToast('Notification deleted successfully', 'success');
    } catch (error) {
        console.error('Failed to delete notification:', error);
        showToast('Failed to delete notification', 'error');
    }
}

// Mark All as Read
async function markAllAsRead() {
    if (notifications.length === 0) {
        showToast('No notifications to mark as read', 'info');
        return;
    }
    
    try {
        // Update all notifications on server
        await fetchData('notifications/mark-all-read', {
            method: 'PUT'
        });
        
        // Update local state
        notifications.forEach(notification => {
            notification.status = 'read';
        });
        
        // Re-render
        filterNotifications();
        
        showToast('All notifications marked as read', 'success');
    } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        showToast('Failed to mark all notifications as read', 'error');
    }
}

// Clear All Notifications
async function clearAllNotifications() {
    if (notifications.length === 0) {
        showToast('No notifications to clear', 'info');
        return;
    }
    
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Clear all notifications on server
        await fetchData('notifications', {
            method: 'DELETE'
        });
        
        // Clear local state
        notifications = [];
        filteredNotifications = [];
        
        // Re-render
        renderNotifications();
        
        showToast('All notifications cleared successfully', 'success');
    } catch (error) {
        console.error('Failed to clear notifications:', error);
        showToast('Failed to clear notifications', 'error');
    }
}

// Show Loading State
function showLoadingState() {
    notificationList.innerHTML = `
        <div class="notification-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading notifications...</span>
        </div>
    `;
}

// Show Empty State
function showEmptyState() {
    notificationList.innerHTML = `
        <div class="notifications-empty">
            <i class="fas fa-bell-slash"></i>
            <h3>No Notifications</h3>
            <p>You don't have any notifications at the moment.</p>
        </div>
    `;
}

// Show Error State
function showErrorState(message) {
    notificationList.innerHTML = `
        <div class="notifications-empty">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Notifications</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="loadNotifications()" style="margin-top: 1rem;">
                <i class="fas fa-sync"></i> Try Again
            </button>
        </div>
    `;
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

function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) {
        return 'Just now';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }
    
    const days = Math.floor(hours / 24);
    if (days < 7) {
        return `${days}d ago`;
    }
    
    return date.toLocaleDateString();
}

function getNotificationIcon(type) {
    switch (type) {
        case 'warning':
            return 'exclamation-triangle';
        case 'alert':
            return 'exclamation-circle';
        default:
            return 'info-circle';
    }
}

function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
}

// Toast Notification Function
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
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
        // Redirect to login page
        window.location.href = '../../index.html';
    }
}