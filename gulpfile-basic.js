/// <binding />
'use strict';

//Gulp related plugins
var chalk = require('chalk'),
    concat = require('gulp-concat'),
    del = require('del'),
    es = require('event-stream'),
    filter = require('gulp-filter'),
    gulp = require('gulp'),
    gulpif = require('gulp-if'),
    logger = require('gulp-logger'),
    rename = require('gulp-rename'),

    //Css specific plugins
    autoprefixer = require('autoprefixer'),
    cssmin = require('gulp-cssmin'),
    postcss = require('gulp-postcss'),
    sass = require('gulp-sass'),

    //Js specific plugins
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify');

//Path variables
var cssSource = 'app/sass',
    cssDist = 'dist/css',
    jsSource = 'app/js',
    jsDist = 'dist/js';





// -------------------- Clean files/folders ------------------------\\

var cleanAll = function (cb) {
    del.sync(['./' + cssDist + '/**/*', './' + jsDist + '/**/*']);
    console.log(chalk.cyan('Cleaned up dist folders'));
    if (typeof cb === 'function')
        cb();
}

var cleanCss = function (cb) {
    del.sync(['./' + cssDist + '/**/*']);
    console.log(chalk.cyan('Cleaned up css folder'));
    if (typeof cb === 'function')
        cb();
}

var cleanJs = function (cb) {
    del.sync(['./' + jsDist + '/**/*']);
    console.log(chalk.cyan('Cleaned up js folder'));
    if (typeof cb === 'function')
        cb();
}

// -------------------- Processing ------------------------\\

var processCss = function (isOptimized) {
    //Some views use single css files so build unbundled files.
    const allCssFiles = cssSource + '/**/*.scss';

    const iosBundle = [
        cssSource + '/a.scss',
        cssSource + '/b.scss',
        cssSource + '/c.scss',
        cssSource + '/d.scss'
    ];
    const androidBundle = [
        cssSource + '/a.scss',
        cssSource + '/b.scss',
        cssSource + '/c.scss',
        cssSource + '/d.scss'
    ];
    const mobileWebBundle = [
        cssSource + '/a.scss',
        cssSource + '/b.scss',
        cssSource + '/c.scss'
    ];

    //This will build out bundled CSS files for each Area
    return es.merge([
        processCssFiles(isOptimized, allCssFiles, false),
        processCssFiles(isOptimized, iosBundle, true, 'ios.css'),
        processCssFiles(isOptimized, androidBundle, true, 'android.css'),
        processCssFiles(isOptimized, mobileWebBundle, true, 'mobileweb.css')
    ]);
};

var processJs = function (isOptimized) {
    return gulp.src(jsSource + '/**/*.js')
        .pipe(logger({
            before: 'Starting to process js files...',
            after: 'Done processing js files!',
            showChange: true
        }))
        .pipe(gulpif(isOptimized,
            sourcemaps.init()
        ))
        .pipe(gulp.dest(jsDist)) //output app.js
        .pipe(gulpif(isOptimized,
            uglify()
        ))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulpif(isOptimized,
            sourcemaps.write('')
        ))
        .pipe(gulp.dest(jsDist)); //output app.min.js
};

var processCssFiles = function (isOptimized, sourceFiles, createBundle, bundleName) {
    return gulp.src(sourceFiles)
        .pipe(logger({
            before: 'Starting to process sass files...',
            after: 'Done processing sass files!',
            showChange: true
        }))
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([
            autoprefixer({ browsers: ['last 20 versions'] })
        ]))
        .pipe(gulpif(createBundle,
            concat(bundleName || 'ignore')
        ))
        .pipe(gulp.dest(cssDist)) //output app.css
        .pipe(gulpif(isOptimized,
            cssmin()
        ))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(cssDist)); //output app.min.css
};


//-----------------------Tasks-----------------------\\

/**
 * Watches for any changes, processes, and automatically updates the dist folder on save.
 */
gulp.task('watch', function () {
    gulp.watch(cssSource + '/**/*.scss', function (cb) {
        cleanCss(cb);
        return processCss(false);
    });

    gulp.watch(jsSource + '/**/*.js', function (cb) {
        cleanJs(cb);
        return processJs(true);
    });
});

/**
 * /This performs complete build that loads the 'dist' folder. 
 * This skips optimizations.
 */
gulp.task('build-dev', function (cb) {
    cleanAll();

    es.merge([
        processCss(false),
        processJs(true)
    ])
    .on('end', function () {
    });
});

/**
 * /This performs complete build that loads the 'dist' folder. 
 * This includes full optimization, cache-busting, minification.
 */
gulp.task('build-prod', function (cb) {
    cleanAll();

    es.merge([
        processCss(true),
        processJs(true)
    ])
    .on('end', function () {
    });
});