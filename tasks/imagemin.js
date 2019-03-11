const gulp = require('gulp'),
  through = require('through2'),
  imagemin = require('gulp-imagemin'),
  imageminWebp = require('imagemin-webp'),
  imageminPngquant = require('imagemin-pngquant'),
  imageminMozjpeg = require('imagemin-mozjpeg'),
  conf = require('./conf');

gulp.task('imagemin:webp', function (done) {
  if (!process.env.GEN_WEBP) {
    return done();
  }
  gulp
    .src([
      'dist/' + conf.PROJECT_NAME + '/**/*.+(jpg|jpeg|png)',
      '!dist/**/_vendor/**/*'
    ])
    .pipe(
      imagemin([
        imageminWebp({
          quality: 75
        })
      ])
    )
    .pipe(
      through.obj(function (file, enc, next) {
        file.path = file.path.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        this.push(file);
        next();
      })
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME))
    .on('finish', function () {
      done();
    });
});

gulp.task('imagemin:png', ['imagemin:webp'], function () {
  gulp
    .src([
      'dist/' + conf.PROJECT_NAME + '/**/*.png',
      '!dist/**/*.min.png',
      '!dist/**/_vendor/**/*'
    ])
    .pipe(
      imagemin([
        imageminPngquant({
          quality: [0.65, 0.8]
        })
      ])
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

gulp.task('imagemin:jpg', ['imagemin:webp'], function (done) {
  gulp
    .src([
      'dist/' + conf.PROJECT_NAME + '/**/*.+(jpg|jpeg)',
      '!dist/**/*.min.+(jpg|jpeg)',
      '!dist/**/_vendor/**/*'
    ])
    .pipe(
      imagemin([
        imageminMozjpeg({
          quality: 75
        })
      ])
    )
    .pipe(gulp.dest('dist/' + conf.PROJECT_NAME));
});

gulp.task('imagemin', ['imagemin:png', 'imagemin:jpg', 'imagemin:webp']);
