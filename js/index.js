// index.js - Main entry point for the index page

import { initApp } from "./app.js"
import { initNotifications } from "./notifications.js"

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the main app
  initApp()

  // Initialize notifications for borrowed books
  initNotifications()
})
