export class PixelGrid {

  sizeX; sizeY;
  pixels;

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
    return 'rgb(255, 255, 255)';
  }
  else {
    let color = this.pixels[x][y];
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  }
}




export class CanvasManager {

  dragLastX; dragLastY;
  posX; posY;
  scale; scaleMin; scaleMax;
  canvas; $canvas; ctx;
  grid;
  touchDistance;

  constructor(grid, canvas) {
    this.grid = grid;
    this.canvas = canvas;
    this.$canvas = $(canvas);
    this.ctx = canvas.getContext('2d');

    this.posX = this.posY = 0;
    this.scale = 1;
    this.minScale = 1;
    this.maxScale = 10;

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
    console.log(delta, posX, posY, this.scale);
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

CanvasManager.prototype.draw = function() {
  let canvasW = this.canvas.width;
  let canvasH = this.canvas.height;

  let firstX = Math.floor(this.posX);
  let firstY = Math.floor(this.posY);
  let lastX  = Math.ceil(this.posX + canvasW / this.scale);
  let lastY  = Math.ceil(this.posY + canvasH / this.scale);

  let visibleCountX = lastX - firstX;
  let visibleCountY = lastY - firstY;

  for (let i = 0; i < visibleCountX; i++) {
    for (let j = 0; j < visibleCountY; j++) {

      this.ctx.fillStyle = this.grid.getPixelColor(firstX + i, firstY + j);

      let pixelX = (firstX + i - this.posX) * this.scale;
      let pixelY = (firstY + j - this.posY) * this.scale
      this.ctx.fillRect(pixelX, pixelY, this.scale, this.scale);
    }
  }
}
