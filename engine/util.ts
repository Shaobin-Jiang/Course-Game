import {Offset} from './geometry';

export function deepCopy(obj: Object): Object {
    let return_obj: Object = {};

    type T = keyof Object;

    for (let key in obj) {
        if (Object.prototype.toString.call(obj[key as T]) === '[object Object') {
            // @ts-ignore
            return_obj[key] = deepCopy(obj[key as T]);
        } else {
            // @ts-ignore
            return_obj[key] = obj[key as T];
        }
    }

    return return_obj;
}

export function cubicBezier(p0: number, p1: number, p2: number, p3: number): (t: number) => number {
    return function (t: number): number {
        return p0 * t ** 3 + 3 * p1 * t ** 2 * (1 - t) + 3 * p2 * t * (1 - t) ** 2 + p3 * (1 - t) ** 3;
    };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        let image: HTMLImageElement = new Image();
        image.src = url;
        image.onload = function () {
            resolve(image);
        };

        image.onerror = reject;
    });
}

export class GameEvent {
    constructor(public button: number = -1, public position: Offset = new Offset(NaN, NaN), public key: string = '') {}
}
