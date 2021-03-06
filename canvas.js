import { PixelInterface } from './interface.js'


export class PixelGrid {

  // sizeX; sizeY;
  // pixels;

  constructor() {

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha:false });

    this.sizeX = this.canvas.width;
    this.sizeY = this.canvas.height;

    this.pixels = [];

    this.changeEvent = [];

    for (var i = 0; i < this.sizeX; i++) {
      this.pixels[i] = [];
      for (var j = 0; j < this.sizeY; j++) {
        this.pixels[i][j] = [100,100,100];
        this.ctx.fillStyle = this._parseColor(this.pixels[i][j]);
        this.ctx.fillRect(i, j, 1, 1);
      }
    }

  }
}

PixelGrid.prototype.load = function(grid) {
  this.pixels = grid; // todo check integrity
  this.sizeX = this.pixels.length;
  this.sizeY = this.pixels[0].length;

  this.canvas.width = this.sizeX;
  this.canvas.height = this.sizeY;

  for (var i = 0; i < this.sizeX; i++) {
    for (var j = 0; j < this.sizeY; j++) {
      this.ctx.fillStyle = this._parseColor(this.pixels[i][j]);
      this.ctx.fillRect(i, j, 1, 1);
    }
  }
}

PixelGrid.prototype.onChange = function(fn) {
  this.changeEvent.push(fn);
}

PixelGrid.prototype._fireChange = function(data) {
  for (let fn of this.changeEvent) fn(data);
}

PixelGrid.prototype.setPixelColor = function(x, y, color, fireChange=true) { // color is array of int [r, g, b]
  x = x % this.sizeX;
  y = y % this.sizeY;
  if(  this.pixels[x][y][0] === color[0]
    && this.pixels[x][y][1] === color[1]
    && this.pixels[x][y][2] === color[2]
  ) {
    return;
  }
  this.ctx.fillStyle = this._parseColor(color);
  this.ctx.fillRect(x, y, 1, 1);
  this.pixels[x][y] = color;
  if(fireChange) this._fireChange([x,y,color]);
}

PixelGrid.prototype._parseColor = function(c) {
  return `rgb(${c[0]},${c[1]},${c[2]})`;
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

    this.UUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });

    this._createListeners();

    this.draw();

  }
}

CanvasManager.prototype._createListeners = function() {
  let $canvas = $(canvas);

  $canvas.on('click', (e) => this._click(e));

  $canvas.on('touchstart', (e) => { // mobile
    this._touchstart(e);
    $canvas.on('touchmove.'+this.UUID, (e) => this._touchmove(e));
  });
  $canvas.on('touchend', () => {
    $canvas.off('touchmove.'+this.UUID);
  });

  $canvas.on('mousedown', (e) => { // desktop
    this._mousedown(e);
    $canvas.on('mousemove.'+this.UUID, (e) => this._mousemove(e));
  })
  $canvas.on('mouseup', () => {
    $canvas.off('mousemove.'+this.UUID);
  });
  $canvas.on('wheel', (e) => this._wheel(e));


  let hover = false;
  let x = 0;
  let y = 0;

  $canvas.on('mouseenter', () => hover = true);
  $canvas.on('mouseleave', () => hover = false);
  $canvas.on('mousemove', (e) => {
    x = e.clientX;
    y = e.clientY;
  });

  $(window).on('keydown', (e) => {
    if( !hover ) return;
    if(e.key === ' ') {
      this._spacebar(x, y);
    }
    else if(e.key === '+') {
      this._zoom(.5, x, y)
    }
    else if(e.key === '-') {
      this._zoom(-.5, x, y)
    }
  })
}

// ------------ desktop events --------------------------------
CanvasManager.prototype._mousedown = function(e) {
  let x = e.clientX / this.$canvas.width() * this.canvas.width;
  let y =  e.clientY / this.$canvas.height() * this.canvas.height;
  this._dragStart(x, y);
}

CanvasManager.prototype._mousemove = function(e) {
  let x = e.clientX / this.$canvas.width() * this.canvas.width;
  let y =  e.clientY / this.$canvas.height() * this.canvas.height;
  this._drag(x, y);
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

CanvasManager.prototype._spacebar = function(x, y) {

  let canvasX = x / this.$canvas.width() * this.canvas.width;
  let canvasY = y / this.$canvas.height() * this.canvas.height;

  let color = new PixelInterface().getColor();
  let i = Math.floor(this.posX + canvasX / this.scale);
  let j = Math.floor(this.posY + canvasY / this.scale);

  this.grid.setPixelColor(i, j, color);
  this.draw();
}


// ------------ mobile events --------------------------------
CanvasManager.prototype._touchstart = function(e) {
  if(e.touches.length === 1) {
    let x = e.touches[0].clientX / this.$canvas.width() * this.canvas.width;
    let y = e.touches[0].clientY / this.$canvas.height() * this.canvas.height;
    this._dragStart(x, y);
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
    let x = e.touches[0].clientX / this.$canvas.width() * this.canvas.width;
    let y = e.touches[0].clientY / this.$canvas.height() * this.canvas.height;
    this._drag(x, y);
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

  this.move(
    x / this.scale - x / (this.scale*zoom),
    y / this.scale - y / (this.scale*zoom)
  );

  this.scale += delta;
  this.draw();
}

CanvasManager.prototype._dragStart = function(x, y) {
  this.dragStartX = x;
  this.dragStartY = y;
  this.dragLastX = this.dragStartX;
  this.dragLastY = this.dragStartY;
  this._dragTimestamp = Date.now();
}

CanvasManager.prototype._drag = function(x, y) {

  if(Date.now() - this._dragTimestamp < 100) return;

  let deltaX = x - this.dragLastX;
  let deltaY = y - this.dragLastY;

  this.dragLastX = x;
  this.dragLastY = y;

  this.move( -deltaX / this.scale, -deltaY / this.scale );
  this.draw();
}

CanvasManager.prototype.move = function(dx, dy) {
  this.posX += dx;
  this.posY += dy;
  this.posX = this.posX % this.grid.sizeX;
  this.posY = this.posY % this.grid.sizeY;
  if(this.posX < 0) this.posX = this.grid.sizeX + this.posX;
  if(this.posY < 0) this.posY = this.grid.sizeY + this.posY;
}

// ------------------------------------------------------------
// CanvasManager.prototype.draw_single = function() {
//   this.ctx.imageSmoothingEnabled = false;
//   this.ctx.setTransform(1, 0, 0, 1, 0, 0);
//   this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
//   this.ctx.setTransform(this.scale, 0, 0, this.scale, -this.posX * this.scale, -this.posY * this.scale);
//   this.ctx.drawImage(this.grid.canvas, 0, 0);
// }

CanvasManager.prototype.draw = function() {
  this.ctx.imageSmoothingEnabled = false;
  this.ctx.setTransform(1, 0, 0, 1, 0, 0); // identity
  this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
  this.ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);

  for (var i = -this.posX; i < this.canvas.width / this.scale; i+= this.grid.sizeX) {
    for (var j = -this.posY; j < this.canvas.height / this.scale; j+= this.grid.sizeY) {
      // console.log(i, j);
      this.ctx.drawImage(this.grid.canvas, i, j);
    }
  }
}
