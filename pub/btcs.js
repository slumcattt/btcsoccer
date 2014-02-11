
/* main js */
var update_games_interval = 5000;
var default_amount        = '0.002';


// menu navigation
$(function() {
    $('nav li').on('click', function() {
        $('body > section:visible').hide();
        var tab = $(this).text().toLowerCase().trim();
        return;
        $('#' + tab).show(); 

        if (tab == 'faq' && !window.faqloaded)
        {
            $('#faq').load('faq.html');
            window.faqloaded = true;
        }

    } );
});

$(function() {
    
    $(window).bind( 'hashchange', function(e) {
        console.log(window.location.hash);
        $('body > section:visible').hide();
        $(window.location.hash).show();
    });
});


// load games
function loadGames() {
    var $sel = $('#games li.selected').attr('id');
    $('#gamelist').load('var/games.html', undefined, function() {
        if ($sel)
        {
            console.log('reselecting game: ' + $sel);
            $('#'+$sel).addClass('selected');
        }
        markBetslipBets();
    });
}
$(function() {
    window.setInterval(function() { loadGames }, update_games_interval);
    loadGames();

});

// opening games
$(function() {
    $('#games').on('click', 'li .overview', function() {
        console.log('select game');
        var $li = $(this).closest('li');
        if ($li.hasClass('selected'))
            $li.removeClass('selected');
        else
        {
            $('#games li.selected').removeClass('selected')
            $li.addClass('selected');
        }
    })
})

// reselect results
function markBetslipBets() {
    for(var k in localStorage)
    {
        if (/^game-/.test(k))
        {
            var fld = k.split(';');
            var sel = '#' + fld[0] + ' tr:eq(' + (parseInt(fld[2])+1) + ') td:eq(' + (parseInt(fld[1])) + ')';
            console.log('marking: ' + sel, $(sel));
            $(sel).addClass('selected');

        }
    }
    


}

// selecting results
$(function() {
    $('#games').on('click', 'td', function() {
        $(this).toggleClass('selected');
        var gameid = $(this).closest('li').attr('id')
        var home   = $(this).index() -1;
        var away   = $(this).parent().index() -1;
        var bet    = gameid + ';' + home + ';' + away;
        if (localStorage[bet])
        {
            localStorage.removeItem(bet);
            $(this).removeClass('selected');
        }
        else
        {
            localStorage[bet] = default_amount;
            $(this).addClass('selected')
        }
    });
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

