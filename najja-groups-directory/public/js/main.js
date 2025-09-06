// public/js/main.js
// Utility functions for UI interactions
class UIManager {
  constructor() {
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.setupIntersectionObserver();
  }
  
  setupEventListeners() {
    // Smooth scrolling for anchor links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (link) {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }
  
  setupIntersectionObserver() {
    // Animate elements when they come into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fadeInUp');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    // Observe all cards and sections
    document.querySelectorAll('.group-card, section').forEach(el => {
      observer.observe(el);
    });
  }
  
  showLoading() {
    document.querySelector('.loading-spinner').style.display = 'flex';
  }
  
  hideLoading() {
    document.querySelector('.loading-spinner').style.display = 'none';
  }
  
  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    const container = document.getElementById('toast-container');
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }
}

// Initialize UI Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ui = new UIManager();
});

// Utility function for API calls with loading states
async function fetchWithLoading(url, options = {}) {
  window.ui.showLoading();
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    window.ui.showToast('Error fetching data', 'error');
    throw error;
  } finally {
    window.ui.hideLoading();
  }
}