import {Rect} from '../geometry';
import {GameEvent} from '../util';
import {Component} from './component';

export class Fill extends Component {
    /**
     * Fill a rectangular area
     *
     * @param rect The target area
     * @param color The color with which to fill the area
     */
    constructor(private rect: Rect, private color: string | CanvasGradient | CanvasPattern = '#ffffff') {
        super();

        // Means of pre-caution
        this.rect = this.rect.copy();
    }

    public draw(canvas: HTMLCanvasElement, canvas_rect: Rect, event: GameEvent): void {
        let context: CanvasRenderingContext2D = canvas.getContext('2d');

        context.save();

        context.fillStyle = this.color;
        context.fillRect(...this.rect.spread());

        context.restore();
    }
}
