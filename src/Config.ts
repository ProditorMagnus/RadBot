export interface Config {
    prefix: string;
    debugChannel: string;
    pollChannel: string;

    adminUser: string;

    logLevel: string;
    lair: LairConfig;
    siege: SiegeConfig[];
    shield: ShieldConfig;
}

export interface SiegeConfig extends PingConfig {
    serverOffset: number;
    cleanConfig: CleanConfig;
}

export interface CleanConfig {
    enabled: boolean;
    delayMs: number
}

export interface LairConfig extends PingConfig {
    campMessage: string;
    campPingRole: string;
}

export interface ShieldConfig extends PingConfig {
    lastMomentWarning: PingConfig;
}

export interface PingConfig {
    enabled: boolean;
    advanceWarningTime: number;
    pingRole: string;
    pingMessage: string;
    outputChannel: string;
}
