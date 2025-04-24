// Add these event listeners to your existing DOMContentLoaded function

// Declare the variables
let getPersonalizedRecommendations;
let getCategoryRecommendations;
let showBookDetailsFromAPI;
let displaySimilarBooks;
let showBookDetails;
let fetchBookByISBN; // Declare fetchBookByISBN

// Add Recommendations to navigation
const navList = document.querySelector('.nav-links ul');
if (navList) {
    const recommendationsNavItem = document.createElement('li');
    recommendationsNavItem.innerHTML = `
        <a href="#" data-page="recommendations-page">
            <i class="fas fa-lightbulb"></i>
            <span>Recommendations</span>
        </a>
    `;
    recommendationsNavItem.setAttribute('data-page', 'recommendations-page');
    navList.appendChild(recommendationsNavItem);
}

// Initialize recommendations when navigating to the page
document.addEventListener('click', function(e) {
    const navItem = e.target.closest('[data-page="recommendations-page"]');
    if (navItem) {
        // Load personalized recommendations when the page is opened
        getPersonalizedRecommendations();
        
        // Populate category select
        const categorySelect = document.getElementById('recommendation-category-select');
        if (categorySelect) {
            // Clear existing options
            categorySelect.innerHTML = '<option value="">Select a category</option>';
            
            // Get categories
            const categories = JSON.parse(localStorage.getItem('categories')) || [];
            
            // Sort categories by name
            categories.sort((a, b) => a.name.localeCompare(b.name));
            
            // Add options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }
    }
});

// Refresh recommendations button
const refreshRecommendationsBtn = document.getElementById('refresh-recommendations-btn');
if (refreshRecommendationsBtn) {
    refreshRecommendationsBtn.addEventListener('click', function() {
        getPersonalizedRecommendations();
    });
}

// Category select change
const recommendationCategorySelect = document.getElementById('recommendation-category-select');
if (recommendationCategorySelect) {
    recommendationCategorySelect.addEventListener('change', function() {
        const category = this.value;
        if (category) {
            getCategoryRecommendations(category);
        } else {
            document.getElementById('category-recommendations-container').innerHTML = `
                <div class="no-results">
                    <p>Please select a category to see recommendations.</p>
                </div>
            `;
        }
    });
}

// Tab switching for recommendations
const recTabButtons = document.querySelectorAll('.rec-tab-btn');
const recTabContents = document.querySelectorAll('.recommendations-page .tab-content');

recTabButtons.forEach(button => {
    button.addEventListener('click', function() {
        const tabId = this.getAttribute('data-tab');
        
        // Update active tab button
        recTabButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Show selected tab content
        recTabContents.forEach(content => {
            content.classList.add('hidden');
            if (content.id === tabId) {
                content.classList.remove('hidden');
            }
        });
    });
});

// Update showBookDetailsFromAPI function to include similar books
const originalShowBookDetailsFromAPI = showBookDetailsFromAPI;
showBookDetailsFromAPI = async function(basicBook, details) {
    // Call the original function
    originalShowBookDetailsFromAPI(basicBook, details);
    
    // Add similar books
    const book = {
        title: basicBook.title,
        author: basicBook.author_name ? basicBook.author_name[0] : 'Unknown author',
        categories: basicBook.subject || [],
        olid: basicBook.key
    };
    
    // Display similar books
    displaySimilarBooks(book);
};

// Update showBookDetails function to include similar books
const originalShowBookDetails = showBookDetails;
showBookDetails = function(book) {
    // Call the original function
    originalShowBookDetails(book);
    
    // Add similar books if we have enough information
    if (book.title && (book.author_name || book.subject)) {
        const bookObj = {
            title: book.title,
            author: book.author_name ? book.author_name[0] : 'Unknown author',
            categories: book.subject || [],
            olid: book.key
        };
        
        // Display similar books
        displaySimilarBooks(bookObj);
    } else {
        const similarBooksContainer = document.getElementById('similar-books-container');
        if (similarBooksContainer) {
            similarBooksContainer.innerHTML = '<p>Not enough information to find similar books.</p>';
        }
    }
};

// Also update the view-details-btn click handler to show similar books
document.addEventListener('click', async function(e) {
    if (e.target.closest('.view-details-btn')) {
        const button = e.target.closest('.view-details-btn');
        const isbn = button.dataset.isbn;
        
        if (isbn) {
            try {
                const details = await fetchBookByISBN(isbn);
                
                // Create a simplified book object for display
                const book = {
                    title: details.bookData.title,
                    author_name: details.authorData ? [details.authorData.name] : ['Unknown author'],
                    first_publish_year: details.bookData.publish_date ? details.bookData.publish_date.split(', ').pop() : '',
                    isbn: [isbn],
                    publisher: details.bookData.publishers,
                    language: details.bookData.languages ? details.bookData.languages.map(lang => lang.key.split('/').pop()) : [],
                    key: details.bookData.key,
                    subject: details.worksData ? details.worksData.subjects : []
                };
                
                showBookDetailsFromAPI(book, details);
                
                // The similar books will be displayed by the updated showBookDetailsFromAPI function
            } catch (error) {
                console.error('Error fetching book details by ISBN:', error);
                alert('Failed to load book details. Please try again.');
            }
        }
    }
});
