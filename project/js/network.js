reqjs.define(function () {

	var server = {
		addr: '127.0.0.1',
		port: 10052
	};

	var network = {
		tcp: {
			sockId: null,

			socket: null
		},
		udp: {
			sockId: null,
			localPort: 0,

			socket: null
		}
	};

	function handleChromeTcpData() {
		chrome.socket.read(network.tcp.sockId, null, function (readInfo) {

			if (readInfo.resultCode > 0) {
				
				network.tcp.ondata(new Uint8Array(readInfo.data));
				handleChromeTcpData();
				
			} else {

				handleChromeTcpClose('Connection closed');
			}
			
		});
	}

	function handleChromeTcpClose(message) {
		if (network.tcp.sockId !== null) {
			network.tcp.onclose(message);
			chrome.socket.destroy(network.tcp.sockId);
			network.tcp.sockId = null;
		}
	}
	function handleNodeTcpClose(message) {
		if (network.tcp.socket !== null) {
			network.tcp.onclose(message);
			network.tcp.socket.destroy();
			network.tcp.socket = null;
		}
	}

	function handleChromeUdpData() {
		chrome.socket.read(network.udp.sockId, null, function (readInfo) {

			if (readInfo.resultCode > 0) {
				network.udp.ondata(readInfo.data);
				
			} else {
				console.error("network:UDP:READ: Result code is zero");
			}

			handleChromeUdpData();
		});
	}

	network.tcp.connect = function () {
		
		if (!isNode) {

			if (network.tcp.sockId) {
				handleChromeTcpClose();
			}

			chrome.socket.create('tcp', function (createInfo) {
				network.tcp.sockId = createInfo.socketId;
			
				chrome.socket.connect(network.tcp.sockId, server.addr, server.port, function (result) {
					if (result === 0) {
						
						handleChromeTcpData();
						network.tcp.onconnect();
					} else {
						network.tcp.onclose("Couldn't connect to server, error code "+result);
					}
				});
			});
		} else {
			if (network.tcp.socket) {
				handleNodeTcpClose();
			}
			
			var tcp = network.tcp.socket = net.connect(server.port, server.addr);
			tcp.on('connect', function () {
				network.tcp.onconnect();
			});
			tcp.on('data', function (buffer) {
				var data = new Uint8Array(buffer);
				network.tcp.ondata(data);
			});
			tcp.on('error', function (err) {
				handleNodeTcpClose(err.toString());
			});
			tcp.on('close', function () {
				handleNodeTcpClose();
			});
		
			
		}
	}

	network.tcp.close = function () {
		if (!isNode) {
			handleChromeTcpClose();
		} else {
			handleNodeTcpClose();
		}
	};

	network.tcp.send = function (data, cb) {
		if (!isNode) {
			chrome.socket.write(network.tcp.sockId, data.buffer, function (writeInfo) {
				if (typeof cb === 'function') cb(writeInfo);
			});
		} else {
			var buf = new Buffer(data);
			if (network.tcp.socket) {
				network.tcp.socket.write(buf, cb);
			}
		}
	};

	network.udp.create = function (cb) {
		if (!isNode) {
			chrome.socket.create('udp', function (createInfo) {
				network.udp.sockId = createInfo.socketId;
				chrome.socket.bind(network.udp.sockId, "0.0.0.0", 0, function (result) {
					chrome.socket.getInfo(network.udp.sockId, function (socketInfo) {
						network.udp.localPort = socketInfo.localPort;

						handleChromeUdpData();
						cb();
					});
				});
			});
		} else {
			var udp = network.udp.socket = dgram.createSocket("udp4");
			udp.on('listening', function () {
				var rinfo = udp.address();
				network.udp.localPort = rinfo.port;
				cb();
			});
			udp.on('message', function (data, rinfo) {
				if (rinfo.address === server.addr && rinfo.port === server.port) {
					network.udp.ondata(new Uint8Array(data));
				} else {
					console.warn("Got UDP packet from unknown source:", rinfo.address, rinfo.port);
				}

			});
			udp.on('error', function (err) {
				network.udp.onerror(err);
			});
			udp.on('close', function () {
				network.udp.socket = null;
			});
			udp.bind(0, "0.0.0.0");
		}
	};

	network.udp.close = function () {
		if (!isNode) {
			chrome.socket.destroy(network.udp.sockId);
			network.udp.sockId = null;
		} else {
			if (network.udp.socket) {
				network.udp.socket.close();
			}
		}
	};

	network.udp.send = function (data, cb) {
		if (!isNode) {
			chrome.socket.sendTo(network.udp.sockId, data.buffer, server.addr, server.port, function (writeInfo) {
				if (typeof cb === 'function') cb(writeInfo);
			});
		} else {
			var buf = new Buffer(data);
			network.udp.socket.send(buf, 0, buf.length, server.port, server.addr, cb);
		}
	};

	network.tcp.onconnect = function () {console.warn('Implement tcp.onconnect');};
	network.tcp.ondata = function (buffer) {console.warn('Implement tcp.ondata', buffer)};
	network.tcp.onclose = function (err) {console.warn('Implement tcp.onclose', err)};

	network.udp.ondata = function (buffer) {console.warn('Implement udp.ondata', buffer)};
	network.udp.onerror = function (err) {console.warn('Implement udp.onerror', err)};

	network.setAddress = function (addr, port, cb) {
		if (!isNode) {
			server.addr = addr;
			server.port = port;
			cb();
		} else {
			dns.resolve4(addr, function (err, addresses) {
				if (err) {
					cb(err.toString());
					return;
				}
				server.addr = addresses[0];
				server.port = port;
				cb(null);
			});
		}
	}
	
	return network;

});