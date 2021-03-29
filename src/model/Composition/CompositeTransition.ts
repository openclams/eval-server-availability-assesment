import {CompositeState} from './CompositeState';

export class CompositeTransition {
    from: CompositeState;
    to: CompositeState;
    probability: number;
    isErrorTransition: boolean;

    constructor(from: CompositeState, to: CompositeState, probability: number, isErrorTransition: boolean = false) {
        this.from = from;
        this.to = to;
        this.probability = probability;
        this.isErrorTransition = isErrorTransition;
    }
}
