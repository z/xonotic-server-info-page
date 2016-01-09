$(document).ready(function() {

    var playerList = $('#server-playerlist').DataTable({
        dataSrc: '',
        language: {
                  emptyTable: "No Players Currently On The Server"
        },
        dom: "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        conditionalPaging: true,
        columns: [
            { data: "name" },
            { data: "ping" },
            { data: "score" },
            { data: "team" }
        ],
        columnDefs: [
            {
                // handle missing team
                target: 3,
                render: function ( data, type, full, meta ) {
                    return (data) ? data : '';
                }
            }
        ]
    });

    // get qStat xml from dpmaster and create a JSON object
    function populateServerPanel() {
        var x2js = new X2JS();

        // for development, it's faster to query local xml
        //$.cookie('dev', '1');
        if ($.cookie('dev')) {
            var qstatXML = config.qstatLocalXML;
        } else {
            var qstatXML = config.qstatXML;
        }

        $.get(qstatXML, function(xml) {
            
            var qstatJSON = x2js.xml2json( xml );
            var qs = qstatJSON.qstat.server;

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
                var imageExtensions = ['jpg','png'];
                $.each(imageExtensions, function(index, value) {
                    var imgURL = config.mapPicDir + map + '.' + value;
                    isValidImage(imgURL, findMapImageCallback);
                });
                return false;
            }

            findMapImage(qs.map);

            // Gametype is only avaiable in qs rules status for many games
            var statusLine = qs.rules.rule[5]['__text'];
            var gametype = statusLine.split(':')[0];
            qs.gametype = gametype;

            $('#server-name').html(qs.name);
            $('#server-map').text("map title: " + qs.map);
            $('#server-numplayers').text(qs.numplayers);
            $('#server-maxplayers').text(qs.maxplayers);
            $('#server-gametype').text("gametype: " + qs.gametype);

            playerList.clear().rows.add(qs.players.player).draw();
        });

    }


    function populateBlog() {

        // the latest goes first
        var posts = [
            'second-post',
            'first-post'
        ];

        $.each(posts, function(index, post) {

            $.get("resources/data/blog/" + post + ".md", function(data) {

                var endfm = data.nthIndexOf("---",2);
                var fm = data.slice(4, endfm);
                var content = data.slice(endfm + 3);                      
                var metaData = jsyaml.load(fm);

                $('#blog').append('<div class="post">' +
                                    '<h2>' + metaData.title + '</h2>' +
                                    '<h5>Posted ' + metaData.date + ' by ' + metaData.author + '</h5>' +
                                    '<hr />' +
                                    '<p>' + marked(content) + '</p>' +
                                    '<p><span class="label label-info">' + metaData.category + '</span></p>' +
                                  '</div>'
                );

            });

        });
       
    }

    populateServerPanel();

    var timer = $.timer(function() {
        populateServerPanel();
    });
    timer.set({ time : 30000, autostart : true });

    populateBlog();


    $('#timer-toggle').click(function() {
        if ( $(this).prop('checked') ) {
            timer.play();
        } else {
            timer.pause();
        }
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

String.prototype.nthIndexOf = function(pattern, n) {
    var i = -1;

    while (n-- && i++ < this.length) {
        i = this.indexOf(pattern, i);
        if (i < 0) break;
    }

    return i;
}

