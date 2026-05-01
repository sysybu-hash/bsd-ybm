class GeminiLivePlaybackProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.queue = [];
    this.offset = 0;

    this.port.onmessage = (event) => {
      if (event.data === "interrupt") {
        this.queue = [];
        this.offset = 0;
        return;
      }

      if (event.data instanceof Float32Array) {
        this.queue.push(event.data);
      }
    };
  }

  process(_inputs, outputs) {
    const output = outputs[0];
    const channel = output && output[0];
    if (!channel) return true;

    let outputIndex = 0;

    while (outputIndex < channel.length && this.queue.length > 0) {
      const current = this.queue[0];
      if (!current || current.length === 0) {
        this.queue.shift();
        this.offset = 0;
        continue;
      }

      const copyLength = Math.min(channel.length - outputIndex, current.length - this.offset);
      for (let index = 0; index < copyLength; index += 1) {
        channel[outputIndex] = current[this.offset];
        outputIndex += 1;
        this.offset += 1;
      }

      if (this.offset >= current.length) {
        this.queue.shift();
        this.offset = 0;
      }
    }

    while (outputIndex < channel.length) {
      channel[outputIndex] = 0;
      outputIndex += 1;
    }

    return true;
  }
}

registerProcessor("gemini-live-playback", GeminiLivePlaybackProcessor);
