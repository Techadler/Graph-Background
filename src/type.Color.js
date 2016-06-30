function Color (r, g, b) {
  this.r = r;
  this.g = g;
  this.b = b;
}
Color.fromHSV = function (t_H, t_S, t_V) {
  var h = Math.round(t_H / 60);
  var f = t_H / 60 - h;
  var p = t_V * (1 - t_S);
  var q = t_V * (1 - t_S * f);
  var t = t_V * (1 - t_S * (1 - f));
  var rgb = {};
  switch (h) {
    case 1: rgb = {r: q, g: t_V, b: p}; break;
    case 2: rgb = {r: p, g: t_V, b: t}; break;
    case 3: rgb = {r: p, g: q, b: t_V}; break;
    case 4: rgb = {r: t, g: p, b: t_V}; break;
    case 5: rgb = {r: t_V, g: p, b: q}; break;
    default:rgb = {r: t_V, g: t, b: p}; break;
  }
  rgb.r = Math.round(rgb.r * 255);
  rgb.g = Math.round(rgb.g * 255);
  rgb.b = Math.round(rgb.b * 255);
  return new Color(rgb.r, rgb.g, rgb.b);
};
Color.prototype.toRGBString = function () {
  return 'rgb(' + this.r + ',' + this.g + ',' + this.b + ')';
};
