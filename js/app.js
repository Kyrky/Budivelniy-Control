import { AhoCorasick } from './aho-corasick.js';

const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});


document.addEventListener('DOMContentLoaded', () => {
    let projectsData = {};
    let servicesData = {};
    let searchData = [];
    let lastQuery = '';
    let ac = new AhoCorasick();
    let isTrieBuilt = false;
    let searchTimeout;

    // Load project and service data
    Promise.all([
        fetch('../projects.json').then(response => response.json()).then(data => projectsData = data),
        fetch('../services.json').then(response => response.json()).then(data => servicesData = data)
    ])
    .then(() => {
        searchData = prepareSearchData(servicesData.categories, projectsData.projects);
        renderServices(servicesData.categories);
        renderProjects(projectsData.projects);
        initObservers();
        initEventListeners();
    })
    .catch(error => console.error('Error loading data:', error));

    // Render the service categories
    function renderServices(categories) {
        const servicesSection = document.getElementById('services');
        servicesSection.innerHTML = categories.map(category => `
            <div class="assort-category">
                <div class="assort-category__title">${category.name}</div>
                <div class="assort-category__services">
                    ${category.services.map(service => `
                        <div class="assort-category__service-item" id="service-${service.id}">
                            <div class="assort-category__service-title">${service.title}</div>
                            <div class="assort-category__service-info">
                                Од. Виміру: ${service.unit}<br>
                                Ціна з ПДВ, грн: ${service.price}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="category-divider"></div> 
            </div>
        `).join('');
    }
    

    // Render the projects in a grid format
    function renderProjects(projects) {
        const projectsGrid = document.querySelector('.projects-grid');
        projectsGrid.innerHTML = projects.map(project => `
            <div class="project-card">
                <div class="project-image" style="background-image: url('${project.image}')">
                    <div class="project-overlay">
                        <span>${project.location}</span>
                    </div>
                </div>
                <div class="project-info">
                    <h3 class="project-title">${project.title}</h3>
                    <p>${project.description}</p>
                </div>
            </div>
        `).join('');
    }

    // Prepare search data from services and projects
    function prepareSearchData(categories, projects) {
        return [
            ...categories.flatMap(category => category.services.map(service => ({
                type: 'service',
                id: service.id,
                title: service.title,
                content: (service.title + ' ' + service.unit + ' ' + service.price).toLowerCase(),
                index: category.services.indexOf(service)
            }))),
            ...projects.map((project, index) => ({
                type: 'project',
                id: `project-${index}`,
                title: project.title,
                content: (project.title + ' ' + (project.description || '')).toLowerCase(),
                index
            }))
        ];
    }

    // Initialize intersection observer for revealing content
    function initObservers() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.category').forEach(block => {
            observer.observe(block);
        });
    }

    // Initialize event listeners for search and other UI elements
    function initEventListeners() {
        const searchInput = document.querySelector('.search-input');
        const searchResults = document.querySelector('.search-results');
        const serviceSearchInput = document.getElementById('serviceSearch');
        const searchResultsForm = document.querySelector('.search-results-form');

        // Main search with debounce
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.trim().toLowerCase();
                if (query.length < 2) {
                    searchResults.style.display = 'none';
                    return;
                }

                const searchTerms = query.split(/\s+/).filter(term => term.length > 0);
                ac = new AhoCorasick();
                searchTerms.forEach(term => ac.addPattern(term));
                ac.buildFailureLinks();

                const results = searchData
                    .filter(item => {
                        const matches = ac.search(item.content);
                        const foundTerms = new Set(matches.map(m => m.pattern));
                        return searchTerms.every(term => foundTerms.has(term));
                    })
                    .slice(0, 7);

                displayResults(results, query, searchResults);
            }, 300);
        });

        // Service search with debounce
        serviceSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.trim().toLowerCase();
                if (query.length < 2) {
                    searchResultsForm.style.display = 'none';
                    return;
                }

                const searchTerms = query.split(/\s+/).filter(term => term.length > 0);
                ac = new AhoCorasick();
                searchTerms.forEach(term => ac.addPattern(term));
                ac.buildFailureLinks();

                const results = searchData
                    .filter(item => {
                        const matches = ac.search(item.content);
                        const foundTerms = new Set(matches.map(m => m.pattern));
                        return searchTerms.every(term => foundTerms.has(term));
                    })
                    .slice(0, 7);

                displayResults(results, query, searchResultsForm);
            }, 300);
        });

        // Close search results on outside click or Escape key
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchResults.style.display = 'none';
                searchResultsForm.style.display = 'none';
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Escape') {
                searchResults.style.display = 'none';
                searchResultsForm.style.display = 'none';
            }
        });
    }

    // Display search results in the container
    function displayResults(results, query, container) {
        container.innerHTML = '';

        if (!results.length) {
            container.style.display = 'none';
            return;
        }

        results.forEach(item => {
            const div = document.createElement('div');
            div.className = 'search-result-item';

            // Type icon (service or project)
            const icon = document.createElement('div');
            icon.className = 'result-type';
            icon.textContent = item.type === 'service' ? '🛠️' : '🏗️';

            // Title with highlighted matches
            const title = document.createElement('div');
            title.className = 'result-title';
            title.innerHTML = highlightMatches(item.title, query);

            // Text preview with highlighted matches
            const preview = document.createElement('div');
            preview.className = 'result-preview';
            preview.textContent = getTextPreview(item.content, query);

            div.appendChild(icon);
            div.appendChild(title);
            div.appendChild(preview);
            div.onclick = () => handleSearchResult(item.type, item.index, container);
            container.appendChild(div);
        });

        container.style.display = 'block';
    }

    // Highlight search term matches in text
    function highlightMatches(text, query) {
        const terms = query.toLowerCase().split(/\s+/);
        return text.replace(
            new RegExp(`(${terms.join('|')})`, 'gi'),
            '<mark>$1</mark>'
        );
    }

    // Get text preview with matched terms
    function getTextPreview(content, query) {
        const terms = query.split(/\s+/);
        const regex = new RegExp(`(\\b.{0,30}(${terms.join('|')}).{0,30}\\b)`, 'gi');
        const matches = content.match(regex) || [];
        return matches.slice(0, 2).join('... ') + '...';
    }

    // Handle search result click (scroll to service or populate form)
    function handleSearchResult(type, index, container) {
        const service = servicesData.categories
            .flatMap(category => category.services)
            .find(service => service.id === searchData[index].id);

        if (container === document.querySelector('.search-results')) {
            const targetElement = document.getElementById(`service-${service.id}`);
            const headerHeight = document.querySelector('header').offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        } else {
            // Fill the service field in the form
            const serviceSearchInput = document.getElementById('serviceSearch');
            serviceSearchInput.value = service.title;
        }

        document.querySelector('.search-results').style.display = 'none';
        document.querySelector('.search-results-form').style.display = 'none';
    }
});
