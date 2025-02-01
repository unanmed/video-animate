<template>
    <div class="main">
        <div class="preview">
            <canvas ref="aniCanvas"></canvas>
        </div>
        <div class="control">
            <span class="play" @click="playing ? stop() : play()">
                <PauseOutlined v-if="playing"></PauseOutlined>
                <CaretRightOutlined v-else></CaretRightOutlined>
            </span>
            <span class="progress">
                <canvas ref="progressCanvas"></canvas>
            </span>
            <span class="progress-text">{{ progressText }}</span>
            <span class="select">
                <Select v-model:value="selected">
                    <SelectOption
                        v-for="(v, i) of VideoAnimate.list"
                        :value="i"
                        >{{ v.name }}</SelectOption
                    >
                </Select>
            </span>
            <span class="output" @click="encode">
                <Button type="primary">输出</Button>
            </span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons-vue';
import { Select, SelectOption, Button } from 'ant-design-vue';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { VideoAnimate } from './base';
import { Ticker } from 'mutate-animate';

const playing = ref(false);
const selected = ref(0);
const currentTime = ref(0);
const duration = ref(0);

const nowAnimation = ref<VideoAnimate>();

const progressCanvas = ref<HTMLCanvasElement>();
const aniCanvas = ref<HTMLCanvasElement>();
let progressCtx: CanvasRenderingContext2D;
let aniCtx: CanvasRenderingContext2D;

let encoding = false;
let startTime = 0;

function pad(num: number) {
    return num.toString().padStart(2, '0');
}

const progressText = computed(() => {
    const currentSec = Math.floor(currentTime.value / 1000) % 60;
    const currentMin = Math.floor(currentTime.value / 1000 / 60);
    const durationSec = Math.floor(duration.value / 1000) % 60;
    const durationMin = Math.floor(duration.value / 1000 / 60);
    return `${pad(currentMin)}:${pad(currentSec)} / ${pad(durationMin)}:${pad(
        durationSec
    )}`;
});

const ticker = new Ticker();

watch(selected, v => {
    selectAnimation(v);
});

async function play() {
    if (encoding) return;
    playing.value = true;
    await nowAnimation.value?.play();
    startTime = Date.now();
}

async function stop() {
    if (encoding) return;
    playing.value = false;
    await nowAnimation.value?.stop();
}

async function encode() {
    stop();
    encoding = true;
    startTime = Date.now();
    playing.value = true;
    const url = await nowAnimation.value?.encode('video/webm', 60);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.webm';
    a.click();
    URL.revokeObjectURL(url);
    encoding = false;
    playing.value = false;
}

function selectAnimation(index: number) {
    stop();
    const Animation = VideoAnimate.list[index];
    if (nowAnimation.value) {
        nowAnimation.value.destory();
    }
    const ins = new Animation();
    nowAnimation.value = ins;
    duration.value = ins.duration;
    resizeAni();
}

function clamp(x: number, min: number, max: number) {
    return x < min ? min : x > max ? max : x;
}

function drawProgress() {
    const progress = progressCanvas.value;
    if (!progress) return;
    const { width, height } = progress;
    const ctx = progressCtx;
    ctx.clearRect(0, 0, width, height);
    const halfHeight = height / 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#bbb';
    ctx.beginPath();
    ctx.moveTo(halfHeight, halfHeight);
    ctx.lineTo(width - halfHeight, halfHeight);
    ctx.stroke();
    const ratio = currentTime.value / duration.value;
    const pos = clamp(isNaN(ratio) ? 0 : ratio, 0, 1) * (width - height);
    if (pos !== 0) {
        ctx.strokeStyle = '#000';
        ctx.beginPath();
        ctx.moveTo(halfHeight, halfHeight);
        ctx.lineTo(halfHeight + pos, halfHeight);
        ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(pos + halfHeight, halfHeight, 8, 0, Math.PI * 2);
    ctx.fill();
}

function drawScene() {
    if (playing.value) {
        currentTime.value = Date.now() - startTime;
        if (currentTime.value > duration.value) {
            currentTime.value = duration.value;
            stop();
        }
    } else {
        currentTime.value = 0;
    }
    const ani = aniCanvas.value;
    if (!ani) return;
    const ctx = aniCtx;
    const toDraw = nowAnimation.value?.canvas;
    if (!toDraw) return;
    ctx.clearRect(0, 0, ani.width, ani.height);
    ctx.drawImage(toDraw, 0, 0, ani.width, ani.height);
}

function resizeProgress() {
    const p = progressCanvas.value;
    if (!p) return;
    progressCtx = p.getContext('2d')!;
    p.width = window.innerWidth * 0.5 * 0.8 * devicePixelRatio;
    p.height = 32 * devicePixelRatio;
    p.style.width = `${window.innerWidth * 0.6 * 0.8}px`;
    p.style.height = `32px`;
}

function resizeAni() {
    if (!nowAnimation.value) return;
    const canvas = aniCanvas.value;
    if (!canvas) return;
    const ani = nowAnimation.value.canvas;
    canvas.width = ani.width;
    canvas.height = ani.height;
    const maxWidth = window.innerWidth * 0.8;
    const maxHeight = window.innerHeight * 0.8;
    const aspect = maxWidth / maxHeight;
    const aniAspect = ani.width / ani.height;
    if (aniAspect > aspect) {
        canvas.style.width = `${maxWidth}px`;
        canvas.style.height = `${maxWidth / aniAspect}px`;
    } else {
        canvas.style.width = `${maxHeight * aniAspect}px`;
        canvas.style.height = `${maxHeight}px`;
    }
}

onMounted(() => {
    aniCtx = aniCanvas.value?.getContext('2d')!;
    selectAnimation(0);
    ticker.add(drawProgress);
    ticker.add(drawScene);
    resizeProgress();
    resizeAni();
});

onUnmounted(() => {
    ticker.destroy();
});

window.addEventListener('resize', () => {
    resizeProgress();
    resizeAni();
});
</script>

<style scoped>
.main {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #eee;
    align-items: center;
    justify-content: center;
}

.preview {
    width: 80%;
    height: 80%;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #888;
}

.control {
    width: 80%;
    height: 10%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
}

.play {
    width: 5%;
    font-size: 32px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.play:hover {
    color: rgb(0, 226, 226);
}

.progress {
    width: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.progress-text {
    width: 15%;
    display: flex;
    justify-content: center;
    align-items: center;
}

.select {
    width: 20%;
}

.select > * {
    width: 100%;
}

.progress canvas {
    width: 100%;
    height: 100%;
}

.output {
    width: 10%;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
