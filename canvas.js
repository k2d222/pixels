export class PixelGrid {

  // sizeX; sizeY;
  // pixels;

  constructor(sizeX, sizeY) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.pixels = [];

    for (var i = 0; i < sizeX; i++) {
      this.pixels[i] = [];
      for (var j = 0; j < sizeY; j++) {
        this.pixels[i][j] = [];
        for (var k = 0; k < 3; k++) { // RGB
          this.pixels[i][j][k] = Math.floor( Math.random() * 256 );
        }
      }
    }
  }
}

PixelGrid.prototype.getPixelColor = function(x, y) {
  if(x >= this.pixels.length || y >= this.pixels[0].length || x < 0 || y < 0) {
    return 'black';
  }
  else {
    let color = this.pixels[x][y];
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }
}




export class CanvasManager {

  // dragLastX; dragLastY;
  // posX; posY;
  // scale; scaleMin; scaleMax;
  // canvas; $canvas; ctx;
  // grid;
  // touchDistance;
  // drawFrameLastID;
  // drawLast;
  // drawIdle;

  constructor(grid, canvas) {
    this.grid = grid;
    this.canvas = canvas;
    this.$canvas = $(canvas);
    this.ctx = canvas.getContext('2d', { alpha: false});
    this.ctx.imageSmoothingEnabled = false;

    this.posX = this.posY = 0;
    this.scale = 1;
    this.minScale = 1;
    this.maxScale = 10;

    this.drawIdle = false;
    this.drawQueue = [];
    this.drawUpdatePerFrame = 100;

    for (var i = 0; i < this.grid.sizeX; i++) {
      this.drawQueue[i] = [];
    }

    this._createListeners();

    this.draw();
  }
}

CanvasManager.prototype._createListeners = function() {
  let $canvas = $(canvas);

  $canvas.on('touchstart', (e) => { // mobile
    this._touchstart(e);
    $canvas.on('touchmove', (e) => this._touchmove(e));
  })
  $canvas.on('touchend', () => {
    $canvas.off('touchmove');
  });

  $canvas.on('mousedown', (e) => { // desktop
    this._mousedown(e);
    $canvas.on('mousemove', (e) => this._mousemove(e));
  })
  $canvas.on('mouseup', () => {
    $canvas.off('mousemove');
  });
  $canvas.on('wheel', (e) => this._wheel(e));

}

// ------------ desktop events --------------------------------
CanvasManager.prototype._mousedown = function(e) {
  this._dragStart(e.clientX, e.clientY);
}

CanvasManager.prototype._mousemove = function(e) {
  this._drag(e.clientX, e.clientY);
}

CanvasManager.prototype._wheel = function(e) {
  let direction = e.originalEvent.deltaY < 0 ? -1 : 1;
  this._zoom(0.1 * direction, e.clientX, e.clientY);
}

// ------------ mobile events --------------------------------
CanvasManager.prototype._touchstart = function(e) {
  if(e.touches.length === 1) {
    this._dragStart(e.touches[0].clientX, e.touches[0].clientY);
  }
  else if(e.touches.length === 2) {
    let distX = e.touches[0].clientX - e.touches[1].clientX;
    let distY = e.touches[0].clientY - e.touches[1].clientY;
    this.touchDistance = Math.sqrt(distX*distX + distY*distY);
  }
}

CanvasManager.prototype._touchmove = function(e) {
  e.preventDefault();
  if(e.touches.length === 1) {
    this._drag(e.touches[0].clientX, e.touches[0].clientY)
  }
  else if(e.touches.length === 2) {
    let posX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    let posY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    let distX = e.touches[0].clientX - e.touches[1].clientX;
    let distY = e.touches[0].clientY - e.touches[1].clientY;
    let distance = Math.sqrt(distX*distX + distY*distY);
    let delta = (distance - this.touchDistance) / this.scale * 0.1;
    this._zoom(delta, posX, posY);
    this.touchDistance = distance;
  }
}

// ------------------------------------------------------------
CanvasManager.prototype._zoom = function(factor, posX, posY) {
  let delta = factor * this.scale;

  if(this.scale + delta > this.maxScale) delta = this.maxScale - this.scale;
  if(this.scale + delta < this.minScale) delta = this.minScale - this.scale;

  let x = posX / this.$canvas.width() * this.canvas.width;
  let y = posY / this.$canvas.height() * this.canvas.height;

  let centerX = x / this.scale + this.posX; // centre d'homotétie
  let centerY = y / this.scale + this.posY;

  this.scale += delta;

  this.posX = centerX - posX / this.$canvas.width() * this.canvas.width / this.scale;
  this.posY = centerY - posY / this.$canvas.height() * this.canvas.height / this.scale;

  this.draw();
}

CanvasManager.prototype._dragStart = function(x, y) {
  this.dragLastX = x / this.$canvas.width() * this.canvas.width;
  this.dragLastY = y / this.$canvas.height() * this.canvas.height;
}

CanvasManager.prototype._drag = function(x, y) {
  let deltaX = x / this.$canvas.width() * this.canvas.width - this.dragLastX;
  let deltaY = y / this.$canvas.height() * this.canvas.height - this.dragLastY;

  this.dragLastX = x / this.$canvas.width() * this.canvas.width;
  this.dragLastY = y / this.$canvas.height() * this.canvas.height;

  this.posX -= deltaX / this.scale;
  this.posY -= deltaY / this.scale;

  this.draw();
}

// ------------------------------------------------------------

CanvasManager.prototype.update = function() {
  cancelAnimationFrame(this._drawFrame);
  this.drawFrameLastID = requestAnimationFrame(() => {
    this._draw_not_optimized();
    this.drawLast = {
      x: this.posX,
      y: this.posY,
      scale: this.scale
    };
  });
}

CanvasManager.prototype.draw = function() {
  this.drawIdle = false;
  cancelAnimationFrame(this._drawFrame);
  this.drawFrameLastID = requestAnimationFrame(() => {
    if(typeof this.drawLast === 'undefined') this._draw_not_optimized();
    else if(this.drawLast.scale === this.scale) this._draw_optimized_translation();
    // else if(this.drawLast.scale !== this.scale) this._draw_optimized_scale();
    else this._draw_not_optimized();
    this._draw_contour();
    this.drawIdle = true;
    this._draw_async();


    this.drawLast = {
      x: this.posX,
      y: this.posY,
      scale: this.scale
    };
  });
}

CanvasManager.prototype._draw_contour = function() {
  this.ctx.fillStyle = 'black';

  let canvasW = this.canvas.width;
  let canvasH = this.canvas.height;
  let startX = this.posX * this.scale;
  let startY = this.posY * this.scale;
  let endX = this.posX * this.scale + canvasW;
  let endY = this.posY * this.scale + canvasH;
  let maxX = this.grid.sizeX * this.scale;
  let maxY = this.grid.sizeY * this.scale;

  if(startX < 0) {
    this.ctx.fillRect(0, 0, -startX, canvasH);
  }
  if(startY < 0) {
    this.ctx.fillRect(0, 0, canvasW, -startY);
  }
  if(endX > maxX) {
    this.ctx.fillRect(canvasW - endX + maxX, 0, endX - maxX, canvasH);
  }
  if(endY > maxY) {
    this.ctx.fillRect(0, canvasH - endY + maxY, canvasW, endY - maxY);
  }
}

CanvasManager.prototype._draw_optimized_translation = function() {
  let canvasW = this.canvas.width;
  let canvasH = this.canvas.height;

  let deltaX = (this.drawLast.x - this.posX) * this.scale;
  let deltaY = (this.drawLast.y - this.posY) * this.scale;
  let maxX = canvasW + deltaX - this.scale; // TODO 2* is a quickfix
  let maxY = canvasH + deltaY - this.scale;
  let minX = deltaX;
  let minY = deltaY;

  this.ctx.drawImage(this.canvas, deltaX, deltaY);

  this._foreachVisiblePixel((i, j) => {
    let pixelX = gridToPixel(i, this.posX, this.scale);
    let pixelY = gridToPixel(j, this.posY, this.scale);

    if(pixelX >= maxX || pixelY >= maxY || pixelX < minX || pixelY < minY) {
      this._addToQueue(i, j);
    }
  });
}

CanvasManager.prototype._draw_optimized_scale = function() {
  let deltaX = (this.drawLast.x - this.posX) * this.scale;
  let deltaY = (this.drawLast.y - this.posY) * this.scale;

  this.ctx.resetTransform();
  this.ctx.translate(deltaX, deltaY);
  this.ctx.scale(this.scale / this.drawLast.scale, this.scale / this.drawLast.scale);
  this.ctx.drawImage(this.canvas, 0, 0);
  this.ctx.resetTransform();

  this._foreachVisiblePixel((i, j) => {
    let pixelX = gridToPixel(i, this.posX, this.scale);
    let pixelY = gridToPixel(j, this.posY, this.scale);
    this._addToQueue(i, j);
  });
}

CanvasManager.prototype._draw_not_optimized = function() {

  this._foreachVisiblePixel((i, j) => {
    let pixelX = gridToPixel(i, this.posX, this.scale);
    let pixelY = gridToPixel(j, this.posY, this.scale);
    this.ctx.fillStyle = this.grid.getPixelColor(i, j);
    this.ctx.fillRect(pixelX, pixelY, this.scale, this.scale);
  });
}

CanvasManager.prototype._draw_async = function() {
  let i = 0, j = 0;
  let count = 0;

  let draw = () => {
    if(!this.drawIdle) return;

    for (; i < this.drawQueue.length; i++) {
      for (; j < this.drawQueue[i].length; j++) {
        if(!this.drawQueue[i][j]) continue;
        delete this.drawQueue[i][j];

        let pixelX = gridToPixel(i, this.posX, this.scale);
        let pixelY = gridToPixel(j, this.posY, this.scale);
        this.ctx.fillStyle = this.grid.getPixelColor(i, j);
        this.ctx.fillRect(pixelX, pixelY, this.scale, this.scale);

        if(++count > this.drawUpdatePerFrame) {
          count = 0;
          requestAnimationFrame(draw);
          return;
        }

      }
      j = 0;
    }
  }
  draw();
}

// --------------- utils ------------------------------
CanvasManager.prototype._foreachVisiblePixel = function(callback) {
  let canvasW = this.canvas.width;
  let canvasH = this.canvas.height;
  let firstX = Math.floor(this.posX);
  let firstY = Math.floor(this.posY);
  let lastX  = Math.ceil(this.posX + canvasW / this.scale);
  let lastY  = Math.ceil(this.posY + canvasH / this.scale);

  let i = firstY, j;

  for (i = firstX; i < lastX; i++) {
    for (j = firstY; j < lastY; j++) {
      callback(i, j);
    }
  }
}

CanvasManager.prototype._addToQueue = function(x, y) {
  if(x < 0 || y < 0 || x >= this.grid.sizeX || y >= this.grid.sizeY) return;
  this.drawQueue[x][y] = true;
}


function gridToPixel(position, origin, scale) {
  return (position - origin) * scale;
}
function pixelToGrid(position, origin, scale) {
  return position / scale + origin;
}
