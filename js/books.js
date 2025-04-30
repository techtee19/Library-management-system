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
  loadBooks,
  filterBooksByCategory,
  showBookDetails,
  showEditBookForm,
} from "./bookUI.js";

import { initBookSearch, initISBNSearch } from "./bookSearch.js";

import {
  getBooks,
  addBook,
  updateBook,
  saveBooks,
  deleteBook,
} from "./storage.js";
import { fetchBooksByCategory } from "./api.js";
import { showModal, hideModal, createNotification, formatDate } from "./ui.js";
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
