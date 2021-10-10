/*\
title: $:/plugins/sq/file-uploads-PUT/uploader.js
type: application/javascript
module-type: uploader

Uploads to PUT enabled savers

\*/
(function(){


/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.name = "PUT";

exports.create = function(params) {
	return new PUTUploader(params);
};

function PUTUploader(params) {
	this.params = params || {};
	this.items = [];
	this.logger = new $tw.utils.Logger("PUT-uploader");
	this.logger.log("",params);
};

PUTUploader.prototype.initialize = function(callback) {
	this.logger.log("uploader initialize");
	callback();
};

PUTUploader.prototype._getCanonicalURI = function(uploadItem) {
	var uploadFolder = $tw.wiki.getTiddlerText("$:/config/file-uploads/PUT/uploadpath","files").trim().replace(/^\/|\/$/gm,"");
	return `${uploadFolder}/${uploadItem.filename}`;
};

/*
Arguments:
uploadItem: object of type UploadItem representing tiddler to be uploaded
callback accepts two arguments:
	err: error object if there was an error
	uploadItemInfo: object corresponding to the tiddler being uploaded with the following properties set:
	- title
	- canonical_uri (if available)
	- uploadComplete (boolean)
	- getUint8Array()
	- getBlob()
*/
PUTUploader.prototype.uploadFile = function(uploadItem,callback) {  
	var self = this,
		uploadInfo = { title: uploadItem.title },
		data = uploadItem.isBase64 ? uploadItem.getBlob() : uploadItem.text;

	var canonical_uri = this._getCanonicalURI(uploadItem),
		headers = $tw.wiki.getTiddlerText("$:/config/file-uploads/PUT/severtype","PUT").trim().toLowerCase() === "node.js" ? { "X-Requested-With": "TiddlyWiki" } : {};
	//convert to using $tw.utils.httpRequest https://github.com/Jermolene/TiddlyWiki5/blob/master/core/modules/savers/put.js#L83
	fetch(canonical_uri,{
		"method": "PUT",
		"headers": headers,
		"body": data
	}).then(function(response){
		if(!response.ok) {
			var status = response.status,
				msg = `Network error: ${response.status}`;
 			if(status === 401) { // authentication required
				msg = $tw.language.getString("Error/PutUnauthorized");
			} else if(status === 403) { // permission denied
				msg = $tw.language.getString("Error/PutForbidden");
			} else if(status === 404) {
				msg = "404: The upload directory does not exist";
			}			
			throw new Error(msg);
			return;
		}
		uploadInfo.canonical_uri = canonical_uri;
		self.logger.log(`Saved to ${uploadItem.filename} with canonical_uri ${canonical_uri}`);
		// Set updateProgress to true if the progress bar should be updated
		// For some uploaders where the data is just being added to the payload with no uploading taking place we may not want to update the progress bar
		uploadInfo.updateProgress = true;
		// Set uploadComplete to true if the uploaded file has been persisted and is available at the canonical_uri
		// This flag triggers the creation of a canonical_uri tiddler corresponding to the uploaded file
		// Here we set uploadComplete to false since with Fission the file uploaded will not be persisted until we call publish()
		uploadInfo.uploadComplete = true;
		callback(null,uploadInfo);	
	}).catch(function(err) {
		self.logger.alert(`Error saving file ${uploadItem.filename}: ${err}`);
		callback(err,uploadInfo);
	});

};

/*
Arguments:
callback accepts two arguments:
	status: true if there was no error, otherwise false
	uploadInfoArray (optional): array of uploadInfo objects corresponding to the tiddlers that have been uploaded
		this is needed and should set the canonical_uri for each uploadItem if:
		- (a) uploadInfo.uploadComplete was not set to true in uploadFile AND 
		- (b) uploadInfo.canonical_uri was not set in uploadFile
*/
PUTUploader.prototype.deinitialize = function(callback) {
	// Mock finishing up operations that will complete the upload and persist the files
	this.logger.log("uploader deinitialize");
	callback();
};

})();
