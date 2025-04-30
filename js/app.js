// app.js - Main application initialization and coordination
export { updateAuthUI, initApp };

import {
  loadBooks,
  initBookForm,
  initBookSearch,
  initISBNSearch,
} from "./books.js";
import {
  loadCategories,
  updateCategoryFilter,
  initCategoryManagement,
  updateCategoryChips,
} from "./categories.js";
import { initNavigation } from "./navigation.js";
import { initRecommendations } from "./recommendations.js";
import { updateCategoryCount, getBorrowedBooksCount } from "./storage.js";
import { loadAllPageFragments } from "./html-loader.js";
import { isLoggedIn, getCurrentUser, isAdmin, logoutUser } from "./auth.js";
import { createNotification } from "./ui.js";
import { initCategoryDisplay } from "./category-display.js";
import { initNotifications } from "./notifications.js";

// Initialize the application
async function initApp() {
  try {
    // First load all HTML fragments
    await loadAllPageFragments();

    // Then initialize all components

    // Initialize navigation
    initNavigation();

    // Initialize book management
    loadBooks();
    initBookForm();
    initBookSearch();
    initISBNSearch();

    // Initialize category management
    loadCategories();
    updateCategoryFilter();
    updateCategoryChips();
    initCategoryManagement();
    updateCategoryCount();

    // Initialize category display
    initCategoryDisplay();

    // Initialize recommendations
    initRecommendations();

    // Initialize notifications
    initNotifications();

    // Update auth UI
    updateAuthUI();

    // Add Recommendations to navigation
    const navList = document.querySelector(".nav-links ul");
    if (navList) {
      const recommendationsNavItem = document.createElement("li");
      recommendationsNavItem.innerHTML = `
                <a href="#" data-page="recommendations-page">
                    <i class="fas fa-lightbulb"></i>
                    <span>Recommendations</span>
                </a>
            `;
      recommendationsNavItem.setAttribute("data-page", "recommendations-page");
      navList.appendChild(recommendationsNavItem);
    }
  } catch (error) {
    console.error("Error initializing application:", error);
    document.body.innerHTML = `
        <div class="error-container">
          <h1>Error Loading Application</h1>
          <p>${error.message}</p>
          <button onclick="location.reload()">Reload</button>
        </div>
      `;
  }
}

// Update UI based on authentication state
function updateAuthUI() {
  const userInfoSection = document.getElementById("user-info-section");
  const loginNavItem = document.getElementById("login-nav-item");
  const logoutNavItem = document.getElementById("logout-nav-item");
  const dashboardNavItem = document.getElementById("dashboard-nav-item");
  const adminNavItem = document.getElementById("admin-nav-item");
  const userAvatar = document.getElementById("user-avatar");
  const sidebarUserName = document.getElementById("sidebar-user-name");
  const sidebarUserRole = document.getElementById("sidebar-user-role");
  const borrowedBooksCount = document.getElementById("borrowed-books-count");

  if (isLoggedIn()) {
    // User is logged in
    const currentUser = getCurrentUser();

    // Show user info
    if (userInfoSection) userInfoSection.classList.remove("hidden");
    if (sidebarUserName) sidebarUserName.textContent = currentUser.username;
    if (sidebarUserRole) sidebarUserRole.textContent = currentUser.role;

    // Show logout button and dashboard link
    if (loginNavItem) loginNavItem.classList.add("hidden");
    if (logoutNavItem) logoutNavItem.classList.remove("hidden");
    if (dashboardNavItem) dashboardNavItem.classList.remove("hidden");

    // Update borrowed books count
    if (borrowedBooksCount) {
      borrowedBooksCount.textContent = getBorrowedBooksCount(currentUser.id);
    }

    // If admin, show admin link and update avatar
    if (isAdmin()) {
      if (adminNavItem) adminNavItem.classList.remove("hidden");
      if (userAvatar) {
        userAvatar.classList.add("admin");
        userAvatar.innerHTML = '<i class="fas fa-user-shield"></i>';
      }
    } else {
      if (adminNavItem) adminNavItem.classList.add("hidden");
      if (userAvatar) {
        userAvatar.classList.remove("admin");
        userAvatar.innerHTML = '<i class="fas fa-user"></i>';
      }
    }
  } else {
    // User is not logged in
    if (userInfoSection) userInfoSection.classList.add("hidden");
    if (loginNavItem) loginNavItem.classList.remove("hidden");
    if (logoutNavItem) logoutNavItem.classList.add("hidden");
    if (dashboardNavItem) dashboardNavItem.classList.add("hidden");
    if (adminNavItem) adminNavItem.classList.add("hidden");
  }
}

// Add logout functionality
function initLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
      updateAuthUI();
      createNotification("You have been logged out successfully", "success");
    });
  }
}

// Run the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  initLogout();
});
