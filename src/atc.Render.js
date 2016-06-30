var atc = atc || {};

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
    ctx.strokeStyle = instance.getNodeBorderColor();
    ctx.stroke();
  }

  function drawQuadTree (t_tree) {
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'black';
    if (t_tree !== null) {
      if (t_tree.isSplit) {
        var b = t_tree.bounds;
        var c = Color.fromHSV(120 + 40 * t_tree.lvl, 1, 1);
        ctx.strokeStyle = c.toRGBString();
        ctx.lineWidth = 1;
        { // Draw our split axis
          ctx.beginPath();
          ctx.moveTo(b.midx, b.y1);
          ctx.lineTo(b.midx, b.y2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(b.x1, b.midy);
          ctx.lineTo(b.x2, b.midy);
          ctx.stroke();
        }
        ctx.fillText('Spares:' + t_tree.spares.length, b.midx, b.midy);
        for (let i = 0; i < t_tree.nodes.length; ++i) {
          drawQuadTree(t_tree.nodes[i]);
        }
      } else {
        ctx.fillText('Objects:' + t_tree.objects.length, t_tree.bounds.midx, t_tree.bounds.midy);
      }
    }
  }
  var diagnostics = !instance.getDiagnosticsEnabled() ? null : new atc.Diagnostics(instance);

  return {
    doRenderCycle: function () {
      drawBackground();
      if (instance.getDrawQuadTree()) {
        drawQuadTree(instance.getQuadTree());
      }
      var nds = instance.getNodes();
      if (instance.getEdgesEnabled()) {
        for (let i = 0; i < nds.length - 1; ++i) {
          var nd = nds[i];
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
