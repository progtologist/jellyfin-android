export class ExoPlayerPlugin {
    constructor({ events, playbackManager, appSettings, loading, dashboard }) {
        window['ExoPlayer'] = this;

        this.events = events;
        this.playbackManager = playbackManager;
        this.appSettings = appSettings;
        this.loading = loading;
        this.dashboard = dashboard;

        this.name = 'ExoPlayer';
        this.type = 'mediaplayer';
        this.id = 'exoplayer';

        // Prioritize first
        this.priority = -1;
        this.isLocalPlayer = true;

        // Current playback position in milliseconds
        this._currentTime = 0;
        this._paused = true;

        this._nativePlayer = window['NativePlayer'];
    }

    async play(options) {
        // Sanitize input
        options.ids = options.items.map(item => item.Id);
        delete options.items;

        // Read the "limit maximum supported video resolution" setting, when the server's web
        // client provides it. Older servers don't, so only forward a limit when it is enabled.
        const limitVideoResolution = this.appSettings.limitSupportedVideoResolution?.();
        const maxVideoWidth = limitVideoResolution ? (this.appSettings.maxVideoWidth?.() ?? 0) : 0;

        // Read the "Maximum Allowed Audio Channels" playback setting (2 = stereo, 6 = 5.1). Zero
        // means automatic, which the native side resolves from the device's audio output. Guarded
        // like the setting above, as an older server's web client may not provide these.
        const userId = this.dashboard?.getCurrentUserId?.();
        const allowedAudioChannels = parseInt(this.appSettings.get?.('allowedAudioChannels', userId), 10);
        const maxAudioChannels = allowedAudioChannels > 0 ? allowedAudioChannels : 0;

        const preferences = {
            maxStreamingBitrateLocal: this.appSettings.maxStreamingBitrate(true, 'Video'),
            maxStreamingBitrateRemote: this.appSettings.maxStreamingBitrate(false, 'Video'),
            maxVideoWidth,
            maxAudioChannels,
        };

        this._paused = false;
        this._nativePlayer.loadPlayer(JSON.stringify(options), JSON.stringify(preferences));
        this.loading.hide();
    }

    shuffle(item) {}

    instantMix(item) {}

    queue(options) {}

    queueNext(options) {}

    canPlayMediaType(mediaType) {
        return mediaType === 'Video';
    }

    canQueueMediaType(mediaType) {
        return this.canPlayMediaType(mediaType);
    }

    canPlayItem(item, playOptions) {
        return this._nativePlayer.isEnabled() &&
            playOptions.fullscreen &&
            !this.playbackManager.syncPlayEnabled;
    }

    async stop(destroyPlayer) {
        this._nativePlayer.stopPlayer();

        if (destroyPlayer) {
            this.destroy();
        }
    }

    nextTrack() {}

    previousTrack() {}

    seek(ticks) {
        this._nativePlayer.seekTicks(ticks);
    }

    currentTime(ms) {
        if (ms !== undefined) {
            this._nativePlayer.seekMs(ms);
        }
        return this._currentTime;
    }

    duration(val) {
        return null;
    }

    /**
     * Get or set volume percentage as as string
     */
    volume(volume) {
        if (volume !== undefined) {
            this.setVolume(volume);
        }
        return null;
    }

    getVolume() {}

    setVolume(vol) {
        let volume = parseInt(vol);
        this._nativePlayer.setVolume(volume);
    }

    volumeUp() {}

    volumeDown() {}

    isMuted() {
        return false;
    }

    setMute(mute) {
        // Assume 30% as default when unmuting
        this._nativePlayer.setVolume(mute ? 0 : 30);
    }

    toggleMute() {}

    paused() {
        return this._paused;
    }

    pause() {
        this._paused = true;
        this._nativePlayer.pausePlayer();
    }

    unpause() {
        this._paused = false;
        this._nativePlayer.resumePlayer();
    }

    playPause() {
        if (this._paused) {
            this.unpause();
        } else {
            this.pause();
        }
    }

    canSetAudioStreamIndex() {
        return false;
    }

    setAudioStreamIndex(index) {}

    setSubtitleStreamIndex(index) {}

    async changeAudioStream(index) {}

    async changeSubtitleStream(index) {}

    getPlaylist() {
        return Promise.resolve([]);
    }

    getCurrentPlaylistItemId() {}

    setCurrentPlaylistItem() {
        return Promise.resolve();
    }

    removeFromPlaylist() {
        return Promise.resolve();
    }

    destroy() {
        this._nativePlayer.destroyPlayer();
    }

    async getDeviceProfile() {
        return {
            Name: 'ExoPlayer Stub',
            MaxStreamingBitrate: 100000000,
            MaxStaticBitrate: 100000000,
            MusicStreamingTranscodingBitrate: 320000,
            DirectPlayProfiles: [{Type: 'Video'}, {Type: 'Audio'}],
            CodecProfiles: [],
            SubtitleProfiles: [],
            TranscodingProfiles: []
        };
    }
}
