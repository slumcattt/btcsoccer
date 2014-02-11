
/* main js */
var update_games_interval = 5000;
var default_amount        = '0.002';

$(function() {
    window.location.hash = '';
})

function loadTab(tab) {
    if ($('section'+tab).is(':visible'))
    {
        console.log('Tab ' + tab + ' already loaded');
        return;
    }
    console.log('loading tab' + tab);
    $('body > section:visible').hide();

    location.hash = tab;

    $(tab).show();

   if (tab == 'faq' && !window.faqloaded)
   {
      $('#faq').load('faq.html');
      window.faqloaded = true;
   }

   else if (tab == '#chat' & !window.chatloaded)
   {
      $('#faq').load('faq.html');
      window.chatloaded = true;
      $('#chat').html('<iframe id="shoutmix_b6c3a6" src="http://sht.mx/b6c3a6"'
          +' width="240" height="480" frameborder="0" scrolling="auto">'
          +'<a href="http://sht.mx/b6c3a6">ShoutMix Live Chat</a></iframe>');
   }

   else if (tab == '#betslip')
   {
      showBets();
   }
}

$(function() {
    $('nav li, nav .betslip-btn').on('click', function() {
        var tab = '#' + $(this).text().trim().toLowerCase();
        loadTab(tab);
    });
});

        
// menu navigation
$(function() {
    
    $(window).bind( 'hashchange', function(e) {
        if (!window.location.hash) return;
        var tab = window.location.hash;
        loadTab(tab);
    });
});


// load games periodically
function loadGames() {
    var $sel = $('#games li.selected').attr('id');
    console.log('loading games');
    $('#gamelist').load('var/games.html', undefined, function() {
        if ($sel)
        {
            console.log('reselecting game: ' + $sel);
            $('#'+$sel).addClass('selected');
        }
        markBetslipBets();

        window.setTimeout(loadGames, update_games_interval);
    });
}
$(function() {
    loadGames();
});

// opening games
$(function() {
    $('#games').on('click', 'li .overview', function() {

        var $li = $(this).closest('li');

        console.log('select game ' + $li[0].id);
        if ($li.hasClass('selected'))
        {
            $li.removeClass('selected');
        }
        else
        {
            $('#games li.selected').removeClass('selected')
            $li.addClass('selected');
        }
    })
})

// reselect bets  
function markBetslipBets() {
    var anybets = false;
    for(var k in localStorage)
    {
        if (/^game-/.test(k))
        {
            var fld = k.split(';');
            var sel = '#' + fld[0] + ' tr:eq(' + (parseInt(fld[2])+1) + ') td:eq(' + (parseInt(fld[1])) + ')';
            $(sel).addClass('selected');
            anybets = true;

        }
    }
    $('header').toggleClass('has-betslip', anybets);
}

function showBets() {
    
    $('#betslip .games').empty();
    for(var k in localStorage)
    {
        if (/^game-/.test(k))
        {
            var fld = k.split(';');
            var $overview = $('#' + fld[0] + ' .overview').clone();
            var $li = $('<li id="game-{{id}}">')
                .append($overview);
            $('#betslip .games').append($li);
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
        var anybets = false;
        for(var k in localStorage)
            if (/^game-/.test(k))
                anybets = true;
        $('header').toggleClass('has-betslip', anybets);
        
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

