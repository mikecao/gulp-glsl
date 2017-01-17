'use strict';

var path = require('path');
var through = require('through2');
var glslman = require('glsl-man');
var gutil = require('gulp-util');
var assign = require('object-assign');
var File = gutil.File;
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-glsl';

var defaults = {
    format: 'module',
    filename: 'glsl.js',
    ext: '.js',
    es6: false
};

var formats = [
    'module',
    'string',
    'raw',
    'object',
    'json'
];

function compile(code) {
    return glslman.string(
        glslman.parse(code),
        {tab: '', space: '', newline: ''}
    );
}

function wrapModule(str, es6) {
    return (es6) ?
        'export default ' + str + ';' :
        'module.exports=' + str + ';';
}

module.exports = function(options) {
    var shaders = {};

    options = assign({}, defaults, options);

    var transform = function(file, encoding, callback) {
        // Check file
        if (file.isNull()) {
            return callback(null, file);
        }

        // Streams not supported
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported.'));
            return;
        }

        // Check for valid format
        if (formats.indexOf(options.format) === -1) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Invalid format specified.'));
            return;
        }

        // Minify file contents
        try {
            var code = compile(file.contents.toString());
        }
        catch (err) {
            this.emit('error', new PluginError(PLUGIN_NAME, file.relative + ': ' + err));
            return;
        }

        // If object or json, we want to buffer the contents
        if (options.format === 'object' || options.format === 'json') {
            var dirname = path.dirname(file.relative),
                name = path.basename(file.relative, path.extname(file.relative));

            if (dirname === '.') {
                shaders[name] = code;
            }
            else {
                if (!shaders[dirname]) shaders[dirname] = {};
                shaders[dirname][name] = code;
            }

            callback();
        }
        // Otherwise return immediately
        else {
            switch (options.format) {
                case 'module':
                    file.contents = new Buffer(wrapModule(JSON.stringify(code), options.es6));
                    break;
                case 'string':
                    file.contents = new Buffer(JSON.stringify(code));
                    break;
                case 'raw':
                    file.contents = new Buffer(code);
                    break;
            }

            file.path = file.path.replace(path.extname(file.relative), options.ext);

            callback(null, file);
        }
    };

    var flush = function(callback) {
        if (options.format !== 'object' && options.format !== 'json') {
            callback();
            return;
        }

        var code = JSON.stringify(shaders);

        if (options.format === 'object') {
            code = wrapModule(code, options.es6);
        }

        var file = new File({
            path: options.filename,
            contents: new Buffer(code)
        });

        this.push(file);

        callback();
    };

    return through.obj(transform, flush);
};
