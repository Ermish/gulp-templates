/// <binding />
'use strict';

//Gulp related plugins
var chalk = require('chalk'),
    concat = require('gulp-concat'),
    del = require('del'),
    env = require('gulp-env'),
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
    babel = require('babel-loader'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    webpack = require('webpack'),
    webpackStream = require('webpack-stream'),
 
    //Html specific plugins
    pug = require('gulp-pug'),

    //Img specific plugins
    imagemin = require('gulp-imagemin');

//Path variables
var componentsSource = 'app/components',
    cssSource = 'app/sass',
    cssDist = 'dist/css',
    jsSource = 'app/js',
    jsDist = 'dist/js',
    htmlSource = 'app/html',
    htmlDist = 'dist/html',
    imgSource = 'app/img',
    imgDist = 'dist/img';



// -------------------- Clean files/folders ------------------------\\

var cleanAll = function (cb) {
    del.sync(['./' + cssDist  + '/**/*', 
              './' + jsDist   + '/**/*', 
              './' + htmlDist + '/**/*', 
              './' + imgDist  + '/**/*']);
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

var cleanHtml = function (cb) {
    del.sync(['./' + htmlDist + '/**/*']);
    console.log(chalk.cyan('Cleaned up html folder'));
    if (typeof cb === 'function')
        cb();
}

var cleanImg = function (cb) {
    del.sync(['./' + imgDist + '/**/*']);
    console.log(chalk.cyan('Cleaned up img folder'));
    if (typeof cb === 'function')
        cb();
}

// -------------------- Processing ------------------------\\

var processCss = function (isOptimized) {
    //Some views use single css files so build unbundled files.
    const allCssFiles = cssSource + '/**/*.scss';

    const iosBundle = [
        cssSource + '/circular.scss',
        cssSource + '/site.scss',
        cssSource + '/shopbook.scss',
        cssSource + '/ios2.scss'
    ];
    const androidBundle = [
        cssSource + '/circular.scss',
        cssSource + '/site.scss',
        cssSource + '/shopbook.scss',
        cssSource + '/android2.scss'
    ];
    const winPhoneBundle = [
        cssSource + '/circular.scss',
        cssSource + '/site.scss',
        cssSource + '/shopbook.scss',
        cssSource + '/winphone2.scss'
    ];

    const mobileWebBundle = [
        cssSource + '/circular.scss',
        cssSource + '/site.scss',
        cssSource + '/shopbook.scss'
    ];

    //This will build out bundled CSS files for each Area
    return es.merge([
        processCssFiles(isOptimized, allCssFiles, false),
        processCssFiles(isOptimized, iosBundle, true, 'ios.css'),
        processCssFiles(isOptimized, androidBundle, true, 'android.css'),
        processCssFiles(isOptimized, winPhoneBundle, true, 'winphone.css'),
        processCssFiles(isOptimized, mobileWebBundle, true, 'mobileweb.css')
    ]);
};

var processJs = function (isOptimized) {
    var webpackConfig = Object.create(require('./webpack.config.js'));

    return gulp.src([jsSource + '/**/*.js'])
        .pipe(logger({
            before: 'Starting to process js files...',
            after: 'Done processing js files!',
            showChange: true
        }))      
        .pipe(webpackStream(webpackConfig, webpack).on('error', function handleError() {
            this.emit('end'); // Recover from errors
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

var processHtml = function (isOptimized) {
    return gulp.src(htmlSource + '/*.pug')
        .pipe(logger({
            before: 'Starting to process html files...',
            after: 'Done processing html files!',
            showChange: true
        }))
        .pipe(pug({
            verbose: true
        }))
        .pipe(gulp.dest(htmlDist)); //output html files 
};

var processImages = function (isOptimized) {
    return gulp.src(imgSource + '/**/*')
        .pipe(logger({
            before: 'Starting to process html files...',
            after: 'Done processing html files!',
            showChange: true
        }))
        .pipe(gulpif(isOptimized,
            //Compress images
            imagemin()
        ))
        .pipe(gulp.dest(imgDist)); //output images
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
    process.env.NODE_ENV = 'development';    

    gulp.watch([cssSource + '/**/*.scss', componentsSource + '/**/*.scss'], function (cb) {
        cleanCss(cb);
        return processCss(false);
    });

    gulp.watch([jsSource + '/**/*.js', componentsSource + '/**/*.jsx'], function (cb) {
        cleanJs(cb);
        return processJs(true);
    });

    gulp.watch(htmlSource + '/**/*.pug', function (cb) {
        cleanHtml(cb);
        return processHtml(true);
    });

    gulp.watch(imgSource + '/**/*', function (cb) {
        cleanImg(cb);
        return processImages(true);
    });
});

/**
 * /This performs complete build that loads the 'dist' folder. 
 * This skips optimizations.
 */
gulp.task('build-dev', function (cb) {
    process.env.NODE_ENV = 'development';    
    
    cleanAll();

    es.merge([
        processCss(false),
        processJs(true),
        processHtml(true),
        processImages(false)
    ])
    .on('end', function () {
    });
});

/**
 * /This performs complete build that loads the 'dist' folder. 
 * This includes full optimization, cache-busting, minification.
 */
gulp.task('build-prod', function (cb) {
    process.env.NODE_ENV = 'production';    

    cleanAll();

    es.merge([
        processCss(true),
        processJs(true),
        processHtml(true),
        processImages(true)
    ])
    .on('end', function () {
    });
});