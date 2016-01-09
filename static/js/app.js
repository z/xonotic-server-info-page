$(document).ready(function() {

    var playerListTable = $('#server-playerlist').DataTable({
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
                targets: 3,
                render: function ( data, type, full, meta ) {
                    return (data == -1) ? 0 : data;
                }
            }
        ]
    });

    var mapListData = [];
    $.each(manifest.mapList, function(index, mapname) {
        mapListData.push({
            name: mapname,
            thumbnail: config.mapPicDir + mapname + '.jpg'
        });
    });

    var mapListTable = $('#server-maplist').DataTable({
        data: mapListData,
        dataSrc: '',
        language: {
                  emptyTable: "The admin has not listed any maps"
        },
        dom: "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        conditionalPaging: true,
        columns: [
            { data: "name" },
            { data: "thumbnail" },
        ],
        columnDefs: [
            {
                targets: 1,
                render: function ( data, type, full, meta ) {       
                    //findMapImage(data, mapListMapImageCallback);
                    return '<img src="' + data + '" title="mapshot" height="200" />';
                }
            }
        ]
    });


    function isValidImage(url, callback) {
        var img = new Image();
        img.onload =  function() { callback(url, true); }
        img.src = url;
    }

    function serverListMapImageCallback(url, answer) {
        if (answer) {
            $('#map-pic').attr('src', url);
        }
    }

    function mapListMapImageCallback(url, answer) {
        console.log(answer + ": " + url);
        if (answer) {
            return url;
        }
    }

    function findMapImage(map, findMapImageCallback) {
        var imageExtensions = ['jpg','png'];
        $.each(imageExtensions, function(index, value) {
            var imgURL = config.mapPicDir + map + '.' + value;
//            console.log(imgURL);
            isValidImage(imgURL, findMapImageCallback);
        });
        return false;
    }

    // get qStat xml from dpmaster and create a JSON object
    function populateServerPanel() {
        var x2js = new X2JS();

        // for development, it's faster to query local xml
        if ($.cookie('dev')) {
            var qstatXML = config.qstatLocalXML;
        } else {
            var qstatXML = config.qstatXML;
        }

        $.get(qstatXML, function(xml) {
            
            var qstatJSON = x2js.xml2json( xml );
            var qs = qstatJSON.qstat.server;

            findMapImage(qs.map, serverListMapImageCallback);

            // Gametype is only avaiable in qs rules status for many games
            var statusLine = qs.rules.rule[5]['__text'];
            var gametype = statusLine.split(':')[0];
            qs.gametype = gametype;

            $('#server-name').html(qs.name);
            $('#server-map').text("map title: " + qs.map);
            $('#server-numplayers').text(qs.numplayers);
            $('#server-maxplayers').text(qs.maxplayers);
            $('#server-gametype').text("gametype: " + qs.gametype);

            if ( qs.players != "" ) {
                $.each(qs.players.player, function(index, player) {
                    if ( qs.players.player[index].hasOwnProperty('team') != true ) {
                        qs.players.player[index].team = -1;
                    }
                });

                playerListTable.clear().rows.add(qs.players.player).draw();

            }
        });

    }


    function populateBlog() {

        $.each(manifest.posts, function(index, post) {

            $.get("resources/data/blog/" + post + ".md", function(data) {

                var endfm = data.nthIndexOf("---",2);
                var fm = data.slice(4, endfm);
                var content = data.slice(endfm + 3);                      
                var metaData = jsyaml.load(fm);

                $('#blog').append('<div class="post">' +
                                    '<h2>' + metaData.title + '</h2>' +
                                    '<h5><i class="fa fa-calendar"></i> ' + metaData.date + ' posted by <i class="fa fa-user"></i> ' + metaData.author + ' in ' + '<i class="fa fa-tag"></i> <span class="label label-info">' + metaData.category + '</span>' + '</h5>' +
                                    '<hr />' +
                                    '<p>' + marked(content) + '</p>' +
                                    '<p></p>' +
                                  '</div>'
                );

            });

        });
       
    }

    function initTimer() {
        var timer = $.timer(function() {
            populateServerPanel();
        });
        timer.set({ time : 30000, autostart : true });

        $('#timer-toggle').click(function() {
            if ( $(this).prop('checked') ) {
                timer.play();
            } else {
                timer.pause();
            }
        });
    }

    populateServerPanel();

    initTimer();

    populateBlog();

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

    if ($.cookie('dev')) {
        themeSwitcher();
    } else {
        new Konami(function() { themeSwitcher(); } );
    }


    // Handle tabs on page reload

    // Javascript to enable link to tab
    var url = document.location.toString();
    if (url.match('#')) {
        $('.navbar-tabs a[href=#'+url.split('#')[1]+']').tab('show') ;
    } 

    // Change hash for page-reload
    $('.navbar-tabs a').on('shown.bs.tab', function (e) {
        window.location.hash = e.target.hash;
    })

} );

function setDevCookie() {
    $.cookie('dev', '1');
}

function removeDevCookie() {
    $.removeCookie('dev');
}

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

