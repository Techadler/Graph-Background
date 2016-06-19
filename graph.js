var grh = grh || {
  ctx: null,
  nds: [],
  mtx: [],
  dim: { x:1900, y:500 },
  nodeCount: 120,
  maxEdges:2,
  maxEdgLen: 125,
  colEdge: "#e4e4e4",
  colNode: "#ffffff",
  colBack: "#0d6aa4",//#1286d0
  tps: 20,
  fps: 30,

  addNode: function(t_initial){
    t_initial = t_initial || false;
    for(var i = 0; i < grh.nodeCount; ++i){
      if(grh.nds[i] === undefined || grh.nds[i] === null){
        var nd = {
          id: i,
          size: (Math.floor(Math.random() * 3 + 2)), //Size between 1 and 5
          pos: {},
          vec: {}
        };
        var max = 0.5;//max-speed
        if(t_initial){
          nd.pos.x = rnd.between(0, grh.dim.x);
          nd.pos.y = rnd.between(0, grh.dim.y);
          nd.vec.x = rnd.between(-max, max);
          nd.vec.y = rnd.between(-max, max);
        }else{
          //Spawn it at the edge of our container with an inwards direction
          if(Math.random() > 0.5){ //spawn on X-Border
            nd.pos.x = rnd.between(0, grh.dim.x);
            nd.pos.y = rnd.either(0, grh.dim.y); //Top or bottom border
            nd.vec.x = rnd.between(-max, max);
            nd.vec.y = nd.pos.y == 0 ? rnd.between(0, max) : rnd.between(-max, 0);
          }else{
            nd.pos.x = rnd.either(0, grh.dim.x); //Left or right border
            nd.pos.y = rnd.between(0, grh.dim.y);
            nd.vec.x = nd.pos.x == 0 ? rnd.between(0, max) : rnd.between(-max, 0);
            nd.vec.y = rnd.between(-max, max);
          }
        }
        grh.nds[i] = nd;
        //console.log("Spawned Node: " + i);
        //console.log(nd);
        return nd;
      }
    }
    console.log("No free index, not spawning any nodes");
  },
  getContext: function(){
    if(grh.ctx === null || grh.ctx === undefined){
      var el = document.getElementById('canvas');
      el.setAttribute("width", grh.dim.x);
      el.setAttribute("height", grh.dim.y);
      grh.ctx = el.getContext('2d');
    }
  },
  getNeighbours: function(t_id){
    var n = []; var x = 0;
    for(var i = 0; i < grh.nodeCount; ++i){
      if(grh.mtx[t_id][i] === true)
      {
        n[x] = grh.nds[i];
        ++x;
      }
    }
    return n;
  },
  removeNode: function(t_id){
    //console.log("Removing node: " +t_id);
    var nb = grh.getNeighbours(t_id);
    for(var i = 0; i < nb.length; ++i){
      grh.setEdge(t_id, nb[i].id, false);
    }
    grh.nds[t_id] = null;
  },
  setEdge: function(t_id1, t_id2, t_bool)
  {
    grh.mtx[t_id1][t_id2] = t_bool;
    grh.mtx[t_id2][t_id1] = t_bool;
  },
  render: function(){
    if(grh.ctx !== null){
      var begin = new Date().getTime();
      grh.drawBackground();

      for(var i = 0; i < grh.nodeCount; ++i){
        var nd = grh.nds[i];
        if(i < grh.nodeCount -1){ //draw Edges
          var nb = grh.getNeighbours(i);
          for(var j = 0; j < nb.length; ++j){
            if(nb[j].id > i){
              grh.drawEdge(nd, nb[j]);
            }
          }
        }
        grh.drawNode(nd);
      }

      var diff = (1000 / grh.fps) - (new Date().getTime() - begin);
      if(diff > 0){
        setTimeout(grh.render, diff);
      }else{
        console.log("Frame rendering took " + diff +"ms too long!");
        grh.render();
      }
    }
  },
  drawBackground: function(){
    if(grh.ctx !== null){
      grh.ctx.clearRect(0, 0, grh.dim.x, grh.dim.y);
      grh.ctx.fillStyle = grh.colBack;
      grh.ctx.fillRect(0, 0, grh.dim.x, grh.dim.y);
    }
  },
  drawEdge: function(t_nd1, t_nd2){
    if(grh.ctx !== null){
      grh.ctx.lineWidth = 1;
      grh.ctx.shadowBlur = 0;
      grh.ctx.beginPath();
      grh.ctx.moveTo(t_nd1.pos.x, t_nd1.pos.y);
      grh.ctx.lineTo(t_nd2.pos.x, t_nd2.pos.y);
      grh.ctx.strokeStyle = grh.colEdge;
      grh.ctx.stroke();
    }
  },
  drawNode: function(t_nd){
    if(grh.ctx !== null && t_nd !== null){
      grh.ctx.fillStyle = grh.colNode;
      grh.ctx.strokeStyle = grh.colNode;
      grh.ctx.beginPath();
      grh.ctx.arc(t_nd.pos.x, t_nd.pos.y, t_nd.size, 0, 2 * Math.PI);
      grh.ctx.stroke();
      grh.ctx.fill();
    }
  },
  resize: function(){
    grh.drawBackground();
    grh.dim.x = window.innerWidth;
    grh.dim.y = window.innerHeight;
    if(grh.ctx !== null){
      grh.ctx.canvas.width = grh.dim.x;
      grh.ctx.canvas.height = grh.dim.y;
    }
  },
  init: function(){
    grh.resize();

    grh.nodeCount = Math.floor(grh.dim.x * grh.dim.y / 12000);
    //Init Matrix
    grh.mtx = [];
    for(var i = 0; i < grh.nodeCount; ++i){
      grh.mtx[i] = [];
      for(var j = 0; j < grh.nodeCount; ++j){
        grh.mtx[i][j] = false;
      }
    }
    //Add Nodes
    for(var i = 0; i < grh.nodeCount; ++i){
      grh.addNode(true);
    }
    //Add Edges
    grh.tick.checkEdges();

    grh.getContext();

    grh.render();
    grh.tick.start();
  }
}

grh.tick = grh.tick || {
  start: function(){
    grh.tick.tick();
  },
  tick: function(){
    var begin = new Date().getTime();

    if(rnd.between(0, 1) > 0.66){
      grh.tick.checkHitbox();
      grh.tick.checkEdges();
    }

    grh.tick.moveNodes();

    var diff = (1000 / grh.tps) - (new Date().getTime() - begin);
    if(diff > 0){
      setTimeout(grh.tick.tick, diff);
    }else{
      console.log("Tick took " + Math.abs(diff)+"ms too long!");
      grh.tick.tick();
    }
  },
  checkHitbox: function(){
    var rem = 0;
    for(var i = 0; i < grh.nodeCount; i++){
      var nd = grh.nds[i];
      if( nd.pos.x < 0 || nd.pos.x > grh.dim.x
        ||nd.pos.y < 0 || nd.pos.y > grh.dim.y ){
        grh.removeNode(i);
        ++rem;
      }
    }
    for(var i = 0; i < rem; ++i){
      grh.addNode();
    }
  },
  checkEdges: function(){
    var dist = function(t_nd1, t_nd2){
      var x = t_nd1.pos.x - t_nd2.pos.x;
      var y = t_nd1.pos.y - t_nd2.pos.y;
      return Math.sqrt(x*x + y*y);
    }
    var edglen = grh.maxEdgLen;
    for(var i = 0; i < grh.nodeCount -1; ++i){ //Letzte muss nicht geprüft werden
      var nb = grh.getNeighbours(i);
      for(var j = 0; j < nb.length; ++j){
        if(dist(grh.nds[i], nb[j]) > edglen * 1.5) //Make the edges pop at greater distances
          grh.setEdge(i, nb[j].id, false);
      }
    }
    for(var i = 0; i < grh.nodeCount -1;++i){
      var nd = grh.nds[i];
      var edges = grh.getNeighbours(i).length;
      for(var j = i +1; j < grh.nodeCount; ++j){
        if(dist(nd, grh.nds[j]) < edglen && edges < grh.maxEdges){
          if(grh.getNeighbours(j).length < grh.maxEdges){
            grh.setEdge(nd.id, j, true);
            ++edges;
          }
        }
      }
    }
  },
  moveNodes: function(){
    for(var i = 0; i < grh.nodeCount; i++){
      var nd = grh.nds[i];
      nd.pos.x += nd.vec.x;
      nd.pos.y += nd.vec.y;
    }
  }
};


var rnd = {
  between: function(low, high){
    if(low > high) {var t = low; low = high; high = t;}
    var diff = Math.abs(high - low);
    return (Math.random() * diff) + low;
  },
  betweenInt: function(low, high){
    return Math.round(rnd.between(low,high));
  },
  either: function(x, y){
    return Math.random() > 0.5 ? x : y;
  }
};

window.addEventListener('load', grh.init);
window.addEventListener('resize', grh.resize);
