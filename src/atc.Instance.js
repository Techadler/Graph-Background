var atc = atc || {};

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
  var quadTree = null;

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
  function mainLoop () {
    if (lastRun === 0 || lastRun < (window.performance.now() | 0) - (1000 / conf.maxFPS) | 0) {
      var ts = window.performance.now() | 0;
      var step = ((1000 | 0) / (conf.maxFPS | 0)) | 0;
      var delta = ts - (lastRun === 0 ? step : lastRun);
      do {
        physics.tick();
      } while ((delta -= step) > step && delta < step * 100);
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

  // Public
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
  this.bounceNodes = function () {
    return conf.bounceNodes;
  };
  this.bounceNodesAtWalls = function () {
    return conf.bounceAtWalls;
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
  this.electricalForce = function () {
    return conf.electricalForce;
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
  this.getDrawQuadTree = function () {
    return conf.drawQuadTree;
  };
  this.getEdgeColor = function () {
    return conf.connectionColor;
  };
  this.getEdgeWidth = function () {
    return conf.edgeWidth;
  };
  this.getEdgesEnabled = function () {
    return conf.edgesEnabled;
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
  this.getNodeBorderColor = function () {
    return conf.nodeBorderColor;
  };
  this.getNodeColor = function () {
    return conf.nodeColor;
  };
  this.getQuadTree = function () {
    return quadTree;
  };
  this.getState = function () {
    return {
      id: id,
      running: loopID !== null
    };
  };
  this.getWallBounceDecay = function () {
    return conf.wallBounceDecay;
  };
  this.onResize = function () {
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
  this.setBounceNodes = function (t_bool) {
    conf.bounceNodes = t_bool;
  };
  this.setDiagnosticsEnabled = function (t_bool) {
    conf.diagnosticsEnabled = t_bool;
  };
  this.setDrawQuadTree = function (t_bool) {
    conf.drawQuadTree = t_bool;
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
      conf.connectionColor = t_col;
    }
  };
  this.setEdgesEnabled = function (t_bool) {
    conf.edgesEnabled = t_bool;
  };
  this.setElectricalForceEnabled = function (t_bool) {
    conf.electricalForce = t_bool;
  };
  this.setNodeColor = function (t_col) {
    if (t_col !== undefined) {
      conf.nodeColor = t_col;
    }
  };
  this.setQuadTree = function (t_tree) {
    quadTree = t_tree;
  };
  this.start = function () {
    loopID = window.requestAnimationFrame(mainLoop);
  };
  this.stop = function () {
    if (loopID !== null) {
      window.cancelAnimationFrame(loopID);
    }
    lastRun = 0;
    loopID = null;
  };

  // Run initialization Code
  setMaxNodes(conf.maxNodes);
  setDimension(t_el);
  populate();
  var render = new atc.Render(t_el, this); // We are calling this here, so we need to make sure that this has all properties by now
  var physics = new atc.Physics(this);
  var ui = new atc.UserInterface(t_el, this);
  if (conf.uiEnabled) {
    ui.bindOn(t_el);
  }
  window.addEventListener('resize', this.onResize);
};
