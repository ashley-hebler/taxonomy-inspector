var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var jshint = require('gulp-jshint');

//svg
var svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    path = require('path'),
    cheerio = require('gulp-cheerio'),
    rename = require('gulp-rename');

var browserSync = require('browser-sync').create();

// Static server
gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });
});



gulp.task('svgstore', function() {
    return gulp
        .src('./img/svg/**/*.svg')
        .pipe(rename({
            prefix: 'icon-'
        }))
        .pipe(svgmin(function(file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: 'icon-' + prefix + '-',
                        minify: true
                    }
                }]
            }
        }))
        .pipe(cheerio({
            run: function($) {
                $('[fill]').removeAttr('fill');
            },
            parserOptions: {
                xmlMode: true
            }
        }))

    .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(cheerio(function($) {
            $('svg').attr('style', 'display:none');
        }))
        .pipe(gulp.dest('img/'));
});
// Compile sass into CSS & auto-inject into browsers
gulp.task('sass', function() {
    return gulp.src('./scss/**/*.scss')
        .pipe(sass({ outputStyle: 'compact' }).on('error', sass.logError))
        .pipe(gulp.dest('./css'))
        .pipe(browserSync.stream());
});
// JS Lint
gulp.task('lint', function() {
  return gulp.src('./js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});
// Default task
gulp.task('default', ['watch']);

gulp.task('watch', ['sass', 'svgstore', 'lint', 'browser-sync'], function () {
    gulp.watch("./scss/**/*.scss", ['sass']);
    gulp.watch("./js/**/*.js", ['lint']).on('change', browserSync.reload);
    gulp.watch("./css/**/*.css").on('change', browserSync.reload)
});

