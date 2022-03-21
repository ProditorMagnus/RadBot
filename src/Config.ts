export interface Config {
    advanceWarningTime: number;
    serverOffset: number;
    prefix: string;
    debugChannel: string;
    outputChannel: string;
    pollChannel: string;
    pingRole: string;
    adminUser: string;
    pingMessage: string;
    logLevel: string;
    lair: {
        enabled: boolean;
        pingMessage: string;
        pingRole: string;
        campMessage: string;
        campPingRole: string;
        outputChannel: string;
        advanceWarningTime: number;
    }
}
