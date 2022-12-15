import {cubicBezier, GameEvent} from '../util';
import {Rect} from '../geometry';
import {Img} from './img';

export class Marker extends Img {
    /**
     * The marker class is basically an extension of the `Img` class, with one exception: it can flash if we want it to
     *
     * By default, that option, which is the `flash` parameter, is turned off (`false`). If we really do want it to flash,
     * simply set that parameter to true.
     *
     * @param image The background image of the marker
     * @param rect The rect of the marker
     * @param flash Whether the marker should flash
     */
    constructor(image: HTMLImageElement, rect: Rect, private flash: boolean = false) {
        super(image, rect);
    }

    private flash_curve: (t: number) => number = cubicBezier(1, 0.2, 0.2, 1);

    private period: number = 2000; // In milliseconds
    private start_time: number = -1;

    public draw(canvas: HTMLCanvasElement, canvas_rect: Rect, event: GameEvent): void {
        let context: CanvasRenderingContext2D = canvas.getContext('2d');

        if (this.start_time == -1) {
            this.start_time = performance.now();
        }

        let previous_global_alpha = context.globalAlpha;

        if (this.flash) {
            let now: number = performance.now();
            let progress: number = ((now - this.start_time) % this.period) / this.period;
            context.globalAlpha = this.flash_curve(progress);
        }

        super.draw(canvas, canvas_rect, event);

        context.globalAlpha = previous_global_alpha;
    }
}
