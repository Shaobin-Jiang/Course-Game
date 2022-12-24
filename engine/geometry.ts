export class Offset {
    constructor(public x: number, public y: number) {}

    public inside(rect: Rect): boolean {
        return this.x >= rect.x && this.x <= rect.x + rect.width && this.y >= rect.y && this.y <= rect.y + rect.height;
    }

    public copy(): Offset {
        return new Offset(this.x, this.y);
    }

    public add(arg: Offset | number): Offset {
        if (typeof arg == 'number') {
            this.x += arg;
            this.y += arg;
        } else {
            this.x += arg.x;
            this.y += arg.y;
        }
        return this;
    }

    public minus(arg: Offset | number): Offset {
        if (typeof arg == 'number') {
            this.x -= arg;
            this.y -= arg;
        } else {
            this.x -= arg.x;
            this.y -= arg.y;
        }
        return this;
    }

    public multiply(arg: Offset | number): Offset {
        if (typeof arg == 'number') {
            this.x *= arg;
            this.y *= arg;
        } else {
            this.x *= arg.x;
            this.y *= arg.y;
        }
        return this;
    }

    public divide(arg: Offset | number): Offset {
        if (typeof arg == 'number') {
            this.x /= arg;
            this.y /= arg;
        } else {
            this.x /= arg.x;
            this.y /= arg.y;
        }
        return this;
    }
}

export class Rect {
    constructor(public x: number, public y: number, public width: number, public height: number) {}

    public copy(): Rect {
        return new Rect(this.x, this.y, this.width, this.height);
    }

    public spread(): [number, number, number, number] {
        return [this.x, this.y, this.width, this.height];
    }
}
