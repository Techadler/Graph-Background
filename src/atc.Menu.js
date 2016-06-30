var atc = atc || {};

atc.Menu = atc.Menu || function (t_el, t_instance) {
  var canvas = t_el;
  var instance = t_instance;
  var btns = {};

  function buildMenu () {
    if (canvas.parentNode.classList.contains('graph-container')) {
      var createBtn = function (t_className, t_enabled, t_title) {
        t_enabled = t_enabled === undefined ? true : t_enabled;
        let li = document.createElement('li');
        li.classList.add('button');
        if (!t_enabled) li.classList.add('disabled');
        let i = document.createElement('i');
        i.classList.add('fa', t_className);
        li.appendChild(i);
        if (t_title !== undefined) li.setAttribute('title', t_title);
        return li;
      };
      let ul = document.createElement('ul');
      { // Settings cog
        let btn = createBtn('fa-cog');
        ul.appendChild(btn);
      }
      { // Show QuadTree
        let btn = createBtn('fa-th-large', instance.getDrawQuadTree(), 'Show QuadTree');
        btns.quadTree = btn;
        btn.addEventListener('click', onToggleShowQuadTree);
        ul.appendChild(btn);
      }
      { // Enable Diagnostics
        let btn = createBtn('fa-bar-chart', instance.getDiagnosticsEnabled(), 'Enable Diagnostics');
        btns.diagnostics = btn;
        btn.addEventListener('click', onToggleDiagnostics);
        ul.appendChild(btn);
      }
      { // Enable Collisions
        let btn = createBtn('fa-compress', instance.bounceNodes(), 'Enable Collisions');
        btns.bounceNodes = btn;
        btn.addEventListener('click', onToggleBounceNodes);
        ul.appendChild(btn);
      }
      { // Enable Electrical Force
        let btn = createBtn('fa-arrows-h', instance.electricalForce(), 'Enable Electrical Interaction');
        btns.electricalForce = btn;
        btn.addEventListener('click', onToggleElectricalForce);
        ul.appendChild(btn);
      }
      { // Enable Connections
        let btn = createBtn('fa-link', instance.getEdgesEnabled(), 'Enable Connections');
        btns.edgesEnabled = btn;
        btn.addEventListener('click', onToggleEdges);
        ul.appendChild(btn);
      }
      { // Play Pause
        let btn = createBtn('fa-play', true, 'Play/Pause');
        btns.play = btn;
        btn.addEventListener('click', onTogglePlay);
        ul.appendChild(btn);
      }
      canvas.parentNode.appendChild(ul);
    }
  }
  function onToggleBounceNodes () {
    var btn = btns.bounceNodes;
    if (instance.bounceNodes()) {
      btn.classList.add('disabled');
      instance.setBounceNodes(false);
    } else {
      btn.classList.remove('disabled');
      instance.setBounceNodes(true);
    }
  }
  function onToggleDiagnostics () {
    var btn = btns.diagnostics;
    if (instance.getDiagnosticsEnabled()) {
      btn.classList.add('disabled');
      instance.setDiagnosticsEnabled(false);
    } else {
      btn.classList.remove('disabled');
      instance.setDiagnosticsEnabled(true);
    }
  }
  function onToggleEdges () {
    var btn = btns.edgesEnabled;
    if (instance.getEdgesEnabled()) {
      btn.classList.add('disabled');
      instance.setEdgesEnabled(false);
    } else {
      btn.classList.remove('disabled');
      instance.setEdgesEnabled(true);
    }
  }
  function onToggleElectricalForce () {
    var btn = btns.electricalForce;
    if (instance.electricalForce()) {
      btn.classList.add('disabled');
      instance.setElectricalForceEnabled(false);
    } else {
      btn.classList.remove('disabled');
      instance.setElectricalForceEnabled(true);
    }
  }
  function onTogglePlay () {
    var btn = btns.play;
    var i = btn.firstChild;
    if (instance.getState().running) {
      i.classList.remove('fa-play');
      i.classList.add('fa-pause');
      instance.stop();
    } else {
      i.classList.remove('fa-pause');
      i.classList.add('fa-play');
      instance.start();
    }
  }
  function onToggleShowQuadTree () {
    var btn = btns.quadTree;
    if (instance.getDrawQuadTree()) {
      btn.classList.add('disabled');
      instance.setDrawQuadTree(false);
    } else {
      btn.classList.remove('disabled');
      instance.setDrawQuadTree(true);
    }
  }

  // Public
  this.destroy = function () {

  };

  // Initialize
  buildMenu();
};
