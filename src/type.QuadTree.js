function QuadTree (t_lvl, t_rect) {
  this.bounds = t_rect;
  this.lvl = t_lvl;
  this.maxObjects = 10; // We will have to change and observe the behaviour
  this.maxLvl = 5;
  this.objects = [];
  this.spares = []; // Objects that collide with the mid axes
  this.nodes = [];
  this.isSplit = false;
}
QuadTree.prototype.addItem = function (t_item) {
  if (!this.isSplit) {
    if (this.objects.length + 1 > this.maxObjects && this.lvl <= this.maxLvl) {
      this.split();
      this.addItem(t_item);
    } else {
      this.objects.push(t_item);
    }
  } else {
    // Get QuadTree
    if (!this.isSpare(t_item)) {
      var s = this.getSector(t_item.pos.x, t_item.pos.y);
      this.nodes[s].addItem(t_item);
    } else {
      this.spares.push(t_item);
    }
  }
};
QuadTree.prototype.addItems = function (t_arr) {
  for (let i in t_arr) {
    this.addItem(t_arr[i]);
  }
};
QuadTree.prototype.isSpare = function (t_nd) {
  var fac = 1.5;
  if (t_nd.pos.x >= this.bounds.midx - t_nd.size * fac && t_nd.pos.x <= this.bounds.midx + t_nd.size * fac) {
    return true;
  }
  if (t_nd.pos.y >= this.bounds.midy - t_nd.size * fac && t_nd.pos.y <= this.bounds.midy + t_nd.size * fac) {
    return true;
  }
  return false;
};
QuadTree.prototype.getSector = function (t_x, t_y) {
  /* Sectors are placed this way:
  1 | 2
  --|--
  4 | 3
  */
  if (t_x > this.bounds.x1 && t_x < this.bounds.midx) { // Left - Sector 1 or 4
    if (t_y > this.bounds.y1 && t_y < this.bounds.midy) {
      return 0; // Sector 1
    } else {
      return 3; // Sector 4
    }
  } else {
    if (t_y > this.bounds.y1 && t_y < this.bounds.midy) {
      return 1; // Sector 2
    } else {
      return 2; // Sector 3
    }
  }
};
QuadTree.prototype.queryItems = function (t_x, t_y) {
  var arr = [];
  arr = arr.concat(this.spares);
  if (!this.isSplit) {
    arr = arr.concat(this.objects);
  } else {
    var s = this.getSector(t_x, t_y);
    var res = this.nodes[s].queryItems(t_x, t_y);
    arr = arr.concat(res);
  }
  return arr;
};
QuadTree.prototype.split = function () {
  if (!this.isSplit) {
    this.nodes = Array(4);
    var b = this.bounds;
    this.nodes[0] = new QuadTree(this.lvl + 1, new Rectangle(b.x1, b.y1, b.midx, b.midy)); // TopLeft
    this.nodes[1] = new QuadTree(this.lvl + 1, new Rectangle(b.midx, b.y1, b.x2, b.midy)); // Top right
    this.nodes[2] = new QuadTree(this.lvl + 1, new Rectangle(b.midx, b.midy, b.x2, b.y2)); // Bottom right
    this.nodes[3] = new QuadTree(this.lvl + 1, new Rectangle(b.x1, b.midy, b.midx, b.y2)); // Bottom left
    this.isSplit = true;
    // Move Objects in their Sectors
    for (let i = 0; i < this.objects.length; ++i) {
      var obj = this.objects[i];
      if (this.isSpare(obj)) {
        this.spares.push(obj);
      } else {
        var s = this.getSector(obj.pos.x, obj.pos.y);
        this.nodes[s].addItem(obj);
      }
    }
    this.objects = [];
  }
};
