// recommendations.js - Recommendation system functionality

import { getBooks } from "./storage.js"
import { fetchBookDetails, fetchBooksByCategory, showLoadingIndicator, hideLoadingIndicator } from "./api.js"
import { showBookDetailsFromAPI } from "./books.js"

// Fetch recommendations based on a book
async function fetchRecommendations(book) {
  try {
    showLoadingIndicator()

    // Prepare arrays to store different types of recommendations
    let subjectRecommendations = []
    let authorRecommendations = []
    let workRecommendations = []

    // 1. Get recommendations by subject
    if (book.categories && book.categories.length > 0) {
      // Use the first category for recommendations
      const category = encodeURIComponent(book.categories[0])
      const subjectResponse = await fetch(`https://openlibrary.org/subjects/${category}.json?limit=10`)

      if (subjectResponse.ok) {
        const subjectData = await subjectResponse.json()
        subjectRecommendations = subjectData.works || []
      }
    }

    // 2. Get recommendations by author
    if (book.author) {
      // Search for books by the same author
      const authorQuery = encodeURIComponent(book.author)
      const authorResponse = await fetch(`https://openlibrary.org/search.json?author=${authorQuery}&limit=10`)

      if (authorResponse.ok) {
        const authorData = await authorResponse.json()
        authorRecommendations = authorData.docs || []
      }
    }

    // 3. Get recommendations by work (if we have an Open Library ID)
    if (book.olid) {
      try {
        // Extract the work ID from the book's Open Library ID
        const workResponse = await fetch(`https://openlibrary.org${book.olid}.json`)

        if (workResponse.ok) {
          const bookData = await workResponse.json()

          if (bookData.works && bookData.works.length > 0) {
            const workKey = bookData.works[0].key
            const similarWorksResponse = await fetch(`https://openlibrary.org${workKey}/related.json`)

            if (similarWorksResponse.ok) {
              const similarWorksData = await similarWorksResponse.json()
              workRecommendations = similarWorksData.works || []
            }
          }
        }
      } catch (error) {
        console.error("Error fetching work recommendations:", error)
      }
    }

    // Combine all recommendations and remove duplicates
    const allRecommendations = [
      ...subjectRecommendations.map((work) => ({
        title: work.title,
        authors: work.authors ? work.authors.map((a) => a.name).join(", ") : "Unknown",
        cover_id: work.cover_id,
        key: work.key,
        first_publish_year: work.first_publish_year,
        source: "subject",
        subject: book.categories[0],
      })),
      ...authorRecommendations.map((doc) => ({
        title: doc.title,
        authors: doc.author_name ? doc.author_name.join(", ") : "Unknown",
        cover_id: doc.cover_i,
        key: doc.key,
        first_publish_year: doc.first_publish_year,
        source: "author",
        author: book.author,
      })),
      ...workRecommendations.map((work) => ({
        title: work.title,
        authors: work.authors ? work.authors.map((a) => a.name).join(", ") : "Unknown",
        cover_id: work.cover_id,
        key: work.key,
        first_publish_year: work.first_publish_year,
        source: "work",
        work: book.title,
      })),
    ]

    // Remove duplicates based on title
    const uniqueRecommendations = []
    const titles = new Set()

    allRecommendations.forEach((rec) => {
      if (!titles.has(rec.title)) {
        titles.add(rec.title)
        uniqueRecommendations.push(rec)
      }
    })

    // Remove the original book from recommendations
    const filteredRecommendations = uniqueRecommendations.filter(
      (rec) => rec.title.toLowerCase() !== book.title.toLowerCase(),
    )

    // Remove books that are already in the user's library
    const userBooks = getBooks()
    const userBookTitles = new Set(userBooks.map((b) => b.title.toLowerCase()))

    const finalRecommendations = filteredRecommendations.filter((rec) => !userBookTitles.has(rec.title.toLowerCase()))

    return finalRecommendations
  } catch (error) {
    console.error("Error fetching recommendations:", error)
    throw error
  } finally {
    hideLoadingIndicator()
  }
}

// Display recommendations in the recommendations container
function displayRecommendations(recommendations, container) {
  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = `
            <div class="no-results">
                <p>No recommendations found. Try a different book.</p>
            </div>
        `
    return
  }

  container.innerHTML = ""

  const bookGrid = document.createElement("div")
  bookGrid.className = "book-grid"

  recommendations.forEach((book) => {
    const coverUrl = book.cover_id ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg` : null

    const bookCard = document.createElement("div")
    bookCard.className = "book-card"
    bookCard.dataset.bookKey = book.key

    // Create a badge based on recommendation source
    let sourceBadge = ""
    if (book.source === "subject") {
      sourceBadge = `<span class="rec-badge subject-badge">Similar Category: ${book.subject}</span>`
    } else if (book.source === "author") {
      sourceBadge = `<span class="rec-badge author-badge">Same Author: ${book.author}</span>`
    } else if (book.source === "work") {
      sourceBadge = `<span class="rec-badge work-badge">Related to: ${book.work}</span>`
    }

    bookCard.innerHTML = `
            <div class="book-cover">
                ${
                  coverUrl
                    ? `<img src="${coverUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/200x300?text=No+Cover'">`
                    : `<img src="https://via.placeholder.com/200x300?text=No+Cover" alt="No cover available">`
                }
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <p class="book-author">${book.authors}</p>
                <p class="book-year">${book.first_publish_year || "Year unknown"}</p>
                ${sourceBadge}
                <button class="view-rec-btn" data-key="${book.key}">View Details</button>
            </div>
        `

    bookGrid.appendChild(bookCard)
  })

  container.appendChild(bookGrid)

  // Add event listeners to view buttons
  document.querySelectorAll(".view-rec-btn").forEach((button) => {
    button.addEventListener("click", async function (e) {
      e.stopPropagation()
      const key = this.getAttribute("data-key")
      try {
        const details = await fetchBookDetails(key)

        // Create a simplified book object for display
        const book = {
          title: details.bookData.title,
          author_name: details.authorData ? [details.authorData.name] : ["Unknown author"],
          first_publish_year: details.bookData.publish_date ? details.bookData.publish_date.split(", ").pop() : "",
          key: key,
          subject: details.worksData ? details.worksData.subjects : [],
        }

        showBookDetailsFromAPI(book, details)
      } catch (error) {
        console.error("Error fetching book details:", error)
        alert("Failed to load book details. Please try again.")
      }
    })
  })
}

// Get personalized recommendations based on user's library
async function getPersonalizedRecommendations() {
  try {
    showLoadingIndicator()
    const recommendationsContainer = document.getElementById("recommendations-container")
    if (recommendationsContainer) {
      recommendationsContainer.innerHTML = "<p>Generating personalized recommendations...</p>"
    }

    const userBooks = getBooks()

    if (userBooks.length === 0) {
      if (recommendationsContainer) {
        recommendationsContainer.innerHTML = `
                    <div class="no-results">
                        <p>Add some books to your library to get personalized recommendations.</p>
                    </div>
                `
      }
      return
    }

    // Get the most recent 3 books added to the library
    const recentBooks = [...userBooks]
      .sort((a, b) => {
        // Sort by ID in descending order (assuming higher IDs are more recent)
        return b.id.localeCompare(a.id)
      })
      .slice(0, 3)

    // Get recommendations for each recent book
    const recommendationPromises = recentBooks.map((book) => fetchRecommendations(book))
    const recommendationsArrays = await Promise.all(recommendationPromises)

    // Combine all recommendations
    let allRecommendations = []
    recommendationsArrays.forEach((recs) => {
      allRecommendations = [...allRecommendations, ...recs]
    })

    // Remove duplicates
    const uniqueRecommendations = []
    const titles = new Set()

    allRecommendations.forEach((rec) => {
      if (!titles.has(rec.title)) {
        titles.add(rec.title)
        uniqueRecommendations.push(rec)
      }
    })

    // Limit to 20 recommendations
    const limitedRecommendations = uniqueRecommendations.slice(0, 20)

    // Display recommendations
    if (recommendationsContainer) {
      displayRecommendations(limitedRecommendations, recommendationsContainer)
    }

    // Update the recent books section
    const recentBooksContainer = document.getElementById("recent-books-container")
    if (recentBooksContainer) {
      recentBooksContainer.innerHTML = ""

      const recentBooksHeading = document.createElement("h3")
      recentBooksHeading.textContent = "Based on your recent books:"
      recentBooksContainer.appendChild(recentBooksHeading)

      const recentBooksList = document.createElement("div")
      recentBooksList.className = "recent-books-list"

      recentBooks.forEach((book) => {
        const bookItem = document.createElement("div")
        bookItem.className = "recent-book-item"

        const coverUrl = book.cover || "https://via.placeholder.com/80x120?text=No+Cover"

        bookItem.innerHTML = `
                    <img src="${coverUrl}" alt="${book.title}" class="recent-book-cover">
                    <div class="recent-book-info">
                        <h4>${book.title}</h4>
                        <p>${book.author}</p>
                    </div>
                `

        recentBooksList.appendChild(bookItem)
      })

      recentBooksContainer.appendChild(recentBooksList)
    }
  } catch (error) {
    console.error("Error getting personalized recommendations:", error)
    const recommendationsContainer = document.getElementById("recommendations-container")
    if (recommendationsContainer) {
      recommendationsContainer.innerHTML = `
                <div class="error-message">
                    <p>An error occurred while generating recommendations: ${error.message}. Please try again later.</p>
                </div>
            `
    }
  } finally {
    hideLoadingIndicator()
  }
}

// Get category-based recommendations
async function getCategoryRecommendations(category) {
  try {
    showLoadingIndicator()
    const categoryRecommendationsContainer = document.getElementById("category-recommendations-container")
    if (categoryRecommendationsContainer) {
      categoryRecommendationsContainer.innerHTML = `<p>Loading recommendations for ${category}...</p>`
    }

    const works = await fetchBooksByCategory(category)

    if (!works || works.length === 0) {
      if (categoryRecommendationsContainer) {
        categoryRecommendationsContainer.innerHTML = `
                    <div class="no-results">
                        <p>No books found for category "${category}". Try a different category.</p>
                    </div>
                `
      }
      return
    }

    // Format the recommendations
    const recommendations = works.map((work) => ({
      title: work.title,
      authors: work.authors ? work.authors.map((a) => a.name).join(", ") : "Unknown",
      cover_id: work.cover_id,
      key: work.key,
      first_publish_year: work.first_publish_year,
      source: "subject",
      subject: category,
    }))

    // Remove books that are already in the user's library
    const userBooks = getBooks()
    const userBookTitles = new Set(userBooks.map((b) => b.title.toLowerCase()))

    const filteredRecommendations = recommendations.filter((rec) => !userBookTitles.has(rec.title.toLowerCase()))

    // Display recommendations
    if (categoryRecommendationsContainer) {
      displayRecommendations(filteredRecommendations, categoryRecommendationsContainer)
    }
  } catch (error) {
    console.error("Error getting category recommendations:", error)
    const categoryRecommendationsContainer = document.getElementById("category-recommendations-container")
    if (categoryRecommendationsContainer) {
      categoryRecommendationsContainer.innerHTML = `
                <div class="error-message">
                    <p>An error occurred while loading recommendations: ${error.message}. Please try again later.</p>
                </div>
            `
    }
  } finally {
    hideLoadingIndicator()
  }
}

// Get similar books for a specific book
async function getSimilarBooks(book) {
  try {
    const recommendations = await fetchRecommendations(book)

    // Limit to 6 recommendations for the modal
    const limitedRecommendations = recommendations.slice(0, 6)

    return limitedRecommendations
  } catch (error) {
    console.error("Error getting similar books:", error)
    throw error
  }
}

// Display similar books in the book details modal
async function displaySimilarBooks(book) {
  const similarBooksContainer = document.getElementById("similar-books-container")
  if (!similarBooksContainer) return

  similarBooksContainer.innerHTML = "<p>Loading similar books...</p>"

  try {
    const similarBooks = await getSimilarBooks(book)

    if (!similarBooks || similarBooks.length === 0) {
      similarBooksContainer.innerHTML = "<p>No similar books found.</p>"
      return
    }

    similarBooksContainer.innerHTML = "<h3>You might also like:</h3>"

    const bookGrid = document.createElement("div")
    bookGrid.className = "similar-books-grid"

    similarBooks.forEach((book) => {
      const coverUrl = book.cover_id ? `https://covers.openlibrary.org/b/id/${book.cover_id}-S.jpg` : null

      const bookCard = document.createElement("div")
      bookCard.className = "similar-book-card"
      bookCard.dataset.bookKey = book.key

      bookCard.innerHTML = `
                <div class="similar-book-cover">
                    ${
                      coverUrl
                        ? `<img src="${coverUrl}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/100x150?text=No+Cover'">`
                        : `<img src="https://via.placeholder.com/100x150?text=No+Cover" alt="No cover available">`
                    }
                </div>
                <div class="similar-book-info">
                    <h4 class="similar-book-title">${book.title}</h4>
                    <p class="similar-book-author">${book.authors}</p>
                </div>
            `

      bookCard.addEventListener("click", async () => {
        try {
          const details = await fetchBookDetails(book.key)

          // Create a simplified book object for display
          const bookObj = {
            title: details.bookData.title,
            author_name: details.authorData ? [details.authorData.name] : ["Unknown author"],
            first_publish_year: details.bookData.publish_date ? details.bookData.publish_date.split(", ").pop() : "",
            key: book.key,
            subject: details.worksData ? details.worksData.subjects : [],
          }

          showBookDetailsFromAPI(bookObj, details)
        } catch (error) {
          console.error("Error showing book details:", error)
          alert("Failed to load book details. Please try again.")
        }
      })

      bookGrid.appendChild(bookCard)
    })

    similarBooksContainer.appendChild(bookGrid)
  } catch (error) {
    console.error("Error displaying similar books:", error)
    similarBooksContainer.innerHTML = `<p>Error loading similar books: ${error.message}</p>`
  }
}

// Initialize recommendations
function initRecommendations() {
  // Tab switching for recommendations
  const recTabButtons = document.querySelectorAll(".rec-tab-btn")
  const recTabContents = document.querySelectorAll(".tab-content")

  recTabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab")

      // Update active tab button
      recTabButtons.forEach((btn) => btn.classList.remove("active"))
      this.classList.add("active")

      // Show selected tab content
      recTabContents.forEach((content) => {
        content.classList.add("hidden")
        if (content.id === tabId) {
          content.classList.remove("hidden")
        }
      })
    })
  })

  // Refresh recommendations button
  const refreshRecommendationsBtn = document.getElementById("refresh-recommendations-btn")
  if (refreshRecommendationsBtn) {
    refreshRecommendationsBtn.addEventListener("click", () => {
      getPersonalizedRecommendations()
    })
  }

  // Category select change
  const recommendationCategorySelect = document.getElementById("recommendation-category-select")
  if (recommendationCategorySelect) {
    recommendationCategorySelect.addEventListener("change", function () {
      const category = this.value
      if (category) {
        getCategoryRecommendations(category)
      } else {
        const categoryRecommendationsContainer = document.getElementById("category-recommendations-container")
        if (categoryRecommendationsContainer) {
          categoryRecommendationsContainer.innerHTML = `
                        <div class="no-results">
                            <p>Please select a category to see recommendations.</p>
                        </div>
                    `
        }
      }
    })
  }
}

// Export all functions
export {
  fetchRecommendations,
  displayRecommendations,
  getPersonalizedRecommendations,
  getCategoryRecommendations,
  getSimilarBooks,
  displaySimilarBooks,
  initRecommendations,
}
