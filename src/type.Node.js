function Node (t_id, t_minSize, t_maxSize, t_pos, t_vec) {
  this.id = t_id;
  t_minSize = t_minSize || 2;
  t_maxSize = t_maxSize || 5;
  this.size = Math.random() * Math.abs(t_maxSize - t_minSize) + Math.abs(t_minSize);
  this.pos = t_pos || {x: 0, y: 0};
  this.vec = t_vec || new Vector();
  // this.mass = 1;
  this.mass = (4 / 3) * Math.PI * Math.pow(this.size, 3);
  this.charge = 1;// Math.random() < 0.5 ? -1 : 1;
  // this.charge = 1;
  this.physics = { locked: false, skip: false };
}
Node.prototype.distanceTo = function (t_nd) {
  var x = t_nd.pos.x - this.pos.x;
  var y = t_nd.pos.y - this.pos.y;
  return Math.sqrt(x * x + y * y);
};
Node.prototype.collidesWith = function (t_nd) {
  if (this.id === t_nd.id) return false;
  return this.distanceTo(t_nd) < (this.size + t_nd.size);
};
