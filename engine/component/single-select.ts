import {GameEvent} from '../util';
import {Rect} from '../geometry';
import {Component} from './component';
import {Select} from './select';

export class SingleSelect extends Component {
    constructor(private children: Array<Select>) {
        super();

        let index: number = 0;
        for (let select of this.children) {
            let id: number = index;
            select.onclick = () => {
                if (select.selected) {
                    select.selected = false;
                    this.selected = -1;
                } else {
                    select.selected = true;
                    this.selected = id;
                    for (let i = 0; i < this.children.length; i++) {
                        if (i != id) {
                            this.children[i].selected = false;
                        }
                    }
                }
            };
            index++;
        }
    }

    static async from(params: Array<any>): Promise<() => SingleSelect> {
        let func_list: Array<() => Select> = [];

        for (let param of params) {
            param = param.slice();
            param.push('')
            param.push(false);
            func_list.push(await Select.from(param));
        }

        return () =>
            new SingleSelect(
                func_list.map(function (value: () => Select): Select {
                    return value();
                })
            );
    }

    // Unfreeeze the component
    public prevent_freeze: boolean = true;

    public selected: number = -1;

    public draw(canvas: HTMLCanvasElement, rect: Rect, event: GameEvent): void {
        for (let select of this.children) {
            select.draw(canvas, rect, event);
        }
    }
}
