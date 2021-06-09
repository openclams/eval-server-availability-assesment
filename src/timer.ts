
/**
 * An directory with containing the timers value.
 * Keys are the timer names.
 * Values are arrays of timer deltas
 */
const times:Record<string,number[]> = {};

/**
 * Rest the timer chache
 * @param id Timer name
 */
export function resetTimer(id:string){

    delete times[id];

    times[id] = [];

}

/**
 * Start the timer. 
 * @param id Timer name
 */
export function startTimer(id:string){

    if(times[id]){

        times[id].push(new Date().getTime());

    }else{

        times[id] = [new Date().getTime()]

    }
}

/**
 * Stop the timer and return the difference compared to the start.
 * @param id The timer name that should be stoped
 * @returns The delata time in [ms] when started the timer last time
 */
export function stopTimer(id:string):number{

    const l = times[id].length;

    times[id][l-1]  =  new Date().getTime() -  times[id][l-1];

    return times[id][l-1];
}
