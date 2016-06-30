var atc = atc || {};

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
        let col = Color.fromHSV(120 * fps / maxFPS, 1, 1);
        t_ctx.fillStyle = col.toRGBString();
        t_ctx.fillRect(t_x + x - i * 2, t_y + 25, -2, -20 * fps / maxFPS);
      }
      var lastFps = frames[idx === 0 ? frames.length - 1 : idx - 1];
      if (lastFps === undefined) lastFps = 0;
      lastFps *= resolution;
      t_ctx.font = '10px Arial';
      t_ctx.textAlign = 'right';
      var col = Color.fromHSV(120 * lastFps / maxFPS, 1, 1);
      t_ctx.fillStyle = col.toRGBString();
      t_ctx.fillText(lastFps + ' fps', t_x + x + 35, t_y + 12);
      t_ctx.fillStyle = 'white';
      t_ctx.fillText(maxFPS + ' fps', t_x + x + 35, t_y + 24);
    }
  };
};
