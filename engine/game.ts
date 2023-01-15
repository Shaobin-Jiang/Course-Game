// Import dependencies
import {Component} from './component/component';
import {CenteredText} from './component/centered-text';
import {SingleSelect} from './component/single-select';
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
import {Drag} from './component/drag';

export class Game {
    constructor(private course: Course, private parent: HTMLElement = document.body) {
        this.parent.classList.add('cg-game');

        let scale: number;
        if (document.documentElement.clientWidth / document.documentElement.clientHeight > this.width / this.height) {
            scale = document.documentElement.clientHeight / this.height;
        } else {
            scale = document.documentElement.clientWidth / this.width;
        }

        this.renderer = new Renderer(this.parent, this.width, this.height, scale);

        window.addEventListener('resize', this.resize_callback);
        document.addEventListener('keyup', this.keyup_callback);
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

    /**
     * Parse component based on given object
     *
     * Allowed components:
     * - dialog
     * - drag
     * - img
     * - select
     *
     * E.g. pass in an object like this:
     * { name: 'drag', params: [] }
     *
     * For images, use its url instead of a loaded HTMLImageElement object, for the method automatically loads it
     * For Rect objects, use an array of numerics instead
     */
    static async parse_component(obj: AnyObject): Promise<() => Component> {
        let component: () => Component;
        let params = (obj.params as Array<any>).slice();

        switch ((obj.name as string).toLowerCase()) {
            case 'dialog':
                component = await Dialog.from(params);
                break;
            case 'drag':
                component = await Drag.from(params);
                break;
            case 'img':
                component = await Img.from(params);
                break;
            case 'select':
                component = await Select.from(params);
                break;
            case 'single-select':
                component = await SingleSelect.from(params);
                break;
        }

        return component;
    }

    static async parse_scene(obj: AnyObject): Promise<Scene> {
        let scene: AnyObject = {};

        scene.question = obj.question;

        let layout: Array<() => Component> = [];
        for (let o of obj.layout as Array<AnyObject>) {
            layout.push(await this.parse_component(o));
        }
        scene.layout = () => {
            let l: Array<Component> = [];
            for (let func of layout) {
                l.push(func());
            }
            return l;
        };

        scene.correct_func = obj.correct_func;

        return scene as Scene;
    }

    static async parse_level(obj: AnyObject): Promise<Level> {
        let level: AnyObject = {};

        level.position = new Rect(...(obj.position as [number, number, number, number]));
        level.paper = await loadImage(obj.paper);
        level.prompt = obj.prompt;
        level.correct = (obj.correct as Array<number>).slice();

        level.objects = [];
        for (let url of obj.objects) {
            level.objects.push(await loadImage(url));
        }

        level.scenes = [];
        for (let scene of obj.scenes) {
            level.scenes.push(await this.parse_scene(scene));
        }

        return level as Level;
    }

    static async parse_session(obj: AnyObject): Promise<Session> {
        let session: AnyObject = {};

        session.map = await loadImage(obj.map);
        session.background = await loadImage(obj.background);
        session.marker = await loadImage(obj.marker);

        session.levels = [];
        for (let level of obj.levels) {
            session.levels.push(await this.parse_level(level));
        }

        return session as Session;
    }

    static async parse_course(obj: AnyObject): Promise<Course> {
        let course: AnyObject = {};

        course.map = await loadImage(obj.map);
        course.finished_marker = await loadImage(obj.finished_marker);
        course.unfinished_marker = await loadImage(obj.unfinished_marker);

        return course as Course;
    }

    // Indicator of whether there is an alert modal
    private is_alert: boolean = false;

    // Indicator of whether the user is on the pick-session page
    private is_picking_session: boolean = false;

    private is_showing_menu: boolean = false;

    // TODO: change this property back to private when finished with debugging
    public game_progress: Progress | null = null;

    // Assets
    private button_background: HTMLImageElement | null;
    private object_select_grid: HTMLImageElement | null;
    private object_select_background: HTMLImageElement | null;
    private speaker: HTMLImageElement | null;
    private play_bar: HTMLImageElement | null;

    private resize_callback: EventListener = () => {
        if (document.documentElement.clientWidth / document.documentElement.clientHeight > this.width / this.height) {
            this.renderer.setHeight(document.documentElement.clientHeight);
        } else {
            this.renderer.setHeight((document.documentElement.clientWidth / this.width) * this.height);
        }
    };

    private keyup_callback: EventListener = (event: KeyboardEvent) => {
        if (event.key == 'Escape') {
            this.menu();
        }
    };

    private validate_progress(session_id: number, level_id: number): boolean {
        return (
            this.game_progress.session > session_id ||
            (this.game_progress.session == session_id && this.game_progress.level >= level_id)
        );
    }

    private async get_session_content(url: string): Promise<Session> {
        // TODO: implement this properly
        return new Promise((resolve) => {
            resolve(new Object() as Session);
        });
    }

    private async update_progress(progress: Progress): Promise<void> {
        return new Promise((resolve) => {
            // TODO: Deal with progress
            this.game_progress = progress;
            resolve();
        });
    }

    public renderer: Renderer;
    public width: number = 3200;
    public height: number = 1800;

    public game_content: Array<Session> = new Array(this.course.sessions.length);

    public pick_session(): void {
        this.is_picking_session = true;

        this.renderer.draw(new Img(this.course.map, new Rect(0, 0, this.width, this.height)));

        for (let i = 0; i <= this.game_progress.session; i++) {
            let marker: Marker;
            if (i < this.game_progress.session) {
                marker = new Marker(this.course.finished_marker, this.course.sessions[i].position);
            } else {
                if (this.game_progress.session < this.course.sessions.length) {
                    marker = new Marker(this.course.unfinished_marker, this.course.sessions[i].position);
                } else {
                    continue;
                }
            }

            marker.onclick = () => {
                if (typeof this.game_content[i] == 'undefined') {
                    let get_session_promise: Promise<Session>;
                    let session: string | Session = this.course.sessions[i].get;

                    if (typeof session == 'string') {
                        get_session_promise = this.get_session_content(session);
                    } else {
                        get_session_promise = new Promise((resolve) => {
                            resolve(session as Session);
                        });
                    }

                    get_session_promise.then((s: Session) => {
                        this.game_content[i] = s;
                        this.pick_level(i);
                    });
                } else {
                    this.pick_level(i);
                }
            };
            this.renderer.draw(marker);
        }

        this.renderer.render();
    }

    public pick_level(session_id: number): void {
        this.is_picking_session = false;

        let game_progress: Progress = this.game_progress;

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
                this.read_paper(session_id, i);
            };
            this.renderer.draw(marker);
        }

        // If this is the first time of play, make the marker corresponding to the latest level flash
        if (progress != session.levels.length) {
            let marker: Marker = new Marker(session.marker, session.levels[progress].position, true);
            marker.onclick = () => {
                this.read_paper(session_id, progress);
            };
            this.renderer.draw(marker);
        }

        this.renderer.render();
    }

    // Game page: read paper
    public read_paper(session_id: number, level_id: number, read_time: number | null = null): void {
        this.is_picking_session = false;

        let game_progress: Progress = this.game_progress;

        if (!this.validate_progress(session_id, level_id)) {
            console.error(
                `requested session: ${session_id}, level: ${level_id}\nprogress session: ${game_progress.session}, level: ${game_progress.level}`
            );
            return;
        }

        let session: Session = this.game_content[session_id];
        let level: Level = session.levels[level_id];

        this.renderer.draw(new Img(session.background, new Rect(0, 0, this.width, this.height)));

        let reader: Reader = new Reader(
            level.paper,
            new Rect(this.width / 16, this.height / 6, (this.width * 7) / 8, (this.height * 2) / 3)
        );
        this.renderer.draw(reader);

        let time: number;
        if (read_time == null) {
            // Replay
            if (game_progress.session > session_id || game_progress.level > level_id) {
                // time = 20;
                time = 1;
            } else {
                // TODO: reset this to 60 when finished with debugging
                time = 1;
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

            this.prompt_object_selection(session_id, level_id);
        };
        this.renderer.draw(button);

        this.renderer.render();
    }

    public prompt_object_selection(session_id: number, level_id: number): void {
        this.is_picking_session = false;

        let game_progress: Progress = this.game_progress;

        if (!this.validate_progress(session_id, level_id)) {
            console.error(
                `requested session: ${session_id}, level: ${level_id}\nprogress session: ${game_progress.session}, level: ${game_progress.level}`
            );
            return;
        }

        this.renderer.draw(new Img(this.object_select_background, new Rect(0, 0, this.width, this.height)));
        this.renderer.draw(
            new Img(this.speaker, new Rect(this.height / 6, this.height / 3, this.height / 3, this.height / 3))
        );

        this.alert(
            this.game_content[session_id].levels[level_id].prompt,
            () => {
                this.select_object(session_id, level_id);
            },
            false
        );

        this.renderer.render();
    }

    public select_object(session_id: number, level_id: number): void {
        this.is_picking_session = false;

        let game_progress: Progress = this.game_progress;

        if (!this.validate_progress(session_id, level_id)) {
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

                this.play_scene(session_id, level_id, scene_id);
            } else {
                this.alert('选择错误，请重新选择~', () => {
                    this.prompt_object_selection(session_id, level_id);
                });
            }
        };
        this.renderer.draw(button);

        this.renderer.render();
    }

    public play_scene(session_id: number, level_id: number, scene_id: number): void {
        this.is_picking_session = false;

        let game_progress: Progress = this.game_progress;

        if (!this.validate_progress(session_id, level_id)) {
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
        this.renderer.draw(
            new CenteredText(
                `关卡${Math.floor(level_id) + 1}（共${session.levels.length}关）: ${Math.floor(scene_id) + 1} / ${
                    level.scenes.length
                }`,
                new Rect(this.width * 0.625, this.height * 0.015, this.width * 0.25, this.height * 0.125),
                '#000000',
                this.height * 0.03
            )
        );

        let layout: Array<Component> = scene.layout();

        for (let component of layout) {
            this.renderer.draw(component);
        }

        // Display question
        this.renderer.draw(
            new Img(this.speaker, new Rect(0, this.height - this.height / 3, this.height / 3, this.height / 3))
        );

        let dialog: Dialog = new Dialog(
            new Rect(this.height / 4, this.height - this.height / 3 - this.height * 0.23, -1, this.height / 3),
            scene.question
        );
        dialog.prevent_freeze = true; // Prevent from being placed other dynamic components
        this.renderer.draw(dialog);

        let timer: Timer;
        if (!is_replaying) {
            timer = new Timer(
                // TODO: restore timing to its proper value
                // first_attempt ? 10 : 5,
                first_attempt ? 2 : 1,
                new Rect(this.width * 0.14, this.height * 0.045, -1, this.height * 0.065)
            );
            this.renderer.draw(timer);
        }

        let callback: EventListener = () => {
            if (is_replaying || (typeof timer != 'undefined' && timer.finished)) {
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
                this.renderer.draw(
                    new CenteredText(
                        `关卡${Math.floor(level_id) + 1}（共${session.levels.length}关）: ${
                            Math.floor(scene_id) + 1
                        } / ${level.scenes.length}`,
                        new Rect(this.width * 0.625, this.height * 0.015, this.width * 0.25, this.height * 0.125),
                        '#000000',
                        this.height * 0.03
                    )
                );

                let prompt_button: Button = new Button(
                    '查看问题',
                    new Rect(this.width * 0.14, this.height * 0.045, this.height * 0.195, this.height * 0.065),
                    this.height * 0.03,
                    null,
                    'rgba(0, 0, 0, 0)',
                    '#000000'
                );
                prompt_button.onclick = () => {
                    this.alert(scene.question);
                };
                this.renderer.draw(prompt_button);

                for (let component of layout) {
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
                    let correct: boolean = scene.correct_func(layout);

                    if (correct) {
                        scene_id++;

                        if (scene_id >= level.scenes.length) {
                            scene_id = 0;
                            level_id++;
                            if (level_id >= session.levels.length) {
                                level_id = 0;
                                session_id++;
                            }
                        }

                        let alert_text: string;
                        if (level_id == 0) {
                            alert_text = '已完成本章全部关卡！';
                        } else if (scene_id == 0) {
                            alert_text = '恭喜你，成功完成本关卡！<br>快去下一关看看吧！';
                        } else {
                            alert_text = '太棒了！操作正确！<br>请接着做后面的实验吧！';
                        }

                        this.alert(alert_text, () => {
                            let progress: Progress;

                            let promise: Promise<void>;
                            if (!is_replaying) {
                                progress = {session: session_id, level: level_id, scene: scene_id};
                                promise = this.update_progress(progress);
                            } else {
                                progress = game_progress;
                                promise = new Promise((resolve) => {
                                    resolve();
                                });
                            }

                            promise.then(() => {
                                if (level_id == 0) {
                                    this.pick_session();
                                } else if (scene_id == 0) {
                                    this.pick_level(session_id);
                                } else {
                                    this.play_scene(session_id, level_id, scene_id);
                                }
                            });
                        });
                    } else {
                        if (is_replaying) {
                            // Repeat
                            this.alert('太遗憾了，你的操作是错误的！<br>请再试试吧！', () => {
                                this.play_scene(session_id, level_id, scene_id);
                            });
                        } else {
                            let progress: Progress = {
                                session: session_id,
                                level: level_id,
                                scene: Math.floor(scene_id) + 0.5,
                            };

                            this.update_progress(progress).then(() => {
                                this.alert('太遗憾了，你的操作是错误的！<br>回到文献中再看看吧！', () => {
                                    this.read_paper(session_id, level_id);
                                });
                            });
                        }
                    }
                };
                this.renderer.draw(button);

                this.renderer.removeEventListener('click', callback);

                this.renderer.render();
            }
        };
        this.renderer.addEventListener('click', callback);

        // Freeze interaction
        this.renderer.render(true);
    }

    private alert(msg: string, callback: Function | null = null, blur: boolean = true): void {
        if (!this.is_alert) {
            this.is_alert = true;

            let modal: HTMLDivElement = document.createElement('div');
            modal.className = 'cg-game-alert';
            if (blur) {
                modal.classList.add('cg-game-alert-blur');
            }
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
            modal_text.innerHTML = `<p>${msg}</p>`;
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

    private menu(): void {
        if (!this.is_alert && !this.is_showing_menu) {
            this.is_showing_menu = true;

            let modal: HTMLDivElement = document.createElement('div');
            modal.className = 'menu-modal';
            this.renderer.parent.appendChild(modal);

            if (!this.is_picking_session) {
                let return_to_picking_session: HTMLDivElement = document.createElement('div');
                return_to_picking_session.className = 'menu-option';
                return_to_picking_session.innerText = '返回主界面';
                modal.appendChild(return_to_picking_session);

                let pick_session_callback = () => {
                    return_to_picking_session.removeEventListener('click', pick_session_callback);
                    modal.remove();
                    this.is_showing_menu = false;
                    this.pick_session();
                };

                return_to_picking_session.addEventListener('click', pick_session_callback);
            }

            let close: HTMLDivElement = document.createElement('div');
            close.className = 'menu-option';
            close.innerText = '关闭菜单';
            modal.appendChild(close);

            let close_callback = () => {
                close.removeEventListener('click', close_callback);
                modal.remove();
                this.is_showing_menu = false;
            };
            close.addEventListener('click', close_callback);

            let about: HTMLDivElement = document.createElement('div');
            about.className = 'menu-option';
            about.innerText = '关于游戏';
            modal.appendChild(about);

            let about_callback = () => {
                about.removeEventListener('click', about_callback);
                modal.remove();
                this.is_showing_menu = false;
                this.about();
            };
            about.addEventListener('click', about_callback);

            let logout: HTMLDivElement = document.createElement('div');
            logout.className = 'menu-option';
            logout.innerText = '退出登录';
            modal.appendChild(logout);

            let logout_callback = () => {
                logout.removeEventListener('click', logout_callback);
                modal.remove();
                this.is_showing_menu = false;
                this.logout();
            };
            logout.addEventListener('click', logout_callback);
        } else if (this.is_showing_menu) {
            this.renderer.parent.querySelector('.menu-modal').remove();
            this.is_showing_menu = false;
        }
    }

    private about(): void {
        let modal: HTMLDivElement = document.createElement('div');
        modal.className = 'about-modal';
        this.renderer.parent.appendChild(modal);

        let page: HTMLDivElement = document.createElement('div');
        page.id = 'about-content';
        modal.appendChild(page);

        page.innerHTML = this.about_text;

        let close_btn: HTMLDivElement = document.createElement('div');
        close_btn.id = 'about-close';
        close_btn.innerText = '关闭';
        page.appendChild(close_btn);

        close_btn.addEventListener('click', () => {
            modal.remove();
        })
    }

    private logout(): void {}

    public about_text: string = '';

    public async load() {
        this.button_background = await loadImage(ButtonBackground);
        this.object_select_grid = await loadImage(ObjectSelectGrid);
        this.object_select_background = await loadImage(ObjectSelectBackground);
        this.speaker = await loadImage(Speaker);
        this.play_bar = await loadImage(PlayBar);
    }

    public destroy() {
        window.removeEventListener('resize', this.resize_callback);
        document.removeEventListener('keyup', this.keyup_callback);
    }
}

export type Scene = {
    question: string;
    layout: () => Array<Component>;
    correct_func: (components: Array<Component>) => boolean;
};

export type Level = {
    position: Rect;
    scenes: Array<Scene>;
    objects: Array<HTMLImageElement>;
    correct: Array<number>;
    paper: HTMLImageElement;
    prompt: string;
};

export type Session = {
    map: HTMLImageElement;
    background: HTMLImageElement;
    marker: HTMLImageElement;
    levels: Array<Level>;
};

export type Course = {
    map: HTMLImageElement;
    finished_marker: HTMLImageElement;
    unfinished_marker: HTMLImageElement;
    sessions: Array<{position: Rect; get: string | Session}>;
};

export type Progress = {
    session: number;
    level: number;
    scene: number;
};

type AnyObject = {
    [prop: string]: any;
};
