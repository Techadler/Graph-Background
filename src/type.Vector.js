function Vector (t_x, t_y) {
  if (t_x instanceof Vector && t_y === undefined) {
    this.x = t_x.x;
    this.y = t_x.y;
  } else {
    this.x = t_x || 0;
    this.y = t_y || 0;
  }
}
Vector.copy = function (t_v) {
  return new Vector(t_v.x, t_v.y);
};
Vector.fromNodes = function (t_nd1, t_nd2) {
  return new Vector(t_nd2.pos.x - t_nd1.pos.x, t_nd2.pos.y - t_nd1.pos.y);
};
Vector.prototype.add = function (t_v) {
  this.x += t_v.x;
  this.y += t_v.y;
};
Vector.prototype.angle = function (t_v) {
  var sc = this.scalar(t_v);
  var l = this.length() * t_v.length();
  if (l === 0) return 0;
  var c = sc / l;
  if (c < -1) c = -1;
  if (c > 1) c = 1;
  return Math.acos(c);
};
Vector.prototype.invert = function () {
  this.x *= -1;
  this.y *= -1;
};
Vector.prototype.length = function () {
  return Math.sqrt(this.x * this.x + this.y * this.y);
};
Vector.prototype.scalar = function (t_v) {
  return this.x * t_v.x + this.y * t_v.y;
};
Vector.prototype.scaleBy = function (t_scale) {
  this.x *= t_scale;
  this.y *= t_scale;
};
Vector.prototype.scaleTo = function (t_length) {
  var len = this.length();
  if (len !== 0) {
    var x = t_length / len;
    this.x *= x;
    this.y *= x;
  }
};
