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
    ext: '.js'
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

module.exports = function(options) {
    var shaders = {};

    options = assign({}, defaults, options);

    var wrapModule = function(s) {
        return 'module.exports=' + s + ';';
    };

    var transform = function(file, encoding, callback) {
        if (file.isNull()) {
            return callback(null, file);
        }

        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported.'));
            return;
        }

        if (formats.indexOf(options.format) === -1) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Invalid format specified.'));
            return;
        }

        try {
            var code = compile(file.contents.toString());
        }
        catch (err) {
            this.emit('error', new PluginError(PLUGIN_NAME, file.relative + ': ' + err));
            return;
        }

        if (options.format !== 'object' && options.format !== 'json') {
            switch (options.format) {
                case 'module':
                    file.contents = new Buffer(wrapModule(JSON.stringify(code)));
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
        else {
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
    };

    var flush = function(callback) {
        if (options.format !== 'object' && options.format !== 'json') {
            callback();
            return;
        }

        var code = JSON.stringify(shaders);

        if (options.format === 'object') {
            code = wrapModule(code);
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
