/**
 * Content Loader for Acorn Benefits CMS
 * 
 * This script loads page content from JSON files and applies it 
 * to DOM elements with data-content attributes.
 * 
 * Usage: Add data-content="keyName" to any HTML element
 * For nested content, use dot notation: data-content="hero.title"
 * For list items, use data-content-index="0" with data-content="key"
 */

(function() {
    // Determine current page
    const path = window.location.pathname;
    let page = 'index';
    
    if (path.endsWith('.html')) {
        const filename = path.split('/').pop().replace('.html', '');
        if (filename !== 'index') {
            page = filename;
        }
    } else if (path === '/' || path === '') {
        page = 'index';
    } else {
        // Handle paths like /about, /services, etc.
        const segment = path.split('/').filter(Boolean).pop();
        if (segment) page = segment;
    }
    
    // Map page names to content files
    const pageMap = {
        'index': 'index',
        'about': 'about',
        'services': 'services',
        'case-studies': 'case-studies',
        'case_studies': 'case-studies',
        'resources': 'resources',
        'contact': 'contact'
    };
    
    const contentFile = pageMap[page] || page;
    
    // Fetch and apply content
    fetch(`content/${contentFile}.json`)
        .then(response => {
            if (!response.ok) throw new Error('Content file not found');
            return response.json();
        })
        .then(data => {
            applyContent(data);
        })
        .catch(err => {
            // Silently fail - the default HTML content will be shown
            console.log('Content loading skipped:', err.message);
        });
    
    /**
     * Get a value from a nested object using dot notation
     * e.g., getNestedValue(data, 'hero.title') returns data.hero.title
     */
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            if (current === undefined || current === null) return undefined;
            return current[key];
        }, obj);
    }
    
    /**
     * Apply content data to all elements with data-content attributes
     */
    function applyContent(data) {
        // Handle simple data-content attributes
        document.querySelectorAll('[data-content]').forEach(el => {
            const key = el.getAttribute('data-content');
            const value = getNestedValue(data, key);
            
            if (value !== undefined && value !== null) {
                if (typeof value === 'string') {
                    // Handle newlines in text
                    if (value.includes('\n')) {
                        el.innerHTML = value.replace(/\n/g, '<br>');
                    } else {
                        el.textContent = value;
                    }
                }
            }
        });
        
        // Handle list items with data-content-list and data-content-index
        document.querySelectorAll('[data-content-list]').forEach(container => {
            const listKey = container.getAttribute('data-content-list');
            const listData = getNestedValue(data, listKey);
            
            if (!Array.isArray(listData)) return;
            
            const template = container.querySelector('[data-content-template]');
            if (!template) return;
            
            // Clear existing items (except template)
            const existingItems = container.querySelectorAll('[data-content-item]');
            existingItems.forEach(item => item.remove());
            
            listData.forEach((itemData, index) => {
                const clone = template.cloneNode(true);
                clone.removeAttribute('data-content-template');
                clone.setAttribute('data-content-item', '');
                clone.style.display = '';
                
                // Apply content to elements within the clone
                clone.querySelectorAll('[data-content-field]').forEach(field => {
                    const fieldKey = field.getAttribute('data-content-field');
                    const fieldValue = getNestedValue(itemData, fieldKey);
                    
                    if (fieldValue !== undefined && fieldValue !== null) {
                        if (typeof fieldValue === 'string') {
                            field.textContent = fieldValue;
                        }
                    }
                });
                
                container.appendChild(clone);
            });
            
            // Hide the template
            template.style.display = 'none';
        });
    }
})();