export interface Config {
    prefix: string;
    debugChannel: string;
    pollChannel: string;

    adminUser: string;

    lair: LairConfig;
    siege: SiegeConfig[];
    shield: ShieldConfig;
    db: DatabaseConfig;
}

export interface SiegeConfig extends PingConfig {
    serverOffset: number;
}

export interface CleanConfig {
    enabled: boolean;
    delayMs: number
}

export interface LairConfig {
    fight: PingConfig;
    camp: PingConfig;
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
    cleanConfig: CleanConfig;
}

export interface DatabaseConfig {
    enabled: boolean;
    guild: string;
    channel: string;
}
