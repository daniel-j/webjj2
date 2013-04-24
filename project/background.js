chrome.app.runtime.onLaunched.addListener(function () {
	chrome.app.window.create('app.html', {
		width: 640,
		height: 480,
		minWidth: 320,
		minHeight: 480,
		maxWidth: 640,
		maxHeight: 480
	});
});
