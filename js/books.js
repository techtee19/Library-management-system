export {
  loadBooks,
  loadInitialBooks,
  filterBooksByCategory,
  showBookDetails,
  showBookDetailsFromAPI,
  initBookForm,
  initBookSearch,
  initISBNSearch,
  borrowBook,
  returnBook,
};

import {
  getBooks,
  addBook,
  updateBook,
  saveBooks,
  deleteBook,
} from "./storage.js";
import {
  fetchBookByISBN,
  searchBooks,
  fetchBookDetails,
  fetchBooksByCategory,
} from "./api.js";
import { showModal, hideModal, createNotification, formatDate } from "./ui.js";
import { updateCategoryCount } from "./storage.js";
import { displaySimilarBooks } from "./recommendations.js";
import { isLoggedIn, isAdmin, getCurrentUser } from "./auth.js";

// Load initial books from API if library is empty
async function loadInitialBooks() {
  const books = getBooks();

  // Only load initial books if the library is empty
  if (books.length === 0) {
    try {
      console.log("Loading initial books from API...");

      // Popular book subjects to fetch
      const popularSubjects = [
        "fiction",
        "fantasy",
        "science_fiction",
        "mystery",
        "romance",
        "drama",
      ];

      // Fetch books from the selected subject
      const works = await fetchBooksByCategory(
        popularSubjects[Math.floor(Math.random() * popularSubjects.length)]
      );
      if (works && works.length > 0) {
        // Take the first 12 books
        const initialBooks = works.slice(0, 15).map((work) => {
          const categories = [
            popularSubjects[Math.floor(Math.random() * popularSubjects.length)],
            Math.random() > 2
              ? popularSubjects[
                  Math.floor(Math.random() * popularSubjects.length)
                ]
              : null,
          ].filter(Boolean);
          return {
            id:
              Date.now().toString() +
              "-" +
              Math.random().toString(36).substr(2, 9),
            title: work.title,
            author: work.authors ? work.authors[0].name : "Unknown Author",
            cover: work.cover_id
              ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
              : null,
            categories,
            addedDate: new Date().toISOString(),
            olid: work.key,
            status: "available", // Add status field
            borrowedBy: null,
            dueDate: null,
          };
        });

        // Save the initial books to localStorage
        saveBooks(initialBooks);
        console.log(`Added ${initialBooks.length} initial books`);
        createNotification(
          `Loaded ${initialBooks.length} books to get you started!`,
          "success"
        );

        // Return the books
        return initialBooks;
      }
      return [];
    } catch (error) {
      console.error("Error loading initial books:", error);
      createNotification(
        "Could not load initial books. Please try again later.",
        "error"
      );
    }
  }

  return books;
}

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

// Borrow a book
function borrowBook(bookId) {
  if (!isLoggedIn()) {
    createNotification("You must be logged in to borrow books.", "error");
    return;
  }

  const books = getBooks();
  const bookIndex = books.findIndex((book) => book.id === bookId);

  if (bookIndex === -1) {
    createNotification("Book not found.", "error");
    return;
  }

  const book = books[bookIndex];

  if (book.status !== "available") {
    createNotification("This book is not available for borrowing.", "error");
    return;
  }

  const currentUser = getCurrentUser();

  // Set due date to 14 days from now
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  // Update book status
  books[bookIndex] = {
    ...book,
    status: "borrowed",
    borrowedBy: currentUser.id,
    dueDate: dueDate.toISOString(),
  };

  saveBooks(books);
  loadBooks();
  createNotification(
    `You have borrowed "${book.title}". Please return by ${formatDate(
      dueDate.toISOString()
    )}.`,
    "success"
  );
}

// Return a book
function returnBook(bookId) {
  if (!isLoggedIn()) {
    createNotification("You must be logged in to return books.", "error");
    return;
  }

  const books = getBooks();
  const bookIndex = books.findIndex((book) => book.id === bookId);

  if (bookIndex === -1) {
    createNotification("Book not found.", "error");
    return;
  }

  const book = books[bookIndex];
  const currentUser = getCurrentUser();

  if (book.status !== "borrowed" || book.borrowedBy !== currentUser.id) {
    createNotification("You cannot return this book.", "error");
    return;
  }

  // Update book status
  books[bookIndex] = {
    ...book,
    status: "available",
    borrowedBy: null,
    dueDate: null,
  };

  saveBooks(books);
  loadBooks();
  createNotification(`You have returned "${book.title}".`, "success");
}

// Filter books by category
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

// Show book details from API
function showBookDetailsFromAPI(book, details) {
  const detailsModal = document.getElementById("book-details-modal");
  if (!detailsModal) return;

  const coverUrl = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
    : "https://via.placeholder.com/200x300?text=No+Cover";

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
                    <p><strong>Author:</strong> ${
                      book.author_name ? book.author_name[0] : "Unknown"
                    }</p>
                    <p><strong>ISBN:</strong> ${
                      book.isbn ? book.isbn[0] : "N/A"
                    }</p>
                    <p><strong>Publisher:</strong> ${
                      book.publisher ? book.publisher[0] : "N/A"
                    }</p>
                    <p><strong>Publication Year:</strong> ${
                      book.first_publish_year || "N/A"
                    }</p>
                    <p><strong>Language:</strong> ${
                      book.language ? book.language[0] : "N/A"
                    }</p>
                    <p><strong>Subjects:</strong> ${
                      book.subject
                        ? book.subject.slice(0, 5).join(", ")
                        : "None"
                    }</p>
                </div>
            </div>
            <div class="api-book-actions">
                ${
                  isAdmin()
                    ? `<button id="add-to-library-btn" class="primary-btn">Add to Library</button>`
                    : `<p class="login-prompt">Only administrators can add books to the library.</p>`
                }
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

  // Add event listener to add to library button (admin only)
  const addToLibraryBtn = modalContent.querySelector("#add-to-library-btn");
  if (addToLibraryBtn) {
    addToLibraryBtn.addEventListener("click", () => {
      // Create a new book object
      const newBook = {
        title: book.title,
        author: book.author_name ? book.author_name[0] : "Unknown",
        isbn: book.isbn ? book.isbn[0] : "",
        publisher: book.publisher ? book.publisher[0] : "",
        year: book.first_publish_year || "",
        cover:
          coverUrl !== "https://via.placeholder.com/200x300?text=No+Cover"
            ? coverUrl
            : "",
        categories: book.subject ? book.subject.slice(0, 5) : [],
        addedDate: new Date().toISOString(),
        olid: book.key,
        status: "available",
        borrowedBy: null,
        dueDate: null,
      };

      // Add the book to the library
      addBook(newBook);

      // Reload books
      loadBooks();

      // Show notification
      createNotification(
        `"${book.title}" has been added to your library.`,
        "success"
      );

      // Close the modal
      hideModal("book-details-modal");
    });
  }

  // Display similar books
  const bookObj = {
    title: book.title,
    author: book.author_name ? book.author_name[0] : "Unknown author",
    categories: book.subject || [],
    olid: book.key,
  };

  displaySimilarBooks(bookObj);
}

// Initialize book form
function initBookForm() {
  const bookForm = document.getElementById("book-form");
  if (!bookForm) return;

  // Add book button - only visible to admins
  const addBookBtn = document.getElementById("add-book-btn");
  if (addBookBtn) {
    if (isAdmin()) {
      addBookBtn.classList.remove("hidden");
    } else {
      addBookBtn.classList.add("hidden");
    }
  }

  bookForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Only admins can add/edit books
    if (!isAdmin()) {
      createNotification("Only administrators can manage books.", "error");
      return;
    }

    const bookId = this.getAttribute("data-id");
    const isEditing = !!bookId;

    // Get form values
    const title = document.getElementById("book-title").value;
    const author = document.getElementById("book-author").value;
    const isbn = document.getElementById("book-isbn").value;
    const publisher = document.getElementById("book-publisher").value;
    const year = document.getElementById("book-year").value;
    const cover = document.getElementById("book-cover").value;
    const notes = document.getElementById("book-notes").value;

    // Get selected categories
    const categoriesSelect = document.getElementById("book-categories-select");
    const selectedCategories = Array.from(categoriesSelect.selectedOptions).map(
      (option) => option.value
    );

    if (isEditing) {
      // Update existing book
      const books = getBooks();
      const bookIndex = books.findIndex((book) => book.id === bookId);

      if (bookIndex !== -1) {
        const updatedBook = {
          ...books[bookIndex],
          title,
          author,
          isbn,
          publisher,
          year,
          cover,
          notes,
          categories: selectedCategories,
        };

        updateBook(updatedBook);
        createNotification(`"${title}" has been updated.`, "success");
      }
    } else {
      // Add new book
      const newBook = {
        title,
        author,
        isbn,
        publisher,
        year,
        cover,
        notes,
        categories: selectedCategories,
        addedDate: new Date().toISOString(),
        status: "available",
        borrowedBy: null,
        dueDate: null,
      };

      addBook(newBook);
      createNotification(
        `"${title}" has been added to your library.`,
        "success"
      );
    }

    // Reset form and close modal
    bookForm.reset();
    bookForm.removeAttribute("data-id");
    hideModal("book-modal");

    // Reload books
    loadBooks();
  });
}

// Initialize book search
function initBookSearch() {
  const searchForm = document.getElementById("search-form");
  const searchResults = document.getElementById("search-results");

  if (!searchForm || !searchResults) return;

  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const query = document.getElementById("search-input").value.trim();

    if (!query) {
      searchResults.innerHTML = "<p>Please enter a search term.</p>";
      return;
    }

    searchResults.innerHTML = "<p>Searching...</p>";

    try {
      const results = await searchBooks(query);

      if (results.length === 0) {
        searchResults.innerHTML =
          "<p>No results found. Try a different search term.</p>";
        return;
      }

      searchResults.innerHTML = "";

      const resultsGrid = document.createElement("div");
      resultsGrid.className = "search-results-grid";

      results.forEach((book) => {
        const coverUrl = book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : null;

        const bookCard = document.createElement("div");
        bookCard.className = "book-card";

        bookCard.innerHTML = `
                    <div class="book-cover">
                        ${
                          coverUrl
                            ? `<img src="${coverUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover'">`
                            : `<img src="https://via.placeholder.com/150x200?text=No+Cover" alt="No cover available">`
                        }
                    </div>
                    <div class="book-info">
                        <h3 class="book-title">${book.title}</h3>
                        <p class="book-author">${
                          book.author_name
                            ? book.author_name[0]
                            : "Unknown author"
                        }</p>
                        <p class="book-year">${
                          book.first_publish_year || "Year unknown"
                        }</p>
                        <button class="view-details-btn" data-key="${
                          book.key
                        }">View Details</button>
                    </div>
                `;

        resultsGrid.appendChild(bookCard);
      });

      searchResults.appendChild(resultsGrid);

      // Add event listeners to view buttons
      document.querySelectorAll(".view-details-btn").forEach((button) => {
        button.addEventListener("click", async function () {
          const key = this.getAttribute("data-key");

          try {
            const details = await fetchBookDetails(key);

            // Find the book in search results
            const bookIndex = results.findIndex((b) => b.key === key);
            if (bookIndex !== -1) {
              showBookDetailsFromAPI(results[bookIndex], details);
            }
          } catch (error) {
            console.error("Error fetching book details:", error);
            createNotification(
              "Failed to load book details. Please try again.",
              "error"
            );
          }
        });
      });
    } catch (error) {
      console.error("Error searching books:", error);
      searchResults.innerHTML = `<p>An error occurred: ${error.message}. Please try again.</p>`;
    }
  });
}

// Initialize ISBN search
function initISBNSearch() {
  const isbnForm = document.getElementById("isbn-form");
  const isbnResults = document.getElementById("isbn-results");

  if (!isbnForm || !isbnResults) return;

  isbnForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const isbn = document
      .getElementById("isbn-input")
      .value.trim()
      .replace(/-/g, "");

    if (!isbn) {
      isbnResults.innerHTML = "<p>Please enter an ISBN.</p>";
      return;
    }

    isbnResults.innerHTML = "<p>Searching...</p>";

    try {
      const details = await fetchBookByISBN(isbn);

      isbnResults.innerHTML = "";

      const book = details.bookData;

      const coverUrl = book.cover ? book.cover.medium : null;

      const bookCard = document.createElement("div");
      bookCard.className = "book-card";

      bookCard.innerHTML = `
                <div class="book-cover">
                    ${
                      coverUrl
                        ? `<img src="${coverUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover'">`
                        : `<img src="https://via.placeholder.com/150x200?text=No+Cover" alt="No cover available">`
                    }
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${
                      book.authors ? book.authors[0].name : "Unknown author"
                    }</p>
                    <p class="book-publisher">${
                      book.publishers ? book.publishers[0] : "Unknown publisher"
                    }</p>
                    <button class="view-details-btn" data-isbn="${isbn}">View Details</button>
                </div>
            `;

      isbnResults.appendChild(bookCard);

      // Add event listener to view button
      bookCard
        .querySelector(".view-details-btn")
        .addEventListener("click", function () {
          const isbn = this.getAttribute("data-isbn");

          // Create a simplified book object for display
          const bookObj = {
            title: book.title,
            author_name: book.authors
              ? [book.authors[0].name]
              : ["Unknown author"],
            first_publish_year: book.publish_date
              ? book.publish_date.split(", ").pop()
              : "",
            isbn: [isbn],
            publisher: book.publishers,
            cover_i: book.cover
              ? book.cover.medium.split("/").pop().split("-")[0]
              : null,
            key: book.key,
            subject: details.worksData ? details.worksData.subjects : [],
          };

          showBookDetailsFromAPI(bookObj, details);
        });
    } catch (error) {
      console.error("Error searching by ISBN:", error);
      isbnResults.innerHTML = `<p>An error occurred: ${error.message}. Please try again.</p>`;
    }
  });
}
