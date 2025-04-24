// api.js - Handles all API interactions with Open Library

// Fetch book by ISBN
async function fetchBookByISBN(isbn) {
  try {
    showLoadingIndicator()

    // Fetch book data
    const bookResponse = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)
    if (!bookResponse.ok) {
      throw new Error(`HTTP error! Status: ${bookResponse.status}`)
    }

    const bookData = await bookResponse.json()

    if (!bookData[`ISBN:${isbn}`]) {
      throw new Error("Book not found")
    }

    const book = bookData[`ISBN:${isbn}`]

    // Get author data if available
    let authorData = null
    if (book.authors && book.authors.length > 0) {
      const authorUrl = book.authors[0].url.replace("openlibrary.org", "openlibrary.org/authors")
      const authorResponse = await fetch(`${authorUrl}.json`)
      if (authorResponse.ok) {
        authorData = await authorResponse.json()
      }
    }

    // Get works data if available
    let worksData = null
    if (book.works && book.works.length > 0) {
      const worksUrl = book.works[0].url.replace("openlibrary.org", "openlibrary.org")
      const worksResponse = await fetch(`${worksUrl}.json`)
      if (worksResponse.ok) {
        worksData = await worksResponse.json()
      }
    }

    return {
      bookData: book,
      authorData: authorData,
      worksData: worksData,
    }
  } catch (error) {
    console.error("Error fetching book by ISBN:", error)
    throw error
  } finally {
    hideLoadingIndicator()
  }
}

// Search books by title, author, or ISBN
async function searchBooks(query) {
  try {
    showLoadingIndicator()

    const encodedQuery = encodeURIComponent(query)
    const response = await fetch(`https://openlibrary.org/search.json?q=${encodedQuery}&limit=10`)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    return data.docs || []
  } catch (error) {
    console.error("Error searching books:", error)
    throw error
  } finally {
    hideLoadingIndicator()
  }
}

// Fetch book details by Open Library key
async function fetchBookDetails(key) {
  try {
    showLoadingIndicator()

    // Fetch book data
    const bookResponse = await fetch(`https://openlibrary.org${key}.json`)
    if (!bookResponse.ok) {
      throw new Error(`HTTP error! Status: ${bookResponse.status}`)
    }

    const bookData = await bookResponse.json()

    // Get author data if available
    let authorData = null
    if (bookData.authors && bookData.authors.length > 0) {
      const authorKey = bookData.authors[0].author.key
      const authorResponse = await fetch(`https://openlibrary.org${authorKey}.json`)
      if (authorResponse.ok) {
        authorData = await authorResponse.json()
      }
    }

    // Get works data if available
    let worksData = null
    if (bookData.works && bookData.works.length > 0) {
      const worksKey = bookData.works[0].key
      const worksResponse = await fetch(`https://openlibrary.org${worksKey}.json`)
      if (worksResponse.ok) {
        worksData = await worksResponse.json()
      }
    }

    return {
      bookData: bookData,
      authorData: authorData,
      worksData: worksData,
    }
  } catch (error) {
    console.error("Error fetching book details:", error)
    throw error
  } finally {
    hideLoadingIndicator()
  }
}

// Fetch categories from Open Library
async function fetchOpenLibraryCategories() {
  try {
    showLoadingIndicator()

    // Fetch popular subjects
    const response = await fetch("https://openlibrary.org/subjects.json?limit=50")

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    return data.subjects || []
  } catch (error) {
    console.error("Error fetching Open Library categories:", error)
    throw error
  } finally {
    hideLoadingIndicator()
  }
}

// Fetch books by category
async function fetchBooksByCategory(category) {
  try {
    showLoadingIndicator()

    const categoryQuery = encodeURIComponent(category)
    const response = await fetch(`https://openlibrary.org/subjects/${categoryQuery}.json?limit=20`)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    return data.works || []
  } catch (error) {
    console.error("Error fetching books by category:", error)
    throw error
  } finally {
    hideLoadingIndicator()
  }
}

// Helper functions for loading indicator
function showLoadingIndicator() {
  const loadingIndicator = document.getElementById("loading-indicator")
  if (loadingIndicator) {
    loadingIndicator.classList.remove("hidden")
  }
}

function hideLoadingIndicator() {
  const loadingIndicator = document.getElementById("loading-indicator")
  if (loadingIndicator) {
    loadingIndicator.classList.add("hidden")
  }
}

// Export all functions
export {
  fetchBookByISBN,
  searchBooks,
  fetchBookDetails,
  fetchOpenLibraryCategories,
  fetchBooksByCategory,
  showLoadingIndicator,
  hideLoadingIndicator,
}
