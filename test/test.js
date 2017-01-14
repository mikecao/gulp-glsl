'use strict';

var plugin = require('../index');
var assert = require('assert');
var PassThrough = require('stream').PassThrough;
var File = require('gulp-util').File;

var vertexShader = [
    "#define GLSL 1\n",
    "void main() {",
    "  gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;",
    "}"
].join("\n");

var vertextShaderMinified = [
    "#define GLSL 1\n",
    "void main(){",
    "gl_Position=gl_ModelViewProjectionMatrix*gl_Vertex;",
    "}"
].join("");

var fragmentShader = [
    "void main() {",
    "  // Comment",
    "  gl_FragColor = vec4(0.4, 0.4, 0.8, 1.0);",
    "}"
].join("\n");

var fragmentShaderMinified = [
    "void main(){",
    "gl_FragColor=vec4(0.4,0.4,0.8,1.0);",
    "}"
].join("");

function wrapModule(s) {
    return 'module.exports=' + s + ';';
}

describe('gulp-glsl', function() {
    it('should convert GLSL into a CommonJS module', function(done) {
        var stream = plugin();

        var testFile = new File({
            path: 'vertex.glsl',
            contents: new Buffer(vertexShader)
        });

        var expected = new Buffer(
            wrapModule(JSON.stringify(vertextShaderMinified))
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

        var expected = new Buffer(JSON.stringify(vertextShaderMinified));

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

        var expected = new Buffer(vertextShaderMinified);

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
                vertex: vertextShaderMinified,
                fragment: fragmentShaderMinified
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
                vertex: vertextShaderMinified,
                fragment: fragmentShaderMinified
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
                vertex: vertextShaderMinified
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

        var expected = new Buffer(vertextShaderMinified);

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
                    vertex: vertextShaderMinified,
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