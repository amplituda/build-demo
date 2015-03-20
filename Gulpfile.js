/* jshint node:true */
'use strict';
var gulp = require('gulp');
var tasks = require('vcl-build-demo');
var pack = require('./package.json');
var devStyles = tasks.filterStylesSync(pack.devDependencies);

gulp.task('css', function(){
  gulp.src('./index.styl')
    .pipe(tasks.preprocess({ injectImports: devStyles }))
    .pipe(tasks.connect.reload())
    .pipe(gulp.dest('./build'));
});

gulp.task('server', ['css', 'html'], tasks.server());

gulp.task('html', function(){
  gulp.src('demo/*.html')
    .pipe(tasks.wrapHtml({title: pack.name}))
    .pipe(tasks.connect.reload())
    .pipe(gulp.dest('build'));
});

gulp.task('watch', function() {
  gulp.watch('./index.styl', ['css']);
  gulp.watch('./demo/*.html', ['html']);
});

gulp.task('dev', ['server', 'watch']);
