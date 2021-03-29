import {CompositeTransition} from './CompositeTransition';
import {State} from '../LTS/State';

export class CompositeState {
    states: State[];
    transitionsOut: CompositeTransition[];

    constructor(states: State[]) {
        this.states = states;
        this.transitionsOut = [];
    }
}
