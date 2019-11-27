import { PixelInterface } from './interface.js'


export class PixelGrid {

  // sizeX; sizeY;
  // pixels;

  constructor(sizeX, sizeY) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;

    this.canvas = document.createElement('canvas');
    this.canvas.width = sizeX;
    this.canvas.height = sizeY;
    this.ctx = this.canvas.getContext('2d', { alpha:false });

    this.pixels = [];

    for (var i = 0; i < sizeX; i++) {
      this.pixels[i] = [];
      for (var j = 0; j < sizeY; j++) {
        let col = [];
        for (var k = 0; k < 3; k++) { // RGB
          col[k] = Math.floor( Math.random() * 256 );
        }
        this.pixels[i][j] = `rgb(${col[0]}, ${col[1]}, ${col[2]})`;
        this.ctx.fillStyle = this.pixels[i][j];
        this.ctx.fillRect(i, j, 1, 1);
      }
    }
  }
}

PixelGrid.prototype.getPixelColor = function(x, y) {
  if(x >= this.pixels.length || y >= this.pixels[0].length || x < 0 || y < 0) {
    return 'black';
  }
  else {
    return this.pixels[x][y];
  }
}

PixelGrid.prototype.setPixelColor = function(x, y, color) {
  if(x >= this.pixels.length || y >= this.pixels[0].length || x < 0 || y < 0) {
    return false;
  }
  else {
    this.pixels[x][y] = color;
    this.ctx.fillStyle = this.pixels[x][y];
    this.ctx.fillRect(x, y, 1, 1);
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

    this._createListeners();

    this.draw();
  }
}

CanvasManager.prototype._createListeners = function() {
  let $canvas = $(canvas);

  $canvas.on('click', (e) => this._click(e));

  $canvas.on('touchstart', (e) => { // mobile
    this._touchstart(e);
    $canvas.on('touchmove', (e) => this._touchmove(e));
  });
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

CanvasManager.prototype._click = function(e) {

  let canvasX = e.clientX / this.$canvas.width() * this.canvas.width;
  let canvasY = e.clientY / this.$canvas.height() * this.canvas.height;
  if(Math.abs(this.dragStartX - canvasX) > 5 || Math.abs(this.dragStartY - canvasY) > 5) return;

  let color = new PixelInterface().getColor();
  let x = Math.floor(this.posX + canvasX / this.scale);
  let y = Math.floor(this.posY + canvasY / this.scale);

  this.grid.setPixelColor(x, y, color);
  this.draw();
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
    let delta = (distance / this.touchDistance) - 1;
    if(delta === 0) return;
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
  this.dragStartX = x / this.$canvas.width() * this.canvas.width;
  this.dragStartY = y / this.$canvas.height() * this.canvas.height;
  this.dragLastX = this.dragStartX;
  this.dragLastY = this.dragStartY;
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
  this.ctx.imageSmoothingEnabled = false;
  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
  this.ctx.setTransform(this.scale, 0, 0, this.scale, -this.posX * this.scale, -this.posY * this.scale);
  this.ctx.drawImage(this.grid.canvas, 0, 0);
}
