var atc = atc || {};

atc.Config = atc.Config || function () {
  var defaults = {
    connectionColor: '#474747',
    nodeColor: '#ffffff',
    nodeBorderColor: '#474747',
    backColor: '#0a89cc',
    nodeMinSize: 4,
    nodeMaxSize: 8,
    edgeWidth: 1.5,
    edgesEnabled: true,
  // Physics
    electricalForce: false,
    bounceNodes: true,
    bounceAtWalls: true,
    wallBounceDecay: 0.9,
    drawQuadTree: false,

    height: 0,
    maxHeight: 0,
    width: 0,
    maxWidth: 0,

    uiEnabled: true,
    iagnosticsEnabled: true,

    maxEdges: 100,
    maxEdgeLength: 150,
    maxFPS: 60,
    maxNodes: 100,
    maxSpeed: 20
  };

  this.conf = null;

  this.parseConfig = function (t_conf) {
    if (t_conf !== undefined) {
      var allKeys = Object.keys(defaults);
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
          t_conf[key] = defaults[key];
        }
      }
    } else {
      t_conf = defaults;
    }
    this.conf = t_conf;
  };
};
