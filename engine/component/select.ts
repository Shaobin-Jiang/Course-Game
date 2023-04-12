import {GameEvent, loadImage} from '../util';
import {Rect} from '../geometry';
import {Button} from './button';

export class Select extends Button {
    /**
     * Select / Unselect object; in other words, the state of being selected can be toggled
     *
     * @param rect The rect of the component
     * @param bg_image The background image of the component
     * @param fg_image The foreground image, i.e., the object to select, of the component
     */
    constructor(
        rect: Rect,
        bg_image: HTMLImageElement,
        private fg_image: HTMLImageElement | null = null,
        curved: boolean = true
    ) {
        super('', rect, 0, bg_image);

        this.curved = curved;

        if (this.fg_image != null) {
            let foreground_size_limit: number = 0.6;
            let foreground_ratio: number = this.fg_image.width / this.fg_image.height;
            let foreground_width: number, foreground_height: number;

            if (foreground_ratio >= this.rect.width / this.rect.height) {
                foreground_width = this.rect.width * foreground_size_limit;
                foreground_height = foreground_width / foreground_ratio;
            } else {
                foreground_height = this.rect.height * foreground_size_limit;
                foreground_width = foreground_height * foreground_ratio;
            }

            this.foreground_rect = new Rect(
                this.rect.x + this.rect.width / 2 - foreground_width / 2,
                this.rect.y + this.rect.height / 2 - foreground_height / 2,
                foreground_width,
                foreground_height
            );
        }
    }

    static async from(params: Array<any>): Promise<() => Select> {
        params[0] = new Rect(...(params[0] as [number, number, number, number]));
        params[1] = await loadImage(params[1] as string);
        if (params.length >= 3) {
            if (params[2] == '') {
                params[2] = null;
            } else {
                params[2] = await loadImage(params[2] as string);
            }
        }
        return () => new Select(...(params as [Rect, HTMLImageElement]));
    }

    private foreground_rect: Rect;

    public selected: boolean = false;

    public onclick: Function = () => {
        this.selected = !this.selected;
    };

    protected draw_foreground(context: CanvasRenderingContext2D): void {
        // Do not make the image transparent together with the background; extremely hedious
        context.save();
        context.globalAlpha = 1;

        if (this.fg_image != null) {
            context.drawImage(
                this.fg_image,
                this.foreground_rect.x,
                this.foreground_rect.y,
                this.foreground_rect.width,
                this.foreground_rect.height
            );
        }

        // Cover the button with a semi-transparent black mask
        if (this.selected) {
            context.globalAlpha = 0.4;
            context.fillStyle = '#000000';

            if (this.curved) {
                this.draw_curved_border(context);
            } else {
                this.draw_border(context);
            }
            context.fill();
        }

        context.restore();
    }

    public draw(canvas: HTMLCanvasElement, rect: Rect, event: GameEvent): void {
        super.draw(canvas, rect, event);
    }

    public summary: () => {[prop: string]: any} = () => {
        return {
            whereabout: this.selected,
        };
    };
}
