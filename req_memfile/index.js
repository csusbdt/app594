var fs = require('fs');
var async = require('async');
var zlib = require('zlib');

// This code returns "not found" when '..' appears in the url.

var files = [],
    extmap = {
      'png'  : { type: 'image/png',              gzip: true },
      'js'   : { type: 'application/javascript', gzip: true },
      'css'  : { type: 'text/css',               gzip: true },
      'ico'  : { type: 'image/x-icon',           gzip: true },
      'html' : { type: 'text/html',              gzip: true },
      'ogg'  : { type: 'audio/ogg',              gzip: false },
      'mp3'  : { type: 'audio/mp3',              gzip: false }
    };

// insert file into files array
// throw exception if file already in array
function insert(file) {
  // keep files ordered by name so we can use binary search
  files.push(null);
  var i = file.length - 1;
  for (; i > 0; --i) {
    if (files[i - 1].name > file.name) files[i] = files[i - 1];
    else if (files[i - 1].name === file.name) throw new Error('req_memfile.insert: duplicate insertion');
  }
  files[i] = file;
}

// return file or throw exception
function find(filename) {
  // locate file using binary search
  var s = 0, 
      e = files.length - 1,
      m;
  while (s <= e) {
    m = Math.floor((s + e) / 2);
    if (files[m].name < filename) s = m + 1;
    else if (files[m].name > filename) e = m - 1;
    else return files[m];
  }
  throw new Error('req_memfile.insert: file not found');
}

function getExt(filename) {
  var i = filename.lastIndexOf('.');
  if (i === -1) return undefined;
  return extmap[filename.substr(i + 1)];
}

exports.init = function(cb) {
  readDir('public', function(err) {
    if (err) return cb(err);
    // Calculate and display memory consumption.
    var i, uncompressed = 0, compressed = 0;
    for (; i < files.length; ++i) {
      uncompressed += files[i].data.length;
      if (files[i].gzip !== undefined) compressed += files[i].gzip.length;
    }
    console.log('memfile bytes, uncompressed: ' + Math.ceil(uncompressed / 1024 / 1024) + ' MB');
    console.log('memfile bytes, compressed:   ' + Math.ceil(compressed / 1024 / 1024) + ' MB');
    return cb();
  });
};

// Store contents of files in dir in the files array.
function readDir(dir, cb) {
  fs.readdir(dir, function(err, filenames) {
    if (err) return cb(err);
    var filenames2 = filenames.map(function(filename) {
      return dir + '/' + filename;
    });
    async.forEach(filenames2, readFile, function(err) {
      if (err) cb(err);   // TODO(turner) investigate the following
      else cb();          // I think it's OK to just call cb(err) because cb(undefined) is OK
    });
  });
}

function readFile(filename, cb) {
  if (filename.indexOf('.DS_Store') !== -1) return cb();
  fs.stat(filename, function(err, stats) {
    if (stats.isDirectory()) {
      readDir(filename, function(err) {
        if (err) return cb(err);
        else return cb();
      });
    }
    else if (stats.isFile()) {
      readFile2(filename, function(err) {
        if (err) return cb(err);
        else return cb();
      });
    } else {
      return cb(new Error(filename + ' is not a file and not a directory.'));
    }
  });
}

function readFile2(filename, cb) {
  var ext = getExt(filename);
  if (ext === undefined) {
    return cb(new Error('file with unknown extension: ' + filename));
  }
  fs.readFile(filename, function (err, data) {
    if (err) return cb(err);
    var file = {
      name: filename.substr(6),
      type: getExt(filename),
      data: data
    };
    insert(file);
    if (ext.gzip === false) return cb();
    zlib.gzip(file.data, function(err, result) {
      if (err) return cb(err);
      file.gzip = result;
      return cb();
    });
  });
}

exports.handle = function(req, res) {
  var file = find[req.url];
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
