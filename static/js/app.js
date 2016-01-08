$(document).ready(function() {

    // qStat object from dpmaster

    var x2js = new X2JS();

    var serverIP = '96.44.146.159';
    var serverPort = '26000';
    //var qstatXML = 'http://dpmaster.deathmask.net/?game=xonotic&server=' + serverIP  + ':' + serverPort + '&showplayers=1&xml=1';
    var qstatXML = 'resources/data/qstat.xml';

    $.get(qstatXML, function(xml) {
        // TODO - XSS protection
        console.log(xml);
        var qstatJSON = x2js.xml2json( xml );
        var qs = qstatJSON.qstat.server;

        console.log(qs);
        console.log(qs.name);
        console.log(qs.map);
        console.log(qs.ping);
        console.log(qs.numplayers);
        console.log(qs.maxplayers);
        console.log(qs.gametype);
        console.log(qs.players);

        function isValidImage(url, callback) {
            var img = new Image();
            img.onerror = function() { callback(url, false); }
            img.onload =  function() { callback(url, true); }
            img.src = url;
        }

        function findMapImageCallback(url, answer) {
            if (answer) {
                $('#map-pic').attr('src', url).attr('title', qs.map);
            }
        }

        function findMapImage(map) {
            var imageExtensions = ['jpg','png','gif'];
            var mapPicDir = 'http://xonotic.co/resources/mapshots/maps/';
            $.each(imageExtensions, function(index, value) {
                var imgURL = mapPicDir + map + '.' + value;
                isValidImage(imgURL, findMapImageCallback);
            });
            return false;
        }

        findMapImage(qs.map);

        $('#server-name').text(qs.name);
        $('#server-map').text("map title: " + qs.map);
        $('#server-ping').text("ping: " + qs.ping);
        $('#server-numplayers').text(qs.numplayers);
        $('#server-maxplayers').text(qs.maxplayers);
        $('#server-gametype').text("gametype: " + qs.gametype);

        console.log(qs.players.player);

        $('#server-playerlist').DataTable({
            data: qs.players.player,
            dataSrc: '',
            columns: [
                { data: "name" },
                { data: "ping" },
                { data: "score" },
                { data: "team" }
            ]
        });
    });


    /*
     * Theme Switcher
     */

    // Define Themes
    var themes = {
        "default": "//maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css",
        "cerulean" : "//bootswatch.com/cerulean/bootstrap.min.css",
        "cosmo" : "//bootswatch.com/cosmo/bootstrap.min.css",
        "cyborg" : "//bootswatch.com/cyborg/bootstrap.min.css",
        "darkly" : "//bootswatch.com/darkly/bootstrap.min.css",
        "flatly" : "//bootswatch.com/flatly/bootstrap.min.css",
        "journal" : "//bootswatch.com/journal/bootstrap.min.css",
        "lumen" : "//bootswatch.com/lumen/bootstrap.min.css",
        "paper" : "//bootswatch.com/paper/bootstrap.min.css",
        "readable" : "//bootswatch.com/readable/bootstrap.min.css",
        "sandstone" : "//bootswatch.com/sandstone/bootstrap.min.css",
        "simplex" : "//bootswatch.com/simplex/bootstrap.min.css",
        "slate" : "//bootswatch.com/slate/bootstrap.min.css",
        "spacelab" : "//bootswatch.com/spacelab/bootstrap.min.css",
        "superhero" : "//bootswatch.com/superhero/bootstrap.min.css",
        "united" : "//bootswatch.com/united/bootstrap.min.css",
        "yeti" : "//bootswatch.com/yeti/bootstrap.min.css"
    }

    var userTheme = $.cookie('theme');

    if (userTheme) {
        setTheme(userTheme);
    }

    // themeSwitcher Widget
    function themeSwitcher() {

        // Setup menu

        var themeMenu = '<li id="theme-switcher-wrapper" class="navbar-btn"><div class="dropdown btn-group">' +
        '<a class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" href="#">' +
            '<span>Theme</span> ' +
            '<i class="caret"></i>' +
        '</a>' +
        '<ul id="theme-switcher" class="dropdown-menu"></ul>' +
    '</div></li>';

        $('.navbar-right').append(themeMenu);

        $.each(themes, function(index, value) {
            var title = index.charAt(0).toUpperCase() + index.substr(1);
            $('#theme-switcher').append('<li><a href="#" data-theme="' + index +'">' + title + '</a></li>');
        });

        $('#theme-switcher li a').click(function() {
            var theme = $(this).attr('data-theme');
            setTheme(theme);
        });

    }

    function setTheme(theme) {
        var themeurl = themes[theme];
        $.cookie('theme', theme)
        $('#theme-switcher li').removeClass('active');
        $('#theme').attr('href', themeurl);
        $('#theme-custom').attr('href', './static/css/themes/' + theme + '/custom.css');
        $('#theme-switcher li a[data-theme=' + theme + ']').parent().addClass('active');
        $('#theme-switcher-wrapper span').text('Theme: ' + theme);
    }

    new Konami(function() { themeSwitcher(); } );

} );


function bytesToSize(bytes) {
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
   if (bytes == 0) return '0 Byte';
   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
};

