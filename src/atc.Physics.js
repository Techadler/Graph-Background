var atc = atc || {};
atc.Physics = atc.Physics || function (t_instance) {
  var instance = t_instance;

  function bounceNodesFromWalls () {
    if (!instance.bounceNodesAtWalls()) return;
    var decay = instance.getWallBounceDecay();
    var nds = instance.getNodes();
    var dim = instance.getDimensions();
    for (let i = 0; i < nds.length; ++i) {
      var nd = nds[i];
      if ((nd.pos.x - nd.size < 0 && nd.vec.x < 0) || (nd.pos.x + nd.size >= dim.x && nd.vec.x > 0)) { // switch X only if vector points outwards
        nd.vec.x *= -1;
        nd.vec.scaleBy(decay);
      }
      if ((nd.pos.y - nd.size < 0 && nd.vec.y < 0) || (nd.pos.y + nd.size >= dim.y && nd.vec.y > 0)) { // switch Y
        nd.vec.y *= -1;
        nd.vec.scaleBy(decay);
      }
    }
  }

  function checkEdges () {
    if (!instance.getEdgesEnabled()) return;
    var nds = instance.getNodes();
    var edgLen = instance.getMaxEdgeLength();
    for (let i = 0; i < nds.length - 1; ++i) {
      for (let j = i + 1; j < nds.length; ++j) {
        if (nds[i].distanceTo(nds[j]) > edgLen) {
          instance.setEdge(i, j, false);
        } else {
          instance.setEdge(i, j, true);
        }
      }
    }
  }

  function getSpeedFactor () {
    return 1 / instance.getMaxFPS();
  }

  function moveNodes () {
    var nds = instance.getNodes();
    var speedFactor = getSpeedFactor();
    for (let idx = 0; idx < nds.length; ++idx) {
      var nd = nds[idx];
      if (nd.physics.locked !== true) {
        nd.pos.x += nd.vec.x * speedFactor;
        nd.pos.y += nd.vec.y * speedFactor;
      }
    }
  }

  function applyCollsion (t_nd1, t_nd2) {
    var dist = t_nd1.size + t_nd2.size;
    var cnt = 0;
    while (dist > t_nd1.distanceTo(t_nd2)) { // Move back to point of actual collision
      t_nd1.pos.x += -t_nd1.vec.x * getSpeedFactor() * 0.1;
      t_nd1.pos.y += -t_nd1.vec.y * getSpeedFactor() * 0.1;
      t_nd2.pos.x += -t_nd2.vec.x * getSpeedFactor() * 0.1;
      t_nd2.pos.y += -t_nd2.vec.y * getSpeedFactor() * 0.1;
      ++cnt;
    }
    // console.log('Took ' + cnt + ' steps back');
    var calcVsAndVe = function (nd1, nd2) { // vS in Richtung der Stoßnormalen, vE Orthogonal
      var n = Vector.fromNodes(nd1, nd2);
      n.scaleTo(nd1.size);
      var alph = nd1.vec.angle(n);
      var vS = new Vector(n);
      vS.scaleTo(nd1.vec.length() * Math.cos(alph));
      var vE = new Vector();
      vE.x = nd1.vec.x - vS.x;
      vE.y = nd1.vec.y - vS.x / n.x * n.y;
      return { vS: vS, vE: vE };
    };
    var obj1 = calcVsAndVe(t_nd1, t_nd2);
    var vS1 = obj1.vS; var vE1 = obj1.vE;
    var obj2 = calcVsAndVe(t_nd2, t_nd1);
    var vS2 = obj2.vS; var vE2 = obj2.vE;

    var calcU = function (v1, v2, m1, m2) { // Resultierender Vektor parallel zu Stoßnormalen
      let x = (m1 * v1.x + m2 * (2 * v2.x - v1.x)) / (m1 + m2);
      let y = (m1 * v1.y + m2 * (2 * v2.y - v1.y)) / (m1 + m2);
      return new Vector(x, y);
    };
    var uS1 = calcU(vS1, vS2, t_nd1.mass, t_nd2.mass);
    var uS2 = calcU(vS2, vS1, t_nd2.mass, t_nd1.mass);
    uS1.add(vE1);
    uS2.add(vE2);
    t_nd1.vec = uS1;
    t_nd2.vec = uS2;
  }

  function checkCollisions () {
    if (!instance.bounceNodes()) return;
    var nds = instance.getNodes();
    var dim = instance.getDimensions();
    var quad = new QuadTree(0, new Rectangle(0, 0, dim.x, dim.y));
    instance.setQuadTree(quad);
    quad.addItems(nds);
    for (let i = 0; i < nds.length; ++i) {
      var nd = nds[i];
      var colNds = quad.queryItems(nd.pos.x, nd.pos.y);
      for (let j = 0; j < colNds.length; ++j) {
        if (colNds[j].id > i) {
          if (nd.collidesWith(colNds[j])) {
            // Check if they are moving away from each other
            applyCollsion(nd, colNds[j]);
          }
        }
      }
    }
  }

  function removeNodesOutOfBox () {
    var nds = instance.getNodes();
    var dim = instance.getDimensions();
    var rem = 0;
    var minDist = 50;
    for (let i = 0; i < nds.length; ++i) {
      if (nds[i] === null) { console.log('nds null at: ' + i + ' nds.length = ' + nds.length); }
      if (nds[i].pos.x < 0 - minDist || nds[i].pos.x > dim.x + minDist || nds[i].pos.y < 0 - minDist || nds[i].pos.y > dim.y + minDist) {
        instance.removeNode(i);
        ++rem;
      }
    }
    for (let i = 0; i < rem; ++i) {
      instance.addNode();
    }
  }

  function electricalForce (t_nd1, t_nd2, t_dist) {
    t_dist = t_dist || t_nd1.distanceTo(t_nd2);
    var k = 10000;
    return k * t_nd1.charge * t_nd2.charge / Math.pow(t_dist, 2);
  }

  function tickElectricalForce () {
    if (!instance.electricalForce()) return;
    var step = 1000 / instance.getMaxFPS();
    var nds = instance.getNodes();
    for (let i = 0; i < nds.length - 1; ++i) {
      var nd1 = nds[i];
      for (let j = i + 1; j < nds.length; ++j) {
        var nd2 = nds[j];
        var distance = nd1.distanceTo(nd2);
        if (distance < 400 && distance > 10) {
          // Take force and accelerate the nodes in direction of vector times the physics time
          var f = electricalForce(nd1, nd2, distance);
          var v = Vector.fromNodes(nd1, nd2);
          var a = f / nd1.mass;
          v.invert();
          v.scaleTo(a * step);
          nd1.vec.x += v.x;
          nd1.vec.y += v.y;
          // console.log('Vector changed by x:' + v.x + '  y:' + v.y);
          // Repeat steps for nd2
          a = f / nd2.mass;
          v.invert();
          v.scaleTo(a * step);
          nd2.vec.x += v.x;
          nd2.vec.y += v.y;
        }
      }
    }
  }

  return {
    tick: function () {
      tickElectricalForce();
      bounceNodesFromWalls();
      checkCollisions();
      moveNodes();
      removeNodesOutOfBox();
      checkEdges();
    }
  };
};
