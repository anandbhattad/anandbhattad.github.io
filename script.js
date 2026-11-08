$(document).ready(function() {
    const sections = ['bio', 'highlights', 'news', 'research', '3PVision', 'teaching', 'services', 'publications', 'photos'];
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

            const defaultFilter = window.innerWidth <= 768 ? 'highlights' : 'all';
            renderPublications(defaultFilter);

            // Sync the active class on the matching filter button
            $('.publication-filter').removeClass('active');
            $(`.publication-filter[data-filter="${defaultFilter}"]`).addClass('active');
        } else if (sectionName.toLowerCase() === 'news') {
            setupNews();
        }
    });
}

function setupScrollableNews() {
    const container = document.querySelector('.news-container');
    const items = container.querySelectorAll('.news-item');
    if (items.length <= 5) return;

    // On mobile, let CSS handle it — don't set inline styles
    if (window.innerWidth <= 768) {
        container.style.maxHeight = '';
        container.style.overflowY = '';
        return;
    }

    // Desktop measurement logic
    container.style.maxHeight = '';
    container.style.overflowY = '';

    let totalHeight = 0;
    for (let i = 0; i < 5; i++) {
        const item = items[i];
        const style = window.getComputedStyle(item);
        totalHeight += item.offsetHeight + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
    }
    const containerStyle = window.getComputedStyle(container);
    totalHeight += parseFloat(containerStyle.paddingTop);

    container.style.maxHeight = totalHeight + 'px';
    container.style.overflowY = 'auto';
}

// Single initialization on full page load (after fonts/images settle)
// Single page-load initialization
window.addEventListener('load', function() {
    setupScrollableNews();
});

window.addEventListener('resize', function() {
    setupScrollableNews();
});

// DELETE these — they're duplicates causing the override:
// $(document).ready(function() {
//     renderPublications('all');
// });
// // Initialize the setup on page load
// document.addEventListener('DOMContentLoaded', function() {
//     setupNews();
// });

// $(document).ready(function() {
//     renderPublications('all'); // Show all publications by default 
//     // setupNews(); // Initialize news section
// });

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

/* Staged teasers (.i2v): frame 0 held as a still ("Single input image"), then an optional control clip
   ("Camera + object motion authored in 3D"), then the generated clip, then back to the still. Loops.
   Reduced-motion users just get the still. */
window.initI2V = function (root) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    (root || document).querySelectorAll('.i2v:not([data-i2v])').forEach(function (box) {
        box.dataset.i2v = '1';
        const main = box.querySelector('video:not(.i2v-control)'), ctl = box.querySelector('video.i2v-control'), badge = box.querySelector('.i2v-badge');
        if (!main) return;
        [main, ctl].forEach(function (v) { if (v) { v.loop = false; v.muted = true; v.playsInline = true; } });
        let timer = null;
        const label = function (t) { if (badge) badge.textContent = t; };
        const safePlay = function (v) { const pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); };
        const hold = function () {
            main.pause(); try { main.currentTime = 0; } catch (e) {}
            if (ctl) { ctl.pause(); try { ctl.currentTime = 0; } catch (e) {} }
            box.classList.add('is-still'); box.classList.remove('is-control'); label('Single input image');
            if (reduce) return;
            clearTimeout(timer);
            timer = setTimeout(ctl ? control : result, 1800);
        };
        const control = function () { box.classList.remove('is-still'); box.classList.add('is-control'); label('Camera + object motion in 3D'); safePlay(ctl); };
        const result  = function () { box.classList.remove('is-still'); box.classList.remove('is-control'); label('Generated video'); safePlay(main); };
        if (ctl) ctl.addEventListener('ended', result);
        main.addEventListener('ended', hold);
        if (main.readyState >= 2) hold(); else main.addEventListener('loadeddata', hold, { once: true });
    });
};
