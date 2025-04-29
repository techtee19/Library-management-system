export { initBookSearch, initISBNSearch };
import { searchBooks, fetchBookByISBN, fetchBookDetails } from "./api.js";
import { createNotification } from "./ui.js";
import { showBookDetailsFromAPI } from "./books.js";

// initializing book search

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
      searchResults.innerHTML = "";
      if (results.length === 0) {
        searchResults.innerHTML =
          "<p>No results found. Try a different search term.</p>";
        return;
      }
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

// Initializing search by ISBN
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
                        book.publishers
                          ? book.publishers[0]
                          : "Unknown publisher"
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
