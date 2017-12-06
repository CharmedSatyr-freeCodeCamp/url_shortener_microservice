var gulp = require('gulp');
var concat = require('gulp-concat');
var autoprefixer = require('gulp-autoprefixer');
var cleanCSS = require('gulp-clean-css');

//Combine, autoprefix, clean, and minimize Bootstrap + app CSS
gulp.task('style', function() {
  return gulp
    .src('views/style/*.css')
    .pipe(concat('style.min.css'))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(gulp.dest('views/style/'));
});

//All tasks
gulp.task('tasks', ['style']);
