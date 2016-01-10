var config = {

    // Game Server config
    serverAddress: '96.44.146.149',
    serverPort: '26000',
    serverGame: 'xonotic',

    // the remote address where a qstat xml can be returned
    qstatAddress: 'http://dpmaster.deathmask.net/?&xml=1&showplayers=1',

    // used for development or for serving from a local dir
    qstatLocalXML: 'resources/data/qstat.xml',

    // local or remote for bspname.jpg
    mapPicDir: 'http://xonotic.co/resources/mapshots/maps/',

    // allow for devmode
    enableEditor: true,

    // debug options in developer mode
    editorOptions: {
        useLocalXML: true,
        themeSwitcher: true
    }

};

// build the remote qstat URL and adds it to the config
config.qstatXML = config.qstatAddress +
                    '&game=' + config.serverGame +
                    '&server=' + config.serverAddress +
                    ':' + config.serverPort;
