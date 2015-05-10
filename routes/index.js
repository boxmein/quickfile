var express = require('express');
var crypto  = require('crypto');
var multer  = require('multer');
var debug   = require('debug')('uploader');
var path    = require('path');
var util    = require('util');
var fs      = require('fs');

var errors = require('../errors.json');
var config = require('../config.json');

var router = express.Router();

function genName() {
  return crypto.randomBytes(20).toString('hex');
}

// Super-Error: fits all, inherits Error!
function SError(props) {
  SError.super_.call(this);

  for (var k in props) {
    this[k] = props[k];
  }
}
util.inherits(SError, Error);

function deletify(metaName) {
  return function() {
    var metafile = path.join(__dirname, '..', 'uploads', metaName);
    debug('deleting file:', metafile);

    fs.readFile(metafile, function(err, data) {
      if (err) {
        debug('error reading metadata file:', err);
        return;
      }

      try {
        var metadata = JSON.parse(metadata);
        if (metadata.file && metadata.file.name) {
          fs.unlink(path.join(__dirname, '..', 'uploads', metadata.file.name), function(err) {
            if (err) {
              debug('error deleting described file', err);
              return;
            }
            fs.unlink(metafile, function(err) {
              if (err) {
                debug('error deleting metadata file', err);
              }
              else {
                debug('successfully deleted described file and metadata file');
              }
            });
          });
        }
        else {
          throw new Error('missing "file" property with sub-property "name"!');
        }
      } catch (err) {
        debug('error reading metadata: ' + err);
      }
    });
    return true;
  };
}

var sendFileOptions = {
  dotfiles: 'deny',
  root: __dirname + '/../uploads/',
  headers: {
    'X-Timestamp': Date.now(),
    'X-Sent': true
  }
};

router.use(multer({
  dest: __dirname + '/../uploads/',
  limits: {
    fieldNameSize: 100,
    fields: 10,
    fileSize: 1 * 1024 * 1024,
    files: 1
  }
}));


router.post('/upload/', function(req, res) {
  for (var k in req.files) {
    var f = req.files[k];
    debug('received file', f);

    f.metaName = genName();

    // generate metadata for file

    var metadata = {
      file: {
        metaName: f.metaName,
        name: f.name,
        originalName: f.originalname,
        mimetype: f.mimetype,
        encoding: f.encoding,
        size: f.size,
        truncated: f.truncated,
        date: Date.now()
      },
      uploader: {
        ip: req.ip,
        xhr: req.xhr,
        userAgent: req.get('User-Agent')
      }
    };

    // store metadata

    fs.writeFile(path.join(__dirname, '..', 'uploads', f.metaName + '.json'),
                 JSON.stringify(metadata), function(err) {
      if (err) {
        debug('error storing metadata: ' + err);
        return next(new SError({
          message: 'Server Error',
          status: 500,
          details: 'Error storing metadata for your file.'
        }));
      }

      debug('successfully stored metadata, starting countdown from 10min...');
      setTimeout(deletify(f.metaName), (config.delete_timeout || 600) * 1000);
      if (res.xhr) {
        res.status(200).send({ url: '/file/' + f.metaName, meta: f.metaName, date: metadata.file.date });
      } else {
        res.render('url', { meta: f.metaName, date: metadata.file.date });
      }
    });

    break;
  }

});

router.get('/file/:meta', function(req, res) {
  var metaName = req.params['meta'].replace(/\\\//g, '');
  debug('opening file', metaName);

  fs.readFile(path.join(__dirname, '..', 'uploads', metaName + '.json'),
    function(err, data) {

    if (err) {
      debug('error getting metadata: ', err);
      res.status(404);

      return next(new SError({
        status: 404,
        err: errors.NOT_FOUND,
        message: 'Not Found',
        details: 'Error retrieving metadata for the file ' + metaName,
        stack: err.stack
      }));
    }

    try {
      var metadata = JSON.parse(data);
      if (metadata.file && metadata.file.name) {
        res.sendFile(metadata.file.name, sendFileOptions, function(err, data) {
          if (err) {
            debug('error getting file from metadata:', err);

            return next(new SError({
              status: 500,
              message: 'Internal Error',
              err: errors.INTERNAL,
              details: 'Error retrieving file from metadata: ' + err.message,
              stack: err.stack
            }));

          }
          debug('properly sent the file ' + metadata.file.name);
        });
      }
    } catch (err) {
      debug('malformed metadata json:', err);

      return next(new SError({
        status: 500,
        message: 'Internal Error',
        err: errors.INTERNAL,
        details: 'JSON error while retrieving file from metadata: ' + err.message,
        stack: err.stack
      }));
    }
  });
});

module.exports = router;
