module.exports = function createImage(imageSrc, height, width) {
  return $('<img />')
    .attr('src', imageSrc)
    .css({
      display: 'none',
      height: height,
      left: 0,
      position: 'absolute',
      top: 0,
      width: width,
      'z-index': 1000
    });
};
