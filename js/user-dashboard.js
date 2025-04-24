// user-dashboard.js - User dashboard functionality

import {
  getCurrentUser,
  isAdmin,
  logoutUser,
  updateUser,
  changePassword,
} from "./auth.js";
import { getBooks } from "./storage.js";
import { formatDate, createNotification, showModal, hideModal } from "./ui.js";
import { getPersonalizedRecommendations } from "./recommendations.js";

// Initialize user dashboard
function initUserDashboard() {
  const currentUser = getCurrentUser();
  console.log(currentUser);

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  // Set user info
  const userNameElement = document.getElementById("user-name");
  const userRoleElement = document.getElementById("user-role");
  const userNameProfileElement = document.getElementById("user-name-profile");
  const userRoleProfileElement = document.getElementById("user-role-profile");
  const userEmailElement = document.getElementById("user-email");
  const userSinceElement = document.getElementById("user-since");
  console.log(userNameProfileElement);

  if (userNameElement) userNameElement.textContent = currentUser.username;
  if (userRoleElement) userRoleElement.textContent = currentUser.role;
  if (userNameProfileElement)
    userNameProfileElement.textContent = currentUser.username;
  if (userRoleProfileElement)
    userRoleProfileElement.textContent = currentUser.role;
  if (userEmailElement) userEmailElement.textContent = currentUser.email;
  if (userSinceElement)
    userSinceElement.textContent = formatDate(currentUser.createdAt);

  // Show admin link if user is admin
  const adminLinkElement = document.getElementById("admin-link");
  if (adminLinkElement) {
    if (isAdmin()) {
      adminLinkElement.classList.remove("hidden");
    } else {
      adminLinkElement.classList.add("hidden");
    }
  }

  // Logout button
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logoutUser();
    });
  }

  // Load user statistics
  loadUserStatistics();

  // Load personalized recommendations
  loadDashboardRecommendations();

  // Initialize profile edit functionality
  initProfileEdit();

  // Initialize password change functionality
  initPasswordChange();

  // Set last activity date
  const lastActivityElement = document.getElementById("last-activity");
  if (lastActivityElement) {
    // For now, just show today's date
    lastActivityElement.textContent = formatDate(new Date());
  }

  // Load borrowed books
  loadBorrowedBooks();
}
initUserDashboard();

// Load user statistics
function loadUserStatistics() {
  const books = getBooks();
  const totalBooksElement = document.getElementById("total-books");
  const recentBooksElement = document.getElementById("recent-books");
  const categoriesElement = document.getElementById("total-categories");

  if (totalBooksElement) {
    totalBooksElement.textContent = books.length;
  }

  // Get unique categories
  const categories = new Set();
  books.forEach((book) => {
    if (book.categories) {
      book.categories.forEach((category) => categories.add(category));
    }
  });

  if (categoriesElement) {
    categoriesElement.textContent = categories.size;
  }

  // Get recent books
  if (recentBooksElement) {
    // Sort books by added date (descending)
    const recentBooks = [...books]
      .sort((a, b) => {
        return new Date(b.addedDate) - new Date(a.addedDate);
      })
      .slice(0, 5); // Get top 5

    if (recentBooks.length === 0) {
      recentBooksElement.innerHTML = "<p>No books in your library yet.</p>";
    } else {
      recentBooksElement.innerHTML = "";
      const recentBooksList = document.createElement("ul");
      recentBooksList.className = "recent-books-list";

      recentBooks.forEach((book) => {
        const li = document.createElement("li");
        li.innerHTML = `
                    <div class="recent-book">
                        <img src="${
                          book.cover ||
                          "https://via.placeholder.com/50x70?text=No+Cover"
                        }" alt="${book.title}" class="recent-book-cover">
                        <div class="recent-book-info">
                            <h4>${book.title}</h4>
                            <p>${book.author}</p>
                            <small>Added: ${formatDate(book.addedDate)}</small>
                        </div>
                    </div>
                `;
        recentBooksList.appendChild(li);
      });

      recentBooksElement.appendChild(recentBooksList);
    }
  }

  // Create category distribution chart
  createCategoryChart();
}

// Create category distribution chart
function createCategoryChart() {
  const chartContainer = document.getElementById("category-chart");
  if (!chartContainer) return;

  const books = getBooks();
  const categoryCount = {};

  // Count books in each category
  books.forEach((book) => {
    if (book.categories) {
      book.categories.forEach((category) => {
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
    }
  });

  // Convert to array and sort by count
  const categoryData = Object.entries(categoryCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 categories

  if (categoryData.length === 0) {
    chartContainer.innerHTML = "<p>No categories data available.</p>";
    return;
  }

  // Create simple bar chart
  chartContainer.innerHTML = "";
  const chartTitle = document.createElement("h3");
  chartTitle.textContent = "My Reading by Category";
  chartContainer.appendChild(chartTitle);

  const chart = document.createElement("div");
  chart.className = "bar-chart";

  categoryData.forEach((category) => {
    // Calculate percentage (max 100%)
    const percentage = Math.min((category.count / books.length) * 100, 100);

    const barContainer = document.createElement("div");
    barContainer.className = "bar-container";

    const barLabel = document.createElement("div");
    barLabel.className = "bar-label";
    barLabel.textContent = category.name;

    const barWrapper = document.createElement("div");
    barWrapper.className = "bar-wrapper";

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.width = `${percentage}%`;

    const barValue = document.createElement("span");
    barValue.className = "bar-value";
    barValue.textContent = category.count;

    barWrapper.appendChild(bar);
    barWrapper.appendChild(barValue);
    barContainer.appendChild(barLabel);
    barContainer.appendChild(barWrapper);
    chart.appendChild(barContainer);
  });

  chartContainer.appendChild(chart);
}

// Load dashboard recommendations
function loadDashboardRecommendations() {
  const recommendationsContainer = document.getElementById(
    "dashboard-recommendations"
  );
  if (!recommendationsContainer) return;

  recommendationsContainer.innerHTML = "<p>Loading recommendations...</p>";

  // Get personalized recommendations
  getPersonalizedRecommendations()
    .then((recommendations) => {
      if (!recommendations || recommendations.length === 0) {
        recommendationsContainer.innerHTML =
          "<p>No recommendations available. Add more books to your library.</p>";
        return;
      }

      // Limit to 4 recommendations for the dashboard
      const limitedRecommendations = recommendations.slice(0, 4);

      recommendationsContainer.innerHTML = "";
      const recGrid = document.createElement("div");
      recGrid.className = "dashboard-rec-grid";

      limitedRecommendations.forEach((book) => {
        const coverUrl = book.cover_id
          ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
          : null;

        const bookCard = document.createElement("div");
        bookCard.className = "dashboard-rec-card";

        bookCard.innerHTML = `
                <div class="rec-book-cover">
                    ${
                      coverUrl
                        ? `<img src="${coverUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover'">`
                        : `<img src="https://via.placeholder.com/150x200?text=No+Cover" alt="No cover available">`
                    }
                </div>
                <div class="rec-book-info">
                    <h4 class="rec-book-title">${book.title}</h4>
                    <p class="rec-book-author">${book.authors}</p>
                    <a href="index.html#search-page" class="rec-book-link">Find in Library</a>
                </div>
            `;

        recGrid.appendChild(bookCard);
      });

      recommendationsContainer.appendChild(recGrid);
    })
    .catch((error) => {
      console.error("Error loading recommendations:", error);
      recommendationsContainer.innerHTML =
        "<p>Error loading recommendations. Please try again later.</p>";
    });

  // Refresh recommendations button
  const refreshRecommendationsBtn = document.getElementById(
    "refresh-recommendations-btn"
  );
  if (refreshRecommendationsBtn) {
    refreshRecommendationsBtn.addEventListener("click", () => {
      loadDashboardRecommendations();
    });
  }
}

// Load borrowed books
function loadBorrowedBooks() {
  const borrowedBooksContainer = document.getElementById("borrowed-books");
  if (!borrowedBooksContainer) return;

  const books = getBooks();
  const currentUser = getCurrentUser();

  if (!currentUser) return;

  // Filter books borrowed by current user
  const borrowedBooks = books.filter(
    (book) => book.status === "borrowed" && book.borrowedBy === currentUser.id
  );

  if (borrowedBooks.length === 0) {
    borrowedBooksContainer.innerHTML =
      "<p>You haven't borrowed any books yet.</p>";
    return;
  }

  borrowedBooksContainer.innerHTML = "";
  const borrowedTable = document.createElement("table");
  borrowedTable.className = "borrowed-books-table";

  // Create table header
  const tableHeader = document.createElement("thead");
  tableHeader.innerHTML = `
    <tr>
      <th>Title</th>
      <th>Author</th>
      <th>Borrowed Date</th>
      <th>Due Date</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  `;
  borrowedTable.appendChild(tableHeader);

  // Create table body
  const tableBody = document.createElement("tbody");

  borrowedBooks.forEach((book) => {
    const row = document.createElement("tr");

    // Calculate days until due
    const dueDate = new Date(book.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

    // Determine status class
    let statusClass = "normal";
    if (daysUntilDue < 0) {
      statusClass = "overdue";
    } else if (daysUntilDue <= 3) {
      statusClass = "due-soon";
    }

    row.innerHTML = `
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${formatDate(book.borrowedDate || book.addedDate)}</td>
      <td class="${statusClass}">${formatDate(book.dueDate)}</td>
      <td>${
        daysUntilDue < 0
          ? "Overdue"
          : daysUntilDue <= 3
          ? "Due Soon"
          : "On Time"
      }</td>
      <td>
        <button class="return-book-btn" data-id="${book.id}">Return</button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  borrowedTable.appendChild(tableBody);
  borrowedBooksContainer.appendChild(borrowedTable);

  // Add event listeners to return buttons
  document.querySelectorAll(".return-book-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const bookId = this.getAttribute("data-id");

      // Import the returnBook function
      import("./books.js").then((module) => {
        module.returnBook(bookId);
        // Reload borrowed books
        loadBorrowedBooks();
      });
    });
  });
}

// Initialize profile edit functionality
function initProfileEdit() {
  const editProfileBtn = document.getElementById("edit-profile-btn");
  const profileEditForm = document.getElementById("profile-edit-form");
  const profileEditModal = document.getElementById("profile-edit-modal");

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      const currentUser = getCurrentUser();

      // Populate form with current user data
      const usernameInput = document.getElementById("edit-username");
      const emailInput = document.getElementById("edit-email");

      if (usernameInput) usernameInput.value = currentUser.username;
      if (emailInput) emailInput.value = currentUser.email;

      // Show modal
      showModal("profile-edit-modal");
    });
  }

  // Close modal buttons
  document
    .querySelectorAll(".close-btn, .close-modal-btn")
    .forEach((button) => {
      button.addEventListener("click", function () {
        const modal = this.closest(".modal");
        if (modal) {
          hideModal(modal.id);
        }
      });
    });

  // Handle form submission
  if (profileEditForm) {
    profileEditForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("edit-email").value.trim();
      const currentUser = getCurrentUser();

      // Validate email
      if (!email) {
        createNotification("Email is required", "error");
        return;
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        createNotification("Please enter a valid email address", "error");
        return;
      }

      try {
        // Update user data
        updateUser(currentUser.id, { email });

        // Update displayed email
        const userEmailElement = document.getElementById("user-email");
        if (userEmailElement) userEmailElement.textContent = email;

        // Show success notification
        createNotification("Profile updated successfully", "success");

        // Close modal
        hideModal("profile-edit-modal");
      } catch (error) {
        createNotification(error.message, "error");
      }
    });
  }
}

// Initialize password change functionality
function initPasswordChange() {
  const changePasswordBtn = document.getElementById("change-password-btn");
  const passwordChangeForm = document.getElementById("password-change-form");
  const passwordChangeModal = document.getElementById("password-change-modal");

  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", () => {
      // Reset form
      if (passwordChangeForm) {
        passwordChangeForm.reset();
      }

      // Show modal
      showModal("password-change-modal");
    });
  }

  // Handle form submission
  if (passwordChangeForm) {
    passwordChangeForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const currentPassword = document.getElementById("current-password").value;
      const newPassword = document.getElementById("new-password").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      // Validate inputs
      if (!currentPassword || !newPassword || !confirmPassword) {
        createNotification("All fields are required", "error");
        return;
      }

      // Validate passwords
      if (newPassword !== confirmPassword) {
        createNotification("New passwords do not match", "error");
        return;
      }

      // Check password strength
      if (newPassword.length < 6) {
        createNotification(
          "New password must be at least 6 characters long",
          "error"
        );
        return;
      }

      try {
        // Change password
        changePassword(currentPassword, newPassword);

        // Show success notification
        createNotification("Password changed successfully", "success");

        // Reset form and close modal
        passwordChangeForm.reset();
        hideModal("password-change-modal");
      } catch (error) {
        createNotification(error.message, "error");
      }
    });
  }
}

export { initUserDashboard };
