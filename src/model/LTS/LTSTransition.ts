import {State} from './State';
import {LabelledTransitionSystem} from './LabelledTransitionSystem';

export class LTSTransition {
    componentIDX: number;
    probability: number;
    sourceState: State;
    destinationState: State;
    sourceLTS: LabelledTransitionSystem;
    destinationLTS: LabelledTransitionSystem;


    constructor(componentIDX: number, probability: number, sourceState: State, destinationState: State, sourceLTS: LabelledTransitionSystem,
                destinationLTS: LabelledTransitionSystem) {
        this.componentIDX = componentIDX;
        this.probability = probability;
        this.sourceState = sourceState;
        this.destinationState = destinationState;
        this.sourceLTS = sourceLTS;
        this.destinationLTS = destinationLTS;
    }
}
