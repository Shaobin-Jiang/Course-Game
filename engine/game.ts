import {Select} from './component/select';
import {Button} from './component/button';
import {Img} from './component/img';
import {Reader} from './component/reader';
import {Timer} from './component/timer';
import {Rect} from './geometry';
import {Renderer} from './renderer';
import {loadImage} from './util';

import './game.css';

import ButtonBackground from './images/button-background.png';
import ObjectSelectGrid from './images/object-select-grid.png';
import ObjectSelectBackground from './images/object-select-background.jpg';
import ModalBackground from './images/modal.png';

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

    private resize_callback: EventListener = () => {
        if (document.documentElement.clientWidth / document.documentElement.clientHeight > this.width / this.height) {
            this.renderer.setHeight(document.documentElement.clientHeight);
        } else {
            this.renderer.setHeight((document.documentElement.clientWidth / this.width) * this.height);
        }
    };

    public renderer: Renderer;
    public width: number = 3200;
    public height: number = 1800;

    // Game page: read paper
    public read_paper(background: HTMLImageElement, paper: HTMLImageElement, time: number = 60): void {
        this.renderer.draw(new Img(background, new Rect(0, 0, this.width, this.height)));

        let reader: Reader = new Reader(
            paper,
            new Rect(this.width / 16, this.height / 6, (this.width * 7) / 8, (this.height * 2) / 3)
        );
        this.renderer.draw(reader);

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

            // TODO: go to next scene
            alert('OH YEAH');
        };
        this.renderer.draw(button);

        this.renderer.render();
    }

    public select_object(
        objects: [
            HTMLImageElement,
            HTMLImageElement,
            HTMLImageElement,
            HTMLImageElement,
            HTMLImageElement,
            HTMLImageElement,
            HTMLImageElement,
            HTMLImageElement,
            HTMLImageElement
        ],
        correct_answer: Array<number>
    ): void {
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
        button.onclick = () =>  {
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

            this.alert(correct ? '正确' : '错误', correct ? null : null);
        };
        this.renderer.draw(button);

        this.renderer.render();
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
            modal_text.innerText = msg;
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
            }

            modal_confirm.addEventListener('click', modal_callback);
        }
    }

    public async load() {
        this.button_background = await loadImage(ButtonBackground);
        this.object_select_grid = await loadImage(ObjectSelectGrid);
        this.object_select_background = await loadImage(ObjectSelectBackground);
        this.modal_background = await loadImage(ModalBackground);
    }

    public destroy() {
        window.removeEventListener('resize', this.resize_callback);
    }
}
