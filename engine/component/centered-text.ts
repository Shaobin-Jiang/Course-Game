import {Rect} from '../geometry';
import {GameEvent} from '../util';
import {Component} from './component';

export class CenteredText extends Component {
    constructor(
        private text: string,
        private rect: Rect,
        private color: string | CanvasGradient | CanvasPattern,
        private font_size: number
    ) {
        super();
    }

    public draw(canvas: HTMLCanvasElement, rect: Rect, event: GameEvent): void {
        let context: CanvasRenderingContext2D = canvas.getContext('2d');

        context.save();

        context.fillStyle = this.color;
        context.font = `bold ${this.font_size}px "Microsoft Yahei"`;
        context.textBaseline = 'middle';
        context.textAlign = 'center';
        context.fillText(
            this.text,
            this.rect.x + this.rect.width / 2,
            this.rect.y + this.rect.height / 2,
            this.rect.width
        );

        context.restore();
    }
}
