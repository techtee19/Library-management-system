// ui.js - Common UI utilities and functions

// Show a modal
function showModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.remove("hidden")
    document.body.classList.add("modal-open")
  }
}

// Hide a modal
function hideModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add("hidden")
    document.body.classList.remove("modal-open")
  }
}

// Show a page
function showPage(pageId) {
  // Hide all pages
  const pages = document.querySelectorAll(".page")
  pages.forEach((page) => {
    page.classList.add("hidden")
  })

  // Show the selected page
  const selectedPage = document.getElementById(pageId)
  if (selectedPage) {
    selectedPage.classList.remove("hidden")
  }

  // Update active nav item
  const navItems = document.querySelectorAll(".nav-links li")
  navItems.forEach((item) => {
    item.classList.remove("active")
    if (item.getAttribute("data-page") === pageId) {
      item.classList.add("active")
    }
  })
}

// Create a notification
function createNotification(message, type = "success") {
  const notificationsContainer = document.getElementById("notifications")
  if (!notificationsContainer) return

  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.innerHTML = `
        <span>${message}</span>
        <button class="close-btn">&times;</button>
    `

  notificationsContainer.appendChild(notification)

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.classList.add("fade-out")
    setTimeout(() => {
      notification.remove()
    }, 300)
  }, 5000)

  // Close button
  notification.querySelector(".close-btn").addEventListener("click", () => {
    notification.classList.add("fade-out")
    setTimeout(() => {
      notification.remove()
    }, 300)
  })
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Create element with attributes and children
function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag)

  // Set attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === "className") {
      element.className = value
    } else if (key === "textContent") {
      element.textContent = value
    } else if (key === "innerHTML") {
      element.innerHTML = value
    } else {
      element.setAttribute(key, value)
    }
  })

  // Append children
  children.forEach((child) => {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child))
    } else {
      element.appendChild(child)
    }
  })

  return element
}

// Export all functions
export { showModal, hideModal, showPage, createNotification, formatDate, createElement }
