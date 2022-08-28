function component() {
    var key = new URLSearchParams(window.location.search).get('key');
    var sourcesList = __SOURCES__;
    var player = OvenPlayer.create("player", {
        "autoStart": false,
        "autoFallback": true,
        "mute": false,
        "hlsConfig": {
            "liveSyncDuration": 0.5,
            "liveMaxLatencyDuration": 2,
            "maxLiveSyncPlaybackRate": 1.5
        },
        "sources": sourcesList
    });
}
component();
