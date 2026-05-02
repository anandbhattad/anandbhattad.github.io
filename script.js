$(document).ready(function() {
    const sections = ['bio', 'research', 'news', 'awards', 'teaching', 'services', 'publications'];
    sections.forEach(section => {
        $(`<section id="${section}" class="section"></section>`).appendTo('#content');
        loadSection(section);
    });

    $('#quick-links a').click(function(e) {
        e.preventDefault();
        const sectionId = $(this).attr('href').substring(1);
        $('html, body').animate({
            scrollTop: $(`#${sectionId}`).offset().top - $('#quick-links').outerHeight()
        }, 500);
    });

    const quickLinks = $('#quick-links');
    const quickLinksTop = quickLinks.offset().top;
    $(window).scroll(function() {
        if ($(this).scrollTop() > quickLinksTop) {
            quickLinks.addClass('sticky');
            $('body').css('padding-top', quickLinks.outerHeight());
        } else {
            quickLinks.removeClass('sticky');
            $('body').css('padding-top', 0);
        }
    });

    // Remove renderPublications() from here
});

function loadSection(sectionName) {
    $(`#${sectionName}`).load(`${sectionName}.html`, function() {
        if (sectionName === 'publications') {
            $('.publication-filter').click(function() {
                $('.publication-filter').removeClass('active');
                $(this).addClass('active');
                renderPublications($(this).data('filter'));
            });

            // Call renderPublications with the desired filter AFTER the section loads
            renderPublications('all'); // Show all publications by default 
        } else if (sectionName.toLowerCase() === 'news') {
            setupNews();
        }
    });
}

function setupScrollableNews() {
    const container = document.querySelector('.news-container');
    const items = container.querySelectorAll('.news-item');
    if (items.length <= 5) return;  // nothing to scroll

    // Measure the bottom of the 5th item relative to the container
    const fifthItem = items[5];
    const containerTop = container.getBoundingClientRect().top;
    const fifthBottom = fifthItem.getBoundingClientRect().bottom;
    const height = fifthBottom - containerTop;

    container.style.maxHeight = height + 'px';
    container.style.overflowY = 'auto';
}

window.addEventListener('load', setupScrollableNews);
window.addEventListener('resize', setupScrollableNews);



// Initialize the setup on page load
document.addEventListener('DOMContentLoaded', function() {
    setupNews();
});

$(document).ready(function() {
    renderPublications('all'); // Show all publications by default 
    setupNews(); // Initialize news section
});

// script.js
const citations = document.querySelectorAll('.citation');

citations.forEach(citation => {
  citation.addEventListener('click', (event) => {
    // Create the popup element
    const popup = document.createElement('div');
    popup.classList.add('citation-popup');
    popup.textContent = citation.dataset.citation;

    // Position the popup relative to the clicked citation
    const citationRect = citation.getBoundingClientRect();
    popup.style.top = `${citationRect.bottom + window.pageYOffset}px`;
    popup.style.left = `${citationRect.left + window.pageXOffset}px`;

    // Add the popup to the body
    document.body.appendChild(popup);

    // Hide the popup on click outside
    document.addEventListener('click', function handleClickOutside(event) {
      if (!citation.contains(event.target) && !popup.contains(event.target)) {
        popup.remove();
        document.removeEventListener('click', handleClickOutside);
      }
    });
  });
});