/*The MIT License (MIT)

Copyright (c) 2016 Carsten Rattay

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
var grh = grh || {
  ctx: null,
  nds: [],
  mtx: [],
  dim: { x:1900, y:500 },
  nodeCount: 120,
  maxEdges:100,
  maxEdgLen: 150,
  maxSpeed: 20,
  colEdge: "#e4e4e4",
  colNode: "#ffffff",
  colBack: "#0d6aa4",//#1286d0
  nodeSize: 2,
  lineWidth: 1.5,
  tps: 30,
  gravEnabled: false,
  gravFac: 0.0001,
  fps: 30,

  addNode: function(t_initial){
    t_initial = t_initial || false;
    for(var i = 0; i < grh.nodeCount; ++i){
      if(grh.nds[i] === undefined || grh.nds[i] === null){
        var nd = {
          id: i,
          size: (Math.floor(Math.random() * grh.nodeSize + 2)), //Size between 1 and 5
          pos: {},
          vec: {}
        };
        var max = grh.maxSpeed;//max-speed
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
        return nd;
      }
    }
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
  setEdge: function(t_id1, t_id2, t_bool){
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

      //Diagnostics
      if(grh.diagnostics.writeTick !== undefined){
        grh.diagnostics.writeTick();
        grh.diagnostics.drawDiag();
      }


      var diff = (1000 / grh.fps) - (new Date().getTime() - begin);
      if(diff > 0){
        setTimeout(grh.render, diff);
      }else{
        console.log("Frame rendering took " + Math.abs(diff) +"ms too long!");
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
      var d = grh.dist(t_nd1, t_nd2);
      var fac = (1 - (d * d) / Math.pow(grh.maxEdgLen, 2));
      if(fac >= 1 || fac < 0){ fac = 0.00001; } //prevent underflow, so lineWidth does not fallback to default
      grh.ctx.lineWidth = grh.lineWidth * fac;
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
  dist: function(t_nd1, t_nd2){
    var x = t_nd1.pos.x - t_nd2.pos.x;
    var y = t_nd1.pos.y - t_nd2.pos.y;
    return Math.sqrt(x*x + y*y);
  },
  resize: function(){
    grh.drawBackground();
    grh.dim.x = window.innerWidth;
    grh.dim.y = window.innerHeight;
    if(grh.diagnostics !== undefined){
      grh.diagnostics.diagX = grh.dim.x - 100;
      grh.diagnostics.diagY = grh.dim.y - 40;
    }
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
    if(grh.gravEnabled)
      grh.tick.applyGravity();
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
    for(var i = 0; i < grh.nodeCount -1; ++i){ //Letzte muss nicht geprÃƒÂ¼ft werden
      var nb = grh.getNeighbours(i);
      for(var j = 0; j < nb.length; ++j){
        if(dist(grh.nds[i], nb[j]) > edglen) //Make the edges pop at greater distances
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
  applyGravity: function(){
    var mass = function(t_r){
      return 1.33 * Math.PI * Math.pow(t_r, 3);
    };
    var direction = function(t_nd1, t_nd2){
      var m = {};
      m.x = t_nd2.pos.x - t_nd1.pos.x;
      m.y = t_nd2.pos.y - t_nd1.pos.y;
      m.len = Math.sqrt(m.x * m.x + m.y * m.y);
      return m;
    };
    var grav = function(t_s1, t_s2, dist){
      var f = mass(t_s1) * mass(t_s2)  / Math.pow(dist, 2);
      return f * grh.gravFac;
    };
    for(var i = 0; i < grh.nodeCount -1; ++i){
      var nd = grh.nds[i];
      nd.tvec = nd.tvec || { 'x': 0, 'y': 0};
      for(var j = i+1; j < grh.nodeCount; ++j){
        var nd2 = grh.nds[j];
        nd2.tvec = nd2.tvec || { 'x': 0, 'y': 0};
        var d = grh.dist(nd, nd2);
        if(d < grh.maxEdgLen){
          var f = grav(nd.size, nd2.size, d);
          //Betrag v: f/m * t
          var m = direction(nd, nd2);
          var cor = (f/mass(nd.size) * (1000/grh.tps) ) / m.len; //Korrekturfaktor fÃ¼r m
          //console.log("m.len: " + m.len + "  cor: " + cor + "    v:" + m.len * cor);
          nd.tvec.x += m.x * cor;
          nd.tvec.y += m.y * cor;
          m.x = m.x * -1; m.y = m.y * -1; //Switch direction for other node
          cor = (f/mass(nd2.size) * 1000/grh.tps) / m.len;
          nd2.tvec.x += m.x * cor;
          nd2.tvec.y += m.y * cor;
        }
      }
    }
    //Apply Vectors
    for(var i = 0; i < grh.nodeCount; ++i){
      var nd = grh.nds[i];
      //console.log(nd.tvec);
      nd.vec.x += nd.tvec.x;
      nd.vec.y += nd.tvec.y;
      nd.tvec = null;
    }
  },
  moveNodes: function(){
    for(var i = 0; i < grh.nodeCount; i++){
      var nd = grh.nds[i];
      nd.pos.x += nd.vec.x * (1 / grh.tps);
      nd.pos.y += nd.vec.y * (1 / grh.tps);
    }
  }
};

grh.diagnostics = grh.diagnostics || {
  fpsOT: Array(30), //stores the last X seconds of fps
  fpsOT_idx: 0,
  fpsOT_lastSecond: 0,
  diagX: 20,
  diagY: 20,
  diagBackCol: "rgba(0,0,0, 0.5)",
  writeTick: function(){
    var curMS = function(){ return Date.now();};
    var begOfSecond = function(){var date = new Date(); date.setMilliseconds(0); return date.getTime();}
    var d = grh.diagnostics;

    //Check if idx points to current second
    if(d.fpsOT_lastSecond < curMS() - 1000){
      ++d.fpsOT_idx;
      if(d.fpsOT_idx == d.fpsOT.length) d.fpsOT_idx = 0;
      d.fpsOT_lastSecond = begOfSecond();
      d.fpsOT[d.fpsOT_idx] = 0;
    }else{
      d.fpsOT[d.fpsOT_idx]++;
    }
  },
  drawDiag: function(){
    if(grh.ctx !== undefined){
      var d = grh.diagnostics;
      grh.ctx.fillStyle = d.diagBackCol;
      grh.ctx.fillRect(d.diagX, d.diagY, d.fpsOT.length * 2 + 35,  30);

      var xRight = d.diagX + d.fpsOT.length * 2;
      var yBot = d.diagY + 25;
      for(var i = 0; i < d.fpsOT.length -1; i++){ //Dont render current frame stats
        var idx = (d.fpsOT_idx -1 ) - i; //Dont render current bar
        if(idx < 0) idx = (d.fpsOT.length) + idx;
        var x = xRight -2 * i;
        var fps = d.fpsOT[idx] /grh.fps;
        //HSVtoRGB(0,1,1); Red //HSVtoRGB(120,1,1) //Green
        grh.ctx.fillStyle = RedToGreenGrad(fps);
        grh.ctx.fillRect(x-2, yBot, 2, -20 * ( d.fpsOT[idx] /grh.fps ));
      }

      grh.ctx.font = "9px Arial";
      grh.ctx.fillStyle = "white";
      var cfps = d.fpsOT[ d.fpsOT_idx == 0 ? d.fpsOT.length -1 : d.fpsOT_idx -1 ] || 0;
      grh.ctx.fillText(grh.fps + " fps", xRight + 5, yBot -15); //Top fps
      grh.ctx.fillStyle = RedToGreenGrad(cfps / grh.fps);
      grh.ctx.fillText(cfps + " fps", xRight + 5, yBot); //Bot/cur fps
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
var HSVtoRGB = function(t_H, t_S, t_V){ // t_H [0, 360], t_S, t_V [0,1]
  var h = Math.round(t_H / 60);
  var f = t_H / 60 - h;
  var p = t_V * (1 - t_S);
  var q = t_V * (1 - t_S * f);
  var t = t_V * (1 - t_S * (1-f));
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
};
var RedToGreenGrad = function(t_fac){
  var rgb = HSVtoRGB(120 * t_fac, 1, 1);
  return "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";
}
window.addEventListener('load', grh.init);
window.addEventListener('resize', grh.resize);
