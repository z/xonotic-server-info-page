# xonotic-server-info-page
A boilerplate for setting up an informational page for your Xonotic game server.

[demo](http://z.github.io/xonotic-server-info-page)

##### Features
* Live server information (queries the master server list using ajax) or optionally read a local qstat XML file
* IRC widget to allow users to chat with your IRC channel from the page
* Maplist you can configure (coming soon)
* News page (blog) that reads markdown
* About page

This software was developed using static files, you can serve them locally for development with `python -m simpleHTTPServer 8000` and visit `http://localhost:8000`.
