# xonotic-server-info-page
A boilerplate for setting up an informational page for your Xonotic game server.

:link: [live demo](http://z.github.io/xonotic-server-info-page)

##### Features
* Live server information (queries the master server list using ajax) or optionally read a local qstat XML file
* IRC widget to allow users to chat with your IRC channel from the page
* Maplist you can configure (coming soon)
* News page (blog) that reads markdown
* About page

#### Quick Start

1. Fork this repository
2. Edit `config/site.js` with your server information
3. Edit `config/manifest.js` to define your map list and link to blog posts
4. To write blog posts, add markdown files to `resources/data/blog`, be sure to include them explicitly in `config/manifest.js`

If you see a theme you like, you can set it within the `src` tag of `<link id="theme" ... >` found in `index.html`.

If you want to host this on github.io, create a `gh-pages` branch. You can use the github interface to write blog posts.

This software was developed using static files, you can serve them locally for development with `python -m simpleHTTPServer 8000` and visit `http://localhost:8000`.
