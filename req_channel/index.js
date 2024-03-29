var channelDoc = new Buffer('<script src="//connect.facebook.net/en_US/all.js"></script>').toString('utf-8');

exports.handle = function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': channelDoc.length,
    'Pragma': 'public',
    'Cache-Control': 'max-age=31536000',
    'Expires': new Date(Date.now() + 31536000000).toUTCString()
  });
  res.end(channelDoc);
}
