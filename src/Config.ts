export interface Config {
    advanceWarningTime: number;
    serverOffset: number;
    prefix: string;
    debugChannel: string;
    outputChannel: string;
    pollChannel: string;
    pingRole: string;
    lairPingRole: string;
    adminUser: string;
    pingMessage: string;
    lairPingMessage: string;
    logLevel: string;
    lair: {
        enabled: boolean;
        pingMessage: string;
        pingRole: string;
        outputChannel: string;
    }
}
