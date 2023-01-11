import {Component} from './component/component';
import {Game} from './game';
import {Offset, Rect} from './geometry';

import './renderer.css';
import {GameEvent} from './util';

export class Renderer {
    constructor(parent: HTMLElement, public width: number, public height: number, private ratio: number = 1) {
        // Create wrapper element
        parent.innerHTML = '';
        this.parent = document.createElement('div');
        this.parent.className = 'cg-renderer-wrapper';
        this.parent.style.width = `${width * ratio}px`;
        this.parent.style.height = `${height * ratio}px`;
        parent.appendChild(this.parent);

        this.back_buffer_canvas = this.create_canvas();
        this.back_buffer = this.back_buffer_canvas.getContext('2d');

        this.front_buffer_canvas = this.create_canvas();
        this.front_buffer = this.front_buffer_canvas.getContext('2d');

        // Add event listeners
        document.addEventListener('keydown', this.key_down_listener);
        document.addEventListener('keyup', this.key_up_listener);
        this.front_buffer_canvas.addEventListener('mousedown', this.button_down_event_listener);
        this.front_buffer_canvas.addEventListener('mouseup', this.button_up_event_listener);
        document.addEventListener('mouseup', this.button_up_event_listener);
        document.addEventListener('mousemove', this.button_move_event_listener);

        // Add game event listeners
        Game.on('set-cursor', (cursor: string) => {
            if (!this.cursor_is_set) {
                this.front_buffer_canvas.style.cursor = cursor;

                if (cursor == 'pointer') {
                    this.cursor_is_set = true;
                }
            }
        });

        // Disable context menu
        window.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
        });
    }

    // A double buffering mechanism
    private back_buffer_canvas: HTMLCanvasElement;
    private front_buffer_canvas: HTMLCanvasElement;

    private back_buffer: CanvasRenderingContext2D;
    private front_buffer: CanvasRenderingContext2D;

    // Store the frozen content
    private frozen_content: ImageData | null = null;

    // Store all draw calls
    private draw_call_list: Array<{component: Component; freeze: boolean}> = [];

    // Store draw calls for a new round of rendering; useful when there are already draw calls running and you want to
    // start adding draw calls for the next round of rendering
    private backup_draw_call_list: Array<{component: Component; freeze: boolean}> = [];

    // Game event to be passed to the draw call functions
    private event: GameEvent = new GameEvent();

    // If this value is `true`, further attempts to modify the cursor shape via a `set-cursor` event would not take effect
    private cursor_is_set: boolean = false;

    // If `true`, then even the frozen content has to be drawn again; normally that would happen when the renderer is resized
    private should_redraw: boolean = false;

    // Force freeze any interaction
    private force_freeze: boolean = false;

    // Event listeners
    private button_down_event_listener: EventListener = (event: MouseEvent) => {
        if (this.event.button == -1) {
            this.event.button = event.button;
        }
    };
    private button_move_event_listener: EventListener = (event: MouseEvent) => {
        let canvas_rect: DOMRect = this.front_buffer_canvas.getBoundingClientRect();
        this.event.position = new Offset(event.clientX - canvas_rect.x, event.clientY - canvas_rect.y).divide(
            this.ratio
        );
    };
    private button_up_event_listener: EventListener = (event: MouseEvent) => {
        if (event.button == this.event.button) {
            this.event.button = -1;
        }
    };
    private key_down_listener: EventListener = (event: KeyboardEvent) => {
        if (this.event.key == '') {
            this.event.key = event.key;
        }
    };
    private key_up_listener: EventListener = (event: KeyboardEvent) => {
        if (event.key == this.event.key) {
            this.event.key = '';
        }
    };

    // Animation frame request id
    private animationFrameRequestId: number | null = null;

    // Unify the creation of canvas for rendering
    private create_canvas(): HTMLCanvasElement {
        let canvas = document.createElement('canvas');

        canvas.width = this.width;
        canvas.height = this.height;
        canvas.classList.add('cg-renderer-canvas');

        this.parent.appendChild(canvas);

        return canvas;
    }

    // Clear the content of a particular buffer
    private clear_buffer(buffer: CanvasRenderingContext2D): void {
        buffer.clearRect(0, 0, this.width, this.height);
    }

    private frame(): void {
        // Restore cursor state
        this.cursor_is_set = false;

        // Clear back buffer
        this.clear_buffer(this.back_buffer);

        let event: GameEvent;
        if (this.force_freeze) {
            event = {button: -1, position: new Offset(-1, -1), key: ''};
        } else {
            event = this.event;
        }

        // If necessary, draw the frozen content again
        if (this.should_redraw) {
            for (let draw_call of this.draw_call_list) {
                if (draw_call.freeze) {
                    draw_call.component.draw(this.back_buffer_canvas, new Rect(0, 0, this.width, this.height), event);
                }
            }

            // Get the content from the backup buffer and save it to the frozen_content property
            this.frozen_content = this.back_buffer.getImageData(0, 0, this.width, this.height);
            this.clear_buffer(this.back_buffer);

            this.should_redraw = false;
        }

        if (this.frozen_content != null) {
            this.back_buffer.putImageData(this.frozen_content, 0, 0);
        }

        for (let draw_call of this.draw_call_list) {
            if (!draw_call.freeze) {
                draw_call.component.draw(this.back_buffer_canvas, new Rect(0, 0, this.width, this.height), event);
            }
        }

        // Put content to front buffer
        this.clear_buffer(this.front_buffer);
        this.front_buffer.drawImage(this.back_buffer_canvas, 0, 0);

        // Update frame
        this.animationFrameRequestId = window.requestAnimationFrame(this.frame.bind(this));
    }

    // Parent of all canvas elements, created within the parent element passed into the constructor
    public readonly parent: HTMLElement;

    // Useful when resizing the renderer midway
    public setHeight(height: number): void {
        this.ratio = height / this.height;
        this.parent.style.width = `${(height / this.height) * this.width}px`;
        this.parent.style.height = `${height}px`;
        this.should_redraw = true;
    }

    public addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options: boolean | AddEventListenerOptions | null = null
    ): void {
        this.front_buffer_canvas.addEventListener(type, listener, options);
    }

    public removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options: boolean | AddEventListenerOptions | null = null
    ): void {
        this.front_buffer_canvas.removeEventListener(type, listener, options);
    }

    /**
     * Add a draw call to the renderer's draw call list
     *
     * One can always freeze the content of a draw call, i.e., only call the canvas API the first time the draw call is
     * excuted. This can be useful when rendering content that is unchanging, and can be done via setting the paremeter
     * `freeze` to true (which is its default value).
     *
     * It has to be kept in mind, though, that the "frozen" draw calls would always be executed first, regardless of the
     * order in which the draw calls were added by the user. So if there is unchanging staff you want to put above some
     * content that you still wish to change later, just make that on-top unchanging content "change" as well. In reality,
     * you can just make sure that the draw call corresponding to that part of content remains constant, so that the
     * drawn content would end up unchanging eventually.
     *
     * The can-be-changed nature of the draw call is for this purpose: if there is animation you want to apply, or if
     * there is any sort of interaction you want with the content (e.g., dragging, clicking), you might want to implement
     * that in the `draw` function. Because that function is called once a frame (if `freeze` is set to false, of course),
     * you will be able to exert control over whatever animation or interaction you might want with your content.
     *
     *
     * @param component The component to render
     * @param freeze Whether the draw_call should be called again in a new frame
     */
    public draw(component: Component, freeze: boolean = true): void {
        // There are certain components that definitely need to be unfrozen, but the user might be careless and forget
        // to set `freeze` to `false` here when calling the `draw` method, so if the component has `prevent_freeze`
        // evaluating to `true`, the renderer will take care of unfreezing the component
        if (component.prevent_freeze) {
            freeze = false;
        }
        this.backup_draw_call_list.push({component, freeze});
    }

    /**
     * This method should be called when the user finishes adding draw calls and wish to start executing these calls.
     *
     * Remember, this method needs not be called on a per-frame basis, because there is an internal `frame` method that
     * handles the updating of frames. Calling this method instead removes all past added draw calls and render anew.
     *
     * The control syntax for what to display in each frame should be added in the passed draw calls.
     */
    public render(freeze: boolean = false): void {
        this.force_freeze = freeze;

        this.clear();

        // Transfer the backup draw call list to the formal draw call list, and clear the backup
        this.draw_call_list = this.backup_draw_call_list;
        this.backup_draw_call_list = [];

        // Put the frozen content on the back buffer
        for (let draw_call of this.draw_call_list) {
            if (draw_call.freeze) {
                draw_call.component.draw(this.back_buffer_canvas, new Rect(0, 0, this.width, this.height), this.event);
            }
        }

        // Get the content from the backup buffer and save it to the frozen_content property
        this.frozen_content = this.back_buffer.getImageData(0, 0, this.width, this.height);
        this.clear_buffer(this.back_buffer);

        this.frame();
    }

    /**
     * Clears the currently rendered content and halt the rendering process
     *
     * One needs not call this method alongside the `render` method, because that is handled internally by the latter
     */
    public clear(): void {
        if (this.animationFrameRequestId != null) {
            window.cancelAnimationFrame(this.animationFrameRequestId);
            this.animationFrameRequestId = null;
        }

        for (let draw_call of this.draw_call_list) {
            draw_call.component.destroy();
        }

        this.clear_buffer(this.back_buffer);
        this.clear_buffer(this.front_buffer);

        this.draw_call_list = [];
        this.frozen_content = null;
    }

    public destroy(): void {
        document.removeEventListener('keydown', this.key_down_listener);
        document.removeEventListener('keyup', this.key_up_listener);
        this.front_buffer_canvas.removeEventListener('mousedown', this.button_down_event_listener);
        this.front_buffer_canvas.removeEventListener('mouseup', this.button_up_event_listener);
        document.removeEventListener('mouseup', this.button_up_event_listener);
        document.removeEventListener('mousemove', this.button_move_event_listener);

        this.parent.remove();
    }
}
