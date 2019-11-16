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

  constructor(grid, canvas) {
    this.grid = grid;
    this.canvas = canvas;
    this.$canvas = $(canvas);
    this.ctx = canvas.getContext('2d', { alpha: false});
    this.ctx.imageSmoothingEnabled = false;

    this.posX = this.posY = 5;
    this.scale = 1;
    this.minScale = 1;
    this.maxScale = 10;

    this.gridCanvas = document.createElement('canvas');
    this.gridCanvas.width = grid.sizeX;
    this.gridCanvas.height = grid.sizeY;
    let gridCtx = this.gridCanvas.getContext('2d', { alpha: false});

    for (let i = 0; i < grid.sizeX; i++) {
      for (let j = 0; j < grid.sizeY; j++) {
        gridCtx.fillStyle = this.grid.getPixelColor(i, j);
        gridCtx.fillRect(i, j, 1, 1);
      }
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
CanvasManager.prototype._zoom = function(factor, clientX, clientY) {

  let delta = factor * this.scale;

  if(this.scale + delta > this.maxScale) delta = this.maxScale - this.scale;
  if(this.scale + delta < this.minScale) delta = this.minScale - this.scale;

  let x = clientX / this.$canvas.width() * this.canvas.width;
  let y = clientY / this.$canvas.height() * this.canvas.height;

  let zoom = (this.scale + delta) / this.scale;

  this.posX += x / this.scale - x / (this.scale*zoom);
  this.posY += y / this.scale - y / (this.scale*zoom);

  this.scale += delta;
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
CanvasManager.prototype.draw = function() {
  this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
  this.ctx.setTransform(this.scale, 0, 0, this.scale, -this.posX * this.scale, -this.posY * this.scale);
  this.ctx.drawImage(this.gridCanvas, 0, 0);
}
