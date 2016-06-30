var atc = atc || {};

atc.manager = atc.manager || (function () {
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
    var defConf = atc.manager.getDefaultConfig();
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
      atc.manager.stopInstance(t_id);
      instances[t_id].destroy();
      delete instances[t_id];
    },
    getDefaultConfig: function () {
      return {
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
        enableMenu: true,
        diagnosticsEnabled: true,

        maxEdges: 100,
        maxEdgeLength: 150,
        maxFPS: 60,
        maxNodes: 100,
        maxSpeed: 20
      };
    }
  };
})();
