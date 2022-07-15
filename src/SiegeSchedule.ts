import { Config, SiegeConfig } from "./Config";
import { Utils } from "./Utils";

export class SiegeSchedule {
    private config: SiegeConfig;

    constructor(config: SiegeConfig) {
        this.config = config;
    }

    public getNextSiegeMoments(startingTime: Date): Date[] {
        let siegeMoments = [
            new Date(startingTime).setUTCHours(this.config.serverOffset, 0, 0, 0),
            new Date(startingTime).setUTCHours(this.config.serverOffset + 5, 0, 0, 0),
            new Date(startingTime).setUTCHours(this.config.serverOffset + 10, 0, 0, 0),
            new Date(startingTime).setUTCHours(this.config.serverOffset + 15, 0, 0, 0),
            new Date(startingTime).setUTCHours(this.config.serverOffset + 20, 0, 0, 0),
        ];
        if (startingTime.getUTCDay() === 0) {
            // no last siege on sunday
            siegeMoments.splice(4, 1);
            console.log("Removed last sunday siege");
        }
        siegeMoments.push(new Date(siegeMoments[0] + Utils.dayMs).getTime());
        siegeMoments.push(new Date(siegeMoments[1] + Utils.dayMs).getTime());
        siegeMoments.push(new Date(siegeMoments[2] + Utils.dayMs).getTime());
        // remove those before starting time
        let i = 0;
        while (i < siegeMoments.length) {
            let moment = siegeMoments[i];
            if (moment <= startingTime.getTime()) {
                console.log("Removing " + Utils.displayDate(siegeMoments.splice(i, 1)[0]) + " since it is not after " + Utils.displayDate(startingTime));
            } else {
                console.log("Accepting " + Utils.displayDate(siegeMoments[i]) + " since it is after " + Utils.displayDate(startingTime))
                i++;
            }
        }
        return siegeMoments.map((d) => new Date(d));
    }

    public static calculateTimetoNextMoment(startingTime: Date, availableMoments: Date[]): number {
        let timeToNextMoment = 7 * Utils.dayMs;
        availableMoments.forEach(moment => {
            if (moment > startingTime) {
                const d = new Date().getTime();
                const timeToMoment = (-d + moment.getTime());
                timeToNextMoment = Math.min(timeToMoment, timeToNextMoment)
                console.log("OK moment " + Utils.displayDate(moment), "timeToMoment", timeToMoment, "timeToNextMoment", timeToNextMoment);
            } else {
                console.log("Unsuitable moment " + Utils.displayDate(moment) + " before " + Utils.displayDate(startingTime));
            }
        });
        if (timeToNextMoment === 7 * Utils.dayMs) {
            console.log("Failed to find next moment!");
        }
        return timeToNextMoment;
    }

}
