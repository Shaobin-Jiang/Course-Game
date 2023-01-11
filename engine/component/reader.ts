import {Rect} from '../geometry';
import {GameEvent} from '../util';
import {Component} from './component';

export class Reader extends Component {
    /**
     * Paper reader, with scrolling enabled
     *
     * @param content The image to display to the player
     * @param rect The rect of the component
     */
    constructor(private content: HTMLImageElement, private rect: Rect) {
        super();

        // Means of pre-caution
        this.rect = this.rect.copy();

        // Always fit width of the reader
        this.scale_factor = rect.width / content.width;

        this.min_progress = Math.min(rect.height / (content.height * this.scale_factor), 1);
        this.progress = this.min_progress;

        this.disable_scroll = rect.height >= content.height * this.scale_factor;

        // If the rendered image is shorter than the reader, there is no need to make this component un-frozen
        if (this.disable_scroll) {
            this.prevent_freeze = false;
            this.has_reached_bottom = true;
        }

        // Add mouse wheel listener
        window.addEventListener('wheel', this.mouse_wheel_callback);
    }

    // Minimum progress allowed; i.e., the progress when scroll bar is at the top
    private min_progress: number;
    private progress: number;

    private scale_factor: number;

    private disable_scroll: boolean = false;

    private scroll_bar_width: number = this.rect.width / 100;

    private is_scrolling: boolean = false;
    private last_draw_button_status: number = -1;

    // Record where the user clicked down on the scroll thumb; used as a basis to place the scroll thumb
    private button_down_position: number | null = null;
    private button_down_progress: number | null = null;

    private mouse_wheel_scroll: number = 0;

    private mouse_wheel_callback: EventListener = (event: WheelEvent) => {
        this.mouse_wheel_scroll = event.deltaY;
    };

    private get_scroll_thumb_rect(progress: number = this.progress): Rect {
        progress = Math.min(Math.max(progress, this.min_progress), 1);

        return new Rect(
            this.rect.x + this.rect.width,
            this.rect.y + this.rect.height * (this.progress - this.min_progress),
            this.scroll_bar_width,
            this.rect.height * this.min_progress
        );
    }

    public has_reached_bottom: boolean = false;

    // Unfreeeze the component
    public prevent_freeze: boolean = true;

    public draw(canvas: HTMLCanvasElement, rect: Rect, event: GameEvent): void {
        let context: CanvasRenderingContext2D = canvas.getContext('2d');

        context.save();

        context.beginPath();
        context.rect(...this.rect.spread());
        context.clip();

        context.drawImage(
            this.content,
            this.rect.x,
            this.rect.y - this.content.height * this.scale_factor * (this.progress - this.min_progress),
            this.rect.width,
            this.content.height * this.scale_factor
        );

        context.restore();

        if (!this.disable_scroll) {
            let progress: number = this.progress;

            if (this.mouse_wheel_scroll == 0) {
                if (event.button == 0) {
                    if (this.last_draw_button_status == -1) {
                        if (event.position.inside(this.get_scroll_thumb_rect())) {
                            this.is_scrolling = true;
                            this.button_down_position = event.position.y;
                            this.button_down_progress = this.progress;
                        } else if (
                            event.position.inside(
                                new Rect(
                                    this.rect.x + this.rect.width,
                                    this.rect.y,
                                    this.scroll_bar_width,
                                    this.rect.height
                                )
                            )
                        ) {
                            this.is_scrolling = false;
                            progress = (event.position.y - this.rect.y) / this.rect.height + this.min_progress;
                            this.progress = Math.min(Math.max(progress, this.min_progress), 1);
                        }
                    }
                } else {
                    this.is_scrolling = false;
                }
            } else {
                this.is_scrolling = false;
            }

            if (this.is_scrolling) {
                progress =
                    (event.position.y - this.button_down_position) / this.rect.height + this.button_down_progress;
                this.progress = Math.min(Math.max(progress, this.min_progress), 1);
            } else if (this.mouse_wheel_scroll != 0) {
                progress +=
                    this.mouse_wheel_scroll /
                    (this.content.height * (document.documentElement.clientWidth / this.content.width));
                this.progress = Math.min(Math.max(progress, this.min_progress), 1);
                this.mouse_wheel_scroll = 0;
            }

            context.save();

            // Scroll bar background
            context.fillStyle = '#F1F1F1';
            context.fillRect(this.rect.x + this.rect.width, this.rect.y, this.scroll_bar_width, this.rect.height);

            // Scroll bar thumb
            context.fillStyle = this.is_scrolling ? '#787878' : '#A8A8A8';
            context.fillRect(
                this.rect.x + this.rect.width,
                this.rect.y + this.rect.height * (this.progress - this.min_progress),
                this.scroll_bar_width,
                this.rect.height * this.min_progress
            );

            context.restore();

            this.last_draw_button_status = event.button;
            
            if (this.progress >= 0.95) {
                this.has_reached_bottom = true;
            }
        }
    }

    public destroy(): void {
        window.removeEventListener('wheel', this.mouse_wheel_callback);
    }
}
