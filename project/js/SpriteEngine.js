
reqjs.define(['anims', 'lib/EventEmitter'], function (anims, EventEmitter) {
	'use strict';

	function setFrame(vertices, uvs, offset, sprite) {

		var frame = anims.sets[sprite.setId].animations[sprite.animId].frames[sprite.frameId];
		var posx = sprite.x|0;
		var posy = sprite.y|0;
		var flipX = !!sprite.flipX;
		var rotation = sprite.rotation;
		var scale = sprite.scale;

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
		
		uvs[offset*12 + 0] = x1;
		uvs[offset*12 + 1] = y1;
		vertices[offset*12+ 0] = posx+(dx*rotx-dy*roty)*scale|0;
		vertices[offset*12+ 1] = posy+(dx*roty+dy*rotx)*scale|0;
		
		uvs[offset*12 + 2 ] = x2;
		uvs[offset*12 + 3] = y1;
		vertices[offset*12+ 2] = posx+(dx2*rotx-dy*roty)*scale|0;
		vertices[offset*12+ 3] = posy+(dx2*roty+dy*rotx)*scale|0;
		
		uvs[offset*12 + 4] = x2;
		uvs[offset*12 + 5] = y2;
		vertices[offset*12+ 4] = posx+(dx2*rotx-dy2*roty)*scale|0;
		vertices[offset*12+ 5] = posy+(dx2*roty+dy2*rotx)*scale|0;
		

		uvs[offset*12 + 6] = x1;
		uvs[offset*12 + 7] = y1;
		vertices[offset*12+ 6] = posx+(dx*rotx-dy*roty)*scale|0;
		vertices[offset*12+ 7] = posy+(dx*roty+dy*rotx)*scale|0;
		
		uvs[offset*12 + 8] = x2;
		uvs[offset*12 + 9] = y2;
		vertices[offset*12+ 8] = posx+(dx2*rotx-dy2*roty)*scale|0;
		vertices[offset*12+ 9] = posy+(dx2*roty+dy2*rotx)*scale|0;
		
		uvs[offset*12 +10] = x1;
		uvs[offset*12 +11] = y2;
		vertices[offset*12+10] = posx+(dx*rotx-dy2*roty)*scale|0;
		vertices[offset*12+11] = posy+(dx*roty+dy2*rotx)*scale|0;
	}

	// like String.trim() but on arrays, only null values. Only trim on end
	function trimArrayEnd() {
		for (var i = 0; i  < arguments.length; i++) {
			var arr = arguments[i];
			if (!Array.isArray(arr)) continue;
			while (arr[arr.length-1] === null && arr.length > 0) {
				arr.pop();
			}
		}
	}
	

	function SpriteEngine(glowctx) {
		this.glowctx = glowctx;
		var GL = glowctx.GL;
		var self = this;

		function createPaletteTexture() {
			return new GLOW.Texture({
				data: new Uint8Array(256*4),
				width: 256,
				height: 1,
				type: GL.UNSIGNED_BYTE,
				internalFormat: GL.RGBA,
				format: GL.RGBA,

				minFilter: GL.NEAREST,
				magFilter: GL.NEAREST,
				wrap: GL.CLAMP_TO_EDGE
			});
		}

		var spritesheetTexture = new GLOW.Texture({
			data: new Uint8Array(0),
			width: 0,
			height: 0,
			type: GL.UNSIGNED_BYTE,
			internalFormat: GL.ALPHA,
			format: GL.ALPHA,

			minFilter: GL.NEAREST,
			magFilter: GL.NEAREST,
			wrap: GL.CLAMP_TO_EDGE
		});

		this.palettes = {
			tileset: createPaletteTexture(),
			menu: createPaletteTexture()
		};

		this.vecResolution = new GLOW.Vector2(glowctx.width, glowctx.height);
		this.vecSpritesheetSize = new GLOW.Vector2(spritesheetTexture.width, spritesheetTexture.height);
		
		this.layers = [];

		this.baseShaderInfo = {
				
			data: {
				a_position: null,
				a_texCoord: null,

				pixels: spritesheetTexture,
				palette: this.palettes.tileset,

				u_resolution: this.vecResolution,
				u_spritesheetSize: this.vecSpritesheetSize,
				u_viewOffset: null
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
					"gl_FragColor = texture2D(palette, vec2(texture2D(pixels, v_texCoord/u_spritesheetSize).a, 0.0));",
				"}"
			].join("\n")
		};

		//this.baseShader = new GLOW.Shader( this.baseShaderInfo );

		// Public subclass, another "this"
		this.Layer = function () {
			this.positions = new Float32Array(0);
			this.uvmap = new Float32Array(0);

			this.sprites = [];

			this.vecOffset = new GLOW.Vector2(0, 0);

			var shaderInfo = Object.create(self.baseShaderInfo);

			shaderInfo.data.a_position = this.positions;
			shaderInfo.data.a_texCoord = this.uvmap;
			shaderInfo.data.u_viewOffset = this.vecOffset;

			this.shader = new GLOW.Shader( shaderInfo );

			this.spriteCount = 0;
			this.maxSpriteCount = 0;

			self.layers.push(this);
		};
		this.Layer.prototype.updateAll = function() {

			//glowctx.cache.invalidateAttribute(this.shader.attributes.a_position);
			//glowctx.cache.invalidateAttribute(this.shader.attributes.a_texCoord);

			//this.positions = new Float32Array(this.sprites.length*12);
			//this.uvmap = new Float32Array(this.sprites.length*12);

			for (var i = 0; i < this.sprites.length; i++) {
				var sprite = this.sprites[i];
				if (!sprite) continue;
				setFrame(this.positions, this.uvmap, i, sprite);
			}

			this.shader.attributes.a_position.bufferData(this.positions);
			this.shader.attributes.a_texCoord.bufferData(this.uvmap);
		};
		this.Layer.prototype.updateSprite = function (sprite) {
			var pos = this.sprites.indexOf(sprite);
			if (pos === -1) {
				console.error(sprite);
				throw "No such sprite";
			}

			var posBuf = new Float32Array(12);
			var uvBuf = new Float32Array(12);

			if (sprite.enabled) {
				setFrame(posBuf, uvBuf, 0, sprite);
			}

			this.shader.attributes.a_position.bufferSubData(posBuf, pos*12);
			this.shader.attributes.a_texCoord.bufferSubData(uvBuf, pos*12);
		};
		this.Layer.prototype.draw = function () {
			this.shader.compiledData.elements.length = this.sprites.length*6;
			this.shader.draw();
		};
		this.Layer.prototype.addSprite = function (sprite) {
			if (this.sprites.indexOf(sprite) !== -1) {
				throw "Sprite already exist in this layer";
			}
			var prev = this.sprites.length;
			var pos = this.sprites.indexOf(null);
			if (pos === -1) pos = this.sprites.length;
			this.sprites[pos] = sprite;
			this.spriteCount++;

			/*if (this.sprites.length*12 > this.positions.length) {
				this.allocateSprites(this.sprites.length-prev);
			}*/
			//this.updateSprite(sprite);
		};
		this.Layer.prototype.allocateSprites = function (newSize) {

			var oldSize = this.positions.length/12;
			if (oldSize === newSize) {
				return;
			}

			if (this.sprites.length > newSize) {
				throw "Tried to unallocate existing sprites";
			}

			var posBuf = this.positions;
			var uvBuf = this.uvmap;

			

			if (oldSize > newSize) {
				this.positions = new Float32Array(this.positions, 0, newSize*12);
				this.uvmap = new Float32Array(this.uvmap, 0, newSize*12);

			} else {
				var newPos = new Float32Array(newSize*12);
				var newUv = new Float32Array(newSize*12);

				newPos.set(posBuf, 0);
				newUv.set(uvBuf, 0);

				this.positions = newPos;
				this.uvmap = newUv;
			}

			this.shader.attributes.a_position.bufferData(this.positions);
			this.shader.attributes.a_texCoord.bufferData(this.uvmap);

			this.maxSpriteCount = newSize;

			console.log("Allocated layer for "+newSize+" sprites");
		};
		this.Layer.prototype.removeSprite = function (sprite) {
			var pos = this.sprites.indexOf(sprite);
			if (pos === -1) {
				console.error(sprite);
				throw "No such sprite";
			}
			this.sprites[pos] = null;
			trimArrayEnd(this.sprites);
			this.spriteCount--;

			// Check if it still exists in the buffers
			var spriteStillExists = pos <= this.sprites.length;

			if (spriteStillExists) {
				this.positions.set(new Float32Array(12), pos*12);
				this.uvmap.set(new Float32Array(12), pos*12);
				this.shader.attributes.a_position.bufferSubData(new Float32Array(12), pos*12);
				this.shader.attributes.a_texCoord.bufferSubData(new Float32Array(12), pos*12);
			}

		};
		this.Layer.prototype.setOffset = function (x, y) {
			this.vecOffset.set(x|0, y|0);
			glowctx.cache.invalidateUniform(this.shader.uniforms.u_viewOffset);
		};

		this.Layer.Sprite = function (config) {
			this.setId = config.setId;
			this.animId = config.animId;
			this.frameId = config.frameId;

			this.enabled = true;

			this.x = config.x || 0;
			this.y = config.y || 0;

			this.rotation = config.rotation;
			this.scale = config.scale;
		}

		anims.on('spritesheet', function () {
			spritesheetTexture.width = anims.spritesheet.info.bufferWidth;
			spritesheetTexture.height = anims.spritesheet.info.bufferHeight;
			spritesheetTexture.swapTexture(anims.spritesheet.pixelBuffer);
			self.vecSpritesheetSize.set(spritesheetTexture.width, spritesheetTexture.height);

			//glowctx.cache.invalidateTexture(self.baseShader.uniforms.pixels.textureUnit);
			//glowctx.cache.invalidateUniform(self.baseShader.uniforms.u_spritesheetSize);
		});

		//var vertices = new Float32Array(anims.spritesheet.info.textures.length*12);
		//var uvs = new Float32Array(vertices.length);
	}
	SpriteEngine.prototype = new EventEmitter;


	SpriteEngine.prototype.resize = function (w, h) {
		this.vecResolution.set(w, h);


		// Loop through the layers and clear their cache for u_resolution. It should have same locationNumber across all shaders (same base shader).
		// This may not be needed to do for all layers

		//this.glowctx.cache.invalidateUniform(this.baseShader.uniforms.u_resolution);
		for (var i = 0; i < this.layers.length; i++) {
			this.glowctx.cache.invalidateUniform(this.layers[i].shader.uniforms.u_resolution);
		}
	};

	

	return SpriteEngine;
});
