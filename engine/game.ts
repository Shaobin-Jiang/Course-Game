// Import dependencies
import {Component} from './component/component';
import {Fill} from './component/fill';
import {Dialog} from './component/dialog';
import {Marker} from './component/marker';
import {Select} from './component/select';
import {Button} from './component/button';
import {Img} from './component/img';
import {Reader} from './component/reader';
import {Timer} from './component/timer';
import {Rect} from './geometry';
import {Renderer} from './renderer';
import {loadImage} from './util';

// Import style sheet
import './game.css';

// Import images
import ButtonBackground from './images/button-background.png';
import ObjectSelectGrid from './images/object-select-grid.png';
import ObjectSelectBackground from './images/object-select-background.jpg';
import ModalBackground from './images/modal.png';
import Speaker from './images/speaker.png';
import PlayBar from './images/play-bar.png';

export class Game {
    constructor(private parent: HTMLElement = document.body) {
        this.parent.classList.add('cg-game');

        let scale: number;
        if (document.documentElement.clientWidth / document.documentElement.clientHeight > this.width / this.height) {
            scale = document.documentElement.clientHeight / this.height;
        } else {
            scale = document.documentElement.clientWidth / this.width;
        }

        this.renderer = new Renderer(this.parent, this.width, this.height, scale);

        window.addEventListener('resize', this.resize_callback);
    }

    // Registered event listeners
    static event_listeners: Map<string, Function> = new Map();

    // Unhandled events; cleared once dealt with
    static event_list: Array<{event: string; param: any}> = [];

    // Called by the client to trigger an event
    static message(msg: string, param: any = null): void {
        this.event_list.push({event: msg, param});
    }

    // Register an event to listen to
    static on(event: string, callback: Function): void {
        if (this.event_listeners.has(event)) {
            this.event_listeners.set(event, callback);
            console.warn(`Event ${event} has already been registered and is now replaced by another by the same name`);
        } else {
            this.event_listeners.set(event, callback);
        }
    }

    // Call setInterval on window, otherwise the return type would be NodeJS.Timer
    static event_processor: number = window.setInterval(() => {
        for (let call of this.event_list) {
            if (this.event_listeners.has(call.event)) {
                this.event_listeners.get(call.event)(call.param);
            }
        }
        this.event_list = [];
    }, 0);

    // Indicator of whether there is an alert modal
    private is_alert: boolean = false;

    // Assets
    private button_background: HTMLImageElement | null;
    private object_select_grid: HTMLImageElement | null;
    private object_select_background: HTMLImageElement | null;
    private modal_background: HTMLImageElement | null;
    private speaker: HTMLImageElement | null;
    private play_bar: HTMLImageElement | null;

    private resize_callback: EventListener = () => {
        if (document.documentElement.clientWidth / document.documentElement.clientHeight > this.width / this.height) {
            this.renderer.setHeight(document.documentElement.clientHeight);
        } else {
            this.renderer.setHeight((document.documentElement.clientWidth / this.width) * this.height);
        }
    };

    private validate_progress(session_id: number, level_id: number, game_progress: Progress): boolean {
        return (
            game_progress.session > session_id ||
            (game_progress.session == session_id && game_progress.level >= level_id)
        );
    }

    private async update_progress(progress: Progress): Promise<void> {
        return new Promise((resolve, reject) => {
            // TODO: Deal with progress
            resolve();
        });
    }

    public renderer: Renderer;
    public width: number = 3200;
    public height: number = 1800;

    public game_content: Array<Session> = [];

    public pick_session(game_progress: Progress): void {}

    public pick_level(session_id: number, game_progress: Progress): void {
        if (session_id > game_progress.session) {
            console.error(`current session: ${session_id}\nprogress session: ${game_progress.session}`);
            return;
        }

        let session: Session = this.game_content[session_id];

        this.renderer.draw(new Img(session.map, new Rect(0, 0, this.width, this.height)));

        let progress: number;

        if (game_progress.session > session_id) {
            progress = session.levels.length;
        } else {
            progress = game_progress.level;
        }

        for (let i = 0; i < progress; i++) {
            let marker: Marker = new Marker(session.marker, session.levels[i].position);
            marker.onclick = () => {
                this.read_paper(session_id, i, game_progress);
            };
            this.renderer.draw(marker);
        }

        // If this is the first time of play, make the marker corresponding to the latest level flash
        if (progress != session.levels.length) {
            let marker: Marker = new Marker(session.marker, session.levels[progress].position, true);
            marker.onclick = () => {
                this.read_paper(session_id, progress, game_progress);
            };
            this.renderer.draw(marker);
        }
    }

    // Game page: read paper
    public read_paper(
        session_id: number,
        level_id: number,
        game_progress: Progress,
        read_time: number | null = null
    ): void {
        if (!this.validate_progress(session_id, level_id, game_progress)) {
            console.error(
                `requested session: ${session_id}, level: ${level_id}\nprogress session: ${game_progress.session}, level: ${game_progress.level}`
            );
            return;
        }

        let session: Session = this.game_content[session_id];
        let level: Level = session.levels[level_id];

        this.renderer.draw(new Img(session.map, new Rect(0, 0, this.width, this.height)));

        let reader: Reader = new Reader(
            level.paper,
            new Rect(this.width / 16, this.height / 6, (this.width * 7) / 8, (this.height * 2) / 3)
        );
        this.renderer.draw(reader);

        let time: number;
        if (read_time == null) {
            // Replay
            if (game_progress.session > session_id || game_progress.level > level_id) {
                time = 20;
            } else {
                time = 60;
            }
        } else {
            time = read_time;
        }

        let timer: Timer = new Timer(
            time,
            new Rect(
                this.width / 2 - ((this.height / 9) * Timer.aspect_ratio) / 2,
                this.height / 36,
                (this.height / 9) * Timer.aspect_ratio,
                this.height / 9
            )
        );
        this.renderer.draw(timer);

        let button: Button = new Button(
            '',
            new Rect(
                this.width / 2 - (this.height / 18) * (this.button_background.width / this.button_background.height),
                this.height - this.height / 36 - this.height / 9,
                (this.height / 9) * (this.button_background.width / this.button_background.height),
                this.height / 9
            ),
            this.height / 18,
            this.button_background,
            '#000000',
            '#351500'
        );
        button.onclick = () => {
            if (!reader.has_reached_bottom) {
                this.alert('你需要看完文献的全部内容才能继续游戏~');
                return;
            }

            if (!timer.finished) {
                this.alert(`你需要至少阅读${time}秒才能继续游戏~`);
                return;
            }

            this.prompt_object_selection(session_id, level_id, game_progress);
        };
        this.renderer.draw(button);

        this.renderer.render();
    }

    public prompt_object_selection(session_id: number, level_id: number, game_progress: Progress): void {
        if (!this.validate_progress(session_id, level_id, game_progress)) {
            console.error(
                `requested session: ${session_id}, level: ${level_id}\nprogress session: ${game_progress.session}, level: ${game_progress.level}`
            );
            return;
        }

        this.renderer.draw(new Img(this.object_select_background, new Rect(0, 0, this.width, this.height)));
        this.renderer.draw(
            new Img(this.speaker, new Rect(this.height / 6, this.height / 3, this.height / 3, this.height / 3))
        );

        this.alert(this.game_content[session_id].levels[level_id].prompt, () => {
            this.select_object(session_id, level_id, game_progress);
        });

        this.renderer.render();
    }

    public select_object(session_id: number, level_id: number, game_progress: Progress): void {
        if (!this.validate_progress(session_id, level_id, game_progress)) {
            console.error(
                `requested session: ${session_id}, level: ${level_id}\nprogress session: ${game_progress.session}, level: ${game_progress.level}`
            );
            return;
        }

        let objects: Array<HTMLImageElement> = this.game_content[session_id].levels[level_id].objects;
        let correct_answer: Array<number> = this.game_content[session_id].levels[level_id].correct;

        this.renderer.draw(new Img(this.object_select_background, new Rect(0, 0, this.width, this.height)));

        let select_group: Array<Select> = [];
        let select_grid_gap: number = (this.height * (2 / 3)) / 32;
        let select_grid_size: number = (this.height * (2 / 3)) / 3.2;

        for (let i = 0; i < 9; i++) {
            let row: number = Math.floor(i / 3);
            let column: number = i % 3;

            select_group[i] = new Select(
                new Rect(
                    this.width / 2 - this.height / 3 + select_grid_size * column + select_grid_gap * column,
                    this.height / 6 + select_grid_size * row + select_grid_gap * row,
                    select_grid_size,
                    select_grid_size
                ),
                this.object_select_grid,
                objects[i]
            );

            this.renderer.draw(select_group[i]);
        }

        let button: Button = new Button(
            '',
            new Rect(
                this.width / 2 - (this.height / 18) * (this.button_background.width / this.button_background.height),
                this.height - this.height / 36 - this.height / 9,
                (this.height / 9) * (this.button_background.width / this.button_background.height),
                this.height / 9
            ),
            this.height / 18,
            this.button_background,
            '#000000',
            '#351500'
        );
        button.onclick = () => {
            let correct: boolean = true;

            for (let i = 0; i < 9; i++) {
                let select: Select = select_group[i];
                if (
                    // Not a correct answer, but selected
                    (select.selected && correct_answer.indexOf(i) == -1) ||
                    // A correct answer, but not selected
                    (!select.selected && correct_answer.indexOf(i) != -1)
                ) {
                    correct = false;
                    break;
                }
            }

            if (correct) {
                let scene_id: number;

                if (game_progress.session > session_id || game_progress.level > level_id) {
                    scene_id = 0;
                } else {
                    scene_id = game_progress.scene;
                }

                this.play_scene(session_id, level_id, scene_id, game_progress);
            } else {
                this.alert('选择错误，请重新选择~');
            }
        };
        this.renderer.draw(button);

        this.renderer.render();
    }

    public play_scene(session_id: number, level_id: number, scene_id: number, game_progress: Progress): void {
        if (!this.validate_progress(session_id, level_id, game_progress)) {
            console.error(
                `requested session: ${session_id}, level: ${level_id}\nprogress session: ${game_progress.session}, level: ${game_progress.level}`
            );
            return;
        }

        // The value can have '.5' inside, which indicates that it is not a first attempt
        scene_id = Math.floor(scene_id);

        let session: Session = this.game_content[session_id];
        let level: Level = session.levels[level_id];
        let scene: Scene = level.scenes[scene_id];

        let is_replaying: boolean = game_progress.session > session_id || game_progress.level > level_id;
        let first_attempt: boolean = !is_replaying && game_progress.scene.toString().indexOf('.5') == -1;

        this.renderer.draw(new Img(session.background, new Rect(0, 0, this.width, this.height)));

        this.renderer.draw(
            new Img(
                this.play_bar,
                new Rect(this.width * 0.125, this.height * 0.015, this.width * 0.75, this.height * 0.125)
            )
        );
        this.renderer.draw(
            new Fill(new Rect(this.width * 0.125, this.height * 0.15, this.width * 0.75, this.height * 0.7))
        );

        for (let component of scene.layout) {
            this.renderer.draw(component);
        }

        // Display question
        this.renderer.draw(
            new Img(this.speaker, new Rect(0, this.height - this.height / 3, this.height / 3, this.height / 3))
        );
        this.renderer.draw(
            new Dialog(
                new Rect(this.height / 4, this.height - this.height / 3 - this.height * 0.23, -1, this.height / 3),
                scene.question
            )
        );

        let timer: Timer;
        if (!is_replaying) {
            timer = new Timer(first_attempt ? 20 : 5, new Rect(0, 0, -1, this.height / 10));
            this.renderer.draw(timer);
        }

        let callback: EventListener = () => {
            if (is_replaying || timer.finished) {
                this.renderer.draw(new Img(session.background, new Rect(0, 0, this.width, this.height)));

                this.renderer.draw(
                    new Img(
                        this.play_bar,
                        new Rect(this.width * 0.125, this.height * 0.015, this.width * 0.75, this.height * 0.125)
                    )
                );
                this.renderer.draw(
                    new Fill(new Rect(this.width * 0.125, this.height * 0.15, this.width * 0.75, this.height * 0.7))
                );

                for (let component of scene.layout) {
                    this.renderer.draw(component);
                }

                let height = this.height * 0.1;
                let width: number = height * (this.button_background.width / this.button_background.height);
                let button: Button = new Button(
                    '',
                    new Rect(this.width / 2 - width / 2, this.height * 0.875, width, height),
                    16,
                    this.button_background
                );
                button.onclick = () => {
                    let correct: boolean = scene.correct_func();

                    if (correct) {
                        this.alert('太棒了！操作正确！<br>请接着做后面的实验吧！', () => {
                            scene_id++;
                            if (scene_id >= level.scenes.length) {
                                scene_id = 0;
                                level_id++;
                                if (level_id >= session.levels.length) {
                                    level_id = 0;
                                    session_id++;
                                }
                            }

                            let progress: Progress;

                            let promise: Promise<void>;
                            if (!is_replaying) {
                                progress = {session: session_id, level: level_id, scene: scene_id};
                                promise = this.update_progress(progress);
                            } else {
                                progress = game_progress;
                                promise = new Promise((resolve, reject) => {
                                    setTimeout(() => {resolve();}, 0);
                                })
                            }

                            promise.then(() => {
                                if (level_id == 0) {
                                    this.pick_session(progress);
                                } else if (scene_id == 0) {
                                    this.pick_level(session_id, progress);
                                } else {
                                    this.play_scene(session_id, level_id, scene_id, progress);
                                }
                            });
                        });
                    } else {
                        if (is_replaying) {
                            // Repeat
                            this.alert('太遗憾了，你的操作是错误的！<br>请再试试吧！', () => {
                                this.play_scene(session_id, level_id, scene_id, game_progress);
                            });
                        } else {
                            let progress: Progress = {
                                session: session_id,
                                level: level_id,
                                scene: Math.floor(scene_id) + 0.5,
                            };

                            this.alert('太遗憾了，你的操作是错误的！<br>回到文献中再看看吧！', () => {
                                this.read_paper(session_id, level_id, progress);
                            });
                        }
                    }
                };
                this.renderer.draw(button);

                this.renderer.parent.removeEventListener('click', callback);
            }
        };
        this.renderer.parent.addEventListener('click', callback);

        // Freeze interaction
        this.renderer.render(true);
    }

    public alert(msg: string, callback: Function | null = null): void {
        if (!this.is_alert) {
            this.is_alert = true;

            let modal: HTMLDivElement = document.createElement('div');
            modal.className = 'cg-game-alert';
            this.renderer.parent.appendChild(modal);

            let modal_window: HTMLDivElement = document.createElement('div');
            modal_window.className = 'cg-game-alert-window';
            modal.appendChild(modal_window);

            let modal_background: HTMLImageElement = document.createElement('img');
            modal_background.className = 'cg-game-alert-background';
            modal_background.src = ModalBackground;
            modal_window.appendChild(modal_background);

            let modal_text: HTMLDivElement = document.createElement('div');
            modal_text.className = 'cg-game-alert-text';
            modal_text.innerHTML = msg;
            modal_window.appendChild(modal_text);

            let modal_confirm: HTMLImageElement = document.createElement('img');
            modal_confirm.className = 'cg-game-alert-confirm';
            modal_confirm.src = ButtonBackground;
            modal_window.appendChild(modal_confirm);

            let modal_callback: EventListener = () => {
                modal_confirm.removeEventListener('click', modal_callback);
                modal.remove();
                this.is_alert = false;

                if (callback != null) {
                    callback();
                }
            };

            modal_confirm.addEventListener('click', modal_callback);
        }
    }

    public async load() {
        this.button_background = await loadImage(ButtonBackground);
        this.object_select_grid = await loadImage(ObjectSelectGrid);
        this.object_select_background = await loadImage(ObjectSelectBackground);
        this.modal_background = await loadImage(ModalBackground);
        this.speaker = await loadImage(Speaker);
        this.play_bar = await loadImage(PlayBar);
    }

    public destroy() {
        window.removeEventListener('resize', this.resize_callback);
    }
}

type Scene = {
    question: string;
    layout: Array<Component>;
    correct_func: () => boolean;
};

type Level = {
    position: Rect;
    scenes: Array<Scene>;
    objects: Array<HTMLImageElement>;
    correct: Array<number>;
    paper: HTMLImageElement;
    prompt: string;
};

type Session = {
    map: HTMLImageElement;
    background: HTMLImageElement;
    marker: HTMLImageElement;
    levels: Array<Level>;
};

type Progress = {
    session: number;
    level: number;
    scene: number;
};
