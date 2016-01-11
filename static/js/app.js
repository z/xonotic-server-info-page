$(document).ready(function() {

    var devMode = $.cookie('dev') ? true : false;

    var playerListTable = false;
    var mapListTable = false;

    function initPlayerListTable() {
        playerListTable = $('#server-playerlist').DataTable({
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
    }

    function initMapListTable() {

        var mapListData = [];

        $.each(manifest.mapList, function(index, mapname) {
            mapListData.push({
                name: mapname,
                thumbnail: config.mapshotDir + mapname + config.mapshotExtension
            });
        });

        mapListTable = $('#server-maplist').DataTable({
            data: mapListData,
            dataSrc: '',
            language: {
                      emptyTable: "The admin has not listed any maps"
            },
            dom: "<'row'<'col-sm-12'f>>" +
                    "<'row'<'col-sm-12'tr>>" +
                    "<'row'<'col-sm-5'i><'col-sm-7'p>>",
            columns: [
                { data: "name" },
                { data: "thumbnail" },
            ],
            columnDefs: [
                {
                    targets: 1,
                    render: function ( data, type, full, meta ) {       
                        return '<img src="' + data + '" title="mapshot" height="200" />';
                    }
                }
            ]
        });
    }

    function buildStatURL() {
        // build the remote qstat URL and adds it to the config
        config.qstatXML = config.qstatAddress +
                            '&game=' + config.servers[0].game +
                            '&server=' + config.servers[0].address +
                            ':' + config.servers[0].port;
    }

    // get qStat xml from dpmaster and create a JSON object
    function populateServerPanel() {

        $('#server-refreshing').show();
        
        var x2js = new X2JS();

        // for development, it's faster to query local xml
        if (devMode && config.editorOptions.useLocalXML) {
            var qstatXML = config.qstatLocalXML;
        } else {
            buildStatURL();
            var qstatXML = config.qstatXML;
        }

        $.get(qstatXML, function(xml) {
            
            var qstatJSON = x2js.xml2json( xml );
            var qs = qstatJSON.qstat.server;

            $("#server-down").hide();

            $('#map-pic').attr('src', './resources/images/no_map_pic.png')
            $('#server-name').html(qs.name);
            $('#server-map').text("map title: ");
            $('#server-numplayers').text("");
            $('#server-maxplayers').text("");
            $('#server-gametype').text("gametype: ");
            
            if (qs._status == "UP") {

                $('#map-pic').attr('src', config.mapshotDir + qs.map + config.mapshotExtension);

                // Gametype is only avaiable in qs rules status for many games
                qs.gametype = "";
                if (qs.rules && qs.rules.rule && qs.rules.rule.length > 5) {
                    var statusLine = qs.rules.rule[5]['__text'];
                    var gametype = statusLine.split(':')[0];
                    qs.gametype = gametype;
                }

                $('#server-name').html(qs.name);
                $('#server-map').text("map title: " + qs.map);
                $('#server-numplayers').text(qs.numplayers);
                $('#server-maxplayers').text(qs.maxplayers);
                $('#server-gametype').text("gametype: " + qs.gametype);

                playerListTable.clear().draw();

                if ( qs.players && qs.players != "" ) {

                    $.each(qs.players.player, function(index, player) {
                        if ( qs.players.player[index].hasOwnProperty('team') != true ) {
                            qs.players.player[index].team = -1;
                        }
                    });

                    playerListTable.rows.add(qs.players.player).draw();

                }
 
            } else {
                $("#server-down").fadeIn();
            }
             
            $('#server-refreshing').fadeOut();
        });

    }

    function populateBlog() {

        $.each(manifest.posts, function(index, post) {

            $.ajax({
                url: 'resources/data/blog/' + post + '.md',
                async: false,
                success: function (data) {

                    var endfm = data.nthIndexOf("---",2);
                    var fm = data.slice(4, endfm);
                    var content = data.slice(endfm + 3);                      
                    var metaData = jsyaml.load(fm);

                    formattedPost = '<div class="post">' +
                                        '<h2>' + metaData.title + '</h2>' +
                                        '<h5><i class="fa fa-calendar"></i> ' + metaData.date + ' posted by <i class="fa fa-user"></i> ' + metaData.author + ' in ' + '<i class="fa fa-tag"></i> <span class="label label-info">' + metaData.category + '</span>' + '</h5>' +
                                        '<hr />' +
                                        '<p>' + marked(content) + '</p>' +
                                        '<p></p>' +
                                      '</div>';

                    $('#blog').append(formattedPost);

                }

            }); // ajax

        }); // each

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

    function initChat() {
        if ( config.enableLoadChatButton ) {
            $("#btn-chat-load").click(function(e) {
                e.preventDefault();
                loadChat();
            });
        } else {
            loadChat();
        }
    }

    function loadChat() {
        $("#chat-wrapper").html('<iframe src="https://webchat.quakenet.org/?channels=' + config.ircChannel + '&uio=Mj10cnVlJjExPTIyNg70" width="100%" height="700"></iframe>');
    }


    /*
     * Theme Switcher
     */

    var userTheme = $.cookie('theme');

    if (userTheme) {
        setTheme(userTheme);
    } else if (config.theme) {
        setTheme(config.theme);
    }

    // themeSwitcher Widget
    function themeSwitcher() {

        if ( config.enableThemeSwitcher == false ) {
            return false;
        }

        // Setup menu

        var themeMenu = '<div class="dropdown btn-group">' +
        '<a class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" href="#">' +
            '<span>Theme</span> ' +
            '<i class="caret"></i>' +
        '</a>' +
        '<ul id="theme-switcher" class="dropdown-menu"></ul>' +
    '</div>';

        $('#theme-switcher-wrapper').hide().html(themeMenu);

        $.each(manifest.themes, function(index, value) {
            var title = index.charAt(0).toUpperCase() + index.substr(1);
            $('#theme-switcher').append('<li><a href="#" data-theme="' + index +'">' + title + '</a></li>');
        });

        $('#theme-switcher li a').click(function() {
            var theme = $(this).attr('data-theme');
            setTheme(theme);
        });

        $('#theme-switcher-wrapper').show();
    }

    function setTheme(theme) {
        var themeurl = manifest.themes[theme];
        $.cookie('theme', theme)
        $('#theme-switcher li').removeClass('active');
        $('#theme').attr('href', themeurl);
        $('#theme-custom').attr('href', './static/css/themes/' + theme + '/custom.css');
        $('#theme-switcher li a[data-theme=' + theme + ']').parent().addClass('active');
        $('#theme-switcher-wrapper span').text('Theme: ' + theme);
    }

    function applyConfig() {
        config.servers[0].address = $('#editor-opt-server-address').val();
        config.servers[0].port = $('#editor-opt-server-port').val();
        config.servers[0].game = $('#editor-opt-server-game').val();
        config.enableLoadChatButton = $('#editor-opt-load-chat-button').val();
        config.ircChannel = $('#editor-opt-irc-channel').val();

        // build the remote qstat URL and adds it to the config
        buildStatURL();

        populateServerPanel();
    }

    function exportConfig() {

        var zip = new JSZip();
        zip.file("config/site.js", JSON.stringify(config, null, 4));

        var content = zip.generate({type:"blob"});

        // see FileSaver.js
        saveAs(content, "config.zip");

        console.log(config);
    }

    function enableEditor() {

        $('#editor-opt-server-address').val(config.servers[0].address);
        $('#editor-opt-server-port').val(config.servers[0].port);
        $('#editor-opt-server-game').val(config.servers[0].game);
        $('#editor-opt-load-chat-button').prop('checked', config.enableLoadChatButton);
        $('#editor-opt-irc-channel').val(config.ircChannel);
        $('#editor-opt-theme-switcher').prop('checked', config.enableThemeSwitcher);

        $('#editor-opt-load-chat-button').click(function() {
            toggleLoadChatButton($(this));
        });

        $('#editor-opt-theme-switcher').click(function() {
            toggleThemeSwitcher($(this));
        });

        $('#editor-apply-config').click(function() {
            applyConfig();
        });

        $('#editor-export-config').click(function() {
            exportConfig();
        });

        $('#editor-opener').click(function() {
            toggleEditor();
        });

        $('#editor-close').click(function() {
            toggleEditor(); 
        });

    }

    function initEditor() {
        if (devMode == false) {
            new Konami(function() {
                enableEditor();
            });
        }

        if (config.enableEditor) {
            enableEditor();
        } else {
            $('#editor-opener').hide();
        }
    }

    function toggleEditor() {
        var $console = $('#editor-panel');
        if ($console.hasClass("visible")) {
            $console.removeClass('visible').animate({'margin-right':'-300px'});
            devMode = false;
            removeDevCookie();
            populateServerPanel();
        } else {
            $console.addClass('visible').animate({'margin-right':'0px'});
            devMode = true;
            setDevCookie();
            populateServerPanel();
        } 
        return false; 
    }

    function toggleLoadChatButton($el) {
        var enabled = $el.prop('checked');
        config.enableLoadChatButton = enabled;
    }

    function toggleThemeSwitcher($el) {
        var enabled = $el.prop('checked');
        config.enableThemeSwitcher = enabled;
        var $ts = $('#theme-switcher-wrapper');
        if (enabled) {
            $ts.show();
        } else {
            $ts.hide();
        }
    }

    // Handle tabs on page reload
    function handleTabs() {
        // Javascript to enable link to tab
        var url = document.location.toString();
        if (url.match('#')) {
            $('.navbar-tabs a[href=#'+url.split('#')[1]+']').tab('show') ;
        } 

        // Change hash for page-reload
        $('.navbar-tabs a').on('shown.bs.tab', function (e) {
            history.pushState( null, null, $(this).attr('href') );
            window.location.hash = e.target.hash;
        });
    }

    initPlayerListTable();

    populateServerPanel();

    initMapListTable();

    initTimer();

    initChat();

    populateBlog();

    handleTabs();

    themeSwitcher();

    initEditor();

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

