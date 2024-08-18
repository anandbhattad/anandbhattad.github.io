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
        } else if (sectionName === 'news') {
            setupNews();
        }
    });
}

function setupNews() {
    const initialNewsCount = 5;
    let currentNewsCount = initialNewsCount;

    const $newsItems = $('#news-container .news-item'); // Select all news items
    const $showMoreButton = $('#show-more'); // Select the button

    function updateNewsVisibility() {
        $newsItems.each(function(index) { 
            // Iterate through news items
            if (index < currentNewsCount) {
                $(this).show(); // Show if index is less than current count
            } else {
                $(this).hide(); // Hide otherwise
            }
        });

        $showMoreButton.toggle(currentNewsCount < $newsItems.length); // Toggle button visibility
    }

    // Event handler for button click
    $showMoreButton.click(function() {
        currentNewsCount += initialNewsCount; // Increase the count of visible items
        updateNewsVisibility(); // Update which items are shown/hidden
    });

    updateNewsVisibility(); // Call initially to hide extra items on page load
}

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