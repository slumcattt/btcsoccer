
/* main js */


// menu navigation
$(function() {
    $('nav li').on('click', function() {
        $('body > section:visible').hide();
        $('#' + $(this).text().toLowerCase()).show(); 
    } );
});



// load gam,es

