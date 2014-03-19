
/* main js */
var update_games_interval = 7000;
var update_check_payment_interval = 800;
var update_chat_interval  = 17000;
var update_chat_interval_reduced = 3000; // after adding a msg
var default_amount        = 2;
var max_amount            = 100;




/* delayed load */
$(function() {
   $('#faq').load('faq.html');
   $('#stats').load('var/stats.html');

});


$(function() {
    if (!localStorage['version'])
    {
        for(k in localStorage)
            localStorage.removeItem(k);
        localStorage['version'] = 1;
    }
})


$(function() {

    // toggle mobile menu 
    $('#menu-btn').on('click', function() { $('header').toggleClass('menu-active'); });

    // toggle mobile betslip 
    $('.betslip-btn').on('click', function() { 
        $('body').toggleClass('betslip-open');
        fillBetslipBox();
        updateLeagueDisplay();
    });

    $('.checkout-btn').on('click', function() { 
        checkout();
    
    });
    // toggle mobile betslip 
    $('#leagues_btn').on('click', function() { 
        $('body').toggleClass('league-open');
        updateLeagueDisplay();
    });
});


        
// create new or return existsing accountid
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
//
// create new or return existsing username
function getUsername()
{
    var names = ['christiano', 'fabio', 'andre', 'pavel', 'michael', 'luis', 'matthias', 'george',
        'hristo', 'roberto', 'marco', 'lothar', 'jean-pierre', 'ruud', 'igor', 'michel', 'paolo',
        'kevin', 'allan', 'franz', 'johan', 'gerd', 'gianni', 'florian', 'bobby', 'denis', 'lev']

    if (!localStorage['username'])
    {
        localStorage['username'] = names[Math.floor(Math.random()*names.length)] +
            (Math.round(Math.random()*10000)); 
    }
    return localStorage['username'];
}

// end checkout process
function stopCheckout() {
  markBetslipBets();
  delete window.active_betslip;
  $('body').removeClass('lightbox');
  $('#checkout').hide(); 
  updateLeagueDisplay();
}


// save betslip on server and present payment address
function checkout() {
  $('#checkout').toggle(); 
  $('body').addClass('lightbox');

   $('#checkout .inner').empty().append('<p>Creating address...</p>');
    var slip = {
        accountid: getAccountId(),
        bets: []
    };

    var ret = $('input.return-address').val();
    if (ret)
    {
        if (!/^[13][a-zA-Z0-9]{26,33}$/.test(ret))
        {
            alert('Invalid return address');
            stopCheckout();
            return;
         }
        slip.return_address = ret;
    }

    // calc total
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
    total = (total/1000).toFixed(3);

    delete window.active_betslip;

    $.ajax({
        url: 'create-betslip',
        type: 'post',
        dataType: 'text',
        data: JSON.stringify(slip),
        contentType: "application/json",
        success: function(data) { 
            // setup checkout form 
            var uri = 'bitcoin:' + data +'?amount='+total;
            var img = '//chart.apis.google.com/chart?cht=qr&chld=Q|2&chs=200&chl=' + uri;
            $('#checkout .inner')
                .empty()
                .append('<input type="button" class="btn-remove" value="X">')
                .append('<h2>Total: '+total+'</h2>')
                .append('<img href="'+uri+'" src="'+img + '">')
                .append('<p>Send exactly <span class="a">' + total + '</span> BTC (plus miner fee) to:')
                .append('<p><a href="' +uri +'">'+data+'</a>')
                .append('<p>Waiting for payment...');
            if (!slip.return_address)
            {
               $('#checkout .inner').append('<p class="warn">Profits will be returned to the senders address.'
                + ' Use a wallet, or an online service that gives you control of the senders address.');
            }
                
            $('#checkout .btn-remove').click(function() {
                stopCheckout();
            })

            window.active_betslip = data;
         }
    });


}


function formatDate(iso) {
   function getLocaleShortDateString(d)
   {
       var f={"ar-SA":"dd/MM/yy","bg-BG":"dd.M.yyyy","ca-ES":"dd/MM/yyyy","zh-TW":"yyyy/M/d","cs-CZ":"d.M.yyyy",
       "da-DK":"dd-MM-yyyy","de-DE":"dd.MM.yyyy","el-GR":"d/M/yyyy","en-US":"M/d/yyyy","fi-FI":"d.M.yyyy",
       "fr-FR":"dd/MM/yyyy","he-IL":"dd/MM/yyyy","hu-HU":"yyyy. MM. dd.","is-IS":"d.M.yyyy","it-IT":"dd/MM/yyyy",
       "ja-JP":"yyyy/MM/dd","ko-KR":"yyyy-MM-dd","nl-NL":"d-M-yyyy","nb-NO":"dd.MM.yyyy","pl-PL":"yyyy-MM-dd",
       "pt-BR":"d/M/yyyy","ro-RO":"dd.MM.yyyy","ru-RU":"dd.MM.yyyy","hr-HR":"d.M.yyyy","sk-SK":"d. M. yyyy",
       "sq-AL":"yyyy-MM-dd","sv-SE":"yyyy-MM-dd","th-TH":"d/M/yyyy","tr-TR":"dd.MM.yyyy","ur-PK":"dd/MM/yyyy",
       "id-ID":"dd/MM/yyyy","uk-UA":"dd.MM.yyyy","be-BY":"dd.MM.yyyy","sl-SI":"d.M.yyyy","et-EE":"d.MM.yyyy",
       "lv-LV":"yyyy.MM.dd.","lt-LT":"yyyy.MM.dd","fa-IR":"MM/dd/yyyy","vi-VN":"dd/MM/yyyy","hy-AM":"dd.MM.yyyy",
       "az-Latn-AZ":"dd.MM.yyyy","eu-ES":"yyyy/MM/dd","mk-MK":"dd.MM.yyyy","af-ZA":"yyyy/MM/dd","ka-GE":"dd.MM.yyyy",
       "fo-FO":"dd-MM-yyyy","hi-IN":"dd-MM-yyyy","ms-MY":"dd/MM/yyyy","kk-KZ":"dd.MM.yyyy","ky-KG":"dd.MM.yy",
       "sw-KE":"M/d/yyyy","uz-Latn-UZ":"dd/MM yyyy","tt-RU":"dd.MM.yyyy","pa-IN":"dd-MM-yy","gu-IN":"dd-MM-yy",
       "ta-IN":"dd-MM-yyyy","te-IN":"dd-MM-yy","kn-IN":"dd-MM-yy","mr-IN":"dd-MM-yyyy","sa-IN":"dd-MM-yyyy",
       "mn-MN":"yy.MM.dd","gl-ES":"dd/MM/yy","kok-IN":"dd-MM-yyyy","syr-SY":"dd/MM/yyyy","dv-MV":"dd/MM/yy",
       "ar-IQ":"dd/MM/yyyy","zh-CN":"yyyy/M/d","de-CH":"dd.MM.yyyy","en-GB":"dd/MM/yyyy","es-MX":"dd/MM/yyyy",
       "fr-BE":"d/MM/yyyy","it-CH":"dd.MM.yyyy","nl-BE":"d/MM/yyyy","nn-NO":"dd.MM.yyyy","pt-PT":"dd-MM-yyyy",
       "sr-Latn-CS":"d.M.yyyy","sv-FI":"d.M.yyyy","az-Cyrl-AZ":"dd.MM.yyyy","ms-BN":"dd/MM/yyyy","uz-Cyrl-UZ":"dd.MM.yyyy",
       "ar-EG":"dd/MM/yyyy","zh-HK":"d/M/yyyy","de-AT":"dd.MM.yyyy","en-AU":"d/MM/yyyy","es-ES":"dd/MM/yyyy",
       "fr-CA":"yyyy-MM-dd","sr-Cyrl-CS":"d.M.yyyy","ar-LY":"dd/MM/yyyy","zh-SG":"d/M/yyyy","de-LU":"dd.MM.yyyy",
       "en-CA":"dd/MM/yyyy","es-GT":"dd/MM/yyyy","fr-CH":"dd.MM.yyyy","ar-DZ":"dd-MM-yyyy","zh-MO":"d/M/yyyy",
       "de-LI":"dd.MM.yyyy","en-NZ":"d/MM/yyyy","es-CR":"dd/MM/yyyy","fr-LU":"dd/MM/yyyy","ar-MA":"dd-MM-yyyy",
       "en-IE":"dd/MM/yyyy","es-PA":"MM/dd/yyyy","fr-MC":"dd/MM/yyyy","ar-TN":"dd-MM-yyyy","en-ZA":"yyyy/MM/dd",
       "es-DO":"dd/MM/yyyy","ar-OM":"dd/MM/yyyy","en-JM":"dd/MM/yyyy","es-VE":"dd/MM/yyyy","ar-YE":"dd/MM/yyyy",
       "en-029":"MM/dd/yyyy","es-CO":"dd/MM/yyyy","ar-SY":"dd/MM/yyyy","en-BZ":"dd/MM/yyyy","es-PE":"dd/MM/yyyy",
       "ar-JO":"dd/MM/yyyy","en-TT":"dd/MM/yyyy","es-AR":"dd/MM/yyyy","ar-LB":"dd/MM/yyyy","en-ZW":"M/d/yyyy",
       "es-EC":"dd/MM/yyyy","ar-KW":"dd/MM/yyyy","en-PH":"M/d/yyyy","es-CL":"dd-MM-yyyy","ar-AE":"dd/MM/yyyy",
       "es-UY":"dd/MM/yyyy","ar-BH":"dd/MM/yyyy","es-PY":"dd/MM/yyyy","ar-QA":"dd/MM/yyyy","es-BO":"dd/MM/yyyy",
       "es-SV":"dd/MM/yyyy","es-HN":"dd/MM/yyyy","es-NI":"dd/MM/yyyy","es-PR":"dd/MM/yyyy","am-ET":"d/M/yyyy",
       "tzm-Latn-DZ":"dd-MM-yyyy","iu-Latn-CA":"d/MM/yyyy","sma-NO":"dd.MM.yyyy","mn-Mong-CN":"yyyy/M/d","gd-GB":"dd/MM/yyyy",
       "en-MY":"d/M/yyyy","prs-AF":"dd/MM/yy","bn-BD":"dd-MM-yy","wo-SN":"dd/MM/yyyy","rw-RW":"M/d/yyyy",
       "qut-GT":"dd/MM/yyyy","sah-RU":"MM.dd.yyyy","gsw-FR":"dd/MM/yyyy","co-FR":"dd/MM/yyyy","oc-FR":"dd/MM/yyyy",
       "mi-NZ":"dd/MM/yyyy","ga-IE":"dd/MM/yyyy","se-SE":"yyyy-MM-dd","br-FR":"dd/MM/yyyy","smn-FI":"d.M.yyyy",
       "moh-CA":"M/d/yyyy","arn-CL":"dd-MM-yyyy","ii-CN":"yyyy/M/d","dsb-DE":"d. M. yyyy","ig-NG":"d/M/yyyy",
       "kl-GL":"dd-MM-yyyy","lb-LU":"dd/MM/yyyy","ba-RU":"dd.MM.yy","nso-ZA":"yyyy/MM/dd","quz-BO":"dd/MM/yyyy",
       "yo-NG":"d/M/yyyy","ha-Latn-NG":"d/M/yyyy","fil-PH":"M/d/yyyy","ps-AF":"dd/MM/yy","fy-NL":"d-M-yyyy",
       "ne-NP":"M/d/yyyy","se-NO":"dd.MM.yyyy","iu-Cans-CA":"d/M/yyyy","sr-Latn-RS":"d.M.yyyy","si-LK":"yyyy-MM-dd",
       "sr-Cyrl-RS":"d.M.yyyy","lo-LA":"dd/MM/yyyy","km-KH":"yyyy-MM-dd","cy-GB":"dd/MM/yyyy","bo-CN":"yyyy/M/d",
       "sms-FI":"d.M.yyyy","as-IN":"dd-MM-yyyy","ml-IN":"dd-MM-yy","en-IN":"dd-MM-yyyy","or-IN":"dd-MM-yy",
       "bn-IN":"dd-MM-yy","tk-TM":"dd.MM.yy","bs-Latn-BA":"d.M.yyyy","mt-MT":"dd/MM/yyyy","sr-Cyrl-ME":"d.M.yyyy",
       "se-FI":"d.M.yyyy","zu-ZA":"yyyy/MM/dd","xh-ZA":"yyyy/MM/dd","tn-ZA":"yyyy/MM/dd","hsb-DE":"d. M. yyyy",
       "bs-Cyrl-BA":"d.M.yyyy","tg-Cyrl-TJ":"dd.MM.yy","sr-Latn-BA":"d.M.yyyy","smj-NO":"dd.MM.yyyy","rm-CH":"dd/MM/yyyy",
       "smj-SE":"yyyy-MM-dd","quz-EC":"dd/MM/yyyy","quz-PE":"dd/MM/yyyy","hr-BA":"d.M.yyyy.","sr-Latn-ME":"d.M.yyyy",
       "sma-SE":"yyyy-MM-dd","en-SG":"d/M/yyyy","ug-CN":"yyyy-M-d","sr-Cyrl-BA":"d.M.yyyy","es-US":"M/d/yyyy"};

       var l=navigator.language?navigator.language:navigator['userLanguage'],y=d.getFullYear(),m=d.getMonth()+1,d=d.getDate();
       f=(l in f)?f[l]:"MM/dd/yyyy";
       function z(s){s=''+s;return s.length>1?s:'0'+s;}
       f=f.replace(/yyyy/,y);f=f.replace(/yy/,String(y).substr(2));
       f=f.replace(/MM/,z(m));f=f.replace(/M/,m);
       f=f.replace(/dd/,z(d));f=f.replace(/d/,d);
       return f;
   }

    var dt = new Date(iso);
    return getLocaleShortDateString(dt) + '<br>' + ('0'+dt.getHours()).substr(-2,2) + ':' +  ('0'+dt.getMinutes()).substr(-2,2) 
}
// load games from server
// always called after myaccount is loaded
//
function loadGames() {

    // if we're on checkout, we should only check account again
    if (location.hash == '#checkout')
    {
        window.setTimeout(loadAccount, update_check_payment_interval);
        return;
    }

    var $sel = $('#games li.selected').attr('id');

    $('#gamelist').load('var/games.html', undefined, function() {
        // format dates
        $('.date').each(function() {
            $(this).html(formatDate($(this).html()));
        })

        updateLeagueDisplay();
                
        if (window.my_bets)
            setMyBets(window.my_bets);
            
        if ($sel)
        {
            $('#'+$sel).addClass('selected');
        }
        markBetslipBets();

        window.setTimeout(loadAccount, update_games_interval);
    });
}

/* Mark my active bets based on account data */
function setMyBets(bets)
{
    var totalbets = 0;
    var totalbetsum = 0;

    for (game in bets) {
        var $game = $('#game-' + game);
        var $bettable = $game.find('table.bets');
        var total = 0;
        if (!$bettable.length)
            continue;
        for( var b in bets[game]) {
            var bet = bets[game][b]

            total += parseInt(bet.amount);
            totalbetsum += parseInt(bet.amount);
            totalbets++;

            if ($bettable.length)
            {
                var fld = bet.result.split('-');
                var $sel = $bettable.find('tr:eq(' + (parseInt(fld[1])+1) + ') td:eq(' + (parseInt(fld[0])) + ')');
                var org = $sel.text().split('\n');
                if (isNaN(parseInt(org[1]))) org[1] = 0;
                org[1] = (parseInt(org[1]||0) + parseInt(bet.amount))
                $sel.html(org[0] + '\n' + org[1] + '\n' + org[2]);
                $sel.addClass('mybet');
            }

        }
            
        var $mystakes = $game.find('.stake.my span')
        $mystakes.text(total);

    }
    // fill stats
    $('#stats .my td').eq(2).text(totalbets);
    $('#stats .my td').eq(3).text(totalbetsum);
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


       stopCheckout();


   }
}

// load account data (bets and paid betslips) and tailcall loadgames
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

        if ($li.hasClass('selected'))
        {
            $li.removeClass('selected');
            $('#leagues li').removeClass('gameselected');
        }
        else
        {
            $('#games li.selected').removeClass('selected')
            $li.addClass('selected');
            var league = $li.attr('data-league');
            console.log($li.offset().top, $li.height(), $(window).scrollTop(), $(window).height());
            if ($li.offset().top + $li.height() >  $(window).scrollTop()  + $(window).height())
               scrollTo($li);

            $('#leagues li[data-league="'+league+'"]').addClass('gameselected');
        }
    })
})

// reselect bets in score tables from localstorage
// and recreate bets in betslip when it is visible
function markBetslipBets() {
    var betslipcount = 0;
    var betslipsum = 0;
    $('.games:not(.live) table.bets td.selected').removeClass('selected');
    for(var k in localStorage)
    {
        if (/^game-/.test(k))
        {
            var fld = k.split(';');
            // complex selector for correct table cel
            var sel = '.games:not(.live) #' + fld[0] + ' table.bets tr:eq(' + (parseInt(fld[2])+1) + ') td:eq(' + (parseInt(fld[1])) + ')';
            var $sel = $(sel);
            if ($sel.length == 0)
            {
                localStorage.removeItem(k);
            }
            else
            {
               $sel.addClass('selected');
               betslipcount++;
               betslipsum += parseInt(localStorage[k]);
            }

        }
    }

    $('body').toggleClass('has-betslip', betslipcount>0);

    fillBetslipBox();

    // fill stats
    $('#stats .my td').eq(0).text(betslipcount);
    $('#stats .my td').eq(1).text(betslipsum);
}

// Setup betslip section based on local storage
function fillBetslipBox() {
    if (!$('#betslip').is(':visible'))
        return;
    
    $('#betslip .games').empty();
    for(var k in localStorage)
    {
        if (/^game-/.test(k))
        {
            // create a 
            var fld = k.split(';');
            var $overview = $('<div class="overview">')
            var $game = $('#' + fld[0] + ' .overview');

            $overview.append('<input type="button" class="btn-remove" value="X">');
            $overview.append($('.date', $game).clone());
            $overview.append($('.home', $game).clone());
            $overview.append($('<div class="home_score">').text(fld[1]));
            $overview.append($('<div class="home_ind">-</div>'));
            $overview.append($('<div class="away_score">').text(fld[2]));
            $overview.append($('.away', $game).clone());
            
            $stake = $('<div class="stake-edit"><span class="label">MyStake:</span></div>');
            $stake.append('<input type="button" class="btn-minus" value="-">');
            $stake.append($('<input data-storage="'+ k +'" class="v" type="number" min="2" max="100">').attr('value', localStorage[k]));
            $stake.append($('<input class="u" value="mBTC" readonly>'));
            $stake.append('<input type="button" class="btn-plus" value="+">');
            $overview.append($stake);
            var $li = $('<li id="game-{{id}}">')
                .append($overview);
            $('#betslip .games').append($li);

        }
    }
    calcBetslipTotal();
}
// **** betslip event handling
$(function() { 

    // minus/plus button
    $('#betslip').on('click', '.btn-minus', function() {
        var $i = $(this).nextAll('.v');
        var v = parseInt($i.val());
        if (v > default_amount)
          $i.val(--v);
        save($i);
    });
    $('#betslip').on('click', '.btn-plus', function() {
        var $i = $(this).prevAll('.v');
        var v = parseInt($i.val());
        if (v < max_amount)
          $i.val(++v);
        save($i);
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
        console.log('removing bet: ' + k);
        localStorage.removeItem(k);
        $(this).closest('li').remove();
        markBetslipBets();
        if ($('#betslip ul.games li').length == 0)
        {
            // closing
            if (isSmartPhone()) $('.betslip-btn').click();
        }


        
    })


    // save the bet of the given input-box to localStorage
    function save(inp) {
        localStorage[inp.attr('data-storage')] = inp.val();
        fillBetslipBox();
        calcBetslipTotal();
    }

});

function calcBetslipTotal() {
    var tot = 0;
    $('#betslip .games .v').each(function() {
        tot += parseInt($(this).val());
    });
    $('#betslip .total-wager .v').text(tot + ' mBTC');   
}

// selecting results (= add ot betslip)
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
        fillBetslipBox();
        
    });
 });



/* LEAGUE SELECTION */
$(function() {
    $('#leagues li').click(function() {
         // close game
         $('#leagues li').removeClass('gameselected');
         $('#games .games li').removeClass('selected');

        $(this).toggleClass('selected');
        var leagues_off = '';
        $('#leagues li:not(.selected)').each(function() {
            leagues_off += ','+$(this).attr('data-league');
        })
        localStorage['leagues'] = leagues_off;
        updateLeagueDisplay();
    });

    var leagues_off = localStorage['leagues'] || '';
    $('#leagues li').each(function() {
        var off = (leagues_off.indexOf($(this).attr('data-league')) > -1)
        $(this).toggleClass('selected', !off);
    });


});

function updateLeagueDisplay() {
    var leagues_off = localStorage['leagues'] || '';
    $('#games li').each(function() {
        var off = (leagues_off.indexOf($(this).attr('data-league')) > -1)
        $(this).toggle(!off);
    });

    // hide headers for hidden leagues
     $('section:not(#betslip) ul.games').each(function() {

         $(this).prev().toggle($('li:visible', this).length > 0);

     });
     // Display No games found message if needed
     $('#games p.n').toggle(($('#games h3:visible').length == 0));
}


$(window).scroll(function() {
    var st = $(this).scrollTop();

    /* ipad doesn't support fixed, and seems to trip over header selection below */
    var isiPad = navigator.userAgent.match(/iPad/i) != null;
    if (isiPad) return;

    // desktop: fix header when scrolled below it
    $('header').toggleClass('below', st > ($(window).height()-88));

    if (isSmartPhone())
        return;

    // keep betslip on games div
    var betslip_top = st - $('#content').offset().top + $('header .hdr').height() ;
    if (betslip_top < 0) betslip_top = 0;
    if (betslip_top + $('#betslip').height() > $('#content').height())
        betslip_top = $('#content').height() - $('#betslip').height();
    $('section#betslip').css('top', betslip_top);
    //
    // keep leagues on games div
    var leagues_top = st - $('#content').offset().top + $('header .hdr').height() ;
    if (leagues_top < 0) leagues_top = 0;
    if (leagues_top + $('#leagues').height() > $('#content').height())
        leagues_top = $('#content').height() - $('#leagues').height();
    $('section#leagues').css('top', leagues_top);

    // Highlight correct menu item 
    var bottom = st + $(window).height() - 50;
    $('ul#nav li.selected').removeClass('selected');
    if (bottom < $('#games').offset().top) 
        return;
    else if (bottom < $('#chats').offset().top) {
      $('ul#nav li:eq(0)').addClass('selected');
    }
    else if (bottom < $('#stats').offset().top) {
      $('ul#nav li:eq(1)').addClass('selected');
    }
    else if (bottom < $('#faq').offset().top)
      $('ul#nav li:eq(2)').addClass('selected');
    else
      $('ul#nav li:eq(3)').addClass('selected');
        

});
function isSmartPhone() {
    return $(window).width() <= 600;
}

function scrollTo(target) {

     $target = $(target);
     var target_top = $target.offset().top;
     if (!isSmartPhone()) 
         target_top -= $('header .hdr').height();
     else 
         target_top -= $('header').height();

     $('html, body').stop().animate({
         'scrollTop': target_top
     }, 200, 'swing', function () {
         //window.location.hash = target;
     });
}

// Make a links smooth-scroll 
$(function() {
  $('a[href^="#"]').on('click',function (e) {
      
        e.preventDefault();
        $('header').removeClass('nav-up').addClass('nav-down');
        $('header').toggleClass('menu-active', false); 

        scrollTo(this.hash);

        return false;
    });
});


/* CHAT */

$(function() {
    $('#chats form').submit(function() {
        var m= $('#chats input.m').val();
        var chat = {
            m: m,
            u: getUsername(),
            i: getAccountId() };
        if (m)
        {
          $.ajax({
              url: 'add-chat',
              type: 'post',
              dataType: 'text',
              data: JSON.stringify(chat),
              contentType: "application/json"
           })

           $('#chatbox').append($('<p>')
                .append($('<span class="t">').text(formatDate(new Date()).replace('<br>', ' ')))
                .append(' ')
                .append($('<span class="u">').text(getUsername()))
                .append(' ')
                .append($('<span class="m">').text(m)));

           $('#chatbox')[0].scrollTop = $('#chatbox')[0].scrollHeight; 
           update_chat_interval = update_chat_interval_reduced;
        }
        $('#chats input.m').val('');
        return false;
    })
})

function loadChat()
{
   $('#chatbox').load('var/chat.html', function() {
      $('#chatbox span.t').each(function() {
       $(this).text(formatDate($(this).text()).replace('<br>', ' '));
      })
      $('#chatbox')[0].scrollTop = $('#chatbox')[0].scrollHeight; 
    });
   window.chat_timer = window.setTimeout(loadChat, update_chat_interval);
}

$(function() {
    loadChat();
});


