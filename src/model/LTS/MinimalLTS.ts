import {State} from './State';

export class MinimalLTS {
    componentIDX: number;
    states: State[];
    initialState: State;
    finalState: State;

    constructor(componentIDX: number, states: State[], initialState: State, finalState: State) {
        this.componentIDX = componentIDX;
        this.states = states;
        this.initialState = initialState;
        this.finalState = finalState;
    }
}
