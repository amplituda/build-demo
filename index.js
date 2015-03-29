'use strict';

var fs = require('fs');
var path = require('path');

var _ = require('lodash');
var gutil = require('gulp-util');
var through = require('through2');
var opn = require('opn');
var connect = require('gulp-connect');
var resolve = require('resolve');

var PluginError = gutil.PluginError;
var mainModule = path.dirname(module.parent.filename);

var tasks = {};

var rPath = function realPath(path){
  return mainModule + '/' + path;
};

tasks.connect = connect;

tasks.server = function(){
  return function server(){
    connect.server({
      root: [ rPath(''), rPath('build'), rPath('node_modules') ],
      port: 8000,
      livereload: true
    });
    opn('http://localhost:8000/example.html');
  };
};

tasks.wrapHtml = function(options){
  options = options || {};
  var template = _.template(fs.readFileSync(__dirname + '/index.html'));
  var stream = through.obj(function(file, enc, cb) {
    if (file.isBuffer()) {
      var html = file.contents.toString('utf8');
      var title = 'Demo of: ' + options.title || 'VCL Demo Page';
      if (options.styles && options.styles.indexOf('index.css') === -1) {
        options.styles.push('index.css');
      }
      var result = template({
        content: html,
        styles: options.styles || ['index.css'],
        title: title
      });
      file.contents = new Buffer(result);
    }

    if (file.isStream()) {
      var err = new PluginError('vcl-build-demo', 'Streams are not supported!');
      this.emit('error', err);
    }

    this.push(file);
    return cb();
  });

  // returning the file stream
  return stream;
};

tasks.filterStylesSync = function filterStylesModules(imports){
  if (_.isArray(imports) === false && _.isObject(imports)){
    // probably from package.json
    imports = _.keys(imports);
  }

  // Some style packages don't have a main field (in the package.json)
  var packageFilter = function pkgFilter(pack){
    pack.main = pack.main || pack.style;   // But they should have a style field
    return pack;
  };

  return _.filter(imports, function(name){
    if (_.isString(name) === false) return false;
    if (name[0] === '.' || name[0] === '/'){
      // relative path, i guess...
      return true;
    }

    // check for node module
    try{
      var npmPackage = resolve.sync(name, {
         basedir: mainModule,
         packageFilter: packageFilter // set main field if not set
      });
      var jsonLocation = path.dirname(npmPackage) + '/package.json';
      var json = require(jsonLocation);
      if (json.style === undefined) return false;
      else return true;
    } catch (err) {
      gutil.log('[filterStylesSync] require error: ' + err.message);
      return false;
    }

  });
};

tasks.preprocess = function preprocess(options){
  options = options || {};

  if (!_.isArray(options.injectImports) && _.isObject(options.injectImports)){
    // probably from package.json but not filtered
    options.injectImports = _.keys(options.injectImports);
  }

  var vcl = require('vcl-preprocessor');
  // TODO: use gulp *streams*
  // creating a stream through which each file will pass
  var stream = through.obj(function(file, enc, cb) {
    if (file.isBuffer()) {
      var css = file.contents.toString('utf8');
      var imports = "";
      options.injectImports.forEach(function(importName){
        imports += '@import "'+ importName +'"\n';
      });

      try{
        var result = vcl(imports + css, { source: file.path });
        file.contents = new Buffer(result.toString());
      } catch (err){
        this.emit("error", new PluginError('vcl-build.demo', err));
      }
      file.path = path.basename(file.path, 'styl') + 'css';
    }

    if (file.isStream()) {
      var err = new PluginError('vcl-build-demo', 'Streams are not supported!');
      this.emit('error', err);
    }

    this.push(file);
    return cb();
  });

  // returning the file stream
  return stream;
};

module.exports = tasks;
