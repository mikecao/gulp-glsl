# gulp-glsl
Gulp plugin that converts GLSL code into minified strings.

# Installation

```
npm install gulp-glsl
```

# Usage

```
const gulp = require('gulp');
const glsl = require('gulp-glsl');

gulp.src('shaders/**/*.glsl')
  .pipe(glsl())
  .pipe(gulp.dest('build'));
```

# Options

`format` - Output format (default: 'module')

If you pass in `module` the output will be a CommonJS module:

```
module.exports = "(GLSL code)";
```

If you pass in `string` the output will be a JSON encoded string:

```
"(GLSL code)"
```

If you pass in `raw` the output will be a raw string:

```
(GLSL code)
```

If you pass in `object` the output will be a single JSON object containing
the code for all passed in files:

```
module.exports = { "file1": "(GLSL code)", "file2": "(GLSL code)" };
```

If the files are in subfolders, the JSON object will be nested with the folder names:

```
module.exports = {
  "folder1": { file1": "(GLSL code)" },
  "folder2": { file2": "(GLSL code)" }
};
```

`filename` - Filename for output object file. (default: 'glsl.js')

You can specify your own name by using the `filename` option. This only applies when 
the format is `object`:

```
glsl({ format: 'object', filename: 'custom.js' })
```

`ext` - Extension to give output files. (default: '.js')

This only applies when the format is not `object`:

```
glsl({ format: 'raw', ext: '.txt' })
```

# License

MIT License