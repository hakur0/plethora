var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var sassGlob = require('gulp-sass-glob');

var files = {
    scss: 'scss/**/*.scss'
};

var directories = {
    base: '',
    scss: 'scss/'
};

gulp.task('default', ['serve']);

gulp.task('serve', ['sassify'], function () {
    gulp.watch(files.scss, ['sassify']);
});

gulp.task('build', ['sassify']);

gulp.task('sassify', function () {
    return gulp.src(files.scss)
               .pipe(sassGlob())
               .pipe(sourcemaps.init())
               .pipe(sass().on('error', sass.logError))
               .pipe(sourcemaps.write(directories.scss))
               .pipe(gulp.dest(directories.base));
});

