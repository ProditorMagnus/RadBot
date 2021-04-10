export abstract class Utils {
    static readonly minuteMs = 1000 * 60;
    static readonly hourMs = Utils.minuteMs * 60;
    static readonly dayMs = Utils.hourMs * 24;

    static displayDate(ms: number | Date) {
        return new Date(ms).toString();
    }
}
