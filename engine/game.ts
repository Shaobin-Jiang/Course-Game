export class Game {
    constructor() {}

    // Registered event listeners
    static event_listeners: Map<string, Function> = new Map();

    // Unhandled events; cleared once dealt with
    static event_list: Array<{event: string, param: any}> = [];

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
    static event_processor: number  = window.setInterval(() => {
        for (let call of this.event_list) {
            if (this.event_listeners.has(call.event)) {
                this.event_listeners.get(call.event)(call.param);
            }
        }
        this.event_list = [];
    }, 0);
}
