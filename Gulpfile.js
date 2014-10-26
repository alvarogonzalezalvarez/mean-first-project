// File: Gulpfile.js
'use strict';

var gulp = require('gulp'),
	connect = require('gulp-connect'),
	stylus = require('gulp-stylus'),
	nib = require('nib'),
	jshint = require('gulp-jshint'),
	stylish = require('jshint-stylish'),
	inject = require('gulp-inject'),
	wiredep = require('wiredep').stream,
	gulpif = require('gulp-if'),
	minifyCss = require('gulp-minify-css'),
	useref = require('gulp-useref'),
	uglify = require('gulp-uglify'),
	uncss = require('gulp-uncss'),
	angularFilesort = require('gulp-angular-filesort'),
	templateCache = require('gulp-angular-templatecache'),
	historyApiFallback = require('connect-history-api-fallback');

// Servidor web de desarrollo
gulp.task('server', function() {
	process.env.NODE_ENV = 'development';
	var debug = require('debug')('flappernews');
	var app = require('./app');
	app.set('port', process.env.PORT || 3000);
	var server = app.listen(app.get('port'), function() {
  		debug('Express server listening on port ' + server.address().port);
	});
});

gulp.task('server-dist', function() {
	process.env.NODE_ENV = 'production';
	var debug = require('debug')('flappernews');
	var app = require('./app');
	app.set('port', process.env.PORT || 3000);
	var server = app.listen(app.get('port'), function() {
  		debug('Express server listening on port ' + server.address().port);
	});
});

// Busca errores en el JS y nos los muestra por pantalla
gulp.task('jshint', function() {
	return gulp.src('./app/scripts/**/*.js')
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

// Preprocesa archivos Stylus a CSS y recarga los cambios
gulp.task('css', function() {
	gulp.src('./app/stylesheets/main.styl')
		.pipe(stylus({ use: nib() }))
		.pipe(gulp.dest('./app/stylesheets'))
		.pipe(connect.reload());
});

// Recarga el navegador cuando hay cambios en el HTML
gulp.task('html', function() {
	gulp.src('./app/**/*.html')
		.pipe(connect.reload());
});

// Busca en las carpetas de estilos y javascript los archivos que hayamos creado
// para inyectarlos en el index.html
gulp.task('inject', function() {
	return gulp.src('index.html', {cwd: './app'})
		.pipe(inject(
			gulp.src(['./app/scripts/**/*.js']).pipe(angularFilesort()), {
				read: false,
				ignorePath: '/app'
		}))
		.pipe(inject(
			gulp.src(['./app/stylesheets/**/*.css']), {
				read: false,
				ignorePath: '/app'
			}
		))
		.pipe(gulp.dest('./app'));
});

// Inyecta las librerias que instalemos vía Bower
gulp.task('wiredep', function () {
	gulp.src('./app/index.html')
		.pipe(wiredep({
			directory: './app/lib'
		}))
		.pipe(gulp.dest('./app'));
});

gulp.task('templates', function() {
	gulp.src('./app/**/*.tpl.html')
		.pipe(templateCache({
			root: 'views/',
			module: 'app.templates',
			standalone: true
		}))
		.pipe(gulp.dest('./app/scripts'));
});

gulp.task('compress', function() {
	gulp.src('./app/index.html')
		.pipe(useref.assets())
		.pipe(gulpif('*.js', uglify({mangle: false })))
		.pipe(gulpif('*.css', minifyCss()))
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy', function() {
	gulp.src('./app/index.html')
		.pipe(useref())
		.pipe(gulp.dest('./dist'));
	gulp.src('./app/lib/bootstrap/dist/fonts/**')
		.pipe(gulp.dest('./dist/fonts'));
});

gulp.task('uncss', function() {
		gulp.src('./dist/css/style.min.css')
			.pipe(uncss({html: ['./app/index.html']}))
			.pipe(gulp.dest('./dist/css'));
});

// Vigila cambios que se produzcan en el código
// y lanza las tareas relacionadas
gulp.task('watch', function() {
	gulp.watch(['./app/**/*.html'], ['html']);
	gulp.watch(['./app/**/*.tpl.html'], ['templates']);
	gulp.watch(['./app/stylesheets/**/*.styl'], ['css', 'inject']);
	gulp.watch(['./app/scripts/**/*.js', './Gulpfile.js'], ['jshint', 'inject']);
	gulp.watch(['./bower.json'], ['wiredep']);
});

gulp.task('default', ['server', 'templates', 'inject', 'wiredep', 'watch']);
gulp.task('build', ['templates', 'compress', 'copy', 'uncss']);
