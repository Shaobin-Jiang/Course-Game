import {Rect} from '../geometry';
import {GameEvent} from '../util';
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
