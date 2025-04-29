export { loadBooks, filterBooksByCategory, showBookDetails, showEditBookForm };

import { displaySimilarBooks } from "./recommendations.js";
import { borrowBook, returnBook } from "./books.js";
import { getBooks, updateCategoryCount } from "./storage.js";
import { isAdmin, isLoggedIn, getCurrentUser } from "./auth.js";
import { formatDate, createNotification, showModal, hideModal } from "./ui.js";

// Load books into the table
async function loadBooks() {
  let books = getBooks();

  // If no books, try to load initial books
  if (books.length === 0) {
    books = await loadInitialBooks();
  }

  const tableBody = document.getElementById("books-table-body");

  if (!tableBody) return;

  tableBody.innerHTML = "";

  if (books.length === 0) {
    tableBody.innerHTML = `
              <tr>
                  <td colspan="7" class="no-books">No books in your library. Add some books!</td>
              </tr>
          `;
    return;
  }

  // Check if user is admin to show/hide action buttons
  const isUserAdmin = isAdmin();
  const isUserLoggedIn = isLoggedIn();

  books.forEach((book) => {
    const row = document.createElement("tr");

    const coverUrl =
      book.cover || "https://via.placeholder.com/50x70?text=No+Cover";

    // Determine status display
    let statusDisplay = `<span class="status-badge ${book.status}">${book.status}</span>`;
    const dueDateDisplay = book.dueDate ? formatDate(book.dueDate) : "N/A";

    if (book.status === "borrowed") {
      statusDisplay = `<span class="status-badge borrowed">Borrowed</span>`;
    } else if (book.status === "reserved") {
      statusDisplay = `<span class="status-badge reserved">Reserved</span>`;
    }

    row.innerHTML = `
              <td>
                  <img src="${coverUrl}" alt="${
      book.title
    }" class="book-cover-thumbnail">
              </td>
              <td>${book.title}</td>
              <td>${book.author}</td>
              <td>${book.categories ? book.categories.join(", ") : ""}</td>
              <td>${statusDisplay}</td>
              <td>${dueDateDisplay}</td>
              <td>
                  <button class="view-btn" data-id="${
                    book.id
                  }"><i class="fas fa-eye"></i></button>
                  ${
                    isUserAdmin
                      ? `
                      <button class="edit-btn" data-id="${book.id}"><i class="fas fa-edit"></i></button>
                      <button class="delete-btn" data-id="${book.id}"><i class="fas fa-trash"></i></button>
                  `
                      : ""
                  }
                  ${
                    isUserLoggedIn && book.status === "available"
                      ? `
                      <button class="borrow-btn" data-id="${book.id}"><i class="fas fa-hand-holding"></i></button>
                  `
                      : ""
                  }
                  ${
                    isUserLoggedIn &&
                    book.status === "borrowed" &&
                    book.borrowedBy === getCurrentUser()?.id
                      ? `
                      <button class="return-btn" data-id="${book.id}"><i class="fas fa-undo"></i></button>
                  `
                      : ""
                  }
              </td>
          `;

    tableBody.appendChild(row);
  });

  // Add event listeners for action buttons
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const bookId = this.getAttribute("data-id");
      const book = books.find((b) => b.id === bookId);
      if (book) {
        showBookDetails(book);
      }
    });
  });

  if (isUserAdmin) {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const bookId = this.getAttribute("data-id");
        const book = books.find((b) => b.id === bookId);
        if (book) {
          showEditBookForm(book);
        }
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const bookId = this.getAttribute("data-id");
        const book = books.find((b) => b.id === bookId);
        if (
          book &&
          confirm(`Are you sure you want to delete "${book.title}"?`)
        ) {
          deleteBook(bookId);
          loadBooks();
          createNotification(`"${book.title}" has been deleted.`, "success");
        }
      });
    });
  }

  if (isUserLoggedIn) {
    document.querySelectorAll(".borrow-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const bookId = this.getAttribute("data-id");
        borrowBook(bookId);
      });
    });

    document.querySelectorAll(".return-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const bookId = this.getAttribute("data-id");
        returnBook(bookId);
      });
    });
  }

  // Update category counts
  updateCategoryCount();
}

// filtering books by category

function filterBooksByCategory(category) {
  const books = getBooks();
  const tableBody = document.getElementById("books-table-body");

  if (!tableBody) return;

  tableBody.innerHTML = "";

  let filteredBooks = books;

  if (category && category !== "all") {
    filteredBooks = books.filter(
      (book) => book.categories && book.categories.includes(category)
    );
  }

  if (filteredBooks.length === 0) {
    tableBody.innerHTML = `
              <tr>
                  <td colspan="7" class="no-books">No books found in this category.</td>
              </tr>
          `;
    return;
  }

  // Check if user is admin to show/hide action buttons
  const isUserAdmin = isAdmin();
  const isUserLoggedIn = isLoggedIn();

  filteredBooks.forEach((book) => {
    const row = document.createElement("tr");

    const coverUrl =
      book.cover || "https://via.placeholder.com/50x70?text=No+Cover";

    // Determine status display
    const statusDisplay = `<span class="status-badge ${book.status}">${book.status}</span>`;
    const dueDateDisplay = book.dueDate ? formatDate(book.dueDate) : "N/A";

    row.innerHTML = `
              <td>
                  <img src="${coverUrl}" alt="${
      book.title
    }" class="book-cover-thumbnail">
              </td>
              <td>${book.title}</td>
              <td>${book.author}</td>
              <td>${book.categories ? book.categories.join(", ") : ""}</td>
              <td>${statusDisplay}</td>
              <td>${dueDateDisplay}</td>
              <td>
                  <button class="view-btn" data-id="${
                    book.id
                  }"><i class="fas fa-eye"></i></button>
                  ${
                    isUserAdmin
                      ? `
                      <button class="edit-btn" data-id="${book.id}"><i class="fas fa-edit"></i></button>
                      <button class="delete-btn" data-id="${book.id}"><i class="fas fa-trash"></i></button>
                  `
                      : ""
                  }
                  ${
                    isUserLoggedIn && book.status === "available"
                      ? `
                      <button class="borrow-btn" data-id="${book.id}"><i class="fas fa-hand-holding"></i></button>
                  `
                      : ""
                  }
                  ${
                    isUserLoggedIn &&
                    book.status === "borrowed" &&
                    book.borrowedBy === getCurrentUser()?.id
                      ? `
                      <button class="return-btn" data-id="${book.id}"><i class="fas fa-undo"></i></button>
                  `
                      : ""
                  }
              </td>
          `;

    tableBody.appendChild(row);
  });

  // Add event listeners for action buttons
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const bookId = this.getAttribute("data-id");
      const book = books.find((b) => b.id === bookId);
      if (book) {
        showBookDetails(book);
      }
    });
  });

  if (isUserAdmin) {
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const bookId = this.getAttribute("data-id");
        const book = books.find((b) => b.id === bookId);
        if (book) {
          showEditBookForm(book);
        }
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const bookId = this.getAttribute("data-id");
        const book = books.find((b) => b.id === bookId);
        if (
          book &&
          confirm(`Are you sure you want to delete "${book.title}"?`)
        ) {
          deleteBook(bookId);
          loadBooks();
          createNotification(`"${book.title}" has been deleted.`, "success");
        }
      });
    });
  }

  if (isUserLoggedIn) {
    document.querySelectorAll(".borrow-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const bookId = this.getAttribute("data-id");
        borrowBook(bookId);
      });
    });

    document.querySelectorAll(".return-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const bookId = this.getAttribute("data-id");
        returnBook(bookId);
      });
    });
  }
}

// Show book details
function showBookDetails(book) {
  const detailsModal = document.getElementById("book-details-modal");
  if (!detailsModal) return;

  const coverUrl =
    book.cover || "https://via.placeholder.com/200x300?text=No+Cover";
  const isUserLoggedIn = isLoggedIn();
  const currentUser = getCurrentUser();
  const canBorrow = isUserLoggedIn && book.status === "available";
  const canReturn =
    isUserLoggedIn &&
    book.status === "borrowed" &&
    book.borrowedBy === currentUser?.id;

  const modalContent = detailsModal.querySelector(".modal-content");
  modalContent.innerHTML = `
          <div class="modal-header">
              <h2>${book.title}</h2>
              <button class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
              <div class="book-details">
                  <div class="book-cover">
                      <img src="${coverUrl}" alt="${book.title}">
                  </div>
                  <div class="book-info">
                      <p><strong>Author:</strong> ${book.author}</p>
                      <p><strong>ISBN:</strong> ${book.isbn || "N/A"}</p>
                      <p><strong>Publisher:</strong> ${
                        book.publisher || "N/A"
                      }</p>
                      <p><strong>Publication Year:</strong> ${
                        book.year || "N/A"
                      }</p>
                      <p><strong>Categories:</strong> ${
                        book.categories ? book.categories.join(", ") : "None"
                      }</p>
                      <p><strong>Added on:</strong> ${
                        book.addedDate ? formatDate(book.addedDate) : "N/A"
                      }</p>
                      <p><strong>Status:</strong> <span class="status-badge ${
                        book.status
                      }">${book.status}</span></p>
                      ${
                        book.dueDate
                          ? `<p><strong>Due Date:</strong> ${formatDate(
                              book.dueDate
                            )}</p>`
                          : ""
                      }
                      <p><strong>Notes:</strong> ${book.notes || "None"}</p>
                      
                      <div class="book-actions mt-20">
                          ${
                            canBorrow
                              ? `
                              <button id="borrow-book-btn" class="primary-btn" data-id="${book.id}">
                                  <i class="fas fa-hand-holding"></i> Borrow Book
                              </button>
                          `
                              : ""
                          }
                          ${
                            canReturn
                              ? `
                              <button id="return-book-btn" class="secondary-btn" data-id="${book.id}">
                                  <i class="fas fa-undo"></i> Return Book
                              </button>
                          `
                              : ""
                          }
                          ${
                            !isUserLoggedIn && book.status === "available"
                              ? `
                              <p class="login-prompt">Please <a href="login.html">login</a> to borrow this book.</p>
                          `
                              : ""
                          }
                      </div>
                  </div>
              </div>
              <div id="similar-books-container" class="similar-books-container">
                  <!-- Similar books will be loaded here -->
              </div>
          </div>
      `;

  showModal("book-details-modal");

  // Add event listener to close button
  modalContent.querySelector(".close-btn").addEventListener("click", () => {
    hideModal("book-details-modal");
  });

  // Add event listener to borrow button
  const borrowBtn = modalContent.querySelector("#borrow-book-btn");
  if (borrowBtn) {
    borrowBtn.addEventListener("click", () => {
      const bookId = borrowBtn.getAttribute("data-id");
      borrowBook(bookId);
      hideModal("book-details-modal");
    });
  }

  // Add event listener to return button
  const returnBtn = modalContent.querySelector("#return-book-btn");
  if (returnBtn) {
    returnBtn.addEventListener("click", () => {
      const bookId = returnBtn.getAttribute("data-id");
      returnBook(bookId);
      hideModal("book-details-modal");
    });
  }

  // Display similar books if we have enough information
  if (book.title && (book.author || book.categories)) {
    const bookObj = {
      title: book.title,
      author: book.author,
      categories: book.categories || [],
      olid: book.olid,
    };

    // Display similar books
    displaySimilarBooks(bookObj);
  } else {
    const similarBooksContainer = document.getElementById(
      "similar-books-container"
    );
    if (similarBooksContainer) {
      similarBooksContainer.innerHTML =
        "<p>Not enough information to find similar books.</p>";
    }
  }
}

// Show edit book form
function showEditBookForm(book) {
  // Only admins can edit books
  if (!isAdmin()) {
    createNotification("Only administrators can edit books.", "error");
    return;
  }

  const bookForm = document.getElementById("book-form");
  if (!bookForm) return;

  // Set form data
  document.getElementById("book-title").value = book.title;
  document.getElementById("book-author").value = book.author;
  document.getElementById("book-isbn").value = book.isbn || "";
  document.getElementById("book-publisher").value = book.publisher || "";
  document.getElementById("book-year").value = book.year || "";
  document.getElementById("book-cover").value = book.cover || "";
  document.getElementById("book-notes").value = book.notes || "";

  // Set book ID for form submission
  bookForm.setAttribute("data-id", book.id);

  // Update form title
  const modalTitle = document.querySelector("#book-modal .modal-title");
  if (modalTitle) {
    modalTitle.textContent = "Edit Book";
  }

  // Show modal
  showModal("book-modal");
}
