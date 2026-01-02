type Callback = (data: any) => void;

class EventBus {
    private listeners: { [key: string]: Callback[] } = {};

    public on(event: string, callback: Callback) {
        console.log(`EventBus: Listener added for ${event}`);
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    public off(event: string, callback: Callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    public emit(event: string, data?: any) {
        console.log(`EventBus: Emitting ${event}`, data, `Listeners: ${this.listeners[event]?.length || 0}`);
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(cb => cb(data));
    }
}

export const gameEvents = new EventBus();
