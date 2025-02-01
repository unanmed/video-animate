import { hyper, Ticker, type TimingFn } from 'mutate-animate';
import { VideoAnimate } from '../../base';

// 东方斗蛐蛐1的出场选手动画

interface CompetitorName {
    name: string;
    title: string;
}

const names: CompetitorName[] = [
    { name: '爱丽丝·玛格特洛依德', title: '七色的人偶使' },
    { name: '琪露诺', title: '冰之妖精' },
    { name: '爱塔妮缇拉尔瓦', title: '接近神的蝴蝶妖精' },
    { name: '键山雏', title: '秘神流雏' },
    { name: '蓬莱山辉夜', title: '永远和须臾的罪人' },
    { name: '古明地恋', title: '紧闭的恋之瞳' },
    { name: '莉莉白', title: '运送春天的妖精' },
    { name: '杖刀偶磨弓', title: '埴轮兵长' },
    { name: '梅蒂欣·梅兰可莉', title: '小小的甜蜜毒药' },
    { name: '村纱水蜜', title: '水难事故的念缚灵' },
    { name: '纳兹琳', title: '探宝的小小大将' },
    { name: '河城荷取', title: '超妖怪弹头' },
    { name: '露米娅', title: '宵暗的妖怪' },
    { name: '十六夜咲夜', title: '完美而潇洒的从者' },
    { name: '鬼人正邪', title: '逆袭的天邪鬼' },
    { name: '清兰', title: '浅葱色的 Eagle Rabbit' },
    { name: '赤蛮奇', title: '辘轳首的怪奇' },
    { name: '丰聪耳神子', title: '圣德道士' }
];

export class Animate11 extends VideoAnimate {
    static name: string = '东方斗蛐蛐1的出场选手动画';

    private readonly perTime: number = 3000;
    readonly duration: number;
    canvas: HTMLCanvasElement;

    private ctx: CanvasRenderingContext2D;
    private loaded: boolean = false;
    private loadPromise!: Promise<void[]>;
    private ticker: Ticker = new Ticker();

    private images: HTMLImageElement[] = [];
    private easing: TimingFn = hyper('tan', 'center');

    constructor() {
        super();
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d')!;
        this.duration = this.perTime * 18;

        this.canvas.width = 1920;
        this.canvas.height = 1080;

        this.load();
    }

    private async load() {
        if (this.loaded) return Promise.resolve([]);
        if (this.loadPromise) return this.loadPromise;

        const url = names.map((_, i) => {
            return `/video1/${i + 1}.png`;
        });
        const load = url.map(v => {
            const image = new Image();
            image.src = v;
            this.images.push(image);
            return new Promise<void>(res => {
                image.addEventListener('load', () => {
                    res();
                });
            });
        });
        const fontLoad = async () => {
            const url = '/fonts/font1.ttf';
            const response = await fetch(url);
            const font = new FontFace('font1', await response.arrayBuffer());
            font.load();
            document.fonts.add(font);
        };
        const promise = Promise.all([...load, fontLoad()]);
        this.loadPromise = promise;
        return promise;
    }

    private tick = () => {
        const time = Date.now() - this.startTime;
        const n = Math.floor(time / this.perTime);

        if (n >= 18) {
            this.ended();
            return;
        }

        const image = this.images[n];

        const dt = time - n * this.perTime;
        const progress = this.easing(dt / this.perTime);
        const { name, title } = names[n];
        const { width, height } = this.canvas;
        const rightX = (width * 2) / 3 + (0.5 - progress) * 3 * width * 0.1;
        const rightY = height / 2 + (progress - 0.5) * 3 * height;
        const leftX = width / 3 + (progress - 0.5) * 3 * width * 0.1;
        const leftY = height / 2 + (0.5 - progress) * 3 * height;
        const aspect = image.width / image.height;
        const iw = 300;
        const hw = iw / 2;
        const ih = iw / aspect;
        const hh = ih / 2;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.translate(leftX + hw, leftY - hh);
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(image, 0, 0, iw, ih);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.font = 'italic 72px font1';
        this.ctx.fillStyle = '#00FF99';
        this.ctx.fillText(name, rightX, rightY - 16);
        this.ctx.textBaseline = 'top';
        this.ctx.fillStyle = '#C0C0C0';
        this.ctx.fillText(title, rightX, rightY + 16);
    };

    protected async pause() {
        this.ticker.remove(this.tick);
    }

    protected async start() {
        await this.load();
        this.ticker.add(this.tick);
    }

    protected async end() {
        this.ticker.remove(this.tick);
        this.ctx.reset();
    }

    destory(): void {
        this.ticker.destroy();
    }
}
