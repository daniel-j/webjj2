
var isNode = typeof process !== 'undefined';

if (isNode) {
	var net = require('net');
	var dgram = require('dgram');
	var dns = require('dns');

	var gui = require('nw.gui');
	var nwin = gui.Window.get();
	gui.Window.get().showDevTools();
}

// shim layer with setTimeout fallback
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

reqjs.requirejs(['network', 'utils', 'anims'], function (network, utils, anims) {
	'use strict';
	
	function setFrame(vertices, uvs, offset, frame, posx, posy, flipX, rotation, scale) {
		if (typeof rotation !== 'number') rotation = 0;
		if (typeof scale !== 'number') scale = 1;


		var w = frame.width;
		var h = frame.height;

		if (!flipX) {
			var x1 = frame.x;
			var x2 = frame.x+w;
		} else {
			var x1 = frame.x+w;
			var x2 = frame.x;
		}

		var y1 = frame.y;
		var y2 = frame.y+h;

		var rotx = Math.cos(rotation);
		var roty = Math.sin(rotation);

		var dx = frame.hotspotX;
		var dy = frame.hotspotY;
		var dx2 = dx+w;
		var dy2 = dy+h;
		
		//posx += frame.hotspotX;
		//posy += frame.hotspotY;
		
		uvs[offset*12 + 0] = x1;
		uvs[offset*12 + 1] = y1;
		vertices[offset*12+ 0] = posx+(dx*rotx-dy*roty)*scale;
		vertices[offset*12+ 1] = posy+(dx*roty+dy*rotx)*scale;
		
		uvs[offset*12 + 2 ] = x2;
		uvs[offset*12 + 3] = y1;
		vertices[offset*12+ 2] = posx+(dx2*rotx-dy*roty)*scale;
		vertices[offset*12+ 3] = posy+(dx2*roty+dy*rotx)*scale;
		
		uvs[offset*12 + 4] = x2;
		uvs[offset*12 + 5] = y2;
		vertices[offset*12+ 4] = posx+(dx2*rotx-dy2*roty)*scale;
		vertices[offset*12+ 5] = posy+(dx2*roty+dy2*rotx)*scale;
		

		uvs[offset*12 + 6] = x1;
		uvs[offset*12 + 7] = y1;
		vertices[offset*12+ 6] = posx+(dx*rotx-dy*roty)*scale;
		vertices[offset*12+ 7] = posy+(dx*roty+dy*rotx)*scale;
		
		uvs[offset*12 + 8] = x2;
		uvs[offset*12 + 9] = y2;
		vertices[offset*12+ 8] = posx+(dx2*rotx-dy2*roty)*scale;
		vertices[offset*12+ 9] = posy+(dx2*roty+dy2*rotx)*scale;
		
		uvs[offset*12 +10] = x1;
		uvs[offset*12 +11] = y2;
		vertices[offset*12+10] = posx+(dx*rotx-dy2*roty)*scale;
		vertices[offset*12+11] = posy+(dx*roty+dy2*rotx)*scale;
		
	}
	

	//var compressed = new Zlib.Deflate(stringToBytesFaster("Hello, World!")).compress();
	//console.log(new Zlib.Inflate(compressed).decompress());

	var stats = new Stats();
	stats.domElement.style.position = 'absolute';

	var gameContainer = document.getElementById('game');

	var glowctx = new GLOW.Context({
		width: window.innerWidth,
		height: window.innerHeight,
		antialias: false,
		depth: false,
		clear: {
			alpha: 0
		}
	});
	glowctx.GL.disable(GL.CULL_FACE);
	glowctx.GL.disable(GL.DEPTH_TEST);
	glowctx.GL.disable(GL.BLEND);

	glowctx.domElement.id = 'gamecanvas';
	gameContainer.appendChild( stats.domElement );
	gameContainer.appendChild(glowctx.domElement);

	window.addEventListener('resize', function () {
		glowctx.setupViewport({width: window.innerWidth, height: window.innerHeight});
		glowctx.resize(window.innerWidth, window.innerHeight);
	}, false);

	var paletteView = new Uint8Array(256*3);



	var paletteTexture = new GLOW.Texture({
		data: paletteView,
		width: 256,
		height: 1,
		type: GL.UNSIGNED_BYTE,
		internalFormat: GL.RGB,
		format: GL.RGB,

		minFilter: GL.NEAREST,
		magFilter: GL.NEAREST,
		wrap: GL.CLAMP_TO_EDGE
	});

	utils.getFileBuffer('game/defaultPalette.pal', function (buffer) {
		var lines = utils.arrayToString(new Uint8Array(buffer)).split("\n");
		lines.forEach(function (line, i) {
			paletteView.set(line.split(" "), i*3);
		});
	});
	

	anims.onload = function () {

		/*var canvas = document.createElement('canvas');
		canvas.width = anims.spritesheet.info.width;
		canvas.height = anims.spritesheet.info.height;
		var ctx = canvas.getContext('2d');
		var imgdata = ctx.createImageData(anims.spritesheet.info.bufferWidth, anims.spritesheet.info.bufferHeight);
		var data = imgdata.data;
		for (var i = 0; i < data.length/4; i++) {
			var index = anims.spritesheet.pixelBuffer[i];
			if (index > 0) {
				data[i*4+0] = index;
				data[i*4+1] = index;
				data[i*4+2] = index;
				data[i*4+3] = 255;
			}
		}
		ctx.putImageData(imgdata, 0, 0);
		imgdata = null;
		data = null;
		ctx = null;
		var img = new Image();
		document.body.appendChild(img);
		canvas.toBlob(function (blob) {
			img.src = window.URL.createObjectURL(blob);
			
			
		});
		canvas = null;*/
		


		var pixelTexture = new GLOW.Texture({
			data: anims.spritesheet.pixelBuffer,
			width: anims.spritesheet.info.bufferWidth,
			height: anims.spritesheet.info.bufferHeight,
			type: GL.UNSIGNED_BYTE,
			internalFormat: GL.ALPHA,
			format: GL.ALPHA,

			minFilter: GL.NEAREST,
			magFilter: GL.NEAREST,
			wrap: GL.CLAMP_TO_EDGE
		});

		var vertices = new Float32Array(anims.spritesheet.info.textures.length*12);
		var uvs = new Float32Array(vertices.length);

		
		/*var sprite = anims.spritesheet.info.textures[i];
		var frame = anims.sets[sprite.setId].animations[sprite.animId].frames[sprite.frameId];

		setFrame(vertices, uvs, i, frame, 50, i*50);*/
		//setFrame(vertices, uvs, 0, {x: 0, y: 0, width: anims.spritesheet.info.width, height: anims.spritesheet.info.height}, 0, 0)
		

		var animShader = {
				
			data: {

				a_position: vertices,
				a_texCoord: uvs,

				pixels: pixelTexture,
				palette: paletteTexture,

				u_resolution: new GLOW.Vector2(glowctx.width, glowctx.height),
				u_spritesheetSize: new GLOW.Vector2(anims.spritesheet.info.bufferWidth, anims.spritesheet.info.bufferHeight),
				u_viewOffset: new GLOW.Vector2(0, 0)
			},

			usage: {
				a_position: GL.DYNAMIC_DRAW,
				a_texCoord: GL.DYNAMIC_DRAW
			},

			interleave: {
				a_position: false,
				a_texCoord: false
			},
			
			vertexShader: [
				"precision lowp float;",

				"attribute vec2 a_position;",
				"attribute vec2 a_texCoord;",

				"varying vec2 v_texCoord;",

				"uniform vec2 u_resolution;",
				"uniform vec2 u_viewOffset;",

				"void main(void) {",
					"gl_Position = vec4((((a_position+u_viewOffset)/u_resolution)*2.0-1.0)*vec2(1,-1), 0.0, 1.0);",

					"v_texCoord = a_texCoord;",
				"}"
			].join("\n"),

			fragmentShader: [
				"precision lowp float;",

				"varying vec2 v_texCoord;",

				"uniform sampler2D pixels;",
				"uniform sampler2D palette;",
				"uniform vec2 u_spritesheetSize;",

				"void main(void) {",
					"float alpha = texture2D(pixels, v_texCoord/u_spritesheetSize).a;",
					"if (alpha == 0.0) discard;",
					"vec4 color = texture2D(palette, vec2(alpha, 0.0));",
					"gl_FragColor = vec4(color.rgb, 1.0);",
				"}"
			].join("\n")
		};

		var sprites = new GLOW.Shader( animShader );

		//setFrame(vertices, uvs, 0, {x: 0, y: 0, width: anims.spritesheet.info.width, height: anims.spritesheet.info.height, hotspotX: 0, hotspotY: 0}, 0, 0);

		console.log(sprites, glowctx.cache);

		window.addEventListener('resize', function () {
			glowctx.cache.uniformByLocation[sprites.uniforms.u_resolution.locationNumber] = null;

			animShader.data.u_resolution.set(glowctx.width, glowctx.height);
		}, false);
		var mouseX = 0;
		var mouseY = 0;
		window.addEventListener('mousemove', function (e) {
			
			// Hack to only uncache one uniform
			glowctx.cache.uniformByLocation[sprites.uniforms.u_viewOffset.locationNumber] = null;


			mouseX = e.pageX-glowctx.width/2;
			mouseY = e.pageY-glowctx.height/2;
			
			animShader.data.u_viewOffset.set(mouseX/1.5, mouseY/1.5);
		}, false);

		var st = performance.now();


		function render() {
			requestAnimFrame(render, glowctx.domElement);
			
			
			var delta = (performance.now()-st)/1000;
			//glowctx.clear();

			stats.begin();

			var setCount = 15;
			var animCount = 0;

			for (var s = 0; s < anims.sets.length; s++) {
				if (!anims.sets[s]) continue;
				var set = anims.sets[s];
				var speed = (anims.sets.length-s)/30;
				for (var a = 0; a < set.animations.length; a++) {
					if (!set.animations[a]) continue;
					var anim = set.animations[a];
					var frameId = (delta*anim.fps|0) % anim.frames.length;
					var frame = anim.frames[frameId];

					var animSpace = (a/set.animations.length)*Math.PI*2;
					var drawx = Math.min(delta/4, 1)*Math.cos(delta*(1/4)*speed+animSpace-mouseX/500)*setCount*5+glowctx.width/2;
					var drawy = Math.min(delta/4, 1)*Math.sin(delta*(1/3)*speed+animSpace-mouseY/500)*setCount*5+glowctx.height/2;
					var rotation = (delta*(s/2+15))/40+a*(Math.PI/4);
					
					setFrame(vertices, uvs, animCount, frame, drawx, drawy, a % 2, rotation, 1+Math.sin(delta*2-(s/(anims.sets.length))*Math.PI*2)*0.6);

					animCount++;
				}
				setCount+=(anims.sets.length-s)/90;
			}

			
			
			sprites.attributes.a_position.bufferData();
			sprites.attributes.a_texCoord.bufferData();

			
			sprites.draw();

			stats.end();
		}
		render();
	}



});
