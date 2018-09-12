let gulp = require('gulp');
let sass = require('gulp-sass');
let del = require('del');
let sourcemaps = require('gulp-sourcemaps');
let sassGlob = require('gulp-sass-glob');
let awspublish = require('gulp-awspublish');
let deployconfig = require('./.deployconfig');
let gulpFilter = require('gulp-filter');
let gulpUseref = require('gulp-useref');
let gulpUtil = require('gulp-util');
let gulpIf = require('gulp-if');
let gulpUglify = require('gulp-uglify-es').default;
let gulpRev = require('gulp-rev');
let gulpRevRewrite = require('gulp-rev-rewrite');
let gulpCssnano = require('gulp-cssnano');


let files = {
    scss: 'scss/**/*.scss'
};

let directories = {
    base: '',
    scss: 'scss/'
};

gulp.task('clean', function(){
    return del('dist/**');
});

gulp.task('sassify', function () {
    return gulp.src(files.scss)
               .pipe(sassGlob())
               .pipe(sourcemaps.init())
               .pipe(sass().on('error', sass.logError))
               .pipe(sourcemaps.write(directories.scss))
               .pipe(gulp.dest(directories.base));
});

gulp.task('minify', ['clean', 'sassify'], function(){
    let htmlFilter = gulpFilter(['**/*', '!index.html'], {restore: true});

    return gulp.src('index.html')
               .pipe(gulpUseref())
               .pipe(gulpIf('*.js', gulpUglify())).on('error', function (err) { gulpUtil.log(gulpUtil.colors.red('[Error]'), err.toString()); })
               .pipe(htmlFilter)
               .pipe(gulpRev())
               .pipe(htmlFilter.restore)
               .pipe(gulpRevRewrite())
               .pipe(gulpIf('*.css', gulpCssnano({zindex: false})))
               .pipe(gulp.dest('dist'))
});

gulp.task('build', ['minify'], function(){
    return gulp.src([
        ''
    ]);
});

gulp.task('deploy', function(){
    let publisher = awspublish.create(deployconfig);

    gulp.src([
        'app/**/*',
        'index.html',
        'style.css'
    ])
});

gulp.task('serve', ['sassify'], function () {
    gulp.watch(files.scss, ['sassify']);
});

gulp.task('default', ['serve']);
