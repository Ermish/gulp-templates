/// <binding Clean='clean' />
/// <binding BeforeBuild='css' />

'use strict';

var chalk = require('chalk'),
    del = require('del'),
    es = require('event-stream'),
    filter = require('gulp-filter'),
    gulp = require('gulp'),
    gulpif = require('gulp-if'),
    

    autoprefixer = require('autoprefixer'),
    babel = require('babel-loader'),
    concat = require('gulp-concat'),
    cssmin = require('gulp-cssmin'),
    htmlmin = require('gulp-htmlmin'),
    logger = require('gulp-logger'),
    postcss = require('gulp-postcss'),
    rename = require('gulp-rename'),
    rev = require('gulp-rev'),
    revReplace = require('gulp-rev-replace'),
    sass = require('gulp-sass'),
    uglify = require('gulp-uglify'),
    webpack = require('gulp-webpack');


// -------------------- Clean files/folders ------------------------\\

var cleanAll = function (cb) {
    del.sync(['./dist/**/*']);
    console.log(chalk.cyan('Cleaned up dist folder'));
    if (typeof cb === 'function')
        cb();
}

var cleanCss = function (cb) {
    del.sync(['./dist/css/**/*']);
    console.log(chalk.cyan('Cleaned up css folder'));
    if (typeof cb === 'function')
        cb();
}

var cleanJs = function (cb) {
    del.sync(['./dist/js/**/*']);
    console.log(chalk.cyan('Cleaned up js folder'));
    if (typeof cb === 'function')
        cb();
}

var cleanHtml = function (cb) {
    del.sync(['./dist/views/**/*']);
    console.log(chalk.cyan('Cleaned up views folder'));
    if (typeof cb === 'function')
        cb();
}

// -------------------- Processing ------------------------\\

var processCss = function(isMinimal) {
    return gulp.src('app/css/**/*.scss')
        .pipe(logger({
            before: 'Starting to process scss files...',
            after: 'Done processing scss files!',
            showChange: true
        }))
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([
            autoprefixer({ browsers: ['last 20 versions'] })
        ]))
        .pipe(concat('app.css'))
        .pipe(gulp.dest('dist/css')) //output app.css
        .pipe(cssmin())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css')) //output app.min.css
        .pipe(gulpif(!isMinimal,
            rev()
        ))
        .pipe(gulp.dest('dist/css')) //output app-123.min.css
        .pipe(gulpif(!isMinimal,
            rev.manifest(('rev-manifest.json', {
                base: "dist",
                merge: true // merge with the existing manifest (if one exists)
            }))))
        .pipe(gulpif(!isMinimal,
            gulp.dest('dist') //output rev-manifest.json
        ));
};

var processJs = function(isMinimal) {
    return gulp.src('app/js/app.js')
        .pipe(logger({
            before: 'Starting to process js files...',
            after: 'Done processing js files!',
            showChange: true
        }))
        .pipe(webpack({
            entry: {
                app: './app/js/app.js'
            },
            output: {
                library: 'foo',
                libraryTarget: 'window',
                filename: '[name].js'
            },
            module: {
                loaders: [
                    {
                        //exclude: /(node_modules|bower_components)/,
                        loader: 'babel', // 'babel-loader' is also a valid name to reference
                        query: {
                            presets: ['es2015']
                        }
                    }
                ]
            }
        }))
        .pipe(gulp.dest('dist/js')) //output app.js
        .pipe(uglify())
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/js')) //output app.min.js
        .pipe(gulpif(!isMinimal,
            rev()
        ))
        .pipe(gulp.dest('dist/js')) //output app-123.min.js
        .pipe(gulpif(!isMinimal,
            rev.manifest(('rev-manifest.json', {
                base: "dist",
                merge: true // merge with the existing manifest (if one exists)
            }))))
        .pipe(gulpif(!isMinimal,
            gulp.dest('dist') //output rev-manifest.json
        ));
};

var processHtml = function (isMinimal) {
    var cacheBustingRevisionsManifest = "dist/rev-manifest.json";

    if (isMinimal) {
        return gulp.src('app/views/**/*.html')
            .pipe(logger({
                before: 'Starting to process html files...',
                after: 'Done processing html files!',
                showChange: true
            }))
            .pipe(gulp.dest('dist/views'));
    }

    return gulp.src('app/views/**/*.html')
        .pipe(logger({
            before: 'Starting to process html files...',
            after: 'Done processing hmtl files!',
            showChange: true
        }))
        .pipe(rename({ dirname: '' })) //flattens folder structure
        .pipe(gulp.dest('dist/views'));
};

var processImages = function () {
    return gulp.src('app/images/**/*')//.src('app/views/**/*.html')
        .pipe(logger({
            before: 'Starting to process image files...',
            after: 'Processing image files complete!',
            showChange: true
        }))
        .pipe(gulp.dest('dist/images'));
};


//-----------------------Tasks-----------------------\\

/**
 * Watches for any changes, processes, and automatically updates the dist folder.
 */
gulp.task('watch', function () {
    gulp.watch('app/css/**/*.scss', function (cb) {
        cleanCss(cb);
        return processCss(true);
    });

    gulp.watch('app/**/*.js', function (cb) {
        cleanJs(cb);
        return processJs(true);
    });

    gulp.watch('app/views/**/*.html', function (cb) {
        cleanHtml(cb);
        return processHtml(true);
    });
});

/**
 * /This performs the same functionality as the watch tasks, but does a quick complete build that loads the 'dist' folder. 
 * It does not vulcanize and does minimal optimization.
 */
gulp.task('build-dev-lite', function(cb) {
    cleanAll();

    es.merge([
            processImages(),
            processCss(true),
            processJs(true)
        ])
        .on('end', function() {
            processHtml(true).on('end', function() { cb();  });
        });
});

/**
 * /This performs complete build that loads the 'dist' folder. 
 * This includes full optimization, cache-busting, vulcanization.
 */
gulp.task('build-dev', function (cb) {
    cleanAll();

    es.merge([
            processImages(),
            processCss(),
            processJs()
        ])
        .on('end', function() {
            processHtml(false).on('end', function () { cb(); });
        });
});

/**
 * /This is identical to build-dev except environment variables.
 */
gulp.task('build-prod', function (cb) {
    cleanAll();

    es.merge([
            processImages(),
            processCss(),
            processJs()
        ])
        .on('end', function() {
            processHtml().on('end', function () { cb(); });
        });
});