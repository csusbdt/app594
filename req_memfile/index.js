var fs = require('fs');
var async = require('async');
var zlib = require('zlib');

// This code returns "not found" when '..' appears in the url.

var cache = {},
    extmap = {
      'png'  : { type: 'image/png',              gzip: true },
      'js'   : { type: 'application/javascript', gzip: true },
      'css'  : { type: 'text/css',               gzip: true },
      'ico'  : { type: 'image/x-icon',           gzip: true },
      'html' : { type: 'text/html',              gzip: true },
      'ogg'  : { type: 'audio/ogg',              gzip: false },
      'mp3'  : { type: 'audio/mp3',              gzip: false }
    };

function getExt(filename) {
  var i = filename.lastIndexOf('.');
  if (i === -1) return undefined;
  return extmap[filename.substr(i + 1)];
}

exports.init = function(cb) {
  readDir('public', function(err) {
    if (err) return cb(err);
    // Calculate and display memory consumption.
    var filename, uncompressed = 0, compressed = 0;
    for (filename in cache) {
      uncompressed += cache[filename].data.length;
      if (cache[filename].gzip !== undefined) compressed += cache[filename].gzip.length;
    }
    console.log('memfile bytes, uncompressed: ' + Math.ceil(uncompressed / 1024 / 1024) + ' MB');
    console.log('memfile bytes, compressed:   ' + Math.ceil(compressed / 1024 / 1024) + ' MB');
    return cb();
  });
};

// Read raw files into memory buffers.
function readDir(dir, cb) {
  fs.readdir(dir, function(err, filenames) {
    if (err) return cb(err);
    var pathnames = filenames.map(function(filename) {
      return dir + '/' + filename;
    });
    async.forEach(pathnames, readFile, function(err) {
      if (err) cb(err);   // TODO(turner) investigate the following
      else cb();          // I think it's OK to just call cb(err) because cb(undefined) is OK
    });
  });
}

function readFile(pathname, cb) {
  if (pathname.indexOf('.DS_Store') !== -1) return cb();
  fs.stat(pathname, function(err, stats) {
    if (stats.isDirectory()) {
      readDir(pathname, function(err) {
        if (err) return cb(err);
        else return cb();
      });
    }
    else if (stats.isFile()) {
      readFile2(pathname, function(err) {
        if (err) return cb(err);
        else return cb();
      });
    } else {
      return cb(new Error(pathname + ' is not a file and not a directory.'));
    }
  });
}

function readFile2(pathname, cb) {
  var ext = getExt(pathname);
  if (ext === undefined) {
    return cb(new Error('file with unknown extension: ' + pathname));
  }
  fs.readFile(pathname, function (err, data) {
    if (err) return cb(err);
    cache[pathname.substr(6)] = {
      type: getExt(pathname),
      data: data
    };
    readFile3(pathname, function(err) {
      if (err) return cb(err);
      return cb();
    });
  });
}

function readFile3(pathname, cb) {
  if (getExt(pathname).gzip === false) return cb();
  zlib.gzip(cache[pathname.substr(6)].data, function(err, result) {
    if (err) return cb(err);
    cache[pathname.substr(6)].gzip = result;
    return cb();
  });
}

exports.handle = function(req, res) {
  var file = cache[req.url];
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
