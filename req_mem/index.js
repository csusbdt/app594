exports.handle = function(req, res) {
  var usage = process.memoryUsage(),
      page = '<p>Heroku limit = 512 MB</p>' + 
             '<p>rss = '       + Math.ceil(usage.rss       / 1024 / 1024) + ' MB</p>' +  
             '<p>heapTotal = ' + Math.ceil(usage.heapTotal / 1024 / 1024) + ' MB</p>' +
             '<p>heapUsed = '  + Math.ceil(usage.heapUsed  / 1024 / 1024) + ' MB</p>';
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Content-Length': page.length,
    'Cache-Control': 'no-cache, no-store'
  });
  res.end(page);
}
