function Rectangle (t_x1, t_y1, t_x2, t_y2) {
  if (t_x1 > t_x2) { let tmp = t_x1; t_x1 = t_x2; t_x2 = tmp; }
  if (t_y1 > t_y2) { let tmp = t_y1; t_y1 = t_y2; t_y2 = tmp; }
  this.x1 = t_x1;
  this.x2 = t_x2;
  this.y1 = t_y1;
  this.y2 = t_y2;
  this.midx = Math.floor((t_x2 - t_x1) / 2) + t_x1;
  this.midy = Math.floor((t_y2 - t_y1) / 2) + t_y1;
}
