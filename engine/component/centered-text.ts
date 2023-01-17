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

    static async from(params: Array<any>): Promise<() => CenteredText> {
        params[1] = new Rect(...(params[1] as [number, number, number, number]));
        return () => new CenteredText(...(params as [string, Rect, string, number]));
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
