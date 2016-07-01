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

  // Public
  return {
    createInstance: function (t_el, t_conf) {
      if (t_el === undefined || t_el.nodeName !== 'CANVAS') {
        console.log('Passed element is not a canvas!'); return;
      }
      var conf = new atc.Config();
      conf.parseConfig(t_conf);
      var id = generateID();
      instances[id] = new atc.Instance(t_el, conf, id);
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
