import {Rect} from '../geometry';
import { GameEvent } from '../util';

export abstract class Component {
    constructor() {}

    abstract draw(canvas: HTMLCanvasElement, rect: Rect, event: GameEvent): void;

    public destroy(): void {}
}
