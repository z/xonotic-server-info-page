# xonotic-server-info-page
A boilerplate for setting up an informational page for your Xonotic game server.

:link: [live demo](http://z.github.io/xonotic-server-info-page)

##### Features
* Live server information (queries the master server list using ajax) or optionally read a local qstat XML file
* IRC widget to allow users to chat with your IRC channel from the page
* Maplist you can configure
* News page (blog) that reads markdown files
* About page

#### Quick Start

1. Fork this repository
2. Edit `config/site.js` with your server information (this can be generated with the GUI and exported as a zip)
3. Edit `config/manifest.js` to define your map list and link to blog posts
4. To edit pages, edit the existing files in `resources/data/pages`
4. To write blog posts, add markdown files to `resources/data/blog`, be sure to include them explicitly in `config/manifest.js`

#### Tips
You can host this on [github.io](https://pages.github.com/):
  * As an organization: create a `<organization>.github.io` repository within that organization (recommended)
  * As a user: by create a `gh-pages` branch in your fork

You can use the github interface to write blog posts, and maintain the site.

#### Advanced Configuration

Example `config/site.js`:

```js
var config = {

    // the remote address where a qstat xml can be returned
    qstatAddress: 'http://dpmaster.deathmask.net/?&xml=1&showplayers=1',

    // local or remote for bspname.jpg
    mapshotDir: 'http://xonotic.co/resources/mapshots/maps/',
    
    // theme (can be overriden by user's choice if switcher is enabled)
    theme: 'default',

    // IRC channel
    ircChannel: 'smb',

    // if true, the chat iframe will be loaded only when requested
    enableLoadChatButton: true,

    // this allows users to choose their own theme (uses a cookie)
    enableThemeSwitcher: true,
    
    // allow for devmode
    enableEditor: true,

    // debug options in developer mode
    editorOptions: {

        // used for development / debugging
        useLocalXML: false,

        // where is it located?
        qstatLocalXML: 'resources/data/qstat.xml'

    }

};
```

Example `config/manifest.js`:

```js
var manifest = {

    // Game Server config
    servers: [
        {
            id: 'insta',
            address: '96.44.146.149',
            port: '26010',
            game: 'xonotic',
            // list of bsp names
            mapList: [
                'swing',
                'boxflip',
                'accident_minsta',
            ]
        },
        {
            id: 'kansas',
            address: '96.44.146.149',
            port: '26000',
            game: 'xonotic',
            mapList: [
                'vinegar_v3',
                'dance_nex',
                'accident_v3',
                'battlevalentine',
                'furious',
                'gforce2',
                'got_wood',
                'gothic_block'
            ]
        }
    ],

    // id should be alphanumeric only, no duplicates
    // content refers to the .md file in resources/data/pages
    // icon is a font awesome icon
    pages: [
        {
            id: 'servers',
            title: 'Servers',
            content: 'servers',
            icon: 'list'
        },
        {
            id: 'about',
            title: 'About',
            content: 'about',
            icon: 'info-circle'
        },
        {
            id: 'maplist',
            title: 'Maplist',
            content: 'maplist',
            icon: 'map-o'
        },
        {
            id: 'chat',
            title: 'Chat',
            content: 'chat',
            icon: 'comment'
        },
        {
            id: 'news',
            title: 'News',
            content: 'news',
            icon: 'newspaper-o'
        }
    ],

    // list the posts you'd like to show here
    // latest first
    posts: [
        'second-post',
        'first-post'
    ],

    // Define Themes
    themes: {

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

};
```

This software was developed using static files, you can serve them locally for development with `python -m simpleHTTPServer 8000` and visit `http://localhost:8000`.
