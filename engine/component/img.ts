import {Rect} from '../geometry';
import {GameEvent, loadImage} from '../util';
import {Component} from './component';

export class Img extends Component {
    /**
     * Render plain image data
     *
     * @param image The image to be rendered
     * @param rect The rect of the rendered image, the lack of which would render the image at its original size
     */
    constructor(private image: HTMLImageElement, protected rect: Rect | null = null) {
        super();

        // Means of pre-caution
        this.rect = this.rect.copy();
    }

    static async from(params: Array<any>): Promise<() => Img> {
        params[0] = await loadImage(params[0] as string);
        params[1] = new Rect(...(params[1] as [number, number, number, number]));
        return () => new Img(params[0] as HTMLImageElement, params[1] as Rect);
    }

    public draw(canvas: HTMLCanvasElement, canvas_rect: Rect, event: GameEvent): void {
        let context: CanvasRenderingContext2D = canvas.getContext('2d');

        if (this.rect != null) {
            context.drawImage(this.image, this.rect.x, this.rect.y, this.rect.width, this.rect.height);
        } else {
            context.drawImage(this.image, 0, 0, this.image.naturalWidth, this.image.naturalHeight);
        }
    }
}
