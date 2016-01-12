$(document).ready(function() {

    var playerListTable = {};
    var mapListTable = false;

    function populatePages() {

        var promises = [];

        $.each(manifest.pages, function(index, page) {

            var def = new $.Deferred();

            var activeClass = (index == 0) ? ' class="active"' : '';

            // Add to navigation
            $('#main-navbar').append(
                '<li' + activeClass + '>' +
                    '<a href="#' + page.id + '" title="' + page.title + '" data-toggle="tab"><i class="fa fa-' + page.icon + '"></i> ' + page.title + '</a>' +
                '</li>'
            );

            var active = (index == 0) ? ' active' : '';

            // Get page content
            $.get('./resources/data/pages/' + page.content + '.md', function(data) {
                $('#main-content .tab-content').append(
                    '<div class="tab-pane' + active + '" id="' + page.id + '">' +
                        marked(data) +
                    '</div>'
                );
                def.resolve();
            });

            promises.push(def);

        });

        // Apply templates and handle tabs
        $.when.apply(undefined, promises).then(function() {
            setupTemplates();
            handleTabs();
            initWidgets();
        });
    }

    function initPlayerListTable(server) {
        playerListTable[server.id] = $('#server-' + server.id + '-playerlist').DataTable({
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

        $.each(manifest.servers, function(index, server) {
            $.each(server.mapList, function(index, mapname) {
                mapListData.push({
                    name: mapname,
                    thumbnail: config.mapshotDir + mapname + config.mapshotExtension,
                    server: server.id
                });
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
                { data: "server" },
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

    function buildStatURL(server) {
        // build the remote qstat URL and adds it to the config
        config.qstatXML = config.qstatAddress +
                            '&game=' + server.game +
                            '&server=' + server.address +
                            ':' + server.port;
    }

    // get qStat xml from dpmaster and create a JSON object
    function populateServerPanel(server) {

        $('#server-' + server.id + ' .server-refreshing').show();
        
        var x2js = new X2JS();

        // for development, it's faster to query local xml
        if (config.editorOptions && config.editorOptions.useLocalXML) {
            var qstatXML = config.editorOptions.qstatLocalXML;
        } else {
            buildStatURL(server);

            var qstatXML = config.qstatXML;
        }

        $.get(qstatXML, function(xml) {
            
            var qstatJSON = x2js.xml2json( xml );
            var qs = qstatJSON.qstat.server;

            var id = '#server-' + server.id;

            $(id + ' .server-down').hide();

            $(id + ' .map-pic').attr('src', './resources/images/no_map_pic.png')
            $(id + ' .server-name').html(qs.name);
            $(id + ' .server-map').text("map title: ");
            $(id + ' .server-numplayers').text("");
            $(id + ' .server-maxplayers').text("");
            $(id + ' .server-gametype').text("gametype: ");
            
            if (qs._status == "UP") {

                $(id + ' .map-pic').attr('src', config.mapshotDir + qs.map + config.mapshotExtension);

                // Gametype is only avaiable in qs rules status for many games
                qs.gametype = "";
                if (qs.rules && qs.rules.rule && qs.rules.rule.length > 5) {
                    var statusLine = qs.rules.rule[5]['__text'];
                    var gametype = statusLine.split(':')[0];
                    qs.gametype = gametype;
                }

                $(id + ' .server-name').html(qs.name);
                $(id + ' .server-map').text("map title: " + qs.map);
                $(id + ' .server-numplayers').text(qs.numplayers);
                $(id + ' .server-maxplayers').text(qs.maxplayers);
                $(id + ' .server-gametype').text("gametype: " + qs.gametype);

                playerListTable[server.id].clear().draw();

                if ( qs.players && qs.players != "" ) {

                    $.each(qs.players.player, function(index, player) {
                        if ( qs.players.player[index].hasOwnProperty('team') != true ) {
                            qs.players.player[index].team = -1;
                        }
                    });

                    playerListTable[server.id].rows.add(qs.players.player).draw();

                }
 
            } else {
                $(id + " .server-down").fadeIn();
            }
             
            $(id + ' .server-refreshing').fadeOut();
        });

    }

    function populateAllServers() {
        $.each(manifest.servers, function(index, server) {
            populateServerPanel(server);
        });
    }
    
    function initRefreshServers() {
        $('#refresh-servers').click(function() {
            populateAllServers();
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
        $.each(manifest.servers, function(index, server) {
            var id = server.id;
            var timer = $.timer(function() {
                populateServerPanel(server);
            });
            timer.set({ time : 30000, autostart : true });

            $(id + '.timer-toggle').click(function() {
                if ( $(this).prop('checked') ) {
                    timer.play();
                } else {
                    timer.pause();
                }
            });
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

    // initThemeSwitcher Widget
    function initThemeSwitcher() {

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
        $.each(manifest.servers, function(index, server) {
            var id = '#server-options-' + server.id;
            manifest.servers[index].id = $(id + ' .editor-opt-server-id').val();
            manifest.servers[index].address = $(id + ' .editor-opt-server-address').val();
            manifest.servers[index].port = $(id + ' .editor-opt-server-port').val();
            manifest.servers[index].game = $(id + ' .editor-opt-server-game').val();

            // build the remote qstat URL and adds it to the config
            buildStatURL(server);

            populateServerPanel(server);
        });

        config.enableLoadChatButton = $('#editor-opt-load-chat-button').val();
        config.ircChannel = $('#editor-opt-irc-channel').val();

    }

    function exportConfig() {

        var zip = new JSZip();
        zip.file("config/site.js", JSON.stringify(config, null, 4));
        zip.file("config/manifest.js", JSON.stringify(manifest, null, 4));

        var content = zip.generate({type:"blob"});

        // see FileSaver.js
        saveAs(content, "config.zip");

        console.log(config);
    }

    function enableEditor() {

        // Per server
        $.each(manifest.servers, function(index, server) {
            var id = '#server-options-' + server.id;
            $(id + ' .editor-opt-server-id').val(server.id);
            $(id + ' .editor-opt-server-address').val(server.address);
            $(id + ' .editor-opt-server-port').val(server.port);
            $(id + ' .editor-opt-server-game').val(server.game);
        });

        // Global
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

        $('#editor-options .server-delete').click(function() {

            var $serverPanel = $(this).closest('.panel');
            var id = $serverPanel.attr('id').split('server-options-')[1];
            console.log(id);

            $serverPanel.remove();
            $('#server-' + id).remove();

            manifest.servers = manifest.servers.filter(function(obj) {
                return obj.id != id;
            });

        });
    }

    function initEditor() {
        if (config.enableEditor == false) {
            $('#editor-opener').hide();
            new Konami(function() {
                enableEditor();
            });
        } else {
            enableEditor();
        }
    }

    function toggleEditor() {

        var $console = $('#editor-panel');
        if ($console.hasClass("visible")) {
            $console.removeClass('visible').animate({'margin-right':'-300px'});
            removeDevCookie();
        } else {
            $console.addClass('visible').animate({'margin-right':'0px'});
            setDevCookie();
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

    function setupTemplates() {

        Handlebars.registerHelper('each', function(context, options) {
          var ret = "";
          for(var i=0, j=context.length; i<j; i++) {
            ret = ret + options.fn(context[i]);
          }
          return ret;
        });

        // Server Page
        var serverTemplateSource = $("#server-template").html();
        var serverTemplate = Handlebars.compile(serverTemplateSource);

        $("#serverlist").append(serverTemplate(manifest));

        // Editor Panel
        var serverEditorTemplateSource = $("#server-editor-template").html();
        var serverEditorTemplate = Handlebars.compile(serverEditorTemplateSource);

        $("#editor-options").prepend(serverEditorTemplate(manifest));

        $.each(manifest.servers, function(index, server) {
            initPlayerListTable(server);

            populateServerPanel(server);
        });
    }

    // Called when populatePages() completes
    function initWidgets() {

        populateBlog();

        initMapListTable();

        initTimer();

        initChat();

        initThemeSwitcher();

        initEditor();

        initRefreshServers();

    }

    populatePages();

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

