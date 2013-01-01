var fs = require('fs');
var async = require('async');
var zlib = require('zlib');

// This code returns "not found" when '..' appears in the url.

var cache = {},
    mimetype = {
      'png'  : 'image/png',
      'js'   : 'application/javascript',
      'css'  : 'text/css',
      'ico'  : 'image/x-icon',
      'html' : 'text/html',
      'ogg' : 'audio/ogg',
      'mp3' : 'audio/mp3'
    };

function getType(filename) {
  var i = filename.lastIndexOf('.');
  if (i === -1) return undefined;
  return mimetype[filename.substr(i + 1)];
}

exports = module.exports = function() { return handleRequest; }

function handleRequest(req, res) {  
  var file = cache['public' + req.url];
  if (file === undefined) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  if (file.gzip !== undefined && 
      req.headers['accept-encoding'] !== undefined && 
      req.headers['accept-encoding'].indexOf('gzip') !== -1) {
    res.writeHead(200, {
      'Content-Type': file.type,
      'Content-Length': file.gzip.length,
      'Pragma': 'public',
      'Cache-Control': 'max-age=31536000',
      'Expires': new Date(Date.now() + 31536000).toUTCString(),
      'Content-Encoding': 'gzip',
      'Vary': 'Accept-Encoding'
    });
    res.end(file.gzip);
  } else {
    console.log('req_memfile: browser does not accept gzip');
    console.log('req_memfile: browser accepts ' + req.headers['accept-encoding']);
    res.writeHead(200, {
      'Content-Type': file.type,
      'Content-Length': file.data.length,
      'Pragma': 'public',
      'Cache-Control': 'max-age=31536000',
      'Expires': new Date(Date.now() + 31536000).toUTCString()
    });
    res.end(file.data);
  }
};

function compress(data, cb) {
//  var gzip = zlib.createGzip();
  zlib.gzip(data, function(err, result) {
    if (err) cb(err);
    else cb(result);
  });
}

// Read files into memory.  Do not compress ogg and mp3.
exports.init = function(cb) {
  readDir('public', function(err) {
    if (err) cb(err);
    // Create the gzip versions of each file.    
    // Do this sequentially to avoid going into swap memory.
    async.forEachSeries(
      Object.keys(cache), 
      function(filename, cb) {
        if (cache[filename].type === 'audio/ogg' || cache[filename].type !== 'audio/mp3') return cb();
        compress(cache[filename].data, function(result) {
          if (result instanceof Error) return cb(result);
          cache[filename].gzip = result;
          cb();
        });
      },
      function(err) {
        if (err) return cb(err); 
        // Calculate and display memory consumption.
        var filename, uncompressed = 0, compressed = 0;
        for (filename in cache) {
          uncompressed += cache[filename].data.length;
          if (cache[filename].gzip !== undefined) compressed += cache[filename].gzip.length;
        }
        console.log('memfile bytes, uncompressed: ' + Math.ceil(uncompressed / 1024 / 1024) + ' MB');
        console.log('memfile bytes, compressed:   ' + Math.ceil(compressed / 1024 / 1024) + ' MB');
        cb();
      }
    );
  });
};

function readDir(dir, cb) {
  fs.readdir(dir, function(err, filenames) {
    if (err) return cb(err);
    var pathnames = filenames.map(function(filename) {
      return dir + '/' + filename;
    });
    async.forEach(pathnames, readFile, function(err) {
      if (err) cb(err);   //
      else cb();          // I think it's OK to just call cb(err) because cb(undefined) is OK
    });
  });
}

function readFile(pathname, cb) {
  if (pathname.indexOf('.DS_Store') !== -1) return cb();
  fs.stat(pathname, function(err, stats) {
    if (err) return cb(err);
    var type;
    if (stats.isFile()) {
      type = getType(pathname);
      if (type === undefined) {
        return cb(new Error('file with unknown mime type: ' + pathname));
      }
      fs.readFile(pathname, function (err, data) {
        if (err) return cb(err);
        cache[pathname] = {
          type: type,
          data: data
        };
        cb();
      });
    } else if (stats.isDirectory()) {
      readDir(pathname, function(err) {
        if (err) cb(err);
        else cb();
      });
    } else {
      cb(new Error(pathname + ' is not a file and not a directory.'));
    }
  });
}

/* use binary search

Array.prototype.binarySearch = function(find) {
  var low = 0, high = this.length - 1,
      i, comparison;
  while (low <= high) {
    i = Math.floor((low + high) / 2);
    if (this[i] < find) { low = i + 1; continue; };
    if (this[i] > find) { high = i - 1; continue; };
    return i;
  }
  return null;
};
*/
