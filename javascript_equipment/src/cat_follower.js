var createImage = require('./cat_image');

function addKeyboardHandlers(cat) {
  $(document).on('keyup', function(event) {
    if (event.keyCode === 67) {
      if (cat.following) { cat.unfollow(); } else { cat.follow(); }
    }
  });
}

function InsistentCat(imageSrc, height, width) {
  this.following = false;
  this.$img = createImage(imageSrc, height, width).appendTo('body');
  this._goToPointer = $.proxy(this._goToPointer, this);
  addKeyboardHandlers(this);
}

InsistentCat.prototype.follow = function() {
  $('body').on('mousemove', this._goToPointer);
  this.following = true;
};

InsistentCat.prototype.unfollow = function() {
  this.$img.hide();
  $('body').off('mousemove', this._goToPointer);
  this.following = false;
};

InsistentCat.prototype._goToPointer = function(event) {
  var halfHeight = this.$img.prop('height') / 2.0,
      halfWidth  = this.$img.prop('width') / 2.0;

  this.$img.css({
    top:  event.clientY - halfHeight,
    left: event.clientX - halfWidth
  });

  if (this.$img.is(':hidden')) {
    setTimeout( $.proxy(this.$img.show, this.$img), 100 );
  }
};

module.exports = InsistentCat;
