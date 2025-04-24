// auth.js - Authentication and user management

// User roles
const ROLES = {
  USER: "user",
  ADMIN: "admin",
}

// Initialize users if not exists
function initUsers() {
  if (!localStorage.getItem("users")) {
    // Create default admin user
    const defaultAdmin = {
      id: "admin-" + Date.now(),
      username: "admin",
      password: hashPassword("admin123"), // In a real app, use a secure password
      email: "admin@library.com",
      role: ROLES.ADMIN,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem("users", JSON.stringify([defaultAdmin]))
    console.log("Default admin user created")
  }

  if (!localStorage.getItem("currentUser")) {
    localStorage.setItem("currentUser", null)
  }
}

// Get all users
function getUsers() {
  return JSON.parse(localStorage.getItem("users")) || []
}

// Get current user
function getCurrentUser() {
  const userData = localStorage.getItem("currentUser")
  return userData && userData !== "null" ? JSON.parse(userData) : null
}

// Check if user is logged in
function isLoggedIn() {
  return getCurrentUser() !== null
}

// Check if current user is admin
function isAdmin() {
  const currentUser = getCurrentUser()
  return currentUser && currentUser.role === ROLES.ADMIN
}

// Register a new user
function registerUser(username, email, password) {
  const users = getUsers()

  // Validate inputs
  if (!username || !email || !password) {
    throw new Error("All fields are required")
  }

  // Check if username or email already exists
  if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Username already exists")
  }

  if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email already exists")
  }

  // Create new user
  const newUser = {
    id: "user-" + Date.now(),
    username,
    email,
    password: hashPassword(password),
    role: ROLES.USER,
    createdAt: new Date().toISOString(),
  }

  // Add to users array
  users.push(newUser)
  localStorage.setItem("users", JSON.stringify(users))

  // Return user without password
  const { password: _, ...userWithoutPassword } = newUser
  return userWithoutPassword
}

// Login user
function loginUser(username, password) {
  if (!username || !password) {
    throw new Error("Username and password are required")
  }

  const users = getUsers()
  const user = users.find((user) => user.username.toLowerCase() === username.toLowerCase())

  if (!user) {
    throw new Error("Invalid username or password")
  }

  const hashedPassword = hashPassword(password)
  if (user.password !== hashedPassword) {
    throw new Error("Invalid username or password")
  }

  // Set current user in localStorage (without password)
  const { password: _, ...userWithoutPassword } = user
  localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))

  return userWithoutPassword
}

// Logout user
function logoutUser() {
  localStorage.setItem("currentUser", null)
  window.location.href = "login.html"
}

// Update user
function updateUser(userId, userData) {
  const users = getUsers()
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  // Update user data
  users[userIndex] = {
    ...users[userIndex],
    ...userData,
    // Don't allow changing role or id through this function
    role: users[userIndex].role,
    id: users[userIndex].id,
  }

  localStorage.setItem("users", JSON.stringify(users))

  // If updating current user, update currentUser in localStorage
  const currentUser = getCurrentUser()
  if (currentUser && currentUser.id === userId) {
    const { password: _, ...userWithoutPassword } = users[userIndex]
    localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
  }

  return users[userIndex]
}

// Delete user
function deleteUser(userId) {
  const users = getUsers()
  const filteredUsers = users.filter((user) => user.id !== userId)

  if (filteredUsers.length === users.length) {
    throw new Error("User not found")
  }

  localStorage.setItem("users", JSON.stringify(filteredUsers))

  // If deleting current user, logout
  const currentUser = getCurrentUser()
  if (currentUser && currentUser.id === userId) {
    logoutUser()
  }

  return true
}

// Change user role (admin only)
function changeUserRole(userId, newRole) {
  if (!isAdmin()) {
    throw new Error("Unauthorized: Only admins can change user roles")
  }

  if (!Object.values(ROLES).includes(newRole)) {
    throw new Error("Invalid role")
  }

  const users = getUsers()
  const userIndex = users.findIndex((user) => user.id === userId)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  // Update role
  users[userIndex].role = newRole
  localStorage.setItem("users", JSON.stringify(users))

  // If updating current user, update currentUser in localStorage
  const currentUser = getCurrentUser()
  if (currentUser && currentUser.id === userId) {
    const { password: _, ...userWithoutPassword } = users[userIndex]
    localStorage.setItem("currentUser", JSON.stringify(userWithoutPassword))
  }

  return users[userIndex]
}

// Simple password hashing (NOT secure for production)
// In a real app, use a proper hashing library like bcrypt
function hashPassword(password) {
  // This is a very simple hash for demonstration
  // DO NOT use this in production
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16)
}

// Change user password
function changePassword(currentPassword, newPassword) {
  const currentUser = getCurrentUser()

  if (!currentUser) {
    throw new Error("Not logged in")
  }

  const users = getUsers()
  const userIndex = users.findIndex((user) => user.id === currentUser.id)

  if (userIndex === -1) {
    throw new Error("User not found")
  }

  // Verify current password
  if (hashPassword(currentPassword) !== users[userIndex].password) {
    throw new Error("Current password is incorrect")
  }

  // Update password
  users[userIndex].password = hashPassword(newPassword)

  // Save updated users
  localStorage.setItem("users", JSON.stringify(users))

  return true
}

// Check authentication for protected pages
function checkAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html"
    return false
  }
  return true
}

// Check admin access for admin pages
function checkAdminAuth() {
  if (!isLoggedIn()) {
    window.location.href = "login.html"
    return false
  }

  if (!isAdmin()) {
    window.location.href = "user-dashboard.html"
    return false
  }

  return true
}

// Initialize users on script load
initUsers()

// Export all functions
export {
  ROLES,
  getUsers,
  getCurrentUser,
  isLoggedIn,
  isAdmin,
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  deleteUser,
  changeUserRole,
  changePassword,
  checkAuth,
  checkAdminAuth,
}
