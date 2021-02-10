import {State} from './State';
import {StateTransition} from './StateTransition';
import {LTSTransition} from './LTSTransition';

export class LabelledTransitionSystem {
    // element at index 0 is initial state
    // element at index length - 2 is end element
    // element at index length - 1 is error element
    // if the lts has no error state than the last element is the end element
    states: State[];
    transitions: StateTransition[];
    componentIDX: number;
    graphID: string;
    initial: boolean;
    final: boolean;
    initialState: State;
    finalState: State;
    errorState: State;

    edgesIn: LTSTransition[];
    edgesOut: LTSTransition[];


    constructor(states: State[], transitions: StateTransition[], componentIDX: number, graphID: string, initialState: State, finalState: State, errorState?: State) {
        this.states = states;
        this.transitions = transitions;
        this.componentIDX = componentIDX;
        this.graphID = graphID;
        this.initial = false;
        this.final = false;
        this.initialState = initialState;
        this.finalState = finalState;

        this.errorState = errorState;
        this.edgesIn = [];
        this.edgesOut = [];

    }
}
