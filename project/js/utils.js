
reqjs.define(['texturePacker'], function (texturePacker) {
	'use strict';

	var utils = {};

	utils.trimNull = function (str) {
		str = str.replace(/^\0\0*/, '');
		var ws = /\0/;
		var i = str.length;
		while (ws.test(str.charAt(--i)));
		return str.slice(0, i + 1);
	};

	utils.filledArray = function (length, val) {
		for (var i = 0, arr = []; i < length; i++) {
			arr[i] = val;
		}
		return arr;
	};

	// http://langweiligeszeug.tumblr.com/post/14830476496/stringtobytes-javascript-performance
	utils.stringToBytesFaster = function (str) { 
		if (typeof str !== 'string') throw "Not a string: "+str+", "+typeof str;
		var ch, st, re = [], j=0;
		for (var i = 0; i < str.length; i++ ) {
			ch = str.charCodeAt(i);
			if (ch < 127) {
				re[j++] = ch & 0xFF;
			} else {
				st = [];    // clear stack
				do {
					st.push( ch & 0xFF );  // push byte to stack
					ch = ch >> 8;          // shift value down by 1 byte
				} while ( ch );
				// add stack contents to result
				// done because chars have "wrong" endianness
				st = st.reverse();
				for (var k=0;k<st.length; ++k) {
					re[j++] = st[k];
				}
			}
		}
		// return an array of bytes
		return new Uint8Array(re);
	};

	utils.arrayToString = function (arr) {
		return String.fromCharCode.apply(null, arr);
	};

	utils.getFileBuffer = function (uri, callback, onprog) {
		var X = new XMLHttpRequest();
		X.open('get', uri, true);
		X.responseType = 'arraybuffer';
		X.addEventListener('load', function () {
			if(X.status === 200) {
				callback(X.response);
			}
			else {
				callback(null);
			}
		}, false);
		X.addEventListener('error', function (e) {
			callback(null);
		});
		if(typeof onprog === 'function') {
			X.addEventListener('progress', onprog, false);
		}
		X.send(null);
		return X;
	};

	utils.texturePacker = texturePacker;


	return utils;
});