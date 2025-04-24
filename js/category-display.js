// category-display.js - Handles the display of book categories

import { getCategories } from "./storage.js";
import { filterBooksByCategory } from "./books.js";

// Display categories as a visual grid
function displayCategoryGrid() {
  const categoriesContainer = document.getElementById("categories-grid");
  if (!categoriesContainer) return;

  const categories = getCategories();

  // Sort categories by count (descending)
  const sortedCategories = [...categories].sort((a, b) => b.count - a.count);

  // Clear container
  categoriesContainer.innerHTML = "";

  // Create category cards
  sortedCategories.forEach((category) => {
    const categoryCard = document.createElement("div");
    categoryCard.className = "category-card";
    categoryCard.setAttribute("data-category", category.name);

    // Generate a random pastel background color
    const hue = Math.floor(Math.random() * 360);
    const pastelColor = `hsl(${hue}, 70%, 90%)`;

    categoryCard.style.backgroundColor = pastelColor;

    categoryCard.innerHTML = `
      <h3>${category.name}</h3>
      <span class="book-count">${category.count} books</span>
    `;

    categoriesContainer.appendChild(categoryCard);

    // Add click event to filter books
    categoryCard.addEventListener("click", () => {
      filterBooksByCategory(category.name);

      // Update category filter dropdown
      const categoryFilter = document.getElementById("category-filter");
      if (categoryFilter) {
        categoryFilter.value = category.name;
      }

      // Scroll to books section
      document
        .getElementById("books-page")
        .scrollIntoView({ behavior: "smooth" });
    });
  });
}

// Initialize category display
function initCategoryDisplay() {
  // Call on page load
  displayCategoryGrid();

  // Add category grid to the page if it doesn't exist
  const booksPage = document.getElementById("books-page");
  if (booksPage) {
    const categoriesSection = document.createElement("section");
    categoriesSection.className = "categories-section";
    categoriesSection.innerHTML = `
      <div class="section-header">
        <h2>Browse by Category</h2>
      </div>
      <div id="categories-grid" class="categories-grid"></div>
    `;

    // Insert after filter bar
    const filterBar = booksPage.querySelector(".filter-bar");
    if (filterBar) {
      filterBar.parentNode.insertBefore(
        categoriesSection,
        filterBar.nextSibling
      );
      displayCategoryGrid();
    }
  }
}

export { displayCategoryGrid, initCategoryDisplay };
