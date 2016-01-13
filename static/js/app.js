$(document).ready(function() {

    var options = {};
    var manifest = {};
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
                    targets: 0,
                    render: function ( data, type, full, meta) {
                        return decodeURIComponent(escape(data));
                    }
                },
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
                    thumbnail: options.mapshotDir + mapname + options.mapshotExtension,
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
        return options.qstatAddress +
                    '&game=' + server.game +
                    '&server=' + server.address +
                    ':' + server.port;
    }

    // get qStat xml from dpmaster and create a JSON object
    function populateServerPanel(server) {

        var id = '#server-' + server.id;

        $(id + ' .server-refreshing').show();
        
        var x2js = new X2JS();

        // for development, it's faster to query local xml
        if (options.editorOptions && options.editorOptions.useLocalXML) {
            var qstatXML = options.editorOptions.qstatLocalXML;
        } else {
            var qstatXML = buildStatURL(server);
        }

        $.get(qstatXML, function(xml) {
            
            var qstatJSON = x2js.xml2json( xml );
            var qs = qstatJSON.qstat.server;

            $(id + ' .server-down').hide();
            $(id + ' .server-timeout').hide();

            $(id + ' .map-pic').attr('src', './resources/images/no_map_pic.png')
            $(id + ' .server-name').html(qs.name);
            $(id + ' .server-map').text("");
            $(id + ' .server-numplayers').text("");
            $(id + ' .server-maxplayers').text("");
            $(id + ' .server-gametype').text("waiting...");
           
            switch (qs._status) {
                case "TIMEOUT":

                    $(id + " .server-timeout").fadeIn();
                    break;

                case "DOWN":

                    $(id + " .server-down").fadeIn();

                    playerListTable[server.id].clear().draw();

                case "UP":

                    $(id + ' .map-pic').attr('src', options.mapshotDir + qs.map + options.mapshotExtension);

                    // Gametype is only avaiable in qs rules status for many games
                    qs.gametype = "";
                    if (qs.rules && qs.rules.rule && qs.rules.rule.length > 5) {
                        var statusLine = qs.rules.rule[5]['__text'];
                        var gametype = statusLine.split(':')[0];
                        qs.gametype = gametype;
                    }

                    $(id + ' .server-name').html(qs.name);
                    $(id + ' .server-map').text("" + qs.map);
                    $(id + ' .server-numplayers').text(qs.numplayers);
                    $(id + ' .server-maxplayers').text(qs.maxplayers);
                    $(id + ' .server-gametype').text(qs.gametype);
                    $(id + ' .server-address').text(qs.address);
                    $(id + ' .server-port').text(qs.port);

                    playerListTable[server.id].clear().draw();

                    if ( qs.players ) {
                        $.each(qs.players.player, function(index, player) {
                            if ( qs.players.player[index].hasOwnProperty('team') != true ) {
                                qs.players.player[index].team = -1;
                            }
                        });

                        playerListTable[server.id].rows.add(qs.players.player).draw();

                    }

                    break;

                default:
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
        if ( options.enableLoadChatButton ) {
            $("#btn-chat-load").click(function(e) {
                e.preventDefault();
                loadChat();
            });
        } else {
            loadChat();
        }
    }

    function loadChat() {
        $("#chat-wrapper").html('<iframe src="https://webchat.quakenet.org/?channels=' + options.ircChannel + '&uio=Mj10cnVlJjExPTIyNg70" width="100%" height="700"></iframe>');
    }


    /*
     * Theme Switcher
     */
    function setupTheme() {
        var userTheme = $.cookie('theme');

        if (userTheme) {
            setTheme(userTheme);
        } else if (options.theme) {
            setTheme(options.theme);
        }
    }

    // initThemeSwitcher Widget
    function initThemeSwitcher() {

        if ( options.enableThemeSwitcher == false ) {
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
            var id = '#server-edit-' + server.id;
            manifest.servers[index].id = $(id + ' .editor-opt-server-id').val();
            manifest.servers[index].address = $(id + ' .editor-opt-server-address').val();
            manifest.servers[index].port = $(id + ' .editor-opt-server-port').val();
            manifest.servers[index].game = $(id + ' .editor-opt-server-game').val();

            populateServerPanel(server);
        });

        options.enableLoadChatButton = $('#editor-opt-load-chat-button').val();
        options.ircChannel = $('#editor-opt-irc-channel').val();

    }

    function exportConfig() {

        var zip = new JSZip();
        zip.file("config/options.json", JSON.stringify(options, null, 4));
        zip.file("config/manifest.json", JSON.stringify(manifest, null, 4));

        var resourcePath = "resources/data/";
        var postPath = "blog/";
        var pagePath = "pages/";

        var def = [];

        $.each(manifest.posts, function(index, post) {
            var path = resourcePath + postPath;
            var file = path + post + ".md";
            def.push(deferredAddZip(file, file, zip));
        });

        $.each(manifest.pages, function(index, page) {
            var path = resourcePath + pagePath;
            var file = path + page.content + ".md";
            def.push(deferredAddZip(file, file, zip));
        });

        // when everything has been downloaded, we can trigger the dl
        $.when.apply($, def).done(function () {

            var content = zip.generate({type:"blob"});

            // see FileSaver.js
            saveAs(content, "config.zip");

        }).fail(function (err) {
            console.log("oops zippy no worky");
        });

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
        $('#editor-opt-load-chat-button').prop('checked', options.enableLoadChatButton);
        $('#editor-opt-irc-channel').val(options.ircChannel);
        $('#editor-opt-theme-switcher').prop('checked', options.enableThemeSwitcher);

        $('#editor-opt-load-chat-button').click(function() {
            toggleLoadChatButton($(this));
        });

        $('#editor-opt-theme-switcher').click(function() {
            toggleThemeSwitcher($(this));
        });

        $('.apply-config').click(function() {
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

        $('.server-delete').click(function() {

            var id = $(this).attr('data-server-id');

            $("#server-options-" + id).remove();

            var $serverCol = $('#server-' + id).parent();

            $serverCol.siblings('.col-lg-6')
                        .removeClass('col-lg-6')
                        .addClass('col-lg-12');

            $serverCol.remove();

            manifest.servers = manifest.servers.filter(function(obj) {
                return obj.id != id;
            });

        });


        // List with handle
        Sortable.create(pagesSort, {
            animation: 150
        });

    }

    function initEditor() {
        if (options.enableEditor == false) {
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
        options.enableLoadChatButton = enabled;
    }

    function toggleThemeSwitcher($el) {
        var enabled = $el.prop('checked');
        options.enableThemeSwitcher = enabled;
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

        Handlebars.registerHelper('grouped_each', function(every, context, options) {
            var out = "", subcontext = [], i;
            if (context && context.length > 0) {
                for (i = 0; i < context.length; i++) {
                    if (i > 0 && i % every === 0) {
                        out += options.fn(subcontext);
                        subcontext = [];
                    }
                    subcontext.push(context[i]);
                }
                out += options.fn(subcontext);
            }
            return out;
        });

        Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

            switch (operator) {
                case '==':
                    return (v1 == v2) ? options.fn(this) : options.inverse(this);
                case '===':
                    return (v1 === v2) ? options.fn(this) : options.inverse(this);
                case '<':
                    return (v1 < v2) ? options.fn(this) : options.inverse(this);
                case '<=':
                    return (v1 <= v2) ? options.fn(this) : options.inverse(this);
                case '>':
                    return (v1 > v2) ? options.fn(this) : options.inverse(this);
                case '>=':
                    return (v1 >= v2) ? options.fn(this) : options.inverse(this);
                case '&&':
                    return (v1 && v2) ? options.fn(this) : options.inverse(this);
                case '||':
                    return (v1 || v2) ? options.fn(this) : options.inverse(this);
                default:
                    return options.inverse(this);
            }
        });

        // Server Page
        var serverTemplateSource = $("#server-template").html();
        var serverTemplate = Handlebars.compile(serverTemplateSource);

        $("#serverlist").append(serverTemplate(manifest));

        // Page Editor
        var editorTemplateSource = $("#edit-page-template").html();
        var editorTemplate = Handlebars.compile(editorTemplateSource);

        $("#global-config-options").prepend(editorTemplate(manifest));

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

    function init() {

        $.when(

            $.ajax({
                url: "./config/options.json",
                dataType: "text"
            }),

            $.ajax({
                url: "./config/manifest.json",
                dataType: "text"
            })

        ).then(function(a, b) {

            options = $.parseJSON(a[0]);
            manifest = $.parseJSON(b[0]);

            setupTheme();

            populatePages();

        });

    }

    init();

} );

/**
 * Fetch the content, add it to the JSZip object
 * and use a jQuery deferred to hold the result.
 * @param {String} url the url of the content to fetch.
 * @param {String} filename the filename to use in the JSZip object.
 * @param {JSZip} zip the JSZip instance.
 * @return {jQuery.Deferred} the deferred containing the data.
 */
function deferredAddZip(url, filename, zip) {
    var deferred = $.Deferred();
    JSZipUtils.getBinaryContent(url, function (err, data) {
        if(err) {
            deferred.reject(err);
        } else {
            zip.file(filename, data, {binary:true});
            deferred.resolve(data);
        }
    });
    return deferred;
}

function setDevCookie() {
    $.cookie('dev', '1');
}

function removeDevCookie() {
    $.removeCookie('dev');
}

function imgError(image) {
    $(image).attr('src','./resources/images/no_map_pic.png');
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

