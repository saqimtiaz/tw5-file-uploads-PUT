/*\
title: $:/plugins/sq/node-files-PUT-support/server-route-upload.js
type: application/javascript
module-type: route

POST /^\/files\/(.+)$/

Upload binary files

\*/
(function() {

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

const fs = require('fs')
const path = require('path')
const buffer = require('buffer')

//https://github.com/Jermolene/TiddlyWiki5/blob/master/core/modules/server/routes/put-tiddler.js

exports.method = "PUT";
exports.platforms = ["node"];
exports.path = /^\/files\/(.+)$/;
exports.bodyFormat = "stream";
exports.handler = function(request,response,state) {

	try {
		
		var body = Buffer.from([]);
		request.on("data",function(data) {
			body = Buffer.concat([body,data]);
			if(body.length > 1e7) {
				response.writeHead(413, {'Content-Type': 'text/plain'}).end();
				request.connection.destroy();
			}
		});
		
		request.on("end",function() {
			var title = state.params[0];
			try {
				title = decodeURIComponent(title);
			} catch(e) {
			}
			var	filesPath = path.resolve($tw.boot.wikiTiddlersPath, "../files",title);
			//what happens if a different path is used from the server for the URL?
			//	have a rule that it needs to start with files for node.js
			$tw.utils.createDirectory(path.dirname(filesPath));

			fs.writeFile(filesPath,body,function(err){
				if(err) {
					console.log(err);
					throw err;
				} else {
					console.log(`External file saved: ${title}`);
					response.setHeader("Content-Type","application/json");
					response.end(JSON.stringify({
						"status": "204",
						"title": title,
						"_canonical_uri": request.url //relative? we don't need this as  we set it in the client
					}));
				}
			});
		});
	} catch (err) {
		console.log('Error parsing or writing uploaded file', err, {'level': 2});
		response.writeHead(400);
		response.end();
	}
};

}());

//tiddlywiki . --listen port=7555
