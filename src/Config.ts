export interface Config {
    prefix: string;
    debugChannel: string;
    pollChannel: string;

    adminUser: string;

    logLevel: string;
    lair: LairConfig;
    siege: SiegeConfig[];
    shield: PingConfig;
}

export interface SiegeConfig extends PingConfig {
    serverOffset: number;
}

export interface LairConfig extends PingConfig {
    campMessage: string;
    campPingRole: string;
}

export interface PingConfig {
    enabled: boolean;
    advanceWarningTime: number;
    pingRole: string;
    pingMessage: string;
    outputChannel: string;
}
