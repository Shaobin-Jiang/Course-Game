import {Course} from './engine/game';
import {Game} from './engine/game';
import {Rect} from './engine/geometry';
import {loadImage, Loading} from './engine/util';

async function main(): Promise<void> {
    new Loading();

    if (typeof window.image_list != 'undefined') {
        for (let url of window.image_list) {
            await loadImage(url);
        }
    }

    let map: HTMLImageElement = await loadImage(window.game_map);
    let finished_marker: HTMLImageElement = await loadImage(window.finished_marker);
    let unfinished_marker: HTMLImageElement = await loadImage(window.unfinished_marker);

    let sessions: Array<{position: Rect; get: {[props: string]: any}}> = [];
    for (let item of window.sessions) {
        sessions.push({position: new Rect(...item.position), get: item.get});
    }
    window.sessions = [];

    let course: Course = {
        map,
        finished_marker,
        unfinished_marker,
        sessions,
    };

    let game: Game = new Game(course);
    game.about_text = window.about_text;
    await game.start();
}

main();

declare global {
    interface Window {
        loaded_sessions: {[props: string]: () => object};
        progress: {session: number; level: number; scene: number};
        about_text: string;
        game_map: string;
        finished_marker: string;
        unfinished_marker: string;
        sessions: Array<{position: [number, number, number, number, number]; get: object}>;
        static_url: string;
        image_list: Array<string>;
    }
}
