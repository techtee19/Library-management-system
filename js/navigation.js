export { initNavigation };

import { showPage } from "./ui.js";
import { loadBooks } from "./books.js";
import {
  loadCategories,
  updateCategoryFilter,
  populateCategoriesSelect,
} from "./categories.js";
import { getPersonalizedRecommendations } from "./recommendations.js";
import { getCategories } from "./storage.js";
import { getCurrentUser } from "./auth.js";

// Initialize navigation
function initNavigation() {
  // Navigation links
  const navLinks = document.querySelectorAll(".nav-links a");

  // checks if user is loggedin
  const currentUser = getCurrentUser();
  if (!currentUser) {
    // removes category and recomendations links
    navLinks.forEach((link) => {
      const pageId = link.getAttribute("data-page");
      if (pageId === "categories-page" || pageId === "recommendations-page") {
        link.parentElement.removeChild(link);
      }
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      // Don't prevent default for external links (login, dashboard, etc.)
      if (
        this.getAttribute("href").endsWith(".html") ||
        this.getAttribute("href").startsWith("http")
      ) {
        return; // Allow normal navigation
      }

      e.preventDefault();

      const pageId = this.getAttribute("data-page");
      if (pageId) {
        showPage(pageId);

        // Load page-specific content
        if (pageId === "books-page") {
          loadBooks();
        } else if (pageId === "categories-page") {
          loadCategories();
        } else if (pageId === "recommendations-page") {
          getPersonalizedRecommendations();

          // Populate category select
          const categorySelect = document.getElementById(
            "recommendation-category-select"
          );
          if (categorySelect) {
            // Clear existing options
            categorySelect.innerHTML =
              '<option value="">Select a category</option>';

            // Get categories
            const categories = getCategories();

            // Sort categories by name
            categories.sort((a, b) => a.name.localeCompare(b.name));

            // Add options
            categories.forEach((category) => {
              const option = document.createElement("option");
              option.value = category.name;
              option.textContent = category.name;
              categorySelect.appendChild(option);
            });
          }
        }
      }
    });
  });

  // Add Book button
  const addBookBtn = document.getElementById("add-book-btn");
  if (addBookBtn) {
    addBookBtn.addEventListener("click", () => {
      // Reset form
      const bookForm = document.getElementById("book-form");
      if (bookForm) {
        bookForm.reset();
        bookForm.removeAttribute("data-id");

        // Update form title
        const modalTitle = document.querySelector("#book-modal .modal-title");
        if (modalTitle) {
          modalTitle.textContent = "Add New Book";
        }

        // Populate categories select
        populateCategoriesSelect();

        // Show modal
        const bookModal = document.getElementById("book-modal");
        if (bookModal) {
          bookModal.classList.remove("hidden");
        }
      }
    });
  }

  // Close buttons for modals
  document.querySelectorAll(".close-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const modal = this.closest(".modal");
      if (modal) {
        modal.classList.add("hidden");
      }
    });
  });

  // Close modal when clicking outside
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", function (e) {
      if (e.target === this) {
        this.classList.add("hidden");
      }
    });
  });

  // Show books page by default
  showPage("books-page");
  loadBooks();
  updateCategoryFilter();
}
