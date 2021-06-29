export abstract class Utils {
    static readonly secondMs = 1000;
    static readonly minuteMs = Utils.secondMs * 60;
    static readonly hourMs = Utils.minuteMs * 60;
    static readonly dayMs = Utils.hourMs * 24;

    static displayDate(ms: number | Date) {
        return new Date(ms).toString();
    }
}
