import {Rect} from '../geometry';
import {GameEvent} from '../util';

export abstract class Component {
    constructor() {}

    abstract draw(canvas: HTMLCanvasElement, rect: Rect, event: GameEvent): void;

    public destroy(): void {}

    // If this flag is set true, the component would always be unfrozen, regardless how the user set it in the renderer
    public prevent_freeze: boolean = false;
}
