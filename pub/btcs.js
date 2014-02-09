
/* main js */


// menu navigation
$(function() {
    $('nav li').on('click', function() {
        $('body > section:visible').hide();
        var tab = $(this).text().toLowerCase().trim();
        $('#' + tab).show(); 

        if (tab == 'faq' && !window.faqloaded)
        {
            $('#faq').load('faq.html');
            window.faqloaded = true;
        }

    } );
});



// load games
$(function() {
    $('#gamelist').load('var/games.html');
    window.setInterval(function() {
       $('#gamelist').load('var/games.html');
       }, 5000);

});


// Hide Header on on scroll down
var didScroll;
var lastScrollTop = 0;
var delta = 5;
var navbarHeight = $('header').outerHeight();

$(window).scroll(function(event){
    didScroll = true;
});

setInterval(function() {
    if (didScroll) {
        hasScrolled();
        didScroll = false;
    }
}, 250);

function hasScrolled() {
    var st = $(this).scrollTop();

    // Make sure they scroll more than delta
    if(Math.abs(lastScrollTop - st) <= delta)
        return;
                                                         
    // If they scrolled down and are past the navbar, add class .nav-up.
    // This is necessary so you never see what is "behind" the navbar.
    if (st > lastScrollTop && st > navbarHeight){
        // Scroll Down
        $('header').removeClass('nav-down').addClass('nav-up');
    } else {
        // Scroll Up
        if(st + $(window).height() < $(document).height()) {
            $('header').removeClass('nav-up').addClass('nav-down');
        }
    }

    lastScrollTop = st;
}

