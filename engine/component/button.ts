import {Game} from '../game';
import {Component} from './component';
import {Rect} from '../geometry';
import {GameEvent} from '../util';

export class Button extends Component {
    /**
     * A clickable button; the callback is set by defining the `onclick` parameter of the button instance
     *
     * @param text The content of the button; displayed horizontally and vertically centered
     * @param rect The rect of the button component
     * @param font_size Size of the font in pixels
     * @param bg_image Background image of the button
     * @param bg_color The background color of the button; white by default
     * @param fg_color The color of the text; black by default
     */
    constructor(
        private text: string,
        protected rect: Rect,
        private font_size: number,
        protected bg_image: HTMLImageElement | null = null,
        private bg_color: string | CanvasGradient | CanvasPattern = '#ffffff',
        private fg_color: string | CanvasGradient | CanvasPattern = '#000000'
    ) {
        super();
    }

    // Mouse state in the last frame
    private last_draw_button_state: number = -1;

    // Indicate whether the button is being held
    private button_held: boolean = false;

    // Set border of the button
    // Make a stand-alone function out of this because there are other classes inheriting from the `Button` class which
    // would need to use the precise range (round border included) of the button
    protected draw_border(context: CanvasRenderingContext2D) {
        let border_radius: number = Math.min(this.rect.width, this.rect.height) / 10;

        // Draw background of the button
        context.beginPath();
        context.moveTo(this.rect.x + border_radius, this.rect.y);
        context.lineTo(this.rect.x + this.rect.width - border_radius, this.rect.y);
        context.arcTo(
            this.rect.x + this.rect.width,
            this.rect.y,
            this.rect.x + this.rect.width,
            this.rect.y + border_radius,
            border_radius
        );
        context.lineTo(this.rect.x + this.rect.width, this.rect.y + this.rect.height - border_radius);
        context.arcTo(
            this.rect.x + this.rect.width,
            this.rect.y + this.rect.height,
            this.rect.x + this.rect.width - border_radius,
            this.rect.y + this.rect.height,
            border_radius
        );
        context.lineTo(this.rect.x + border_radius, this.rect.y + this.rect.height);
        context.arcTo(
            this.rect.x,
            this.rect.y + this.rect.height,
            this.rect.x,
            this.rect.y + this.rect.height - border_radius,
            border_radius
        );
        context.lineTo(this.rect.x, this.rect.y + border_radius);
        context.arcTo(this.rect.x, this.rect.y, this.rect.x + border_radius, this.rect.y, border_radius);
    }

    // Draw the content of the button
    // Make a stand-alone function out of this because there are other classes inheriting from the `Button` class which
    // might not be drawing text, but is drawing an image as the foreground
    protected draw_foreground(context: CanvasRenderingContext2D): void {
        context.font = `${this.font_size}px "Microsoft YaHei"`;

        context.textBaseline = 'middle';

        context.textAlign = 'center';

        context.fillStyle = this.fg_color;

        context.fillText(
            this.text,
            this.rect.x + this.rect.width / 2,
            this.rect.y + this.rect.height / 2,
            this.rect.width
        );
    }

    // Unfreeeze the component
    public prevent_freeze: boolean = true;

    public onclick: Function = () => {};

    public draw(canvas: HTMLCanvasElement, rect: Rect, event: GameEvent): void {
        let context: CanvasRenderingContext2D = canvas.getContext('2d');

        let hover: boolean = event.position.inside(this.rect);

        // Button toggles from being unclicked to clicked
        if (this.last_draw_button_state == -1 && event.button == 0 && hover) {
            this.button_held = true;
        } else if (event.button == -1) {
            // Button released within the range of the button
            if (this.button_held && hover) {
                this.onclick();
            }

            this.button_held = false;
        }

        context.save();

        // If button has focus, change opacity
        if ((hover && event.button != 0) || this.button_held) {
            context.globalAlpha = 0.6;
            Game.message('set-cursor', 'pointer');
        } else {
            context.globalAlpha = 1;
            Game.message('set-cursor', 'default');
        }

        this.draw_border(context);

        if (this.bg_image == null) {
            context.fillStyle = this.bg_color;
            context.fill();
        } else {
            context.clip();
            context.drawImage(this.bg_image, this.rect.x, this.rect.y, this.rect.width, this.rect.height);
        }

        // Draw text
        this.draw_foreground(context);

        // Restore default
        context.restore();

        // Update last draw button state
        this.last_draw_button_state = event.button;
    }
}
