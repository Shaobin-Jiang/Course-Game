import {Rect} from '../geometry';
import {GameEvent, loadImage} from '../util';
import {Component} from './component';

import './dialog.css';
import DialogTextBox from './dialog-text-box.png'; // 1466 * 1000 pixels

export class Dialog extends Component {
    /**
     * Show a dialog bubble.
     *
     * A note: at first I had the idea in mind to make this component show the speaker all together (normally that would
     * be showing 想想 the dolphin as well), but later refrained from doing so because there might be other occasions
     * when a dialog component might be needed where the speaker is another character.
     *
     * Also, the original idea was to enable the disappearing of the component after some time from within the component.
     * However, that would be just stupid, because there are also other components that might require the same thing, and
     * we could easily do that by calling the `render` method in the renderer to request a new round of rendering, and
     * simply do not add the draw call to this dialog component in that fresh call. Therefore, the vanishing time is not
     * enabled in this component, but is designed to be controlled globally.
     *
     * @param rect The rect of the component; note that one needs only specify one of the values of width or height
     * and set the other to < 0. This is because an image is used as background and we need to maintain the aspect ratio.
     * If both width and height are set, the `Dialog` class will base on the given width to adjust the size of the rect.
     * @param content HTML content of the dialog
     */
    constructor(private rect: Rect, private content: string = '') {
        super();

        // Presets of the HTML element to render the text content are defined in dialog.css
        this.text_element.innerHTML = `<p>${this.content}</p>`;
        this.text_element.classList.add('cg-component-dialog-text-renderer');

        if (this.rect.height < 0 || (this.rect.width > 0 && this.rect.height > 0)) {
            this.rect.height = this.rect.width / this.aspect_ratio;
        } else {
            this.rect.width = this.rect.height * this.aspect_ratio;
        }

        // Means of pre-caution
        this.rect = this.rect.copy();

        this.text_rect = new Rect(
            this.rect.x + this.rect.width * (3.57 / 12.41),
            this.rect.y + this.rect.height * (1.79 / 8.47),
            this.rect.width * (6.29 / 12.41),
            this.rect.height * (2.58 / 8.47)
        );
    }

    static dialog_text_box: HTMLImageElement | null = null;

    static async from(params: Array<any>): Promise<() => Dialog> {
        params[0] = new Rect(...(params[0] as [number, number, number, number]));
        return () => new Dialog(params[0], params[1] as string);
    }

    // Rect of the individual parts within the maximized Dialog component
    private text_rect: Rect;

    private text_element: HTMLDivElement = document.createElement('div');

    // Load the image required
    static load(): void {
        loadImage(DialogTextBox).then((image: HTMLImageElement) => {
            Dialog.dialog_text_box = image;
        });
    }

    // Aspect ratio of the un-minimized dialog component
    public readonly aspect_ratio: number = 1.466;

    public draw(canvas: HTMLCanvasElement, canvas_rect: Rect, event: GameEvent): void {
        if (Dialog.dialog_text_box == null) {
            Dialog.load();
            return;
        }

        let context: CanvasRenderingContext2D = canvas.getContext('2d');

        context.drawImage(Dialog.dialog_text_box, ...this.rect.spread());

        let ratio: number = Number(getComputedStyle(canvas).width.replace('px', '')) / canvas.width;
        this.text_element.style.left = `${this.text_rect.x * ratio}px`;
        this.text_element.style.top = `${this.text_rect.y * ratio}px`;
        this.text_element.style.transform = `scale(${(this.text_rect.width * ratio) / 1258})`;

        canvas.parentElement.appendChild(this.text_element);
    }

    public destroy(): void {
        this.text_element.remove();
    }
}

// Load the images needed for the `Dialog` class
Dialog.load();
