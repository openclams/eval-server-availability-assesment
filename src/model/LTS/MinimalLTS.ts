import {State} from './State';
import {StateTransition} from './StateTransition';

export class MinimalLTS {
    componentIDX: Number;
    states: State[];
    transitions: StateTransition[];

    constructor(componentIDX: Number, states: State[], transitions: StateTransition[]) {
        this.componentIDX = componentIDX;
        this.states = states;
        this.transitions = transitions;
    }
}
