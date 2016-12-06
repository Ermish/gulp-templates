/// <binding Clean='clean' />
/// <binding BeforeBuild='css' />

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

	//Specific plugins
    autoprefixer = require('autoprefixer'),    
    cssmin = require('gulp-cssmin'),
    postcss = require('gulp-postcss'),    
    rev = require('gulp-rev'),
    revReplace = require('gulp-rev-replace'),
    sass = require('gulp-sass');


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
});

/**
 * /This performs the same functionality as the watch tasks, but does a quick complete build that loads the 'dist' folder. 
 * It does not vulcanize and does minimal optimization.
 */
gulp.task('build-dev-lite', function(cb) {
    cleanAll();

    es.merge([
            processImages(),
            processCss(true)
        ])
        .on('end', function() {
            
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
            processCss()
        ])
        .on('end', function() {
        });
});

/**
 * /This is identical to build-dev except environment variables.
 */
gulp.task('build-prod', function (cb) {
    cleanAll();

    es.merge([
            processImages(),
            processCss()
        ])
        .on('end', function() {
        });
});