// responsive-ui.js - Handles responsive UI interactions

// Toggle sidebar on mobile
function initResponsiveUI() {
  // Create mobile menu button if it doesn't exist
  if (!document.querySelector(".mobile-menu-btn")) {
    const mobileMenuBtn = document.createElement("button")
    mobileMenuBtn.className = "mobile-menu-btn"
    mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>'
    document.body.appendChild(mobileMenuBtn)
  }

  // Create sidebar overlay if it doesn't exist
  if (!document.querySelector(".sidebar-overlay")) {
    const sidebarOverlay = document.createElement("div")
    sidebarOverlay.className = "sidebar-overlay"
    document.body.appendChild(sidebarOverlay)
  }

  // Get elements
  const sidebar = document.querySelector(".sidebar")
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
  const sidebarOverlay = document.querySelector(".sidebar-overlay")
  const toggleSidebarBtn = document.querySelector(".toggle-sidebar-btn")

  // Toggle sidebar on mobile menu button click
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active")
      sidebarOverlay.classList.toggle("active")
      document.body.classList.toggle("sidebar-open")
    })
  }

  // Toggle sidebar on toggle button click
  if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener("click", () => {
      sidebar.classList.toggle("active")
      sidebarOverlay.classList.toggle("active")
      document.body.classList.toggle("sidebar-open")
    })
  }

  // Close sidebar when clicking on overlay
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", () => {
      sidebar.classList.remove("active")
      sidebarOverlay.classList.remove("active")
      document.body.classList.remove("sidebar-open")
    })
  }

  // Toggle view for books (table/card)
  initViewToggle()

  // Handle modals
  initModals()

  // Add touch-friendly classes
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
    document.body.classList.add("touch-device")
  }

  // Handle window resize
  window.addEventListener("resize", handleResize)
  handleResize()
}

// Toggle between table and card view for books
function initViewToggle() {
  // Create view toggle buttons if they don't exist
  const booksContainer = document.querySelector(".books-container")
  if (booksContainer && !booksContainer.querySelector(".view-toggle")) {
    const viewToggle = document.createElement("div")
    viewToggle.className = "view-toggle"
    viewToggle.innerHTML = `
      <button class="table-view-btn active"><i class="fas fa-list"></i> Table</button>
      <button class="card-view-btn"><i class="fas fa-th"></i> Cards</button>
    `
    booksContainer.insertBefore(viewToggle, booksContainer.firstChild)
  }

  // Add event listeners to view toggle buttons
  const tableViewBtn = document.querySelector(".table-view-btn")
  const cardViewBtn = document.querySelector(".card-view-btn")

  if (tableViewBtn && cardViewBtn) {
    tableViewBtn.addEventListener("click", () => {
      document.querySelector(".books-container").classList.remove("books-card-view")
      tableViewBtn.classList.add("active")
      cardViewBtn.classList.remove("active")
      localStorage.setItem("booksViewMode", "table")
    })

    cardViewBtn.addEventListener("click", () => {
      document.querySelector(".books-container").classList.add("books-card-view")
      cardViewBtn.classList.add("active")
      tableViewBtn.classList.remove("active")
      localStorage.setItem("booksViewMode", "card")
    })

    // Set initial view based on localStorage or screen size
    const savedViewMode = localStorage.getItem("booksViewMode")
    if (savedViewMode === "card" || (window.innerWidth <= 576 && !savedViewMode)) {
      cardViewBtn.click()
    } else {
      tableViewBtn.click()
    }
  }

  // Create borrowed books view toggle
  const borrowedBooksContainer = document.querySelector(".borrowed-books-container")
  if (borrowedBooksContainer && !borrowedBooksContainer.querySelector(".view-toggle-borrowed")) {
    const viewToggle = document.createElement("div")
    viewToggle.className = "view-toggle-borrowed"
    viewToggle.innerHTML = `
      <button class="table-view-borrowed-btn active"><i class="fas fa-list"></i> Table</button>
      <button class="card-view-borrowed-btn"><i class="fas fa-th"></i> Cards</button>
    `
    borrowedBooksContainer.insertBefore(viewToggle, borrowedBooksContainer.firstChild)
  }

  // Add event listeners to borrowed books view toggle buttons
  const tableViewBorrowedBtn = document.querySelector(".table-view-borrowed-btn")
  const cardViewBorrowedBtn = document.querySelector(".card-view-borrowed-btn")

  if (tableViewBorrowedBtn && cardViewBorrowedBtn) {
    tableViewBorrowedBtn.addEventListener("click", () => {
      borrowedBooksContainer.classList.add("borrowed-books-table-view")
      borrowedBooksContainer.classList.remove("borrowed-books-card-view")
      tableViewBorrowedBtn.classList.add("active")
      cardViewBorrowedBtn.classList.remove("active")
      localStorage.setItem("borrowedBooksViewMode", "table")
    })

    cardViewBorrowedBtn.addEventListener("click", () => {
      borrowedBooksContainer.classList.remove("borrowed-books-table-view")
      borrowedBooksContainer.classList.add("borrowed-books-card-view")
      cardViewBorrowedBtn.classList.add("active")
      tableViewBorrowedBtn.classList.remove("active")
      localStorage.setItem("borrowedBooksViewMode", "card")
    })

    // Set initial view based on localStorage or screen size
    const savedViewMode = localStorage.getItem("borrowedBooksViewMode")
    if (savedViewMode === "card" || (window.innerWidth <= 576 && !savedViewMode)) {
      cardViewBorrowedBtn.click()
    } else {
      tableViewBorrowedBtn.click()
    }
  }
}

// Initialize modals
function initModals() {
  // Get all modals
  const modals = document.querySelectorAll(".modal")

  // Add active class for proper animation
  modals.forEach((modal) => {
    // Close modal when clicking outside content
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal(modal)
      }
    })

    // Close modal when clicking close button
    const closeBtn = modal.querySelector(".close-btn")
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        closeModal(modal)
      })
    }

    // Close modal when clicking cancel button
    const cancelBtn = modal.querySelector(".close-modal-btn")
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        closeModal(modal)
      })
    }
  })

  // Add keyboard support for modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const activeModal = document.querySelector(".modal.active")
      if (activeModal) {
        closeModal(activeModal)
      }
    }
  })
}

// Open modal
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add("active")
    document.body.classList.add("modal-open")

    // Focus the first input in the modal
    setTimeout(() => {
      const firstInput = modal.querySelector("input, button:not(.close-btn)")
      if (firstInput) {
        firstInput.focus()
      }
    }, 100)
  }
}

// Close modal
function closeModal(modal) {
  if (typeof modal === "string") {
    modal = document.getElementById(modal)
  }

  if (modal) {
    modal.classList.remove("active")
    document.body.classList.remove("modal-open")
  }
}

// Handle window resize
function handleResize() {
  const sidebar = document.querySelector(".sidebar")
  const sidebarOverlay = document.querySelector(".sidebar-overlay")

  // Close sidebar on window resize (for mobile)
  if (window.innerWidth >= 992) {
    sidebar.classList.remove("active")
    sidebarOverlay.classList.remove("active")
    document.body.classList.remove("sidebar-open")
  }

  // Add collapsed class to sidebar for medium screens
  if (window.innerWidth >= 992 && window.innerWidth < 1200) {
    sidebar.classList.add("collapsed")
  } else {
    sidebar.classList.remove("collapsed")
  }
}

// Create card view for books table
function createBooksCardView() {
  const booksTable = document.querySelector(".books-table")
  if (!booksTable) return

  // Create card container if it doesn't exist
  let cardContainer = document.querySelector(".books-card-container")
  if (!cardContainer) {
    cardContainer = document.createElement("div")
    cardContainer.className = "books-card-container"
    booksTable.parentNode.appendChild(cardContainer)
  } else {
    cardContainer.innerHTML = ""
  }

  // Get all rows except header
  const rows = Array.from(booksTable.querySelectorAll("tbody tr"))

  // Create cards from rows
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td")
    if (cells.length === 0) return

    const coverCell = cells[0]
    const titleCell = cells[1]
    const authorCell = cells[2]
    const statusCell = cells[4]
    const actionsCell = cells[6]

    const card = document.createElement("div")
    card.className = "book-card"

    const coverImg = coverCell.querySelector("img")
    const title = titleCell.textContent.trim()
    const author = authorCell.textContent.trim()
    const status = statusCell.innerHTML
    const actions = actionsCell.innerHTML

    card.innerHTML = `
      <div class="book-card-cover">
        ${coverImg ? coverImg.outerHTML : '<img src="https://via.placeholder.com/150x200?text=No+Cover" alt="No cover">'}
      </div>
      <div class="book-card-info">
        <h3 class="book-card-title">${title}</h3>
        <p class="book-card-author">${author}</p>
        <div class="book-card-status">${status}</div>
        <div class="book-card-actions">${actions}</div>
      </div>
    `

    cardContainer.appendChild(card)
  })
}

// Create card view for borrowed books
function createBorrowedBooksCardView() {
  const borrowedBooksTable = document.querySelector(".borrowed-books-table")
  if (!borrowedBooksTable) return

  // Create card container if it doesn't exist
  let cardContainer = document.querySelector(".borrowed-books-cards")
  if (!cardContainer) {
    cardContainer = document.createElement("div")
    cardContainer.className = "borrowed-books-cards"
    borrowedBooksTable.parentNode.appendChild(cardContainer)
  } else {
    cardContainer.innerHTML = ""
  }

  // Get all rows except header
  const rows = Array.from(borrowedBooksTable.querySelectorAll("tbody tr"))

  // Create cards from rows
  rows.forEach((row) => {
    const cells = row.querySelectorAll("td")
    if (cells.length === 0) return

    const title = cells[0].textContent.trim()
    const author = cells[1].textContent.trim()
    const borrowedDate = cells.length > 2 ? cells[2].textContent.trim() : ""
    const dueDate = cells.length > 3 ? cells[3].textContent.trim() : ""
    const status = cells.length > 4 ? cells[4].textContent.trim() : ""
    const actions = cells.length > 5 ? cells[5].innerHTML : ""

    const card = document.createElement("div")
    card.className = "borrowed-book-card"

    card.innerHTML = `
      <h3 class="borrowed-book-title">${title}</h3>
      <p class="borrowed-book-author">${author}</p>
      <div class="borrowed-book-dates">
        ${borrowedDate ? `<span>Borrowed: ${borrowedDate}</span>` : ""}
        ${dueDate ? `<span class="${cells[3].className}">Due: ${dueDate}</span>` : ""}
      </div>
      <div class="borrowed-book-status">${status}</div>
      <div class="borrowed-book-actions">${actions}</div>
    `

    cardContainer.appendChild(card)
  })
}

// Initialize responsive UI when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initResponsiveUI()

  // Create card views
  createBooksCardView()
  createBorrowedBooksCardView()

  // Update card views when books are loaded or filtered
  const observer = new MutationObserver(() => {
    createBooksCardView()
  })

  const booksTableBody = document.querySelector(".books-table tbody")
  if (booksTableBody) {
    observer.observe(booksTableBody, { childList: true })
  }

  // Update borrowed books card view when borrowed books are loaded
  const borrowedBooksObserver = new MutationObserver(() => {
    createBorrowedBooksCardView()
  })

  const borrowedBooksContainer = document.querySelector(".borrowed-books-container")
  if (borrowedBooksContainer) {
    borrowedBooksObserver.observe(borrowedBooksContainer, { childList: true, subtree: true })
  }
})

// Export functions
export { openModal, closeModal, initResponsiveUI }
