import {Rect} from '../geometry';
import {GameEvent} from '../util';
import {Component} from './component';

export class Timer extends Component {
    /**
     * A count down timer; use the `finished` parameter to check whether the timer has reached its end
     *
     * @param initial_time The initial time of the timer in seconds
     * @param rect The rect of the component; note though, that only one of the width or the height needs to be set and
     * sets the other to a value smaller than 0; if both are set, the width will be used and the height will be adjusted
     */
    constructor(private initial_time: number, private rect: Rect) {
        super();

        this.initial_time = Math.max(Math.min(this.initial_time, 3599), 0);

        // Adjust component rect; aspect ratio is 3 : 1
        if (this.rect.width < 0) {
            this.rect.width = this.rect.height * Timer.aspect_ratio;
        } else {
            this.rect.height = this.rect.width / Timer.aspect_ratio;
        }

        this.time = this.initial_time;
    }

    static readonly aspect_ratio: number = 3;

    private start_time: number = -1;

    private time: number;

    public get finished(): boolean {
        return this.time == 0;
    }


    // Unfreeeze the component
    public prevent_freeze: boolean = true;

    public draw(canvas: HTMLCanvasElement, rect: Rect, event: GameEvent): void {
        let context: CanvasRenderingContext2D = canvas.getContext('2d');

        if (this.start_time == -1) {
            this.start_time = performance.now();
        }

        this.time = Math.max(Math.round(this.initial_time - (performance.now() - this.start_time) / 1000), 0);

        let minute: number = Math.floor(this.time / 60);
        let second: number = this.time - minute * 60;
        let time_str: string = `${`0${minute}`.slice(-2)} : ${`0${second}`.slice(-2)}`;

        context.save();

        context.fillStyle = '#252525';
        context.globalAlpha = 0.6;
        context.fillRect(...this.rect.spread());

        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.font = `bold ${this.rect.height / 2}px "Microsoft Yahei"`;
        context.fillStyle = '#A52A2A';
        context.globalAlpha = 1;
        context.fillText(time_str, this.rect.x + this.rect.width / 2, this.rect.y + this.rect.height / 2);

        context.restore();
    }
}
