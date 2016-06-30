var atc = atc || {};

atc.UserInterface = atc.UserInterface || function (t_el, t_instance) {
  var instance = t_instance;
  var menu = new atc.Menu(t_el, t_instance);
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
    bindOn: function () {
      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    unbind: function () {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    },
    destroy: function () {
      menu.destroy();
    }
  };
};
