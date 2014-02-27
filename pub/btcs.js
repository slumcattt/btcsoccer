
/* main js */
var update_games_interval = 500000;
var update_check_payment_interval = 800;
var default_amount        = 2;
var max_amount            = 100;




/* delayed load */
$(function() {
   $('#faq').load('faq.html');

   var chatRef = new Firebase('https://btcsoccer.firebaseio.com/chat');
   var chat = new FirechatUI(chatRef, document.getElementById("chats"));
   var simpleLogin = new FirebaseSimpleLogin(chatRef, function(err, user) {
       if (err) {
           // an error occurred while attempting login
           console.log(error);
       } else if (user) {
         console.log('CHAT: logging in user', user);
         chat.setUser(user.id, 'Anonymous' + getAccountId());
       } else {
         console.log('CHAT: not logging in user', user);
       }
   });
});

function loadTab(tab, force) {
    if ($('section'+tab).is(':visible') && !force)
    {
        console.log('Tab ' + tab + ' already loaded');
        return;
    }

    if ($('section'+tab).length == 0)
        return; // not a tab

    $('#games li.selected').removeClass('selected');

    console.log('loading tab' + tab);
    $('body > section:visible').hide();

    location.hash = tab;

    $(tab).show();

   if (tab == '#faq' && !window.faqloaded)
   {
      window.faqloaded = true;
   }

   else if (tab == '#chats' & !window.chatloaded)
   {
      window.chatloaded = true;
      //chat.setUser('user-' + getAccountId(), 'user-'+getAccountId());
   }

   else if (tab == '#betslip')
   {
      showBets();
   }
   else if (tab == '#checkout')
   {
      saveBetslip();
   }

    console.log('selecting: ' + tab);
   $('nav li').each(function() {
     $(this).toggleClass('selected', (tab == '#' + $(this).text().toLowerCase()) );
   });

   $('.back-btn').toggle(tab == '#betslip');
   forceUp();
}

$(function() {
   /*
    $('nav li, .betslip-btn').on('click', function() {
        //alert($(this).text());
        var tab = '#' + $(this).text().trim().toLowerCase().replace(' ','');
        loadTab(tab);
    });

    $('.back-btn, .continue-btn').on('click', function() { loadTab('#games'); });
    */
    $('#menu-btn').on('click', function() { $('header').toggleClass('menu-active'); });

    $('.betslip-btn').on('click', function() { 
        $('section:not(#betslip):not(#checkout)').toggle();
        $('#betslip').toggle(); 
        if ($('#betslip').is(':visible'))
          showBets();
    });

    $('.checkout-btn').on('click', function() { 
        $('#betslip').toggle(); 
        $('#checkout').toggle(); 
    
    });
});



        
// menu navigation
/*
$(function() {
    
    $(window).bind( 'hashchange', function(e) {
        if (!window.location.hash) return;
        var tab = window.location.hash;
        loadTab(tab);
    });
    loadTab('#games', true);
});
*/
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
    // generate total
    total = (total/1000).toFixed(3);

    console.log(slip, total);
    delete window.active_betslip;

    $.ajax({
        url: 'create-betslip',
        type: 'post',
        dataType: 'text',
        data: JSON.stringify(slip),
        contentType: "application/json",
        success: function(data) { 
            var uri = 'bitcoin:' + data +'?amount='+total;
            var img = '//chart.apis.google.com/chart?cht=qr&chld=Q|2&chs=200&chl=' + uri;
            $('#checkout').empty();
            $('#checkout').append('<img src="'+img + '">');
            $('#checkout').append('<a href="' +uri +'">pay here</a>');

            window.active_betslip = data;
         }
    });


}

function getLocaleShortDateString(d)
{
    var f={"ar-SA":"dd/MM/yy","bg-BG":"dd.M.yyyy","ca-ES":"dd/MM/yyyy","zh-TW":"yyyy/M/d","cs-CZ":"d.M.yyyy","da-DK":"dd-MM-yyyy","de-DE":"dd.MM.yyyy","el-GR":"d/M/yyyy","en-US":"M/d/yyyy","fi-FI":"d.M.yyyy","fr-FR":"dd/MM/yyyy","he-IL":"dd/MM/yyyy","hu-HU":"yyyy. MM. dd.","is-IS":"d.M.yyyy","it-IT":"dd/MM/yyyy","ja-JP":"yyyy/MM/dd","ko-KR":"yyyy-MM-dd","nl-NL":"d-M-yyyy","nb-NO":"dd.MM.yyyy","pl-PL":"yyyy-MM-dd","pt-BR":"d/M/yyyy","ro-RO":"dd.MM.yyyy","ru-RU":"dd.MM.yyyy","hr-HR":"d.M.yyyy","sk-SK":"d. M. yyyy","sq-AL":"yyyy-MM-dd","sv-SE":"yyyy-MM-dd","th-TH":"d/M/yyyy","tr-TR":"dd.MM.yyyy","ur-PK":"dd/MM/yyyy","id-ID":"dd/MM/yyyy","uk-UA":"dd.MM.yyyy","be-BY":"dd.MM.yyyy","sl-SI":"d.M.yyyy","et-EE":"d.MM.yyyy","lv-LV":"yyyy.MM.dd.","lt-LT":"yyyy.MM.dd","fa-IR":"MM/dd/yyyy","vi-VN":"dd/MM/yyyy","hy-AM":"dd.MM.yyyy","az-Latn-AZ":"dd.MM.yyyy","eu-ES":"yyyy/MM/dd","mk-MK":"dd.MM.yyyy","af-ZA":"yyyy/MM/dd","ka-GE":"dd.MM.yyyy","fo-FO":"dd-MM-yyyy","hi-IN":"dd-MM-yyyy","ms-MY":"dd/MM/yyyy","kk-KZ":"dd.MM.yyyy","ky-KG":"dd.MM.yy","sw-KE":"M/d/yyyy","uz-Latn-UZ":"dd/MM yyyy","tt-RU":"dd.MM.yyyy","pa-IN":"dd-MM-yy","gu-IN":"dd-MM-yy","ta-IN":"dd-MM-yyyy","te-IN":"dd-MM-yy","kn-IN":"dd-MM-yy","mr-IN":"dd-MM-yyyy","sa-IN":"dd-MM-yyyy","mn-MN":"yy.MM.dd","gl-ES":"dd/MM/yy","kok-IN":"dd-MM-yyyy","syr-SY":"dd/MM/yyyy","dv-MV":"dd/MM/yy","ar-IQ":"dd/MM/yyyy","zh-CN":"yyyy/M/d","de-CH":"dd.MM.yyyy","en-GB":"dd/MM/yyyy","es-MX":"dd/MM/yyyy","fr-BE":"d/MM/yyyy","it-CH":"dd.MM.yyyy","nl-BE":"d/MM/yyyy","nn-NO":"dd.MM.yyyy","pt-PT":"dd-MM-yyyy","sr-Latn-CS":"d.M.yyyy","sv-FI":"d.M.yyyy","az-Cyrl-AZ":"dd.MM.yyyy","ms-BN":"dd/MM/yyyy","uz-Cyrl-UZ":"dd.MM.yyyy","ar-EG":"dd/MM/yyyy","zh-HK":"d/M/yyyy","de-AT":"dd.MM.yyyy","en-AU":"d/MM/yyyy","es-ES":"dd/MM/yyyy","fr-CA":"yyyy-MM-dd","sr-Cyrl-CS":"d.M.yyyy","ar-LY":"dd/MM/yyyy","zh-SG":"d/M/yyyy","de-LU":"dd.MM.yyyy","en-CA":"dd/MM/yyyy","es-GT":"dd/MM/yyyy","fr-CH":"dd.MM.yyyy","ar-DZ":"dd-MM-yyyy","zh-MO":"d/M/yyyy","de-LI":"dd.MM.yyyy","en-NZ":"d/MM/yyyy","es-CR":"dd/MM/yyyy","fr-LU":"dd/MM/yyyy","ar-MA":"dd-MM-yyyy","en-IE":"dd/MM/yyyy","es-PA":"MM/dd/yyyy","fr-MC":"dd/MM/yyyy","ar-TN":"dd-MM-yyyy","en-ZA":"yyyy/MM/dd","es-DO":"dd/MM/yyyy","ar-OM":"dd/MM/yyyy","en-JM":"dd/MM/yyyy","es-VE":"dd/MM/yyyy","ar-YE":"dd/MM/yyyy","en-029":"MM/dd/yyyy","es-CO":"dd/MM/yyyy","ar-SY":"dd/MM/yyyy","en-BZ":"dd/MM/yyyy","es-PE":"dd/MM/yyyy","ar-JO":"dd/MM/yyyy","en-TT":"dd/MM/yyyy","es-AR":"dd/MM/yyyy","ar-LB":"dd/MM/yyyy","en-ZW":"M/d/yyyy","es-EC":"dd/MM/yyyy","ar-KW":"dd/MM/yyyy","en-PH":"M/d/yyyy","es-CL":"dd-MM-yyyy","ar-AE":"dd/MM/yyyy","es-UY":"dd/MM/yyyy","ar-BH":"dd/MM/yyyy","es-PY":"dd/MM/yyyy","ar-QA":"dd/MM/yyyy","es-BO":"dd/MM/yyyy","es-SV":"dd/MM/yyyy","es-HN":"dd/MM/yyyy","es-NI":"dd/MM/yyyy","es-PR":"dd/MM/yyyy","am-ET":"d/M/yyyy","tzm-Latn-DZ":"dd-MM-yyyy","iu-Latn-CA":"d/MM/yyyy","sma-NO":"dd.MM.yyyy","mn-Mong-CN":"yyyy/M/d","gd-GB":"dd/MM/yyyy","en-MY":"d/M/yyyy","prs-AF":"dd/MM/yy","bn-BD":"dd-MM-yy","wo-SN":"dd/MM/yyyy","rw-RW":"M/d/yyyy","qut-GT":"dd/MM/yyyy","sah-RU":"MM.dd.yyyy","gsw-FR":"dd/MM/yyyy","co-FR":"dd/MM/yyyy","oc-FR":"dd/MM/yyyy","mi-NZ":"dd/MM/yyyy","ga-IE":"dd/MM/yyyy","se-SE":"yyyy-MM-dd","br-FR":"dd/MM/yyyy","smn-FI":"d.M.yyyy","moh-CA":"M/d/yyyy","arn-CL":"dd-MM-yyyy","ii-CN":"yyyy/M/d","dsb-DE":"d. M. yyyy","ig-NG":"d/M/yyyy","kl-GL":"dd-MM-yyyy","lb-LU":"dd/MM/yyyy","ba-RU":"dd.MM.yy","nso-ZA":"yyyy/MM/dd","quz-BO":"dd/MM/yyyy","yo-NG":"d/M/yyyy","ha-Latn-NG":"d/M/yyyy","fil-PH":"M/d/yyyy","ps-AF":"dd/MM/yy","fy-NL":"d-M-yyyy","ne-NP":"M/d/yyyy","se-NO":"dd.MM.yyyy","iu-Cans-CA":"d/M/yyyy","sr-Latn-RS":"d.M.yyyy","si-LK":"yyyy-MM-dd","sr-Cyrl-RS":"d.M.yyyy","lo-LA":"dd/MM/yyyy","km-KH":"yyyy-MM-dd","cy-GB":"dd/MM/yyyy","bo-CN":"yyyy/M/d","sms-FI":"d.M.yyyy","as-IN":"dd-MM-yyyy","ml-IN":"dd-MM-yy","en-IN":"dd-MM-yyyy","or-IN":"dd-MM-yy","bn-IN":"dd-MM-yy","tk-TM":"dd.MM.yy","bs-Latn-BA":"d.M.yyyy","mt-MT":"dd/MM/yyyy","sr-Cyrl-ME":"d.M.yyyy","se-FI":"d.M.yyyy","zu-ZA":"yyyy/MM/dd","xh-ZA":"yyyy/MM/dd","tn-ZA":"yyyy/MM/dd","hsb-DE":"d. M. yyyy","bs-Cyrl-BA":"d.M.yyyy","tg-Cyrl-TJ":"dd.MM.yy","sr-Latn-BA":"d.M.yyyy","smj-NO":"dd.MM.yyyy","rm-CH":"dd/MM/yyyy","smj-SE":"yyyy-MM-dd","quz-EC":"dd/MM/yyyy","quz-PE":"dd/MM/yyyy","hr-BA":"d.M.yyyy.","sr-Latn-ME":"d.M.yyyy","sma-SE":"yyyy-MM-dd","en-SG":"d/M/yyyy","ug-CN":"yyyy-M-d","sr-Cyrl-BA":"d.M.yyyy","es-US":"M/d/yyyy"};

    var l=navigator.language?navigator.language:navigator['userLanguage'],y=d.getFullYear(),m=d.getMonth()+1,d=d.getDate();
    f=(l in f)?f[l]:"MM/dd/yyyy";
    function z(s){s=''+s;return s.length>1?s:'0'+s;}
    f=f.replace(/yyyy/,y);f=f.replace(/yy/,String(y).substr(2));
    f=f.replace(/MM/,z(m));f=f.replace(/M/,m);
    f=f.replace(/dd/,z(d));f=f.replace(/d/,d);
    return f;
}


function formatDate(iso) {

    var dt = new Date(iso);
    return getLocaleShortDateString(dt) + '<br>' + dt.toLocaleTimeString().substr(0,5);
}

// load games from server
// always called after myaccount is loaded
//
function loadGames() {

    // if we're checkout, we should only check account again
    if (location.hash == '#checkout')
    {
        window.setTimeout(loadAccount, update_check_payment_interval);
        return;
    }

    var $sel = $('#games li.selected').attr('id');

    $('#gamelist').load('var/games.html', undefined, function() {
        //
        // TODO this should be local time
        $('.date').each(function() {
            $(this).html(formatDate($(this).html()));
        })

        $('ul.games').each(function() {
            $(this).prev().toggle($('li', this).length > 0);
        });
                
        if (window.my_bets)
            setMyBets(window.my_bets);
            
        if ($sel)
        {
            console.log('reselecting game: ' + $sel);
            $('#'+$sel).addClass('selected');
        }
        markBetslipBets();

        window.setTimeout(loadAccount, update_games_interval);
    });
}

function setMyBets(bets)
{
    console.log('bets', bets)
    for (game in bets) {
        var $game = $('#game-' + game);
        var $bettable = $game.find('table.bets');
        var total = 0;
        for( var b in bets[game]) {
            var bet = bets[game][b]

            total += parseInt(bet.amount);

            if ($bettable.length)
            {
                var fld = bet.result.split('-');
                var $sel = $bettable.find('tr:eq(' + (parseInt(fld[1])+1) + ') td:eq(' + (parseInt(fld[0])) + ')');
                var org = $sel.html().trim().split('<br>');
                $sel.html(org[0] + '<br>' + (parseInt(org[1]||0) + parseInt(bet.amount)));
                console.log($bettable, $sel, $sel.html());
                $sel.addClass('mybet');
            }

        }
            
        var $mystakes = $game.find('.stakes tr:eq(1) td:eq(0)');
        $mystakes.text('xx');
        $mystakes.text(total);
    }

}

// See if a payment has been made, so the betslip needs to be cleared and closed
function checkPayment(slips) {
   if (window.active_betslip 
       && slips.indexOf(window.active_betslip) > -1)
   {
       
       // clear betslip
       for(var k in localStorage)
           if (/^game-/.test(k))
               localStorage.removeItem(k);

       markBetslipBets();

       loadTab('#games');

       delete window.active_betslip;

   }
}

function loadAccount() {
    if (localStorage.accountid)
    {   
        $.ajax( {
            url: 'var/' + localStorage.accountid, 
            dataType: 'json',
            success: function(data) {
                checkPayment(data.slips);

                window.my_bets = data;
                loadGames();
                
            },
            error: function() {
                loadGames();
            }
            
        });
    }
    else
        loadGames();

}


$(function() {
    loadAccount();
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
    $('header').toggleClass('menu-active', false); 

    if ($(window).scrollTop() > (.8 * $(window).height()))
        console.log('below');
    else
        console.log('above');
    $('header').toggleClass('below', $(window).scrollTop() > ($(window).height()-70));
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

function isSmartPhone() {
    return $(window).width() <= 600;
}
/* Make a links smooth-scroll */
$(function() {
  $('a[href^="#"]').on('click',function (e) {
      
        e.preventDefault();
        $('header').removeClass('nav-up').addClass('nav-down');
        $('header').toggleClass('menu-active', false); 

        var target = this.hash,
        $target = $(target);
        var target_top = $target.offset().top;
        console.log('scrolling to ' , $target, target_top, $('header .hdr').height(), $('#intro').height());
        /*
        if (target == '#games' && isSmartPhone())
          target_top = 0;
        console.log('scrolling to ' , $target, target_top);
        */

        if (!isSmartPhone()) 
            target_top -= $('header .hdr').height();

        $('html, body').stop().animate({
            'scrollTop': target_top
        }, 200, 'swing', function () {
            //window.location.hash = target;
        });
        return false;
    });
});
