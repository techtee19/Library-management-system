// admin-dashboard.js - Admin dashboard functionality

import {
  getUsers,
  getCurrentUser,
  isAdmin,
  logoutUser,
  deleteUser,
  changeUserRole,
  registerUser,
  ROLES,
} from "./auth.js"
import { getBooks, getCategories, exportLibraryData, importBooksFromJSON } from "./storage.js"
import { formatDate, createNotification, showModal, hideModal } from "./ui.js"
import { fetchOpenLibraryCategories } from "./api.js"

// Initialize admin dashboard
function initAdminDashboard() {
  const currentUser = getCurrentUser()

  if (!currentUser || !isAdmin()) {
    window.location.href = "login.html"
    return
  }

  // Set admin info
  const adminNameElement = document.getElementById("admin-name")
  if (adminNameElement) adminNameElement.textContent = currentUser.username

  // Logout button
  const logoutBtn = document.getElementById("logout-btn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault()
      logoutUser()
    })
  }

  // Initialize tabs
  initTabs()

  // Load admin statistics
  loadAdminStatistics()

  // Load users table
  loadUsersTable()

  // Initialize user management
  initUserManagement()

  // Initialize library management
  initLibraryManagement()

  // Initialize system settings
  initSystemSettings()
}

// Initialize tabs
function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabContents = document.querySelectorAll(".tab-content")

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.getAttribute("data-tab")

      // Update active tab button
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      button.classList.add("active")

      // Show selected tab content
      tabContents.forEach((content) => {
        content.classList.add("hidden")
        if (content.id === tabId) {
          content.classList.remove("hidden")
        }
      })
    })
  })
}

// Load admin statistics
function loadAdminStatistics() {
  const books = getBooks()
  const users = getUsers()
  const categories = getCategories()
  const admins = users.filter((user) => user.role === ROLES.ADMIN)

  // Update statistics cards
  const totalBooksElement = document.getElementById("total-books")
  const totalUsersElement = document.getElementById("total-users")
  const totalCategoriesElement = document.getElementById("total-categories")
  const totalAdminsElement = document.getElementById("total-admins")

  if (totalBooksElement) totalBooksElement.textContent = books.length
  if (totalUsersElement) totalUsersElement.textContent = users.length
  if (totalCategoriesElement) totalCategoriesElement.textContent = categories.length
  if (totalAdminsElement) totalAdminsElement.textContent = admins.length

  // Create charts
  createUserRolesChart()
  createBookAddedChart()
  createTopCategoriesChart()
}

// Create user roles chart
function createUserRolesChart() {
  const chartContainer = document.getElementById("user-roles-chart")
  if (!chartContainer) return

  const users = getUsers()
  const roleCount = {}

  // Count users by role
  users.forEach((user) => {
    roleCount[user.role] = (roleCount[user.role] || 0) + 1
  })

  // Create simple pie chart
  chartContainer.innerHTML = ""

  const chart = document.createElement("div")
  chart.className = "pie-chart"

  // Calculate total for percentages
  const total = users.length

  // Define colors for roles
  const roleColors = {
    [ROLES.ADMIN]: "#e74c3c",
    [ROLES.USER]: "#3498db",
  }

  // Create legend
  const legend = document.createElement("div")
  legend.className = "chart-legend"

  Object.entries(roleCount).forEach(([role, count]) => {
    const percentage = ((count / total) * 100).toFixed(1)

    const legendItem = document.createElement("div")
    legendItem.className = "legend-item"

    const colorBox = document.createElement("span")
    colorBox.className = "color-box"
    colorBox.style.backgroundColor = roleColors[role] || "#7f8c8d"

    const label = document.createElement("span")
    label.textContent = `${role}: ${count} (${percentage}%)`

    legendItem.appendChild(colorBox)
    legendItem.appendChild(label)
    legend.appendChild(legendItem)
  })

  // Create pie chart visualization
  const pieContainer = document.createElement("div")
  pieContainer.className = "pie-container"

  let cumulativePercentage = 0
  const pieElements = Object.entries(roleCount).map(([role, count]) => {
    const percentage = (count / total) * 100
    const pieElement = document.createElement("div")
    pieElement.className = "pie-element"
    pieElement.style.backgroundColor = roleColors[role] || "#7f8c8d"
    pieElement.style.transform = `rotate(${cumulativePercentage * 3.6}deg)`
    pieElement.style.clipPath = `polygon(50% 50%, 50% 0%, ${percentage >= 50 ? "100% 0%, 100% 100%, 0% 100%, 0% 0%" : "100% 0%"}, 50% 0%)`

    cumulativePercentage += percentage
    return pieElement
  })

  pieElements.forEach((element) => pieContainer.appendChild(element))

  chart.appendChild(pieContainer)
  chart.appendChild(legend)
  chartContainer.appendChild(chart)
}

// Create books added chart (last 6 months)
function createBookAddedChart() {
  const chartContainer = document.getElementById("books-added-chart")
  if (!chartContainer) return

  const books = getBooks()

  // Get last 6 months
  const months = []
  const monthCounts = []
  const today = new Date()

  for (let i = 5; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1)
    const monthName = month.toLocaleString("default", { month: "short" })
    const monthYear = month.toLocaleString("default", { month: "short", year: "2-digit" })
    months.push(monthYear)
    monthCounts.push({
      month: month,
      name: monthName,
      count: 0,
    })
  }

  // Count books added in each month
  books.forEach((book) => {
    if (book.addedDate) {
      const addedDate = new Date(book.addedDate)
      monthCounts.forEach((monthData) => {
        if (
          addedDate.getMonth() === monthData.month.getMonth() &&
          addedDate.getFullYear() === monthData.month.getFullYear()
        ) {
          monthData.count++
        }
      })
    }
  })

  // Create simple bar chart
  chartContainer.innerHTML = ""

  const chart = document.createElement("div")
  chart.className = "bar-chart horizontal"

  // Find max count for scaling
  const maxCount = Math.max(...monthCounts.map((m) => m.count), 1)

  monthCounts.forEach((monthData) => {
    // Calculate percentage
    const percentage = (monthData.count / maxCount) * 100

    const barContainer = document.createElement("div")
    barContainer.className = "bar-container"

    const barLabel = document.createElement("div")
    barLabel.className = "bar-label"
    barLabel.textContent = monthData.name

    const barWrapper = document.createElement("div")
    barWrapper.className = "bar-wrapper"

    const bar = document.createElement("div")
    bar.className = "bar"
    bar.style.width = `${percentage}%`

    const barValue = document.createElement("span")
    barValue.className = "bar-value"
    barValue.textContent = monthData.count

    barWrapper.appendChild(bar)
    barWrapper.appendChild(barValue)
    barContainer.appendChild(barLabel)
    barContainer.appendChild(barWrapper)
    chart.appendChild(barContainer)
  })

  chartContainer.appendChild(chart)
}

// Create top categories chart
function createTopCategoriesChart() {
  const chartContainer = document.getElementById("top-categories-chart")
  if (!chartContainer) return

  const books = getBooks()
  const categoryCount = {}

  // Count books in each category
  books.forEach((book) => {
    if (book.categories) {
      book.categories.forEach((category) => {
        categoryCount[category] = (categoryCount[category] || 0) + 1
      })
    }
  })

  // Convert to array and sort by count
  const categoryData = Object.entries(categoryCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 categories

  if (categoryData.length === 0) {
    chartContainer.innerHTML = "<p>No categories data available.</p>"
    return
  }

  // Create simple bar chart
  chartContainer.innerHTML = ""

  const chart = document.createElement("div")
  chart.className = "bar-chart"

  categoryData.forEach((category) => {
    // Calculate percentage (max 100%)
    const percentage = Math.min((category.count / books.length) * 100, 100)

    const barContainer = document.createElement("div")
    barContainer.className = "bar-container"

    const barLabel = document.createElement("div")
    barLabel.className = "bar-label"
    barLabel.textContent = category.name

    const barWrapper = document.createElement("div")
    barWrapper.className = "bar-wrapper"

    const bar = document.createElement("div")
    bar.className = "bar"
    bar.style.width = `${percentage}%`

    const barValue = document.createElement("span")
    barValue.className = "bar-value"
    barValue.textContent = category.count

    barWrapper.appendChild(bar)
    barWrapper.appendChild(barValue)
    barContainer.appendChild(barLabel)
    barContainer.appendChild(barWrapper)
    chart.appendChild(barContainer)
  })

  chartContainer.appendChild(chart)
}

// Load users table
function loadUsersTable() {
  const usersTableBody = document.getElementById("users-table-body")
  if (!usersTableBody) return

  const users = getUsers()
  const currentUser = getCurrentUser()

  usersTableBody.innerHTML = ""

  users.forEach((user) => {
    const row = document.createElement("tr")

    // Disable actions for current user
    const isCurrentUser = user.id === currentUser.id
    const actionsDisabled = isCurrentUser ? "disabled" : ""

    row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <select class="role-select" data-user-id="${user.id}" ${actionsDisabled}>
                    <option value="${ROLES.USER}" ${user.role === ROLES.USER ? "selected" : ""}>User</option>
                    <option value="${ROLES.ADMIN}" ${user.role === ROLES.ADMIN ? "selected" : ""}>Admin</option>
                </select>
            </td>
            <td>
                <button class="delete-user-btn" data-user-id="${user.id}" ${actionsDisabled}>
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `

    usersTableBody.appendChild(row)
  })

  // Add event listeners for role change
  document.querySelectorAll(".role-select").forEach((select) => {
    select.addEventListener("change", function () {
      const userId = this.getAttribute("data-user-id")
      const newRole = this.value

      try {
        changeUserRole(userId, newRole)
        createNotification("User role updated successfully", "success")
        loadUsersTable() // Reload table
        loadAdminStatistics() // Refresh statistics
      } catch (error) {
        createNotification(error.message, "error")
        // Reset select to original value
        loadUsersTable()
      }
    })
  })

  // Add event listeners for delete
  document.querySelectorAll(".delete-user-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const userId = this.getAttribute("data-user-id")
      const user = users.find((u) => u.id === userId)

      if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
        try {
          deleteUser(userId)
          createNotification("User deleted successfully", "success")
          loadUsersTable() // Reload table
          loadAdminStatistics() // Refresh statistics
        } catch (error) {
          createNotification(error.message, "error")
        }
      }
    })
  })
}

// Initialize user management
function initUserManagement() {
  const addUserBtn = document.getElementById("add-user-btn")
  const addUserForm = document.getElementById("add-user-form")

  // Add user button
  if (addUserBtn) {
    addUserBtn.addEventListener("click", () => {
      showModal("add-user-modal")
    })
  }

  // Close modal buttons
  document.querySelectorAll(".close-btn, .close-modal-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const modal = this.closest(".modal")
      if (modal) {
        hideModal(modal.id)
      }
    })
  })

  // Add user form submission
  if (addUserForm) {
    addUserForm.addEventListener("submit", (e) => {
      e.preventDefault()

      const username = document.getElementById("new-username").value
      const email = document.getElementById("new-email").value
      const password = document.getElementById("new-password").value
      const role = document.getElementById("new-role").value

      try {
        // Register new user
        const user = registerUser(username, email, password)

        // If admin role selected, change role
        if (role === ROLES.ADMIN) {
          changeUserRole(user.id, ROLES.ADMIN)
        }

        // Show success notification
        createNotification(`User "${username}" created successfully`, "success")

        // Reset form and close modal
        addUserForm.reset()
        hideModal("add-user-modal")

        // Reload users table and statistics
        loadUsersTable()
        loadAdminStatistics()
      } catch (error) {
        createNotification(error.message, "error")
      }
    })
  }
}

// Initialize library management
function initLibraryManagement() {
  // Import books button
  const importBooksBtn = document.getElementById("import-books-btn")
  if (importBooksBtn) {
    importBooksBtn.addEventListener("click", () => {
      // Create a file input element
      const fileInput = document.createElement("input")
      fileInput.type = "file"
      fileInput.accept = ".json"

      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result)
            const importedCount = importBooksFromJSON(data)

            createNotification(`Successfully imported ${importedCount} books`, "success")
            loadAdminStatistics() // Refresh statistics
          } catch (error) {
            createNotification(`Import failed: ${error.message}`, "error")
          }
        }

        reader.readAsText(file)
      })

      // Trigger file selection
      fileInput.click()
    })
  }

  // Export library button
  const exportLibraryBtn = document.getElementById("export-library-btn")
  if (exportLibraryBtn) {
    exportLibraryBtn.addEventListener("click", () => {
      try {
        const data = exportLibraryData()

        // Create download link
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `library_export_${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        createNotification("Library data exported successfully", "success")
      } catch (error) {
        createNotification(`Export failed: ${error.message}`, "error")
      }
    })
  }

  // API check button
  const checkApiBtn = document.getElementById("check-api-btn")
  if (checkApiBtn) {
    checkApiBtn.addEventListener("click", async () => {
      try {
        // Test API by fetching a category
        await fetchOpenLibraryCategories()
        createNotification("API connection successful", "success")
      } catch (error) {
        createNotification(`API connection failed: ${error.message}`, "error")
      }
    })
  }

  // Backup button
  const backupBtn = document.getElementById("backup-btn")
  if (backupBtn) {
    backupBtn.addEventListener("click", () => {
      try {
        const data = {
          books: getBooks(),
          categories: getCategories(),
          users: getUsers().map((user) => {
            // Remove password for security
            const { password, ...userWithoutPassword } = user
            return userWithoutPassword
          }),
          timestamp: new Date().toISOString(),
        }

        // Create download link
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `library_backup_${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        createNotification("Backup created successfully", "success")
      } catch (error) {
        createNotification(`Backup failed: ${error.message}`, "error")
      }
    })
  }
}

// Initialize system settings
function initSystemSettings() {
  const settingsForm = document.getElementById("settings-form")
  const resetSettingsBtn = document.getElementById("reset-settings-btn")

  // Load saved settings
  loadSettings()

  // Settings form submission
  if (settingsForm) {
    settingsForm.addEventListener("submit", (e) => {
      e.preventDefault()

      // Get form values
      const settings = {
        libraryName: document.getElementById("library-name").value,
        itemsPerPage: document.getElementById("items-per-page").value,
        apiKey: document.getElementById("api-key").value,
        apiEndpoint: document.getElementById("api-endpoint").value,
        autoBackup: document.getElementById("auto-backup").checked,
        backupFrequency: document.getElementById("backup-frequency").value,
      }

      // Save settings
      localStorage.setItem("librarySettings", JSON.stringify(settings))

      createNotification("Settings saved successfully", "success")
    })
  }

  // Reset settings button
  if (resetSettingsBtn) {
    resetSettingsBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to reset all settings to default values?")) {
        // Default settings
        const defaultSettings = {
          libraryName: "Library Manager",
          itemsPerPage: "20",
          apiKey: "",
          apiEndpoint: "https://openlibrary.org",
          autoBackup: false,
          backupFrequency: "weekly",
        }

        // Save default settings
        localStorage.setItem("librarySettings", JSON.stringify(defaultSettings))

        // Reload settings
        loadSettings()

        createNotification("Settings reset to default values", "success")
      }
    })
  }
}

// Load settings
function loadSettings() {
  // Get saved settings or use defaults
  const savedSettings = JSON.parse(localStorage.getItem("librarySettings")) || {
    libraryName: "Library Manager",
    itemsPerPage: "20",
    apiKey: "",
    apiEndpoint: "https://openlibrary.org",
    autoBackup: false,
    backupFrequency: "weekly",
  }

  // Set form values
  const libraryNameInput = document.getElementById("library-name")
  const itemsPerPageSelect = document.getElementById("items-per-page")
  const apiKeyInput = document.getElementById("api-key")
  const apiEndpointInput = document.getElementById("api-endpoint")
  const autoBackupCheckbox = document.getElementById("auto-backup")
  const backupFrequencySelect = document.getElementById("backup-frequency")

  if (libraryNameInput) libraryNameInput.value = savedSettings.libraryName
  if (itemsPerPageSelect) itemsPerPageSelect.value = savedSettings.itemsPerPage
  if (apiKeyInput) apiKeyInput.value = savedSettings.apiKey
  if (apiEndpointInput) apiEndpointInput.value = savedSettings.apiEndpoint
  if (autoBackupCheckbox) autoBackupCheckbox.checked = savedSettings.autoBackup
  if (backupFrequencySelect) backupFrequencySelect.value = savedSettings.backupFrequency
}

// Export functions
export { initAdminDashboard }
