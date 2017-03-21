'use strict';

var fs = require('fs');
var path = require('path');
var plugin = require('../index');
var assert = require('assert');
var PassThrough = require('stream').PassThrough;
var File = require('gulp-util').File;

var vertexShader = fs.readFileSync(path.join(__dirname, 'shaders/vertex.glsl'), 'utf8');
var vertexShaderMinified = fs.readFileSync(path.join(__dirname, 'shaders/vertex.min.glsl'), 'utf8');
var fragmentShader = fs.readFileSync(path.join(__dirname, 'shaders/fragment.glsl'), 'utf8');
var fragmentShaderMinified = fs.readFileSync(path.join(__dirname, 'shaders/fragment.min.glsl'), 'utf8');

function wrapModule(str, es6) {
    return (es6) ?
        'export default ' + str + ';' :
        'module.exports=' + str + ';';
}

describe('gulp-glsl', function() {
    it('should convert GLSL into a CommonJS module', function(done) {
        var stream = plugin();

        var testFile = new File({
            path: 'vertex.glsl',
            contents: new Buffer(vertexShader)
        });

        var expected = new Buffer(
            wrapModule(JSON.stringify(vertexShaderMinified))
        );

        stream.on('data', function(file) {
            assert.equal(file.contents.equals(expected), true);
            done();
        });

        stream.write(testFile);
        stream.end();
    });

    it('should convert GLSL into an ES6 module', function(done) {
        var stream = plugin({ es6: true });

        var testFile = new File({
            path: 'vertex.glsl',
            contents: new Buffer(vertexShader)
        });

        var expected = new Buffer(
            wrapModule(JSON.stringify(vertexShaderMinified), true)
        );

        stream.on('data', function(file) {
            assert.equal(file.contents.equals(expected), true);
            done();
        });

        stream.write(testFile);
        stream.end();
    });

    it('should convert GLSL into a JSON string', function(done) {
        var stream = plugin({ format: 'string' });

        var testFile = new File({
            path: 'vertex.glsl',
            contents: new Buffer(vertexShader)
        });

        var expected = new Buffer(JSON.stringify(vertexShaderMinified));

        stream.on('data', function(file) {
            assert.equal(file.contents.equals(expected), true);
            done();
        });

        stream.write(testFile);
        stream.end();
    });

    it('should convert GLSL into a raw string', function(done) {
        var stream = plugin({ format: 'raw' });

        var testFile = new File({
            path: 'vertex.glsl',
            contents: new Buffer(vertexShader)
        });

        var expected = new Buffer(vertexShaderMinified);

        stream.on('data', function(file) {
            assert.equal(file.contents.equals(expected), true);
            done();
        });

        stream.write(testFile);
        stream.end();
    });

    it('should convert GLSL into an object', function(done) {
        var stream = plugin({ format: 'object' });

        var testFile = new File({
            path: 'vertex.glsl',
            contents: new Buffer(vertexShader)
        });

        var testFile2 = new File({
            path: 'fragment.glsl',
            contents: new Buffer(fragmentShader)
        });

        var expected = new Buffer(
            wrapModule(JSON.stringify({
                fragment: fragmentShaderMinified,
                vertex: vertexShaderMinified
            }))
        );

        stream.on('data', function(file) {
            assert.equal(file.contents.equals(expected), true);
            done();
        });

        stream.write(testFile);
        stream.write(testFile2);
        stream.end();
    });

    it('should convert GLSL into a JSON object', function(done) {
        var stream = plugin({ format: 'json' });

        var testFile = new File({
            path: 'vertex.glsl',
            contents: new Buffer(vertexShader)
        });

        var testFile2 = new File({
            path: 'fragment.glsl',
            contents: new Buffer(fragmentShader)
        });

        var expected = new Buffer(
            JSON.stringify({
                fragment: fragmentShaderMinified,
                vertex: vertexShaderMinified
            })
        );

        stream.on('data', function(file) {
            assert.equal(file.contents.equals(expected), true);
            done();
        });

        stream.write(testFile);
        stream.write(testFile2);
        stream.end();
    });

    it('should error on streamed files', function(done) {
        var stream = plugin();

        stream.on('error', function(err) {
            assert.equal(err.message, 'Streams not supported.');
            done();
        });

        stream.write(new File({
            contents: new PassThrough()
        }));
        stream.end();
    });

    it('should error on invalid formats', function(done) {
        var stream = plugin({ format: 'invalid' });

        stream.on('error', function(err) {
            assert.equal(err.message, 'Invalid format specified.');
            done();
        });

        stream.write(new File({
            path: 'test.glsl',
            contents: new Buffer('abc')
        }));
        stream.end();
    });

    it('should use the given filename', function(done) {
        var stream = plugin({ format: 'object', filename: 'test.js' });

        var testFile = new File({
            path: 'vertex.glsl',
            contents: new Buffer(vertexShader)
        });

        var expected = new Buffer(
            wrapModule(JSON.stringify({
                vertex: vertexShaderMinified
            }))
        );

        stream.on('data', function(file) {
            assert.equal(file.path, 'test.js');
            assert.equal(file.contents.equals(expected), true);
            done();
        });

        stream.write(testFile);
        stream.end();
    });

    it('should use the given extension', function(done) {
        var stream = plugin({ format: 'raw', ext: '.txt' });

        var testFile = new File({
            path: 'vertex.glsl',
            contents: new Buffer(vertexShader)
        });

        var expected = new Buffer(vertexShaderMinified);

        stream.on('data', function(file) {
            assert.equal(file.path, 'vertex.txt');
            assert.equal(file.contents.equals(expected), true);
            done();
        });

        stream.write(testFile);
        stream.end();
    });

    it('should nest folders for object output', function(done) {
        var stream = plugin({ format: 'object' });

        var testFile = new File({
            base: '/dir/',
            path: '/dir/shaders/vertex.glsl',
            contents: new Buffer(vertexShader)
        });

        var testFile2 = new File({
            base: '/dir/',
            path: '/dir/shaders/fragment.glsl',
            contents: new Buffer(fragmentShader)
        });

        var expected = new Buffer(
            wrapModule(JSON.stringify({
                shaders: {
                    vertex: vertexShaderMinified,
                    fragment: fragmentShaderMinified
                }
            }))
        );

        stream.on('data', function(file) {
            assert.equal(file.contents.equals(expected), true);
            done();
        });

        stream.write(testFile);
        stream.write(testFile2);
        stream.end();
    });
});