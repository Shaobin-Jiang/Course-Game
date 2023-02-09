import {Offset} from './geometry';
import './progress.css';

let image_map: Map<string, HTMLImageElement> = new Map();

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
        if (image_map.has(url)) {
            resolve(image_map.get(url));
        } else {
            let image: HTMLImageElement = new Image();

            if (typeof window.static_url != 'undefined' && url[0] == '/') {
                image.src = `${window.static_url}${url}`;
            } else {
                image.src = url;
            }
            image_map.set(url, image);

            image.crossOrigin = 'Anonymous'; // Prevent canvas getImageData CORS issue
            image.onload = function () {
                resolve(image);
            };

            image.onerror = reject;
        }
    });
}

export class GameEvent {
    constructor(public button: number = -1, public position: Offset = new Offset(NaN, NaN), public key: string = '') {}
}

export class Loading {
    constructor(private parent: HTMLElement = document.body) {
        let wrapper: HTMLDivElement = document.createElement('div');
        wrapper.className = 'progress-wrapper';
        parent.appendChild(wrapper);

        let text: HTMLParagraphElement = document.createElement('p');
        text.innerHTML = '加载中……';
        text.className = 'progress-text';
        wrapper.appendChild(text);
    }
}
