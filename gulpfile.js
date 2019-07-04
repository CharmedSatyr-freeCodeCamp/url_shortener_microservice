const autoprefixer = require('gulp-autoprefixer');
const bs = require('browser-sync').create();
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const gulp = require('gulp');

// Combine, autoprefix, clean, and minimize Bootstrap + app CSS
gulp.task('style', () => {
  return gulp
    .src(['node_modules/bootstrap/dist/css/bootstrap.min.css', 'views/style/style.css'])
    .pipe(concat('style.min.css'))
    .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(gulp.dest('views/style/'))
    .pipe(bs.stream());
});

// Build styles
gulp.task('build', gulp.series('style'));

// Reload on index.html and style.css changes
gulp.task('watch', () => {
  bs.init();
  gulp.watch('views/style/style.css', gulp.series('style'));
  gulp.watch(['views/index.html', 'views/style/style.css']).on('change', bs.reload);
});
