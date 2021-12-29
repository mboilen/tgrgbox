function component() {
    var key = new URLSearchParams(window.location.search).get('key');
    var sourcesList = __SOURCES__;
    var player = OvenPlayer.create("player", {
        sources: sourcesList
    });
}
component();
