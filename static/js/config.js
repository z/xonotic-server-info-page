var config = {
    serverAddress: '96.44.146.149',
    serverPort: '26000',
    qstatAddress: 'http://dpmaster.deathmask.net/?game=xonotic&showplayers=1&xml=1&server=',
    qstatLocalXML: 'resources/data/qstat.xml',
    mapPicDir: 'http://xonotic.co/resources/mapshots/maps/'
};

config.qstatXML = config.qstatAddress + config.serverAddress + ':' + config.serverPort;
