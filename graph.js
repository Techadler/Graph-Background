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
        backColor: '#0d6aa4', // #1286d0
        nodeMinSize: 2,
        nodeMaxSize: 5,
        edgeWidth: 1.5,
        density: 9000, // Smaller is denser

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

function Node (t_id, t_minSize, t_maxSize, t_pos, t_vec) {
  this.id = t_id;
  t_minSize = t_minSize || 2;
  t_maxSize = t_maxSize || 5;
  this.size = Math.random() * Math.abs(t_maxSize - t_minSize) + Math.abs(t_minSize);
  this.pos = t_pos || {x: 0, y: 0};
  this.vec = t_vec || {x: 0, y: 0};
}
Node.prototype.distanceTo = function (t_nd) {
  var x = t_nd.pos.x - this.pos.x;
  var y = t_nd.pos.y - this.pos.y;
  return Math.sqrt(x * x + y * y);
};

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
    var vec = {};
    vec.x = Math.random() * 2 * conf.maxSpeed - conf.maxSpeed;
    vec.y = Math.random() * 2 * conf.maxSpeed - conf.maxSpeed;
    return vec;
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
  this.setEdge = function (t_id1, t_id2, t_bool) {
    mtx[t_id1][t_id2] = t_bool;
    mtx[t_id2][t_id1] = t_bool;
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
      // var begin = window.performance.now();
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
      // var deltaEdges = window.performance.now() - begin;
      // var beginNodes = window.performance.now();
      for (let i = 0; i < nds.length; ++i) {
        drawNode(nds[i]);
      }
      if (diagnostics !== null) {
        diagnostics.tick();
        diagnostics.drawDiagWindow(ctx, 10, 10);
      }
      // var deltaNodes = window.performance.now() - beginNodes;
      // var delta = window.performance.now() - begin;
      // console.log('Render took: ' + Math.round(delta, 2) + 'ms' + ' Edges: ' + Math.round(deltaEdges, 2) + 'ms  Nodes: ' + Math.round(deltaNodes, 2) + 'ms');
    }
  };
};

atc.Physics = atc.Physics || function (t_instance) {
  var instance = t_instance;

  function removeNodesOutOfBox () {
    var nds = instance.getNodes();
    var dim = instance.getDimensions();
    var rem = 0;
    for (let i = 0; i < nds.length; ++i) {
      if (nds[i] === null) { console.log('nds null at: ' + i + ' nds.length = ' + nds.length); }
      if (nds[i].pos.x < 0 || nds[i].pos.x > dim.x || nds[i].pos.y < 0 || nds[i].pos.y > dim.y) {
        instance.removeNode(i);
        ++rem;
      }
    }
    for (let i = 0; i < rem; ++i) {
      instance.addNode();
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

  function moveNodes () {
    var nds = instance.getNodes();
    var speedFactor = 1 / instance.getMaxFPS();
    for (let idx = 0; idx < nds.length; ++idx) {
      nds[idx].pos.x += nds[idx].vec.x * speedFactor;
      nds[idx].pos.y += nds[idx].vec.y * speedFactor;
    }
  }

  return {
    tick: function () {
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
      nd.vecBak = nd.vec;
      nd.vec = {x: 0, y: 0};
      focusedNode = nd;
      el.style.cursor = 'move';
    }
  }

  function onMouseMove (event) {
    if (mouseDown && focusedNode !== null) {
      focusedNode.pos.x = event.layerX;
      focusedNode.pos.y = event.layerY;
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
      focusedNode.vec = focusedNode.vecBak;
      delete focusedNode.vecBak;
      focusedNode = null;
    }
    el.style.cursor = 'default';
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
  function HSVtoRGB (t_H, t_S, t_V) { // t_H [0, 360], t_S, t_V [0,1]
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
    return rgb;
  }

  function RGBtoString (t_rgb) {
    return 'rgb(' + t_rgb.r + ',' + t_rgb.g + ',' + t_rgb.b + ')';
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
        t_ctx.fillStyle = RGBtoString(HSVtoRGB(120 * fps / maxFPS, 1, 1));
        t_ctx.fillRect(t_x + x - i * 2, t_y + 25, -2, -20 * fps / maxFPS);
      }
      var lastFps = frames[idx === 0 ? frames.length - 1 : idx - 1] * resolution;
      if (lastFps === undefined) lastFps = 0;
      t_ctx.font = '9x Arial';
      t_ctx.fillStyle = RGBtoString(HSVtoRGB(120 * lastFps / maxFPS, 1, 1));
      t_ctx.fillText(lastFps + ' fps', t_x + x + 5, t_y + 12);
      t_ctx.fillStyle = 'white';
      t_ctx.fillText(maxFPS + ' fps', t_x + x + 5, t_y + 24);
    }
  };
};
