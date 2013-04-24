
reqjs.define(['Player'], function (Player) {
	'use strict';

	

	var botname = String.fromCharCode(167)+String.fromCharCode(124)+String.fromCharCode(167)+"1"+"Native SGIP"; // Will look like "Native SGIP joined the game" on nonplus JJ2 servers

	

	function udpchecksum(buf) {
		var x = 1, y = 1, size = buf.length;
		for(var i = 2; i < size; i++) {
			x += buf[i];
			y += x;
		}
		buf[0] = x % 251;
		buf[1] = y % 251;
		return buf;
	}

	function Server(config) {

		// default setup
		this.ip   = "";
		this.port = 10052;
		this.location = "local";
		this.private  = false;
		this.gamemode = -1;
		this.gamemodeStr = "";
		this.version     = "\0\0\0\0";
		this.startTime   = new Date();
		this.playerCount = 0;
		this.maxPlayers  = 0;
		this.servername  = "";
		this.nodes = {};
		this.isQuerying = false;
		this.info = {};

		if (typeof config === 'string') {
			this.loadFromAsciiString(config);
		} else if (typeof config === 'object') {
			this.loadFromConfig(config);
		}
	}

	Server.prototype.query = function (cb) {
		if (typeof cb !== "function") {
			cb = function () {}
		}
		

		var s = this;
		if (!s.isQuerying) {
			s.isQuerying = true;
			chrome.socket.create('udp', function (createInfo) {
				var sockId = createInfo.socketId;
				chrome.socket.bind(sockId, "0.0.0.0", 0, function (result) {
					chrome.socket.sendTo(sockId, queryPacket, s.ip, s.port, function (writeInfo) {
						var returned = false;
						var timeout = setTimeout(function () {
							s.isQuerying = false;
							cb('query', -1);
						}, 1500);
						var st = new Date();
						chrome.socket.read(sockId, null, function (readInfo) {
							var et = new Date();

							if (returned) {
								return;
							}
							clearTimeout(timeout);
							chrome.socket.destroy(sockId);
							s.isQuerying = false;
							if (readInfo.resultCode > 0) {
								var arr = new Uint8Array(readInfo.data)
								var str = String.fromCharCode.apply(null, arr);

								var ping = et.getTime() - st.getTime();

								s.loadFromConfig({
									version: str.substr(8, 4),
									playerCount: arr[12],
									maxPlayers: arr[15],
									gamemode: arr[14],
									servername: str.substr(17, arr[16])
								});
								cb('query', ping);
							} else {
								cb('query', -1);
							}
						});
					});
				});
				
			});
			
			chrome.socket.create('tcp', function (createInfo) {
				//if (s.ip !== "80.78.216.229") return;
				var sockId = createInfo.socketId;
				var resultOk = false;

				var isClosed = false;
				var mySockId = -1;
				var myPlayerId = -1;
				var filename = "";
				var gamemode = -1;
				var maxscore = -1;
				var disconnectMessage = -1;

				var isPlus = false;
				var players = [];
				var plus = {};

				s.info = {};

				function infoDone() {
					
					chrome.socket.destroy(sockId);
					isClosed = true;
					var config = {};
					if (gamemode !== -1) config.gamemode = gamemode;
					if (maxscore !== -1) config.maxscore = maxscore;

					s.loadFromConfig(config);

					s.info.players = players;
					s.info.disconnectMessage = disconnectMessage;
					s.info.filename = filename;


					if (isPlus) {
						s.info.plus = plus;
					}

					cb('info');
				}

				function handleRead() {
					chrome.socket.read(sockId, null, function (readInfo) {
						if (readInfo.resultCode > 0) {
							var data = new Uint8Array(readInfo.data);
							var packets = [];
							var p = 0;
							var j = data.length;
							var special = false;
							while (p < j) {
								
								var l = data[p];

								
								
								if (isPlus && l === 0) {
									p++;
									l = data[p++];
									p++;
									packets.push(new Uint8Array([l].concat(Array.prototype.slice.call(data, p, p+l))));
									
								} else {
									if (l === 0) l++;						// Safety measure
									packets.push(data.subarray(p, p+l));
								}
								p += l;
							}
							for (var ipak = 0; ipak < packets.length; ipak++) {

								var arr = packets[ipak];
								var str = String.fromCharCode.apply(null, arr);
								var packetLen = arr[0];
								var packetId = arr[1];

								if (packetId === 0x0D) { // Disconnect
									if(arr[3] === mySockId || mySockId === -1) {
										disconnectMessage = arr[2];
										infoDone();
									}
								} else if (packetId === 0x10) { // Server details
									
									var offset = 2;
									mySockId = arr[offset++];
									myPlayerId = arr[offset++];

									filename = str.substr(5, arr[offset++]);
									offset += filename.length;
									offset += 8; // Skip CRCs
									gamemode = arr[offset++];
									maxscore = arr[offset++];

									var toSend = stringToBytesFaster("y\x0E\x01"+String.fromCharCode(myPlayerId)+"\x00"+"SGIP"+botname+"\x00");
									toSend[0] = toSend.length;

									chrome.socket.write(sockId, plusPacket, function (sendInfo) {
										chrome.socket.write(sockId, new Uint8Array(toSend).buffer, function (sendInfo) {
											
										});
									});
									

								} else if (packetId === 0x12) { // Playerlist
									var i = 3;
									while (i < packetLen) {
										var pSockId = arr[i++];
										var pPlayerId = arr[i++];

										var pChar = 0;
										var pTeam = 0;
										
										
										if (isPlus) {
											pChar = arr[i++];
											pTeam = arr[i++];
										} else {
											var pCharTeam = arr[i++];
											pChar = pCharTeam & 3;
											pTeam = (pCharTeam & 16)/16;
										}
										var pFur = new Uint8Array([arr[i++], arr[i++], arr[i++], arr[i++]]);

										var pName = "";
										while (arr[i] !== 0) {
											pName += str[i++]; // Append character to pName until null
										}
										i++; // Skip null byte

										players[pPlayerId] = new Player({
											sockId: pSockId,
											playerId: pPlayerId,
											character: pChar,
											team: pTeam,
											fur: pFur,
											name: pName
										});

									}
								} else if (packetId === 0x13) { // Game init
									chrome.socket.disconnect(sockId);
									infoDone();

								} else if (packetId === 0x3F) { // Plus info
									isPlus = true;
									var i = 2;
									plus.version = [arr[i++], arr[i++], arr[i++], arr[i++]];
									plus.customMode = arr[i++];
									plus.startHealth = arr[i++];
									plus.maxHealth = arr[i++];

									var plusByte = arr[i++];
									plus.plusOnly = plusByte & 1 === 1;
									plus.friendlyFire = (plusByte>>1)&1 === 1;
									plus.noMovement = (plusByte>>2)&1 === 1;
									plus.noBlink = (plusByte>>3)&1;

								} else {
									console.log(s.servername, "Unknown packet 0x"+packetId, arr, data);
								}

								
							}
							if (!isClosed) {
								handleRead();
							}
							
						} else {
							// No data available
							infoDone();
						}
						
					});
				}

				
				chrome.socket.connect(sockId, s.ip, s.port, function (result) {
					if (result === 0) {
						var packet = new Uint8Array([0x09, 0x0F, 0, 0].concat(stringToBytesFaster(s.version), 0x01)).buffer;
						chrome.socket.write(sockId, packet, function (sendInfo) {
							handleRead();
						});
					} else {
						resultOk = false;
						infoDone();
					}
				});
			});
			
		}
	}

	return Server;

});