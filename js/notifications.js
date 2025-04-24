// notifications.js - Handles notifications for book due dates and overdue books

import { getBooks, getOverdueBooks } from "./storage.js"
import { getCurrentUser } from "./auth.js"
import { createNotification, formatDate } from "./ui.js"

// Check for books due soon (within 3 days)
function checkBooksDueSoon() {
  if (!getCurrentUser()) return

  const userId = getCurrentUser().id
  const books = getBooks()
  const today = new Date()
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(today.getDate() + 3)

  const booksDueSoon = books.filter((book) => {
    if (book.status === "borrowed" && book.borrowedBy === userId && book.dueDate) {
      const dueDate = new Date(book.dueDate)
      return dueDate > today && dueDate <= threeDaysFromNow
    }
    return false
  })

  if (booksDueSoon.length > 0) {
    booksDueSoon.forEach((book) => {
      createNotification(`Book "${book.title}" is due soon! Please return by ${formatDate(book.dueDate)}.`, "warning")
    })
  }
}

// Check for overdue books
function checkOverdueBooks() {
  if (!getCurrentUser()) return

  const userId = getCurrentUser().id
  const overdueBooks = getOverdueBooks(userId)

  if (overdueBooks.length > 0) {
    overdueBooks.forEach((book) => {
      createNotification(`Book "${book.title}" is overdue! It was due on ${formatDate(book.dueDate)}.`, "error")
    })
  }
}

// Initialize notifications
function initNotifications() {
  // Check on page load
  setTimeout(() => {
    checkBooksDueSoon()
    checkOverdueBooks()
  }, 2000) // Delay to avoid overwhelming the user with notifications on load
}

export { initNotifications, checkBooksDueSoon, checkOverdueBooks }
