// html-loader.js - Handles loading HTML fragments

// Load HTML fragment into a container
async function loadHTMLFragment(fragmentPath, containerId) {
  try {
    const response = await fetch(fragmentPath)
    if (!response.ok) {
      throw new Error(`Failed to load HTML fragment: ${fragmentPath}`)
    }

    const html = await response.text()
    const container = document.getElementById(containerId)

    if (container) {
      container.innerHTML = html
    } else {
      console.error(`Container not found: ${containerId}`)
    }

    return true
  } catch (error) {
    console.error("Error loading HTML fragment:", error)
    return false
  }
}

// Load all page fragments
async function loadAllPageFragments() {
  const fragments = [
    { path: "html/books-page.html", containerId: "books-page-container" },
    { path: "html/search-page.html", containerId: "search-page-container" },
    { path: "html/categories-page.html", containerId: "categories-page-container" },
    { path: "html/recommendations-page.html", containerId: "recommendations-page-container" },
    { path: "html/modals.html", containerId: "modals-container" },
  ]

  const loadPromises = fragments.map((fragment) => loadHTMLFragment(fragment.path, fragment.containerId))

  return Promise.all(loadPromises)
}

export { loadHTMLFragment, loadAllPageFragments }
