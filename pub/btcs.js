
/* main js */
var update_games_interval = 5000;
var default_amount        = 2;
var max_amount            = 100;



/**********************
 * Navigation *
 **********************/

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
   else if (tab == '#checkout')
   {
      saveBetslip();
   }

   $('nav li').each(function() {
     $(this).toggleClass('selected', (tab == '#' + $(this).text().toLowerCase()) );
   });

   $('.back-btn').toggle(tab == '#betslip');
   forceUp();
}

$(function() {
    $('nav li, .betslip-btn').on('click', function() {
        //alert($(this).text());
        var tab = '#' + $(this).text().trim().toLowerCase().replace(' ','');
        loadTab(tab);
    });

    $('.back-btn, .continue-btn').on('click', function() { loadTab('#games'); });
    $('.checkout-btn').on('click', function() { loadTab('#checkout'); });
});



        
// menu navigation
$(function() {
    
    $(window).bind( 'hashchange', function(e) {
        if (!window.location.hash) return;
        var tab = window.location.hash;
        loadTab(tab);
    });
    loadTab('games');
});

function getAccountId()
{
    if (!localStorage['accountid'])
    {
        localStorage['accountid'] =  'xxxxxxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
    return localStorage['accountid'];
}

// save betslip on server and present payment address
function saveBetslip() {
   $('#checkout').empty().append('<p>Creating address...</p>');
    var slip = {
        accountid: getAccountId(),
        bets: []
    };

    var total = 0.0;
    for(var k in localStorage)
    {
        if (/^game-/.test(k))
        {
            var fld = k.split(';');
            slip.bets.push({
                game: fld[0].replace(/^[^-]+-/,''),
                amount: localStorage[k],
                result: fld[1] + '-' + fld[2]
            });
            total += parseInt(localStorage[k]);


        }
    }
    // generate sum
    total = (total/1000).toFixed(3);
    console.log(slip, total);
    $.ajax({
        url: 'create-betslip',
        type: 'post',
        //dataType: 'json',
        data: JSON.stringify(slip),
        contentType: "application/json",
        success: function(data) { 
            var uri = 'bitcoin:' + data +'?amount='+total;
            var img = '//chart.apis.google.com/chart?cht=qr&chld=Q|2&chs=200&chl=' + uri;
            $('#checkout').empty();
            $('#checkout').append('<img src="'+img + '">');
            $('#checkout').append('<a href="' +uri +'">pay here</a>');
         }
    });


}


// load games periodically
function loadGames() {
    var $sel = $('#games li.selected').attr('id');
    console.log('loading games');
    $('#gamelist').load('var/games.html', undefined, function() {
        $('.date').each(function() {
            $(this).html($(this).html().replace('T', '<br />'))
        })

        $('ul.games').each(function() {
            $(this).prev().toggle($('li', this).length > 0);
        });
                
            
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

// reselect bets in score tables from localstorage
function markBetslipBets() {
    var anybets = false;
    $('.games:not(.live) table.bets td.selected').removeClass('selected');
    for(var k in localStorage)
    {
        if (/^game-/.test(k))
        {

            console.log('marking bets for ' + k);
            var fld = k.split(';');
            var sel = '.games:not(.live) #' + fld[0] + ' table.bets tr:eq(' + (parseInt(fld[2])+1) + ') td:eq(' + (parseInt(fld[1])) + ')';
            var $sel = $(sel);
            console.log('marking bets for ' + sel);
            if ($sel.length == 0)
            {
                console.log('bet ' + k + ' no longer valid');
                localStorage.removeItem(k);
            }
            else
            {
              $sel.addClass('selected');
              anybets = true;
            }

        }
    }
    $('body').toggleClass('has-betslip', anybets);
}

// Setup betslip section based on local storage
function showBets() {
    
    $('#betslip .games').empty();
    for(var k in localStorage)
    {
        if (/^game-/.test(k))
        {
            // create a 
            var fld = k.split(';');
            var $overview = $('<div class="overview">')
            var $game = $('#' + fld[0] + ' .overview');

            $overview.append($('<div class="home_score">').text(fld[1]));
            $overview.append($('<div class="away_score">').text(fld[2]));

            $overview.append($('.home', $game).clone());
            $overview.append($('.away', $game).clone());
            
            console.log(k, localStorage[k] || default_amount);
            $stake = $('<div class="stake-edit"><span class="label">MyStake</span></div>');
            $stake.append('<input type="button" class="btn-minus" value="-">');
            $stake.append($('<input data-storage="'+ k +'" class="v" type="number" min="2" max="100">').attr('value', localStorage[k]));
            $stake.append('<input type="button" class="btn-plus" value="+">');
            $overview.append($stake);
            $overview.append('<input type="button" class="btn-remove" value="X">');
            var $li = $('<li id="game-{{id}}">')
                .append($overview);
            $('#betslip .games').append($li);

        }
    }
}

// **** betslip event handling
$(function() { 

    // minus/plus button
    $('#betslip').on('click', '.btn-minus', function() {
        var v = parseInt($(this).next().val());
        if (v > default_amount)
          $(this).next().val(--v);
        save($(this).next());
    });
    $('#betslip').on('click', '.btn-plus', function() {
        var v = parseInt($(this).prev().val());
        if (v < max_amount)
          $(this).prev().val(++v);
        save($(this).prev());
    });

    // select on focus
    $('#betslip').on('click', '.v', function() {
        $(this).select();
    });

    // fix invalid amounts
    // save on change
    $('#betslip').on('blur', '.v', function() {
        var v = parseInt($(this).val());
        if (isNaN(v) || v < default_amount || v > max_amount)
            $(this).val(default_amount);
        save($(this));

    });


    // remove a bet
    $('#betslip').on('click', '.btn-remove', function() {
        var k = $(this).closest('li').find('input.v').attr('data-storage');
        console.log($(this).closest('li'), k);
        localStorage.removeItem(k);
        $(this).closest('li').remove();
        markBetslipBets();
        if ($('#betslip ul.games li').length == 0)
        {
            // closing
            $('.back-btn').click();
        }

        
    })

    // save the bet of the given input-box to localStorage
    function save(inp) {
        localStorage[inp.attr('data-storage')] = inp.val();
    }


});

// selecting results
$(function() {
    $('#games').on('click', '.games:not(.live) table.bets td', function() {
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
        $('body').toggleClass('has-betslip', anybets);
        
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

function forceUp() {
      $('header').removeClass('nav-up').addClass('nav-down');
      didScoll = false;
}

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

