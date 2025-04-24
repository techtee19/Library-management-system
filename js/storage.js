// storage.js - Local storage management

// Get books from localStorage
function getBooks() {
  const books = JSON.parse(localStorage.getItem("books")) || []
  return books
}

// Save books to localStorage
function saveBooks(books) {
  localStorage.setItem("books", JSON.stringify(books))
}

// Add a new book
function addBook(book) {
  const books = getBooks()

  // Generate a unique ID if not provided
  if (!book.id) {
    book.id = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9)
  }

  // Set default values for new fields if not provided
  if (!book.status) {
    book.status = "available"
  }
  if (!book.borrowedBy) {
    book.borrowedBy = null
  }
  if (!book.dueDate) {
    book.dueDate = null
  }

  books.push(book)
  saveBooks(books)

  // Update category counts
  updateCategoryCount()

  return book
}

// Update an existing book
function updateBook(updatedBook) {
  const books = getBooks()
  const index = books.findIndex((book) => book.id === updatedBook.id)

  if (index !== -1) {
    books[index] = updatedBook
    saveBooks(books)
    updateCategoryCount()
    return updatedBook
  }

  return null
}

// Delete a book
function deleteBook(bookId) {
  const books = getBooks()
  const filteredBooks = books.filter((book) => book.id !== bookId)

  if (filteredBooks.length !== books.length) {
    saveBooks(filteredBooks)
    updateCategoryCount()
    return true
  }

  return false
}

// Get categories from localStorage
function getCategories() {
  const categories = JSON.parse(localStorage.getItem("categories")) || []
  return categories
}

// Save categories to localStorage
function saveCategories(categories) {
  localStorage.setItem("categories", JSON.stringify(categories))
}

// Add a new category
function addCategory(categoryName) {
  const categories = getCategories()

  // Check if category already exists (case insensitive)
  if (categories.some((cat) => cat.name.toLowerCase() === categoryName.toLowerCase())) {
    return false
  }

  // Generate a unique ID
  const categoryId = Date.now().toString() + "-" + Math.random().toString(36).substr(2, 9)

  // Add new category
  categories.push({
    id: categoryId,
    name: categoryName,
    count: 0,
  })

  saveCategories(categories)
  return true
}

// Delete a category
function deleteCategory(categoryId) {
  const categories = getCategories()
  const books = getBooks()

  // Remove category from categories list
  const filteredCategories = categories.filter((cat) => cat.id !== categoryId)

  if (filteredCategories.length === categories.length) {
    return false
  }

  // Find the category name
  const category = categories.find((cat) => cat.id === categoryId)
  const categoryName = category ? category.name : null

  if (categoryName) {
    // Remove category from all books
    const updatedBooks = books.map((book) => {
      if (book.categories && book.categories.includes(categoryName)) {
        return {
          ...book,
          categories: book.categories.filter((cat) => cat !== categoryName),
        }
      }
      return book
    })

    saveBooks(updatedBooks)
  }

  saveCategories(filteredCategories)
  return true
}

// Update category counts based on books
function updateCategoryCount() {
  const books = getBooks()
  const categories = getCategories()

  // Reset all counts to 0
  categories.forEach((category) => {
    category.count = 0
  })

  // Count books in each category
  books.forEach((book) => {
    if (book.categories) {
      book.categories.forEach((categoryName) => {
        const category = categories.find((cat) => cat.name === categoryName)
        if (category) {
          category.count++
        } else {
          // If category doesn't exist in the categories list, add it
          addCategory(categoryName)
        }
      })
    }
  })

  // Update categories with new counts
  saveCategories(categories)
}

// Get borrowed books count for a user
function getBorrowedBooksCount(userId) {
  const books = getBooks()
  return books.filter((book) => book.status === "borrowed" && book.borrowedBy === userId).length
}

// Get overdue books for a user
function getOverdueBooks(userId) {
  const books = getBooks()
  const today = new Date()

  return books.filter((book) => {
    if (book.status === "borrowed" && book.borrowedBy === userId && book.dueDate) {
      const dueDate = new Date(book.dueDate)
      return dueDate < today
    }
    return false
  })
}

// Export library data
function exportLibraryData() {
  return {
    books: getBooks(),
    categories: getCategories(),
  }
}

// Import books from JSON
function importBooksFromJSON(data) {
  if (!Array.isArray(data)) {
    throw new Error("Invalid data format: Expected an array of books")
  }

  const existingBooks = getBooks()
  let importedCount = 0

  data.forEach((book) => {
    // Check if book already exists (by title and author)
    if (!existingBooks.some((b) => b.title === book.title && b.author === book.author)) {
      addBook(book)
      importedCount++
    }
  })

  return importedCount
}

// Export all functions
export {
  getBooks,
  saveBooks,
  addBook,
  updateBook,
  deleteBook,
  getCategories,
  saveCategories,
  addCategory,
  deleteCategory,
  updateCategoryCount,
  getBorrowedBooksCount,
  getOverdueBooks,
  exportLibraryData,
  importBooksFromJSON,
}
