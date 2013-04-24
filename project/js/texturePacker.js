/*
 * Very quick adaptation of http://pollinimini.net/blog/rectangle-packing-2d-packing
 * which is a JavaScript version of Jim Scott's original algorithm found
 * at http://www.blackpawn.com/texts/lightmaps/default.html
 *
 * It uses a binary tree to partition the space of the parent rectangle and allocate
 * the passed rectangles by dividing the partitions into filled and empty.
 * 
 * Source: https://github.com/One-com/assetgraph-sprite
 *
 */

/* LICENSE

Copyright (c) 2011, One.com
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in
    the documentation and/or other materials provided with the
    distribution.
  * Neither the name of the author nor the names of contributors may
    be used to endorse or promote products derived from this
    software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */
 

reqjs.define(function () {
	'use strict';

	// Taken and modified from underscore.js:
	// Extend a given object with all the properties in passed-in object(s).
	var _ = {};
	_.extend = function (obj) {
		Array.prototype.slice.call(arguments, 1).forEach(function (source) {
			if (source) {
				for (var prop in source) {
					obj[prop] = source[prop];
				}
			}
		});
		return obj;
	};


	function findCoords(node, width, height) {
		// If we are not at a leaf then go deeper
		if (node.lft) {
			// Check first the left branch if not found then go by the right
			return findCoords(node.lft, width, height) || findCoords(node.rgt, width, height);
		} else {
			// If already used or it's too big then return
			if (node.used || width > node.width || height > node.height) {
				return;
			}
		}
		// If it fits perfectly then use this gap
		if (width === node.width && height === node.height) {
			node.used = true;
			return {
				x: node.x,
				y: node.y
			};
		}

		// Partition vertically or horizontally:
		if (node.width - width > node.height - height) {
			node.lft = {
				x: node.x,
				y: node.y,
				width: width,
				height: node.height
			};
			node.rgt = {
				x: node.x + width,
				y: node.y,
				width: node.width - width,
				height: node.height
			};
		} else {
			node.lft = {
				x: node.x,
				y: node.y,
				width: node.width,
				height: height
			};
			node.rgt = {
				x: node.x,
				y: node.y + height,
				width: node.width,
				height: node.height - height
			};
		}
		return findCoords(node.lft, width, height);
	}

	function pack(imageInfos, config) {
		config = config || {};
		var root = {
				x: 0,
				y: 0,
				width: config.maxWidth || 999999,
				height: config.maxHeight || 999999
			},
			packingWidth = 0,
			packingHeight = 0;

		// Sort by area, descending:
		imageInfos.sort(function (a, b) {
			return (b.width * b.height) - (a.width * a.height);
		});

		var packingData = {
			textures: [],
			width: 0,
			height: 0
		};

		imageInfos.forEach(function (existingImageInfo) {
			var imageInfo = _.extend({}, existingImageInfo);
			// Perform the search
			var coords = findCoords(root, imageInfo.width, imageInfo.height);
			// If fitted then recalculate the used dimensions
			if (coords) {
				packingData.width = Math.max(packingData.width, coords.x + imageInfo.width);
				packingData.height = Math.max(packingData.height, coords.y + imageInfo.height);
			} else {
				throw new Error("TexturePacker: jimScott algorithm: Cannot fit image within "+root.width+"x"+root.height);
			}
			_.extend(imageInfo, coords);
			packingData.textures.push(imageInfo);
		});
		return packingData;
	}

	return {
		pack: pack
	};

});