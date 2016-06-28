/* The MIT License (MIT)

Copyright (c) 2016 Carsten Rattay

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
var atc = atc || {};

atc.base = atc.base || (function () {
  // Privates
  var instances = {};

  function generateID () {
    var id;
    do {
      id = String.fromCharCode(Math.floor((Math.random() * 25) + 65));
      do {
        var asci = Math.floor((Math.random() * 42) + 48);
        if (asci < 58 || asci > 64) {
          id += String.fromCharCode(asci);
        }
      } while (id.length !== 16);
    } while (Object.keys(instances).indexOf(id) > -1);
    return id;
  }

  function parseConfig (t_conf) {
    var defConf = atc.base.getDefaultConfig();
    if (t_conf !== undefined) {
      var allKeys = Object.keys(defConf);
      var keys = Object.keys(t_conf);
      for (let idx in keys) { // Check config to only contain known setting options
        if (allKeys.indexOf(keys[idx]) === -1) {
          console.log('Unknown config option: ' + keys[idx]);
          delete t_conf[keys[idx]];
        }
      }
      for (let idx in allKeys) {
        var key = allKeys[idx];
        if (t_conf[key] === undefined) {
          t_conf[key] = defConf[key];
        }
      }
    } else {
      t_conf = defConf;
    }
    return t_conf;
  }

  // Public
  return {
    createInstance: function (t_el, t_conf) {
      if (t_el === undefined || t_el.nodeName !== 'CANVAS') {
        console.log('Passed element is not a canvas!'); return;
      }
      t_conf = parseConfig(t_conf);
      var id = generateID();
      instances[id] = new atc.Instance(t_el, t_conf, id);
      return id;
    },
    getInstance: function (t_id) {
      if (instances[t_id] !== undefined) {
        return instances[t_id];
      }
      return null;
    },
    getInstanceByElement: function (t_el) {
      if (t_el !== undefined) {
        for (let id in instances) {
          if (instances[id].getElement() === t_el) {
            return instances[id];
          }
        }
      }
      return null;
    },
    getInstanceIDs: function () {
      return Object.keys(instances);
    },
    startInstance: function (t_id) {
      instances[t_id].start();
    },
    stopInstance: function (t_id) {
      instances[t_id].stop();
    },
    getInstanceState: function (t_id) {
      return instances[t_id].getState();
    },
    destroyInstance: function (t_id) {
      atc.base.stopInstance(t_id);
      instances[t_id].destroy();
      delete instances[t_id];
    },
    getDefaultConfig: function () {
      return {
        edgeColor: '#e4e4e4',
        nodeColor: '#ffffff',
        backColor: '#0d6aa4',
        nodeMinSize: 2,
        nodeMaxSize: 5,
        edgeWidth: 1.5,

        gravity: false,
        gravityStrength: 2,

        height: 0,
        maxHeight: 0,
        width: 0,
        maxWidth: 0,

        uiEnabled: false,
        diagnosticsEnabled: true,

        maxEdges: 100,
        maxEdgeLength: 150,
        maxFPS: 60,
        maxNodes: 120,
        maxSpeed: 20
      };
    }
  };
})();

atc.Instance = atc.Instance || function (t_el, t_conf, t_id) {
  if (!(this instanceof atc.Instance)) return new atc.Instance(t_el, t_conf, t_id);

  var conf = t_conf;
  var id = t_id;
  var canvas = t_el;
  var dimension = { x: undefined, y: undefined };
  var loopID = null;
  var lastRun = 0;
  var nodes = [];
  var mtx = [];
  var maxNodes = 0;
  setMaxNodes(conf.maxNodes);

  function populate () {
    for (let i = 0; i < maxNodes; ++i) {
      var n = new Node(i, conf.nodeMinSize, conf.nodeMaxSize, getRndPos(), getRndVec());
      nodes[i] = n;
    }
  }
  function getRndPos () {
    var pos = {};
    pos.x = Math.random() * dimension.x;
    pos.y = Math.random() * dimension.y;
    return pos;
  }
  function getRndBorderPos () {
    var pos = {};
    if (Math.random() < 0.5) { // Take X Border
      pos.x = Math.random() < 0.5 ? 0 : dimension.x;
      pos.y = Math.random() * dimension.y;
    } else {
      pos.x = Math.random() * dimension.x;
      pos.y = Math.random() < 0.5 ? 0 : dimension.y;
    }
    return pos;
  }
  function getRndVec () {
    var x = Math.random() * 2 * conf.maxSpeed - conf.maxSpeed;
    var y = Math.random() * 2 * conf.maxSpeed - conf.maxSpeed;
    return new Vector(x, y);
  }
  function setMaxNodes (t_size) {
    if (t_size < maxNodes) { // need to delete
      nodes = nodes.splice(t_size - 1, maxNodes - t_size);
    } else { // Append null values up to t_size
      var l = nodes.length;
      nodes.length = t_size;
      nodes.fill(null, l);
    }
    var edgMtx = Array(t_size);
    for (let i = 0; i < t_size; ++i) { // Initialize rows and copy values if possible
      edgMtx[i] = Array(t_size);
      if (i < mtx.length) { // Copy the rows if possible
        var j;
        for (j = 0; j < mtx.length && j < t_size; ++j) {
          edgMtx[i][j] = mtx[i][j];
        }
        edgMtx[i].fill(false, j, t_size);
      } else {
        edgMtx[i].fill(false);
      }
    }
    maxNodes = t_size;
    mtx = edgMtx;
  }
  function mainLoop () {
    if (lastRun === 0 || lastRun < (window.performance.now() | 0) - (1000 / conf.maxFPS) | 0) {
      var ts = window.performance.now() | 0;
      var step = ((1000 | 0) / (conf.maxFPS | 0)) | 0;
      var delta = ts - (lastRun === 0 ? step : lastRun);
      do {
        physics.tick();
      } while ((delta -= step) > step);
      render.doRenderCycle();
      lastRun = ts - (delta % step);
    }
    loopID = window.requestAnimationFrame(mainLoop);
  }

  function setDimension (t_el) {
    // width: 0 -> grow
      // maxWidth: -> growLimit
    var p = t_el.parentNode;
    if (conf.width === 0) {
      if (conf.maxWidth > 0) {
        dimension.x = p.clientWidth > conf.maxWidth ? conf.maxWidth : p.clientWidth;
      } else {
        dimension.x = p.clientWidth;
      }
    } else {
      dimension.x = conf.width;
    }
    if (conf.height === 0) {
      if (conf.maxHeight > 0) {
        dimension.y = p.clientHeight > conf.maxHeight ? conf.maxHeight : p.clientHeight;
      } else {
        dimension.y = p.clientHeight;
      }
    } else {
      dimension.y = conf.height;
    }
    t_el.setAttribute('width', dimension.x);
    t_el.setAttribute('height', dimension.y);
  }

  this.addNode = function () { // AddSingle Node to free index
    for (let i = 0; i < nodes.length; ++i) {
      if (nodes[i] === null) {
        var pos = getRndBorderPos();
        var vec = getRndVec();
        if (pos.x === 0 || pos.x === dimension.x) {
          vec.x = pos.x === 0 ? Math.abs(vec.x) : -Math.abs(vec.x);
        } else {
          vec.y = pos.y === 0 ? Math.abs(vec.y) : -Math.abs(vec.y);
        }
        nodes[i] = new Node(i, conf.nodeMinSize, conf.nodeMaxSize, pos, vec);
        break;
      }
    }
  };
  this.destroy = function () {
    this.stop();
    window.removeEventListener('resize', this.onResize);
    ui.unbind();
    render = null;
    physics = null;
    ui = null;
    canvas.setAttribute('width', 0);
    canvas.setAttribute('height', 0);
  };
  this.enableDiagnostics = function (t_bool) {
    if (t_bool === true || t_bool === false) {
      conf.diagnosticsEnabled = t_bool;
    }
  };
  this.getBackColor = function () {
    return conf.backColor;
  };
  this.getDiagnosticsEnabled = function () {
    return conf.diagnosticsEnabled;
  };
  this.getDimensions = function () {
    return dimension;
  };
  this.getEdgeColor = function () {
    return conf.edgeColor;
  };
  this.getEdgeWidth = function () {
    return conf.edgeWidth;
  };
  this.getElement = function () {
    return canvas;
  };
  this.getMaxEdgeLength = function () {
    return conf.maxEdgeLength;
  };
  this.getMaxFPS = function () {
    return conf.maxFPS;
  };
  this.getNeighbours = function (t_id) {
    var arr = [];
    for (let i = 0; i < maxNodes; ++i) {
      if (mtx[t_id][i]) {
        arr.push(nodes[i]);
      }
    }
    return arr;
  };
  this.getNodes = function () {
    return nodes;
  };
  this.getNodeColor = function () {
    return conf.nodeColor;
  };
  this.getState = function () {
    return {
      id: id,
      running: loopID !== null
    };
  };
  this.onResize = function (event) {
    setDimension(canvas);
  };
  this.removeNode = function (t_id) {
    for (let i = 0; i < maxNodes; ++i) {
      if (mtx[t_id][i]) {
        this.setEdge(t_id, i, false);
      }
    }
    nodes[t_id] = null;
  };
  this.setBackColor = function (t_col) {
    if (t_col !== undefined) {
      conf.backColor = t_col;
    }
  };
  this.setEdge = function (t_id1, t_id2, t_bool) {
    if (t_id1 >= 0 && t_id1 < mtx.length &&
        t_id2 >= 0 && t_id2 < mtx.length &&
       (t_bool || t_bool === false)) {
      mtx[t_id1][t_id2] = t_bool;
      mtx[t_id2][t_id1] = t_bool;
    }
  };
  this.setEdgeColor = function (t_col) {
    if (t_col !== undefined) {
      conf.edgeColor = t_col;
    }
  };
  this.setNodeColor = function (t_col) {
    if (t_col !== undefined) {
      conf.nodeColor = t_col;
    }
  };
  this.start = function () {
    loopID = window.requestAnimationFrame(mainLoop);
  };
  this.stop = function () {
    if (loopID !== null) {
      window.cancelAnimationFrame(loopID);
    }
    loopID = null;
  };

  // Run initialization Code
  setDimension(t_el);
  populate();
  var render = new atc.Render(t_el, this); // We are calling this here, so we need to make sure that this has all properties by now
  var physics = new atc.Physics(this);
  var ui = new atc.UserInterface(t_el, this);
  if (conf.uiEnabled) {
    ui.bind(t_el);
  }
  window.addEventListener('resize', this.onResize);
};

atc.Render = atc.Render || function (t_el, t_instance) {
  var ctx = t_el.getContext('2d');
  var instance = t_instance;

  function drawBackground () {
    var d = instance.getDimensions();
    ctx.clearRect(0, 0, d.x, d.y);
    ctx.fillStyle = instance.getBackColor();
    ctx.fillRect(0, 0, d.x, d.y);
  }

  function drawEdge (t_nd1, t_nd2) {
    var d = t_nd1.distanceTo(t_nd2);
    var fac = (1 - (d * d) / Math.pow(instance.getMaxEdgeLength(), 2));
    if (fac > 1 || fac < 0) fac = 0;
    ctx.lineWidth = instance.getEdgeWidth() * fac;
    ctx.beginPath();
    ctx.moveTo(t_nd1.pos.x, t_nd1.pos.y);
    ctx.lineTo(t_nd2.pos.x, t_nd2.pos.y);
    ctx.strokeStyle = instance.getEdgeColor();
    ctx.stroke();
  }

  function drawNode (t_nd) {
    ctx.fillStyle = instance.getNodeColor();
    ctx.beginPath();
    ctx.arc(t_nd.pos.x, t_nd.pos.y, t_nd.size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = instance.getEdgeColor();
    ctx.stroke();
  }

  var diagnostics = !instance.getDiagnosticsEnabled() ? null : new atc.Diagnostics(instance);

  return {
    doRenderCycle: function () {
      drawBackground();
      var nds = instance.getNodes();
      for (let i = 0; i < nds.length; ++i) {
        var nd = nds[i];
        if (i < nds.length - 1) { // No need to calc edges for last node
          var nbs = instance.getNeighbours(nd.id);
          for (let j = 0; j < nbs.length; ++j) {
            if (nbs[j].id > nd.id) { // Only draw Edges to nodes we have not walked yet
              drawEdge(nd, nbs[j]);
            }
          }
        }
      }
      for (let i = 0; i < nds.length; ++i) {
        drawNode(nds[i]);
      }
      if (instance.getDiagnosticsEnabled()) {
        if (diagnostics !== null) {
          diagnostics.tick();
          diagnostics.drawDiagWindow(ctx, 10, 10);
        } else {
          diagnostics = new atc.Diagnostics(instance);
        }
      }
    }
  };
};

atc.Physics = atc.Physics || function (t_instance) {
  var instance = t_instance;

  function bounceNodesFromWalls () {
    var decay = 1.0; // 0.9;
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
    var radDist = t_nd1.size + t_nd2.size;
    var cnt = 0;
    while (radDist > t_nd1.distanceTo(t_nd2)) { // Move back to point of actual collision
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
    var nds = instance.getNodes();
    var dim = instance.getDimensions();
    var quad = new QuadTree(0, new Rectangle(0, 0, dim.x, dim.y));
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

atc.UserInterface = atc.UserInterface || function (t_el, t_instance) {
  var instance = t_instance;
  var mouseDown = false;
  var focusedNode = null;
  var el = t_el;

  var mouseLastX = null;
  var mouseLastY = null;
  var mouseLastStamp = null;

  function findNode (t_x, t_y) {
    var delta = 5;
    var nds = instance.getNodes();
    for (let i = 0; i < nds.length; ++i) {
      var nd = nds[i];
      if (nd.pos.x + (nd.size + delta) >= t_x && nd.pos.x - (nd.size + delta) <= t_x) {
        if (nd.pos.y + (nd.size + delta) >= t_y && nd.pos.y - (nd.size - delta) <= t_y) {
          return nd;
        }
      }
    }
    return null;
  }

  function onMouseDown (event) {
    mouseDown = true;
    var nd = findNode(event.layerX, event.layerY);
    if (nd !== null) {
      nd.vec = new Vector();
      nd.physics.locked = true;
      focusedNode = nd;
      el.style.cursor = 'move';
      setLastMousePosition(event);
    }
  }

  function onMouseMove (event) {
    if (mouseDown && focusedNode !== null) {
      focusedNode.pos.x = event.layerX;
      focusedNode.pos.y = event.layerY;
      setLastMousePosition(event);
    } else {
      if (findNode(event.layerX, event.layerY) !== null) { // Takes around 0.5 ms
        el.style.cursor = 'pointer';
      } else {
        el.style.cursor = 'default';
      }
    }
  }

  function onMouseUp (event) {
    mouseDown = false;
    if (focusedNode !== null) {
      if (mouseLastX !== null && mouseLastY !== null && mouseLastStamp !== null) {
        var v = new Vector(event.layerX - mouseLastX, event.layerY - mouseLastY);
        v.scaleBy(1000 / (window.performance.now() - mouseLastStamp));
        focusedNode.vec = v;
      } else {
        focusedNode.vec = new Vector();
      }
      focusedNode.physics.locked = false;
      focusedNode = null;
    }
    resetLastMousePosition();
    el.style.cursor = 'default';
  }

  function setLastMousePosition (t_event) {
    if (t_event !== undefined &&
      (mouseLastStamp === null || mouseLastStamp < (window.performance.now() - 100))
    ) {
      mouseLastX = t_event.layerX;
      mouseLastY = t_event.layerY;
      mouseLastStamp = window.performance.now() | 0;
    }
  }
  function resetLastMousePosition () {
    mouseLastX = null;
    mouseLastY = null;
    mouseLastStamp = null;
  }
  return {
    bind: function () {
      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    unbind: function () {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
  };
};

atc.Diagnostics = atc.Diagnostics || function (t_instance) {
  var instance = t_instance;
  var frames = Array(30); // Store last 30 average fps
  var resolution = 2; // 1 equals to 1 per Second, 2 would be 2 per Second
  var idx = 0; // We are implementing a queue so we need a folding index
  var lastSecond = 0;

  function getStampOfSecond () {
    var d = new Date();
    if (resolution === 1) {
      d.setMilliseconds(0);
    } else {
      var ms = d.getMilliseconds();
      var step = (1000 / resolution) | 0;
      ms = ((ms / step) | 0) * step;
      d.setMilliseconds(ms);
    }
    return d.getTime();
  }

  return {
    tick: function () {
      if (lastSecond >= Date.now() - (1000 / resolution)) {
        frames[idx] = frames[idx] + 1;
      } else {
        idx = idx < frames.length - 1 ? idx + 1 : 0;
        frames[idx] = 1;
        lastSecond = getStampOfSecond();
      }
    },
    drawDiagWindow: function (t_ctx, t_x, t_y) {
      var x = 5 + 2 * frames.length;
      var y = 30;
      var maxFPS = instance.getMaxFPS();
      t_ctx.fillStyle = 'rgba(0,0,0,0.5)';
      t_ctx.fillRect(t_x, t_y, x + 40, y);
      for (let i = 0; i < frames.length - 1; ++i) { // Need to render one less
        var j = (idx - 1) - i; // Dont render current idx when starting at i = 0
        if (j < 0) j = frames.length + j;
        var fps = frames[j] * resolution;
        let col = Color.fromHSV(120 * fps / maxFPS, 1, 1);
        t_ctx.fillStyle = col.toRGBString();
        t_ctx.fillRect(t_x + x - i * 2, t_y + 25, -2, -20 * fps / maxFPS);
      }
      var lastFps = frames[idx === 0 ? frames.length - 1 : idx - 1];
      if (lastFps === undefined) lastFps = 0;
      lastFps *= resolution;
      t_ctx.font = '9x Arial';
      var col = Color.fromHSV(120 * lastFps / maxFPS, 1, 1);
      t_ctx.fillStyle = col.toRGBString();
      t_ctx.fillText(lastFps + ' fps', t_x + x + 5, t_y + 12);
      t_ctx.fillStyle = 'white';
      t_ctx.fillText(maxFPS + ' fps', t_x + x + 5, t_y + 24);
    }
  };
};

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

function Rectangle (t_x1, t_y1, t_x2, t_y2) {
  if (t_x1 > t_x2) { let tmp = t_x1; t_x1 = t_x2; t_x2 = tmp; }
  if (t_y1 > t_y2) { let tmp = t_y1; t_y1 = t_y2; t_y2 = tmp; }
  this.x1 = t_x1;
  this.x2 = t_x2;
  this.y1 = t_y1;
  this.y2 = t_y2;
  this.xmid = Math.floor((t_x2 - t_x1) / 2) + t_x1;
  this.ymid = Math.floor((t_y2 - t_y1) / 2) + t_y1;
}

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
QuadTree.prototype.addItems = function (t_arr) {
  for (let i in t_arr) {
    this.addItem(t_arr[i]);
  }
};
QuadTree.prototype.split = function () {
  if (!this.isSplit) {
    this.nodes = Array(4);
    this.nodes[0] = new QuadTree(this.lvl + 1, new Rectangle(0, 0, this.bounds.xmid, this.bounds.ymid)); // TopLeft
    this.nodes[1] = new QuadTree(this.lvl + 1, new Rectangle(this.bounds.xmid, 0, this.bounds.x2, this.bounds.ymid)); // Top right
    this.nodes[2] = new QuadTree(this.lvl + 1, new Rectangle(this.bounds.xmid, this.bounds.ymid, this.bounds.x2, this.bounds.y2)); // Bottom right
    this.nodes[3] = new QuadTree(this.lvl + 1, new Rectangle(0, this.bounds.ymid, this.bounds.xmid, this.bounds.y2)); // Bottom left
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
    this.objects = null;
  }
};
QuadTree.prototype.isSpare = function (t_nd) {
  var fac = 3;
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
  ---|---
  4 | 3
  */
  var xmid = Math.floor((this.bounds.x2 - this.bounds.x1) / 2) + this.bounds.x1;
  var ymid = Math.floor((this.bounds.y2 - this.bounds.y1) / 2) + this.bounds.y1;
  if (t_x > this.bounds.x1 && t_x < xmid) { // Sector 1 or 4
    if (t_y > this.bounds.y1 && t_y < ymid) {
      return 0; // Sector 1
    } else {
      return 3; // Sector 4
    }
  } else {
    if (t_x > this.bounds.y1 && t_y < ymid) {
      return 1; // Sector 2
    } else {
      return 2; // Sector 3
    }
  }
};
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
