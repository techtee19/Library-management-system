// categories.js - Category management functionality
import { isAdmin } from "./auth.js";
import { getCategories, addCategory, deleteCategory } from "./storage.js";
import { fetchOpenLibraryCategories } from "./api.js";
import { createNotification } from "./ui.js";
import { filterBooksByCategory } from "./books.js";

// Load categories
function loadCategories() {
  const categories = getCategories();
  const categoriesList = document.getElementById("categories-list");

  if (!categoriesList) return;

  categoriesList.innerHTML = "";

  if (categories.length === 0) {
    categoriesList.innerHTML = "<p>No categories yet. Add some categories!</p>";
    return;
  }

  // Sort categories by name
  categories.sort((a, b) => a.name.localeCompare(b.name));

  categories.forEach((category) => {
    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";

    categoryItem.innerHTML = `
            <div class="category-info">
                <span class="category-name">${category.name}</span>
                <span class="category-count">${category.count} books</span>
            </div>
            <div class="category-actions">
                <button class="delete-category-btn" data-id="${category.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;

    categoriesList.appendChild(categoryItem);
  });

  // Add event listeners to delete buttons
  document.querySelectorAll(".delete-category-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const categoryId = this.getAttribute("data-id");
      const category = categories.find((cat) => cat.id === categoryId);

      if (
        confirm(
          `Are you sure you want to delete the category "${category.name}"? This will remove it from all books.`
        )
      ) {
        deleteCategory(categoryId);
        loadCategories();
        updateCategoryFilter();
        createNotification(
          `Category "${category.name}" has been deleted.`,
          "success"
        );
      }
    });
  });

  // Also update the category chips display
  updateCategoryChips();
}

// Update category filter dropdown
function updateCategoryFilter() {
  const categoryFilter = document.getElementById("category-filter");
  if (!categoryFilter) return;

  // Save current selection
  const currentSelection = categoryFilter.value;

  // Clear existing options
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';

  // Get categories
  const categories = getCategories();

  // Sort categories by name
  categories.sort((a, b) => a.name.localeCompare(b.name));

  // Add options
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = `${category.name} (${category.count})`;
    categoryFilter.appendChild(option);
  });

  // Restore selection if possible
  if (
    currentSelection &&
    categories.some((cat) => cat.name === currentSelection)
  ) {
    categoryFilter.value = currentSelection;
  } else {
    categoryFilter.value = "all";
  }
}

// Update category chips display
function updateCategoryChips() {
  const categoriesDisplay = document.getElementById("categories-display");
  if (!categoriesDisplay) return;

  // Clear existing chips
  categoriesDisplay.innerHTML = "";

  // Add "All" chip
  const allChip = document.createElement("div");
  allChip.className = "category-chip active";
  allChip.setAttribute("data-category", "all");
  allChip.textContent = "All";
  categoriesDisplay.appendChild(allChip);

  // Get categories
  const categories = getCategories();

  // Sort categories by count (descending)
  categories.sort((a, b) => b.count - a.count);

  // Add chips for top 10 categories
  categories.slice(0, 10).forEach((category) => {
    const chip = document.createElement("div");
    chip.className = "category-chip";
    chip.setAttribute("data-category", category.name);
    chip.textContent = `${category.name} (${category.count})`;
    categoriesDisplay.appendChild(chip);
  });

  // Add event listeners to chips
  document.querySelectorAll(".category-chip").forEach((chip) => {
    chip.addEventListener("click", function () {
      // Remove active class from all chips
      document
        .querySelectorAll(".category-chip")
        .forEach((c) => c.classList.remove("active"));

      // Add active class to clicked chip
      this.classList.add("active");

      // Get category and filter books
      const category = this.getAttribute("data-category");
      filterBooksByCategory(category);

      // Update dropdown to match
      const categoryFilter = document.getElementById("category-filter");
      if (categoryFilter) {
        categoryFilter.value = category;
      }
    });
  });
}

// Populate categories select in book form
function populateCategoriesSelect() {
  const categoriesSelect = document.getElementById("book-categories-select");
  if (!categoriesSelect) return;

  // Clear existing options
  categoriesSelect.innerHTML = "";

  // Get categories
  const categories = getCategories();

  // Sort categories by name
  categories.sort((a, b) => a.name.localeCompare(b.name));

  // Add options
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.name;
    option.textContent = category.name;
    categoriesSelect.appendChild(option);
  });
}

// Initialize category management
function initCategoryManagement() {
  // Add new category
  const addCategoryBtn = document.getElementById("add-category-btn");
  if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", () => {
      if (!isAdmin()) {
        createNotification(
          "You do not have permission to add categories.",
          "error"
        );
        return;
      }

      const categoryName = prompt("Enter new category name:");
      if (categoryName && categoryName.trim() !== "") {
        if (addCategory(categoryName.trim())) {
          loadCategories();
          updateCategoryFilter();
          createNotification(
            `Category "${categoryName}" has been added.`,
            "success"
          );
        } else {
          createNotification(
            `Category "${categoryName}" already exists.`,
            "error"
          );
        }
      }
    });
  }

  // Category filter change
  const categoryFilter = document.getElementById("category-filter");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", function () {
      const category = this.value;
      filterBooksByCategory(category);

      // Update category chips to match
      document.querySelectorAll(".category-chip").forEach((chip) => {
        if (chip.getAttribute("data-category") === category) {
          chip.classList.add("active");
        } else {
          chip.classList.remove("active");
        }
      });
    });
  }

  // Import categories from Open Library
  const importCategoriesBtn = document.getElementById("import-categories-btn");
  if (importCategoriesBtn) {
    importCategoriesBtn.addEventListener("click", async () => {
      try {
        const subjects = await fetchOpenLibraryCategories();

        if (subjects.length === 0) {
          createNotification("No categories found.", "error");
          return;
        }

        let importCount = 0;

        subjects.forEach((subject) => {
          if (addCategory(subject.name)) {
            importCount++;
          }
        });

        if (importCount > 0) {
          loadCategories();
          updateCategoryFilter();
          createNotification(
            `${importCount} categories imported from Open Library.`,
            "success"
          );
        } else {
          createNotification("No new categories to import.", "info");
        }
      } catch (error) {
        console.error("Error importing categories:", error);
        createNotification(
          `Error importing categories: ${error.message}`,
          "error"
        );
      }
    });
  }
}

// Export all functions
export {
  loadCategories,
  updateCategoryFilter,
  populateCategoriesSelect,
  initCategoryManagement,
  updateCategoryChips,
};
