var gulp = require('gulp');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');

//Move fonts from Bootstrap to views
gulp.task('copyFonts', function() {
  return gulp
    .src('./node_modules/bootstrap/dist/fonts/*.{eot,ttf,svg,woff,woff2}')
    .pipe(gulp.dest('views/style/fonts'));
});

//Combine, autoprefix, clean, and minimize Bootstrap + app CSS
gulp.task('style', function() {
  return gulp
    .src(['node_modules/bootstrap/dist/css/bootstrap.min.css', 'views/style/style.css'])
    .pipe(concat('style.min.css'))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(gulp.dest('views/style/'));
});

// Build styles
gulp.task('build', ['copyFonts', 'style']);

// Watch css changes in style folder
gulp.task('watch', ['style'], function() {
  gulp.watch('views/style/style.css', ['style']);
});
