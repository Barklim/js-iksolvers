/**
 * Created by ld on 10/6/15.
 */
var gulp = require('gulp');
var webserver = require('gulp-webserver');
var clean = require('gulp-clean');
var rsync = require('gulp-rsync');
var gulpSequence = require('gulp-sequence');

var path = {
    src: [
        './*.{js,cpp,py}',
    ],
    solvers: [
        './solvers/**/*',
    ],
    robots: [
        './robots/**/*',
    ],
    public: [
        './public/**/*',
    ]
};

gulp.task('webserver', function () {
    return gulp.src('.')
        .pipe(webserver({
            host: '0.0.0.0',
            //livereload: true,
            directoryListing: true,
            path: '.'
        }));
});

gulp.task('clean', function () {
    return gulp.src('./solvers/*.{js,mem,html,map}')
        .pipe(clean());
});

gulp.task('build', gulpSequence('clean', ['nojekyll', 'js', 'style', 'site', 'images', 'node_modules']));

//gulp.task('watch', ['build'], function () {
//    gulp.watch(path.site, ['site']);
//    gulp.watch(path.js, ['js']);
//    gulp.watch(path.style, ['style']);
//    gulp.watch(path.images, ['images']);
//    gulp.watch(path.node_modules, ['node_modules']);
//});

gulp.task('rsync', function () {
    return gulp.src('.')
        .pipe(rsync({
            root: '.',
            username: 'ld',
            hostname: '192.168.1.6',
            //clean: true,
            exclude: ['.git'],
            recursive: true,
            destination: '/home/ld/js-iksolvers'
        }));
});

gulp.task('deploy', ['rsync']);