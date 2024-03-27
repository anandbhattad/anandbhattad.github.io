// from: http://www.robots.ox.ac.uk/~vedaldi/assets/hidebib.js
// from: https://www.shubhtuls.github.io/blob/master/js/hidebib.js

function showHighlights() {
    
    removeSectionHeaderHighlight();
    addHighlightToSectionHeader(`section-link-highlights`);
    showOrHideYearHeadings(false);
    // show all sections  first
    var el = document.querySelectorAll('section.list');
    for (var i = 0 ; i < el.length ; ++i) {
        el[i].style.display = 'block';
    }

    var el = document.querySelectorAll("section.list tr") ;

    for (var i = 0 ; i < el.length ; ++i) {
        if (el[i].dataset.highlight == 'y') {
            el[i].style.display = 'table-row';
        } else {
            el[i].style.display = 'none';
        }
    }
}

function showOrHide(sectionId) {
    // highlight the sectionheader
    removeSectionHeaderHighlight();
    addHighlightToSectionHeader(`section-link-${sectionId}`);
    showOrHideYearHeadings(false);
    var el = document.querySelectorAll('section.list');
    for (var i = 0 ; i < el.length ; ++i) {
        if(el[i].id == `${sectionId}-section`) {

            el[i].style.display = 'block';
            // show all bibs
            var bibs = el[i].getElementsByTagName('tr');
            for (var j = 0 ; j < bibs.length ; ++j) {
                bibs[j].style.display = 'table-row';
            }
        } else {
            el[i].style.display = 'none';
        }

    }
}

function showAll()
{
    removeSectionHeaderHighlight();

    addHighlightToSectionHeader(`section-link-all`);
    showOrHideYearHeadings(true);
    // show all sections  first
    var el = document.querySelectorAll("section.list") ;
    for (var i = 0 ; i < el.length ; ++i) {
        el[i].style.display = 'block' ;
    }
    // show all bibs
    var el = document.querySelectorAll("section.list tr") ;
    for (var i = 0 ; i < el.length ; ++i) {
        el[i].style.display = 'table-row' ;
    }
}

function removeSectionHeaderHighlight() {
    var el = document.querySelectorAll('.section-links a');
    for (var i = 0 ; i < el.length ; ++i) {
       el[i].classList.remove('highlight');
    }
}

function addHighlightToSectionHeader(sectionId) {
    var el = document.getElementById(sectionId);
    el.classList.add('highlight');
}

function showOrHideYearHeadings(show){
    var el = document.querySelectorAll('section.list .year-heading');
    for (var i = 0 ; i < el.length ; ++i) {
        if(show) {
            el[i].style.display = 'table-cell';
        } else {
            el[i].style.display = 'none';
        }
    }

}

// call showHighlights() to show only the highlighted section when the page is loaded
document.addEventListener('DOMContentLoaded', (event) => {
    showHighlights();
});


/*
// from: http://www.robots.ox.ac.uk/~vedaldi/assets/hidebib.js
function showselected()
{
    var el = document.getElementsByTagName("div") ;
    for (var i = 0 ; i < el.length ; ++i) {
        if (el[i].className == "paper") {
            if (el[i] .dataset.selected == 'n'){
                el [i] .style.display = 'none' ;
            }
        }
    }

    for (var i = 0 ; i < el.length ; ++i) {
        if (el[i].className == "year_heading") {
            el [i] .style.display = 'none' ;
        }
    }
    document.getElementById('select').style = 'text-decoration:underline';
    document.getElementById('unselect').style = '';
}


function showall()
{
    var el = document.getElementsByTagName("div") ;
    for (var i = 0 ; i < el.length ; ++i) {
        if (el[i].className == "paper") {
            if (el[i] .dataset.selected == 'n'){
                el [i] .style.display = 'block' ;
            }
        }
    }

    for (var i = 0 ; i < el.length ; ++i) {
        if (el[i].className == "year_heading") {
            el [i] .style.display = 'block' ;
        }
    }
    document.getElementById('unselect').style = 'text-decoration:underline';
    document.getElementById('select').style = '';
}

function hideallbibs()
{
    var el = document.getElementsByTagName("div") ;
    for (var i = 0 ; i < el.length ; ++i) {
        if (el[i].className == "paper") {
            var bib = el[i].getElementsByTagName("pre") ;
            if (bib.length > 0) {
                bib [0] .style.display = 'none' ;
            }
        }
    }
}

function togglebib(paperid)
{
    var paper = document.getElementById(paperid) ;
    var bib = paper.getElementsByTagName('pre') ;
    if (bib.length > 0) {
        if (bib [0] .style.display == 'none') {
            bib [0] .style.display = 'block' ;
        } else {
            bib [0] .style.display = 'none' ;
        }
    }
}

function toggleblock(blockId)
{
    var block = document.getElementById(blockId);
    if (block.style.display == 'none') {
    	block.style.display = 'block' ;
    } else {
    	block.style.display = 'none' ;
    }
}

function hideblock(blockId)
{
    var block = document.getElementById(blockId);
    block.style.display = 'none' ;
}
*/