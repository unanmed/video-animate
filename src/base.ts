import EventEmitter from 'eventemitter3';
import { reactive } from 'vue';

interface VideoAnimateConstructor {
    /** 动画名称 */
    name: string;
    new (): VideoAnimate;
}

interface VideoAnimateEvent {
    end: [];
    pause: [];
    start: [];
    recordEnd: [];
}

export abstract class VideoAnimate extends EventEmitter<VideoAnimateEvent> {
    static list: VideoAnimateConstructor[] = reactive([]);

    /** 动画持续时长 */
    abstract readonly duration: number;

    /** 当前是否处于暂停状态 */
    paused: boolean = true;

    startTime: number = 0;

    /** 动画画到的画布 */
    abstract readonly canvas: HTMLCanvasElement;

    private recorder?: MediaRecorder;

    /**
     * 从头开始播放动画
     */
    async play(): Promise<void> {
        if (!this.paused) return Promise.resolve();
        await this.start();
        this.paused = false;
        this.startTime = Date.now();
        this.emit('start');
    }

    /**
     * 结束动画
     */
    async stop(): Promise<void> {
        if (this.paused) return;
        await this.pause();
        this.paused = true;
        this.emit('pause');
    }

    /**
     * 编码成视频
     */
    async encode(mime: string, rate: number = 60): Promise<string> {
        const stream = this.canvas.captureStream(rate);
        const recorder = new MediaRecorder(stream, { mimeType: mime });
        await this.end();
        this.paused = true;
        this.emit('end');
        await this.start();
        this.paused = false;
        this.startTime = Date.now();
        const chunks: Blob[] = [];
        recorder.addEventListener('dataavailable', e => {
            chunks.push(e.data);
        });
        this.recorder = recorder;
        recorder.start();
        return new Promise(res => {
            recorder.addEventListener('stop', () => {
                const blob = new Blob(chunks, { type: mime });
                const url = URL.createObjectURL(blob);
                this.emit('recordEnd');
                res(url);
            });
        });
    }

    /**
     * 当动画被动完成时，即播放完毕后，需要调用此函数
     */
    protected ended() {
        this.end();
        this.recorder?.stop();
        this.paused = true;
        this.emit('end');
    }

    /**
     * 主动暂停时调用
     */
    protected abstract pause(): Promise<void>;

    /**
     * 从头开始播放动画
     */
    protected abstract start(): Promise<void>;

    /**
     * 会在动画被动播放完毕后被调用
     */
    protected abstract end(): Promise<void>;

    abstract destory(): void;

    static register(animate: VideoAnimateConstructor) {
        this.list.push(animate);
    }
}
