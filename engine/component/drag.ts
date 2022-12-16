import {Rect} from '../geometry';
import {GameEvent} from '../util';
import {Img} from './img';

export class Drag extends Img {
    /**
     * Creates a draggable element. By setting the parameter `active` to `true` / `false`, one enable / disable dragging
     *
     * @param image The content image of the component
     * @param rect The rect of the component
     * @param target_area Target area that is highlighted when the drag component moves into them
     * @param absorb Whether the component should be absorbed to the target area when released; higher priority than
     * `restore_position_upon_loose`
     */
    constructor(
        image: HTMLImageElement,
        rect: Rect,
        private target_area: Array<Rect> | Rect | null = null,
        private absorb: boolean = false
    ) {
        super(image, rect);

        // Use a deep copy, or the default_rect would get modified accidentally
        this.default_rect = rect.copy();
    }

    // Register the drag components rendered
    //
    // This list is necessary so that we have a clear idea from within the component what is going on with other drag
    // components. Without it, we might end up dragging several drag components all at once, because otherwise, we would
    // be determining whether to drag a component based solely on the cursor position and the button state, so that when
    // several drag components have overlapping areas and the cursor ends up in that part, all these components would be
    // dragged. With this list, however, we can just check out which component is top-most, and only drag that one.
    //
    // Note, though, that we are presuming that the drag components are only being rendered to one canvas. This would be
    // reasonable, considering that in other resembling cases, such as adding elements to the DOM, there is only one DOM
    // object, but we are really not enforcing strict check upon the existence of only one renderer. That might change,
    // but for now, just do not try to draw drag components to different renderers, or things can get messy, and you
    // could end up bring devastating damage to the content of several canvases.
    static registered_list: Map<Drag, boolean> = new Map();

    // Store default rect of the component, so that when the `restore_position_upon_loose` option is set to `true`, the
    // component knows where to return to
    private default_rect: Rect;

    // Indicator of whether the component is currently being dragged
    private is_moving: boolean = false;

    // Indicator of the button state in the last frame; useful for detecting change of button status
    private last_draw_button_status: number = -1;

    // Whether to restore the component to its original position upon button up; priority lower than `absorb`
    // That is, if the component can stick to the center of a target area, it will stay there instead of returning to
    // the origin position
    public restore_position_upon_loose = false;

    // Indicator of where the component; -1 indicates it is not in any target area
    public whereabout: number = -1;

    public draw(canvas: HTMLCanvasElement, canvas_rect: Rect, event: GameEvent): void {
        // First time: register the current component in the registred_list
        if (!Drag.registered_list.has(this)) {
            Drag.registered_list.set(this, false);
        }

        // If we detect that there is a component above the present one that should also be dragged, skip the `is_moving`
        // check procedure
        let should_check: boolean = true;

        // If the current component is already being dragged, do not check for drag component above it
        // Otherwise, when the present component passes beneath another, it might stop
        if (!this.is_moving) {
            let key_list: Array<Drag> = Array.from(Drag.registered_list.keys());

            // If there is a drag component above the present component that the cursor is also in, do not drag this one
            for (let i = key_list.indexOf(this) + 1; i < key_list.length; i++) {
                if (event.position.inside(key_list[i].rect)) {
                    should_check = false;
                    break;
                }
            }
        }

        // Check upon last frame's `is_moving` value
        let was_moving: boolean = this.is_moving;

        // Only allow dragging when left button is down
        if (should_check) {
            if (
                // Left button is down
                event.button == 0 &&
                // Button state changes from up to down, and cursor is within the current component
                // Or the present component is already moving
                ((this.last_draw_button_status == -1 && event.position.inside(this.rect)) || this.is_moving)
            ) {
                this.is_moving = true;
            } else {
                this.is_moving = false;
            }
        }

        this.last_draw_button_status = event.button;

        // Highlight target area
        // Define it here so that we can use the `event` variable
        let highlight: (region: Rect) => boolean = (region: Rect) => {
            if (event.position.inside(region)) {
                let ctx: CanvasRenderingContext2D = canvas.getContext('2d');
                let fillStyle: string | CanvasGradient | CanvasPattern = ctx.fillStyle;
                ctx.fillStyle = '#cce099'; // light green
                ctx.fillRect(region.x, region.y, region.width, region.height);
                ctx.fillStyle = fillStyle;
                return true;
            } else {
                return false;
            }
        };

        if (this.is_moving) {
            let x: number = event.position.x - this.rect.width / 2;
            let y: number = event.position.y - this.rect.height / 2;

            this.rect.x = Math.min(Math.max(0, x), canvas_rect.width - this.rect.width);
            this.rect.y = Math.min(Math.max(0, y), canvas_rect.height - this.rect.height);

            // If in target area, highlight that area
            if (Array.isArray(this.target_area)) {
                for (let region of this.target_area) {
                    if (highlight(region)) {
                        break;
                    }
                }
            } else if (this.target_area != null) {
                highlight(this.target_area);
            }
        } else if (was_moving) {
            // Not moving this frame but moving last frame, indicating a release of mouse button
            // If `absorb` is `true` and the cursor falls into the target, let the component stick in target's center
            if (this.absorb) {
                let fall_in_target: boolean = false;
                if (Array.isArray(this.target_area)) {
                    let index: number = 0;
                    for (let region of this.target_area) {
                        if (event.position.inside(region)) {
                            this.rect.x = region.x + region.width / 2 - this.rect.width / 2;
                            this.rect.y = region.y + region.height / 2 - this.rect.height / 2;
                            fall_in_target = true;
                            this.whereabout = index;
                            break;
                        } else {
                            index++;
                        }
                    }
                } else if (this.target_area != null) {
                    if (event.position.inside(this.target_area)) {
                        this.rect.x = this.target_area.x + this.target_area.width / 2 - this.rect.width / 2;
                        this.rect.y = this.target_area.y + this.target_area.height / 2 - this.rect.height / 2;
                        fall_in_target = true;
                        this.whereabout = 0;
                    }
                }

                // If cursor does not fall into the target, restore to default position
                if (!fall_in_target) {
                    if (this.restore_position_upon_loose) {
                        this.restore_default_position();
                    }
                    this.whereabout = -1;
                }
            } else if (this.restore_position_upon_loose) {
                this.restore_default_position();
            }
        }

        super.draw(canvas, canvas_rect, event);
    }

    public restore_default_position(): void {
        this.rect = this.default_rect.copy();
    }

    public destroy(): void {
        // Clear registered list
        Drag.registered_list.delete(this);
    }
}
